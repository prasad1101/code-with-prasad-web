You know `async`/`await`. This lesson covers the patterns that separate robust asynchronous code from fragile code: combinators, concurrency limits, timeouts, cancellation and retries.

## Sequential vs. parallel

```js
// Sequential — each request waits for the previous one (slow)
for (const id of ids) {
  results.push(await fetchUser(id))
}

// Parallel — all requests start immediately
const results = await Promise.all(ids.map((id) => fetchUser(id)))
```

Use sequential only when each step depends on the previous result or when order of side effects matters.

## The four combinators

| Combinator | Resolves when | Rejects when |
| --- | --- | --- |
| `Promise.all` | All fulfil (array of values) | **Any** rejects (first reason) |
| `Promise.allSettled` | All settle (array of `{status, value/reason}`) | Never |
| `Promise.race` | The first settles (fulfils **or** rejects) | The first settles with a rejection |
| `Promise.any` | The first **fulfils** | All reject (`AggregateError`) |

```js
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()])
const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason)

// Use whichever mirror answers first
const data = await Promise.any([fetch(mirror1), fetch(mirror2)])
```

## Timeouts

```js
function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms} ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
```

This stops **waiting**, but the original operation keeps running. To actually stop work, you need cancellation.

## Cancellation with `AbortController`

`fetch` and many Node.js APIs accept an `AbortSignal`:

```js
const controller = new AbortController()
const res = fetch('/api/search?q=js', { signal: controller.signal })

controller.abort() // the fetch rejects with an AbortError
```

Built-in timeout signals:

```js
const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
```

Cancelling stale requests — for example in a search box, where only the latest request matters:

```js
let current

async function search(query) {
  current?.abort()
  current = new AbortController()
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: current.signal,
    })
    render(await res.json())
  } catch (error) {
    if (error.name !== 'AbortError') throw error
  }
}
```

Make your own async functions cancellable by accepting a `signal` and checking `signal.throwIfAborted()` between steps.

## Retries with exponential backoff

```js
async function retry(fn, { retries = 3, baseMs = 300 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt >= retries) throw error
      const delay = baseMs * 2 ** attempt + Math.random() * 100 // backoff + jitter
      await new Promise((r) => setTimeout(r, delay))
    }
  }
}

const user = await retry(() => fetchJson('/api/user'))
```

Only retry operations that are safe to repeat (idempotent) and errors that are likely transient (timeouts, 503s), not 400s.

## Limiting concurrency

`Promise.all` over 10,000 URLs starts 10,000 requests at once. Limit how many run at a time:

```js
async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

const pages = await mapWithLimit(urls, 5, (url) => fetch(url).then((r) => r.text()))
```

## `Promise.withResolvers`

When a promise must be resolved from outside its executor (e.g. from an event handler):

```js
const { promise, resolve, reject } = Promise.withResolvers()
socket.once('ready', resolve)
socket.once('error', reject)
await promise
```

## Common mistakes

- **Forgetting `await`** — the function continues before the work finishes, and errors become unhandled rejections.
- **`await` inside `forEach`** — `forEach` ignores returned promises. Use `for…of` (sequential) or `Promise.all` with `map` (parallel).
- **Swallowing errors** — `catch(() => {})` hides failures; at least log them.
- **Mixing `.then` and `await` inconsistently** — pick one style per function.

## Try it yourself

Write `fetchAllWithReport(urls)` that fetches up to 3 URLs at a time, aborts any request taking longer than 2 seconds, retries failed requests twice, and finally returns `{ ok: [...], failed: [...] }`.
