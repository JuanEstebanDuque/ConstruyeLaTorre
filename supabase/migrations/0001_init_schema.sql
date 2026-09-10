create extension if not exists "pgcrypto";

create table partidas (
  id uuid primary key default gen_random_uuid(),
  codigo_sala text not null unique,
  creada_en timestamptz not null default now(),
  terminada_en timestamptz
);

create table jugadores (
  id uuid primary key default gen_random_uuid(),
  partida_id uuid not null references partidas(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null check (
    rol in ('arquitecto', 'explorador_estructura', 'explorador_materiales', 'constructor')
  ),
  unique (partida_id, auth_user_id),
  unique (partida_id, rol)
);

create table rondas (
  id uuid primary key default gen_random_uuid(),
  partida_id uuid not null references partidas(id) on delete cascade,
  numero integer not null,
  dificultad integer not null,
  evento_tipo text,
  inicio timestamptz,
  fin timestamptz,
  resultado_estable boolean,
  puntos_ronda integer not null default 0,
  unique (partida_id, numero)
);

create table respuestas_validacion (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references rondas(id) on delete cascade,
  jugador_id uuid not null references jugadores(id) on delete cascade,
  respuesta_bool boolean not null,
  unique (ronda_id, jugador_id)
);

create table puntos_aporte (
  id uuid primary key default gen_random_uuid(),
  jugador_id uuid not null references jugadores(id) on delete cascade,
  ronda_id uuid not null references rondas(id) on delete cascade,
  tipo text not null check (
    tipo in ('accion_correcta', 'error_rol', 'evento_resuelto')
  ),
  valor integer not null
);

create table entregas_privadas (
  id uuid primary key default gen_random_uuid(),
  jugador_id uuid not null references jugadores(id) on delete cascade,
  ronda_id uuid not null references rondas(id) on delete cascade,
  tipo text not null check (tipo in ('fragmento_plano', 'evento')),
  contenido jsonb not null,
  mostrado_en timestamptz
);
