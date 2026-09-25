# Construye la Torre

Juego phygital para el curso de Interacción Socio Tecnológica. 4 jugadores con información parcial e incompatible deben construir una torre física usando solo comunicación verbal — nunca pueden mostrarse la pantalla ni intercambiar dispositivos.

## Stack

- **Frontend:** React 19 + Vite 8 + TypeScript
- **Backend:** Supabase (Postgres 17 + Auth + Realtime + PostgREST)
- **Gateway:** Kong
- **Servidor estático:** Nginx

---

## Opción 1 — Docker Compose (recomendado para probar en cualquier máquina)

Levanta el stack completo con un solo comando. Requiere [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

| Servicio | URL |
|---|---|
| App | http://localhost:3000 |
| API (Supabase) | http://localhost:8000 |

El servicio `migrate` aplica en cada `up` las migraciones de `supabase/migrations` que falten (las ya aplicadas se saltan), así que las migraciones nuevas también llegan a una base existente. Los datos persisten en el volumen `construye-la-torre_db-data`.

Para detener y eliminar contenedores:
```bash
docker compose down
```

Para eliminar también la base de datos (reset completo):
```bash
docker compose down -v
```

### Despliegue en VPS

Si corres el stack en un servidor con IP pública, pasa la IP al build para que el browser pueda alcanzar la API:

```bash
VITE_SUPABASE_URL=http://<ip-del-servidor>:8000 docker compose up --build -d
```

---

## Opción 2 — Desarrollo local (Supabase CLI + Vite)

Para desarrollo activo con hot-reload.

**Requisitos:** Node.js 22+, Docker Desktop, [Supabase CLI](https://supabase.com/docs/guides/cli)

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar Supabase local (Postgres + Auth + Realtime)
supabase start
#    → imprime API URL y anon key al finalizar

# 3. Crear archivo de variables de entorno
cp .env.example .env.local
#    → completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
#      con los valores que imprimió supabase start

# 4. Arrancar el servidor de desarrollo
npm run dev
#    → http://localhost:5173
```

Para detener Supabase local:
```bash
supabase stop
```

---

## Comandos útiles

```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción → dist/
npm run preview   # previsualizar el build local
npm run lint      # linter (oxlint)
npm test          # tests (vitest)
```

---

## Estructura del proyecto

```
src/
  pages/          # pantallas: Home, CreateGame, JoinGame, Lobby, RoleInfo
  lib/            # cliente Supabase y funciones del juego
  types/          # tipos TypeScript y definiciones de roles
supabase/
  migrations/     # schema SQL y políticas RLS
  config.toml     # configuración del stack local
volumes/
  api/kong.yml    # routing del API gateway
```

## Esquema de base de datos

Ver `docs/superpowers/specs/2026-09-09-construye-la-torre-arquitectura-design.md` para el diseño completo. Las migraciones viven en `supabase/migrations/`.

Tablas: `partidas`, `jugadores`, `rondas`, `respuestas_validacion`, `puntos_aporte`, `entregas_privadas`.
