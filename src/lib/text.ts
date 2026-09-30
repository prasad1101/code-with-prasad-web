/** True for real values; empty strings and "TODO: …" placeholders count as missing. */
export function isFilled(value: string | undefined | null): value is string {
  if (!value) return false
  const v = value.trim()
  return v.length > 0 && !/^TODO\b/i.test(v)
}

export const isEmail = (v: string | undefined) =>
  isFilled(v) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/** Estimated minutes to read a markdown document (~220 wpm). */
export function readingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

const dateFmt = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})
const monthFmt = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', timeZone: 'UTC' })

/** "2026-09-20" → "Sep 20, 2026". Returns the input if it isn't a date. */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d)
}

/** "2021-04" → "Apr 2021", "present" → "Present". */
export function formatMonth(ym: string): string {
  if (!ym || /^present$/i.test(ym)) return 'Present'
  const d = new Date(`${ym.length === 7 ? `${ym}-01` : ym}`)
  return Number.isNaN(d.getTime()) ? ym : monthFmt.format(d)
}

/** Human duration between two "YYYY-MM" values, e.g. "2 yrs 3 mos". */
export function duration(start: string, end: string): string {
  const s = new Date(`${start}-01`)
  const e = !end || /^present$/i.test(end) ? new Date() : new Date(`${end}-01`)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ''
  // LinkedIn counts both the start and end month.
  const months =
    (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + e.getUTCMonth() - s.getUTCMonth() + 1
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`]
    .filter(Boolean)
    .join(' ')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/&[#a-z0-9]+;/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
}
