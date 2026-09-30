import { FiCalendar, FiClock } from 'react-icons/fi'
import { usePostContent } from '../../hooks/useContent'
import type { Post } from '../../lib/schemas'
import { formatDate, readingTime } from '../../lib/text'

/** "Sep 20, 2026 · 8 min read". Reading time is computed from the post body. */
export function PostMeta({ post, className = '' }: { post: Post; className?: string }) {
  const content = usePostContent(post.slug, post.content)
  return (
    <p className={`text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <FiCalendar aria-hidden="true" />
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      </span>
      {content.data && (
        <span className="inline-flex items-center gap-1.5">
          <FiClock aria-hidden="true" /> {readingTime(content.data)} min read
        </span>
      )}
    </p>
  )
}
