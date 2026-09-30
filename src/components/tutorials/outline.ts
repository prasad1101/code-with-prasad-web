import type { Lesson, Tutorial } from '../../lib/schemas'

export type FlatLesson = { lesson: Lesson; chapter: string; chapterIndex: number; index: number }

/** Every lesson of a tutorial in reading order, with its chapter. */
export function flattenLessons(t: Tutorial): FlatLesson[] {
  let index = 0
  return t.chapters.flatMap((c, chapterIndex) =>
    c.lessons.map((lesson) => ({ lesson, chapter: c.title, chapterIndex, index: index++ })),
  )
}

export const lessonCount = (t: Tutorial) => t.chapters.reduce((n, c) => n + c.lessons.length, 0)
