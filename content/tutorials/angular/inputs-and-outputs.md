Components become reusable when a parent can pass data **in** and receive events **out**. Modern Angular uses the signal-based `input()`, `output()` and `model()` functions.

## Inputs: data from parent to child

```ts
import { Component, computed, input } from '@angular/core'
import { CurrencyPipe } from '@angular/common'

export interface Product {
  id: string
  name: string
  price: number
  stock: number
}

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  template: `
    <h3>{{ product().name }}</h3>
    <p>{{ product().price | currency: currency() }}</p>
    @if (lowStock()) {
      <span class="warning">Only {{ product().stock }} left</span>
    }
  `,
})
export class ProductCard {
  product = input.required<Product>()        // must be provided
  currency = input('INR')                    // optional, with a default
  lowStock = computed(() => this.product().stock < 5)
}
```

The parent binds values with property binding:

```html
@for (p of products(); track p.id) {
  <app-product-card [product]="p" currency="USD" />
}
```

Inputs are **read-only signals** in the child: read them with `product()`, derive values with `computed`, and they update automatically when the parent passes new values.

### Transforms and aliases

```ts
import { booleanAttribute, input, numberAttribute } from '@angular/core'

featured = input(false, { transform: booleanAttribute })   // <app-card featured />
maxItems = input(10, { transform: numberAttribute })       // maxItems="5" → 5
label = input('', { alias: 'ariaLabel' })
```

## Outputs: events from child to parent

```ts
import { Component, input, output } from '@angular/core'

@Component({
  selector: 'app-product-card',
  template: `
    <h3>{{ product().name }}</h3>
    <button type="button" (click)="addToCart.emit(product())">Add to cart</button>
    <button type="button" (click)="favouriteToggled.emit(product().id)">♥</button>
  `,
})
export class ProductCard {
  product = input.required<Product>()
  addToCart = output<Product>()
  favouriteToggled = output<string>()
}
```

The parent listens with event binding; `$event` is the emitted value:

```html
<app-product-card
  [product]="p"
  (addToCart)="cart.add($event)"
  (favouriteToggled)="toggleFavourite($event)"
/>
```

Name outputs after what happened (`addToCart`, `selectionChange`), not after DOM events like `click`.

## `model()`: two-way binding for your components

A `model` input is writable by the child and syncs back to the parent:

```ts
import { Component, model } from '@angular/core'

@Component({
  selector: 'app-star-rating',
  template: `
    @for (star of stars; track star) {
      <button type="button" (click)="value.set(star)" [attr.aria-pressed]="star <= value()">
        {{ star <= value() ? '★' : '☆' }}
      </button>
    }
  `,
})
export class StarRating {
  value = model(0)
  stars = [1, 2, 3, 4, 5]
}
```

```html
<app-star-rating [(value)]="reviewRating" />
<p>You rated {{ reviewRating() }} stars</p>
```

`reviewRating` is a `signal(0)` in the parent — the `[( )]` syntax keeps both in sync.

## The older decorator style

You'll see this in existing code:

```ts
@Input({ required: true }) product!: Product
@Input() currency = 'INR'
@Output() addToCart = new EventEmitter<Product>()
```

It works the same way from the parent's perspective. The CLI can migrate decorators to signal inputs (`ng generate @angular/core:signal-input-migration`).

## Content projection

Let parents pass **markup** into a component with `<ng-content>`:

```ts
@Component({
  selector: 'app-card',
  template: `
    <article class="card">
      <header><ng-content select="[card-title]" /></header>
      <section><ng-content /></section>
      <footer><ng-content select="[card-actions]" /></footer>
    </article>
  `,
})
export class Card {}
```

```html
<app-card>
  <h3 card-title>Wireless Mouse</h3>
  <p>Ergonomic, silent clicks, 18-month battery.</p>
  <button card-actions>Buy now</button>
</app-card>
```

Content projection is how you build flexible layout components: cards, dialogs, tabs, panels.

## Designing component APIs

- Keep inputs **immutable** from the child's perspective; communicate changes upward with outputs.
- Prefer a few well-named inputs over one giant `config` object.
- Presentational components should receive data via inputs and emit events — they shouldn't fetch data or inject app services (see the component architecture lesson).

## Try it yourself

Build a reusable `Pagination` component with inputs `total` and `pageSize`, a `model` input `page`, and an output `pageSizeChange`. Use it in a product list and display "Showing 11–20 of 57".
