import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  iniciarPartida,
  limpiarSesion,
  obtenerJugadores,
  obtenerPartida,
  obtenerSesion,
} from '../lib/game'
import type { Jugador, Partida } from '../types/game'
import Hexagons from '../components/Hexagons'
import InfoCard from '../components/InfoCard'
import SectionDivider from '../components/SectionDivider'

const MAX_JUGADORES = 4
// Respaldo por si se pierde un evento de Realtime (red móvil, pestaña en segundo plano)
const INTERVALO_SONDEO_MS = 3000

export default function Lobby() {
  const { partidaId } = useParams<{ partidaId: string }>()
  const navigate = useNavigate()
  // Leer una sola vez: obtenerSesion() devuelve un objeto nuevo en cada llamada y,
  // usado como dependencia, re-suscribía el canal Realtime en cada render.
  const [sesion] = useState(obtenerSesion)

  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const entrandoRef = useRef(false)

  const sesionValida = !!sesion && sesion.partidaId === partidaId

  // Redirigir si no hay sesión válida
  useEffect(() => {
    if (!sesionValida) navigate('/', { replace: true })
  }, [sesionValida, navigate])

  const entrarAPartida = useCallback(
    (partida: Partida) => {
      if (!partida.iniciada_en || entrandoRef.current) return
      entrandoRef.current = true
      navigate(`/r/${Math.max(1, partida.ronda_actual)}/rol`, { replace: true })
    },
    [navigate],
  )

  const refrescar = useCallback(async () => {
    if (!partidaId) return
    const [lista, partida] = await Promise.all([
      obtenerJugadores(partidaId),
      obtenerPartida(partidaId),
    ])
    setJugadores(lista)
    entrarAPartida(partida)
  }, [partidaId, entrarAPartida])

  useEffect(() => {
    if (!partidaId || !sesionValida) return

    refrescar()
      .catch(console.error)
      .finally(() => setCargando(false))

    const canal = supabase
      // Nombre único: supabase.channel() reutiliza canales con el mismo nombre
      .channel(`lobby-${partidaId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jugadores',
          filter: `partida_id=eq.${partidaId}`,
        },
        (payload) => {
          const nuevo = payload.new as Jugador
          setJugadores((prev) => {
            if (prev.some((j) => j.id === nuevo.id)) return prev
            return [...prev, nuevo]
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'partidas',
          filter: `id=eq.${partidaId}`,
        },
        (payload) => entrarAPartida(payload.new as Partida),
      )
      .subscribe()

    const sondeo = setInterval(() => {
      refrescar().catch(console.error)
    }, INTERVALO_SONDEO_MS)

    return () => {
      clearInterval(sondeo)
      supabase.removeChannel(canal)
    }
  }, [partidaId, sesionValida, refrescar, entrarAPartida])

  async function comenzar() {
    if (!partidaId) return
    setEnviando(true)
    setError('')
    try {
      await iniciarPartida(partidaId)
      await refrescar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la partida')
      setEnviando(false)
    }
  }

  function salir() {
    limpiarSesion()
    navigate('/', { replace: true })
  }

  if (!sesion) return null

  const listoParaIniciar = jugadores.length === MAX_JUGADORES && sesion.esHost

  return (
    <div className="page" style={{ gap: 28 }}>
      <Hexagons corner="tr" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Código: {sesion.codigoSala}</h1>
        <button className="back-btn" onClick={salir}>
          Salir
        </button>
      </div>

      {/* Lista de jugadores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 15, color: 'var(--text)' }}>Jugadores</h3>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
            {cargando ? '...' : `${jugadores.length}/${MAX_JUGADORES}`}
          </span>
        </div>
        <SectionDivider />

        {cargando && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <span className="spinner" />
          </div>
        )}

        {!cargando && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: MAX_JUGADORES }, (_, i) => {
              const jugador = jugadores[i]
              return jugador ? (
                <div key={jugador.id} className="player-row">
                  <span style={{ flex: 1, fontWeight: 700, color: 'var(--text)' }}>
                    {jugador.nombre}
                    {jugador.id === sesion.jugadorId && (
                      <span style={{ opacity: 0.6, fontWeight: 600 }}> (tú)</span>
                    )}
                  </span>
                  <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: 14 }}>
                    ✓ Listo
                  </span>
                </div>
              ) : (
                <div key={`vacio-${i}`} className="player-slot">
                  <span style={{ fontSize: 14, color: 'var(--text-soft)' }}>
                    Esperando jugador...
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <InfoCard icon="/FotoRecuerdaLobby.png" title="Recuerda" variant="white">
        No muestres tu pantalla durante la partida.
      </InfoCard>

      {/* Estado / acción */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <p className="error-msg">{error}</p>}
        {sesion.esHost ? (
          <>
            {!listoParaIniciar && (
              <p style={{ textAlign: 'center', fontSize: 14 }}>
                Esperando a que se unan los {MAX_JUGADORES - jugadores.length} jugador
                {MAX_JUGADORES - jugadores.length !== 1 ? 'es' : ''} restante
                {MAX_JUGADORES - jugadores.length !== 1 ? 's' : ''}...
              </p>
            )}
            <div className="pill-row">
              <button
                className="btn btn-primary"
                onClick={comenzar}
                disabled={!listoParaIniciar || enviando}
              >
                {enviando ? 'Iniciando...' : 'Estoy listo'}
              </button>
              <button
                className="btn-arrow"
                onClick={comenzar}
                disabled={!listoParaIniciar || enviando}
                aria-hidden
                tabIndex={-1}
              >
                →
              </button>
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', fontSize: 14 }}>
            Esperando a que el creador de la sala inicie la partida...
          </p>
        )}
      </div>
    </div>
  )
}
