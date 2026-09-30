**Change detection** is how Angular keeps the DOM in sync with your data. Understanding it explains most Angular performance problems — and why signals, `OnPush` and zoneless mode make apps faster.

## The classic model: Zone.js

Historically, Angular used **Zone.js**, which patches browser APIs (events, timers, `fetch`, promises) to know when *something might have changed*. After every such event, Angular ran change detection over the **whole component tree**, re-evaluating every template binding to find differences.

This "check everything after anything" approach is simple to use but:

- does work proportional to the size of the app on every event;
- re-runs expensive template expressions and function calls repeatedly;
- adds Zone.js to the bundle and makes stack traces harder to read.

## `OnPush`: checking less

With `ChangeDetectionStrategy.OnPush`, Angular only checks a component (and its subtree) when:

1. One of its **inputs** receives a new reference,
2. An **event** handler in its template runs,
3. A **signal** read in its template changes,
4. An `async` pipe in its template receives a value, or
5. It's explicitly marked for check (`ChangeDetectorRef.markForCheck()`).

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core'

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h3>{{ product().name }}</h3>`,
})
export class ProductCard {
  product = input.required<Product>()
}
```

`OnPush` works best with **immutable data**. If a parent mutates `product.name` in place, the input reference doesn't change and an `OnPush` child won't update:

```ts
this.product.name = 'New name'                            // ✗ OnPush child won't notice
this.product = { ...this.product, name: 'New name' }      // ✓ new reference
```

Making `OnPush` the default for new components is a widely used best practice.

## Signals: telling Angular exactly what changed

When a template reads a signal, Angular records that dependency. When the signal changes, Angular marks **only the affected components** for update. Combined with `OnPush`, signals give precise, efficient updates without Zone.js guesswork:

```ts
@Component({
  selector: 'app-cart-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge">{{ cart.count() }}</span>`,
})
export class CartBadge {
  cart = inject(CartStore)
}
```

## Zoneless Angular

With signals driving updates, Zone.js isn't needed. In current Angular versions, new applications are **zoneless by default**. For existing apps, you opt in:

```ts
// app.config.ts
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
}
```

…and remove `zone.js` from the `polyfills` in `angular.json`.

In zoneless mode, change detection is scheduled when:

- a signal read by a template changes,
- a template event handler runs,
- an `async` pipe or `markForCheck()` notifies Angular,
- a component is attached or inputs are set.

What **stops** working automatically: updating a plain (non-signal) class field from a `setTimeout`, a promise callback or a third-party library callback. The fix is to keep UI state in signals:

```ts
// ✗ in zoneless mode the view won't update
setTimeout(() => (this.message = 'Saved'), 1000)

// ✓
message = signal('')
setTimeout(() => this.message.set('Saved'), 1000)
```

Benefits: smaller bundles, faster runtime, clearer stack traces and better compatibility with native async/await.

## Common performance pitfalls

### Function calls in templates

```html
<p>{{ formatPrice(product) }}</p>   <!-- runs on every check of this component -->
```

Replace with a `computed` signal or a pure pipe, which only recompute when inputs change.

### Missing `track` in lists

`@for` requires `track`. Tracking by a stable id lets Angular move existing DOM nodes instead of destroying and recreating them.

### Heavy work in getters

Getters used in templates run on every check. Cache the result in a `computed`.

## Debugging change detection

**Angular DevTools** (browser extension) shows the component tree, lets you inspect signals and inputs, and has a **profiler** that records change detection cycles — which components were checked and how long each took. Use it to find components that update too often.

## Migration path for existing apps

1. Adopt signals for component state and `input()` for inputs.
2. Turn on `OnPush` component by component (start with leaf components).
3. Replace plain mutable fields updated asynchronously with signals.
4. Enable `provideZonelessChangeDetection()` and remove Zone.js; test thoroughly.

## Try it yourself

Take a list of 1,000 product cards. Profile a search keystroke with Angular DevTools using default change detection and function calls in templates. Then convert the cards to `OnPush` with signal inputs, move template calculations to `computed`, add `track p.id`, and profile again.
