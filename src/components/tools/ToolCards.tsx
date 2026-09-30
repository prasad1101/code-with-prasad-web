import type { IconType } from 'react-icons'
import {
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiBox,
  FiChrome,
  FiCloud,
  FiCode,
  FiDatabase,
  FiExternalLink,
  FiGitBranch,
  FiMessageSquare,
  FiPackage,
  FiPenTool,
  FiRepeat,
  FiStar,
  FiTerminal,
  FiTool,
  FiZap,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import type { DirectoryTool } from '../../lib/schemas'
import type { Tool } from '../../tools/registry'

/** Card for a built-in tool; the whole card links to the tool page. */
export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  return (
    <article className="card group hover:border-accent/50 relative flex h-full items-start gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_var(--c-glow)]">
      <div className="border-line bg-surface-2 grid size-11 shrink-0 place-items-center rounded-xl border">
        <Icon className="text-accent-2 size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">
          <Link to={`/tools/${tool.slug}`} className="after:absolute after:inset-0">
            {tool.title}
          </Link>
        </h3>
        <p className="text-muted mt-1 text-sm">{tool.summary}</p>
      </div>
      <FiArrowRight
        className="text-accent mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      />
    </article>
  )
}

const CATEGORY_ICONS: Record<string, IconType> = {
  code: FiCode,
  ai: FiMessageSquare,
  api: FiRepeat,
  database: FiDatabase,
  git: FiGitBranch,
  docker: FiBox,
  terminal: FiTerminal,
  package: FiPackage,
  browser: FiChrome,
  chart: FiBarChart2,
  design: FiPenTool,
  cloud: FiCloud,
  book: FiBookOpen,
  zap: FiZap,
}

export function CategoryIcon({ icon, className }: { icon?: string; className?: string }) {
  const Icon = (icon && CATEGORY_ICONS[icon]) || FiTool
  return <Icon className={className} aria-hidden="true" />
}

const PRICING_STYLE: Record<DirectoryTool['pricing'], string> = {
  Free: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  'Free & open source':
    'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  Freemium: 'text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10',
  Paid: 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10',
}

/** Card for an external tool in the directory; opens the tool's site in a new tab. */
export function DirectoryCard({ tool }: { tool: DirectoryTool }) {
  const host = new URL(tool.url).hostname.replace(/^www\./, '')
  return (
    <article className="card group hover:border-accent/50 relative flex h-full flex-col gap-3 p-5 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0"
          >
            {tool.name}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </h3>
        <FiExternalLink
          className="text-muted group-hover:text-accent mt-1 size-4 shrink-0"
          aria-hidden="true"
        />
      </div>
      <p className="text-muted flex-1 text-sm">{tool.description}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRICING_STYLE[tool.pricing]}`}
        >
          {tool.pricing}
        </span>
        {tool.featured && (
          <span className="text-accent inline-flex items-center gap-1 text-xs font-medium">
            <FiStar className="size-3" aria-hidden="true" /> Essential
          </span>
        )}
        <span className="text-muted ml-auto font-mono text-xs">{host}</span>
      </div>
    </article>
  )
}
