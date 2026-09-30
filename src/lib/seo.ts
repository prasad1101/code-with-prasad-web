import { SITE_ORIGIN } from '../config/site.ts'

/*
 * Titles, descriptions and URLs shared by the <Seo> component (client) and the build step
 * that writes one static HTML file per route (vite.config.ts). Keeping both on the same
 * functions means crawlers that don't run JavaScript see exactly what the app renders.
 * No React and no browser APIs here — this module is also imported by Node at build time.
 */

export const SITE_NAME = 'Code with Prasad'
export const DEFAULT_TITLE = 'Code with Prasad — Tutorials, Interview Prep & Developer Tools'
export const DEFAULT_DESCRIPTION =
  'Free coding tutorials from beginner to expert, interview questions with explained answers and online developer tools — JavaScript, React, Python, SQL and more.'
export const DEFAULT_OG_IMAGE = '/images/og/default.png'

export const pageTitle = (title?: string) => (title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE)

/**
 * Absolute canonical URL for a route path: "/tools/jwt-decoder" → ".../tools/jwt-decoder/".
 * Every page is built as <path>/index.html, which GitHub Pages serves at the trailing-slash
 * URL (the slash-less form 301-redirects there), so the slash form is the canonical one.
 */
export const canonicalUrl = (path = '/') => {
  const clean = path.replace(/^\/+|\/+$/g, '')
  return `${SITE_ORIGIN}/${clean ? `${clean}/` : ''}`
}

/** Absolute URL for an asset path or already-absolute URL. */
export const absoluteUrl = (pathOrUrl: string) => new URL(pathOrUrl, `${SITE_ORIGIN}/`).href

/** Title / description / social image for the fixed (non-data) pages. */
export const PAGE_META = {
  blog: {
    title: 'Blog — JavaScript, Node.js, React & MongoDB articles',
    description:
      'Practical articles on JavaScript, Node.js, React, Angular, MongoDB and system design by Prasad Pawar, a senior full stack developer.',
    image: '/images/og/blog.png',
  },
  tutorials: {
    title: 'Free Programming Tutorials — Beginner to Expert',
    description:
      'Free step-by-step tutorials from beginner to expert: JavaScript, TypeScript, Python, Angular, React, Node.js, Express, SQL, MongoDB, data analytics and data engineering.',
    image: '/images/og/tutorials.png',
  },
  interview: {
    title: 'Interview Questions & Answers — JavaScript, React, Python, SQL and more',
    description:
      'Technical interview questions with detailed answers: JavaScript, TypeScript, Python, Angular, React, Node.js, SQL, MongoDB and data engineering.',
    image: '/images/og/interview.png',
  },
  tools: {
    title: 'Free Online Developer Tools — JSON, JWT, Regex, Base64 & more',
    description:
      'Free, private online developer tools: JSON formatter, JWT decoder, regex tester, Base64, SQL formatter, cron explainer, UUID and password generators.',
    image: '/images/og/tools.png',
  },
  projects: {
    title: 'Projects',
    description: 'Projects built by Prasad Pawar across the MEAN and MERN stacks.',
    image: DEFAULT_OG_IMAGE,
  },
  privacy: {
    title: 'Privacy policy',
    description:
      'How Code with Prasad handles analytics, cookies and the data you use in its tools.',
    image: DEFAULT_OG_IMAGE,
  },
} as const

/** First real paragraph of a Markdown document as plain text, cut at a word boundary. */
export function excerptFromMarkdown(md: string, max = 158): string {
  const paragraph =
    md
      .replace(/```[\s\S]*?```/g, '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !/^(#|>|\||[-*+] |\d+\. |<|!\[)/.test(p)) ?? ''
  const text = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '')}…`
}

/* ---------- Data-driven pages (same wording in the app and the static HTML) ---------- */

export const tutorialSeoTitle = (title: string) => `${title} — Beginner to Expert, Free`

export const lessonSeo = (tutorialTitle: string, lessonTitle: string, markdown?: string) => ({
  title: `${lessonTitle} — ${tutorialTitle}`,
  description: (markdown && excerptFromMarkdown(markdown)) || `${tutorialTitle}: ${lessonTitle}.`,
})

export const interviewSeoTitle = (topic: string) => `${topic} Interview Questions & Answers`
