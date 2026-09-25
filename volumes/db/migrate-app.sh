#!/bin/sh
# Aplica las migraciones de supabase/migrations que aún no se han aplicado.
# Corre en cada `docker compose up` (servicio `migrate`), así una migración
# nueva llega también a una base que ya existía. Usa la misma tabla de control
# que la Supabase CLI (supabase_migrations.schema_migrations).
set -eu

export PGHOST=db PGPORT=5432 PGUSER=postgres PGDATABASE=postgres
export PGPASSWORD="$POSTGRES_PASSWORD"

psql -v ON_ERROR_STOP=1 -q <<'SQL'
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
SQL

for archivo in /migrations/*.sql; do
  base=$(basename "$archivo" .sql)
  version=${base%%_*}
  nombre=${base#*_}

  aplicada=$(psql -tAc "select 1 from supabase_migrations.schema_migrations where version = '$version'")
  if [ "$aplicada" = "1" ]; then
    echo "= $base (ya aplicada)"
    continue
  fi

  echo "+ aplicando $base"
  psql -v ON_ERROR_STOP=1 -q --single-transaction -f "$archivo"
  psql -v ON_ERROR_STOP=1 -q -c \
    "insert into supabase_migrations.schema_migrations (version, name) values ('$version', '$nombre')"
done

# PostgREST recarga el esquema para ver tablas y funciones nuevas
psql -q -c "notify pgrst, 'reload schema'"
echo "Migraciones al día."
