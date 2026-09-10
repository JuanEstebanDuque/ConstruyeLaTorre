# Diseño técnico — "Construye la Torre"

Fecha: 2026-09-09
Estado: aprobado por el usuario, listo para plan de implementación (Sprint 1-2)

## Contexto

Proyecto universitario "Interacción socio tecnológica". Juego phygital
"Construye la Torre": 4 roles con información parcial e incompatible
(Arquitecto, Explorador de estructura, Explorador de materiales,
Constructor), comunicación solo oral (nunca compartir pantalla ni
intercambiar dispositivos). Flujo por ronda: Revelación → Planeación →
Construcción → Evento → Validación → Puntuación.

Decisiones ya fijas y fuera de discusión (brief, sección 3): stack React +
Vite + TypeScript; roles de equipo y entregables por sprint; las 14
pantallas del flujo; plan de 6 sprints.

Este documento resuelve los 5 puntos técnicos que el brief dejó abiertos
(sección 5).

## 1. Backend y sincronización en tiempo real

**Decisión: Supabase (Postgres + Realtime).**

- El frontend React se conecta directo al proyecto Supabase — sin servidor
  propio que mantener ni desplegar.
- Postgres sirve como estado autoritativo de cada partida y como fuente de
  datos para el notebook (evita reformatear datos capturados en un formato
  no tabular).
- Supabase Realtime distribuye countdown, cambios de fase de ronda y
  eventos a los 4 dispositivos conectados a una partida.
- Alternativas descartadas: Firebase/Firestore (estructura por documentos,
  requiere aplanar antes de exportar a CSV/pandas); WebSocket propio
  (Node + Socket.IO) — descartado porque un solo miembro del equipo
  (Duque) lleva la parte técnica, y un servidor propio añade superficie
  de fallo (reconexión, persistencia, hosting) sin beneficio claro sobre
  Supabase para este alcance.

## 2. Modelo de salas

- Tabla `partidas`: una fila por partida, con `código_sala` corto para
  que los 4 jugadores se unan desde sus dispositivos.
- Tabla `jugadores`: una fila por jugador unido a una partida, con su rol
  asignado.
- Unirse a una sala = insertar en `jugadores` con el código de la partida;
  el cliente se suscribe a los canales Realtime de esa partida.

## 3. Visibilidad de información por rol

**Decisión: fila por jugador + Row-Level Security (RLS) en Postgres.**

El filtrado de qué ve cada jugador ocurre en el servidor, no en el
cliente: un dato que no le corresponde a un rol nunca llega a su
dispositivo (ni siquiera oculto en el payload).

- Tabla `entregas_privadas` (`jugador_id`, `ronda_id`, `tipo`, `contenido`,
  `mostrado_en`): una fila por cada fragmento de plano o evento dirigido a
  un jugador específico.
- Política RLS: cada jugador solo puede `SELECT` filas donde
  `jugador_id = auth.uid()` (o el identificador de sesión equivalente).
- Este mismo patrón cubre dos necesidades del brief con un solo mecanismo:
  los fragmentos de plano de la fase Revelación, y los eventos dirigidos a
  un rol específico (pieza bloqueada, plano perdido, etc.) en la fase
  Evento.
- Alternativa descartada: un solo canal de broadcast por sala con filtrado
  en el cliente — técnicamente el dato llegaría a los 4 dispositivos
  aunque no se muestre, lo que rompe la garantía real de "nunca ver" que
  pide la regla de comunicación del juego.

## 4. Validación de estabilidad

**Ya decidido en el brief, regla de desempate cerrada en esta conversación:**

- Al final de cada ronda, los 4 jugadores responden por separado
  sí/no ("¿la torre quedó estable?") en la pantalla de
  Validación/Resumen de ronda.
- Se registran las 4 respuestas individuales (tabla
  `respuestas_validacion`), no solo un agregado — la discrepancia entre
  roles es en sí un dato de interés para el notebook.
- Regla de conteo: mayoría de 3 de 4 para que cuente como "estable".
- **Desempate 2-2: se cuenta como "no estable"** (decisión tomada en esta
  conversación — conservador, sin voto de calidad de ningún rol, fácil de
  justificar en el notebook como "ambigüedad se trata como fallo").

## 5. Esquema de datos y export para el notebook

Seis tablas mínimas en Postgres:

- `partidas` (id, código_sala, creada_en, terminada_en)
- `jugadores` (id, partida_id, nombre, rol)
- `rondas` (id, partida_id, número, dificultad, evento_tipo, inicio, fin,
  resultado_estable, puntos_ronda)
- `respuestas_validacion` (ronda_id, jugador_id, respuesta_bool)
- `puntos_aporte` (jugador_id, ronda_id, tipo: acción_correcta /
  error_rol / evento_resuelto, valor) — una fila por evento de
  puntuación, no un acumulado, para poder reconstruir la curva completa
  en el notebook
- `entregas_privadas` (jugador_id, ronda_id, tipo: fragmento_plano /
  evento, contenido, mostrado_en)

**Puntuación V1** (del brief, ya definida como punto de partida — sujeta a
ajuste tras playtesting): +2 acción correcta de rol, +1 evento resuelto,
+3 ronda completada, -1 error de rol. Resultado colectivo (gana/pierde el
equipo) + resultado individual (MVP por Puntos de Aporte, suma de
`puntos_aporte` por jugador).

**Export:** una vista SQL que haga `JOIN` de estas tablas (una fila por
jugador-ronda) exportable como CSV desde el Table Editor de Supabase, o
vía una Edge Function llamada desde un botón en la app. Entra directo a
pandas sin reformateo manual.

## 6. Despliegue para testing externo (Sprint 5)

Frontend en Vercel o Netlify (deploy desde GitHub, gratis) apuntando al
proyecto Supabase (gestionado, con URL pública). No requiere
infraestructura propia ni configuración de servidor.

## Fuera de alcance de este documento

- La pregunta de equipos de 3 vs. 5 roles reales (sección 1 del brief) es
  administrativa, no técnica — se resuelve con el profesor, no aquí.
- Las 14 pantallas, el plan de sprints y la asignación de tareas por
  persona ya están decididos y no se tocan.

## Siguiente paso

Invocar writing-plans para el plan de implementación del Sprint 1
(estructura del proyecto, repo, y las decisiones de este documento
traducidas a esquema real de Supabase) y Sprint 2 (app V1 con creación de
partida por código).
