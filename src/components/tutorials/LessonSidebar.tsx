import { FiCheckCircle, FiCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import type { Tutorial } from '../../lib/schemas'

type Props = {
  tutorial: Tutorial
  current?: string
  completed: string[]
  onNavigate?: () => void
}

/** Chapter → lesson outline with completion ticks, used in the lesson sidebar and the overview. */
export function LessonOutline({ tutorial, current, completed, onNavigate }: Props) {
  let n = 0
  return (
    <ol className="space-y-6">
      {tutorial.chapters.map((chapter, ci) => (
        <li key={chapter.title}>
          <p className="text-muted mb-2 px-3 font-mono text-[0.7rem] tracking-[0.18em] uppercase">
            {String(ci + 1).padStart(2, '0')} · {chapter.title}
          </p>
          <ol className="space-y-0.5">
            {chapter.lessons.map((lesson) => {
              n++
              const active = lesson.slug === current
              const done = completed.includes(lesson.slug)
              return (
                <li key={lesson.slug}>
                  <Link
                    to={`/tutorials/${tutorial.slug}/${lesson.slug}`}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-accent/15 text-fg font-medium'
                        : 'text-muted hover:bg-surface-2 hover:text-fg'
                    }`}
                  >
                    {done ? (
                      <FiCheckCircle
                        className="mt-0.5 shrink-0 text-emerald-400"
                        aria-label="Completed"
                      />
                    ) : (
                      <FiCircle
                        className={`mt-0.5 shrink-0 ${active ? 'text-accent' : 'opacity-40'}`}
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      <span className="sr-only">Lesson {n}: </span>
                      {lesson.title}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </li>
      ))}
    </ol>
  )
}
