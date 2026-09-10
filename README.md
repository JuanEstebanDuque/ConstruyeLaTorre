# Construye la Torre

Prototipo phygital para el curso de Interacción Socio Tecnológica.

## Requisitos

- Node.js 18+
- Docker Desktop (solo para desarrollo local de la base de datos)
- Una cuenta de Supabase (para el proyecto en la nube, no para desarrollo local)

## Desarrollo local

```bash
npm install
npx supabase start   # levanta Postgres local en Docker
cp .env.example .env # completar con la URL/anon key que imprime supabase start
npm run dev
```

## Tests

```bash
npm test
```

## Esquema de base de datos

Ver `docs/superpowers/specs/2026-09-09-construye-la-torre-arquitectura-design.md`
para el diseño completo. Las migraciones viven en `supabase/migrations/`.
