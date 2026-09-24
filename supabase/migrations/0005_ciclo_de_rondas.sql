-- Ciclo completo de rondas:
--   rol por ronda (asignaciones_rol), plano procedural repartido por rol
--   (entregas_privadas), eventos en rondas 2 y 3, validación por el
--   Constructor, voto de aporte y ranking final.
--
-- Toda la lógica que decide o reparte información corre aquí, en funciones
-- SECURITY DEFINER: ningún dispositivo recibe el plano completo ni puede
-- escribirse su propio resultado.

-- ── Esquema ─────────────────────────────────────────────────────────────

-- El rol ya no es fijo por partida: cambia cada ronda.
drop function if exists unirse_partida(text, text);
drop function if exists iniciar_partida(uuid);
alter table jugadores drop column if exists rol;

alter table partidas
  add column if not exists ronda_actual integer not null default 0;

alter table rondas
  add column if not exists torre_correcta boolean,
  add column if not exists torre_estable boolean,
  add column if not exists evento_cumplido boolean,
  add column if not exists dentro_tiempo boolean,
  add column if not exists superada boolean,
  add column if not exists validada_en timestamptz;

create table if not exists asignaciones_rol (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references rondas(id) on delete cascade,
  jugador_id uuid not null references jugadores(id) on delete cascade,
  rol text not null check (
    rol in ('arquitecto', 'explorador_estructura', 'explorador_materiales', 'constructor')
  ),
  unique (ronda_id, jugador_id),
  unique (ronda_id, rol)
);

create table if not exists votos_aporte (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references rondas(id) on delete cascade,
  jugador_id uuid not null references jugadores(id) on delete cascade, -- quien vota
  votado_id uuid not null references jugadores(id) on delete cascade,  -- por quién
  creado_en timestamptz not null default now(),
  unique (ronda_id, jugador_id),
  check (jugador_id <> votado_id)
);

-- ── RLS ─────────────────────────────────────────────────────────────────

alter table partidas enable row level security;
alter table rondas enable row level security;
alter table asignaciones_rol enable row level security;
alter table votos_aporte enable row level security;

-- El código de sala es el secreto compartido; leer partidas no expone nada.
drop policy if exists "partidas_select" on partidas;
create policy "partidas_select" on partidas for select using (true);

drop policy if exists "partidas_insert_self" on partidas;
create policy "partidas_insert_self" on partidas for insert
  with check (creada_por = auth.uid());

-- Sin políticas de UPDATE/INSERT en rondas ni asignaciones: solo las
-- funciones de abajo las escriben.
drop policy if exists "rondas_select_same_partida" on rondas;
create policy "rondas_select_same_partida" on rondas for select
  using (partida_id in (select mis_partida_ids()));

drop policy if exists "asignaciones_select_same_partida" on asignaciones_rol;
create policy "asignaciones_select_same_partida" on asignaciones_rol for select
  using (
    ronda_id in (select r.id from rondas r where r.partida_id in (select mis_partida_ids()))
  );

-- El voto es privado: cada quien ve solo el suyo.
drop policy if exists "votos_select_own" on votos_aporte;
create policy "votos_select_own" on votos_aporte for select
  using (jugador_id in (select mis_jugador_ids()));

-- ── Helpers internos ───────────────────────────────────────────────────

create or replace function _es_miembro(p_partida_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from jugadores where partida_id = p_partida_id and auth_user_id = auth.uid()
  );
$$;

-- Crea la ronda N: asigna roles, genera el plano, lo reparte por rol y,
-- desde la ronda 2, entrega un evento privado a un jugador al azar.
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

  -- Roles: ronda 1 al azar; después, cada jugador avanza al siguiente rol del
  -- ciclo, así nadie repite rol en las 3 rondas.
  if p_numero = 1 then
    insert into asignaciones_rol (ronda_id, jugador_id, rol)
    select v_ronda_id, b.id, v_roles[b.n]
    from (
      select id, row_number() over (order by random()) as n
      from jugadores
      where partida_id = p_partida_id
    ) b;
  else
    insert into asignaciones_rol (ronda_id, jugador_id, rol)
    select v_ronda_id, a.jugador_id, v_roles[(array_position(v_roles, a.rol) % 4) + 1]
    from asignaciones_rol a
    join rondas r on r.id = a.ronda_id
    where r.partida_id = p_partida_id and r.numero = p_numero - 1;
  end if;

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

  select jsonb_build_object(
    'vista_superior', (
      select jsonb_agg(g = any(v_celdas) order by g) from generate_series(0, 8) as g
    ),
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
    ), '[]'::jsonb)
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

