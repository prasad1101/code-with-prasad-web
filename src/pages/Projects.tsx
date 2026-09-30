import { useMemo, useState } from 'react'
import { Chip } from '../components/ui/Chip'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { ProjectCard } from '../components/ui/ProjectCard'
import { Seo } from '../components/ui/Seo'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { useSite } from '../hooks/useContent'
import { PAGE_META } from '../lib/seo'

export default function Projects() {
  const { status, data, error } = useSite()
  const [tech, setTech] = useState('')
  const projects = useMemo(() => data?.projects ?? [], [data])
  const allTech = useMemo(() => [...new Set(projects.flatMap((p) => p.tech))].sort(), [projects])
  const shown = tech ? projects.filter((p) => p.tech.includes(tech)) : projects

  return (
    <>
      <Seo {...PAGE_META.projects} path="/projects" />
      <PageHeader
        eyebrow="Projects"
        title={
          <>
            Things I&apos;ve <span className="text-gradient">built</span>
          </>
        }
        intro="A selection of products, tools and experiments."
      />
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {status === 'error' && <ErrorState message={error.message} />}
        {(status === 'loading' || status === 'idle') && <CardGridSkeleton />}
        {status === 'success' && (
          <>
            {allTech.length > 1 && (
              <div
                className="mb-10 flex flex-wrap gap-2"
                role="group"
                aria-label="Filter by technology"
              >
                <Chip active={!tech} onClick={() => setTech('')}>
                  All
                </Chip>
                {allTech.map((t) => (
                  <Chip key={t} active={tech === t} onClick={() => setTech(tech === t ? '' : t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            )}
            {shown.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <h2 className="sr-only">All projects</h2>
                {shown.map((p) => (
                  <ProjectCard key={p.slug} project={p} />
                ))}
              </div>
            ) : (
              <div className="card text-muted p-10 text-center">More projects are on the way.</div>
            )}
          </>
        )}
      </div>
    </>
  )
}
