-- Migración 0003: rol por ronda (no por partida), catálogo de piezas,
-- generación procedural de planos, votación de aporte, y funciones
-- server-side que mantienen la integridad del juego.
-- Ver docs/superpowers/specs/2026-09-17-conexion-frontend-backend-design.md

-- ─── 1. jugadores: el rol ya no es fijo por partida ────────────────────────
alter table jugadores drop column rol;
alter table jugadores add column listo boolean not null default false;

-- ─── 2. asignaciones_rol: rol de cada jugador POR RONDA ────────────────────
create table asignaciones_rol (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references rondas(id) on delete cascade,
  jugador_id uuid not null references jugadores(id) on delete cascade,
  rol text not null check (
    rol in ('arquitecto', 'explorador_estructura', 'explorador_materiales', 'constructor')
  ),
  unique (ronda_id, jugador_id),
  unique (ronda_id, rol)
);

-- ─── 3. votos_aporte: voto privado de "aporte clave" por ronda ─────────────
create table votos_aporte (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references rondas(id) on delete cascade,
  jugador_id uuid not null references jugadores(id) on delete cascade,
  votado_id uuid not null references jugadores(id) on delete cascade,
  unique (ronda_id, jugador_id),
  check (jugador_id <> votado_id)
);

-- ─── 4. piezas: catálogo editable (placeholder hasta comprar el material) ──
create table piezas (
  codigo text primary key,
  nombre text not null,
  tipo text not null check (tipo in ('base', 'estructural', 'conector', 'decorativa')),
  cantidad_disponible integer not null default 4,
  activa boolean not null default true
);

insert into piezas (codigo, nombre, tipo, cantidad_disponible) values
  ('A12', 'pieza base', 'base', 4),
  ('A13', 'pieza base ancha', 'base', 2),
  ('B04', 'pieza larga', 'estructural', 6),
  ('B05', 'pieza corta', 'estructural', 6),
  ('B06', 'pieza en L', 'estructural', 4),
  ('C07', 'conector', 'conector', 8),
  ('C08', 'conector doble', 'conector', 4),
  ('D02', 'pieza decorativa', 'decorativa', 3);

-- ─── 5. rondas: fase actual (para sincronizar Lobby/Resultado) ────────────
alter table rondas add column fase text not null default 'revelacion' check (
  fase in ('revelacion', 'planeacion', 'construccion', 'validacion', 'resultado', 'votacion')
);

-- ─── 6. RLS: completar partidas/rondas (hoy sin RLS) y las tablas nuevas ──
alter table partidas enable row level security;
alter table rondas enable row level security;
alter table asignaciones_rol enable row level security;
alter table votos_aporte enable row level security;
alter table piezas enable row level security;

-- El código de sala es el secreto compartido para unirse; cualquier
-- usuario autenticado (anónimo) puede ver partidas y crear una nueva.
-- La privacidad real la dan entregas_privadas y votos_aporte.
create policy "partidas_select_authenticated"
  on partidas for select
  using (auth.uid() is not null);

create policy "partidas_insert_authenticated"
  on partidas for insert
  with check (auth.uid() is not null);

create policy "rondas_select_same_partida"
  on rondas for select
  using (partida_id in (select mis_partida_ids()));

create policy "asignaciones_rol_select_same_partida"
  on asignaciones_rol for select
  using (
    ronda_id in (select r.id from rondas r where r.partida_id in (select mis_partida_ids()))
  );

-- Un jugador puede marcarse a sí mismo como listo en el Lobby.
create policy "jugadores_update_self"
  on jugadores for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Votos: cada jugador solo ve/inserta su propio voto (privado hasta el
-- resultado final, que se calcula agregado vía conteo_votos_ronda()).
create policy "votos_aporte_select_own"
  on votos_aporte for select
  using (jugador_id in (select mis_jugador_ids()));

create policy "votos_aporte_insert_own"
  on votos_aporte for insert
  with check (jugador_id in (select mis_jugador_ids()));

-- Catálogo: de solo lectura para cualquier usuario autenticado.
create policy "piezas_select_authenticated"
  on piezas for select
  using (auth.uid() is not null);

