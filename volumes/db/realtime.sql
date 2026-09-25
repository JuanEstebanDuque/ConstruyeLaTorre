-- Schema interno de Supabase Realtime (lo usa con DB_AFTER_CONNECT_QUERY).
create schema if not exists _realtime;
alter schema _realtime owner to supabase_admin;
