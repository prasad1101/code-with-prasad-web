Everything you see in an Angular app is a **component**: a TypeScript class that holds data and behaviour, plus an HTML **template** that renders it, plus optional styles. Apps are trees of components — an `App` root containing a header, a product list, product cards, and so on.

## Generating a component

```bash
ng generate component product-card
```

The CLI creates:

```text
src/app/product-card/
  product-card.ts        # the class
  product-card.html      # the template
  product-card.scss      # the styles
  product-card.spec.ts   # a test
```

## Anatomy of a component

```ts
// product-card.ts
import { Component, signal } from '@angular/core'

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  name = signal('Wireless Mouse')
  price = signal(799)
  inStock = signal(true)

  addToCart() {
    console.log(`Added ${this.name()} to cart`)
  }
}
```

```html
<!-- product-card.html -->
<article class="card">
  <h3>{{ name() }}</h3>
  <p class="price">₹{{ price() }}</p>
  <button type="button" [disabled]="!inStock()" (click)="addToCart()">Add to cart</button>
</article>
```

- **`selector`** — the custom HTML tag used to place this component: `<app-product-card />`.
- **`templateUrl` / `template`** — external file or inline template.
- **`styleUrl` / `styles`** — component styles.

## Using a component inside another

Standalone components declare what they use in their `imports` array:

```ts
// app.ts
import { Component } from '@angular/core'
import { ProductCard } from './product-card/product-card'

@Component({
  selector: 'app-root',
  imports: [ProductCard],
  template: `
    <h1>Our products</h1>
    <app-product-card />
    <app-product-card />
  `,
})
export class App {}
```

Forgetting to add a component to `imports` gives an error like "'app-product-card' is not a known element".

## Component styles are scoped

Styles in a component apply **only** to that component's template, thanks to Angular's view encapsulation:

```scss
/* product-card.scss */
:host {
  display: block;            /* :host targets the component's own element */
}

.card {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 1rem;
}

.price {
  font-weight: 600;
}
```

A `.price` class elsewhere in the app isn't affected. Put genuinely global styles (fonts, resets, design tokens) in `src/styles.scss`.

## Template syntax at a glance

```html
{{ expression }}                      <!-- interpolation: display a value -->
<img [src]="imageUrl()" />           <!-- property binding -->
<button (click)="save()">Save</button> <!-- event binding -->
<input [(ngModel)]="query" />        <!-- two-way binding (FormsModule) -->
@if (loggedIn()) { <p>Welcome</p> }  <!-- control flow -->
{{ price() | currency: 'INR' }}      <!-- pipe -->
<input #search />                    <!-- template reference variable -->
```

The next lessons cover each of these in detail.

## Template expressions

Template expressions are a safe subset of TypeScript. They can read component properties and call methods, but can't use `new`, assignments with side effects (except in event handlers), or global objects like `window`:

```html
<p>Total: {{ price() * quantity() }}</p>
<p>{{ user()?.address?.city ?? 'Unknown city' }}</p>
```

Keep templates simple — move logic into the class (a `computed` signal or a method) so it's readable and testable.

## Lifecycle hooks

Components can react to key moments by implementing lifecycle interfaces:

```ts
import { Component, OnDestroy, OnInit, signal } from '@angular/core'
import { DatePipe } from '@angular/common'

@Component({ selector: 'app-clock', imports: [DatePipe], template: `{{ now() | date: 'mediumTime' }}` })
export class Clock implements OnInit, OnDestroy {
  now = signal(new Date())
  private timer?: ReturnType<typeof setInterval>

  ngOnInit() {
    this.timer = setInterval(() => this.now.set(new Date()), 1000)
  }

  ngOnDestroy() {
    clearInterval(this.timer)
  }
}
```

| Hook | When |
| --- | --- |
| `ngOnInit` | After inputs are first set — good for initial data loading |
| `ngOnChanges` | When input values change (less needed with signal inputs) |
| `ngAfterViewInit` | After the component's view (and child views) are created |
| `ngOnDestroy` | Just before the component is removed — clean up timers and subscriptions |

Modern Angular also offers `DestroyRef` for cleanup and `afterNextRender` for DOM work that must run after rendering.

## Try it yourself

Generate a `UserBadge` component that shows an avatar image, a name and a "Pro" label when `isPro` is true. Style it with scoped styles, use it three times in `App`, and add a lifecycle hook that logs when each badge is destroyed.
