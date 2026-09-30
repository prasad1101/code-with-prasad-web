import { FiArrowRight } from 'react-icons/fi'
import { useTutorials } from '../../hooks/useContent'
import { TutorialCard } from '../tutorials/TutorialCard'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'
import { CardGridSkeleton } from '../ui/Skeleton'

export function TutorialsTeaser() {
  const { status, tutorials } = useTutorials()
  if (status === 'error' || (status === 'success' && !tutorials.length)) return null
  return (
    <Section
      id="tutorials"
      eyebrow="Tutorials"
      title="Learn step by step"
      intro="Free, structured courses that start from zero — each lesson builds on the last, with runnable examples."
    >
      {status === 'success' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tutorials.slice(0, 3).map((t, i) => (
            <Reveal key={t.slug} delay={i * 0.06}>
              <TutorialCard tutorial={t} />
            </Reveal>
          ))}
        </div>
      ) : (
        <CardGridSkeleton count={2} />
      )}
      <div className="mt-10 text-center">
        <Button to="/tutorials" variant="secondary">
          Browse tutorials{' '}
          <FiArrowRight
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Button>
      </div>
    </Section>
  )
}
