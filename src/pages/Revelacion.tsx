import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accionRonda } from '../lib/game'
import { useAlCumplirse, useEstadoRonda, useNumeroRonda, useRondaEnVivo } from '../lib/hooks'
import {
  TOTAL_RONDAS,
  type FragmentoArquitecto,
  type FragmentoEstructura,
  type FragmentoMateriales,
} from '../types/game'
import type { EstadoRonda } from '../lib/game'
import EstadoPill from '../components/EstadoPill'
import SectionDivider from '../components/SectionDivider'
import PantallaCargando from '../components/PantallaCargando'
import { VistaFrontalSvg, VistaLateralSvg, VistaSuperiorGrid } from '../components/Planos'

const TOTAL_JUGADORES = 4

/**
 * Revelación: la información privada del rol en esta ronda, antes de que
 * empiece a correr el tiempo. Cada jugador llega a su ritmo, pero solo el
 * creador de la sala hace pasar a todos a la planeación (que es síncrona).
 */
export default function Revelacion() {
  const navigate = useNavigate()
  const numero = useNumeroRonda()
  const { sesion, estado, error } = useEstadoRonda(numero)
  const { ronda, listos } = useRondaEnVivo(estado?.ronda ?? null)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')

  // Avisar que ya vi mi información (el creador ve cuántos van)
  useEffect(() => {
    if (estado) accionRonda(estado.ronda.id, 'vi_revelacion').catch(console.error)
  }, [estado])

  useAlCumplirse(!!ronda?.planeacion_inicio, () =>
    navigate(`/r/${numero}/planeacion`, { replace: true }),
  )

  if (!estado || !sesion) return <PantallaCargando error={error} />

  async function iniciarPlaneacion() {
    if (!estado) return
    setEnviando(true)
    setErrorEnvio('')
    try {
      await accionRonda(estado.ronda.id, 'iniciar_planeacion')
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No se pudo iniciar la planeación')
      setEnviando(false)
    }
  }

  return (
    <div className="page" style={{ gap: 20 }}>
      <h3 className="round-header__label">
        Ronda {numero} de {TOTAL_RONDAS}
      </h3>

      <div style={{ textAlign: 'center' }}>
        <h1>Revelación</h1>
        <p className="reveal-kicker">Tu información</p>
      </div>

      <div className="reveal-panel">
        <Contenido estado={estado} />
      </div>

      <div className="warning-note" role="note">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3L2 21h20z" fill="var(--lime)" stroke="var(--green)" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 10v5M12 17.5v.5" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span>No muestres esta pantalla.</span>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {errorEnvio && <p className="error-msg">{errorEnvio}</p>}
        {sesion.esHost ? (
          <>
            <p className="phase-note">
              {listos.revelacion}/{TOTAL_JUGADORES} ya vieron su información. Cuando todos estén
              listos, inicia la planeación.
            </p>
            <div className="pill-row">
              <button className="btn btn-primary" onClick={iniciarPlaneacion} disabled={enviando}>
                {enviando ? 'Iniciando...' : 'Iniciar planeación'}
              </button>
              <button
                className="btn-arrow"
                onClick={iniciarPlaneacion}
                disabled={enviando}
                aria-hidden
                tabIndex={-1}
              >
                →
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <EstadoPill texto="Esperando a que el creador de la sala inicie la planeación..." />
          </div>
        )}
      </div>
    </div>
  )
}

function Contenido({ estado }: { estado: EstadoRonda }) {
  switch (estado.miRol) {
    case 'arquitecto': {
      const { niveles } = estado.fragmento as FragmentoArquitecto
      return (
        <>
          <h3 className="reveal-panel__title">Vista frontal</h3>
          <div className="reveal-panel__figure">
            <VistaFrontalSvg niveles={niveles} maxHeight={140} />
          </div>
          <SectionDivider />
          <ul className="reveal-list">
            {niveles.map(({ nivel, piezas }) => (
              <li key={nivel}>
                Altura nivel {nivel}: <strong>{piezas} {piezas === 1 ? 'pieza' : 'piezas'}</strong>
              </li>
            ))}
          </ul>
        </>
      )
    }

    case 'explorador_estructura': {
      const f = estado.fragmento as FragmentoEstructura
      return (
        <>
          <h3 className="reveal-panel__title">Vista superior / lateral</h3>
          <div className="reveal-views">
            <figure>
              <VistaSuperiorGrid celdas={f.vista_superior} size={120} />
              <figcaption>Vista superior</figcaption>
            </figure>
            <span className="reveal-views__sep" aria-hidden />
            <figure>
              <VistaLateralSvg alturas={f.vista_lateral} />
              <figcaption>Vista lateral</figcaption>
            </figure>
          </div>
          <SectionDivider />
          <h3 className="reveal-panel__title">Orientación</h3>
          <ul className="reveal-list">
            {f.orientaciones.length === 0 && <li>Todas las piezas van en su posición natural.</li>}
            {f.orientaciones.map((o) => (
              <li key={o.codigo}>
                Pieza {o.codigo} → <strong>{o.orientacion}</strong>
              </li>
            ))}
          </ul>
          <h3 className="reveal-panel__title">Conexiones entre piezas</h3>
          <p>{f.conexiones}</p>
        </>
      )
    }

    case 'explorador_materiales': {
      const { piezas } = estado.fragmento as FragmentoMateriales
      return (
        <>
          <h3 className="reveal-panel__title">Piezas necesarias</h3>
          <div className="reveal-pieces">
            {piezas.map((p) => (
              <div key={p.codigo} className="reveal-pieces__row">
                <span className="code-chip">{p.codigo}</span>
                <strong>x{p.cantidad}</strong>
              </div>
            ))}
          </div>
          <SectionDivider />
          <h3 className="reveal-panel__title">Características</h3>
          <ul className="reveal-list">
            {piezas.map((p) => (
              <li key={p.codigo}>
                <strong>{p.codigo}</strong> — {p.descripcion.toLowerCase()}
              </li>
            ))}
          </ul>
        </>
      )
    }

    case 'constructor':
      return (
        <>
          <h3 className="reveal-panel__title">Tu función</h3>
          <p>Eres el único jugador que puede manipular las piezas físicas.</p>
          <p>Sigue las instrucciones de tus compañeros.</p>
          <SectionDivider />
          <h3 className="reveal-panel__title">Recuerda</h3>
          <ul className="reveal-list reveal-list--bullets">
            <li>No ves el plano completo</li>
            <li>No muestres la pantalla</li>
            <li>Solo tú puedes colocar piezas</li>
          </ul>
        </>
      )
  }
}
