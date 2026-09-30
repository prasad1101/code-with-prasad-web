Enterprise Angular apps often start fast and slow down as features accumulate. This lesson is a practical playbook for measuring and fixing Angular performance — both **load performance** (how fast the app becomes usable) and **runtime performance** (how smoothly it responds).

## Measure first

- **Lighthouse / PageSpeed Insights** — Core Web Vitals: LCP (loading), INP (responsiveness), CLS (visual stability).
- **Angular DevTools profiler** — which components are checked during each change detection cycle and how long they take.
- **Chrome Performance panel** — long tasks, scripting vs. rendering time.
- **Build output and `source-map-explorer`** — what's inside your bundles.

Set a target (e.g. "LCP < 2.5 s on a mid-range phone, no interaction slower than 200 ms"), fix the biggest offender, and measure again.

## Load performance

### 1. Ship less JavaScript

- **Lazy-load every feature route** (`loadComponent` / `loadChildren`).
- **`@defer`** heavy, below-the-fold or interaction-only UI (charts, editors, maps).
- Audit dependencies: replace heavy libraries (e.g. moment.js → native `Intl`/date-fns), import only what you use, avoid pulling a whole icon set.
- Enforce **budgets** in `angular.json` so regressions fail the build:

```json
"budgets": [
  { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
  { "type": "anyComponentStyle", "maximumWarning": "4kB" }
]
```

### 2. Optimise images

Use `NgOptimizedImage`:

```ts
import { NgOptimizedImage } from '@angular/common'

@Component({
  imports: [NgOptimizedImage],
  template: `
    <img ngSrc="/images/hero.webp" width="1200" height="600" priority alt="Summer sale" />
    <img ngSrc="/images/product.webp" width="400" height="400" alt="Wireless mouse" />
  `,
})
```

It enforces width/height (preventing layout shift), lazy-loads non-priority images, sets fetch priority for the LCP image, and can generate responsive `srcset`s with an image CDN loader.

### 3. Render on the server

Server-side rendering (next lesson) shows meaningful HTML before JavaScript loads — a big LCP improvement for content pages and public storefronts.

### 4. Cache and compress

Serve hashed bundles with long-lived `Cache-Control` headers, enable Brotli/gzip, use a CDN, and preconnect to critical origins (APIs, fonts).

## Runtime performance

### 1. Signals + OnPush + zoneless

Precise change detection is the biggest runtime win: components update only when the signals they read change (see the change detection lesson).

### 2. No expensive work in templates

```html
<!-- Runs on every check -->
<td>{{ calculateTax(order) }}</td>

<!-- Recomputes only when inputs change -->
<td>{{ tax() }}</td>            <!-- computed signal -->
<td>{{ order | tax }}</td>       <!-- pure pipe -->
```

### 3. Track list items

Always `track item.id` in `@for` so Angular reuses DOM nodes when lists change.

### 4. Virtual scrolling for long lists

Rendering 10,000 rows creates 10,000 sets of DOM nodes. The CDK virtual scroller renders only what's visible:

```ts
import { ScrollingModule } from '@angular/cdk/scrolling'

@Component({
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="56" class="viewport">
      <div *cdkVirtualFor="let order of orders(); trackBy: trackById" class="row">{{ order.number }}</div>
    </cdk-virtual-scroll-viewport>
  `,
})
```

Or paginate / load more on scroll.

### 5. Debounce high-frequency events

Search inputs, resize and scroll handlers should be debounced or throttled (RxJS `debounceTime`, or `requestAnimationFrame` for visual updates).

### 6. Move heavy computation off the main thread

Use **Web Workers** (`ng generate web-worker`) for CPU-heavy tasks like parsing large files, complex filtering or report generation, so the UI stays responsive.

### 7. Avoid memory leaks

Unsubscribed observables, un-cleared intervals and listeners on `window`/`document` accumulate as users navigate. Use `takeUntilDestroyed`, `toSignal`, the `async` pipe and `DestroyRef`. Check with heap snapshots (navigate between pages several times and compare).

## Server interaction

- Avoid request waterfalls: load independent data in parallel (`forkJoin`, several `httpResource`s).
- Cache stable reference data (countries, categories) in a service.
- Paginate and filter on the server; don't download 10,000 rows to filter in the browser.
- Use `switchMap` to cancel stale requests.

## A real-world checklist

- [ ] All feature routes lazy-loaded; heavy widgets deferred
- [ ] Budgets configured and passing
- [ ] `NgOptimizedImage` for all content images, LCP image marked `priority`
- [ ] `OnPush` + signals everywhere; zoneless enabled
- [ ] No function calls or getters doing real work in templates
- [ ] `track` by id in all lists; virtual scrolling for long lists
- [ ] No leaking subscriptions or listeners
- [ ] SSR/prerendering for public, content-heavy pages
- [ ] Performance checks (Lighthouse CI) in the pipeline

## Try it yourself

Pick a slow page in an Angular app. Record a Lighthouse report and an Angular DevTools profile, list the top three problems, fix them one at a time (e.g. defer a chart, add `OnPush` + `computed`, virtualise a table), and document the before/after numbers.
