# Diseño técnico — Conexión frontend ↔ Supabase

Fecha: 2026-09-17
Estado: aprobado por el usuario, pendiente de escribir migración e implementar
Depende de: `docs/superpowers/specs/2026-09-09-construye-la-torre-arquitectura-design.md`
(ese documento fija Supabase + RLS + 6 tablas base; este documento corrige un
problema de esas tablas y añade lo que falta para conectar las 14 pantallas
ya construidas — hoy con estado local simulado — a datos reales).

## Contexto

Las 14 pantallas del flujo ya están implementadas en `src/screens/` con
estado 100% local (`useState`), portadas fielmente desde un prototipo de
Figma Make. El esquema de base de datos de la migración `0001` ya existe
pero tiene un defecto: `jugadores.rol` es una columna fija con
`unique(partida_id, rol)` — un jugador tiene un solo rol para toda la
partida. Esto es incompatible con la pantalla de Rotación, que exige que el
rol cambie cada ronda.

## 1. Problema a resolver y decisiones ya tomadas por el usuario

- **Sincronización entre dispositivos:** solo en puntos clave (Lobby,
  Validación, Rotación), no lockstep total. Revelación/Planeación/
  Construcción usan timers locales por dispositivo, igual que el
  prototipo — los 4 jugadores están físicamente juntos.
- **Rotación de roles:** aleatoria en cada ronda, sin que un jugador repita
  un rol que ya tuvo en la partida.
- **Contenido de "planos":** ni 100% fijo ni 100% aleatorio — generación
  procedural con reglas mínimas de viabilidad, a partir de un catálogo de
  piezas configurable (el catálogo físico real aún no está comprado).
- **Eventos (ronda 2 y 3):** automáticos, elegidos al azar por el backend al
  crear la ronda — no hay botón manual de "activar evento" en producción.

## 2. Cambios de esquema — migración `0003`

### 2.1 `jugadores`

- Eliminar columna `rol` y su constraint `unique(partida_id, rol)` (el rol
  ya no es fijo por partida).
- Agregar `listo boolean not null default false` (checkbox del Lobby).

### 2.2 `asignaciones_rol` (nueva)

Rol de cada jugador **por ronda**, no por partida.

```
id uuid pk
ronda_id uuid references rondas(id) on delete cascade
jugador_id uuid references jugadores(id) on delete cascade
rol text check (rol in ('arquitecto','explorador_estructura','explorador_materiales','constructor'))
unique (ronda_id, jugador_id)
unique (ronda_id, rol)
```

### 2.3 `votos_aporte` (nueva)

Voto privado de "aporte clave" de la pantalla de Votación.

```
id uuid pk
ronda_id uuid references rondas(id) on delete cascade
jugador_id uuid references jugadores(id) on delete cascade   -- quien vota
votado_id uuid references jugadores(id) on delete cascade    -- por quién vota
unique (ronda_id, jugador_id)
check (jugador_id <> votado_id)
```

### 2.4 `piezas` (nueva, catálogo editable)

Semilla placeholder — se edita en Supabase Studio cuando el inventario
físico esté definido, sin tocar código ni frontend.

```
codigo text pk
nombre text not null
tipo text check (tipo in ('base','estructural','conector','decorativa'))
cantidad_disponible integer not null default 4
activa boolean not null default true
```

### 2.5 `rondas`

- Agregar `fase text not null default 'revelacion' check (fase in
  ('revelacion','planeacion','construccion','validacion','resultado','votacion'))`.
  Permite que Lobby/Resultado sepan "en qué punto va la partida" sin
  necesitar lockstep total en las demás pantallas.

### 2.6 RLS a completar

`partidas` y `rondas` hoy no tienen RLS activado (abiertas a cualquiera con
la anon key). Se activa RLS con una política simple: cualquier usuario
autenticado (anónimo) puede `SELECT` — el código de sala es el secreto
compartido; la privacidad real la dan `entregas_privadas` y `votos_aporte`.
`asignaciones_rol` y `piezas` también necesitan políticas de `SELECT` para
jugadores de la misma partida (mismo patrón que `respuestas_validacion`).

## 3. Generación procedural de "planos"

Reglas mínimas para que nunca salga una torre imposible:

- `niveles = número_de_ronda + 1` (ronda 1 → 2 niveles, ronda 2 → 3, ronda
  3 → 4). Usa la columna `rondas.dificultad` ya existente.
- **Nivel base:** siempre 1 pieza tipo `base` (garantiza que la torre se
  pueda parar).
- **Niveles intermedios:** siempre 1 pieza `estructural` (garantiza
  continuidad) + opcionalmente 1 `conector` extra al azar (la variedad
  real, probabilidad crece con la dificultad).
- **Nivel superior:** 1 pieza `estructural` o `decorativa` al azar (no
  crítica para estabilidad).
- Todo respeta `cantidad_disponible` del catálogo (no se puede generar más
  unidades de una pieza que las declaradas como disponibles).

