import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { obtenerSesion } from '../lib/game'
import { AVISO_PARTIDA_EXPIRADA } from '../lib/hooks'

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const partidaExpirada =
    (location.state as { aviso?: string } | null)?.aviso === AVISO_PARTIDA_EXPIRADA

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
          {partidaExpirada && (
            <div className="info-card info-card--white" role="status">
              <div>
                <div className="info-card__title">Partida expirada</div>
                <div className="info-card__body">
                  Se cerró tras 1 hora sin actividad. Crea una nueva o únete a otra.
                </div>
              </div>
            </div>
          )}
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
