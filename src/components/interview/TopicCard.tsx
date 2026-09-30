import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import type { InterviewTopic } from '../../lib/schemas'
import { TechIcon } from '../ui/TechIcon'

export function TopicCard({ topic }: { topic: InterviewTopic }) {
  return (
    <article className="card group hover:border-accent/50 relative flex h-full items-start gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_var(--c-glow)]">
      <div className="border-line bg-surface-2 grid size-12 shrink-0 place-items-center rounded-xl border">
        <TechIcon icon={topic.icon} name={topic.title} className="text-accent-2 size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">
          <Link to={`/interview/${topic.slug}`} className="after:absolute after:inset-0">
            {topic.title}
          </Link>
        </h3>
        <p className="text-muted mt-1 text-sm">{topic.description}</p>
      </div>
      <FiArrowRight
        className="text-accent mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      />
    </article>
  )
}
