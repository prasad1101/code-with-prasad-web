import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}

/** Small pill. Renders a toggle button when `onClick` is given. */
export function Chip({ children, active, onClick, className = '' }: Props) {
  const cls = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
    active
      ? 'border-accent/70 bg-accent/15 text-fg'
      : 'border-line bg-surface-2/60 text-muted hover:border-accent/50 hover:text-fg'
  } ${className}`
  if (!onClick) return <span className={cls}>{children}</span>
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cls}>
      {children}
    </button>
  )
}
