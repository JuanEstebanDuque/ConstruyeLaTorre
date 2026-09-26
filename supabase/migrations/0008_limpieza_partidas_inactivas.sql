-- Limpieza automática de partidas y usuarios anónimos:
--   * El código de sala solo es único entre partidas activas: al terminar una
--     partida su código queda libre y los resultados se conservan.
--   * Cada 15 min se borran las partidas NO terminadas con más de 1 hora sin
--     actividad (el borrado cae en cascada a jugadores, rondas, votos…).
--     Los clientes lo detectan en el sondeo y vuelven al inicio.
--   * Cada día se borran las partidas terminadas hace más de 7 días y los
--     usuarios anónimos sin partida ni sesión usada en el último día.

-- ── Código de sala único solo entre partidas activas ──────────────────────
alter table partidas drop constraint if exists partidas_codigo_sala_key;
create unique index if not exists partidas_codigo_activo
  on partidas (codigo_sala) where terminada_en is null;

-- ── Funciones de limpieza ─────────────────────────────────────────────────
create or replace function limpiar_partidas_inactivas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_borradas integer;
begin
  -- Última actividad = la marca de tiempo más reciente de la partida y de lo
  -- que cuelga de ella. greatest() ignora los NULL.
  delete from partidas p
  where p.terminada_en is null
    and greatest(
      p.creada_en,
      p.iniciada_en,
      (select max(j.unido_en) from jugadores j where j.partida_id = p.id),
      (select max(greatest(r.inicio, r.fin, r.planeacion_inicio, r.juego_inicio, r.validada_en))
         from rondas r where r.partida_id = p.id),
      (select max(v.creado_en) from votos_aporte v
         join rondas r on r.id = v.ronda_id where r.partida_id = p.id),
      (select max(l.creado_en) from listos_ronda l
         join rondas r on r.id = l.ronda_id where r.partida_id = p.id)
    ) < now() - interval '1 hour';

  get diagnostics v_borradas = row_count;
  return v_borradas;
end;
$$;

create or replace function limpiar_datos_antiguos()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from partidas where terminada_en < now() - interval '7 days';

  -- Solo usuarios anónimos que ya no juegan y cuya sesión no se ha usado en
  -- el último día (una pestaña abierta refresca su token cada hora), para no
  -- invalidar a alguien que está por crear o unirse a una partida.
  delete from auth.users u
  where u.is_anonymous
    and u.created_at < now() - interval '1 day'
    and not exists (select 1 from jugadores j where j.auth_user_id = u.id)
    and not exists (
      select 1 from auth.sessions s
      where s.user_id = u.id and s.updated_at > now() - interval '1 day'
    );
end;
$$;

-- Solo las ejecuta el cron (rol postgres), nunca el frontend.
revoke execute on function limpiar_partidas_inactivas() from public, anon, authenticated;
revoke execute on function limpiar_datos_antiguos() from public, anon, authenticated;

-- ── Programación con pg_cron ──────────────────────────────────────────────
-- cron.schedule con un nombre existente reemplaza el job, así que es seguro
-- volver a correr esta migración.
create extension if not exists pg_cron;

select cron.schedule(
  'limpiar-partidas-inactivas',
  '*/15 * * * *',
  $$ select public.limpiar_partidas_inactivas(); $$
);

select cron.schedule(
  'limpiar-datos-antiguos',
  '30 8 * * *', -- 08:30 UTC = 03:30 Colombia
  $$ select public.limpiar_datos_antiguos(); $$
);
