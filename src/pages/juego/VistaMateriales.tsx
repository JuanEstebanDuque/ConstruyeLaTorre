import type { FragmentoMateriales } from '../../types/game'

/** Piezas necesarias: código, cantidad y descripción. */
export default function VistaMateriales({ fragmento }: { fragmento: FragmentoMateriales }) {
  return (
    <>
      <h1 style={{ textAlign: 'center' }}>Explorador de materiales</h1>
      <p className="data-subtitle">Piezas necesarias</p>

      <div className="data-list">
        {fragmento.piezas.map((p) => (
          <div key={p.codigo} className="data-row data-row--tall">
            <span className="code-chip">{p.codigo}</span>
            <span style={{ fontWeight: 800 }}>x{p.cantidad}</span>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-soft)' }}>
              {p.descripcion}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
