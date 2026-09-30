import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { About } from '../components/home/About'
import { Contact } from '../components/home/Contact'
import { Experience } from '../components/home/Experience'
import { Hero } from '../components/home/Hero'
import { LatestPosts } from '../components/home/LatestPosts'
import { Skills } from '../components/home/Skills'
import { Stats } from '../components/home/Stats'
import { Testimonials } from '../components/home/Testimonials'
import { TutorialsTeaser } from '../components/home/TutorialsTeaser'
import { Work } from '../components/home/Work'
import { lessonCount } from '../components/tutorials/outline'
import { ErrorState } from '../components/ui/ErrorState'
import { Seo } from '../components/ui/Seo'
import { Skeleton } from '../components/ui/Skeleton'
import { loadSite, useBlogs, useSite, useTutorials } from '../hooks/useContent'
import { retry } from '../lib/resource'

export default function Home() {
  const site = useSite()
  const blogs = useBlogs()
  const tuts = useTutorials()
  const { posts } = blogs
  const { tutorials } = tuts
  const settled = (s: string) => s === 'success' || s === 'error'
  const location = useLocation()
  const section = new URLSearchParams(location.search).get('section')

  // Nav links point at /?section=<id>; scroll there once the section exists.
  useEffect(() => {
    if (!section || site.status !== 'success') return
    const id = requestAnimationFrame(() =>
      document.getElementById(section)?.scrollIntoView({ block: 'start' }),
    )
    return () => cancelAnimationFrame(id)
  }, [section, site.status, location.key])

  if (site.status === 'error') {
    return (
      <div className="px-4 pt-40 pb-24">
        <ErrorState message={site.error.message} onRetry={() => retry('site', loadSite)} />
      </div>
    )
  }
  if (site.status !== 'success') return <HomeSkeleton />

  const data = site.data
  // Content counts are always true, so they're derived rather than stored.
  const lessons = tutorials.reduce((n, t) => n + lessonCount(t), 0)
  const stats = [
    ...data.stats,
    ...(posts.length ? [{ label: 'Blog posts', value: String(posts.length) }] : []),
    ...(lessons ? [{ label: 'Tutorial lessons', value: String(lessons) }] : []),
  ]

  return (
    <>
      <Seo description={data.meta.description} image={data.meta.ogImage} />
      <Hero site={data} />
      {/* Wait for the derived counts so the strip doesn't change size after render. */}
      {settled(blogs.status) && settled(tuts.status) ? (
        <Stats stats={stats} />
      ) : (
        <div className="mx-auto h-[212px] max-w-6xl sm:h-[106px]" aria-hidden="true" />
      )}
      <About site={data} />
      <Skills skills={data.skills} />
      <Experience experience={data.experience} />
      <Work projects={data.projects} />
      <LatestPosts />
      <TutorialsTeaser />
      <Testimonials items={data.testimonials} />
      <Contact site={data} />
    </>
  )
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-36 pb-24 sm:px-6" role="status" aria-label="Loading">
      <Skeleton className="mb-6 h-6 w-48 rounded-full" />
      <Skeleton className="mb-4 h-16 w-3/4 max-w-xl" />
      <Skeleton className="mb-8 h-6 w-1/2 max-w-sm" />
      <div className="flex gap-3">
        <Skeleton className="h-12 w-36 rounded-xl" />
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>
      <Skeleton className="mt-20 h-28 w-full rounded-2xl" />
    </div>
  )
}
