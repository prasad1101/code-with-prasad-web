import { LEVELS, type Level } from './schemas'
import { slugify } from './text'

/*
 * Question banks are Markdown files (public/content/interview/<topic>.md):
 *
 *   ## What is a closure?
 *   Level: Beginner | Tags: functions, scope
 *
 *   Answer in Markdown (use ### for sub-headings inside an answer)…
 *
 * Every `## ` heading starts a new question. The Level/Tags line is optional.
 */

export type Question = {
  id: string
  question: string
  level: Level
  tags: string[]
  answer: string
}

const META = /^level:\s*([a-z]+)\s*(?:\|\s*tags:\s*(.*))?$/i

export function parseQuestions(md: string): Question[] {
  const used = new Set<string>()
  return md
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [first, ...rest] = block.split('\n')
      const question = first.trim()
      let body = rest.join('\n').trim()
      let level: Level = 'Intermediate'
      let tags: string[] = []
      const meta = body.split('\n')[0].trim().match(META)
      if (meta) {
        const lv = LEVELS.find((l) => l.toLowerCase() === meta[1].toLowerCase())
        if (lv) level = lv
        tags = (meta[2] ?? '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
        body = body.split('\n').slice(1).join('\n').trim()
      }
      let id = slugify(question).slice(0, 80) || 'question'
      for (let n = 2; used.has(id); n++) id = `${slugify(question).slice(0, 76)}-${n}`
      used.add(id)
      return { id, question, level, tags, answer: body }
    })
    .filter((q) => q.question && q.answer)
}
