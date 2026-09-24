import { supabase } from './supabaseClient'
import type { Jugador, Partida, Rol, SesionLocal } from '../types/game'
import { ROLES_EN_ORDEN } from '../types/game'

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
    .insert({ codigo_sala: codigo })
    .select()
    .single<Partida>()

  if (errPartida) throw new Error(`No se pudo crear la partida: ${errPartida.message}`)

  const { data: jugador, error: errJugador } = await supabase
    .from('jugadores')
    .insert({
      partida_id: partida.id,
      auth_user_id: authUserId,
      nombre,
      rol: ROLES_EN_ORDEN[0],
    })
    .select()
    .single<Jugador>()

  if (errJugador) throw new Error(`No se pudo registrar el jugador: ${errJugador.message}`)

  const sesion: SesionLocal = {
    jugadorId: jugador.id,
    partidaId: partida.id,
    codigoSala: partida.codigo_sala,
    rol: jugador.rol,
    nombre,
    esHost: true,
  }
  guardarSesion(sesion)
  return sesion
}

export async function unirsePartida(codigo: string, nombre: string): Promise<SesionLocal> {
  const authUserId = await asegurarAuth()

  const { data: partida, error: errPartida } = await supabase
    .from('partidas')
    .select()
    .eq('codigo_sala', codigo.toUpperCase().trim())
    .is('terminada_en', null)
    .single<Partida>()

  if (errPartida) throw new Error('Código de sala no encontrado')

  const { data: existentes, error: errExistentes } = await supabase
    .from('jugadores')
    .select('rol, auth_user_id')
    .eq('partida_id', partida.id)

  if (errExistentes) throw new Error('Error al verificar la sala')

  // Si el mismo auth_user ya está en la partida, recuperar sesión
  const propio = (existentes ?? []).find((j) => j.auth_user_id === authUserId)
  if (propio) {
    const { data: jugador } = await supabase
      .from('jugadores')
      .select()
      .eq('partida_id', partida.id)
      .eq('auth_user_id', authUserId)
      .single<Jugador>()

    if (jugador) {
      const sesion: SesionLocal = {
        jugadorId: jugador.id,
        partidaId: partida.id,
        codigoSala: partida.codigo_sala,
        rol: jugador.rol as Rol,
        nombre: jugador.nombre,
        esHost: false,
      }
      guardarSesion(sesion)
      return sesion
    }
  }

  const rolesOcupados = (existentes ?? []).map((j) => j.rol as Rol)
  const siguienteRol = ROLES_EN_ORDEN.find((r) => !rolesOcupados.includes(r))

  if (!siguienteRol) throw new Error('La sala ya está completa (4/4 jugadores)')

  const { data: jugador, error: errJugador } = await supabase
    .from('jugadores')
    .insert({
      partida_id: partida.id,
      auth_user_id: authUserId,
      nombre,
      rol: siguienteRol,
    })
    .select()
    .single<Jugador>()

  if (errJugador) throw new Error(`No se pudo unir: ${errJugador.message}`)

  const sesion: SesionLocal = {
    jugadorId: jugador.id,
    partidaId: partida.id,
    codigoSala: partida.codigo_sala,
    rol: jugador.rol,
    nombre,
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

  if (error) throw new Error(error.message)
  return (data ?? []) as Jugador[]
}
