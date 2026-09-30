import { useMemo, useState } from 'react'
import { FiCheck, FiEye, FiRepeat, FiRotateCcw, FiX } from 'react-icons/fi'
import type { Question } from '../../lib/interview'
import { renderArticle } from '../../lib/markdown/rich'
import { Article } from '../blog/Article'
import { Button } from '../ui/Button'
import { InlineCode } from '../ui/InlineCode'
import { LevelBadge } from '../ui/LevelBadge'

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Props = {
  questions: Question[]
  routePath: string
  onPractised: (id: string) => void
  onExit: () => void
}

/** Flashcard-style self test: read the question, answer out loud, reveal, grade yourself. */
export function PracticeMode({ questions, routePath, onPractised, onExit }: Props) {
  const [deck, setDeck] = useState(() => shuffle(questions))
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [knew, setKnew] = useState(0)
  const [review, setReview] = useState<Question[]>([])
  const current = deck[index]
  const html = useMemo(
    () => (current && revealed ? renderArticle(current.answer, routePath).html : ''),
    [current, revealed, routePath],
  )

  const next = (gotIt: boolean) => {
    if (gotIt) {
      setKnew((n) => n + 1)
      onPractised(current.id)
    } else setReview((r) => [...r, current])
    setRevealed(false)
    setIndex((i) => i + 1)
    window.scrollTo({ top: 0 })
  }

  const restart = (items: Question[]) => {
    setDeck(shuffle(items))
    setIndex(0)
    setKnew(0)
    setReview([])
    setRevealed(false)
  }

  if (!current) {
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center sm:p-12" role="status">
        <p className="font-display text-2xl font-bold">Session complete</p>
        <p className="text-muted mt-2">
          You knew <strong className="text-fg">{knew}</strong> of {deck.length} questions.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {review.length > 0 && (
            <Button onClick={() => restart(review)}>
              <FiRepeat aria-hidden="true" /> Review {review.length} missed
            </Button>
          )}
          <Button variant="secondary" onClick={() => restart(questions)}>
            <FiRotateCcw aria-hidden="true" /> Start over
          </Button>
          <Button variant="secondary" onClick={onExit}>
            Back to all questions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-4 text-sm">
        <span className="text-muted font-mono">
          Question {index + 1} / {deck.length}
        </span>
        <button
          type="button"
          onClick={onExit}
          className="text-muted hover:text-fg inline-flex items-center gap-1"
        >
          <FiX aria-hidden="true" /> Exit practice
        </button>
      </div>
      <div className="bg-line mb-6 h-1 overflow-hidden rounded-full" aria-hidden="true">
        <div
          className="bg-gradient-accent h-full transition-[width]"
          style={{ width: `${(index / deck.length) * 100}%` }}
        />
      </div>
      <div className="card p-6 sm:p-10">
        <LevelBadge level={current.level} />
        <h2 className="mt-3 text-2xl leading-snug font-bold sm:text-3xl" aria-live="polite">
          <InlineCode text={current.question} />
        </h2>
        {!revealed ? (
          <>
            <p className="text-muted mt-6 text-sm">
              Answer out loud or jot down your answer, then reveal the model answer.
            </p>
            <div className="mt-6">
              <Button onClick={() => setRevealed(true)}>
                <FiEye aria-hidden="true" /> Reveal answer
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="border-line mt-6 border-t pt-4">
              <Article html={html} />
            </div>
            <div className="border-line mt-8 flex flex-wrap gap-3 border-t pt-6">
              <Button onClick={() => next(true)}>
                <FiCheck aria-hidden="true" /> I knew it
              </Button>
              <Button variant="secondary" onClick={() => next(false)}>
                <FiRepeat aria-hidden="true" /> Review later
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
