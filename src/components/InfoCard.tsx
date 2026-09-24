type InfoCardProps = {
  icon: string
  title: string
  variant?: 'soft' | 'strong' | 'white'
  children: React.ReactNode
}

export default function InfoCard({ icon, title, variant = 'soft', children }: InfoCardProps) {
  return (
    <div className={`info-card info-card--${variant}`}>
      <img className="info-card__icon" src={icon} alt="" aria-hidden />
      <div>
        <div className="info-card__title">{title}</div>
        <div className="info-card__body">{children}</div>
      </div>
    </div>
  )
}
