import { supabase } from './supabaseClient'
import type {
  Evento,
  Fragmento,
  Jugador,
  Partida,
  Rol,
  Ronda,
  SesionLocal,
} from '../types/game'

const SESSION_KEY = 'cdt_sesion'

export function guardarSesion(sesion: SesionLocal): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion))
}

export function obtenerSesion(): SesionLocal | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SesionLocal
  } catch {
    return null
  }
}

export function limpiarSesion(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

async function asegurarAuth(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) return session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw new Error(`Error de autenticación: ${error.message}`)
  if (!data.user) throw new Error('No se pudo iniciar sesión anónima')
  return data.user.id
}

function generarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('')
}

export async function crearPartida(nombre: string): Promise<SesionLocal> {
  const authUserId = await asegurarAuth()

  const codigo = generarCodigo()

  const { data: partida, error: errPartida } = await supabase
    .from('partidas')
    .insert({ codigo_sala: codigo, creada_por: authUserId })
    .select()
    .single<Partida>()

  if (errPartida) throw new Error(`No se pudo crear la partida: ${errPartida.message}`)

  const { data: jugador, error: errJugador } = await supabase
    .from('jugadores')
    .insert({
      partida_id: partida.id,
      auth_user_id: authUserId,
      nombre,
    })
    .select()
    .single<Jugador>()

  if (errJugador) throw new Error(`No se pudo registrar el jugador: ${errJugador.message}`)

  const sesion: SesionLocal = {
    jugadorId: jugador.id,
    partidaId: partida.id,
    codigoSala: partida.codigo_sala,
    nombre,
    esHost: true,
  }
  guardarSesion(sesion)
  return sesion
}

export async function unirsePartida(codigo: string, nombre: string): Promise<SesionLocal> {
  await asegurarAuth()

  // Se hace en el servidor: por RLS, quien se une aún no puede ver a los demás
  // jugadores de la partida (ni cuántos hay). Los roles se asignan por ronda.
  const { data, error } = await supabase
    .rpc('unirse_partida', { p_codigo: codigo.toUpperCase().trim(), p_nombre: nombre })
    .single<{
      jugador_id: string
      partida_id: string
      codigo_sala: string
      nombre: string
    }>()

  if (error) throw new Error(error.message)

  const sesion: SesionLocal = {
    jugadorId: data.jugador_id,
    partidaId: data.partida_id,
    codigoSala: data.codigo_sala,
    nombre: data.nombre,
    esHost: false,
  }
  guardarSesion(sesion)
  return sesion
}

export async function obtenerJugadores(partidaId: string): Promise<Jugador[]> {
  const { data, error } = await supabase
    .from('jugadores')
    .select()
    .eq('partida_id', partidaId)
    .order('unido_en')

  if (error) throw new Error(error.message)
  return (data ?? []) as Jugador[]
}

export async function obtenerPartida(partidaId: string): Promise<Partida> {
  const { data, error } = await supabase
    .from('partidas')
    .select()
    .eq('id', partidaId)
    .single<Partida>()

  if (error) throw new Error(error.message)
  return data
}

/** Solo el creador. Crea la ronda 1 con roles al azar y marca la partida como iniciada. */
export async function iniciarPartida(partidaId: string): Promise<void> {
  const { error } = await supabase.rpc('iniciar_partida', { p_partida_id: partidaId })
  if (error) throw new Error(error.message)
}

// ── Rondas ───────────────────────────────────────────────────────────────

export interface EstadoRonda {
  ronda: Ronda
  miRol: Rol
  /** Rol de cada jugador en esta ronda */
  roles: Record<string, Rol>
  jugadores: Jugador[]
  /** Mi fragmento privado del plano (vacío para el Constructor) */
  fragmento: Fragmento
  /** Evento privado, solo si me tocó a mí */
  evento: Evento | null
}

export async function obtenerRonda(partidaId: string, numero: number): Promise<Ronda> {
  const { data, error } = await supabase
    .from('rondas')
    .select()
    .eq('partida_id', partidaId)
    .eq('numero', numero)
    .single<Ronda>()

  if (error) throw new Error(error.message)
  return data
}

export async function obtenerRondas(partidaId: string): Promise<Ronda[]> {
  const { data, error } = await supabase
    .from('rondas')
    .select()
    .eq('partida_id', partidaId)
    .order('numero')

  if (error) throw new Error(error.message)
  return (data ?? []) as Ronda[]
}

