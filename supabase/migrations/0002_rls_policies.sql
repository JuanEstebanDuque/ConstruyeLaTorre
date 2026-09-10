alter table jugadores enable row level security;
alter table entregas_privadas enable row level security;
alter table respuestas_validacion enable row level security;

-- Helper functions run as SECURITY DEFINER (owner privileges bypass RLS for
-- this internal lookup only). Without this, any policy on `jugadores` that
-- queries `jugadores` in its own USING clause causes Postgres to report
-- "infinite recursion detected in policy for relation jugadores".
create or replace function mis_partida_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select partida_id from jugadores where auth_user_id = auth.uid();
$$;

create or replace function mis_jugador_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from jugadores where auth_user_id = auth.uid();
$$;

-- A player can see their own row, and every player in the same partida
-- (needed to render "who has joined" / role assignment screens).
create policy "jugadores_select_same_partida"
  on jugadores for select
  using (
    auth_user_id = auth.uid()
    or partida_id in (select mis_partida_ids())
  );

create policy "jugadores_insert_self"
  on jugadores for insert
  with check (auth_user_id = auth.uid());

-- Private deliveries: a player may ONLY read rows addressed to them.
-- This is the mechanism the spec (§3) requires instead of client-side filtering.
create policy "entregas_privadas_select_own"
  on entregas_privadas for select
  using (
    jugador_id in (select mis_jugador_ids())
  );

-- Validation answers are visible to everyone in the same partida (not private —
-- only entregas_privadas is private per spec §3), but a player may only insert
-- their own answer.
create policy "respuestas_validacion_select_same_partida"
  on respuestas_validacion for select
  using (
    ronda_id in (
      select r.id from rondas r where r.partida_id in (select mis_partida_ids())
    )
  );

create policy "respuestas_validacion_insert_own"
  on respuestas_validacion for insert
  with check (
    jugador_id in (select mis_jugador_ids())
  );
