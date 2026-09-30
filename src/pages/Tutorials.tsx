import { TutorialCard } from '../components/tutorials/TutorialCard'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { Seo } from '../components/ui/Seo'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { useTutorials } from '../hooks/useContent'

export default function Tutorials() {
  const { status, tutorials, error } = useTutorials()
  return (
    <>
      <Seo
        title="Tutorials"
        path="/tutorials"
        description="Free step-by-step programming tutorials for JavaScript, Python and more — from first program to real projects."
      />
      <PageHeader
        eyebrow="Tutorials"
        title={
          <>
            Learn to code, <span className="text-gradient">step by step</span>
          </>
        }
        intro="Structured, beginner-friendly courses. Each lesson is short, builds on the previous one and comes with examples you can run."
      />
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {status === 'error' && <ErrorState message={error.message} />}
        {(status === 'loading' || status === 'idle') && <CardGridSkeleton count={3} />}
        {status === 'success' &&
          (tutorials.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <h2 className="sr-only">All tutorials</h2>
              {tutorials.map((t, i) => (
                <Reveal key={t.slug} delay={i * 0.05}>
                  <TutorialCard tutorial={t} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="card text-muted p-10 text-center">Tutorials are coming soon.</div>
          ))}
      </div>
    </>
  )
}
