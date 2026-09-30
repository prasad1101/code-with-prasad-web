Everything so far has run in the browser. Modern React can also render on the server: **server-side rendering (SSR)** produces HTML for fast first paint and SEO, and **React Server Components (RSC)** let parts of your UI run *only* on the server, sending no JavaScript for them at all. These features are used through frameworks — most commonly **Next.js** (App Router) or **React Router** in framework mode.

For a deeper comparison, read the blog post [React Server Components vs. Classic SSR](/blog/react-server-components-vs-ssr).

## Rendering strategies

| Strategy | HTML generated | Good for |
| --- | --- | --- |
| Client-side rendering (CSR) | In the browser | Authenticated dashboards, internal tools |
| Server-side rendering (SSR) | On each request | Personalised or frequently changing public pages |
| Static generation (SSG) | At build time | Marketing pages, docs, blogs |
| Incremental / revalidated static | At build, refreshed periodically | Catalogues, news |

Frameworks let you mix strategies per route.

## Classic SSR and hydration

With SSR, the server renders your component tree to HTML; the browser shows it immediately, then downloads the JavaScript and **hydrates** — attaching event handlers and making it interactive. The same components run on both server and client, so all their code ships to the browser.

Streaming SSR sends HTML in chunks: the shell appears first, and `<Suspense>` boundaries stream in as their data resolves.

## Server Components

In frameworks with RSC (like the Next.js App Router), components are **Server Components by default**:

```tsx
// app/products/page.tsx — a Server Component
import { db } from '@/lib/db'
import AddToCartButton from './AddToCartButton'

export default async function ProductsPage() {
  const products = await db.product.findMany({ orderBy: { createdAt: 'desc' } })  // direct database access

  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          <h2>{p.name}</h2>
          <p>₹{p.price}</p>
          <AddToCartButton productId={p.id} />
        </li>
      ))}
    </ul>
  )
}
```

Server Components:

- can be `async` and fetch data directly (databases, internal services, secrets stay on the server);
- ship **zero JavaScript** to the browser — only their rendered output;
- can't use state, effects, browser APIs or event handlers.

## Client Components

Interactive parts opt in with the `'use client'` directive at the top of the file:

```tsx
// app/products/AddToCartButton.tsx
'use client'

import { useState } from 'react'

export default function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false)
  return <button onClick={() => setAdded(true)}>{added ? 'Added ✓' : 'Add to cart'}</button>
}
```

`'use client'` marks a **boundary**: that module and everything it imports is bundled for the browser. Client Components are still pre-rendered to HTML on the server, then hydrated.

### Rules at the boundary

- Props passed from Server to Client Components must be **serialisable** (strings, numbers, plain objects, arrays, dates, promises) — not functions (except Server Functions) or class instances.
- Client Components can't import Server Components, but can **render them passed as `children`** or other props.
- Push `'use client'` as far down the tree as possible — onto the button, not the page — to keep bundles small.

```tsx
// Server Component composing a client wrapper around server-rendered content
<CollapsiblePanel>                 {/* 'use client' */}
  <ProductSpecs productId={id} />  {/* Server Component, rendered on the server */}
</CollapsiblePanel>
```

## Server Functions (Server Actions)

Functions marked `'use server'` run on the server but can be called from the client — commonly as form actions:

```tsx
// app/products/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createReview(formData: FormData) {
  const rating = Number(formData.get('rating'))
  const text = String(formData.get('text'))
  if (rating < 1 || rating > 5) return { error: 'Rating must be 1–5' }
  await db.review.create({ data: { rating, text, productId: String(formData.get('productId')) } })
  revalidatePath('/products')
  return { success: true }
}
```

```tsx
'use client'
import { useActionState } from 'react'
import { createReview } from './actions'

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => createReview(fd), null)
  return (
    <form action={action}>
      <input type="hidden" name="productId" value={productId} />
      <input name="rating" type="number" min={1} max={5} />
      <textarea name="text" />
      <button disabled={pending}>Post review</button>
      {state?.error && <p role="alert">{state.error}</p>}
    </form>
  )
}
```

**Server Functions are public HTTP endpoints.** Always authenticate, authorise and validate their inputs exactly as you would an API route.

## Data fetching patterns with RSC

- Fetch in the Server Component that needs the data; frameworks deduplicate identical requests during a render.
- Start independent requests in parallel (`Promise.all`) to avoid waterfalls.
- Wrap slow sections in `<Suspense>` so the rest of the page streams first.
- Pass promises to Client Components and read them with `use` when the client needs the data.

## Choosing a framework

- **Next.js (App Router)** — the most complete RSC implementation; file-based routing, caching and revalidation, image optimisation, many hosting options.
- **React Router framework mode** — loaders/actions per route, SSR, progressive enhancement; an easy path from React Router SPAs.
- **Vite + React (SPA)** — no server needed; great for authenticated apps where SEO doesn't matter.

## When RSC helps most

Content-heavy pages with small interactive islands: product listings, blogs, documentation, dashboards that are mostly read-only. Highly interactive apps (editors, design tools) gain less, since most components need client state anyway.

## Try it yourself

In a Next.js app, build a product list page as a Server Component that reads from a JSON file or database, with a Client Component "Add to cart" button, a Suspense-wrapped reviews section that streams in after a simulated delay, and a Server Function form for posting reviews with validation. Check the browser's network panel to confirm the product list code isn't in the client bundle.
