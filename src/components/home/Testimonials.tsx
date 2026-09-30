import { AnimatePresence, m } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import type { Site } from '../../lib/schemas'
import { isFilled } from '../../lib/text'
import { Section } from '../ui/Section'

export function Testimonials({ items }: { items: Site['testimonials'] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = items.length

  useEffect(() => {
    if (paused || count < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 7000)
    return () => clearInterval(t)
  }, [paused, count])

  if (!count) return null
  const t = items[index % count]
  const go = (d: number) => setIndex((i) => (i + d + count) % count)

  return (
    <Section id="testimonials" eyebrow="Testimonials" title="Kind words">
      <div
        className="card relative mx-auto max-w-3xl p-8 sm:p-12"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label="Testimonials"
      >
        <span
          aria-hidden="true"
          className="text-gradient font-display absolute top-4 left-6 text-7xl leading-none"
        >
          &ldquo;
        </span>
        <AnimatePresence mode="wait">
          <m.figure
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
            aria-live="polite"
          >
            <blockquote className="text-lg leading-relaxed sm:text-xl">{t.quote}</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              {isFilled(t.avatar) && (
                <img
                  src={t.avatar}
                  alt=""
                  loading="lazy"
                  className="size-11 rounded-full object-cover"
                />
              )}
              <span>
                <span className="block font-semibold">{t.name}</span>
                {t.role && <span className="text-muted text-sm">{t.role}</span>}
              </span>
            </figcaption>
          </m.figure>
        </AnimatePresence>
        {count > 1 && (
          <div className="mt-8 flex items-center justify-end gap-2">
            <span className="text-muted mr-auto font-mono text-xs">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
              className="border-line hover:border-accent/60 grid size-10 place-items-center rounded-xl border"
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next testimonial"
              className="border-line hover:border-accent/60 grid size-10 place-items-center rounded-xl border"
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </Section>
  )
}
