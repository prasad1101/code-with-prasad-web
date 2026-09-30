import { useCallback, useSyncExternalStore } from 'react'

/*
 * Per-browser "completed lessons" for each tutorial, kept in localStorage.
 * It's a convenience only: if storage is unavailable, progress just isn't remembered.
 */

const listeners = new Set<() => void>()
const cache = new Map<string, string[]>()
const storageKey = (tutorial: string) => `tutorial-progress:${tutorial}`

function read(tutorial: string): string[] {
  if (!cache.has(tutorial)) {
    let value: string[] = []
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey(tutorial)) ?? '[]')
      if (Array.isArray(raw)) value = raw.filter((x): x is string => typeof x === 'string')
    } catch {
      /* ignore */
    }
    cache.set(tutorial, value)
  }
  return cache.get(tutorial)!
}

function write(tutorial: string, value: string[]) {
  cache.set(tutorial, value)
  try {
    localStorage.setItem(storageKey(tutorial), JSON.stringify(value))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export function useTutorialProgress(tutorial: string) {
  const completed = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => read(tutorial),
  )
  const setDone = useCallback(
    (lesson: string, done: boolean) => {
      const current = read(tutorial).filter((s) => s !== lesson)
      write(tutorial, done ? [...current, lesson] : current)
    },
    [tutorial],
  )
  return { completed, setDone }
}
