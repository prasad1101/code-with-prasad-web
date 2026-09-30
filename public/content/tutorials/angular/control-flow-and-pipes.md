Templates need to show things conditionally, repeat elements for lists, and format values. Angular's **built-in control flow** (`@if`, `@for`, `@switch`) and **pipes** handle this.

## `@if`

```html
@if (user(); as u) {
  <p>Welcome back, {{ u.name }}!</p>
} @else if (loading()) {
  <p>Loading…</p>
} @else {
  <button (click)="login()">Log in</button>
}
```

`as u` stores the (truthy) result in a local variable — handy for values from signals or observables.

## `@for`

```html
<ul>
  @for (product of products(); track product.id; let i = $index, last = $last) {
    <li [class.last]="last">{{ i + 1 }}. {{ product.name }} — {{ product.price | currency: 'INR' }}</li>
  } @empty {
    <li>No products found.</li>
  }
</ul>
```

- **`track`** is required. It tells Angular how to identify each item, so when the list changes it can move, add or remove only the affected DOM elements instead of re-rendering everything. Track by a unique id; use `$index` only for static lists.
- `@empty` renders when the collection is empty.
- Contextual variables: `$index`, `$first`, `$last`, `$even`, `$odd`, `$count`.

## `@switch`

```html
@switch (order().status) {
  @case ('paid') { <span class="badge blue">Paid</span> }
  @case ('shipped') { <span class="badge green">Shipped</span> }
  @case ('cancelled') { <span class="badge red">Cancelled</span> }
  @default { <span class="badge">Pending</span> }
}
```

## `@let`: template variables

```html
@let total = cart().items.length;
@let isEmpty = total === 0;

<p>{{ isEmpty ? 'Your cart is empty' : total + ' items' }}</p>
```

## Older syntax: `*ngIf` and `*ngFor`

Existing projects use structural directives:

```html
<p *ngIf="user; else loginTpl">Hello {{ user.name }}</p>
<ng-template #loginTpl><button>Log in</button></ng-template>

<li *ngFor="let p of products; trackBy: trackById">{{ p.name }}</li>
```

The built-in control flow is faster, needs no imports and is more readable. `ng generate @angular/core:control-flow` migrates old templates automatically.

## Pipes

A **pipe** transforms a value for display with the `|` operator:

```html
<p>{{ product().name | uppercase }}</p>
<p>{{ product().price | currency: 'INR' }}</p>          <!-- ₹799.00 -->
<p>{{ order().placedAt | date: 'dd MMM yyyy, h:mm a' }}</p>
<p>{{ rating() | number: '1.1-1' }}</p>                  <!-- 4.3 -->
<p>{{ discount() | percent }}</p>                         <!-- 15% -->
<pre>{{ debugData() | json }}</pre>
<p>{{ description() | slice: 0 : 120 }}…</p>
```

Built-in pipes come from `@angular/common` — import the ones you use (`CurrencyPipe`, `DatePipe`, `DecimalPipe`, …) in the component's `imports`.

Pipes chain left to right: `{{ name() | lowercase | titlecase }}`.

### Locale

`currency`, `date` and `number` pipes use the app's locale. For Indian formatting (`₹1,23,456.00`), register the `en-IN` locale data and provide `LOCALE_ID`.

## The `async` pipe

Subscribes to an Observable or Promise, renders the latest value, and **unsubscribes automatically** when the component is destroyed:

```html
@if (products$ | async; as products) {
  @for (p of products; track p.id) { <app-product-card [product]="p" /> }
} @else {
  <app-spinner />
}
```

With signals, you'll often convert observables with `toSignal` instead (covered in the RxJS lesson).

## Custom pipes

```bash
ng generate pipe relative-time
```

```ts
import { Pipe, PipeTransform } from '@angular/core'

@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  private rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  transform(value: Date | string): string {
    const diffMs = new Date(value).getTime() - Date.now()
    const minutes = Math.round(diffMs / 60_000)
    if (Math.abs(minutes) < 60) return this.rtf.format(minutes, 'minute')
    const hours = Math.round(minutes / 60)
    if (Math.abs(hours) < 24) return this.rtf.format(hours, 'hour')
    return this.rtf.format(Math.round(hours / 24), 'day')
  }
}
```

```html
<small>Posted {{ comment().createdAt | relativeTime }}</small>
```

Pipes are **pure** by default: Angular only re-runs them when the input reference changes, which makes them very cheap. (A pure pipe won't notice if you mutate an array in place — prefer immutable updates.)

## Try it yourself

Build an order history list: `@for` over orders tracked by id with an `@empty` state, a status badge using `@switch`, formatted dates and currency, and a custom `truncate` pipe for long product names.
