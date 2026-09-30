import { useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

/** Types and deletes each phrase in turn. With reduced motion it simply swaps phrases. */
export function Typing({ phrases }: { phrases: string[] }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const phrase = phrases[index % phrases.length] ?? ''

  useEffect(() => {
    if (phrases.length === 0) return
    if (reduce) {
      const t = setTimeout(() => setIndex((i) => i + 1), 2600)
      return () => clearTimeout(t)
    }
    let delay = deleting ? 40 : 85
    if (!deleting && length === phrase.length) delay = 1600
    if (deleting && length === 0) delay = 350
    const t = setTimeout(() => {
      if (!deleting && length === phrase.length) setDeleting(true)
      else if (deleting && length === 0) {
        setDeleting(false)
        setIndex((i) => i + 1)
      } else setLength((l) => l + (deleting ? -1 : 1))
    }, delay)
    return () => clearTimeout(t)
  }, [reduce, deleting, length, phrase, phrases.length])

  return (
    <>
      <span aria-hidden="true" className="text-gradient font-semibold">
        {reduce ? phrase : phrase.slice(0, length)}
      </span>
      <span className="caret" aria-hidden="true" />
      <span className="sr-only">{phrases.join(', ')}</span>
    </>
  )
}
