import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { GOOGLE_SITE_VERIFICATION, SITE_ORIGIN } from '../src/config/site.ts'
import {
  absoluteUrl,
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  interviewSeoTitle,
  lessonSeo,
  PAGE_META,
  pageTitle,
  SITE_NAME,
  tutorialSeoTitle,
} from '../src/lib/seo.ts'
import { TOOL_META } from '../src/tools/meta.ts'

/*
 * Build step for search engines and link previews. The app is a single-page app, so
 * without this every URL would serve the same index.html (and GitHub Pages would answer
 * deep links with a 404 status). After Vite builds, this writes:
 *
 *   <route>/index.html  for every page — the app shell with that page's <title>, meta
 *                       description, canonical URL, Open Graph/Twitter tags and JSON-LD
 *   404.html            the shell for unknown URLs (noindex; the app shows its 404 page)
 *   sitemap.xml         every indexable URL with its last-modified date (from git)
 *   robots.txt          allows everything and points to the sitemap
 *
 * Titles and descriptions come from src/lib/seo.ts — the same helpers the <Seo> component
 * uses — so the static tags match what the app renders. Tags carry data-rh so
 * react-helmet-async replaces them on client-side navigation.
 */

type JsonLd = Record<string, unknown>

type Route = {
  path: string
  title?: string
  description: string
  image?: string
  type?: 'website' | 'article'
  publishedAt?: string
  jsonLd?: JsonLd[]
  /** Files whose last commit date is this page's lastmod. */
  sources?: string[]
  priority?: number
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** JSON for a <script> tag — `<` escaped so content can never close the tag. */
const jsonScript = (data: JsonLd) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

/** Latest commit date per file, from one `git log` call. Uncommitted files get "now". */
function gitDates(root: string): Map<string, string> {
  const dates = new Map<string, string>()
  try {
    const out = execFileSync(
      'git',
      ['log', '--format=%x00%cI', '--name-only', '--', 'public', 'src/tools/meta.ts'],
      {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      },
    )
    for (const block of out.split('\0').slice(1)) {
      const [date, ...files] = block.trim().split('\n')
      for (const f of files) if (f && !dates.has(f)) dates.set(f, date.trim())
    }
  } catch {
    /* not a git checkout — every page gets the build date */
  }
  return dates
}

const readingMinutes = (md: string) => md.split(/\s+/).filter(Boolean).length / 200

/** ISO 8601 duration, e.g. 330 minutes → "PT5H30M". */
const isoDuration = (minutes: number) => {
  const m = Math.max(1, Math.round(minutes))
  const h = Math.floor(m / 60)
  return `PT${h ? `${h}H` : ''}${m % 60 ? `${m % 60}M` : ''}`
}

function breadcrumbs(items: [name: string, path: string][]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'] as [string, string], ...items].map(([name, p], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: canonicalUrl(p),
    })),
  }
}

