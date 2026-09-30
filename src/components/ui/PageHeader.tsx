import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: ReactNode
  intro?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="relative isolate overflow-hidden pt-32 pb-12 sm:pt-40">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="grid-bg absolute inset-0 opacity-70" />
        <div className="blob top-[-40%] left-[10%] size-[24rem] bg-violet-600/25" />
        <div
          className="blob top-[-30%] right-[5%] size-[20rem] bg-cyan-500/20"
          style={{ animationDelay: '-8s' }}
        />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-accent-2 mb-3 font-mono text-xs tracking-[0.2em] uppercase">
            <span aria-hidden="true">// </span>
            {eyebrow}
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
          {intro && <p className="text-muted mt-4 max-w-2xl text-lg">{intro}</p>}
          {children}
        </Reveal>
      </div>
    </header>
  )
}
