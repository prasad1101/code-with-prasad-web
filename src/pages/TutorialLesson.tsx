import { AnimatePresence, m } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { FiCheck, FiList, FiX } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import { Article } from '../components/blog/Article'
import { MobileToc, Toc } from '../components/blog/Toc'
import { ReadingProgress } from '../components/layout/ReadingProgress'
import { LessonOutline } from '../components/tutorials/LessonSidebar'
import { flattenLessons } from '../components/tutorials/outline'
import { ErrorState } from '../components/ui/ErrorState'
import { PrevNext } from '../components/ui/PrevNext'
import { Seo } from '../components/ui/Seo'
import { ArticleSkeleton, PageSkeleton } from '../components/ui/Skeleton'
import { useLessonContent, useTutorials } from '../hooks/useContent'
import { useTutorialProgress } from '../hooks/useTutorialProgress'
import { renderArticle } from '../lib/markdown/rich'
import NotFound from './NotFound'

export default function TutorialLesson() {
  const { slug = '', lesson: lessonSlug = '' } = useParams()
  const { status, tutorials, error } = useTutorials()
  const tutorial = tutorials.find((t) => t.slug === slug)
  const lessons = useMemo(() => (tutorial ? flattenLessons(tutorial) : []), [tutorial])
  const current = lessons.find((l) => l.lesson.slug === lessonSlug)
  const content = useLessonContent(slug, lessonSlug, current?.lesson.content)
  const { completed, setDone } = useTutorialProgress(slug)
  const [drawer, setDrawer] = useState(false)
  const path = `/tutorials/${slug}/${lessonSlug}`
  const article = useMemo(
    () => (content.data ? renderArticle(content.data, `#${path}`) : undefined),
    [content.data, path],
  )

  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawer])

  if (status === 'error')
    return (
      <div className="px-4 pt-40 pb-24">
        <ErrorState message={error.message} />
      </div>
    )
  if (status !== 'success') return <PageSkeleton />
  if (!tutorial || !current) return <NotFound />

  const prev = lessons[current.index - 1]
  const next = lessons[current.index + 1]
  const done = completed.includes(current.lesson.slug)
  const lessonPath = (s: string) => `/tutorials/${slug}/${s}`

  return (
    <>
      <Seo
        title={`${current.lesson.title} — ${tutorial.title}`}
        description={`${tutorial.title}, lesson ${current.index + 1}: ${current.lesson.title}.`}
        path={path}
        type="article"
      />
      <ReadingProgress />

      <div className="mx-auto max-w-7xl px-4 pt-24 pb-24 sm:px-6 lg:pt-28">
        <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_200px]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block" aria-label={`${tutorial.title} lessons`}>
            <div className="no-scrollbar sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 pb-8">
              <Link
                to={`/tutorials/${slug}`}
                className="font-display hover:text-accent mb-5 block px-3 text-lg font-semibold"
              >
                {tutorial.title}
              </Link>
              <LessonOutline tutorial={tutorial} current={lessonSlug} completed={completed} />
            </div>
          </aside>

          <div className="min-w-0">
            {/* Mobile lesson picker */}
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="card mb-6 flex w-full items-center gap-3 px-4 py-3 text-left text-sm lg:hidden"
              aria-haspopup="dialog"
            >
              <FiList className="text-accent" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                <span className="text-muted">{tutorial.title} · </span>
                Lesson {current.index + 1} of {lessons.length}
              </span>
            </button>

            <nav aria-label="Breadcrumb" className="text-muted mb-4 text-sm">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/tutorials" className="hover:text-fg">
                    Tutorials
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link to={`/tutorials/${slug}`} className="hover:text-fg">
                    {tutorial.language || tutorial.title}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-fg/80">{current.chapter}</li>
              </ol>
            </nav>

            <header className="border-line mb-10 border-b pb-8">
              <p className="text-accent-2 mb-2 font-mono text-xs tracking-wider uppercase">
                Lesson {current.index + 1} of {lessons.length}
              </p>
              <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
                {current.lesson.title}
              </h1>
            </header>

            {article && <MobileToc items={article.toc} />}
            {content.status === 'error' && <ErrorState message={content.error.message} />}
            {article ? (
              <Article html={article.html} />
            ) : (
              content.status !== 'error' && <ArticleSkeleton />
            )}

            <div className="border-line bg-surface-2/50 mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5">
              <p className="text-muted text-sm">
                {done
                  ? 'Nice work — lesson completed.'
                  : 'Finished reading? Mark it done to track your progress.'}
              </p>
              <button
                type="button"
                onClick={() => setDone(current.lesson.slug, !done)}
                aria-pressed={done}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  done ? 'bg-emerald-500/15 text-emerald-500' : 'bg-gradient-accent text-white'
                }`}
              >
                <FiCheck aria-hidden="true" /> {done ? 'Completed' : 'Mark as complete'}
              </button>
            </div>

            <div className="mt-8">
              <PrevNext
                label="lesson"
                prev={prev && { to: lessonPath(prev.lesson.slug), title: prev.lesson.title }}
                next={next && { to: lessonPath(next.lesson.slug), title: next.lesson.title }}
              />
            </div>
          </div>

          {article && (
            <aside className="hidden xl:block">
              <div className="sticky top-24">
                <Toc items={article.toc} />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <m.div
            className="fixed inset-0 z-[70] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close lessons"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDrawer(false)}
            />
            <m.div
              role="dialog"
              aria-modal="true"
              aria-label={`${tutorial.title} lessons`}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="border-line bg-bg absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto border-r p-4"
            >
              <div className="mb-5 flex items-center justify-between">
                <Link to={`/tutorials/${slug}`} className="font-display px-3 text-lg font-semibold">
                  {tutorial.title}
                </Link>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setDrawer(false)}
                  aria-label="Close lessons"
                  className="border-line grid size-10 place-items-center rounded-xl border"
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>
              <LessonOutline
                tutorial={tutorial}
                current={lessonSlug}
                completed={completed}
                onNavigate={() => setDrawer(false)}
              />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