function collectRoutes(root: string): Route[] {
  const readJson = (f: string) =>
    JSON.parse(fs.readFileSync(path.join(root, 'public/data', f), 'utf8'))
  const readText = (f: string) => {
    try {
      return fs.readFileSync(path.join(root, 'public', f), 'utf8')
    } catch {
      return ''
    }
  }
  const site = readJson('site.json')
  const blogs = readJson('blogs.json')
  const tutorials = readJson('tutorials.json')
  const interview = readJson('interview.json')

  const person: JsonLd = {
    '@type': 'Person',
    '@id': `${SITE_ORIGIN}/#person`,
    name: site.profile.name,
    jobTitle: site.profile.role?.split('·')[0]?.trim(),
    url: canonicalUrl('/'),
    image: site.profile.avatarUrl
      ? absoluteUrl(`/${site.profile.avatarUrl.replace(/^\//, '')}`)
      : undefined,
    sameAs: (site.socials ?? [])
      .map((s: { url: string }) => s.url)
      .filter((u: string) => /^https?:/.test(u)),
  }
  const author = { '@id': `${SITE_ORIGIN}/#person` }

  const routes: Route[] = []

  routes.push({
    path: '/',
    description: site.meta?.description || DEFAULT_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
    priority: 1,
    sources: ['public/data/site.json'],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${SITE_ORIGIN}/#website`,
            name: SITE_NAME,
            url: canonicalUrl('/'),
            description: DEFAULT_DESCRIPTION,
            inLanguage: 'en',
            publisher: author,
          },
          person,
        ],
      },
    ],
  })

  // ---- Blog
  const posts = (blogs.posts ?? []).filter((p: { draft?: boolean }) => !p.draft)
  routes.push({
    path: '/blog',
    ...PAGE_META.blog,
    priority: 0.7,
    sources: ['public/data/blogs.json'],
    jsonLd: [breadcrumbs([['Blog', '/blog']])],
  })
  for (const p of posts) {
    const url = `/blog/${p.slug}`
    routes.push({
      path: url,
      title: p.title,
      description: p.excerpt || DEFAULT_DESCRIPTION,
      image: p.coverImage || PAGE_META.blog.image,
      type: 'article',
      publishedAt: p.publishedAt,
      priority: 0.7,
      sources: ['public/data/blogs.json', `public/content/posts/${p.slug}.md`],
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: p.title,
          description: p.excerpt,
          datePublished: p.publishedAt,
          dateModified: p.updatedAt || p.publishedAt,
          author: { '@type': 'Person', name: site.profile.name, url: canonicalUrl('/') },
          image: absoluteUrl(p.coverImage || PAGE_META.blog.image),
          mainEntityOfPage: canonicalUrl(url),
          keywords: (p.tags ?? []).join(', '),
        },
        breadcrumbs([
          ['Blog', '/blog'],
          [p.title, url],
        ]),
      ],
    })
  }

  // ---- Tutorials
  const courses = (tutorials.tutorials ?? []).filter((t: { draft?: boolean }) => !t.draft)
  routes.push({
    path: '/tutorials',
    ...PAGE_META.tutorials,
    priority: 0.9,
    sources: ['public/data/tutorials.json'],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Programming tutorials',
        itemListElement: courses.map((t: { slug: string }, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: canonicalUrl(`/tutorials/${t.slug}`),
        })),
      },
      breadcrumbs([['Tutorials', '/tutorials']]),
    ],
  })
  for (const t of courses) {
    const coursePath = `/tutorials/${t.slug}`
    const lessons: { slug: string; title: string; level?: string; md: string }[] = []
    for (const ch of t.chapters ?? []) {
      for (const l of ch.lessons ?? []) {
        lessons.push({
          ...l,
          level: ch.level,
          md: l.content || readText(`content/tutorials/${t.slug}/${l.slug}.md`),
        })
      }
    }
    // Reading time plus ~10 minutes per lesson for its hands-on exercise.
    const minutes = lessons.reduce((n, l) => n + readingMinutes(l.md) + 10, 0)
    routes.push({
      path: coursePath,
      title: tutorialSeoTitle(t.title),
      description: t.description || DEFAULT_DESCRIPTION,
      image: PAGE_META.tutorials.image,
      priority: 0.9,
      sources: ['public/data/tutorials.json'],
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: t.title,
          description: t.description,
          url: canonicalUrl(coursePath),
          provider: { '@type': 'Person', name: site.profile.name, url: canonicalUrl('/') },
          inLanguage: 'en',
          isAccessibleForFree: true,
          educationalLevel: 'Beginner to Expert',
          numberOfLessons: lessons.length,
          offers: { '@type': 'Offer', category: 'Free', price: 0, priceCurrency: 'INR' },
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'Online',
            courseWorkload: isoDuration(minutes),
          },
        },
        breadcrumbs([
          ['Tutorials', '/tutorials'],
          [t.title, coursePath],
        ]),
      ],
    })
    for (const l of lessons) {
      const url = `${coursePath}/${l.slug}`
      const seo = lessonSeo(t.title, l.title, l.md)
      routes.push({
        path: url,
        ...seo,
        image: PAGE_META.tutorials.image,
        type: 'article',
        priority: 0.8,
        sources: ['public/data/tutorials.json', `public/content/tutorials/${t.slug}/${l.slug}.md`],
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: l.title,
            description: seo.description,
            author: { '@type': 'Person', name: site.profile.name, url: canonicalUrl('/') },
            mainEntityOfPage: canonicalUrl(url),
            isPartOf: { '@type': 'Course', name: t.title, url: canonicalUrl(coursePath) },
            learningResourceType: 'Tutorial',
            educationalLevel: l.level,
            inLanguage: 'en',
          },
          breadcrumbs([
            ['Tutorials', '/tutorials'],
            [t.title, coursePath],
            [l.title, url],
          ]),
        ],
      })
    }
  }

  // ---- Interview prep
  const topics = (interview.topics ?? []).filter((t: { draft?: boolean }) => !t.draft)
  routes.push({
    path: '/interview',
    ...PAGE_META.interview,
    priority: 0.9,
    sources: ['public/data/interview.json'],
    jsonLd: [breadcrumbs([['Interview prep', '/interview']])],
  })
  for (const t of topics) {
    const url = `/interview/${t.slug}`
    routes.push({
      path: url,
      title: interviewSeoTitle(t.title),
      description: t.description || PAGE_META.interview.description,
      image: PAGE_META.interview.image,
      priority: 0.8,
      sources: ['public/data/interview.json', `public/content/interview/${t.slug}.md`],
      jsonLd: [
        breadcrumbs([
          ['Interview prep', '/interview'],
          [t.title, url],
        ]),
      ],
    })
  }

  // ---- Developer tools
  routes.push({
    path: '/tools',
    ...PAGE_META.tools,
    priority: 0.9,
    sources: ['src/tools/meta.ts', 'public/data/tools.json'],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Free online developer tools',
        itemListElement: TOOL_META.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: canonicalUrl(`/tools/${t.slug}`),
          name: t.title,
        })),
      },
      breadcrumbs([['Developer tools', '/tools']]),
    ],
  })
  for (const t of TOOL_META) {
    const url = `/tools/${t.slug}`
    routes.push({
      path: url,
      title: t.seoTitle,
      description: t.description,
      image: `/images/og/tools/${t.slug}.png`,
      priority: 0.9,
      sources: ['src/tools/meta.ts'],
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: t.title,
          url: canonicalUrl(url),
          description: t.description,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any (runs in the web browser)',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: 0, priceCurrency: 'INR' },
          author: { '@type': 'Person', name: site.profile.name, url: canonicalUrl('/') },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: t.faq.map(([q, a]) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        },
        breadcrumbs([
          ['Developer tools', '/tools'],
          [t.title, url],
        ]),
      ],
    })
  }

  routes.push({
    path: '/projects',
    ...PAGE_META.projects,
    priority: 0.5,
    sources: ['public/data/site.json'],
  })
  routes.push({ path: '/privacy', ...PAGE_META.privacy, priority: 0.2 })
  return routes
}

