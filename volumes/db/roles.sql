-- Se ejecuta una sola vez al crear la base (init-scripts de la imagen).
-- Asigna la contraseña a los roles internos con los que se conectan
-- PostgREST (authenticator) y GoTrue (supabase_auth_admin).
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