export async function obtenerEstadoRonda(
  sesion: SesionLocal,
  numero: number,
): Promise<EstadoRonda> {
  const ronda = await obtenerRonda(sesion.partidaId, numero)

  const [asignaciones, entregas, jugadores] = await Promise.all([
    supabase.from('asignaciones_rol').select('jugador_id, rol').eq('ronda_id', ronda.id),
    // RLS: solo devuelve las filas dirigidas a este jugador
    supabase.from('entregas_privadas').select('tipo, contenido').eq('ronda_id', ronda.id),
    obtenerJugadores(sesion.partidaId),
  ])

  if (asignaciones.error) throw new Error(asignaciones.error.message)
  if (entregas.error) throw new Error(entregas.error.message)

  const roles: Record<string, Rol> = {}
  for (const a of asignaciones.data ?? []) roles[a.jugador_id] = a.rol as Rol

  const miRol = roles[sesion.jugadorId]
  if (!miRol) throw new Error('No tienes rol asignado en esta ronda')

  const filas = entregas.data ?? []
  return {
    ronda,
    miRol,
    roles,
    jugadores,
    fragmento: (filas.find((e) => e.tipo === 'fragmento_plano')?.contenido ?? {}) as Fragmento,
    evento: (filas.find((e) => e.tipo === 'evento')?.contenido ?? null) as Evento | null,
  }
}

/** Solo el Constructor de la ronda. */
export async function validarRonda(
  rondaId: string,
  condiciones: {
    torreCorrecta: boolean
    torreEstable: boolean
    eventoCumplido: boolean
    dentroTiempo: boolean
  },
): Promise<void> {
  const { error } = await supabase.rpc('validar_ronda', {
    p_ronda_id: rondaId,
    p_torre_correcta: condiciones.torreCorrecta,
    p_torre_estable: condiciones.torreEstable,
    p_evento_cumplido: condiciones.eventoCumplido,
    p_dentro_tiempo: condiciones.dentroTiempo,
  })
  if (error) throw new Error(error.message)
}

export type AccionRonda =
  | 'vi_revelacion'
  | 'iniciar_planeacion'
  | 'listo_planeacion'
  | 'saltar_planeacion'
  | 'fin_planeacion'

export async function accionRonda(rondaId: string, accion: AccionRonda): Promise<void> {
  const { error } = await supabase.rpc('accion_ronda', { p_ronda_id: rondaId, p_accion: accion })
  if (error) throw new Error(error.message)
}

/** Cuántos jugadores marcaron cada fase como vista/lista. */
export async function contarListos(
  rondaId: string,
): Promise<{ revelacion: number; planeacion: number; yoListoPlaneacion: boolean }> {
  const { data, error } = await supabase
    .from('listos_ronda')
    .select('fase, jugador_id')
    .eq('ronda_id', rondaId)
  if (error) throw new Error(error.message)
  const filas = data ?? []
  const sesion = obtenerSesion()
  return {
    revelacion: filas.filter((f) => f.fase === 'revelacion').length,
    planeacion: filas.filter((f) => f.fase === 'planeacion').length,
    yoListoPlaneacion: filas.some(
      (f) => f.fase === 'planeacion' && f.jugador_id === sesion?.jugadorId,
    ),
  }
}

/** Hora del servidor, para que todos los dispositivos cuenten el mismo tiempo. */
export async function horaServidor(): Promise<number> {
  const { data, error } = await supabase.rpc('hora_servidor')
  if (error) throw new Error(error.message)
  return new Date(data as string).getTime()
}

export async function votarAporte(rondaId: string, votadoId: string): Promise<void> {
  const { error } = await supabase.rpc('votar_aporte', {
    p_ronda_id: rondaId,
    p_votado_id: votadoId,
  })
  if (error) throw new Error(error.message)
}

/** Idempotente: el primero que llega crea la ronda siguiente. */
export async function avanzarRonda(partidaId: string, desde: number): Promise<void> {
  const { error } = await supabase.rpc('avanzar_ronda', {
    p_partida_id: partidaId,
    p_desde: desde,
  })
  if (error) throw new Error(error.message)
}

export interface PuestoRanking {
  jugador_id: string
  nombre: string
  puntos: number
}

export async function obtenerRanking(partidaId: string): Promise<PuestoRanking[]> {
  const { data, error } = await supabase.rpc('ranking_partida', { p_partida_id: partidaId })
  if (error) throw new Error(error.message)
  return (data ?? []) as PuestoRanking[]
}

export async function contarVotos(rondaId: string): Promise<number> {
  const { data, error } = await supabase.rpc('votos_emitidos', { p_ronda_id: rondaId })
  if (error) throw new Error(error.message)
  return data as number
}
