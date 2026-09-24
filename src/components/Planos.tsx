// Dibujos de los fragmentos del plano, compartidos por Revelación y Juego.

const BLOQUE_W = 34
const BLOQUE_H = 20
const GAP = 5

/** Vista frontal: piezas por nivel, apiladas de abajo hacia arriba y centradas. */
export function VistaFrontalSvg({
  niveles,
  maxHeight = 180,
}: {
  niveles: { nivel: number; piezas: number }[]
  maxHeight?: number
}) {
  const maxPiezas = Math.max(...niveles.map((n) => n.piezas))
  const ancho = maxPiezas * BLOQUE_W + (maxPiezas - 1) * GAP
  const alto = niveles.length * BLOQUE_H + (niveles.length - 1) * GAP

  return (
    <svg
      viewBox={`-6 -6 ${ancho + 12} ${alto + 18}`}
      style={{ width: `min(100%, ${(ancho + 12) * 1.7}px)`, maxHeight }}
      role="img"
      aria-label="Vista frontal de la torre"
    >
      {niveles.map(({ nivel, piezas }) => {
        const y = alto - nivel * BLOQUE_H - (nivel - 1) * GAP
        const x0 = (ancho - (piezas * BLOQUE_W + (piezas - 1) * GAP)) / 2
        return Array.from({ length: piezas }, (_, i) => (
          <rect
            key={`${nivel}-${i}`}
            x={x0 + i * (BLOQUE_W + GAP)}
            y={y}
            width={BLOQUE_W}
            height={BLOQUE_H}
            rx={2}
            fill="var(--olive)"
            stroke="var(--olive-deep)"
            strokeWidth={1.5}
          />
        ))
      })}
      <line x1={-6} x2={ancho + 6} y1={alto + 4} y2={alto + 4} stroke="var(--cream-deep)" strokeWidth={3} />
    </svg>
  )
}

/** Vista superior: celdas de la placa base 3x3 que ocupa el primer nivel. */
export function VistaSuperiorGrid({ celdas, size = 200 }: { celdas: boolean[]; size?: number }) {
  return (
    <div
      className="top-grid"
      style={{ width: `min(${size}px, 100%)` }}
      role="img"
      aria-label="Vista superior de la base"
    >
      {celdas.map((ocupada, i) => (
        <span key={i} className={`top-grid__cell ${ocupada ? 'is-filled' : ''}`} />
      ))}
    </div>
  )
}

/** Vista lateral: altura de cada fila de la placa vista desde un costado. */
export function VistaLateralSvg({ alturas }: { alturas: number[] }) {
  const lado = 20
  const gap = 4
  const maxAlto = Math.max(1, ...alturas)
  const ancho = alturas.length * lado + (alturas.length - 1) * gap
  const alto = maxAlto * lado + (maxAlto - 1) * gap

  return (
    <svg
      viewBox={`-4 -4 ${ancho + 8} ${alto + 14}`}
      style={{ width: (ancho + 8) * 1.6, maxWidth: '100%' }}
      role="img"
      aria-label="Vista lateral de la torre"
    >
      {alturas.map((h, col) =>
        Array.from({ length: h }, (_, k) => (
          <rect
            key={`${col}-${k}`}
            x={col * (lado + gap)}
            y={alto - (k + 1) * lado - k * gap}
            width={lado}
            height={lado}
            rx={2}
            fill="var(--olive)"
            stroke="var(--olive-deep)"
            strokeWidth={1.5}
          />
        )),
      )}
      <line x1={-4} x2={ancho + 4} y1={alto + 4} y2={alto + 4} stroke="var(--cream-deep)" strokeWidth={3} />
    </svg>
  )
}
