import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { obtenerJugadores, obtenerSesion, limpiarSesion } from '../lib/game'
import { ROL_INFO, ROLES_EN_ORDEN, type Jugador } from '../types/game'
import Hexagons from '../components/Hexagons'
import InfoCard from '../components/InfoCard'
import SectionDivider from '../components/SectionDivider'

const MAX_JUGADORES = 4

export default function Lobby() {
  const { partidaId } = useParams<{ partidaId: string }>()
  const navigate = useNavigate()
  const sesion = obtenerSesion()

  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const canalRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Redirigir si no hay sesión válida
  useEffect(() => {
    if (!sesion || sesion.partidaId !== partidaId) {
      navigate('/', { replace: true })
    }
  }, [sesion, partidaId, navigate])

  useEffect(() => {
    if (!partidaId || !sesion) return

    // Carga inicial
    obtenerJugadores(partidaId)
      .then(setJugadores)
      .catch(console.error)
      .finally(() => setCargando(false))

    // Canal Realtime: nuevos jugadores + señal de inicio
    const canal = supabase
      .channel(`lobby-${partidaId}`)
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
      .on('broadcast', { event: 'iniciar' }, () => {
        navigate('/rol', { replace: true })
      })
      .subscribe()

    canalRef.current = canal

    return () => {
      supabase.removeChannel(canal)
    }
  }, [partidaId, sesion, navigate])

  async function comenzar() {
    setEnviando(true)
    try {
      if (canalRef.current) {
        await canalRef.current.send({
          type: 'broadcast',
          event: 'iniciar',
          payload: {},
        })
      }
      navigate('/rol', { replace: true })
    } catch (err) {
      console.error(err)
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
            {ROLES_EN_ORDEN.map((rol) => {
              const jugador = jugadores.find((j) => j.rol === rol)
              const info = ROL_INFO[rol]
              return jugador ? (
                <div key={rol} className="player-row">
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
                <div key={rol} className="player-slot">
                  <span style={{ fontSize: 14, color: 'var(--text-soft)' }}>
                    Esperando {info.titulo}...
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
            Esperando a que el Arquitecto inicie la partida...
          </p>
        )}
      </div>
    </div>
  )
}
