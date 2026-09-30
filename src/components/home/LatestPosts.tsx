import { FiArrowRight } from 'react-icons/fi'
import { useBlogs } from '../../hooks/useContent'
import { PostCard } from '../blog/PostCard'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'
import { CardGridSkeleton } from '../ui/Skeleton'

export function LatestPosts() {
  const { status, posts } = useBlogs()
  if (status === 'error' || (status === 'success' && !posts.length)) return null
  return (
    <Section
      id="blog"
      eyebrow="Blog"
      title="Latest writing"
      intro="Deep dives into JavaScript, Node.js, React, Angular and MongoDB — the things I use daily."
    >
      {status === 'success' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <PostCard post={p} />
            </Reveal>
          ))}
        </div>
      ) : (
        <CardGridSkeleton />
      )}
      <div className="mt-10 text-center">
        <Button to="/blog" variant="secondary">
          Read the blog{' '}
          <FiArrowRight
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Button>
      </div>
    </Section>
  )
}
