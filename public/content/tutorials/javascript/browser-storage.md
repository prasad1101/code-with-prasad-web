Web apps often need to remember things: a theme preference, a draft message, items in a cart. Browsers provide several storage mechanisms, each with different trade-offs.

## `localStorage` and `sessionStorage`

Both store **string** key–value pairs for the current origin (scheme + host + port):

```js
localStorage.setItem('theme', 'dark')
localStorage.getItem('theme')     // 'dark'
localStorage.removeItem('theme')
localStorage.clear()              // everything for this origin
```

| | `localStorage` | `sessionStorage` |
| --- | --- | --- |
| Lifetime | Until cleared | Until the tab is closed |
| Shared between tabs | Yes (same origin) | No — per tab |
| Typical size limit | ~5 MB | ~5 MB |

### Storing objects

Storage only holds strings, so serialise with JSON:

```js
const cart = [{ id: 1, qty: 2 }]
localStorage.setItem('cart', JSON.stringify(cart))

const saved = JSON.parse(localStorage.getItem('cart') ?? '[]')
```

### Always guard storage access

Storage can throw — in private browsing modes, when the quota is full, or when the user blocks site data. Wrap reads and writes:

```js
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — the app should still work */
  }
}
```

### Reacting to changes from other tabs

```js
window.addEventListener('storage', (event) => {
  if (event.key === 'theme') applyTheme(event.newValue)
})
```

The `storage` event fires in *other* tabs of the same origin, not the one that made the change.

## Cookies

Cookies are small (about 4 KB) and are **sent to the server with every request** to their domain. That makes them the right tool for server sessions, and the wrong tool for general client-side storage.

```js
document.cookie = 'lang=en; Max-Age=31536000; Path=/; SameSite=Lax'
```

Authentication cookies should be set by the server with `HttpOnly` (so JavaScript can't read them, blunting XSS token theft), `Secure` and an appropriate `SameSite` value.

## IndexedDB

For large or structured data — offline content, cached API responses, files — use **IndexedDB**, an asynchronous, transactional database in the browser. Its raw API is verbose, so most projects use a small wrapper such as `idb`:

```js
import { openDB } from 'idb'

const db = await openDB('notes-app', 1, {
  upgrade(db) {
    db.createObjectStore('notes', { keyPath: 'id' })
  },
})

await db.put('notes', { id: 1, text: 'Buy milk', updatedAt: Date.now() })
const note = await db.get('notes', 1)
```

## What *not* to store in the browser

Anything in `localStorage`, `sessionStorage` or IndexedDB can be read by any JavaScript running on your page — including injected scripts if you ever have an XSS bug. Don't store secrets, and think carefully before keeping long-lived access tokens there.

## Choosing the right tool

| Need | Use |
| --- | --- |
| Small preferences (theme, language) | `localStorage` |
| Per-tab state (a multi-step form) | `sessionStorage` |
| Server session / auth | `HttpOnly` cookie set by the server |
| Large or structured data, offline support | IndexedDB |

## Try it yourself

Build a notes textarea that saves its content to `localStorage` as the user types (debounce saves to at most once every 500 ms) and restores it on reload. Open the page in two tabs and use the `storage` event to keep them in sync.
