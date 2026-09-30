"Server-side rendering" and "Server Components" both involve React running on a server, so they're easy to confuse. But they answer different questions:

- **SSR** answers: *how do we show meaningful HTML before the JavaScript loads?*
- **Server Components** answer: *which components need to exist in the browser at all?*

They're not rivals. Modern frameworks such as the Next.js App Router use both at once. Understanding each one separately is the key to using them well.

## Classic SSR in one picture

With classic SSR, the **same component tree** runs twice:

1. On the server, React renders the tree to HTML (`renderToPipeableStream` / `renderToString`). The browser gets real markup immediately.
2. In the browser, the full JavaScript bundle for that tree downloads, and React **hydrates** it: it re-runs the components, attaches event handlers and takes over.

```jsx
// server.js — classic SSR with Express
import { renderToPipeableStream } from 'react-dom/server'
import App from './App.jsx'

app.get('*', (req, res) => {
  const { pipe } = renderToPipeableStream(<App url={req.url} />, {
    bootstrapScripts: ['/client.js'],
    onShellReady() {
      res.setHeader('Content-Type', 'text/html')
      pipe(res)
    },
  })
})
```

```jsx
// client.js
import { hydrateRoot } from 'react-dom/client'
import App from './App.jsx'

hydrateRoot(document, <App url={location.pathname} />)
```

The benefit is fast first paint and good SEO. The cost: **every component still ships to the browser and hydrates**, including ones that only render static text. Data fetched on the server must also be serialised into the page so the client can re-render with the same data.

## What Server Components change

A React Server Component (RSC) runs **only on the server**. Its code is never sent to the browser, and it never hydrates. React sends the browser a compact description of its *output* (the "RSC payload"), and the client merges that into the tree.

Server Components can be `async` and talk to your data directly:

```jsx
// app/posts/page.jsx — a Server Component (the default in the App Router)
import { db } from '@/lib/db'
import LikeButton from './LikeButton'

export default async function PostsPage() {
  const posts = await db.post.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <h2>{post.title}</h2>
          <LikeButton postId={post.id} initialLikes={post.likes} />
        </li>
      ))}
    </ul>
  )
}
```

The database client, the query and any heavy formatting libraries used here add **zero bytes** to the client bundle.

Interactivity lives in **Client Components**, marked with the `'use client'` directive:

```jsx
// app/posts/LikeButton.jsx
'use client'

import { useState } from 'react'

export default function LikeButton({ postId, initialLikes }) {
  const [likes, setLikes] = useState(initialLikes)
  return (
    <button onClick={() => setLikes((n) => n + 1)} aria-label={`Like post ${postId}`}>
      ♥ {likes}
    </button>
  )
}
```

`'use client'` marks a **boundary**: this module and everything it imports become part of the client bundle. Client Components are still pre-rendered to HTML on the first request (that's SSR at work) and then hydrated — but only *they* hydrate, not the whole page.

## The rules that trip people up

**Props crossing the boundary must be serialisable.** A Server Component can pass strings, numbers, plain objects, arrays, dates and even promises to a Client Component — but not functions (other than Server Actions) or class instances.

**Client Components can't import Server Components** — but they can *render* them if they're passed in as `children` or other props:

```jsx
// Server Component
import Tabs from './Tabs'          // 'use client'
import ReleaseNotes from './ReleaseNotes' // Server Component

export default function Page() {
  return (
    <Tabs>
      <ReleaseNotes /> {/* rendered on the server, slotted into client UI */}
    </Tabs>
  )
}
```

**Hooks and browser APIs belong in Client Components.** `useState`, `useEffect`, `onClick` and `window` aren't available in Server Components.

## Side-by-side

| | Classic SSR | Server Components |
| --- | --- | --- |
| Where component code runs | Server **and** browser | Server only |
| Shipped to the browser | All component code | Only Client Components |
| Hydration | Whole tree | Client Components only |
| Data fetching | Before render, then serialised for the client | `await` directly inside the component |
| Interactivity | Anywhere | Only inside `'use client'` boundaries |
| Needs a framework | No (plain `react-dom/server` works) | In practice yes — it needs bundler and server integration (e.g. the Next.js App Router) |

## When to use what

- **Content-heavy pages** (blogs, docs, product listings, dashboards that are mostly read-only): Server Components shine. Most of the page is static output; only small islands need JavaScript.
- **Highly interactive apps** (editors, canvases, complex forms): most components need client state anyway. SSR — or even a pure client-rendered SPA — is simpler, and RSC buys you less.
- **An existing SSR app**: you don't need to rewrite anything. Adopting RSC is an architectural change that usually comes with moving to a framework that supports it. Do it when bundle size or server-side data access is a measurable problem.

## A mental model that sticks

Think of Server Components as **the part of your UI that is really a template filled with data**, and Client Components as **the part that is really an application**. SSR is the delivery mechanism that turns the first render of both into HTML quickly.

Push the `'use client'` boundary as far down the tree as you can — onto the button, not the page — and you get the best of both: fast HTML, less JavaScript, and interactivity exactly where it's needed.
