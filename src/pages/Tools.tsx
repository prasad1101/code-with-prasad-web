import { useMemo, useState } from 'react'
import { FiSearch, FiShield } from 'react-icons/fi'
import { useSearchParams } from 'react-router-dom'
import { CategoryIcon, DirectoryCard, ToolCard } from '../components/tools/ToolCards'
import { Chip } from '../components/ui/Chip'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { Seo } from '../components/ui/Seo'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { loadToolDirectory, useToolDirectory } from '../hooks/useContent'
import { retry } from '../lib/resource'
import { matchesTool, TOOL_CATEGORIES, TOOLS } from '../tools/registry'
import { PAGE_META } from '../lib/seo'

const TABS = [
  { key: 'built-in', label: 'Online tools' },
  { key: 'directory', label: 'Toolkit directory' },
] as const
type Tab = (typeof TABS)[number]['key']

export default function Tools() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'directory' ? 'directory' : 'built-in'
  const [query, setQuery] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const directory = useToolDirectory()

  const builtIn = useMemo(
    () =>
      TOOL_CATEGORIES.map((c) => ({
        category: c,
        tools: TOOLS.filter((t) => t.category === c && matchesTool(t, query)),
      })).filter((g) => g.tools.length),
    [query],
  )

  const external = useMemo(() => {
    const q = query.trim().toLowerCase()
    return directory.groups
      .map((g) => ({
        ...g,
        tools: g.tools.filter(
          (t) =>
            (!freeOnly || t.pricing === 'Free' || t.pricing === 'Free & open source') &&
            (!q ||
              `${t.name} ${t.description} ${t.tags.join(' ')} ${g.name}`.toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.tools.length)
  }, [directory.groups, query, freeOnly])

  const setTab = (t: Tab) =>
    setParams(t === 'directory' ? { tab: 'directory' } : {}, {
      replace: true,
      preventScrollReset: true,
    })

  const shown =
    tab === 'built-in'
      ? builtIn.reduce((n, g) => n + g.tools.length, 0)
      : external.reduce((n, g) => n + g.tools.length, 0)

  return (
    <>
      <Seo {...PAGE_META.tools} path="/tools" />
      <PageHeader
        eyebrow="Developer tools"
        title={
          <>
            Tools that make <span className="text-gradient">everyday dev work easier</span>
          </>
        }
        intro={`${TOOLS.length} free tools that run right in your browser, plus a hand-picked directory of ${
          directory.count || 'the best'
        } apps, editors and services developers rely on.`}
      >
        <p className="text-muted mt-4 inline-flex items-center gap-2 text-sm">
          <FiShield className="text-emerald-500" aria-hidden="true" />
          Private by design — everything you paste is processed on your device, never uploaded.
        </p>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="glass border-line sticky top-16 z-10 -mx-4 mb-8 flex flex-col gap-3 border-b px-4 py-3 sm:mx-0 sm:rounded-2xl sm:border sm:px-4 md:flex-row md:items-center">
          <div role="tablist" aria-label="Tool type" className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                type="button"
                aria-selected={tab === t.key}
                aria-controls="tools-panel"
                onClick={() => setTab(t.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? 'bg-accent/15 text-fg ring-accent/50 ring-1'
                    : 'text-muted hover:text-fg'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search tools</span>
            <FiSearch
              className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === 'built-in'
                  ? 'Search tools — e.g. json, jwt, regex…'
                  : 'Search the directory — e.g. postgres, api, git…'
              }
              className="border-line bg-surface-2/60 focus:border-accent/60 w-full rounded-xl border py-2 pr-3 pl-9 text-sm outline-none"
            />
          </label>
          {tab === 'directory' && (
            <Chip active={freeOnly} onClick={() => setFreeOnly((f) => !f)}>
              Free only
            </Chip>
          )}
        </div>

        <div
          id="tools-panel"
          role="tabpanel"
          aria-label={tab === 'built-in' ? 'Online tools' : 'Toolkit directory'}
        >
          <p className="sr-only" aria-live="polite">
            {shown} tools shown
          </p>
          {tab === 'built-in' ? (
            builtIn.length ? (
              <div className="space-y-12">
                {builtIn.map((g) => (
                  <section key={g.category} aria-labelledby={`tc-${g.category}`}>
                    <h2 id={`tc-${g.category}`} className="mb-5 text-2xl font-bold">
                      {g.category}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {g.tools.map((t, i) => (
                        <Reveal key={t.slug} delay={i * 0.03}>
                          <ToolCard tool={t} />
                        </Reveal>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <NoResults query={query} />
            )
          ) : directory.status === 'error' ? (
            <ErrorState
              message={directory.error.message}
              onRetry={() => retry('tools', loadToolDirectory)}
            />
          ) : directory.status !== 'success' ? (
            <CardGridSkeleton count={6} />
          ) : external.length ? (
            <div className="space-y-12">
              {external.map((g) => (
                <section key={g.name} aria-labelledby={`dc-${g.name}`}>
                  <h2
                    id={`dc-${g.name}`}
                    className="mb-5 flex items-center gap-3 text-2xl font-bold"
                  >
                    <span className="border-line bg-surface-2 grid size-9 place-items-center rounded-lg border">
                      <CategoryIcon icon={g.icon} className="text-accent-2 size-4" />
                    </span>
                    {g.name}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.tools.map((t) => (
                      <DirectoryCard key={t.url} tool={t} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <NoResults query={query} />
          )}
        </div>
      </div>
    </>
  )
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="card text-muted p-10 text-center">
      No tools match <strong className="text-fg">“{query}”</strong>. Try another word.
    </div>
  )
}
