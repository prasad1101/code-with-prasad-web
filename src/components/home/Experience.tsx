import { m, useScroll } from 'framer-motion'
import { useRef } from 'react'
import type { Site } from '../../lib/schemas'
import { duration, formatMonth, isFilled } from '../../lib/text'
import { Chip } from '../ui/Chip'
import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'

export function Experience({ experience }: { experience: Site['experience'] }) {
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] })
  if (!experience.length) return null

  return (
    <Section id="experience" eyebrow="Experience" title="Where I've worked">
      <ol ref={ref} className="relative ml-2 sm:ml-4">
        <div aria-hidden="true" className="bg-line absolute top-2 bottom-2 left-0 w-px" />
        <m.div
          aria-hidden="true"
          style={{ scaleY: scrollYProgress }}
          className="bg-gradient-accent absolute top-2 bottom-2 left-0 w-px origin-top"
        />
        {experience.map((job, i) => (
          <li
            key={`${job.company}-${job.start}`}
            className="relative pb-12 pl-8 last:pb-0 sm:pl-12"
          >
            <span
              aria-hidden="true"
              className="border-accent bg-bg absolute top-2 -left-[7px] size-[15px] rounded-full border-2 shadow-[0_0_0_4px_var(--c-glow)]"
            />
            <Reveal delay={i * 0.03}>
              <div className="card hover:border-accent/40 p-6 transition-colors">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-xl font-semibold">
                    {job.role} <span className="text-muted">·</span>{' '}
                    <span className="text-gradient">{job.company}</span>
                  </h3>
                  <p className="text-muted font-mono text-xs">
                    {formatMonth(job.start)} — {formatMonth(job.end)}
                    {duration(job.start, job.end) && ` · ${duration(job.start, job.end)}`}
                  </p>
                </div>
                {isFilled(job.location) && (
                  <p className="text-muted mt-1 text-sm">{job.location}</p>
                )}
                {job.highlights.length > 0 && (
                  <ul className="text-fg/85 mt-4 space-y-2 text-[0.95rem]">
                    {job.highlights.map((h) => (
                      <li key={h} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="bg-accent-2 mt-2.5 size-1.5 shrink-0 rounded-full"
                        />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
                {job.tech.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {job.tech.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  )
}
