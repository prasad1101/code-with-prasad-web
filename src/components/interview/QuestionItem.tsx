import { useMemo } from 'react'
import { FiCheckCircle, FiChevronDown, FiCircle, FiLink } from 'react-icons/fi'
import type { Question } from '../../lib/interview'
import { renderArticle } from '../../lib/markdown/rich'
import { Article } from '../blog/Article'
import { Chip } from '../ui/Chip'
import { InlineCode } from '../ui/InlineCode'
import { LevelBadge } from '../ui/LevelBadge'

type Props = {
  q: Question
  index: number
  open: boolean
  practised: boolean
  onToggle: () => void
  onPractised: (done: boolean) => void
  routePath: string
}

export function QuestionItem({
  q,
  index,
  open,
  practised,
  onToggle,
  onPractised,
  routePath,
}: Props) {
  // Answers are rendered only once opened, so long banks stay fast.
  const html = useMemo(
    () => (open ? renderArticle(q.answer, routePath).html : ''),
    [open, q.answer, routePath],
  )
  const panelId = `${q.id}-answer`
  return (
    <article
      id={q.id}
      className={`card scroll-mt-24 overflow-hidden transition-colors ${open ? 'border-accent/40' : ''}`}
    >
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="hover:bg-surface-2/50 flex w-full items-start gap-4 p-5 text-left transition-colors"
        >
          <span className="text-muted mt-0.5 font-mono text-xs">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="flex-1">
            <span className="font-display block text-base leading-snug font-semibold sm:text-lg">
              <InlineCode text={q.question} />
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-2">
              <LevelBadge level={q.level} />
              {practised && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                  <FiCheckCircle aria-hidden="true" /> Practised
                </span>
              )}
            </span>
          </span>
          <FiChevronDown
            className={`text-muted mt-1 size-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </h3>
      {open && (
        <div id={panelId} className="border-line border-t px-5 pt-2 pb-5 sm:px-12">
          <Article html={html} />
          <div className="border-line mt-6 flex flex-wrap items-center gap-3 border-t pt-4">
            {q.tags.map((t) => (
              <Chip key={t}>#{t}</Chip>
            ))}
            <span className="flex-1" />
            <a
              href={`#${routePath}#${q.id}`}
              className="text-muted hover:text-fg inline-flex items-center gap-1.5 text-xs"
            >
              <FiLink aria-hidden="true" /> Link
            </a>
            <button
              type="button"
              onClick={() => onPractised(!practised)}
              aria-pressed={practised}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                practised
                  ? 'border-emerald-500/40 text-emerald-500'
                  : 'border-line text-muted hover:border-accent/60 hover:text-fg'
              }`}
            >
              {practised ? <FiCheckCircle aria-hidden="true" /> : <FiCircle aria-hidden="true" />}
              {practised ? 'Practised' : 'Mark as practised'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
