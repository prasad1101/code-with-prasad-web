import { FiArrowRight, FiBookOpen, FiLayers, FiRotateCcw } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import { LessonOutline } from '../components/tutorials/LessonSidebar'
import { flattenLessons, levelRange } from '../components/tutorials/outline'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { TechIcon } from '../components/ui/TechIcon'
import { PageHeader } from '../components/ui/PageHeader'
import { Seo } from '../components/ui/Seo'
import { PageSkeleton } from '../components/ui/Skeleton'
import { useTutorials } from '../hooks/useContent'
import { useProgress } from '../hooks/useProgress'
import NotFound from './NotFound'

import { PAGE_META, tutorialSeoTitle } from '../lib/seo'
export default function TutorialOverview() {
  const { slug = '' } = useParams()
  const { status, tutorials, error } = useTutorials()
  const { completed, reset } = useProgress(`tutorial-progress:${slug}`)
  const tutorial = tutorials.find((t) => t.slug === slug)

  if (status === 'error')
    return (
      <div className="px-4 pt-40 pb-24">
        <ErrorState message={error.message} />
      </div>
    )
  if (status !== 'success') return <PageSkeleton />
  if (!tutorial) return <NotFound />

  const lessons = flattenLessons(tutorial)
  const first = lessons[0]
  const nextUp = lessons.find((l) => !completed.includes(l.lesson.slug))
  const doneCount = lessons.filter((l) => completed.includes(l.lesson.slug)).length
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0

  return (
    <>
      <Seo
        title={tutorialSeoTitle(tutorial.title)}
        description={tutorial.description}
        path={`/tutorials/${slug}`}
        image={PAGE_META.tutorials.image}
      />
      <PageHeader
        eyebrow={`Tutorials / ${tutorial.language || tutorial.title}`}
        title={
          <span className="flex items-center gap-4">
            <span className="border-line bg-surface-2 grid size-14 shrink-0 place-items-center rounded-2xl border">
              <TechIcon
                icon={tutorial.icon}
                name={tutorial.language}
                className="text-accent-2 size-7"
              />
            </span>
            {tutorial.title}
          </span>
        }
        intro={tutorial.description}
      >
        <div className="text-muted mt-6 flex flex-wrap gap-5 text-sm">
          {levelRange(tutorial) && <span>{levelRange(tutorial)}</span>}
          <span className="inline-flex items-center gap-1.5">
            <FiLayers aria-hidden="true" /> {tutorial.chapters.length} chapters
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FiBookOpen aria-hidden="true" /> {lessons.length} lessons
          </span>
        </div>
        {first && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to={`/tutorials/${slug}/${(doneCount && nextUp ? nextUp : first).lesson.slug}`}>
              {doneCount && nextUp ? 'Continue learning' : 'Start learning'}
              <FiArrowRight
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
            {doneCount > 0 && (
              <Button variant="secondary" onClick={reset}>
                <FiRotateCcw aria-hidden="true" /> Reset progress
              </Button>
            )}
          </div>
        )}
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <section aria-labelledby="curriculum" className="card p-6 sm:p-8">
            <h2 id="curriculum" className="mb-6 text-2xl font-bold">
              Curriculum
            </h2>
            <LessonOutline tutorial={tutorial} completed={completed} />
          </section>
          <aside className="card h-fit p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold">Your progress</h2>
            <p className="text-muted mt-1 text-sm">
              {doneCount} of {lessons.length} lessons completed
            </p>
            <div
              className="bg-line mt-4 h-2 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tutorial progress"
            >
              <div
                className="bg-gradient-accent h-full rounded-full transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-muted mt-4 text-xs">Progress is saved in this browser only.</p>
            <Link to="/tutorials" className="text-accent mt-6 inline-block text-sm hover:underline">
              ← All tutorials
            </Link>
          </aside>
        </div>
      </div>
    </>
  )
}
