import SectionDivider from './SectionDivider'

type RoundHeaderProps = {
  ronda: number
  totalRondas: number
  segundosRestantes: number
  segundosTotales: number
}

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function RoundHeader({
  ronda,
  totalRondas,
  segundosRestantes,
  segundosTotales,
}: RoundHeaderProps) {
  const progreso = segundosTotales > 0 ? (segundosRestantes / segundosTotales) * 100 : 0

  return (
    <div className="round-header">
      <div className="round-header__top">
        <span className="round-header__label">
          Ronda {ronda} de {totalRondas}
        </span>
        <span className="timer-chip">
          <span className="timer-chip__icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="13" r="8" stroke="var(--green)" strokeWidth="2" />
              <path d="M12 9v4l3 2" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 2h6" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          {formatTiempo(segundosRestantes)}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${progreso}%` }} />
      </div>
      <SectionDivider />
    </div>
  )
}
