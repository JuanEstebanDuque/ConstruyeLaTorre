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
    <div className="page page--hero">
      <img className="hero-bg" src="/FondoScreen.png" alt="" aria-hidden />
      <div className="hero-content">
        <img
          src="/LogoLargo.svg"
          alt="Polis — Construye la torre"
          style={{ width: '100%', maxWidth: 280 }}
        />

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="pill-row">
            <button className="btn btn-primary" onClick={() => navigate('/crear')}>
              Crear partida
            </button>
            <button className="btn-arrow" onClick={() => navigate('/crear')} aria-label="Crear partida">
              →
            </button>
          </div>
          <div className="pill-row">
            <button className="btn btn-primary" onClick={() => navigate('/unirse')}>
              Unirse a la partida
            </button>
            <button className="btn-arrow" onClick={() => navigate('/unirse')} aria-label="Unirse a la partida">
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
