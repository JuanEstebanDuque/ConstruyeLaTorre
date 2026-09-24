-- 1) Unirse a partida desde el servidor.
-- Con RLS, quien se está uniendo aún no pertenece a la partida y no puede ver
-- a los demás jugadores, así que el cliente no sabe qué roles están ocupados.
-- Esta función (SECURITY DEFINER) busca la sala, asigna el primer rol libre
-- en orden e inserta al jugador de forma atómica.
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
  v_rol text;
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
    select r.rol into v_rol
    from unnest(array[
      'arquitecto', 'explorador_estructura', 'explorador_materiales', 'constructor'
    ]) with ordinality as r(rol, orden)
    where r.rol not in (
      select j.rol from jugadores j where j.partida_id = v_partida.id
    )
    order by r.orden
    limit 1;

    if v_rol is null then
      raise exception 'La sala ya está completa (4/4 jugadores)';
    end if;

    insert into jugadores (partida_id, auth_user_id, nombre, rol)
    values (v_partida.id, v_uid, p_nombre, v_rol)
    returning * into v_jugador;
  end if;

  return query
  select v_jugador.id, v_partida.id, v_partida.codigo_sala, v_jugador.rol, v_jugador.nombre;
end;
$$;

grant execute on function unirse_partida(text, text) to anon, authenticated;

-- 2) Realtime: el lobby escucha INSERT en jugadores vía postgres_changes,
-- lo cual requiere que la tabla esté en la publicación supabase_realtime.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jugadores'
     ) then
    alter publication supabase_realtime add table jugadores;
  end if;
end;
$$;
