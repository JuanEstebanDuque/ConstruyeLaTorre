import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerSesion } from '../lib/game'
import RoundHeader from '../components/RoundHeader'

const TIEMPO_RONDA_SEG = 180

type Fase = 'lista' | 'validando' | 'resultado'

type Condicion = {
  etiqueta: string
  cumplida: boolean
}

export default function Validacion() {
  const navigate = useNavigate()
  const sesion = obtenerSesion()

  const [fase, setFase] = useState<Fase>('lista')
  const [segundosRestantes, setSegundosRestantes] = useState(TIEMPO_RONDA_SEG)

  useEffect(() => {
    if (!sesion) {
      navigate('/', { replace: true })
    }
  }, [sesion, navigate])

  useEffect(() => {
    if (fase !== 'lista') return
    const intervalo = setInterval(() => {
      setSegundosRestantes((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(intervalo)
  }, [fase])

  if (!sesion) return null

  function validarConstruccion() {
    setFase('validando')
    setTimeout(() => setFase('resultado'), 1800)
  }

  const condiciones: Condicion[] = [
    { etiqueta: 'Torre correcta', cumplida: true },
    { etiqueta: 'Torre estable', cumplida: true },
    { etiqueta: 'Evento cumplido', cumplida: true },
    { etiqueta: 'Dentro del tiempo', cumplida: segundosRestantes > 0 },
  ]
  const rondaSuperada = condiciones.every((c) => c.cumplida)

  if (fase === 'resultado') {
    return (
      <div className="page page--vivid" style={{ gap: 24, alignItems: 'center', textAlign: 'center' }}>
        <h1 style={{ marginTop: 12 }}>{rondaSuperada ? 'Ronda superada' : 'Ronda no superada'}</h1>

        <img
          src="/ImagenRondaSuperada.png"
          alt=""
          aria-hidden
          style={{ width: 220, height: 220, objectFit: 'contain' }}
        />

        <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--green)' }}>
          {rondaSuperada ? '+1 PUNTO COLECTIVO' : '+0 PUNTOS COLECTIVOS'}
        </p>

        <div className="team-score" style={{ width: '100%' }}>
          <span>Marcador del equipo</span>
          <span className="team-score__value">{rondaSuperada ? '1' : '0'}/3</span>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {condiciones.map((c) => (
            <div key={c.etiqueta} className="check-row">
              <span>{c.etiqueta}</span>
              <span className={`check-row__mark ${c.cumplida ? 'is-ok' : 'is-fail'}`}>
                {c.cumplida ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>

        <div className="pill-row" style={{ width: '100%', marginTop: 'auto', paddingTop: 12 }}>
          <button className="btn btn-primary" onClick={() => navigate('/aporte')}>
            Continuar
          </button>
          <button className="btn-arrow" onClick={() => navigate('/aporte')} aria-hidden tabIndex={-1}>
            →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ gap: 24 }}>
      <RoundHeader
        ronda={1}
        totalRondas={3}
        segundosRestantes={segundosRestantes}
        segundosTotales={TIEMPO_RONDA_SEG}
      />

      <div style={{ textAlign: 'center' }}>
        <h1>Validación</h1>
        <p style={{ fontSize: 15, marginTop: 6 }}>
          {fase === 'validando'
            ? 'Verificando piezas, estabilidad y condiciones activas...'
            : 'Ubica la torre dentro del área de validación y confirma cuando esté lista.'}
        </p>
      </div>

      <div className="scan-frame">
        <span className="scan-frame__corner scan-frame__corner--tl" />
        <span className="scan-frame__corner scan-frame__corner--tr" />
        <span className="scan-frame__corner scan-frame__corner--bl" />
        <span className="scan-frame__corner scan-frame__corner--br" />
        {fase === 'validando' && <span className="scan-frame__sweep" />}
        <span style={{ fontWeight: 800, color: 'var(--text-soft)' }}>
          {fase === 'validando' ? 'Validando...' : 'Torre'}
        </span>
      </div>

      <div className="pill-row" style={{ marginTop: 'auto', paddingTop: 12 }}>
        <button
          className="btn btn-primary"
          onClick={validarConstruccion}
          disabled={fase === 'validando'}
        >
          {fase === 'validando' ? 'Validando...' : 'Validar construcción'}
        </button>
        <button
          className="btn-arrow"
          onClick={validarConstruccion}
          disabled={fase === 'validando'}
          aria-hidden
          tabIndex={-1}
        >
          →
        </button>
      </div>
    </div>
  )
}
