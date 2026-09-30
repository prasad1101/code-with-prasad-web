import { useMemo } from 'react'
import { TopicCard } from '../components/interview/TopicCard'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { Seo } from '../components/ui/Seo'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { useInterviewTopics } from '../hooks/useContent'
import { PAGE_META } from '../lib/seo'

export default function Interview() {
  const { status, topics, error } = useInterviewTopics()
  const groups = useMemo(() => {
    const cats = [...new Set(topics.map((t) => t.category || 'More'))]
    return cats.map((c) => ({
      category: c,
      items: topics.filter((t) => (t.category || 'More') === c),
    }))
  }, [topics])

  return (
    <>
      <Seo {...PAGE_META.interview} path="/interview" />
      <PageHeader
        eyebrow="Interview prep"
        title={
          <>
            Crack your next <span className="text-gradient">technical interview</span>
          </>
        }
        intro="Real interview questions with clear, detailed answers — from fundamentals to senior-level depth. Filter by level, track what you've practised, or switch to practice mode and test yourself."
      />
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {status === 'error' && <ErrorState message={error.message} />}
        {(status === 'loading' || status === 'idle') && <CardGridSkeleton count={6} />}
        {status === 'success' &&
          (topics.length ? (
            <div className="space-y-12">
              {groups.map((g) => (
                <section key={g.category} aria-labelledby={`icat-${g.category}`}>
                  <h2 id={`icat-${g.category}`} className="mb-5 text-2xl font-bold">
                    {g.category}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((t, i) => (
                      <Reveal key={t.slug} delay={i * 0.04}>
                        <TopicCard topic={t} />
                      </Reveal>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="card text-muted p-10 text-center">Question banks are coming soon.</div>
          ))}
      </div>
    </>
  )
}
