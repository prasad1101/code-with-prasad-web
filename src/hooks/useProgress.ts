import { useCallback, useSyncExternalStore } from 'react'

/*
 * Per-browser progress lists (completed lessons, practised questions), kept in
 * localStorage. A convenience only: if storage is unavailable, progress just isn't remembered.
 */

const listeners = new Set<() => void>()
const cache = new Map<string, string[]>()

function read(key: string): string[] {
  if (!cache.has(key)) {
    let value: string[] = []
    try {
      const raw = JSON.parse(localStorage.getItem(key) ?? '[]')
      if (Array.isArray(raw)) value = raw.filter((x): x is string => typeof x === 'string')
    } catch {
      /* ignore */
    }
    cache.set(key, value)
  }
  return cache.get(key)!
}

function write(key: string, value: string[]) {
  cache.set(key, value)
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

/** `key` is the storage key, e.g. `tutorial-progress:javascript`. */
export function useProgress(key: string) {
  const completed = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => read(key),
  )
  const setDone = useCallback(
    (item: string, done: boolean) => {
      const current = read(key).filter((s) => s !== item)
      write(key, done ? [...current, item] : current)
    },
    [key],
  )
  const reset = useCallback(() => write(key, []), [key])
  return { completed, setDone, reset }
}
