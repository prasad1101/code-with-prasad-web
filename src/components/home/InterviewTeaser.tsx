import { FiArrowRight } from 'react-icons/fi'
import { useInterviewTopics } from '../../hooks/useContent'
import { TopicCard } from '../interview/TopicCard'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'
import { CardGridSkeleton } from '../ui/Skeleton'

export function InterviewTeaser() {
  const { status, topics } = useInterviewTopics()
  if (status === 'error' || (status === 'success' && !topics.length)) return null
  return (
    <Section
      id="interview"
      eyebrow="Interview prep"
      title="Practise for your next interview"
      intro="Question banks with detailed answers for every topic — filter by level, track your progress, or test yourself in practice mode."
    >
      {status === 'success' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.slice(0, 6).map((t, i) => (
            <Reveal key={t.slug} delay={i * 0.04}>
              <TopicCard topic={t} />
            </Reveal>
          ))}
        </div>
      ) : (
        <CardGridSkeleton count={3} />
      )}
      <div className="mt-10 text-center">
        <Button to="/interview" variant="secondary">
          All interview topics{' '}
          <FiArrowRight
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Button>
      </div>
    </Section>
  )
}
