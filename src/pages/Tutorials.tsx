import { useMemo } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import { TutorialCard } from '../components/tutorials/TutorialCard'
import { Chip } from '../components/ui/Chip'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { Seo } from '../components/ui/Seo'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { TechIcon } from '../components/ui/TechIcon'
import { useTutorials } from '../hooks/useContent'
import type { LearningPath, Tutorial } from '../lib/schemas'

export default function Tutorials() {
  const { status, tutorials, paths, error } = useTutorials()
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? ''

  const categories = useMemo(
    () => [...new Set(tutorials.map((t) => t.category).filter(Boolean))],
    [tutorials],
  )
  const groups = useMemo(() => {
    const shown = category ? [category] : categories
    return shown
      .map((c) => ({ category: c, items: tutorials.filter((t) => t.category === c) }))
      .concat(category ? [] : [{ category: 'More', items: tutorials.filter((t) => !t.category) }])
      .filter((g) => g.items.length)
  }, [tutorials, categories, category])

  const setCategory = (c: string) =>
    setParams(c ? { category: c } : {}, { replace: true, preventScrollReset: true })

  return (
    <>
      <Seo
        title="Tutorials"
        path="/tutorials"
        description="Free step-by-step tutorials from beginner to expert: JavaScript, TypeScript, Python, Angular, React, Node.js, Express, SQL, MongoDB, data analytics and data engineering."
      />
      <PageHeader
        eyebrow="Tutorials"
        title={
          <>
            Learn to code, <span className="text-gradient">beginner to expert</span>
          </>
        }
        intro="Structured courses for the MEAN and MERN stacks, databases and data. Each lesson is short, builds on the previous one and comes with examples you can run."
      />
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {status === 'error' && <ErrorState message={error.message} />}
        {(status === 'loading' || status === 'idle') && <CardGridSkeleton count={6} />}
        {status === 'success' && (
          <>
            {paths.length > 0 && !category && <Paths paths={paths} tutorials={tutorials} />}

            {categories.length > 1 && (
              <div
                className="mb-10 flex flex-wrap gap-2"
                role="group"
                aria-label="Filter by category"
              >
                <Chip active={!category} onClick={() => setCategory('')}>
                  All
                </Chip>
                {categories.map((c) => (
                  <Chip
                    key={c}
                    active={category === c}
                    onClick={() => setCategory(category === c ? '' : c)}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
            )}

            {groups.length ? (
              <div className="space-y-14">
                {groups.map((g) => (
                  <section key={g.category} aria-labelledby={`cat-${g.category}`}>
                    <h2 id={`cat-${g.category}`} className="mb-6 text-2xl font-bold">
                      {g.category}
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {g.items.map((t, i) => (
                        <Reveal key={t.slug} delay={i * 0.04}>
                          <TutorialCard tutorial={t} />
                        </Reveal>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="card text-muted p-10 text-center">Tutorials are coming soon.</div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function Paths({ paths, tutorials }: { paths: LearningPath[]; tutorials: Tutorial[] }) {
  const bySlug = new Map(tutorials.map((t) => [t.slug, t]))
  return (
    <section aria-labelledby="paths-title" className="mb-16">
      <h2 id="paths-title" className="mb-2 text-2xl font-bold">
        Learning paths
      </h2>
      <p className="text-muted mb-6">Follow a path in order to go from zero to job-ready.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {paths.map((p) => (
          <div key={p.slug} className="card p-6">
            <h3 className="text-lg font-semibold">{p.title}</h3>
            <p className="text-muted mt-1 text-sm">{p.description}</p>
            <ol className="mt-4 flex flex-wrap items-center gap-2">
              {p.tutorials.map((slug, i) => {
                const t = bySlug.get(slug)!
                return (
                  <li key={slug} className="flex items-center gap-2">
                    <Link
                      to={`/tutorials/${slug}`}
                      className="border-line bg-surface-2/60 hover:border-accent/60 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
                    >
                      <span className="text-muted font-mono">{i + 1}.</span>
                      <TechIcon
                        icon={t.icon}
                        name={t.language}
                        className="text-accent-2 size-3.5"
                      />
                      {t.language || t.title}
                    </Link>
                    {i < p.tutorials.length - 1 && (
                      <FiArrowRight className="text-muted size-3" aria-hidden="true" />
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}
