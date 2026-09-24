-- Fases sincronizadas de cada ronda:
--   * Revelación → Planeación: solo el creador de la sala hace pasar a todos.
--   * Planeación: temporizador global (30 s desde planeacion_inicio). Termina
--     antes si 3 de 4 jugadores marcan "listo" o si el creador la salta.
--   * Juego: todos empiezan en juego_inicio; desde ahí cada reloj es individual.
-- Los clientes calculan los tiempos con la hora del servidor (hora_servidor)
-- para que todos los celulares vean el mismo conteo.

alter table rondas
  add column if not exists planeacion_inicio timestamptz,
  add column if not exists juego_inicio timestamptz;

create table if not exists listos_ronda (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references rondas(id) on delete cascade,
  jugador_id uuid not null references jugadores(id) on delete cascade,
  fase text not null check (fase in ('revelacion', 'planeacion')),
  creado_en timestamptz not null default now(),
  unique (ronda_id, jugador_id, fase)
);

alter table listos_ronda enable row level security;

drop policy if exists "listos_select_same_partida" on listos_ronda;
create policy "listos_select_same_partida" on listos_ronda for select
  using (
    ronda_id in (select r.id from rondas r where r.partida_id in (select mis_partida_ids()))
  );

create or replace function hora_servidor()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

-- Acciones de fase. Idempotentes: repetirlas no cambia nada.
--   vi_revelacion       cualquiera: marca que ya vio su información
--   iniciar_planeacion  creador:    todos pasan a planeación
--   listo_planeacion    cualquiera: con 3 listos empieza el juego
--   saltar_planeacion   creador:    empieza el juego ya
--   fin_planeacion      cualquiera: si ya pasaron los 30 s, empieza el juego
create or replace function accion_ronda(p_ronda_id uuid, p_accion text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_planeacion constant interval := interval '30 seconds';
  v_listos_para_jugar constant integer := 3;
  v_ronda rondas%rowtype;
  v_yo uuid;
  v_es_creador boolean;
begin
  select * into v_ronda from rondas where id = p_ronda_id for update;
  if not found then
    raise exception 'Ronda no encontrada';
  end if;

  select j.id into v_yo
  from jugadores j
  where j.partida_id = v_ronda.partida_id and j.auth_user_id = auth.uid();
  if v_yo is null then
    raise exception 'No perteneces a esta partida';
  end if;

  select p.creada_por = auth.uid() into v_es_creador
  from partidas p
  where p.id = v_ronda.partida_id;

  if p_accion = 'vi_revelacion' then
    insert into listos_ronda (ronda_id, jugador_id, fase)
    values (p_ronda_id, v_yo, 'revelacion')
    on conflict do nothing;

  elsif p_accion = 'iniciar_planeacion' then
    if not v_es_creador then
      raise exception 'Solo quien creó la sala puede iniciar la planeación';
    end if;
    update rondas set planeacion_inicio = coalesce(planeacion_inicio, now())
    where id = p_ronda_id;

  elsif p_accion = 'listo_planeacion' then
    if v_ronda.planeacion_inicio is null then
      raise exception 'La planeación aún no ha empezado';
    end if;
    insert into listos_ronda (ronda_id, jugador_id, fase)
    values (p_ronda_id, v_yo, 'planeacion')
    on conflict do nothing;

    if (
      select count(*) from listos_ronda where ronda_id = p_ronda_id and fase = 'planeacion'
    ) >= v_listos_para_jugar then
      update rondas set juego_inicio = coalesce(juego_inicio, now()) where id = p_ronda_id;
    end if;

  elsif p_accion = 'saltar_planeacion' then
    if not v_es_creador then
      raise exception 'Solo quien creó la sala puede saltar la planeación';
    end if;
    if v_ronda.planeacion_inicio is null then
      raise exception 'La planeación aún no ha empezado';
    end if;
    update rondas set juego_inicio = coalesce(juego_inicio, now()) where id = p_ronda_id;

  elsif p_accion = 'fin_planeacion' then
    -- 1 s de tolerancia por diferencias de reloj; el juego empieza justo al
    -- vencer la planeación, no cuando llegó la llamada.
    if v_ronda.planeacion_inicio is not null
       and now() >= v_ronda.planeacion_inicio + v_planeacion - interval '1 second' then
      update rondas
      set juego_inicio = coalesce(juego_inicio, least(now(), planeacion_inicio + v_planeacion))
      where id = p_ronda_id;
    end if;

  else
    raise exception 'Acción no válida: %', p_accion;
  end if;
end;
$$;

grant execute on function hora_servidor() to anon, authenticated;
grant execute on function accion_ronda(uuid, text) to anon, authenticated;