El resultado se reparte ya **pre-filtrado por rol** (nunca se genera "el
plano completo" visible para nadie):

- Arquitecto → niveles + conteo de piezas por nivel (vista frontal).
- Explorador de Estructura → orientación/relación entre piezas (vista
  superior).
- Explorador de Materiales → lista total de piezas (código, cantidad,
  descripción).
- Constructor → sin `entregas_privadas` de este tipo; su pantalla usa el
  texto fijo ya existente en el prototipo ("eres el único que puede
  manipular piezas...").

Cada vista se guarda como una fila `entregas_privadas` (`tipo =
'fragmento_plano'`) dirigida al `jugador_id` que tenga ese rol esa ronda.

## 4. Rotación de roles

**Corregido en migración `0004`** tras revisar el documento oficial del
juego (`C:\TRABAJOS\UNIVERSIDAD\SOCIO\Documento base.md`), que especifica
un orden fijo, no aleatorio cada ronda como se había decidido
originalmente en esta sección. Ronda 1: asignación al azar de los 4
roles. Rondas 2 y 3: cada jugador avanza al siguiente rol en un ciclo fijo
(`arquitecto → explorador_estructura → explorador_materiales →
constructor → arquitecto`), leyendo su rol de la ronda anterior.

## 5. Integridad: todo lo sensible corre en funciones Postgres `SECURITY
DEFINER`

Los clientes **nunca** insertan directamente en `entregas_privadas` ni
`asignaciones_rol` — eso permitiría a un jugador fabricarse ventaja
(ver su propio plano completo, o el de otro rol). Tres piezas de lógica
server-side, todas en Postgres (sin Edge Functions — se mantiene la
decisión del spec anterior de "sin servidor propio"):

- **`iniciar_partida(partida_id uuid)`** — crea ronda 1 (`dificultad = 1`),
  asigna roles al azar, genera y reparte el plan vía `entregas_privadas`.
  Se llama desde el Lobby cuando los 4 jugadores están listos.
- **`rotar_ronda(partida_id uuid)`** — crea ronda N+1 (idempotente, protegida
  por `unique(partida_id, numero)`: si dos dispositivos la llaman a la vez,
  la segunda llamada simplemente lee la fila ya creada por la primera),
  rota roles evitando repetidos, genera nuevo plan, y si
  `numero >= 2` genera además un evento aleatorio (`entregas_privadas`,
  `tipo = 'evento'`, dirigido a un jugador al azar).
- **Trigger** (no RPC) en `respuestas_validacion`: al insertarse la 4ª
  respuesta de una ronda, calcula mayoría 3/4 y escribe
  `rondas.resultado_estable` + `rondas.fin` automáticamente. Sin condición
  de carrera entre dispositivos — nadie tiene que "ser el que calcula".

## 6. Sincronización en tiempo real

- **Lobby:** canal de Postgres Changes sobre `jugadores` (partida_id) —
  ver quién se une / marca "listo" en vivo.
- **Validación → Resultado de ronda:** cada dispositivo inserta su propia
  fila en `respuestas_validacion`, luego se suscribe a cambios en su fila
  de `rondas` esperando a que el trigger llene `resultado_estable`
  (spinner mientras tanto, mismo patrón que el Lobby).
- **Rotación:** cualquier dispositivo dispara `rotar_ronda`; como es
  idempotente no importa el orden de llegada.
- Revelación/Planeación/Construcción: sin canal — timers locales, igual
  que el prototipo de origen.

## 7. Autenticación

Supabase Anonymous Auth (`supabase.auth.signInAnonymously()`) una vez por
dispositivo al entrar a la app. Sin login real; la sesión persiste en el
navegador (localStorage) mientras dure el playtesting. Es lo que ya asume
`jugadores.auth_user_id` y las políticas RLS existentes de la migración
`0002`.

## 8. Mapeo pantalla → operación

| Pantalla | Operación |
|---|---|
| Inicio | ninguna |
| Crear partida | `signInAnonymously()`, insert `partidas` (código generado), insert `jugadores` (self) |
| Unirse a partida | `signInAnonymously()`, select `partidas` por código, insert `jugadores` (self) |
| Lobby | select + realtime `jugadores`; update `jugadores.listo`; cuando 4/4 listos → `iniciar_partida()` |
| Rol | select `asignaciones_rol` (mi fila de la ronda actual) |
| Revelación | select `entregas_privadas` (mías, `tipo='fragmento_plano'`) — RLS filtra |
| Planeación | timer local, sin red |
| Construcción | timer local; select `entregas_privadas` (`tipo='evento'`, mías) si existe |
| Validación | insert `respuestas_validacion` (propia) |
| Resultado de ronda | select + realtime `rondas` (esperar `resultado_estable`) |
| Votación | insert `votos_aporte` (propio) |
| Rotación | `rotar_ronda()`; select `asignaciones_rol` (nueva ronda, mi fila) |
| Final | select agregada: `rondas` (contar superadas), `votos_aporte` (tally MVP), `puntos_ronda` |

## Fuera de alcance de este documento

- La generación de contenido de eventos concretos (textos exactos de "pieza
  bloqueada", "plano perdido", etc.) reutiliza los 5 tipos ya descritos en
  el flujo original — no se diseñan textos nuevos aquí.
- El catálogo `piezas` se siembra con datos placeholder; los valores reales
  (códigos, cantidades) se cargan después, cuando el material físico esté
  comprado — no bloquea esta implementación.
- Despliegue del frontend a Vercel/Netlify (ya cubierto en el spec del
  2026-09-09, sección 6) — no se repite aquí.

## Siguiente paso

El usuario está montando el proyecto Supabase en la nube por su cuenta.
Una vez tenga la URL/anon key, se escribe la migración `0003` con lo de
este documento, se corre localmente primero (`supabase start` +
`supabase db push` a un proyecto de prueba o local), y luego se conectan
las 14 pantallas reemplazando el estado local simulado por las operaciones
de la tabla de la sección 8.
