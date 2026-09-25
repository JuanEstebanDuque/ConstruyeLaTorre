// Utilidades para las pruebas de integración contra un Supabase real
// (por defecto el stack de `docker compose up`, en localhost:8000).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const URL = process.env.INTEGRACION_SUPABASE_URL ?? 'http://localhost:8000'
// Anon key de desarrollo de Supabase (pública, la misma del docker-compose)
export const ANON_KEY =
  process.env.INTEGRACION_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const ROLES = ['arquitecto', 'explorador_estructura', 'explorador_materiales', 'constructor']

/** true si hay un backend al que conectarse; si no, las pruebas se saltan. */
export async function backendDisponible(): Promise<boolean> {
  try {
    const r = await fetch(`${URL}/auth/v1/health`, {
      headers: { apikey: ANON_KEY },
      signal: AbortSignal.timeout(2000),
    })
    return r.ok
  } catch {
    return false
  }
}

export interface Jugador {
  cliente: SupabaseClient
  uid: string
  jugadorId: string
}

/** Lanza si la respuesta de Supabase trae error; si no, devuelve los datos. */
export function ok<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message)
  return r.data
}

/** Mensaje de error de una llamada que se espera que falle. */
export function fallo(r: { error: { message: string } | null }): string {
  if (!r.error) throw new Error('Se esperaba un error y la llamada funcionó')
  return r.error.message
}

export async function nuevoCliente() {
  const cliente = createClient(URL, ANON_KEY, { auth: { persistSession: false } })
  const { user } = ok(await cliente.auth.signInAnonymously())
  return { cliente, uid: user!.id }
}

function codigoAleatorio() {
  return 'T' + Math.random().toString(36).slice(2, 7).toUpperCase()
}

/** Crea una partida con `n` jugadores. El primero es el creador. */
export async function partidaCon(n: number) {
  const creador = await nuevoCliente()
  const codigo = codigoAleatorio()
  const partida = ok(
    await creador.cliente
      .from('partidas')
      .insert({ codigo_sala: codigo, creada_por: creador.uid })
      .select()
      .single(),
  ) as { id: string }
  const host = ok(
    await creador.cliente
      .from('jugadores')
      .insert({ partida_id: partida.id, auth_user_id: creador.uid, nombre: 'Creador' })
      .select()
      .single(),
  ) as { id: string }

  const jugadores: Jugador[] = [{ ...creador, jugadorId: host.id }]
  for (let i = 1; i < n; i++) {
    const c = await nuevoCliente()
    const fila = ok(
      await c.cliente.rpc('unirse_partida', { p_codigo: codigo, p_nombre: `J${i}` }).single(),
    ) as { jugador_id: string }
    jugadores.push({ ...c, jugadorId: fila.jugador_id })
  }
  return { partidaId: partida.id, codigo, jugadores }
}

/** Partida de 4 ya iniciada (ronda 1 creada). */
export async function partidaIniciada() {
  const p = await partidaCon(4)
  ok(await p.jugadores[0].cliente.rpc('iniciar_partida', { p_partida_id: p.partidaId }))
  return p
}

export async function ronda(p: { partidaId: string; jugadores: Jugador[] }, numero: number) {
  return ok(
    await p.jugadores[0].cliente
      .from('rondas')
      .select()
      .eq('partida_id', p.partidaId)
      .eq('numero', numero)
      .single(),
  ) as {
    id: string
    evento_tipo: string | null
    superada: boolean | null
    validada_en: string | null
    planeacion_inicio: string | null
    juego_inicio: string | null
  }
}

/** Rol de cada jugador (en el mismo orden que p.jugadores) en una ronda. */
export async function rolesDe(p: { jugadores: Jugador[] }, rondaId: string): Promise<string[]> {
  const filas = ok(
    await p.jugadores[0].cliente
      .from('asignaciones_rol')
      .select('jugador_id, rol')
      .eq('ronda_id', rondaId),
  ) as { jugador_id: string; rol: string }[]
  return p.jugadores.map((j) => filas.find((f) => f.jugador_id === j.jugadorId)!.rol)
}

export function constructorDe(p: { jugadores: Jugador[] }, roles: string[]): Jugador {
  return p.jugadores[roles.indexOf('constructor')]
}

export async function validar(j: Jugador, rondaId: string, condiciones: boolean[]) {
  const [correcta, estable, evento, tiempo] = condiciones
  return j.cliente.rpc('validar_ronda', {
    p_ronda_id: rondaId,
    p_torre_correcta: correcta,
    p_torre_estable: estable,
    p_evento_cumplido: evento,
    p_dentro_tiempo: tiempo,
  })
}
