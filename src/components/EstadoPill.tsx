export function IconoDestello({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 2l1.6 4.9L20.5 8.5l-4.9 1.6L14 15l-1.6-4.9L7.5 8.5l4.9-1.6z" />
      <path d="M6 13l1 2.9 2.9 1.1L7 18l-1 3-1-3-2.9-1L5 15.9z" />
    </svg>
  )
}

/** Indicador "Estado: Construyendo..." de las pantallas de juego. */
export default function EstadoPill({ texto }: { texto: string }) {
  return (
    <div className="status-pill">
      <IconoDestello />
      <span>{texto}</span>
    </div>
  )
}
