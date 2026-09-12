import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerSesion } from '../lib/game'

export default function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    const sesion = obtenerSesion()
    if (sesion) {
      navigate(`/lobby/${sesion.partidaId}`, { replace: true })
    }
  }, [navigate])

  return (
    <div className="page" style={{ justifyContent: 'center', gap: 48 }}>
      <header style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            background: 'var(--accent)',
            borderRadius: 18,
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-dark)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="2" width="6" height="3" rx="1" />
            <rect x="6" y="5" width="12" height="3" rx="1" />
            <rect x="3" y="8" width="18" height="3" rx="1" />
            <rect x="4" y="11" width="16" height="3" rx="1" />
            <rect x="5" y="14" width="14" height="3" rx="1" />
            <rect x="3" y="17" width="18" height="3" rx="1" />
          </svg>
        </div>
        <h1 style={{ marginBottom: 10 }}>Construye la Torre</h1>
        <p style={{ fontSize: 15 }}>
          4 jugadores · información fragmentada · solo comunicación verbal
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate('/crear')}>
          Crear partida
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/unirse')}>
          Unirse con código
        </button>
      </div>
    </div>
  )
}
