import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validarRonda } from '../lib/game'
import { segundosRestantes, useEstadoRonda, useNumeroRonda } from '../lib/hooks'
import { TIEMPO_CONSTRUCCION_SEG, TOTAL_RONDAS } from '../types/game'
import RoundHeader from '../components/RoundHeader'
import PantallaCargando from '../components/PantallaCargando'

type Respuesta = boolean | null

/** Solo el Constructor. Es su pantalla intermedia: los demás esperan su resultado. */
export default function Validacion() {
  const navigate = useNavigate()
  const numero = useNumeroRonda()
  const { estado, error } = useEstadoRonda(numero)

  // El reloj se detiene al entrar a validar: eso define "dentro del tiempo".
  // `estado` se carga una sola vez, así que el valor queda congelado.
  const restantes = useMemo(
    () =>
      estado ? segundosRestantes(estado.ronda.juego_inicio, TIEMPO_CONSTRUCCION_SEG) : TIEMPO_CONSTRUCCION_SEG,
    [estado],
  )
  const [correcta, setCorrecta] = useState<Respuesta>(null)
  const [estable, setEstable] = useState<Respuesta>(null)
  const [eventoOk, setEventoOk] = useState<Respuesta>(null)
  const [validando, setValidando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')

  useEffect(() => {
    if (!estado) return
    if (estado.miRol !== 'constructor') {
      navigate(`/r/${numero}/espera`, { replace: true })
    } else if (estado.ronda.validada_en) {
      navigate(`/r/${numero}/resultado`, { replace: true })
    }
  }, [estado, numero, navigate])

  if (!estado) return <PantallaCargando error={error} />

  const hayEvento = !!estado.ronda.evento_tipo
  const dentroTiempo = restantes > 0
  const completo = correcta !== null && estable !== null && (!hayEvento || eventoOk !== null)

  async function validar() {
    if (!estado || !completo) return
    setValidando(true)
    setErrorEnvio('')
    try {
      await Promise.all([
        validarRonda(estado.ronda.id, {
          torreCorrecta: !!correcta,
          torreEstable: !!estable,
          eventoCumplido: hayEvento ? !!eventoOk : true,
          dentroTiempo,
        }),
        new Promise((r) => setTimeout(r, 1800)), // deja ver el escaneo
      ])
      navigate(`/r/${numero}/resultado`, { replace: true })
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No se pudo validar')
      setValidando(false)
    }
  }

  return (
    <div className="page" style={{ gap: 22 }}>
      <RoundHeader
        ronda={numero}
        totalRondas={TOTAL_RONDAS}
        segundosRestantes={restantes}
        segundosTotales={TIEMPO_CONSTRUCCION_SEG}
      />

      <div style={{ textAlign: 'center' }}>
        <h1>Validación</h1>
        <p style={{ fontSize: 15, marginTop: 6 }}>
          {validando
            ? 'Verificando piezas, estabilidad y condiciones activas...'
            : 'Revisa la torre con tu equipo y responde antes de validar.'}
        </p>
      </div>

      <div className="scan-frame scan-frame--short">
        <span className="scan-frame__corner scan-frame__corner--tl" />
        <span className="scan-frame__corner scan-frame__corner--tr" />
        <span className="scan-frame__corner scan-frame__corner--bl" />
        <span className="scan-frame__corner scan-frame__corner--br" />
        {validando && <span className="scan-frame__sweep" />}
        <span style={{ fontWeight: 800, color: 'var(--text-soft)' }}>
          {validando ? 'Validando...' : 'Torre'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Pregunta
          texto="¿La torre coincide con el plano?"
          valor={correcta}
          onChange={setCorrecta}
          disabled={validando}
        />
        <Pregunta
          texto="¿La torre quedó estable?"
          valor={estable}
          onChange={setEstable}
          disabled={validando}
        />
        {hayEvento ? (
          <Pregunta
            texto="¿Cumplieron el evento?"
            valor={eventoOk}
            onChange={setEventoOk}
            disabled={validando}
          />
        ) : (
          <div className="check-row">
            <span>
              Evento cumplido <small style={{ color: 'var(--text-soft)' }}>(sin evento)</small>
            </span>
            <span className="check-row__mark is-ok">✓</span>
          </div>
        )}
        <div className="check-row">
          <span>Dentro del tiempo</span>
          <span className={`check-row__mark ${dentroTiempo ? 'is-ok' : 'is-fail'}`}>
            {dentroTiempo ? '✓' : '✗'}
          </span>
        </div>
      </div>

      {errorEnvio && <p className="error-msg">{errorEnvio}</p>}

      <div className="pill-row" style={{ marginTop: 'auto', paddingTop: 12 }}>
        <button className="btn btn-primary" onClick={validar} disabled={!completo || validando}>
          {validando ? 'Validando...' : 'Validar construcción'}
        </button>
        <button
          className="btn-arrow"
          onClick={validar}
          disabled={!completo || validando}
          aria-hidden
          tabIndex={-1}
        >
          →
        </button>
      </div>
    </div>
  )
}

function Pregunta({
  texto,
  valor,
  onChange,
  disabled,
}: {
  texto: string
  valor: Respuesta
  onChange: (v: boolean) => void
  disabled: boolean
}) {
  return (
    <div className="check-row">
      <span>{texto}</span>
      <span className="yes-no" role="group" aria-label={texto}>
        <button
          type="button"
          className={`yes-no__btn ${valor === true ? 'is-yes' : ''}`}
          onClick={() => onChange(true)}
          disabled={disabled}
          aria-pressed={valor === true}
        >
          Sí
        </button>
        <button
          type="button"
          className={`yes-no__btn ${valor === false ? 'is-no' : ''}`}
          onClick={() => onChange(false)}
          disabled={disabled}
          aria-pressed={valor === false}
        >
          No
        </button>
      </span>
    </div>
  )
}
