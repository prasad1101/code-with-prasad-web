import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import type { PointerEvent } from 'react'
import { FiExternalLink, FiGithub } from 'react-icons/fi'
import type { Site } from '../../lib/schemas'
import { isFilled } from '../../lib/text'
import { Chip } from './Chip'
import { CoverArt } from './CoverArt'

type Project = Site['projects'][number]

/** Project card with a subtle pointer tilt (disabled for reduced motion / touch). */
export function ProjectCard({ project }: { project: Project }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 })

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <m.article
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      whileHover={reduce ? undefined : { y: -6 }}
      className="card group hover:border-accent/50 flex h-full flex-col overflow-hidden transition-[border-color,box-shadow] hover:shadow-[0_24px_60px_-28px_var(--c-glow)]"
    >
      <div className="border-line aspect-[16/9] overflow-hidden border-b">
        <CoverArt
          image={project.image}
          alt={`${project.title} preview`}
          seed={project.slug}
          icon={project.tech[0]}
          className="transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold">{project.title}</h3>
        <p className="text-muted mt-2 flex-1 text-sm leading-relaxed">{project.summary}</p>
        {project.tech.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technologies">
            {project.tech.map((t) => (
              <li key={t}>
                <Chip>{t}</Chip>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex gap-4 text-sm font-medium">
          {isFilled(project.liveUrl) && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent inline-flex items-center gap-1.5 hover:underline"
            >
              <FiExternalLink aria-hidden="true" /> Live
              <span className="sr-only"> site for {project.title}</span>
            </a>
          )}
          {isFilled(project.repoUrl) && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-fg inline-flex items-center gap-1.5"
            >
              <FiGithub aria-hidden="true" /> Code
              <span className="sr-only"> for {project.title}</span>
            </a>
          )}
        </div>
      </div>
    </m.article>
  )
}
