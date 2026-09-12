import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerSesion } from '../lib/game'
import { ROL_INFO } from '../types/game'

const REGLAS_COMUNICACION = [
  'Solo comunicación verbal — nunca mostrar la pantalla a otros',
  'No intercambiar dispositivos ni tomar capturas de pantalla',
  'Solo el Constructor puede manipular las piezas físicas',
]

export default function RoleInfo() {
  const navigate = useNavigate()
  const sesion = obtenerSesion()

  useEffect(() => {
    if (!sesion) {
      navigate('/', { replace: true })
    }
  }, [sesion, navigate])

  if (!sesion) return null

  const info = ROL_INFO[sesion.rol]

  return (
    <div className="page" style={{ gap: 28 }}>
      {/* Role header */}
      <div
        className="role-header"
        style={{
          background: `${info.color}18`,
          border: `1px solid ${info.color}40`,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 8,
            background: `${info.color}25`,
            color: info.color,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Tu rol
        </div>
        <h1 style={{ color: info.color, marginBottom: 10 }}>{info.titulo}</h1>
        <p style={{ fontSize: 16, color: 'var(--text-h)', lineHeight: 1.5 }}>{info.resumen}</p>
      </div>

      {/* Qué ves */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3>Lo que ves cada ronda</h3>
        <ul className="info-list">
          {info.veEn.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Responsabilidad */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3>Tu responsabilidad</h3>
        <p style={{ fontSize: 15, color: 'var(--text-h)', lineHeight: 1.5 }}>
          {info.responsabilidad}
        </p>
      </div>

      {/* Reglas de comunicación */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3>Reglas de comunicación</h3>
        <div className="card" style={{ padding: '8px 20px' }}>
          {REGLAS_COMUNICACION.map((regla) => (
            <div key={regla} className="rule-item">
              <span className="rule-x">✕</span>
              <span style={{ color: 'var(--text-h)', fontSize: 14 }}>{regla}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', textAlign: 'center' }}>
        <p style={{ fontSize: 14, marginBottom: 16 }}>
          La partida comenzará cuando el Arquitecto dé la señal. ¡Prepárate!
        </p>
        <button
          className="btn btn-ghost"
          onClick={() => {
            navigate(`/lobby/${sesion.partidaId}`)
          }}
        >
          Volver al lobby
        </button>
      </div>
    </div>
  )
}
