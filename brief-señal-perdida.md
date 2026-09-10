# Contexto para Claude Code — "Construye la Torre"

Este documento reemplaza el brief anterior de "Señal Perdida" — el equipo
cambió de juego. No quiero que generes repo ni código todavía. Primero
necesito discutir contigo la arquitectura técnica, que es lo único que
sigue realmente abierto en este proyecto.

## 1. El encargo real (fijo, no se negocia)

Proyecto universitario, curso "Interacción socio tecnológica", entrega en
semana 6. Entregables obligatorios: prototipo phygital funcional (físico +
app) con empaque, sitio web y manuales en GitHub; documentación visual en
Behance; video demostrativo en YouTube; notebook de Jupyter con evaluación
de impacto (cooperación/competencia) usando datos reales de playtesting.

**Nota sin resolver, fuera de lo técnico:** la tarea original especifica
equipos de 3 personas. El equipo actual tiene 5 roles (Ana, Duque, Dayan,
Cris, Felipe). Confirmar con el profesor si esto es válido — no es una
decisión que se resuelva en el código.

## 2. El juego: Construye la Torre

4 jugadores, 14+ años, partidas de 20-30 min en rondas de dificultad
progresiva. Cada jugador recibe un rol con información parcial e
incompatible entre sí — nadie tiene el plano completo:

- **Arquitecto**: vista frontal, alturas y niveles.
- **Explorador de estructura**: vista lateral/superior, relaciones entre piezas.
- **Explorador de materiales**: códigos y características de las piezas.
- **Constructor**: sin plano, pero es el único autorizado a tocar las piezas físicas.

Regla de comunicación: pueden hablar, pero nunca mostrar pantalla, ni
intercambiar celulares, ni tomar capturas. Solo el Constructor toca piezas.

**Flujo de ronda:** Revelación (la app entrega el fragmento de cada rol) →
Planeación (tiempo corto para comunicarse) → Construcción (Constructor
coloca piezas) → Evento (la app introduce una condición inesperada:
pieza bloqueada, cambio de altura, silencio, plano perdido, reemplazo) →
Validación (torre correcta, estable, evento cumplido, dentro de tiempo) →
Puntuación.

**Puntuación V1** (sujeta a ajuste tras playtesting, ya definida como
punto de partida): +2 acción correcta de rol, +1 evento resuelto, +3
ronda completada, -1 error de rol. Resultado colectivo (gana/pierde el
equipo) + resultado individual (MVP por Puntos de Aporte).

**Físico:** piezas modulares, base de construcción, códigos visibles en
piezas, fichas/marcadores, caja, manual.

**Digital:** creación de partida, roles, fragmentos del plano,
temporizador, eventos, instrucciones privadas, puntuación, ranking,
resultado por ronda, registro de datos.

## 3. Ya decidido — no reabrir esto con Claude Code

- Stack: React + Vite + TypeScript.
- Roles del equipo y qué entrega cada uno por sprint (ver sección 4).
- Las 14 pantallas del flujo completo (splash, menú, crear/unirse partida,
  lobby, asignación de rol, instrucciones, preparación, información
  privada, cuenta regresiva, partida activa, evento especial, resumen de
  ronda, resultados finales).
- Plan de 6 sprints con entregables por persona (documento de sprints aparte).

## 4. Dónde estamos: Sprint 1

Meta del sprint: reglas base cerradas, estructura inicial de la app
definida, dirección visual clara. La tarea técnica de este sprint
(asignada a Duque) es: "Proyecto técnico creado + repositorio GitHub +
decisión de cómo funcionarán las salas/jugadores/datos." Esa decisión es
exactamente lo que quiero discutir antes de crear nada.

## 5. Lo que sigue abierto — esto es lo que quiero decidir con Claude Code

1. **Arquitectura de salas y sincronización en tiempo real.** 4
   dispositivos distintos (uno por jugador) necesitan ver información
   diferente y sincronizada: cuenta regresiva compartida, eventos que
   llegan a todos al mismo tiempo, pero fragmentos de plano que solo ve
   cada rol. ¿WebSockets propios, un backend realtime tipo Firebase/
   Supabase, o algo más simple dado el tiempo disponible? Esta decisión
   condiciona todo el Sprint 2 (App V1 funcional con creación de partida
   por código).

2. **Validación de estabilidad — YA DECIDIDO.** Al terminar cada ronda,
   los 4 jugadores responden por separado una pregunta sí/no ("¿la torre
   quedó estable?") en la pantalla de Validación/Resumen de ronda. Se
   registran las 4 respuestas individuales, no solo un resultado agregado
   — la discrepancia entre roles es en sí un dato de interés para el
   notebook de impacto. Regla de conteo: mayoría de 3 de 4 para que cuente
   como "estable"; en empate 2-2, se cuenta como "no estable" (pendiente
   de confirmar con el equipo si prefieren otra regla de desempate).

3. **Diseño del sistema de eventos.** Los eventos (pieza bloqueada,
   cambio de altura, silencio, plano perdido, reemplazo) tienen que
   dispararse en tiempo real y afectar a jugadores específicos sin que
   los demás lo vean en su pantalla. ¿Esto vive en el mismo estado de
   sala o necesita lógica de visibilidad por rol más elaborada?

4. **Esquema de datos y formato de exportación para el notebook.** El
   Sprint 5 le asigna a Duque "exportar los datos de las partidas para
   analizarlos después" — hay que definir ahora qué eventos se registran
   (tiempos, puntos, errores, roles, resultados por ronda) y en qué
   formato (CSV, JSON) sale, para que el análisis en Python no dependa de
   reformatear datos a último momento.

5. **Dónde se despliega para el testing externo del Sprint 5.** Va a
   correr en dispositivos de usuarios reales fuera del equipo — necesita
   una URL accesible, no solo correr en local.

## Lo que quiero de esta conversación

Antes de crear el repo: que me hagas preguntas sobre estos 5 puntos,
que cuestiones cualquier arquitectura que parezca demasiado compleja para
el tiempo que queda (somos 5, pero solo Duque lleva la parte técnica según
el plan de sprints), y que propongamos juntos una decisión concreta para
cada uno antes de escribir código.
