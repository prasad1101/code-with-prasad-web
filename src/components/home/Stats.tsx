import { animate, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Reveal } from '../ui/Reveal'

type Stat = { label: string; value: string }

const COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'lg:grid-cols-4',
}

export function Stats({ stats }: { stats: Stat[] }) {
  if (!stats.length) return null
  return (
    <section aria-label="At a glance" className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <dl
            className={`card divide-line grid grid-cols-2 overflow-hidden sm:divide-x ${COLS[Math.min(stats.length, 4)]}`}
          >
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse gap-1 p-6 text-center">
                <dt className="text-muted text-sm">{s.label}</dt>
                <dd className="font-display text-4xl font-bold">
                  <CountUp value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}

/** Counts up the numeric part of values like "8+", "12", "99.9%". */
function CountUp({ value }: { value: string }) {
  const match = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const target = match ? Number(match[2]) : 0
  const decimals = match?.[2].split('.')[1]?.length ?? 0
  const numeric = match !== null
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!numeric || !inView || reduce) return
    const controls = animate(0, target, { duration: 1.4, ease: 'easeOut', onUpdate: setN })
    return () => controls.stop()
  }, [inView, reduce, target, numeric])

  if (!match) return <span className="text-gradient">{value}</span>
  const shown = reduce ? target : n
  return (
    <span ref={ref} className="text-gradient tabular-nums">
      {match[1]}
      {shown.toFixed(decimals)}
      {match[3]}
    </span>
  )
}
