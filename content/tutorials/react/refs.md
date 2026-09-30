State triggers re-renders. Sometimes you need to remember a value **without** re-rendering, or reach a DOM node directly — to focus an input, measure an element, or integrate a non-React library. That's what **refs** are for.

## `useRef` for values

```tsx
import { useRef, useState } from 'react'

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<number | null>(null)

  function start() {
    if (intervalRef.current !== null) return
    const startedAt = Date.now() - elapsed
    intervalRef.current = window.setInterval(() => setElapsed(Date.now() - startedAt), 100)
  }

  function stop() {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  return (
    <>
      <p>{(elapsed / 1000).toFixed(1)}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </>
  )
}
```

`useRef(initial)` returns an object `{ current: initial }` that persists across renders. Changing `ref.current` does **not** re-render.

| | `useState` | `useRef` |
| --- | --- | --- |
| Changing it re-renders | Yes | No |
| Use for | Anything shown on screen | Timer ids, previous values, DOM nodes, instances of external libraries |
| Read during render | Yes | Avoid (except for lazy initialisation) |

Don't read or write `ref.current` during rendering — it makes components unpredictable. Use refs in event handlers and effects.

## Refs to DOM elements

Pass a ref to a JSX element's `ref` attribute; React sets `ref.current` to the DOM node:

```tsx
function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input ref={inputRef} placeholder="Search…" />
      <button onClick={() => inputRef.current?.focus()}>Focus search</button>
    </>
  )
}
```

Common uses:

- Focus management (dialogs, form errors, keyboard shortcuts).
- Scrolling: `listRef.current?.scrollIntoView({ behavior: 'smooth' })`.
- Measuring: `el.getBoundingClientRect()`.
- Media: `videoRef.current?.play()`.
- Integrating libraries that need a DOM node (charts, maps, editors).

## Passing refs to your own components

In React 19, `ref` is a regular prop for function components:

```tsx
function TextField({ label, ref, ...props }: { label: string; ref?: React.Ref<HTMLInputElement> } & React.ComponentProps<'input'>) {
  return (
    <label>
      {label}
      <input ref={ref} {...props} />
    </label>
  )
}

function LoginForm() {
  const emailRef = useRef<HTMLInputElement>(null)
  return <TextField label="Email" ref={emailRef} type="email" />
}
```

(Before React 19, you needed `forwardRef` for this; you'll still see it in existing code.)

## Callback refs and ref cleanup

A function passed as `ref` is called with the node when it mounts. In React 19 it can return a cleanup function:

```tsx
<div
  ref={(node) => {
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }}
/>
```

## Exposing an imperative API

Occasionally a parent needs to call methods on a child (e.g. `open()` on a dialog). `useImperativeHandle` exposes a limited API instead of the raw DOM node:

```tsx
import { useImperativeHandle, useRef } from 'react'

export type DialogHandle = { open: () => void; close: () => void }

function Dialog({ ref, children }: { ref?: React.Ref<DialogHandle>; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.showModal(),
    close: () => dialogRef.current?.close(),
  }))

  return <dialog ref={dialogRef}>{children}</dialog>
}

function Page() {
  const dialog = useRef<DialogHandle>(null)
  return (
    <>
      <button onClick={() => dialog.current?.open()}>Delete account</button>
      <Dialog ref={dialog}>
        <p>Are you sure?</p>
        <button onClick={() => dialog.current?.close()}>Cancel</button>
      </Dialog>
    </>
  )
}
```

Prefer props (`isOpen`) where possible; imperative handles are for cases like focus, scroll, media playback and native dialogs.

## Integrating a non-React library

```tsx
function MapView({ center }: { center: [number, number] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapInstance | null>(null)

  useEffect(() => {
    mapRef.current = createMap(containerRef.current!, { center })
    return () => mapRef.current?.destroy()
  }, [])                                    // create once

  useEffect(() => {
    mapRef.current?.setCenter(center)       // sync prop changes
  }, [center])

  return <div ref={containerRef} className="map" />
}
```

## Try it yourself

1. Build an OTP input with 6 boxes that moves focus to the next box as you type and back on Backspace, using an array of refs.
2. Build a chat window that scrolls to the newest message when one arrives.
3. Wrap the native `<dialog>` element in a component exposing `open()`/`close()` via `useImperativeHandle`.
