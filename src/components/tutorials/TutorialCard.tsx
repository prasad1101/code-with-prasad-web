import { FiArrowRight, FiBookOpen, FiLayers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import type { Tutorial } from '../../lib/schemas'
import { TechIcon } from '../ui/TechIcon'
import { lessonCount, levelRange } from './outline'

export function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <article className="card group hover:border-accent/50 relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_var(--c-glow)]">
      <div
        aria-hidden="true"
        className="bg-gradient-accent absolute -top-16 -right-16 size-40 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-30"
      />
      <div className="border-line bg-surface-2 mb-5 grid size-14 place-items-center rounded-2xl border">
        <TechIcon icon={tutorial.icon} name={tutorial.language} className="text-accent-2 size-7" />
      </div>
      {levelRange(tutorial) && (
        <p className="text-muted mb-2 font-mono text-xs tracking-wider uppercase">
          {levelRange(tutorial)}
        </p>
      )}
      <h3 className="text-xl font-semibold">
        <Link to={`/tutorials/${tutorial.slug}`} className="after:absolute after:inset-0">
          {tutorial.title}
        </Link>
      </h3>
      <p className="text-muted mt-2 flex-1 text-sm">{tutorial.description}</p>
      <div className="text-muted mt-6 flex items-center justify-between text-xs">
        <span className="flex gap-4">
          <span className="inline-flex items-center gap-1.5">
            <FiLayers aria-hidden="true" /> {tutorial.chapters.length} chapters
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FiBookOpen aria-hidden="true" /> {lessonCount(tutorial)} lessons
          </span>
        </span>
        <FiArrowRight
          className="text-accent size-4 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
    </article>
  )
}
