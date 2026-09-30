By default, an Angular app is rendered in the browser: the server sends an almost empty HTML page and the user waits for JavaScript to download and run. **Server-side rendering (SSR)** renders the page on the server, so users (and search engines) get meaningful HTML immediately. **Hydration** then makes that HTML interactive without re-rendering it.

## Why SSR?

- **Faster first content** — better Largest Contentful Paint, especially on slow devices and networks.
- **SEO and link previews** — crawlers and social networks see full content and meta tags.
- **Perceived performance** — users can read while JavaScript loads.

Trade-offs: you need a Node.js server (or a platform that runs one), and code must work without browser APIs during server rendering.

## Adding SSR

```bash
ng new shop --ssr          # new project
ng add @angular/ssr        # existing project
```

This adds a server entry point (an Express server by default), server configuration, and enables **hydration** with `provideClientHydration()`.

## Rendering modes per route

Angular lets you choose how each route is rendered:

```ts
// app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr'

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },           // static HTML at build time
  { path: 'blog/:slug', renderMode: RenderMode.Prerender,   // prerender known params
    async getPrerenderParams() {
      return [{ slug: 'nodejs-event-loop' }, { slug: 'mongodb-indexing' }]
    } },
  { path: 'products/:id', renderMode: RenderMode.Server },  // rendered per request
  { path: 'account/**', renderMode: RenderMode.Client },    // browser only (private pages)
  { path: '**', renderMode: RenderMode.Server },
]
```

- **Prerender (SSG)** — generated once at build time; fastest, cacheable on a CDN. Ideal for marketing pages and blogs.
- **Server** — rendered on each request; for dynamic, public, SEO-relevant content.
- **Client** — classic SPA rendering; for authenticated dashboards where SEO doesn't matter.

## Hydration

Without hydration, the browser would throw away the server-rendered DOM and render again, causing flicker. With hydration, Angular **reuses** the existing DOM nodes and just attaches event listeners and state.

**Event replay** captures clicks and inputs that happen before hydration finishes and replays them afterwards, so early interactions aren't lost.

### Incremental hydration

Enable it in the app config:

```ts
providers: [provideClientHydration(withEventReplay(), withIncrementalHydration())]
```

Then combine `@defer` with hydration triggers to hydrate parts of the page lazily — the HTML is rendered on the server, but its JavaScript loads only when needed:

```html
@defer (hydrate on viewport) {
  <app-reviews [productId]="product().id" />
}
@defer (hydrate on interaction) {
  <app-size-picker [sizes]="product().sizes" />
}
@defer (hydrate never) {
  <app-static-footer />
}
```

This dramatically reduces the JavaScript needed for the initial interaction.

## Writing SSR-safe code

On the server there is no `window`, `document`, `localStorage` or real DOM. Accessing them during rendering crashes the server render.

```ts
import { afterNextRender, Component, inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Component({ selector: 'app-theme-toggle', template: `…` })
export class ThemeToggle {
  constructor() {
    // Runs only in the browser, after rendering
    afterNextRender(() => {
      const saved = localStorage.getItem('theme')
      if (saved) document.documentElement.dataset['theme'] = saved
    })
  }
}

// When you need a branch
const isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
```

Guidelines:

- Put browser-only work in `afterNextRender` / `afterRenderEffect`.
- Inject `DOCUMENT` instead of using the global `document` when you need it on both platforms.
- Avoid direct DOM manipulation; bindings work everywhere.
- Don't start infinite timers during server rendering — the server waits for the app to become stable before sending HTML.

## Hydration mismatches

Hydration requires the server and client to produce the **same DOM**. Common causes of mismatch errors:

- Rendering different content on each platform (e.g. `isPlatformBrowser` inside the template, `Date.now()`, random values).
- Invalid HTML nesting (a `<div>` inside a `<p>`) that the browser "fixes" differently.
- Third-party code modifying the DOM before hydration.

Fix the cause, or as a last resort mark a component with `ngSkipHydration`.

## Avoiding duplicate HTTP requests

Data fetched during server rendering is serialised into the page (**HTTP transfer cache**), so the browser doesn't request it again during hydration. It's enabled by default with `provideClientHydration()` for `HttpClient` `GET` requests; configure which requests are cached (e.g. exclude authenticated ones) with `withHttpTransferCacheOptions`.

## SEO and meta tags

```ts
import { Meta, Title } from '@angular/platform-browser'

export class ProductPage {
  private title = inject(Title)
  private meta = inject(Meta)

  constructor() {
    effect(() => {
      const p = this.product.value()
      if (!p) return
      this.title.setTitle(`${p.name} | Shop`)
      this.meta.updateTag({ name: 'description', content: p.summary })
      this.meta.updateTag({ property: 'og:image', content: p.imageUrl })
    })
  }
}
```

With SSR, these tags are present in the HTML that crawlers and link previews read.

## Deploying

- Prerendered routes are static files — host them on any CDN.
- Server-rendered routes need a Node.js runtime: a container, a VM, or platforms like Cloud Run, Azure App Service, Vercel, Netlify or Firebase App Hosting.
- Cache server-rendered responses at the CDN where content allows (`Cache-Control` with `s-maxage`).

## Try it yourself

Add SSR to a small shop app. Prerender the home and blog pages, server-render product pages, keep `/account` client-only, set per-product title and meta tags, move a `localStorage` read into `afterNextRender`, and use `@defer (hydrate on viewport)` for the reviews section. Check the page source to confirm the HTML contains the product content.
