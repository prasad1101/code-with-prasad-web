/**
 * Where the site's content comes from. Everything is static and versioned in this repo:
 *
 *   public/data/site.json        profile, skills, experience, projects …
 *   public/data/blogs.json       blog index (metadata only)
 *   public/data/tutorials.json   tutorial index (chapters + lesson titles)
 *   public/content/posts/<slug>.md                   blog post bodies
 *   public/content/tutorials/<tutorial>/<lesson>.md  lesson bodies
 *   public/data/interview.json   interview topics
 *   public/content/interview/<topic>.md              question banks
 *   public/data/tools.json       curated directory of external developer tools
 *
 * Paths are resolved against Vite's base URL, so they follow BASE_PATH automatically.
 */
const base = import.meta.env.BASE_URL

export const SOURCES = {
  site: `${base}data/site.json`,
  blogs: `${base}data/blogs.json`,
  tutorials: `${base}data/tutorials.json`,
  interview: `${base}data/interview.json`,
  tools: `${base}data/tools.json`,
} as const

export const postContentUrl = (slug: string) => `${base}content/posts/${slug}.md`

export const lessonContentUrl = (tutorial: string, lesson: string) =>
  `${base}content/tutorials/${tutorial}/${lesson}.md`

export const interviewContentUrl = (topic: string) => `${base}content/interview/${topic}.md`
