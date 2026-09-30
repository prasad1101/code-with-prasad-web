import { FiArrowRight } from 'react-icons/fi'
import type { Site } from '../../lib/schemas'
import { Button } from '../ui/Button'
import { ProjectCard } from '../ui/ProjectCard'
import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'

export function Work({ projects }: { projects: Site['projects'] }) {
  if (!projects.length) return null
  const featured = projects.filter((p) => p.featured)
  const shown = (featured.length ? featured : projects).slice(0, 3)
  return (
    <Section id="work" eyebrow="Work" title="Selected projects">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.06}>
            <ProjectCard project={p} />
          </Reveal>
        ))}
      </div>
      {projects.length > shown.length && (
        <div className="mt-10 text-center">
          <Button to="/projects" variant="secondary">
            All projects{' '}
            <FiArrowRight
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Button>
        </div>
      )}
    </Section>
  )
}
