import { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiMaximize2, FiMinimize2, FiPlay, FiSearch } from 'react-icons/fi'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { PracticeMode } from '../components/interview/PracticeMode'
import { QuestionItem } from '../components/interview/QuestionItem'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { Seo } from '../components/ui/Seo'
import { ArticleSkeleton, PageSkeleton } from '../components/ui/Skeleton'
import { TechIcon } from '../components/ui/TechIcon'
import { useInterviewBank, useInterviewTopics } from '../hooks/useContent'
import { useProgress } from '../hooks/useProgress'
import { parseQuestions } from '../lib/interview'
import { LEVELS } from '../lib/schemas'
import NotFound from './NotFound'

export default function InterviewTopic() {
  const { slug = '' } = useParams()
  const { hash } = useLocation()
  const [params, setParams] = useSearchParams()
  const { status, topics, error } = useInterviewTopics()
  const bank = useInterviewBank(slug)
  const { completed, setDone, reset } = useProgress(`interview-progress:${slug}`)
  const questions = useMemo(() => (bank.data ? parseQuestions(bank.data) : []), [bank.data])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(() => new Set())

  const level = params.get('level') ?? ''
  const practice = params.get('mode') === 'practice'
  const path = `/interview/${slug}`

  const setParam = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return questions.filter(
      (q) =>
        (!level || q.level === level) &&
        (!needle || [q.question, ...q.tags].some((s) => s.toLowerCase().includes(needle))),
    )
  }, [questions, level, query])

  const levelCounts = useMemo(
    () => Object.fromEntries(LEVELS.map((l) => [l, questions.filter((q) => q.level === l).length])),
    [questions],
  )

  // Deep link (#question-id): open that question and bring it into view.
  const target = hash.slice(1)
  const [openedFromHash, setOpenedFromHash] = useState('')
  if (target && target !== openedFromHash && questions.some((q) => q.id === target)) {
    setOpenedFromHash(target)
    setOpen((o) => new Set(o).add(target))
  }
  useEffect(() => {
    if (openedFromHash) document.getElementById(openedFromHash)?.scrollIntoView({ block: 'start' })
  }, [openedFromHash])

  const toggle = (id: string) =>
    setOpen((o) => {
      const next = new Set(o)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (status === 'error')
    return (
      <div className="px-4 pt-40 pb-24">
        <ErrorState message={error.message} />
      </div>
    )
  if (status !== 'success') return <PageSkeleton />
  const topic = topics.find((t) => t.slug === slug)
  if (!topic) return <NotFound />

  const practisedCount = questions.filter((q) => completed.includes(q.id)).length
  const allOpen = filtered.length > 0 && filtered.every((q) => open.has(q.id))

  return (
    <>
      <Seo
        title={`${topic.title} interview questions`}
        description={topic.description}
        path={path}
      />
      <PageHeader
        eyebrow="Interview prep"
        title={
          <span className="flex items-center gap-4">
            <span className="border-line bg-surface-2 grid size-14 shrink-0 place-items-center rounded-2xl border">
              <TechIcon icon={topic.icon} name={topic.title} className="text-accent-2 size-7" />
            </span>
            {topic.title} interview questions
          </span>
        }
        intro={topic.description}
      >
        {questions.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <span className="text-muted">
              {questions.length} questions · {practisedCount} practised
            </span>
            {!practice && (
              <Button onClick={() => setParam('mode', 'practice')}>
                <FiPlay aria-hidden="true" /> Practice mode
              </Button>
            )}
            {practisedCount > 0 && (
              <button
                type="button"
                onClick={reset}
                className="text-muted hover:text-fg text-xs underline"
              >
                Reset progress
              </button>
            )}
          </div>
        )}
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="max-w-4xl">
          <Link
            to="/interview"
            className="text-muted hover:text-fg mb-8 inline-flex items-center gap-2 text-sm"
          >
            <FiArrowLeft aria-hidden="true" /> All topics
          </Link>

          {bank.status === 'error' && <ErrorState message={bank.error.message} />}
          {bank.status !== 'success' && bank.status !== 'error' && <ArticleSkeleton />}

          {bank.status === 'success' &&
            (practice ? (
              <PracticeMode
                questions={filtered.length ? filtered : questions}
                routePath={path}
                onPractised={(id) => setDone(id, true)}
                onExit={() => setParam('mode', '')}
              />
            ) : (
              <>
                <div className="mb-8 space-y-4">
                  <label className="relative block">
                    <span className="sr-only">Search questions</span>
                    <FiSearch
                      className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search questions or tags…"
                      className="border-line bg-surface placeholder:text-muted focus:border-accent w-full rounded-xl border py-3 pr-4 pl-11 text-sm transition-colors focus:outline-none"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by level">
                      <Chip active={!level} onClick={() => setParam('level', '')}>
                        All levels
                      </Chip>
                      {LEVELS.filter((l) => levelCounts[l]).map((l) => (
                        <Chip
                          key={l}
                          active={level === l}
                          onClick={() => setParam('level', level === l ? '' : l)}
                        >
                          {l} <span className="opacity-60">{levelCounts[l]}</span>
                        </Chip>
                      ))}
                    </div>
                    <span className="flex-1" />
                    <button
                      type="button"
                      onClick={() =>
                        setOpen(allOpen ? new Set() : new Set(filtered.map((q) => q.id)))
                      }
                      className="text-muted hover:text-fg inline-flex items-center gap-1.5 text-xs"
                    >
                      {allOpen ? (
                        <FiMinimize2 aria-hidden="true" />
                      ) : (
                        <FiMaximize2 aria-hidden="true" />
                      )}
                      {allOpen ? 'Collapse all' : 'Expand all'}
                    </button>
                  </div>
                </div>

                <p className="sr-only" role="status">
                  {filtered.length} questions shown
                </p>
                {filtered.length ? (
                  <div className="space-y-3">
                    {filtered.map((q) => (
                      <QuestionItem
                        key={q.id}
                        q={q}
                        index={questions.indexOf(q)}
                        open={open.has(q.id)}
                        practised={completed.includes(q.id)}
                        onToggle={() => toggle(q.id)}
                        onPractised={(done) => setDone(q.id, done)}
                        routePath={path}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="card text-muted p-10 text-center">No questions match.</div>
                )}
              </>
            ))}
        </div>
      </div>
    </>
  )
}
