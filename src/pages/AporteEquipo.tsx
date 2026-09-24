import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerJugadores, obtenerSesion } from '../lib/game'
import { ROL_INFO, type Jugador } from '../types/game'
import InfoCard from '../components/InfoCard'
import SectionDivider from '../components/SectionDivider'

type Fase = 'votando' | 'confirmado'

export default function AporteEquipo() {
  const navigate = useNavigate()
  const sesion = obtenerSesion()

  const [companeros, setCompaneros] = useState<Jugador[]>([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [fase, setFase] = useState<Fase>('votando')

  useEffect(() => {
    if (!sesion) {
      navigate('/', { replace: true })
      return
    }
    obtenerJugadores(sesion.partidaId)
      .then((jugadores) => setCompaneros(jugadores.filter((j) => j.id !== sesion.jugadorId)))
      .catch(console.error)
      .finally(() => setCargando(false))
  }, [sesion, navigate])

  if (!sesion) return null

  function confirmarVoto() {
    if (!seleccionado) return
    setFase('confirmado')
  }

  if (fase === 'confirmado') {
    return (
      <div className="page page--vivid" style={{ gap: 24, alignItems: 'center', textAlign: 'center' }}>
        <h1 style={{ marginTop: 40 }}>Voto registrado</h1>
        <img
          src="/ImagenRondaSuperada.png"
          alt=""
          aria-hidden
          style={{ width: 200, height: 200, objectFit: 'contain' }}
        />
        <p style={{ fontSize: 15 }}>
          Tu Punto de Aporte se sumará en secreto. El ranking individual se revela al terminar la
          tercera ronda.
        </p>

        <div className="pill-row" style={{ width: '100%', marginTop: 'auto', paddingTop: 12 }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/lobby/${sesion.partidaId}`)}
          >
            Volver al lobby
          </button>
          <button
            className="btn-arrow"
            onClick={() => navigate(`/lobby/${sesion.partidaId}`)}
            aria-hidden
            tabIndex={-1}
          >
            →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text)' }}>Reconocimiento individual</h3>
        <h1 style={{ marginTop: 6 }}>Aporte de equipo</h1>
      </div>

      <InfoCard icon="/InformacionRol.png" title="Pregunta" variant="soft">
        ¿Qué compañero consideras que tuvo un aporte clave durante esta ronda?
      </InfoCard>

      <SectionDivider />

      {cargando && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <span className="spinner" />
        </div>
      )}

      {!cargando && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {companeros.map((jugador) => {
            const info = ROL_INFO[jugador.rol]
            const seleccionadoActual = seleccionado === jugador.id
            return (
              <button
                key={jugador.id}
                type="button"
                className={`player-row is-selectable ${seleccionadoActual ? 'is-selected' : ''}`}
                style={{ border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => setSeleccionado(jugador.id)}
              >
                <span className="player-dot" style={{ background: info.color }} />
                <span style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text)' }}>{jugador.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>{info.titulo}</div>
                </span>
                {seleccionadoActual && (
                  <span style={{ fontWeight: 900, color: 'var(--green)' }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-soft)', textAlign: 'center' }}>
        No puedes votar por ti mismo. Tu voto es privado.
      </p>

      <div className="pill-row" style={{ marginTop: 'auto', paddingTop: 12 }}>
        <button className="btn btn-primary" onClick={confirmarVoto} disabled={!seleccionado}>
          Confirmar voto
        </button>
        <button className="btn-arrow" onClick={confirmarVoto} disabled={!seleccionado} aria-hidden tabIndex={-1}>
          →
        </button>
      </div>
    </div>
  )
}
