import type { FragmentoArquitecto } from '../../types/game'
import { VistaFrontalSvg } from '../../components/Planos'

/** Vista frontal: piezas por nivel, apiladas de abajo hacia arriba. */
export default function VistaArquitecto({ fragmento }: { fragmento: FragmentoArquitecto }) {
  const niveles = fragmento.niveles

  return (
    <>
      <h1 style={{ textAlign: 'center' }}>Vista frontal</h1>

      <div className="plan-card">
        <VistaFrontalSvg niveles={niveles} />
      </div>

      <h3 className="data-label">Alturas</h3>
      <div className="data-list">
        {niveles.map(({ nivel, piezas }) => (
          <div key={nivel} className="data-row">
            <span>Nivel {nivel}</span>
            <span className="data-row__sep">—</span>
            <span>
              {piezas} {piezas === 1 ? 'pieza' : 'piezas'}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
