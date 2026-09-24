-- Roles aleatorios + inicio de partida persistido.
-- Antes: el creador era siempre Arquitecto y el inicio viajaba solo por un
-- broadcast efímero (si un cliente no estaba suscrito en ese instante, se
-- quedaba en el lobby). Ahora:
--   * nadie tiene rol al unirse (rol = null)
--   * el creador llama iniciar_partida(), que baraja los 4 roles en el servidor
--     y marca partidas.iniciada_en; los clientes escuchan ese cambio.

alter table partidas
  add column if not exists creada_por uuid default auth.uid(),
  add column if not exists iniciada_en timestamptz;

alter table jugadores
  add column if not exists unido_en timestamptz not null default now();

alter table jugadores alter column rol drop not null;

-- unirse_partida ya no asigna rol: solo verifica cupo (máx. 4) y que la
-- partida no haya empezado.
create or replace function unirse_partida(p_codigo text, p_nombre text)
returns table (
  jugador_id uuid,
  partida_id uuid,
  codigo_sala text,
  rol text,
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

  -- Si ya estaba en la partida, devolver su registro
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

    insert into jugadores (partida_id, auth_user_id, nombre, rol)
    values (v_partida.id, v_uid, p_nombre, null)
    returning * into v_jugador;
  end if;

  return query
  select v_jugador.id, v_partida.id, v_partida.codigo_sala, v_jugador.rol, v_jugador.nombre;
end;
$$;

-- Solo el creador puede iniciar, con exactamente 4 jugadores.
-- Asigna una permutación aleatoria de los 4 roles.
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

  with barajados as (
    select id, row_number() over (order by random()) as n
    from jugadores
    where partida_id = p_partida_id
  ),
  roles as (
    select rol, n
    from unnest(array[
      'arquitecto', 'explorador_estructura', 'explorador_materiales', 'constructor'
    ]) with ordinality as r(rol, n)
  )
  update jugadores j
  set rol = roles.rol
  from barajados
  join roles on roles.n = barajados.n
  where j.id = barajados.id;

  update partidas set iniciada_en = now() where id = p_partida_id;
end;
$$;

grant execute on function iniciar_partida(uuid) to anon, authenticated;

-- Los clientes escuchan el UPDATE de iniciada_en.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'partidas'
     ) then
    alter publication supabase_realtime add table partidas;
  end if;
end;
$$;
