import type { FragmentoEstructura } from '../../types/game'
import { VistaSuperiorGrid } from '../../components/Planos'

/** Vista superior: qué celdas de la placa base 3x3 ocupa el primer nivel. */
export default function VistaEstructura({ fragmento }: { fragmento: FragmentoEstructura }) {
  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <h1>Explorador de estructura</h1>
        <p className="data-subtitle" style={{ marginTop: 10 }}>
          Vista superior
        </p>
      </div>

      <div className="plan-card">
        <VistaSuperiorGrid celdas={fragmento.vista_superior} />
      </div>

      <h3 className="data-label">Orientación</h3>
      <div className="data-list">
        {fragmento.orientaciones.length === 0 && (
          <div className="data-row">Todas las piezas van en su posición natural</div>
        )}
        {fragmento.orientaciones.map((o) => (
          <div key={o.codigo} className="data-row">
            Pieza {o.codigo} → {o.orientacion}
          </div>
        ))}
      </div>
    </>
  )
}
