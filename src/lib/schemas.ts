import { z } from 'zod'

/*
 * Runtime schemas for the JSON in public/data/.
 *
 * They are deliberately forgiving: a malformed item in a list is dropped, and a bad
 * optional field falls back to a default, so one typo in a JSON file degrades a single card
 * instead of blanking the page. Only the few fields a document can't work without
 * (e.g. `profile.name`, the `posts` array) are strict — if those fail, the page shows
 * an error state with a retry button.
 */

/** Array whose invalid items are silently dropped. `required` makes a missing array fatal. */
function list<T extends z.ZodType>(item: T, required = false) {
  const base = required ? z.array(z.unknown()) : z.array(z.unknown()).catch([])
  return base.transform((items) =>
    items.flatMap((raw) => {
      const r = item.safeParse(raw)
      return r.success ? [r.data as z.output<T>] : []
    }),
  )
}

const str = z.string().catch('')
const optStr = z.string().optional().catch(undefined)
const bool = (fallback: boolean) => z.boolean().catch(fallback)

/* ---------- site.json ---------- */

export const siteSchema = z.object({
  meta: z
    .object({
      siteTitle: str,
      tagline: str,
      description: str,
      ogImage: str,
      themeDefault: z.enum(['dark', 'light']).catch('dark'),
    })
    .catch({ siteTitle: '', tagline: '', description: '', ogImage: '', themeDefault: 'dark' }),
  profile: z.object({
    name: z.string().min(1),
    role: str,
    yearsOfExperience: z.number().catch(0),
    location: str,
    avatarUrl: str,
    resumeUrl: str,
    availableForWork: bool(false),
    typingPhrases: list(z.string()),
    summary: str,
  }),
  socials: list(z.object({ platform: z.string(), url: z.string() })),
  stats: list(
    z.object({ label: z.string(), value: z.union([z.string(), z.number()]).transform(String) }),
  ),
  skills: list(
    z.object({
      category: z.string(),
      items: list(
        z.object({
          name: z.string(),
          level: z.number().min(0).max(100).optional().catch(undefined),
          icon: optStr,
        }),
      ),
    }),
  ),
  experience: list(
    z.object({
      company: z.string(),
      role: z.string(),
      start: z.string(),
      end: str,
      location: optStr,
      highlights: list(z.string()),
      tech: list(z.string()),
    }),
  ),
  education: list(
    z.object({
      school: z.string(),
      degree: optStr,
      field: optStr,
      start: optStr,
      end: optStr,
    }),
  ),
  projects: list(
    z.object({
      slug: z.string(),
      title: z.string(),
      summary: str,
      image: optStr,
      tech: list(z.string()),
      liveUrl: optStr,
      repoUrl: optStr,
      featured: bool(false),
    }),
  ),
  testimonials: list(
    z.object({ name: z.string(), role: optStr, quote: z.string(), avatar: optStr }),
  ),
  certifications: list(
    z.object({
      name: z.string(),
      issuer: optStr,
      year: z.number().optional().catch(undefined),
      url: optStr,
    }),
  ),
  contact: z.object({ email: str, formEndpoint: str }).catch({ email: '', formEndpoint: '' }),
})

/* ---------- blogs.json ---------- */

export const postSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  excerpt: str,
  coverImage: optStr,
  tags: list(z.string()),
  category: str,
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  updatedAt: optStr,
  featured: bool(false),
  draft: bool(false),
  /** Inline markdown. When absent, content is loaded from public/content/posts/<slug>.md. */
  content: optStr,
})

export const blogsSchema = z.object({
  categories: list(z.string()),
  posts: list(postSchema, true),
})

/* ---------- tutorials.json ---------- */

const lessonSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  /** Inline markdown. When absent, loaded from public/content/tutorials/<tutorial>/<lesson>.md. */
  content: optStr,
})

export const tutorialSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  language: str,
  icon: optStr,
  level: optStr,
  description: str,
  updatedAt: optStr,
  draft: bool(false),
  chapters: list(z.object({ title: z.string(), lessons: list(lessonSchema) })),
})

export const tutorialsSchema = z.object({
  tutorials: list(tutorialSchema, true),
})

/* ---------- Types ---------- */

export type Site = z.output<typeof siteSchema>
export type Blogs = z.output<typeof blogsSchema>
export type Post = z.output<typeof postSchema>
export type Tutorials = z.output<typeof tutorialsSchema>
export type Tutorial = z.output<typeof tutorialSchema>
export type Lesson = z.output<typeof lessonSchema>
