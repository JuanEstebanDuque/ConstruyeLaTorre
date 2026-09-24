import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { obtenerJugadores, obtenerSesion, limpiarSesion } from '../lib/game'
import { ROL_INFO, ROLES_EN_ORDEN, type Jugador } from '../types/game'

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Sala de espera</h2>
        <button className="btn btn-ghost btn-sm" onClick={salir}>
          Salir
        </button>
      </div>

      {/* Código de sala */}
      <div className="card" style={{ textAlign: 'center', gap: 8, display: 'flex', flexDirection: 'column' }}>
        <h3>Código de sala</h3>
        <div className="sala-code">{sesion.codigoSala}</div>
        <p style={{ fontSize: 14 }}>
          Comparte este código con tus compañeros
        </p>
      </div>

      {/* Lista de jugadores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h3>Jugadores</h3>
          <span style={{ fontSize: 13, color: 'var(--text)' }}>
            {cargando ? '...' : `${jugadores.length} / ${MAX_JUGADORES}`}
          </span>
        </div>

        {cargando && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <span className="spinner" />
          </div>
        )}

        {!cargando && (
          <>
            {ROLES_EN_ORDEN.map((rol) => {
              const jugador = jugadores.find((j) => j.rol === rol)
              const info = ROL_INFO[rol]
              return jugador ? (
                <div key={rol} className="player-row">
                  <div
                    className="player-dot"
                    style={{ background: info.color }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 15 }}>
                        {jugador.nombre}
                      </span>
                      {jugador.id === sesion.jugadorId && (
                        <span
                          className="role-badge"
                          style={{
                            background: 'rgba(245,158,11,0.15)',
                            color: 'var(--accent)',
                          }}
                        >
                          tú
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: info.color, marginTop: 2 }}>
                      {info.titulo}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={rol} className="player-slot">
                  <div
                    className="player-dot"
                    style={{ background: 'var(--border)' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--text)' }}>
                      Esperando...
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--border)', marginTop: 2 }}>
                      {info.titulo}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

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
            <button
              className="btn btn-primary"
              onClick={comenzar}
              disabled={!listoParaIniciar || enviando}
            >
              {enviando ? 'Iniciando...' : 'Comenzar partida'}
            </button>
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
