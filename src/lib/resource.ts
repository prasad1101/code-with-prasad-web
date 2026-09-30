import { useEffect, useRef, useSyncExternalStore } from 'react'

/*
 * A tiny keyed async cache. Each key is loaded once per page session and shared by
 * every component that asks for it, so navigating between pages never refetches.
 */

export type Resource<T> =
  | { status: 'idle' | 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error }

const IDLE: Resource<never> = { status: 'idle' }
const LOADING: Resource<never> = { status: 'loading' }

const entries = new Map<string, Resource<unknown>>()
const listeners = new Set<() => void>()

function set(key: string, entry: Resource<unknown>) {
  entries.set(key, entry)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function load<T>(key: string, loader: () => Promise<T>) {
  const current = entries.get(key)
  if (current && current.status !== 'error') return
  set(key, LOADING)
  loader().then(
    (data) => set(key, { status: 'success', data }),
    (error: unknown) =>
      set(key, {
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      }),
  )
}

/** Forget a failed entry so the next render retries it. */
export function retry(key: string, loader: () => Promise<unknown>) {
  entries.delete(key)
  load(key, loader)
}

/** Subscribe to a keyed resource, loading it on first use. Pass `null` to skip. */
export function useResource<T>(key: string | null, loader: () => Promise<T>): Resource<T> {
  const loaderRef = useRef(loader)
  useEffect(() => {
    loaderRef.current = loader
  })
  const entry = useSyncExternalStore(subscribe, () =>
    key ? ((entries.get(key) as Resource<T> | undefined) ?? LOADING) : IDLE,
  )
  useEffect(() => {
    if (key) load(key, () => loaderRef.current())
  }, [key])
  return entry
}
