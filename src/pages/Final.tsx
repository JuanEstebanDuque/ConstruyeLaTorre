import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  contarVotos,
  limpiarSesion,
  obtenerRanking,
  obtenerRondas,
  type PuestoRanking,
} from '../lib/game'
import { INTERVALO_SONDEO_MS, useSesion } from '../lib/hooks'
import { RONDAS_PARA_GANAR, TOTAL_RONDAS, type Ronda } from '../types/game'
import Hexagons from '../components/Hexagons'
import PantallaCargando from '../components/PantallaCargando'

const TOTAL_JUGADORES = 4

export default function Final() {
  const navigate = useNavigate()
  const sesion = useSesion()
  const [rondas, setRondas] = useState<Ronda[] | null>(null)
  const [ranking, setRanking] = useState<PuestoRanking[]>([])
  const [votosFinales, setVotosFinales] = useState(0)
  const [error, setError] = useState('')

  // El ranking se completa cuando los 4 votan en la última ronda: se refresca
  // hasta que estén todos los votos.
  useEffect(() => {
    if (!sesion) return
    let activo = true
    let intervalo: ReturnType<typeof setInterval> | undefined

    async function cargar() {
      try {
        const rs = await obtenerRondas(sesion!.partidaId)
        const ultima = rs.find((r) => r.numero === TOTAL_RONDAS)
        const [rk, votos] = await Promise.all([
          obtenerRanking(sesion!.partidaId),
          ultima ? contarVotos(ultima.id) : Promise.resolve(0),
        ])
        if (!activo) return
        setRondas(rs)
        setRanking(rk)
        setVotosFinales(votos)
        if (votos >= TOTAL_JUGADORES) clearInterval(intervalo)
      } catch (err) {
        if (activo) setError(err instanceof Error ? err.message : String(err))
      }
    }

    cargar()
    intervalo = setInterval(cargar, INTERVALO_SONDEO_MS)
    return () => {
      activo = false
      clearInterval(intervalo)
    }
  }, [sesion])

  if (!rondas) return <PantallaCargando error={error} />

  const superadas = rondas.filter((r) => r.superada).length
  const perdidas = rondas.filter((r) => r.validada_en && !r.superada).map((r) => r.numero)
  const victoria = superadas >= RONDAS_PARA_GANAR
  const faltanVotos = TOTAL_JUGADORES - votosFinales

  function salir() {
    limpiarSesion()
    navigate('/', { replace: true })
  }

  return (
    <div
      className={`page ${victoria ? 'page--vivid' : ''}`}
      style={{ gap: 22, alignItems: 'center', textAlign: 'center' }}
    >
      <Hexagons corner="tr" />

      <h1 className="final-title" style={{ marginTop: 20 }}>
        {victoria ? '¡Victoria!' : 'Derrota'}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ color: 'var(--text)' }}>
          {superadas} de {TOTAL_RONDAS} rondas superadas
        </h3>
        <p style={{ fontSize: 15 }}>
          {victoria
            ? 'El equipo construyó la torre. ¡La comunicación funcionó!'
            : `Se necesitaban al menos ${RONDAS_PARA_GANAR} rondas superadas.`}
        </p>
      </div>

      <div className="team-score" style={{ width: '100%' }}>
        <span>Puntos colectivos</span>
        <span className="team-score__value">{superadas}</span>
      </div>

      {perdidas.length > 0 && (
        <div className="loss-note" style={{ width: '100%' }}>
          <p>
            {perdidas.length === 1 ? 'Ronda perdida' : 'Rondas perdidas'}:{' '}
            <strong>{perdidas.join(', ')}</strong>
          </p>
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ textAlign: 'left', color: 'var(--text)' }}>Puntos de aporte</h3>
        {ranking.map((p) => {
          const puesto = ranking.findIndex((q) => q.puntos === p.puntos) + 1
          return (
            <div
              key={p.jugador_id}
              className={`rank-row ${puesto === 1 ? 'is-first' : ''}`}
            >
              <span className="rank-row__pos">{puesto === 1 ? <Corona /> : puesto}</span>
              <span className="rank-row__name">
                {p.nombre}
                {p.jugador_id === sesion?.jugadorId && (
                  <span style={{ opacity: 0.6, fontWeight: 600 }}> (tú)</span>
                )}
              </span>
              <span className="rank-row__pts">
                {p.puntos} {p.puntos === 1 ? 'pt' : 'pts'}
              </span>
            </div>
          )
        })}
        {faltanVotos > 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
            <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, marginRight: 6, verticalAlign: -1 }} />
            Esperando {faltanVotos} {faltanVotos === 1 ? 'voto' : 'votos'} de la última ronda...
          </p>
        )}
      </div>

      <div className="pill-row" style={{ width: '100%', marginTop: 'auto', paddingTop: 12 }}>
        <button className="btn btn-primary" onClick={salir}>
          Volver al inicio
        </button>
        <button className="btn-arrow" onClick={salir} aria-hidden tabIndex={-1}>
          →
        </button>
      </div>
    </div>
  )
}

function Corona() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-label="Primer lugar">
      <path
        d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"
        fill="var(--lime)"
        stroke="var(--green)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
