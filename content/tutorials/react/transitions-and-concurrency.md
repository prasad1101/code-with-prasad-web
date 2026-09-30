React's **concurrent rendering** lets it prepare new UI in the background, interrupt low-priority work when the user interacts, and avoid showing loading states unnecessarily. You access it through **transitions** and **deferred values**.

## The problem: not all updates are equally urgent

When a user types into a search box that filters a large list:

- Updating the **input** must feel instant — it's urgent.
- Re-rendering the **results** can lag slightly — it's not.

Without concurrency, React renders both synchronously; if the results are expensive, every keystroke feels sluggish.

## `useTransition`

Mark state updates as **non-urgent**:

```tsx
import { useState, useTransition } from 'react'

function ProductSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)                        // urgent: update the input now
          startTransition(() => setFilter(e.target.value)) // non-urgent: results can wait
        }}
      />
      {isPending && <small>Updating…</small>}
      <SlowResults products={products} filter={filter} />
    </>
  )
}
```

React renders the transition update in the background. If the user types again before it finishes, React **abandons** the outdated render and starts on the latest one — the input never blocks.

## `useDeferredValue`

When you don't control the state update (e.g. the value comes from props), defer the value itself:

```tsx
import { memo, useDeferredValue, useState } from 'react'

function Search({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const isStale = query !== deferredQuery

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <SlowResults products={products} filter={deferredQuery} />
      </div>
    </>
  )
}

const SlowResults = memo(function SlowResults({ products, filter }: { products: Product[]; filter: string }) {
  const items = products.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
  return <ul>{items.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
})
```

`SlowResults` must be memoised (or compiled with the React Compiler) so it only re-renders when the *deferred* value changes.

### Debounce vs. deferred value

Debouncing waits a fixed time before doing anything. `useDeferredValue` starts rendering immediately in the background and adapts to the device: fast machines update almost instantly, slow ones fall behind gracefully. For **network requests** you still want debouncing (to avoid sending a request per keystroke); for **expensive rendering**, deferred values are better.

## Transitions and Suspense

When an update would cause already-visible content to suspend (switching tabs, navigating), a transition keeps the **old UI on screen** until the new UI is ready, instead of flashing a fallback:

```tsx
function Tabs() {
  const [tab, setTab] = useState<'about' | 'reviews'>('about')
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <nav style={{ opacity: isPending ? 0.7 : 1 }}>
        <button onClick={() => startTransition(() => setTab('about'))}>About</button>
        <button onClick={() => startTransition(() => setTab('reviews'))}>Reviews</button>
      </nav>
      <Suspense fallback={<Spinner />}>{tab === 'about' ? <About /> : <Reviews />}</Suspense>
    </>
  )
}
```

Routers (React Router, Next.js) wrap navigations in transitions for exactly this reason.

## Async transitions (Actions)

In React 19, the function passed to `startTransition` can be **async**. `isPending` stays true until it finishes — the foundation of form actions:

```tsx
const [isPending, startTransition] = useTransition()

function handleSave() {
  startTransition(async () => {
    const error = await saveProfile(form)
    if (error) {
      setError(error)
      return
    }
    startTransition(() => navigate('/profile'))
  })
}
```

`useActionState`, `useOptimistic` and form `action` props are built on these async transitions (see the forms lesson).

## `<Activity>`: keeping hidden UI alive

`<Activity mode="hidden">` hides a subtree without unmounting it — state is preserved, effects are cleaned up, and React can pre-render it at low priority:

```tsx
import { Activity } from 'react'

<Activity mode={tab === 'inbox' ? 'visible' : 'hidden'}>
  <Inbox />
</Activity>
<Activity mode={tab === 'drafts' ? 'visible' : 'hidden'}>
  <Drafts />
</Activity>
```

Switching back to a tab restores its scroll position and form inputs instantly.

## What transitions are not for

- **Controlled inputs** — the input's own value must update synchronously (never put `setQuery` for the input itself inside a transition).
- **Reducing network requests** — use debouncing or cancellation.
- **Fixing genuinely slow code** — if every render is slow, profile and optimise first; transitions only prioritise work.

## Try it yourself

Render a list of 20,000 items filtered by a text input. Measure input lag with no optimisation, then with `useTransition`, then with `useDeferredValue` + `memo`. Finally, build a tabbed settings page where each tab's form state survives switching tabs using `<Activity>`.
