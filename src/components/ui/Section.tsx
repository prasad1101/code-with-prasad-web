import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

type Props = {
  id: string
  eyebrow: string
  title: ReactNode
  intro?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ id, eyebrow, title, intro, children, className = '' }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`relative py-20 sm:py-28 ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-12 max-w-2xl">
          <p className="text-accent-2 mb-3 font-mono text-xs tracking-[0.2em] uppercase">
            <span aria-hidden="true">// </span>
            {eyebrow}
          </p>
          <h2 id={`${id}-title`} className="text-3xl font-bold sm:text-4xl">
            {title}
          </h2>
          {intro && <p className="text-muted mt-4 text-lg">{intro}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  )
}
