import type { ReactNode } from 'react'

export interface SectionProps {
  /** Two-digit index shown in the accent-free mono kicker, e.g. "01". */
  index: string
  /** Kicker text. Rendered upper-case and letter-spaced by CSS, not by the caller. */
  kicker: string
  /** Serif display heading. */
  title: string
  /** Optional mono line under the title. One sentence. */
  standfirst?: string
  children: ReactNode
}

/** The section heading pattern: mono index, mono kicker, serif title, optional standfirst. */
export function Section({ index, kicker, title, standfirst, children }: SectionProps): ReactNode {
  return (
    <section className="section">
      <p className="section__kicker">
        <span className="section__kicker-index">{index}</span>
        <span>{kicker}</span>
      </p>
      <h2 className="section__title">{title}</h2>
      {standfirst ? <p className="section__standfirst">{standfirst}</p> : null}
      <div className="section__body">{children}</div>
    </section>
  )
}
