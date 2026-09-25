import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerRondas } from '../lib/game'
import { useEstadoRonda, useNumeroRonda } from '../lib/hooks'
import { CONDICIONES_MINIMAS, TOTAL_RONDAS, type Ronda } from '../types/game'
import PantallaCargando from '../components/PantallaCargando'
import { listarNumeros, rondasPerdidasAntes } from '../lib/reglas'

export default function Resultado() {
  const navigate = useNavigate()
  const numero = useNumeroRonda()
  const { sesion, estado, error } = useEstadoRonda(numero)
  const [rondas, setRondas] = useState<Ronda[] | null>(null)

  useEffect(() => {
    if (!sesion) return
    obtenerRondas(sesion.partidaId).then(setRondas).catch(console.error)
  }, [sesion])

  // Si alguien llega aquí antes de la validación, vuelve a esperar
  useEffect(() => {
    if (estado && !estado.ronda.validada_en) {
      navigate(`/r/${numero}/${estado.miRol === 'constructor' ? 'validacion' : 'espera'}`, {
        replace: true,
      })
    }
  }, [estado, numero, navigate])

  if (!estado || !rondas || !estado.ronda.validada_en) return <PantallaCargando error={error} />

  const { ronda } = estado
  const superada = !!ronda.superada
  const condiciones = [
    { etiqueta: 'Torre correcta', ok: !!ronda.torre_correcta },
    { etiqueta: 'Torre estable', ok: !!ronda.torre_estable },
    { etiqueta: 'Evento cumplido', ok: !!ronda.evento_cumplido },
    { etiqueta: 'Dentro del tiempo', ok: !!ronda.dentro_tiempo },
  ]
  const perdidasAntes = rondasPerdidasAntes(rondas, numero)

  const continuar = () => navigate(`/r/${numero}/aporte`, { replace: true })

  return (
    <div
      className={`page ${superada ? 'page--vivid' : ''}`}
      style={{ gap: 22, alignItems: 'center', textAlign: 'center' }}
    >
      <h1 style={{ marginTop: 12 }}>{superada ? 'Ronda superada' : 'Ronda no superada'}</h1>

      <img
        src="/ImagenRondaSuperada.png"
        alt=""
        aria-hidden
        className={superada ? undefined : 'img-apagada'}
        style={{ width: 220, height: 220, objectFit: 'contain' }}
      />

      <p style={{ fontSize: 22, fontWeight: 900, color: superada ? 'var(--green)' : 'var(--text-soft)' }}>
        {superada ? '+1 PUNTO COLECTIVO' : '+0 PUNTOS COLECTIVOS'}
      </p>

      <div className="team-score" style={{ width: '100%' }}>
        <span>Ronda actual</span>
        <span className="team-score__value">
          {numero}/{TOTAL_RONDAS}
        </span>
      </div>

      {(!superada || perdidasAntes.length > 0) && (
        <div className="loss-note">
          {!superada && (
            <p>
              <strong>Se perdió la ronda {numero}.</strong> Se necesitaban al menos{' '}
              {CONDICIONES_MINIMAS} de las 4 condiciones.
            </p>
          )}
          {perdidasAntes.length > 0 && (
            <p>
              {perdidasAntes.length === 1 ? 'Ronda perdida' : 'Rondas perdidas'} antes:{' '}
              <strong>{listarNumeros(perdidasAntes)}</strong>
            </p>
          )}
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {condiciones.map((c) => (
          <div key={c.etiqueta} className="check-row">
            <span>{c.etiqueta}</span>
            <span className={`check-row__mark ${c.ok ? 'is-ok' : 'is-fail'}`}>{c.ok ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>

      <div className="pill-row" style={{ width: '100%', marginTop: 'auto', paddingTop: 12 }}>
        <button className="btn btn-primary" onClick={continuar}>
          Continuar
        </button>
        <button className="btn-arrow" onClick={continuar} aria-hidden tabIndex={-1}>
          →
        </button>
      </div>
    </div>
  )
}
