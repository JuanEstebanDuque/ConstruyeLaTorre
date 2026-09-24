type HexagonsProps = {
  corner: 'tr' | 'bl'
  style?: React.CSSProperties
}

const POSITION: Record<HexagonsProps['corner'], React.CSSProperties> = {
  tr: { top: 0, right: 12 },
  bl: { bottom: 0, left: 12 },
}

export default function Hexagons({ corner, style }: HexagonsProps) {
  return (
    <svg
      className="hex-deco"
      width="76"
      height="56"
      viewBox="0 0 76 56"
      fill="none"
      style={{ ...POSITION[corner], ...style }}
    >
      <path
        d="M20 4 L34 4 L41 16 L34 28 L20 28 L13 16 Z"
        stroke="var(--olive-deep)"
        strokeWidth="1.5"
      />
      <path
        d="M40 20 L57 20 L65.5 34.5 L57 49 L40 49 L31.5 34.5 Z"
        stroke="var(--olive)"
        strokeWidth="1.5"
      />
    </svg>
  )
}