-- ─── 7. Generación procedural del plan de una ronda ────────────────────────
-- Reparte fragmento_plano ya filtrado por rol (nunca el plano completo a
-- nadie). Reglas mínimas de viabilidad: nivel base siempre lleva 1 pieza
-- 'base'; niveles intermedios siempre 1 'estructural' (+ opcional
-- 'conector'); nivel superior 'estructural' o 'decorativa'.
create or replace function generar_plan_ronda(p_ronda_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero integer;
  v_niveles integer;
  v_nivel integer;
  v_pieza record;
  v_conteo_piezas jsonb := '{}'::jsonb;
  v_niveles_arquitecto jsonb := '[]'::jsonb;
  v_relaciones_estructura jsonb := '[]'::jsonb;
  v_orientacion text;
  v_jugador_arquitecto uuid;
  v_jugador_estructura uuid;
  v_jugador_materiales uuid;
begin
  select numero into v_numero from rondas where id = p_ronda_id;
  v_niveles := v_numero + 1;

  select jugador_id into v_jugador_arquitecto from asignaciones_rol where ronda_id = p_ronda_id and rol = 'arquitecto';
  select jugador_id into v_jugador_estructura from asignaciones_rol where ronda_id = p_ronda_id and rol = 'explorador_estructura';
  select jugador_id into v_jugador_materiales from asignaciones_rol where ronda_id = p_ronda_id and rol = 'explorador_materiales';

  for v_nivel in 0 .. v_niveles - 1 loop
    -- nivel base
    if v_nivel = 0 then
      select codigo, nombre into v_pieza from piezas
        where tipo = 'base' and activa order by random() limit 1;
    -- nivel superior
    elsif v_nivel = v_niveles - 1 then
      select codigo, nombre into v_pieza from piezas
        where tipo in ('estructural', 'decorativa') and activa order by random() limit 1;
    -- niveles intermedios
    else
      select codigo, nombre into v_pieza from piezas
        where tipo = 'estructural' and activa order by random() limit 1;
    end if;

    v_conteo_piezas := jsonb_set(
      v_conteo_piezas, array[v_pieza.codigo],
      to_jsonb(coalesce((v_conteo_piezas ->> v_pieza.codigo)::int, 0) + 1)
    );
    v_orientacion := case when random() < 0.5 then 'horizontal' else 'vertical' end;
    v_niveles_arquitecto := v_niveles_arquitecto || jsonb_build_object('nivel', v_nivel + 1, 'pieza', v_pieza.codigo);
    v_relaciones_estructura := v_relaciones_estructura || jsonb_build_object('pieza', v_pieza.codigo, 'orientacion', v_orientacion);

    -- nivel intermedio: 30% + 10% por dificultad de llevar un conector extra
    if v_nivel > 0 and v_nivel < v_niveles - 1 and random() < (0.3 + v_numero * 0.1) then
      select codigo, nombre into v_pieza from piezas
        where tipo = 'conector' and activa order by random() limit 1;
      v_conteo_piezas := jsonb_set(
        v_conteo_piezas, array[v_pieza.codigo],
        to_jsonb(coalesce((v_conteo_piezas ->> v_pieza.codigo)::int, 0) + 1)
      );
      v_relaciones_estructura := v_relaciones_estructura || jsonb_build_object('pieza', v_pieza.codigo, 'orientacion', 'conector');
    end if;
  end loop;

  if v_jugador_arquitecto is not null then
    insert into entregas_privadas (jugador_id, ronda_id, tipo, contenido)
    values (v_jugador_arquitecto, p_ronda_id, 'fragmento_plano',
      jsonb_build_object('vista', 'frontal', 'niveles', v_niveles_arquitecto));
  end if;

  if v_jugador_estructura is not null then
    insert into entregas_privadas (jugador_id, ronda_id, tipo, contenido)
    values (v_jugador_estructura, p_ronda_id, 'fragmento_plano',
      jsonb_build_object('vista', 'superior', 'relaciones', v_relaciones_estructura));
  end if;

  if v_jugador_materiales is not null then
    insert into entregas_privadas (jugador_id, ronda_id, tipo, contenido)
    values (v_jugador_materiales, p_ronda_id, 'fragmento_plano',
      jsonb_build_object('piezas', v_conteo_piezas));
  end if;
  -- Constructor no recibe fragmento_plano: su pantalla usa texto fijo.
end;
$$;

-- ─── 8. Evento aleatorio (rondas 2 y 3) ─────────────────────────────────────
create or replace function generar_evento_ronda(p_ronda_id uuid, p_partida_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo text;
  v_jugador_id uuid;
  v_tipos text[] := array['pieza_bloqueada', 'cambio_altura', 'silencio', 'plano_perdido', 'reemplazo_pieza'];
begin
  v_tipo := v_tipos[1 + floor(random() * array_length(v_tipos, 1))::int];
  select jugador_id into v_jugador_id from jugadores
    where partida_id = p_partida_id order by random() limit 1;

  if v_jugador_id is not null then
    insert into entregas_privadas (jugador_id, ronda_id, tipo, contenido)
    values (v_jugador_id, p_ronda_id, 'evento',
      jsonb_build_object('tipo', v_tipo, 'duracion_seg', 30));
  end if;
end;
$$;

-- ─── 9. Rotación de roles sin repetir ──────────────────────────────────────
create or replace function asignar_roles_ronda(p_partida_id uuid, p_ronda_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roles text[] := array['arquitecto', 'explorador_estructura', 'explorador_materiales', 'constructor'];
  v_barajados text[];
  v_jugadores uuid[];
  v_jugador uuid;
  v_intento int;
  v_valido boolean;
  v_i int;
  v_roles_previos text[];
begin
  select array_agg(id order by id) into v_jugadores from jugadores where partida_id = p_partida_id;
  if v_jugadores is null or array_length(v_jugadores, 1) <> 4 then
    raise exception 'la partida debe tener exactamente 4 jugadores para asignar roles';
  end if;

  for v_intento in 1 .. 200 loop
    v_barajados := array(select unnest(v_roles) order by random());
    v_valido := true;
    for v_i in 1 .. 4 loop
      v_jugador := v_jugadores[v_i];
      select array_agg(rol) into v_roles_previos
        from asignaciones_rol ar join rondas r on r.id = ar.ronda_id
        where r.partida_id = p_partida_id and ar.jugador_id = v_jugador;
      if v_roles_previos is not null and v_barajados[v_i] = any(v_roles_previos) then
        v_valido := false;
        exit;
      end if;
    end loop;
    exit when v_valido;
  end loop;

  if not v_valido then
    raise exception 'no fue posible asignar roles sin repetir tras % intentos', v_intento;
  end if;

  for v_i in 1 .. 4 loop
    insert into asignaciones_rol (ronda_id, jugador_id, rol)
    values (p_ronda_id, v_jugadores[v_i], v_barajados[v_i]);
  end loop;
end;
$$;

-- ─── 10. Iniciar partida (Lobby → Rol) ──────────────────────────────────────
create or replace function iniciar_partida(p_partida_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ronda_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_partida_id::text));

  select id into v_ronda_id from rondas where partida_id = p_partida_id and numero = 1;
  if v_ronda_id is not null then
    return v_ronda_id; -- ya iniciada (llamada idempotente)
  end if;

  insert into rondas (partida_id, numero, dificultad)
  values (p_partida_id, 1, 1)
  returning id into v_ronda_id;

  perform asignar_roles_ronda(p_partida_id, v_ronda_id);
  perform generar_plan_ronda(v_ronda_id);

  return v_ronda_id;
end;
$$;

-- ─── 11. Rotar a la siguiente ronda (Rotación) ─────────────────────────────
create or replace function rotar_ronda(p_partida_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_numero integer;
  v_nuevo_numero integer;
  v_ronda_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_partida_id::text));

  select max(numero) into v_max_numero from rondas where partida_id = p_partida_id;
  v_nuevo_numero := coalesce(v_max_numero, 0) + 1;

  select id into v_ronda_id from rondas where partida_id = p_partida_id and numero = v_nuevo_numero;
  if v_ronda_id is not null then
    return v_ronda_id; -- otro dispositivo ya la creó (llamada idempotente)
  end if;

  insert into rondas (partida_id, numero, dificultad)
  values (p_partida_id, v_nuevo_numero, v_nuevo_numero)
  returning id into v_ronda_id;

  perform asignar_roles_ronda(p_partida_id, v_ronda_id);
  perform generar_plan_ronda(v_ronda_id);

  if v_nuevo_numero >= 2 then
    perform generar_evento_ronda(v_ronda_id, p_partida_id);
  end if;

  return v_ronda_id;
end;
$$;

-- ─── 12. Resultado automático de la ronda (mayoría 3/4) ────────────────────
create or replace function calcular_resultado_ronda()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_positivas int;
begin
  select count(*), count(*) filter (where respuesta_bool)
    into v_total, v_positivas
    from respuestas_validacion where ronda_id = new.ronda_id;

  if v_total >= 4 then
    update rondas
      set resultado_estable = (v_positivas >= 3),
          puntos_ronda = case when v_positivas >= 3 then 1 else 0 end,
          fin = now(),
          fase = 'resultado'
      where id = new.ronda_id and resultado_estable is null;
  end if;

  return new;
end;
$$;

create trigger trg_calcular_resultado_ronda
  after insert on respuestas_validacion
  for each row execute function calcular_resultado_ronda();

-- ─── 13. Conteo de votos de aporte sin exponer quién votó a quién ──────────
create or replace function conteo_votos_ronda(p_ronda_id uuid)
returns table (jugador_id uuid, votos bigint)
language sql
security definer
set search_path = public
stable
as $$
  select votado_id, count(*) from votos_aporte
  where ronda_id = p_ronda_id
  group by votado_id;
$$;
