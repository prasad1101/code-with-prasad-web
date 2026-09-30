**Custom hooks** let you extract and reuse stateful logic between components. A custom hook is just a function whose name starts with `use` and that calls other hooks. They're the main way React code is shared — most libraries (React Router, TanStack Query, Zustand) expose their features as hooks.

## Extracting a hook

Two components both track whether the browser is online:

```tsx
import { useEffect, useState } from 'react'

export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return online
}

function StatusBar() {
  const online = useOnlineStatus()
  return <p>{online ? 'Online' : 'You are offline — changes will sync later'}</p>
}

function SaveButton() {
  const online = useOnlineStatus()
  return <button disabled={!online}>Save</button>
}
```

Each component calling a hook gets its **own independent state** — hooks share *logic*, not *state*. (To share state, lift it up, use context, or a store.)

## Useful custom hooks

### `useLocalStorage`

```tsx
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage may be unavailable (private mode, quota) */
    }
  }, [key, value])

  return [value, setValue] as const
}

const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recent-searches', [])
```

`as const` returns a typed tuple, so callers can name the values like `useState`.

### `useDebouncedValue`

```tsx
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

function ProductSearch() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const { data } = useProductSearch(debouncedQuery)   // only fires after typing pauses
  // …
}
```

### `useMediaQuery`

Subscribing to an external source is exactly what `useSyncExternalStore` is designed for:

```tsx
import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false, // server snapshot
  )
}

const isMobile = useMediaQuery('(max-width: 640px)')
```

### `useToggle`

```tsx
export function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  const toggle = () => setOn((v) => !v)
  return [on, toggle, setOn] as const
}
```

## Designing good hooks

- **Name for purpose**, not implementation: `useCartTotal`, not `useReduceItems`.
- **Accept inputs, return what callers need** — values, tuples for pairs, objects for several named results.
- **Keep them focused**. A hook that fetches, formats, validates and tracks analytics is doing too much.
- **Don't wrap a single built-in hook without adding value** — `useMount(fn)` hides dependencies and usually encourages misuse of effects.
- **Follow the rules of hooks** inside them too, and pass reactive values as arguments so dependency arrays stay honest.

## Testing custom hooks

`renderHook` from React Testing Library runs a hook in a test component:

```tsx
import { act, renderHook } from '@testing-library/react'

it('toggles', () => {
  const { result } = renderHook(() => useToggle())
  expect(result.current[0]).toBe(false)
  act(() => result.current[1]())
  expect(result.current[0]).toBe(true)
})
```

## Try it yourself

Write and use:

1. `useInterval(callback, delayMs | null)` that pauses when the delay is `null` and always calls the latest callback.
2. `useClickOutside(ref, handler)` for closing dropdowns.
3. `usePagination(total, pageSize)` returning `page`, `pageCount`, `next`, `prev` and `goTo`.
