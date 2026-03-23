import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  eyebrow?: string
  children: ReactNode
  aside?: ReactNode
}

export function SectionCard({ title, eyebrow, children, aside }: SectionCardProps) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <div>
          {eyebrow ? <p className="section-card__eyebrow">{eyebrow}</p> : null}
          <h3>{title}</h3>
        </div>
        {aside ? <div className="section-card__aside">{aside}</div> : null}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  )
}
