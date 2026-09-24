import { useNavigate } from 'react-router-dom'
import { useEstadoRonda, useNumeroRonda } from '../lib/hooks'
import { ROL_INFO } from '../types/game'
import Hexagons from '../components/Hexagons'
import InfoCard from '../components/InfoCard'
import SectionDivider from '../components/SectionDivider'
import PantallaCargando from '../components/PantallaCargando'

export default function RoleInfo() {
  const navigate = useNavigate()
  const numero = useNumeroRonda()
  const { estado, error } = useEstadoRonda(numero)

  if (!estado) return <PantallaCargando error={error} />

  const info = ROL_INFO[estado.miRol]
  const esConstructor = estado.miRol === 'constructor'
  const siguiente = () => navigate(`/r/${numero}/revelacion`)

  return (
    <div className="page" style={{ gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontWeight: 400, color: 'var(--text)' }}>
          Ronda {numero} · {numero === 1 ? 'Tu rol es...' : 'Tu nuevo rol es...'}
        </h3>
      </div>

      <div className="role-portrait">
        <Hexagons corner="tr" style={{ top: -10, right: -10 }} />
        <img className="role-portrait__bg" src="/FondoRol.png" alt="" aria-hidden />
        <img className="role-portrait__char" src={info.imagen} alt={info.personaje.nombre} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 26 }}>{info.titulo.toUpperCase()}</h1>
        <p className="role-character">
          {info.personaje.nombre}, {info.personaje.epiteto}
        </p>
      </div>

      <SectionDivider />

      <InfoCard icon="/InformacionRol.png" title="Información" variant="soft">
        {info.informacion}
      </InfoCard>

      <InfoCard icon="/TuFuncionRol.png" title="Tu función" variant="strong">
        {info.funcion}
      </InfoCard>

      <InfoCard icon="/RecuerdaRol.png" title="Recuerda" variant="white">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>✗ No muestres tu pantalla</span>
          {esConstructor ? (
            <span>✓ Eres el único que puede tocar piezas</span>
          ) : (
            <span>✗ No puedes tocar piezas</span>
          )}
          <span>✓ Comunica verbalmente</span>
        </div>
      </InfoCard>

      <div style={{ marginTop: 'auto', paddingTop: 12 }} className="pill-row">
        <button className="btn btn-primary" onClick={siguiente}>
          Entendido
        </button>
        <button className="btn-arrow" onClick={siguiente} aria-hidden tabIndex={-1}>
          →
        </button>
      </div>
    </div>
  )
}
