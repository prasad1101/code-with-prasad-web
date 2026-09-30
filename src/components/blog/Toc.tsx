import { Link, useLocation } from 'react-router-dom'
import { useScrollSpy } from '../../hooks/useScrollSpy'
import type { TocItem } from '../../lib/markdown/rich'

export function Toc({ items, title = 'On this page' }: { items: TocItem[]; title?: string }) {
  const { pathname } = useLocation()
  const active = useScrollSpy(
    items.map((i) => i.id),
    items.length > 0,
    '-80px 0px -70% 0px',
  )
  if (items.length < 2) return null
  return (
    <nav aria-label="Table of contents">
      <p className="text-muted mb-3 font-mono text-xs tracking-[0.2em] uppercase">{title}</p>
      <ul className="border-line space-y-1 border-l text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={{ pathname, hash: item.id }}
              replace
              preventScrollReset
              aria-current={active === item.id ? 'location' : undefined}
              className={`-ml-px block border-l py-1 transition-colors ${item.level === 3 ? 'pl-7' : 'pl-4'} ${
                active === item.id
                  ? 'border-accent text-fg'
                  : 'text-muted hover:text-fg border-transparent'
              }`}
            >
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Collapsible TOC for small screens. */
export function MobileToc({ items }: { items: TocItem[] }) {
  if (items.length < 2) return null
  return (
    <details className="card mb-8 p-4 lg:hidden">
      <summary className="cursor-pointer font-medium">On this page</summary>
      <div className="mt-4">
        <Toc items={items} title="" />
      </div>
    </details>
  )
}