-- Los helpers internos no se exponen por la API.
revoke execute on function _generar_ronda(uuid, integer) from public, anon, authenticated;
revoke execute on function _es_miembro(uuid) from public, anon, authenticated;

-- ── API (RPC) ──────────────────────────────────────────────────────────

create or replace function unirse_partida(p_codigo text, p_nombre text)
returns table (
  jugador_id uuid,
  partida_id uuid,
  codigo_sala text,
  nombre text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_partida partidas%rowtype;
  v_jugador jugadores%rowtype;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  select * into v_partida
  from partidas p
  where p.codigo_sala = upper(trim(p_codigo)) and p.terminada_en is null
  for update;

  if not found then
    raise exception 'Código de sala no encontrado';
  end if;

  select * into v_jugador
  from jugadores j
  where j.partida_id = v_partida.id and j.auth_user_id = v_uid;

  if not found then
    if v_partida.iniciada_en is not null then
      raise exception 'La partida ya comenzó';
    end if;

    if (select count(*) from jugadores j where j.partida_id = v_partida.id) >= 4 then
      raise exception 'La sala ya está completa (4/4 jugadores)';
    end if;

    insert into jugadores (partida_id, auth_user_id, nombre)
    values (v_partida.id, v_uid, p_nombre)
    returning * into v_jugador;
  end if;

  return query
  select v_jugador.id, v_partida.id, v_partida.codigo_sala, v_jugador.nombre;
end;
$$;

-- Solo el creador, con 4 jugadores. Crea la ronda 1.
create or replace function iniciar_partida(p_partida_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partida partidas%rowtype;
begin
  select * into v_partida from partidas where id = p_partida_id for update;

  if not found then
    raise exception 'Partida no encontrada';
  end if;
  if v_partida.creada_por is distinct from auth.uid() then
    raise exception 'Solo quien creó la partida puede iniciarla';
  end if;
  if v_partida.iniciada_en is not null then
    return; -- idempotente
  end if;
  if (select count(*) from jugadores where partida_id = p_partida_id) <> 4 then
    raise exception 'Se necesitan 4 jugadores para iniciar';
  end if;

  perform _generar_ronda(p_partida_id, 1);
  update partidas set iniciada_en = now() where id = p_partida_id;
end;
$$;

-- Cualquier jugador puede avanzar tras votar; idempotente (el primero crea
-- la ronda siguiente, los demás no hacen nada).
create or replace function avanzar_ronda(p_partida_id uuid, p_desde integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partida partidas%rowtype;
begin
  if not _es_miembro(p_partida_id) then
    raise exception 'No perteneces a esta partida';
  end if;

  select * into v_partida from partidas where id = p_partida_id for update;

  if v_partida.ronda_actual > p_desde then
    return;
  end if;
  if p_desde >= 3 then
    raise exception 'La partida ya terminó';
  end if;
  if not exists (
    select 1 from rondas
    where partida_id = p_partida_id and numero = p_desde and validada_en is not null
  ) then
    raise exception 'La ronda aún no ha sido validada';
  end if;

  perform _generar_ronda(p_partida_id, p_desde + 1);
end;
$$;

-- Solo el Constructor de esa ronda. Se supera con al menos 2 de 4 condiciones.
create or replace function validar_ronda(
  p_ronda_id uuid,
  p_torre_correcta boolean,
  p_torre_estable boolean,
  p_evento_cumplido boolean,
  p_dentro_tiempo boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ronda rondas%rowtype;
  v_superada boolean;
begin
  select * into v_ronda from rondas where id = p_ronda_id for update;

  if not found then
    raise exception 'Ronda no encontrada';
  end if;
  if not exists (
    select 1
    from asignaciones_rol a
    join jugadores j on j.id = a.jugador_id
    where a.ronda_id = p_ronda_id and a.rol = 'constructor' and j.auth_user_id = auth.uid()
  ) then
    raise exception 'Solo el Constructor puede validar la torre';
  end if;
  if v_ronda.validada_en is not null then
    return; -- idempotente
  end if;

  v_superada := (
    p_torre_correcta::integer + p_torre_estable::integer
    + p_evento_cumplido::integer + p_dentro_tiempo::integer
  ) >= 2;

  update rondas set
    torre_correcta = p_torre_correcta,
    torre_estable = p_torre_estable,
    resultado_estable = p_torre_estable,
    evento_cumplido = p_evento_cumplido,
    dentro_tiempo = p_dentro_tiempo,
    superada = v_superada,
    puntos_ronda = case when v_superada then 1 else 0 end,
    validada_en = now(),
    fin = now()
  where id = p_ronda_id;

  if v_ronda.numero >= 3 then
    update partidas set terminada_en = now() where id = v_ronda.partida_id;
  end if;
end;
$$;

create or replace function votar_aporte(p_ronda_id uuid, p_votado_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ronda rondas%rowtype;
  v_yo uuid;
begin
  select * into v_ronda from rondas where id = p_ronda_id;
  if not found then
    raise exception 'Ronda no encontrada';
  end if;
  if v_ronda.validada_en is null then
    raise exception 'La ronda aún no ha sido validada';
  end if;

  select id into v_yo
  from jugadores
  where partida_id = v_ronda.partida_id and auth_user_id = auth.uid();

  if v_yo is null then
    raise exception 'No perteneces a esta partida';
  end if;
  if v_yo = p_votado_id then
    raise exception 'No puedes votar por ti mismo';
  end if;
  if not exists (
    select 1 from jugadores where id = p_votado_id and partida_id = v_ronda.partida_id
  ) then
    raise exception 'Jugador no válido';
  end if;

  insert into votos_aporte (ronda_id, jugador_id, votado_id)
  values (p_ronda_id, v_yo, p_votado_id)
  on conflict (ronda_id, jugador_id) do nothing;
end;
$$;

-- Puntos de Aporte por jugador (1 por voto recibido) y cuántos votos van en
-- la última ronda, sin revelar quién votó por quién.
create or replace function ranking_partida(p_partida_id uuid)
returns table (
  jugador_id uuid,
  nombre text,
  puntos integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not _es_miembro(p_partida_id) then
    raise exception 'No perteneces a esta partida';
  end if;

  return query
  select j.id, j.nombre, (
    select count(*)::integer
    from votos_aporte v
    join rondas r on r.id = v.ronda_id
    where v.votado_id = j.id and r.partida_id = p_partida_id
  )
  from jugadores j
  where j.partida_id = p_partida_id
  order by 3 desc, j.unido_en;
end;
$$;

create or replace function votos_emitidos(p_ronda_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_partida_id uuid;
begin
  select partida_id into v_partida_id from rondas where id = p_ronda_id;
  if v_partida_id is null or not _es_miembro(v_partida_id) then
    raise exception 'No perteneces a esta partida';
  end if;
  return (select count(*)::integer from votos_aporte where ronda_id = p_ronda_id);
end;
$$;

grant execute on function unirse_partida(text, text) to anon, authenticated;
grant execute on function iniciar_partida(uuid) to anon, authenticated;
grant execute on function avanzar_ronda(uuid, integer) to anon, authenticated;
grant execute on function validar_ronda(uuid, boolean, boolean, boolean, boolean) to anon, authenticated;
grant execute on function votar_aporte(uuid, uuid) to anon, authenticated;
grant execute on function ranking_partida(uuid) to anon, authenticated;
grant execute on function votos_emitidos(uuid) to anon, authenticated;

-- ── Realtime ───────────────────────────────────────────────────────────
-- Los jugadores en espera escuchan cuando el Constructor valida la ronda.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rondas'
     ) then
    alter publication supabase_realtime add table rondas;
  end if;
end;
$$;
