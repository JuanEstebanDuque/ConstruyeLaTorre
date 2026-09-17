-- Migración 0004: rotación de roles en ciclo FIJO (no aleatorio cada ronda).
-- Corrección tras revisar el documento oficial del juego
-- (C:\TRABAJOS\UNIVERSIDAD\SOCIO\Documento base.md):
-- "Al finalizar cada ronda, los roles rotan siguiendo un orden establecido
-- por la aplicación." Solo la ronda 1 se asigna al azar; de ahí en
-- adelante cada jugador avanza al siguiente rol en un ciclo fijo:
-- arquitecto -> explorador_estructura -> explorador_materiales ->
-- constructor -> arquitecto.

create or replace function asignar_roles_ronda(p_partida_id uuid, p_ronda_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero integer;
  v_ronda_anterior_id uuid;
  v_roles text[] := array['arquitecto', 'explorador_estructura', 'explorador_materiales', 'constructor'];
  v_siguiente_rol jsonb := '{
    "arquitecto": "explorador_estructura",
    "explorador_estructura": "explorador_materiales",
    "explorador_materiales": "constructor",
    "constructor": "arquitecto"
  }'::jsonb;
  v_jugadores uuid[];
  v_barajados text[];
  v_jugador uuid;
  v_rol_anterior text;
  v_i int;
begin
  select numero into v_numero from rondas where id = p_ronda_id;
  select array_agg(id order by id) into v_jugadores from jugadores where partida_id = p_partida_id;
  if v_jugadores is null or array_length(v_jugadores, 1) <> 4 then
    raise exception 'la partida debe tener exactamente 4 jugadores para asignar roles';
  end if;

  if v_numero = 1 then
    v_barajados := array(select unnest(v_roles) order by random());
    for v_i in 1 .. 4 loop
      insert into asignaciones_rol (ronda_id, jugador_id, rol)
      values (p_ronda_id, v_jugadores[v_i], v_barajados[v_i]);
    end loop;
  else
    select id into v_ronda_anterior_id from rondas
      where partida_id = p_partida_id and numero = v_numero - 1;

    for v_i in 1 .. 4 loop
      v_jugador := v_jugadores[v_i];
      select rol into v_rol_anterior from asignaciones_rol
        where ronda_id = v_ronda_anterior_id and jugador_id = v_jugador;

      insert into asignaciones_rol (ronda_id, jugador_id, rol)
      values (p_ronda_id, v_jugador, v_siguiente_rol ->> v_rol_anterior);
    end loop;
  end if;
end;
$$;
