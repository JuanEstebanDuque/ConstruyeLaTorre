import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAlCumplirse,
  useCuentaRegresiva,
  useEstadoRonda,
  useNumeroRonda,
  useRondaEnVivo,
} from '../../lib/hooks'
import {
  TIEMPO_CONSTRUCCION_SEG,
  TOTAL_RONDAS,
  type Evento,
  type FragmentoArquitecto,
  type FragmentoEstructura,
  type FragmentoMateriales,
} from '../../types/game'
import RoundHeader from '../../components/RoundHeader'
import SectionDivider from '../../components/SectionDivider'
import InfoCard from '../../components/InfoCard'
import EstadoPill, { IconoDestello } from '../../components/EstadoPill'
import PantallaCargando from '../../components/PantallaCargando'
import VistaArquitecto from './VistaArquitecto'
import VistaEstructura from './VistaEstructura'
import VistaMateriales from './VistaMateriales'

/** El evento aparece cuando ha pasado este porcentaje del tiempo de construcción. */
const EVENTO_TRAS = 0.4
const SEGUNDOS_EVENTO = Math.round(TIEMPO_CONSTRUCCION_SEG * (1 - EVENTO_TRAS))

export default function Juego() {
  const navigate = useNavigate()
  const numero = useNumeroRonda()
  const { estado, error } = useEstadoRonda(numero)
  const { ronda } = useRondaEnVivo(estado?.ronda ?? null)
  // Todos empiezan en juego_inicio; desde ahí cada reloj corre por su cuenta
  const restantes = useCuentaRegresiva(ronda?.juego_inicio, TIEMPO_CONSTRUCCION_SEG)
  const esConstructor = estado?.miRol === 'constructor'

  // Aún no empieza el juego (la planeación sigue): volver a planeación
  useAlCumplirse(!!estado && !estado.ronda.juego_inicio, () =>
    navigate(`/r/${numero}/planeacion`, { replace: true }),
  )

  // Si el Constructor valida mientras sigo aquí, paso directo al resultado
  useAlCumplirse(!esConstructor && !!ronda?.validada_en, () =>
    navigate(`/r/${numero}/resultado`, { replace: true }),
  )

  // Fin de mi tiempo: el Constructor pasa a validar; los demás esperan
  useEffect(() => {
    if (!estado || !ronda?.juego_inicio || restantes > 0) return
    navigate(`/r/${numero}/${esConstructor ? 'validacion' : 'espera'}`, { replace: true })
  }, [estado, ronda?.juego_inicio, restantes, esConstructor, numero, navigate])

  if (!estado) return <PantallaCargando error={error} />

  const evento = estado.evento && restantes <= SEGUNDOS_EVENTO ? estado.evento : null
  // Segundos que le quedan al efecto del evento (silencio / plano perdido)
  const efectoRestante = evento?.duracion
    ? Math.max(0, evento.duracion - (SEGUNDOS_EVENTO - restantes))
    : 0
  const planoOculto = evento?.tipo === 'plano_perdido' && efectoRestante > 0

  return (
    <div className="page" style={{ gap: 22 }}>
      <RoundHeader
        ronda={numero}
        totalRondas={TOTAL_RONDAS}
        segundosRestantes={restantes}
        segundosTotales={TIEMPO_CONSTRUCCION_SEG}
      />

      {evento && <TarjetaEvento evento={evento} efectoRestante={efectoRestante} />}

      {planoOculto ? (
        <div className="plan-card plan-card--lost">
          <p style={{ fontWeight: 800 }}>Tu información desapareció</p>
          <p style={{ fontSize: 14 }}>Vuelve en {efectoRestante} s</p>
        </div>
      ) : (
        <>
          {estado.miRol === 'arquitecto' && (
            <VistaArquitecto fragmento={estado.fragmento as FragmentoArquitecto} />
          )}
          {estado.miRol === 'explorador_estructura' && (
            <VistaEstructura fragmento={estado.fragmento as FragmentoEstructura} />
          )}
          {estado.miRol === 'explorador_materiales' && (
            <VistaMateriales fragmento={estado.fragmento as FragmentoMateriales} />
          )}
        </>
      )}

      {esConstructor ? (
        <>
          <div>
            <h1 style={{ textAlign: 'center', textTransform: 'uppercase' }}>Constructor</h1>
            <p style={{ fontSize: 16, marginTop: 14 }}>
              Tú eres el único jugador que puede manipular las piezas físicas.
            </p>
            <p style={{ fontSize: 16, marginTop: 8 }}>Sigue las instrucciones de tus compañeros.</p>
          </div>
          <SectionDivider />
          <div className="status-inline">
            <IconoDestello size={26} />
            <span>Estado: Construyendo...</span>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 12 }} className="pill-row">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/r/${numero}/validacion`, { replace: true })}
            >
              Validar construcción
            </button>
            <button
              className="btn-arrow"
              onClick={() => navigate(`/r/${numero}/validacion`, { replace: true })}
              aria-hidden
              tabIndex={-1}
            >
              →
            </button>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', justifyContent: 'center' }}>
          <EstadoPill texto="Estado: Construyendo..." />
        </div>
      )}
    </div>
  )
}

function TarjetaEvento({ evento, efectoRestante }: { evento: Evento; efectoRestante: number }) {
  return (
    <div className="event-card">
      <InfoCard icon="/ImagenEvento.png" title={`Evento · ${evento.titulo}`} variant="white">
        {evento.descripcion}
        {evento.duracion ? (
          <strong style={{ display: 'block', marginTop: 6 }}>
            {efectoRestante > 0 ? `Quedan ${efectoRestante} s` : 'El efecto terminó'}
          </strong>
        ) : null}
        <span style={{ display: 'block', marginTop: 6, fontSize: 13, color: 'var(--text-soft)' }}>
          Solo tú ves este evento.
        </span>
      </InfoCard>
    </div>
  )
}
