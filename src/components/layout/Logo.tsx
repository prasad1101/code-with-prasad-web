import { Link } from 'react-router-dom'

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="group inline-flex items-center gap-1 font-mono text-[0.95rem] font-medium whitespace-nowrap"
    >
      <span
        className="text-accent-2 transition-transform group-hover:-translate-x-0.5"
        aria-hidden="true"
      >
        &lt;
      </span>
      <span>code</span>
      <span className="text-gradient font-semibold">With</span>
      <span>Prasad</span>
      <span
        className="text-accent-2 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      >
        /&gt;
      </span>
    </Link>
  )
}
