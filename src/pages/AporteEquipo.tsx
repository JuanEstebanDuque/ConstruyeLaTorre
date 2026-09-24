import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { avanzarRonda, votarAporte } from '../lib/game'
import { useEstadoRonda, useNumeroRonda } from '../lib/hooks'
import { ROL_INFO, TOTAL_RONDAS } from '../types/game'
import Hexagons from '../components/Hexagons'
import SectionDivider from '../components/SectionDivider'
import PantallaCargando from '../components/PantallaCargando'

export default function AporteEquipo() {
  const navigate = useNavigate()
  const numero = useNumeroRonda()
  const { sesion, estado, error } = useEstadoRonda(numero)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')

  if (!estado || !sesion) return <PantallaCargando error={error} />

  const companeros = estado.jugadores.filter((j) => j.id !== sesion.jugadorId)

  async function enviar() {
    if (!estado || !sesion || !seleccionado) return
    setEnviando(true)
    setErrorEnvio('')
    try {
      await votarAporte(estado.ronda.id, seleccionado)
      if (numero < TOTAL_RONDAS) {
        await avanzarRonda(sesion.partidaId, numero)
        navigate(`/r/${numero + 1}/rol`, { replace: true })
      } else {
        navigate('/final', { replace: true })
      }
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No se pudo enviar el voto')
      setEnviando(false)
    }
  }

  return (
    <div className="page" style={{ gap: 24 }}>
      <Hexagons corner="tr" />

      <div>
        <h3 style={{ color: 'var(--text-soft)' }}>
          Ronda {numero} de {TOTAL_RONDAS}
        </h3>
        <h1 style={{ marginTop: 6 }}>Aporte del equipo</h1>
        <p style={{ fontSize: 16, marginTop: 12 }}>
          ¿Qué compañero consideras que tuvo un aporte clave durante esta ronda?
        </p>
      </div>

      <div className="vote-list" role="radiogroup" aria-label="Compañeros">
        {companeros.map((jugador) => {
          const rol = estado.roles[jugador.id]
          const activo = seleccionado === jugador.id
          return (
            <button
              key={jugador.id}
              type="button"
              role="radio"
              aria-checked={activo}
              className={`vote-option ${activo ? 'is-selected' : ''}`}
              onClick={() => setSeleccionado(jugador.id)}
              disabled={enviando}
            >
              <span className="vote-option__radio" aria-hidden />
              <span>
                <span className="vote-option__name">{jugador.nombre}</span>
                <span className="vote-option__role">{rol ? ROL_INFO[rol].titulo : ''}</span>
              </span>
            </button>
          )
        })}
      </div>

      <SectionDivider />

      <p style={{ fontStyle: 'italic', color: 'var(--text-soft)' }}>Tu voto es privado.</p>

      {errorEnvio && <p className="error-msg">{errorEnvio}</p>}

      <div className="pill-row" style={{ marginTop: 'auto', paddingTop: 12 }}>
        <button className="btn btn-primary" onClick={enviar} disabled={!seleccionado || enviando}>
          {enviando ? 'Enviando...' : 'Enviar voto'}
        </button>
        <button
          className="btn-arrow"
          onClick={enviar}
          disabled={!seleccionado || enviando}
          aria-hidden
          tabIndex={-1}
        >
          →
        </button>
      </div>
    </div>
  )
}
