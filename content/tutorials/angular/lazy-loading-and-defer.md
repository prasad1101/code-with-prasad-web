The less JavaScript a user downloads before seeing the page, the faster your app feels. Angular gives you two complementary tools: **route-level lazy loading** and **`@defer` blocks** for lazy-loading parts of a template.

## Lazy-loading routes

```ts
export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then((m) => m.Home) },
  { path: 'catalogue', loadChildren: () => import('./features/catalogue/catalogue.routes').then((m) => m.CATALOGUE_ROUTES) },
  { path: 'admin', canMatch: [adminGuard], loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
]
```

The build splits each lazy route into its own chunk, downloaded on first navigation. Using `canMatch` guards means unauthorised users never download the admin chunk at all.

With a default export, you can drop the `.then`:

```ts
// home.ts: export default class Home {}
{ path: '', loadComponent: () => import('./home/home') }
```

## Preloading

Lazy loading can make the *first* navigation to a route slower. Preloading downloads lazy chunks in the background after the app starts:

```ts
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router'

provideRouter(routes, withPreloading(PreloadAllModules))
```

For large apps, write a custom preloading strategy (e.g. preload only routes marked `data: { preload: true }`, or routes linked from the current page).

## `@defer`: lazy-loading inside templates

`@defer` loads the components, directives and pipes used inside its block **only when a trigger fires**:

```html
<app-product-hero [product]="product()" />

@defer (on viewport) {
  <app-reviews [productId]="product().id" />
} @placeholder (minimum 300ms) {
  <div class="skeleton reviews"></div>
} @loading (after 150ms; minimum 400ms) {
  <app-spinner />
} @error {
  <p>Couldn't load reviews.</p>
}
```

- **`@placeholder`** — shown before loading starts (keep it lightweight; its dependencies are loaded eagerly).
- **`@loading`** — shown while the chunk downloads; `after` avoids flicker on fast connections.
- **`@error`** — shown if loading fails.

For `@defer` to split code, the deferred components must be **standalone** and **not referenced elsewhere** in the same file's non-deferred template.

### Triggers

| Trigger | Loads when |
| --- | --- |
| `on idle` (default) | The browser is idle |
| `on viewport` | The placeholder scrolls into view |
| `on interaction` | The user clicks or focuses the placeholder |
| `on hover` | The user hovers over the placeholder |
| `on immediate` | Right after the non-deferred content renders |
| `on timer(2s)` | After a delay |
| `when condition` | A signal/expression becomes true |

Combine them and add **prefetching**, which downloads code early without rendering:

```html
@defer (on interaction; prefetch on hover) {
  <app-rich-text-editor />
} @placeholder {
  <button>Write a review</button>
}
```

## What to defer

Great candidates:

- Below-the-fold sections: reviews, recommendations, footers with heavy widgets.
- Heavy third-party components: charts, maps, rich-text editors, video players.
- Content behind interactions: modals, tabs other than the first, "show more" panels.

Don't defer content visible on initial render (it would hurt Largest Contentful Paint and cause layout shift) — or anything needed for SEO in server-rendered pages without considering hydration.

## `@defer` with server-side rendering

With SSR and **incremental hydration**, deferred blocks can be rendered on the server (so the HTML is complete for users and search engines) but hydrated — made interactive — only when a trigger fires:

```html
@defer (hydrate on viewport) {
  <app-reviews [productId]="product().id" />
}
```

This ships interactive JavaScript only for the parts of the page the user actually engages with.

## Measuring the effect

- Run `ng build` and inspect the **initial** vs. **lazy** chunk sizes in the build output.
- Use the budget settings in `angular.json` to fail the build when bundles grow beyond limits.
- Analyse bundles with `source-map-explorer` (`ng build --source-map`).
- Check Core Web Vitals (LCP, INP, CLS) with Lighthouse before and after.

## Try it yourself

On a product page, defer the reviews section `on viewport` with a skeleton placeholder, defer a chart component `on interaction` with `prefetch on hover`, and lazy-load the admin area with `canMatch`. Compare the initial bundle size and Lighthouse score before and after.
