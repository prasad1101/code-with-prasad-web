**Effects** let a component synchronise with something **outside React**: a browser API, a timer, a WebSocket, a third-party widget, or a network request. `useEffect` is one of the most used — and most misused — hooks. Knowing when *not* to use it matters as much as knowing how.

## `useEffect` basics

```tsx
import { useEffect, useState } from 'react'

function OnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {                       // cleanup
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])                                 // dependencies

  return <span>{online ? '🟢 Online' : '🔴 Offline'}</span>
}
```

- The effect runs **after** React has updated the DOM.
- The **cleanup** function runs before the effect runs again and when the component unmounts.
- The **dependency array** controls when it re-runs:

| Dependencies | Runs |
| --- | --- |
| omitted | after every render |
| `[]` | once after mount (plus cleanup on unmount) |
| `[a, b]` | after mount and whenever `a` or `b` changes |

In development, `StrictMode` mounts, unmounts and re-mounts components once, so effects run → clean up → run again. This deliberately exposes missing cleanup. If your effect breaks when run twice, fix the cleanup — don't remove `StrictMode`.

## Dependencies must be honest

Every reactive value (props, state, values derived from them) used inside the effect must be in the dependency array. The `react-hooks/exhaustive-deps` lint rule checks this — don't silence it.

```tsx
function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    const connection = createConnection(roomId)
    connection.connect()
    return () => connection.disconnect()
  }, [roomId])                    // reconnects when the room changes
}
```

### Reading the latest value without re-running: `useEffectEvent`

Sometimes an effect needs the latest value of something but shouldn't re-run when it changes:

```tsx
import { useEffect, useEffectEvent } from 'react'

function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  const onConnected = useEffectEvent(() => {
    showNotification(`Connected to ${roomId}`, theme)   // always sees the latest theme
  })

  useEffect(() => {
    const connection = createConnection(roomId)
    connection.on('connected', onConnected)
    connection.connect()
    return () => connection.disconnect()
  }, [roomId])                                          // theme changes don't reconnect
}
```

## Fetching data in an effect

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setUser(null)
    setError(null)

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(setUser)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })

    return () => controller.abort()   // cancel if userId changes or the component unmounts
  }, [userId])

  if (error) return <p role="alert">{error}</p>
  if (!user) return <p>Loading…</p>
  return <h2>{user.name}</h2>
}
```

The cleanup prevents **race conditions**: if the user switches profiles quickly, a slow earlier response can't overwrite the newer one.

This works, but real apps need caching, deduplication, retries and background refresh — which is why most teams use **TanStack Query** or a framework's data loading instead (see the data fetching lesson).

## You might not need an effect

Effects are for synchronising with external systems. Many common uses are unnecessary and cause extra renders and bugs:

### Deriving data

```tsx
// ✗ effect + extra state
const [fullName, setFullName] = useState('')
useEffect(() => setFullName(`${first} ${last}`), [first, last])

// ✓ calculate during render
const fullName = `${first} ${last}`
```

For expensive calculations, use `useMemo` (or let the React Compiler memoise it).

### Responding to user events

```tsx
// ✗ effect watching state set by a click
useEffect(() => {
  if (submitted) sendAnalytics('form_submitted')
}, [submitted])

// ✓ do it in the event handler
function handleSubmit() {
  sendAnalytics('form_submitted')
  setSubmitted(true)
}
```

**Rule of thumb:** if something happens *because the user did something*, put it in the event handler. If it happens *because the component is displayed*, it may belong in an effect.

### Resetting state when a prop changes

```tsx
// ✗ effect that clears the comment when userId changes
useEffect(() => setComment(''), [userId])

// ✓ give the component a key — React resets its state
<ProfileEditor key={userId} userId={userId} />
```

## `useLayoutEffect`

Runs synchronously after DOM changes but **before** the browser paints. Use it only to measure layout (e.g. a tooltip's size) and adjust before the user sees a flicker. It blocks painting, so prefer `useEffect` otherwise.

## Common effect bugs

- **Missing cleanup** → duplicated listeners, intervals that keep running, memory leaks.
- **Missing dependencies** → stale values (the effect sees old props/state).
- **Objects/functions created during render as dependencies** → the effect runs every render. Move them inside the effect or memoise them.
- **Setting state unconditionally in an effect without dependencies** → infinite render loops.

## Try it yourself

1. Build a `useDocumentTitle`-style effect that sets the page title to "(3) Inbox" based on an unread count.
2. Build a `WindowSize` component that tracks width and height with a resize listener and proper cleanup.
3. Refactor a component that uses three effects to derive values into one with no effects at all.
