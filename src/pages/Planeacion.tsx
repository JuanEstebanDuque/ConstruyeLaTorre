import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accionRonda, type AccionRonda } from '../lib/game'
import {
  useAlCumplirse,
  useCuentaRegresiva,
  useEstadoRonda,
  useNumeroRonda,
  useRondaEnVivo,
} from '../lib/hooks'
import { LISTOS_PARA_JUGAR, TIEMPO_PLANEACION_SEG, TOTAL_RONDAS, type Rol } from '../types/game'
import RoundHeader from '../components/RoundHeader'
import InfoCard from '../components/InfoCard'
import PantallaCargando from '../components/PantallaCargando'

const TOTAL_JUGADORES = 4

const CONSEJO: Record<Rol, string> = {
  arquitecto: 'Prepárate para contar cuántos niveles tiene la torre y cuántas piezas lleva cada uno.',
  explorador_estructura: 'Prepárate para explicar dónde va cada pieza en la base y cómo se orienta.',
  explorador_materiales: 'Prepárate para decir qué códigos de pieza se necesitan y cuántas de cada una.',
  constructor: 'Escucha, pregunta y organiza las piezas a tu alcance. Todavía no construyas.',
}

/**
 * Planeación síncrona: el reloj es el mismo para todos (cuenta desde que el
 * creador la inició). Termina al acabarse el tiempo, cuando 3 de 4 marcan
 * "Estoy listo" o cuando el creador la salta; entonces todos empiezan a jugar
 * a la vez.
 */
export default function Planeacion() {
  const navigate = useNavigate()
  const numero = useNumeroRonda()
  const { sesion, estado, error } = useEstadoRonda(numero)
  const { ronda, listos } = useRondaEnVivo(estado?.ronda ?? null)
  const restantes = useCuentaRegresiva(ronda?.planeacion_inicio, TIEMPO_PLANEACION_SEG)
  const [enviando, setEnviando] = useState<AccionRonda | null>(null)
  const [errorEnvio, setErrorEnvio] = useState('')

  // El creador aún no inicia la planeación: volver a la revelación
  useAlCumplirse(!!estado && !estado.ronda.planeacion_inicio, () =>
    navigate(`/r/${numero}/revelacion`, { replace: true }),
  )

  // Se acabó el tiempo: pedir al servidor que arranque el juego
  useAlCumplirse(!!ronda?.planeacion_inicio && restantes === 0, () => {
    if (ronda) accionRonda(ronda.id, 'fin_planeacion').catch(console.error)
  })

  // Todos pasan a jugar al mismo tiempo
  useAlCumplirse(!!ronda?.juego_inicio, () => navigate(`/r/${numero}/juego`, { replace: true }))

  if (!estado || !sesion || !ronda) return <PantallaCargando error={error} />

  async function enviar(accion: AccionRonda) {
    if (!ronda) return
    setEnviando(accion)
    setErrorEnvio('')
    try {
      await accionRonda(ronda.id, accion)
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No se pudo completar la acción')
    } finally {
      setEnviando(null)
    }
  }

  const yaListo = listos.yoListoPlaneacion || enviando === 'listo_planeacion'
  const empezando = restantes === 0 || !!ronda.juego_inicio

  return (
    <div className="page" style={{ gap: 24 }}>
      <RoundHeader
        ronda={numero}
        totalRondas={TOTAL_RONDAS}
        segundosRestantes={restantes}
        segundosTotales={TIEMPO_PLANEACION_SEG}
      />

      <div style={{ textAlign: 'center' }}>
        <h1>Planeación</h1>
        <p style={{ fontSize: 15, marginTop: 6 }}>
          Hablen en voz alta y acuerden una estrategia antes de construir. Nadie muestra su
          pantalla.
        </p>
      </div>

      <img
        src="/ImagenPlaneacion.png"
        alt=""
        aria-hidden
        style={{ width: 200, height: 200, objectFit: 'contain', alignSelf: 'center' }}
      />

      <InfoCard icon="/TuFuncionRol.png" title="Tu parte" variant="strong">
        {CONSEJO[estado.miRol]}
      </InfoCard>

      <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="ready-meter" aria-live="polite">
          <span className="ready-meter__dots" aria-hidden>
            {Array.from({ length: TOTAL_JUGADORES }, (_, i) => (
              <span key={i} className={i < listos.planeacion ? 'is-on' : ''} />
            ))}
          </span>
          <span>
            {empezando
              ? '¡A jugar!'
              : `${listos.planeacion}/${TOTAL_JUGADORES} listos · con ${LISTOS_PARA_JUGAR} empiezan todos`}
          </span>
        </div>

        {errorEnvio && <p className="error-msg">{errorEnvio}</p>}

        <div className="pill-row">
          <button
            className="btn btn-primary"
            onClick={() => enviar('listo_planeacion')}
            disabled={yaListo || empezando}
          >
            {yaListo ? 'Listo ✓ Esperando al equipo...' : 'Estoy listo'}
          </button>
          <button
            className="btn-arrow"
            onClick={() => enviar('listo_planeacion')}
            disabled={yaListo || empezando}
            aria-hidden
            tabIndex={-1}
          >
            →
          </button>
        </div>

        {sesion.esHost && (
          <button
            className="btn btn-ghost"
            onClick={() => enviar('saltar_planeacion')}
            disabled={!!enviando || empezando}
          >
            Saltar planeación y empezar
          </button>
        )}
      </div>
    </div>
  )
}
