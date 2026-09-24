import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'
import {
  contarListos,
  horaServidor,
  obtenerEstadoRonda,
  obtenerRonda,
  obtenerSesion,
  type EstadoRonda,
} from './game'
import type { Ronda } from '../types/game'

/** Respaldo por si se pierde un evento de Realtime (red móvil, pestaña en segundo plano) */
export const INTERVALO_SONDEO_MS = 2000

/**
 * Sesión leída una sola vez por pantalla. obtenerSesion() devuelve un objeto
 * nuevo en cada llamada; usarlo directo como dependencia de un efecto lo
 * re-ejecuta en cada render.
 */
export function useSesion() {
  const navigate = useNavigate()
  const [sesion] = useState(obtenerSesion)

  useEffect(() => {
    if (!sesion) navigate('/', { replace: true })
  }, [sesion, navigate])

  return sesion
}

/** Número de ronda desde la URL (/r/:numero/...) */
export function useNumeroRonda(): number {
  const { numero } = useParams<{ numero: string }>()
  return Number(numero) || 1
}

/** Rol, fragmento privado, evento y jugadores de la ronda indicada. */
export function useEstadoRonda(numero: number) {
  const sesion = useSesion()
  const [estado, setEstado] = useState<EstadoRonda | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sesion) return
    let activo = true
    sincronizarReloj()
    obtenerEstadoRonda(sesion, numero)
      .then((e) => activo && setEstado(e))
      .catch((err) => activo && setError(err instanceof Error ? err.message : String(err)))
    return () => {
      activo = false
    }
  }, [sesion, numero])

  return { sesion, estado, error }
}

// ── Reloj del servidor ─────────────────────────────────────────────────────
// Los tiempos se cuentan desde marcas del servidor (planeacion_inicio,
// juego_inicio). Se corrige la diferencia entre el reloj del celular y el del
// servidor para que todos vean el mismo conteo.

let desfaseMs = 0
let sincronizando: Promise<void> | null = null

function sincronizarReloj() {
  sincronizando ??= (async () => {
    try {
      const t0 = Date.now()
      const servidor = await horaServidor()
      const t1 = Date.now()
      desfaseMs = servidor - (t0 + t1) / 2
    } catch (err) {
      console.error(err)
      sincronizando = null
    }
  })()
}

export function ahoraServidor(): number {
  return Date.now() + desfaseMs
}

/** Segundos que quedan de un periodo de `total` segundos que empezó en `inicio`. */
export function segundosRestantes(inicio: string | null | undefined, total: number): number {
  if (!inicio) return total
  const transcurridos = Math.floor((ahoraServidor() - new Date(inicio).getTime()) / 1000)
  return Math.min(total, Math.max(0, total - transcurridos))
}

export function useCuentaRegresiva(inicio: string | null | undefined, total: number): number {
  const [restantes, setRestantes] = useState(() => segundosRestantes(inicio, total))

  useEffect(() => {
    const tick = () => setRestantes(segundosRestantes(inicio, total))
    tick()
    const intervalo = setInterval(tick, 250)
    return () => clearInterval(intervalo)
  }, [inicio, total])

  return restantes
}

// ── Ronda en vivo ──────────────────────────────────────────────────────────

/**
 * Mantiene la fila de la ronda (y cuántos están listos) actualizada: escucha
 * UPDATE por Realtime y además consulta periódicamente como respaldo.
 */
export function useRondaEnVivo(inicial: Ronda | null) {
  const [ronda, setRonda] = useState<Ronda | null>(inicial)
  const [listos, setListos] = useState({ revelacion: 0, planeacion: 0, yoListoPlaneacion: false })

  const rondaId = inicial?.id
  const partidaId = inicial?.partida_id
  const numero = inicial?.numero

  useEffect(() => {
    if (!rondaId || !partidaId || !numero) return
    let activo = true

    // Nombre único: supabase.channel() reutiliza canales con el mismo nombre y
    // al navegar entre pantallas el anterior puede estar aún cerrándose.
    const canal = supabase
      .channel(`ronda-${rondaId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rondas', filter: `id=eq.${rondaId}` },
        (payload) => activo && setRonda(payload.new as Ronda),
      )
      .subscribe()

    const revisar = () => {
      Promise.all([obtenerRonda(partidaId, numero), contarListos(rondaId)])
        .then(([r, l]) => {
          if (!activo) return
          setRonda(r)
          setListos(l)
        })
        .catch(console.error)
    }
    revisar()
    const sondeo = setInterval(revisar, INTERVALO_SONDEO_MS)

    return () => {
      activo = false
      clearInterval(sondeo)
      supabase.removeChannel(canal)
    }
  }, [rondaId, partidaId, numero])

  return { ronda: ronda ?? inicial, listos }
}

/** Ejecuta `accion` una sola vez cuando `condicion` se vuelve verdadera. */
export function useAlCumplirse(condicion: boolean, accion: () => void) {
  const accionRef = useRef(accion)
  useEffect(() => {
    accionRef.current = accion
  })
  const hechoRef = useRef(false)

  useEffect(() => {
    if (condicion && !hechoRef.current) {
      hechoRef.current = true
      accionRef.current()
    }
  }, [condicion])
}