function headTags(r: Route | null): string {
  const title = r ? pageTitle(r.title) : DEFAULT_TITLE
  const description = r?.description || DEFAULT_DESCRIPTION
  const url = r ? canonicalUrl(r.path) : canonicalUrl('/')
  const image = absoluteUrl(r?.image || DEFAULT_OG_IMAGE)
  const rh = 'data-rh="true"'
  const tags = [
    `<title ${rh}>${esc(title)}</title>`,
    `<meta ${rh} name="description" content="${esc(description)}" />`,
    r
      ? `<link ${rh} rel="canonical" href="${esc(url)}" />`
      : `<meta ${rh} name="robots" content="noindex" />`,
    `<meta ${rh} property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta ${rh} property="og:title" content="${esc(title)}" />`,
    `<meta ${rh} property="og:description" content="${esc(description)}" />`,
    `<meta ${rh} property="og:type" content="${r?.type ?? 'website'}" />`,
    `<meta ${rh} property="og:url" content="${esc(url)}" />`,
    `<meta ${rh} property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="en_IN" />`,
    r?.publishedAt
      ? `<meta ${rh} property="article:published_time" content="${esc(r.publishedAt)}" />`
      : '',
    `<meta ${rh} name="twitter:card" content="summary_large_image" />`,
    `<meta ${rh} name="twitter:title" content="${esc(title)}" />`,
    `<meta ${rh} name="twitter:description" content="${esc(description)}" />`,
    `<meta ${rh} name="twitter:image" content="${esc(image)}" />`,
    GOOGLE_SITE_VERIFICATION
      ? `<meta name="google-site-verification" content="${esc(GOOGLE_SITE_VERIFICATION)}" />`
      : '',
    ...(r?.jsonLd ?? []).map(jsonScript),
  ]
  return tags.filter(Boolean).join('\n    ')
}

const SEO_BLOCK = /<!--seo-->[\s\S]*?<!--\/seo-->/

export function seoPages(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'seo-pages',
    apply: 'build',
    configResolved(c) {
      config = c
    },
    closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir)
      const shell = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      if (!SEO_BLOCK.test(shell))
        throw new Error('index.html is missing the <!--seo--> … <!--/seo--> block')
      const render = (r: Route | null) => shell.replace(SEO_BLOCK, () => headTags(r)) // function: FAQ text contains $&, $1 …

      const routes = collectRoutes(config.root)
      const seen = new Set<string>()
      for (const r of routes) {
        if (seen.has(r.path)) throw new Error(`Duplicate route ${r.path}`)
        seen.add(r.path)
        const file = path.join(outDir, r.path, 'index.html')
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, render(r))
      }
      fs.writeFileSync(path.join(outDir, '404.html'), render(null))

      const dates = gitDates(config.root)
      const today = new Date().toISOString()
      const lastmod = (r: Route) =>
        (r.sources ?? [])
          .map((s) => dates.get(s) ?? today)
          .sort()
          .at(-1) ?? today
      const urls = routes
        .map(
          (r) =>
            `  <url>\n    <loc>${esc(canonicalUrl(r.path))}</loc>\n    <lastmod>${lastmod(r).slice(0, 10)}</lastmod>\n    <priority>${(r.priority ?? 0.5).toFixed(1)}</priority>\n  </url>`,
        )
        .join('\n')
      fs.writeFileSync(
        path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      )
      fs.writeFileSync(
        path.join(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
      )
      config.logger.info(
        `seo-pages: wrote ${routes.length} pages, 404.html, sitemap.xml and robots.txt`,
      )
    },
  }
}
