import type { Lesson, Level, Tutorial } from '../../lib/schemas'

export type FlatLesson = {
  lesson: Lesson
  chapter: string
  level?: Level
  chapterIndex: number
  index: number
}

/** Every lesson of a tutorial in reading order, with its chapter. */
export function flattenLessons(t: Tutorial): FlatLesson[] {
  let index = 0
  return t.chapters.flatMap((c, chapterIndex) =>
    c.lessons.map((lesson) => ({
      lesson,
      chapter: c.title,
      level: c.level,
      chapterIndex,
      index: index++,
    })),
  )
}

export const lessonCount = (t: Tutorial) => t.chapters.reduce((n, c) => n + c.lessons.length, 0)

/** "Beginner → Expert", from the first and last chapter levels. */
export function levelRange(t: Tutorial): string | undefined {
  const levels = t.chapters.map((c) => c.level).filter(Boolean)
  if (!levels.length) return t.level
  const first = levels[0]
  const last = levels[levels.length - 1]
  return first === last ? first : `${first} → ${last}`
}
