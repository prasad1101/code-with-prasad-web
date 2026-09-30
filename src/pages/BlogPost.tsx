import { useMemo } from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import { Article } from '../components/blog/Article'
import { PostCard } from '../components/blog/PostCard'
import { PostMeta } from '../components/blog/PostMeta'
import { ShareButtons } from '../components/blog/ShareButtons'
import { MobileToc, Toc } from '../components/blog/Toc'
import { ReadingProgress } from '../components/layout/ReadingProgress'
import { Chip } from '../components/ui/Chip'
import { ErrorState } from '../components/ui/ErrorState'
import { PrevNext } from '../components/ui/PrevNext'
import { Seo } from '../components/ui/Seo'
import { ArticleSkeleton, PageSkeleton } from '../components/ui/Skeleton'
import { useBlogs, usePostContent } from '../hooks/useContent'
import { renderArticle } from '../lib/markdown/rich'
import { canonicalUrl, PAGE_META } from '../lib/seo'
import { formatDate, isFilled } from '../lib/text'
import NotFound from './NotFound'

export default function BlogPost() {
  const { slug = '' } = useParams()
  const { status, posts, error } = useBlogs()
  const index = posts.findIndex((p) => p.slug === slug)
  const post = posts[index]
  const content = usePostContent(slug, post?.content)
  const path = `/blog/${slug}`
  const article = useMemo(
    () => (content.data ? renderArticle(content.data, path) : undefined),
    [content.data, path],
  )

  const related = useMemo(() => {
    if (!post) return []
    return posts
      .filter((p) => p !== post)
      .map((p) => ({
        p,
        score:
          p.tags.filter((t) => post.tags.includes(t)).length +
          (p.category === post.category ? 0.5 : 0),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.p)
  }, [post, posts])

  if (status === 'error')
    return (
      <div className="px-4 pt-40 pb-24">
        <ErrorState message={error.message} />
      </div>
    )
  if (status !== 'success') return <PageSkeleton />
  if (!post) return <NotFound />

  // posts are newest-first: "previous" is the older post.
  const older = posts[index + 1]
  const newer = posts[index - 1]

  return (
    <>
      <Seo
        title={post.title}
        description={post.excerpt}
        path={path}
        image={post.coverImage || PAGE_META.blog.image}
        type="article"
        publishedAt={post.publishedAt}
      />
      <ReadingProgress />
      <article className="mx-auto max-w-6xl px-4 pt-28 pb-24 sm:px-6 sm:pt-36">
        <header className="mx-auto max-w-3xl">
          <Link
            to="/blog"
            className="text-muted hover:text-fg mb-8 inline-flex items-center gap-2 text-sm"
          >
            <FiArrowLeft aria-hidden="true" /> All posts
          </Link>
          {post.category && (
            <p className="text-accent-2 mb-3 font-mono text-xs tracking-wider uppercase">
              {post.category}
            </p>
          )}
          <h1 className="text-3xl leading-tight font-bold sm:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="text-muted mt-4 text-lg">{post.excerpt}</p>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <PostMeta post={post} className="text-sm" />
              {isFilled(post.updatedAt) && post.updatedAt !== post.publishedAt && (
                <p className="text-muted mt-1 text-xs">Updated {formatDate(post.updatedAt)}</p>
              )}
            </div>
            <ShareButtons url={canonicalUrl(path)} title={post.title} />
          </div>
        </header>

        {isFilled(post.coverImage) && (
          <img
            src={post.coverImage}
            alt=""
            className="border-line mx-auto mt-10 aspect-[2/1] w-full max-w-4xl rounded-2xl border object-cover"
          />
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_220px] lg:justify-center xl:grid-cols-[minmax(0,48rem)_240px]">
          <div className="min-w-0">
            {article && <MobileToc items={article.toc} />}
            {content.status === 'error' && <ErrorState message={content.error.message} />}
            {article ? (
              <Article html={article.html} />
            ) : (
              content.status !== 'error' && <ArticleSkeleton />
            )}

            {post.tags.length > 0 && (
              <div className="border-line mt-12 flex flex-wrap gap-2 border-t pt-8">
                {post.tags.map((t) => (
                  <Link key={t} to={`/blog?tag=${encodeURIComponent(t)}`}>
                    <Chip className="hover:border-accent/50 hover:text-fg">#{t}</Chip>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-8 flex justify-end">
              <ShareButtons url={canonicalUrl(path)} title={post.title} />
            </div>
            <div className="mt-12">
              <PrevNext
                prev={older && { to: `/blog/${older.slug}`, title: older.title }}
                next={newer && { to: `/blog/${newer.slug}`, title: newer.title }}
              />
            </div>
          </div>
          {article && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <Toc items={article.toc} />
              </div>
            </aside>
          )}
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-24">
            <h2 id="related-title" className="mb-8 text-2xl font-bold">
              Related posts
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}
