import { useMemo } from 'react'
import { lessonContentUrl, postContentUrl, SOURCES } from '../config/dataSources'
import { fetchJson, fetchText } from '../lib/fetchData'
import { useResource, type Resource } from '../lib/resource'
const schemas = () => import('../lib/schemas')

export const loadSite = () => fetchJson(SOURCES.site, () => schemas().then((m) => m.siteSchema))
const loadBlogs = () => fetchJson(SOURCES.blogs, () => schemas().then((m) => m.blogsSchema))
const loadTutorials = () =>
  fetchJson(SOURCES.tutorials, () => schemas().then((m) => m.tutorialsSchema))

export const useSite = () => useResource('site', loadSite)

/** Published posts only (drafts removed), newest first. */
export function useBlogs() {
  const res = useResource('blogs', loadBlogs)
  const posts = useMemo(
    () =>
      res.data?.posts
        .filter((p) => !p.draft)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)) ?? [],
    [res.data],
  )
  return { ...res, posts, categories: res.data?.categories ?? [] }
}

/** Published tutorials only. */
export function useTutorials() {
  const res = useResource('tutorials', loadTutorials)
  const tutorials = useMemo(() => res.data?.tutorials.filter((t) => !t.draft) ?? [], [res.data])
  return { ...res, tutorials }
}

/**
 * Markdown body of a post — inline `content` if the index has it, otherwise the .md file.
 * Takes the slug straight from the route so the file downloads in parallel with the index.
 */
export function usePostContent(slug: string, inline?: string): Resource<string> {
  const res = useResource(inline ? null : `post:${slug}`, () => fetchText(postContentUrl(slug)))
  if (inline) return { status: 'success', data: inline }
  return res
}

/** Markdown body of a tutorial lesson (same parallel-loading approach as posts). */
export function useLessonContent(
  tutorial: string,
  lesson: string,
  inline?: string,
): Resource<string> {
  const res = useResource(inline ? null : `lesson:${tutorial}/${lesson}`, () =>
    fetchText(lessonContentUrl(tutorial, lesson)),
  )
  if (inline) return { status: 'success', data: inline }
  return res
}
