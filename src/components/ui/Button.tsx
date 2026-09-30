import type { ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost'

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-accent text-white shadow-[0_8px_30px_-8px_var(--c-glow)] hover:shadow-[0_12px_40px_-6px_var(--c-glow)] hover:-translate-y-0.5',
  secondary:
    'border border-line bg-surface/70 text-fg hover:border-accent/60 hover:-translate-y-0.5 backdrop-blur',
  ghost: 'text-muted hover:text-fg',
}

const base =
  'group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:translate-y-0 active:scale-[0.98]'

type Props = {
  children: ReactNode
  variant?: Variant
  className?: string
  to?: To
  href?: string
  download?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  to,
  href,
  download,
  ...rest
}: Props) {
  const cls = `${base} ${styles[variant]} ${className}`
  if (to)
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    )
  if (href) {
    const external = /^https?:/.test(href)
    return (
      <a
        href={href}
        className={cls}
        download={download || undefined}
        {...(external && !download ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  }
  return (
    <button
      className={`${cls} disabled:cursor-not-allowed disabled:opacity-60`}
      type={rest.type ?? 'button'}
      {...rest}
    >
      {children}
    </button>
  )
}
