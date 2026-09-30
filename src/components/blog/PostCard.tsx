import { Link } from 'react-router-dom'
import type { Post } from '../../lib/schemas'
import { Chip } from '../ui/Chip'
import { CoverArt } from '../ui/CoverArt'
import { PostMeta } from './PostMeta'

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="card group hover:border-accent/50 relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_var(--c-glow)]">
      <div className="border-line aspect-[16/9] overflow-hidden border-b">
        <CoverArt
          image={post.coverImage}
          alt=""
          seed={post.slug}
          icon={post.tags[0] ?? post.category}
          className="transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        {post.category && (
          <p className="text-accent-2 mb-2 font-mono text-xs tracking-wider uppercase">
            {post.category}
          </p>
        )}
        <h3 className="text-lg leading-snug font-semibold">
          <Link to={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className="text-muted mt-2 line-clamp-3 flex-1 text-sm">{post.excerpt}</p>
        <PostMeta post={post} className="mt-4" />
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((t) => (
              <Chip key={t}>#{t}</Chip>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
