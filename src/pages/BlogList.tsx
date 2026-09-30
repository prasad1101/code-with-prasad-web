import { useMemo, useState } from 'react'
import { FiArrowRight, FiSearch } from 'react-icons/fi'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { PostCard } from '../components/blog/PostCard'
import { PostMeta } from '../components/blog/PostMeta'
import { Chip } from '../components/ui/Chip'
import { CoverArt } from '../components/ui/CoverArt'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { Seo } from '../components/ui/Seo'
import { CardGridSkeleton } from '../components/ui/Skeleton'
import { useBlogs } from '../hooks/useContent'
import type { Post } from '../lib/schemas'
import { PAGE_META } from '../lib/seo'

const PAGE_SIZE = 6

export default function BlogList() {
  const { status, posts, categories, error } = useBlogs()
  const [params, setParams] = useSearchParams()
  // The search box keeps its own state: URL updates are async, and reading the value
  // back from the URL would drop fast keystrokes.
  const location = useLocation()
  const urlQ = params.get('q') ?? ''
  const [q, setQ] = useState(urlQ)
  const [seenUrlQ, setSeenUrlQ] = useState(urlQ)
  if (urlQ !== seenUrlQ) {
    setSeenUrlQ(urlQ)
    // The URL's query changed through some other navigation (nav link, back button) — adopt it.
    const fromSearchBox = (location.state as { fromSearch?: boolean } | null)?.fromSearch
    if (!fromSearchBox) setQ(urlQ)
  }
  const category = params.get('category') ?? ''
  const tag = params.get('tag') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  const update = (patch: Record<string, string>, fromSearch = false) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries({ page: '', ...patch })) {
          if (v) next.set(k, v)
          else next.delete(k)
        }
        return next
      },
      { replace: true, preventScrollReset: true, state: fromSearch ? { fromSearch } : null },
    )
  }

  const allCategories = useMemo(
    () =>
      [...new Set([...categories, ...posts.map((p) => p.category)])].filter((c) =>
        posts.some((p) => p.category === c),
      ),
    [categories, posts],
  )
  const allTags = useMemo(() => [...new Set(posts.flatMap((p) => p.tags))].sort(), [posts])

  const filtering = Boolean(q || category || tag)
  const featured = !filtering ? posts.find((p) => p.featured) : undefined

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return posts.filter(
      (p) =>
        p !== featured &&
        (!category || p.category === category) &&
        (!tag || p.tags.includes(tag)) &&
        (!needle ||
          [p.title, p.excerpt, p.category, ...p.tags].some((s) =>
            s.toLowerCase().includes(needle),
          )),
    )
  }, [posts, q, category, tag, featured])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <>
      <Seo {...PAGE_META.blog} path="/blog" />
      <PageHeader
        eyebrow="Blog"
        title={
          <>
            Notes from the <span className="text-gradient">trenches</span>
          </>
        }
        intro="Practical write-ups on the JavaScript ecosystem, databases and building production systems."
      />

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {status === 'error' && <ErrorState message={error.message} />}
        {(status === 'loading' || status === 'idle') && <CardGridSkeleton count={6} />}
        {status === 'success' && (
          <>
            {featured && current === 1 && <FeaturedPost post={featured} />}

            <div className="mb-10 space-y-5">
              <label className="relative block max-w-md">
                <span className="sr-only">Search posts</span>
                <FiSearch
                  className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    update({ q: e.target.value }, true)
                  }}
                  placeholder="Search posts…"
                  className="border-line bg-surface placeholder:text-muted focus:border-accent w-full rounded-xl border py-3 pr-4 pl-11 text-sm transition-colors focus:outline-none"
                />
              </label>
              {allCategories.length > 1 && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
                  <Chip active={!category} onClick={() => update({ category: '' })}>
                    All
                  </Chip>
                  {allCategories.map((c) => (
                    <Chip
                      key={c}
                      active={category === c}
                      onClick={() => update({ category: category === c ? '' : c })}
                    >
                      {c}
                    </Chip>
                  ))}
                </div>
              )}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by tag">
                  {allTags.map((t) => (
                    <Chip
                      key={t}
                      active={tag === t}
                      onClick={() => update({ tag: tag === t ? '' : t })}
                    >
                      #{t}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            <p className="sr-only" role="status">
              {filtered.length} posts found
            </p>

            {visible.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <h2 className="sr-only">Posts</h2>
                {visible.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            ) : (
              <div className="card text-muted p-10 text-center">
                {filtering ? 'No posts match those filters.' : 'More posts are on the way.'}
              </div>
            )}

            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-12 flex justify-center gap-2">
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      update({ page: n === 1 ? '' : String(n) })
                      window.scrollTo({ top: 0 })
                    }}
                    aria-current={n === current ? 'page' : undefined}
                    className={`size-10 rounded-xl border text-sm font-medium ${
                      n === current
                        ? 'bg-gradient-accent border-transparent text-white'
                        : 'border-line text-muted hover:text-fg'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </nav>
            )}
          </>
        )}
      </div>
    </>
  )
}

function FeaturedPost({ post }: { post: Post }) {
  return (
    <Reveal className="mb-14">
      <article className="card group hover:border-accent/50 relative grid overflow-hidden transition-colors md:grid-cols-2">
        <div className="aspect-[16/9] overflow-hidden md:aspect-auto">
          <CoverArt
            image={post.coverImage}
            alt=""
            seed={post.slug}
            icon={post.tags[0] ?? post.category}
            eager
            className="transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <p className="text-accent-2 mb-3 font-mono text-xs tracking-wider uppercase">
            Featured · {post.category}
          </p>
          <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
            <Link to={`/blog/${post.slug}`} className="after:absolute after:inset-0">
              {post.title}
            </Link>
          </h2>
          <p className="text-muted mt-3">{post.excerpt}</p>
          <PostMeta post={post} className="mt-5" />
          <span className="text-accent mt-6 inline-flex items-center gap-2 text-sm font-semibold">
            Read article{' '}
            <FiArrowRight
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </article>
    </Reveal>
  )
}
