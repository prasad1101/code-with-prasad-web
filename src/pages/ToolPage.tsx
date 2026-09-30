import { Component, Suspense, type ReactNode } from 'react'
import { FiArrowLeft, FiShield } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import { ToolCard } from '../components/tools/ToolCards'
import { ErrorState } from '../components/ui/ErrorState'
import { Seo } from '../components/ui/Seo'
import { Skeleton } from '../components/ui/Skeleton'
import { toolBySlug, TOOLS } from '../tools/registry'
import NotFound from './NotFound'

/** Keeps a crash inside one tool from blanking the whole page. */
class ToolBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error)
      return (
        <ErrorState
          message={`This tool hit an unexpected error: ${this.state.error.message}`}
          onRetry={() => this.setState({ error: null })}
        />
      )
    return this.props.children
  }
}

export default function ToolPage() {
  const { slug } = useParams()
  const tool = toolBySlug(slug)
  if (!tool) return <NotFound />

  const { Component: ToolComponent, icon: Icon } = tool
  const related = TOOLS.filter((t) => t.category === tool.category && t.slug !== tool.slug).slice(
    0,
    3,
  )

  return (
    <>
      <Seo
        title={tool.seoTitle}
        path={`/tools/${tool.slug}`}
        description={tool.description}
        image={`/images/og/tools/${tool.slug}.png`}
      />
      <div className="mx-auto max-w-6xl px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
        <Link
          to="/tools"
          className="text-muted hover:text-fg inline-flex items-center gap-2 text-sm"
        >
          <FiArrowLeft aria-hidden="true" /> All tools
        </Link>
        <header className="mt-6 mb-8 flex items-start gap-4">
          <div className="border-line bg-surface-2 hidden size-14 shrink-0 place-items-center rounded-2xl border sm:grid">
            <Icon className="text-accent-2 size-7" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-accent-2 mb-2 font-mono text-xs tracking-[0.2em] uppercase">
              <span aria-hidden="true">// </span>
              {tool.category}
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">{tool.title}</h1>
            <p className="text-muted mt-3 max-w-3xl">{tool.description}</p>
            <p className="text-muted mt-2 inline-flex items-center gap-2 text-xs">
              <FiShield className="text-emerald-500" aria-hidden="true" />
              Runs entirely in your browser — nothing is uploaded.
            </p>
          </div>
        </header>

        {/* Remount per tool so state never leaks between tools. */}
        <ToolBoundary key={tool.slug}>
          <Suspense
            fallback={
              <div className="space-y-4" aria-busy="true" aria-label="Loading tool">
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-80 w-full" />
              </div>
            }
          >
            <ToolComponent />
          </Suspense>
        </ToolBoundary>

        <section aria-labelledby="tool-faq" className="mt-20 max-w-3xl">
          <h2 id="tool-faq" className="mb-5 text-2xl font-bold">
            {tool.title}: common questions
          </h2>
          <div className="space-y-3">
            {tool.faq.map(([q, a]) => (
              <details
                key={q}
                className="card group p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold">
                  <h3 className="text-base">{q}</h3>
                  <span
                    aria-hidden="true"
                    className="text-accent mt-0.5 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="text-muted mt-3">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="related-tools" className="mt-20">
            <h2 id="related-tools" className="mb-5 text-2xl font-bold">
              More {tool.category.toLowerCase()}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
