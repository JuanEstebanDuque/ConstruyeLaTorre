import { useNavigate } from 'react-router-dom'
import { useAlCumplirse, useEstadoRonda, useNumeroRonda, useRondaEnVivo } from '../lib/hooks'
import { ROL_INFO, TOTAL_RONDAS } from '../types/game'
import Hexagons from '../components/Hexagons'
import PantallaCargando from '../components/PantallaCargando'

/** Pantalla intermedia de los roles que no validan. */
export default function Espera() {
  const navigate = useNavigate()
  const numero = useNumeroRonda()
  const { estado, error } = useEstadoRonda(numero)

  const { ronda } = useRondaEnVivo(estado?.ronda ?? null)

  useAlCumplirse(!!ronda?.validada_en, () => navigate(`/r/${numero}/resultado`, { replace: true }))

  if (!estado) return <PantallaCargando error={error} />

  const constructor = estado.jugadores.find((j) => estado.roles[j.id] === 'constructor')

  return (
    <div className="page" style={{ gap: 28, justifyContent: 'center', textAlign: 'center' }}>
      <Hexagons corner="tr" />
      <Hexagons corner="bl" />

      <h3 style={{ color: 'var(--text)' }}>
        Ronda {numero} de {TOTAL_RONDAS}
      </h3>

      <div className="wait-orbit">
        <span className="wait-orbit__ring" aria-hidden />
        <img src={ROL_INFO.constructor.imagen} alt="" aria-hidden className="wait-orbit__char" />
      </div>

      <h1>Estamos esperando a que el constructor valide la torre</h1>

      <p style={{ fontSize: 15 }}>
        {constructor
          ? `${constructor.nombre} está revisando la construcción.`
          : 'El Constructor está revisando la construcción.'}{' '}
        Cuando termine, todos verán el resultado de la ronda.
      </p>

      <span className="spinner" style={{ alignSelf: 'center' }} />
    </div>
  )
}
