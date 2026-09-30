import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

type Target = { to: string; title: string } | undefined

export function PrevNext({
  prev,
  next,
  label = 'post',
}: {
  prev: Target
  next: Target
  label?: string
}) {
  if (!prev && !next) return null
  const cls =
    'card group flex flex-col gap-1 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/50'
  return (
    <nav aria-label={`Previous and next ${label}`} className="grid gap-4 sm:grid-cols-2">
      {prev ? (
        <Link to={prev.to} className={cls} rel="prev">
          <span className="text-muted inline-flex items-center gap-1.5 text-xs">
            <FiArrowLeft
              className="transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />{' '}
            Previous {label}
          </span>
          <span className="font-semibold">{prev.title}</span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next && (
        <Link to={next.to} className={`${cls} text-right`} rel="next">
          <span className="text-muted inline-flex items-center justify-end gap-1.5 text-xs">
            Next {label}{' '}
            <FiArrowRight
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
          <span className="font-semibold">{next.title}</span>
        </Link>
      )}
    </nav>
  )
}
