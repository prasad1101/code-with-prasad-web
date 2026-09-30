import type { Level } from '../../lib/schemas'

const STYLES: Record<Level, string> = {
  Beginner: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  Intermediate: 'border-sky-500/40 text-sky-600 dark:text-sky-400',
  Advanced: 'border-violet-500/40 text-violet-600 dark:text-violet-400',
  Expert: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
}

export function LevelBadge({ level, className = '' }: { level?: Level; className?: string }) {
  if (!level) return null
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.65rem] tracking-wider uppercase ${STYLES[level]} ${className}`}
    >
      {level}
    </span>
  )
}
