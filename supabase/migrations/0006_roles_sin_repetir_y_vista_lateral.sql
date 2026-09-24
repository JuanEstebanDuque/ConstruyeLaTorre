-- Ajustes al ciclo de rondas:
--   * roles al azar en CADA ronda, sin repetir el rol que un jugador ya tuvo
--     (antes: azar solo en la ronda 1 y luego ciclo fijo)
--   * el fragmento del Explorador de estructura incluye vista lateral y
--     conexiones entre piezas (pantalla de Revelación)

create or replace function _generar_ronda(p_partida_id uuid, p_numero integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roles text[] := array[
    'arquitecto', 'explorador_estructura', 'explorador_materiales', 'constructor'
  ];
  -- Catálogo placeholder: se reemplaza cuando el material físico esté definido
  v_catalogo text[] := array['A12', 'B04', 'C07', 'D02', 'E05'];
  v_orientables text[] := array['A12', 'B04', 'D02'];
  v_niveles integer := p_numero + 1;
  v_ronda_id uuid;
  v_conteos integer[] := '{}';
  v_piezas text[] := '{}';
  v_celdas integer[];
  v_lateral integer[];
  v_perm record;
  v_i integer;
  v_j integer;
  v_frag_arq jsonb;
  v_frag_est jsonb;
  v_frag_mat jsonb;
  v_objetivo uuid;
  v_objetivo_rol text;
  v_evento_tipo text;
  v_codigo text;
  v_evento jsonb;
begin
  insert into rondas (partida_id, numero, dificultad, inicio)
  values (p_partida_id, p_numero, p_numero, now())
  returning id into v_ronda_id;

  -- Roles: al azar en cada ronda, sin que nadie repita un rol que ya tuvo.
  -- Se elige al azar entre las 24 permutaciones las que respetan esa regla
  -- (con 4 jugadores y 3 rondas siempre existe al menos una).
  select pm.r1, pm.r2, pm.r3, pm.r4
  into v_perm
  from (
    select a.r as r1, b.r as r2, c.r as r3, d.r as r4
    from unnest(v_roles) a(r), unnest(v_roles) b(r), unnest(v_roles) c(r), unnest(v_roles) d(r)
    where a.r not in (b.r, c.r, d.r) and b.r not in (c.r, d.r) and c.r <> d.r
  ) pm
  where not exists (
    select 1
    from (
      select id, row_number() over (order by unido_en, id) as n
      from jugadores
      where partida_id = p_partida_id
    ) js
    join asignaciones_rol ar on ar.jugador_id = js.id
    join rondas ro on ro.id = ar.ronda_id and ro.partida_id = p_partida_id
    where ar.rol = (array[pm.r1, pm.r2, pm.r3, pm.r4])[js.n]
  )
  order by random()
  limit 1;

  if v_perm is null then
    raise exception 'No hay una asignación de roles sin repetir';
  end if;

  insert into asignaciones_rol (ronda_id, jugador_id, rol)
  select v_ronda_id, js.id, (array[v_perm.r1, v_perm.r2, v_perm.r3, v_perm.r4])[js.n]
  from (
    select id, row_number() over (order by unido_en, id) as n
    from jugadores
    where partida_id = p_partida_id
  ) js;

  -- Plano: niveles = ronda + 1, forma de pirámide (máx. 3 piezas por nivel).
  for v_i in 1..v_niveles loop
    v_conteos := v_conteos || least(3, v_niveles - v_i + 1);
    for v_j in 1..least(3, v_niveles - v_i + 1) loop
      v_piezas := v_piezas || v_catalogo[1 + floor(random() * array_length(v_catalogo, 1))::integer];
    end loop;
  end loop;

  -- Arquitecto: vista frontal (piezas por nivel)
  select jsonb_build_object(
    'niveles', jsonb_agg(jsonb_build_object('nivel', t.n, 'piezas', t.c) order by t.n)
  )
  into v_frag_arq
  from unnest(v_conteos) with ordinality as t(c, n);

  -- Explorador de estructura: huella de la base en la placa 3x3 + orientación
  select array_agg(celda)
  into v_celdas
  from (
    select celda from generate_series(0, 8) as celda order by random() limit v_conteos[1]
  ) s;

  -- Vista lateral: altura de cada fila de la placa (vista desde un costado).
  -- Las filas con piezas en la base tienen altura >= 1 y la más alta llega al
  -- último nivel.
  select array_agg(
    case when exists (select 1 from unnest(v_celdas) c where c / 3 = fila)
      then 1 + floor(random() * v_niveles)::integer
      else 0
    end
    order by fila
  )
  into v_lateral
  from generate_series(0, 2) as fila;

  v_lateral[(select min(c / 3) from unnest(v_celdas) c) + 1] := v_niveles;

  select jsonb_build_object(
    'vista_superior', (
      select jsonb_agg(g = any(v_celdas) order by g) from generate_series(0, 8) as g
    ),
    'vista_lateral', to_jsonb(v_lateral),
    'orientaciones', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'codigo', s.codigo,
          'orientacion', case when random() < 0.5 then 'horizontal' else 'vertical' end
        )
        order by s.codigo
      )
      from (
        select distinct codigo from unnest(v_piezas) as codigo where codigo = any(v_orientables)
      ) s
    ), '[]'::jsonb),
    'conexiones', (array[
      'Se conectan por la base y los laterales.',
      'Cada nivel se apoya sobre el centro del nivel inferior.',
      'Las piezas de un mismo nivel se tocan de lado; entre niveles, solo por la base.',
      'Las piezas largas hacen de puente entre las de abajo.'
    ])[1 + floor(random() * 4)::integer]
  )
  into v_frag_est;

  -- Explorador de materiales: qué piezas y cuántas
  select jsonb_build_object(
    'piezas', jsonb_agg(
      jsonb_build_object(
        'codigo', s.codigo,
        'cantidad', s.cantidad,
        'descripcion', case s.codigo
          when 'A12' then 'Bloque largo'
          when 'B04' then 'Viga delgada'
          when 'C07' then 'Cubo'
          when 'D02' then 'Placa plana'
          else 'Arco'
        end
      )
      order by s.codigo
    )
  )
  into v_frag_mat
  from (
    select codigo, count(*)::integer as cantidad from unnest(v_piezas) as codigo group by codigo
  ) s;

  insert into entregas_privadas (jugador_id, ronda_id, tipo, contenido)
  select a.jugador_id, v_ronda_id, 'fragmento_plano',
    case a.rol
      when 'arquitecto' then v_frag_arq
      when 'explorador_estructura' then v_frag_est
      when 'explorador_materiales' then v_frag_mat
      else '{}'::jsonb -- el Constructor no tiene plano
    end
  from asignaciones_rol a
  where a.ronda_id = v_ronda_id;

  -- Evento (rondas 2 y 3): solo lo ve un jugador, que debe comunicarlo.
  if p_numero >= 2 then
    select a.jugador_id, a.rol
    into v_objetivo, v_objetivo_rol
    from asignaciones_rol a
    where a.ronda_id = v_ronda_id
    order by random()
    limit 1;

    select t into v_evento_tipo
    from unnest(array['pieza_bloqueada', 'cambio_altura', 'silencio', 'plano_perdido', 'reemplazo']) as t
    where not (t = 'plano_perdido' and v_objetivo_rol = 'constructor')
    order by random()
    limit 1;

    v_codigo := v_piezas[1 + floor(random() * array_length(v_piezas, 1))::integer];

    v_evento := case v_evento_tipo
      when 'pieza_bloqueada' then jsonb_build_object(
        'titulo', 'Pieza bloqueada',
        'descripcion', format('La pieza %s no puede utilizarse en esta ronda. Avísale al equipo.', v_codigo))
      when 'cambio_altura' then jsonb_build_object(
        'titulo', 'Cambio de altura',
        'descripcion', format('El nivel %s debe llevar una pieza más de lo que indica el plano.',
          1 + floor(random() * v_niveles)::integer))
      when 'silencio' then jsonb_build_object(
        'titulo', 'Silencio',
        'descripcion', 'Durante 30 segundos no puedes hablar. Comunícate solo con gestos.',
        'duracion', 30)
      when 'plano_perdido' then jsonb_build_object(
        'titulo', 'Plano perdido',
        'descripcion', 'Tu información desaparece durante 30 segundos. Confía en lo que recuerde el equipo.',
        'duracion', 30)
      else jsonb_build_object(
        'titulo', 'Reemplazo',
        'descripcion', format('Donde el plano pida la pieza %s, se debe usar una pieza %s.',
          v_codigo,
          (select c from unnest(v_catalogo) as c where c <> v_codigo order by random() limit 1)))
    end || jsonb_build_object('tipo', v_evento_tipo);

    insert into entregas_privadas (jugador_id, ronda_id, tipo, contenido)
    values (v_objetivo, v_ronda_id, 'evento', v_evento);

    update rondas set evento_tipo = v_evento_tipo where id = v_ronda_id;
  end if;

  update partidas set ronda_actual = p_numero where id = p_partida_id;

  return v_ronda_id;
end;
$$;

revoke execute on function _generar_ronda(uuid, integer) from public, anon, authenticated;
