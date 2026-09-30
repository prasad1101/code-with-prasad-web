**Data binding** connects your component's data to the template. Angular has four forms, and knowing which direction data flows in each is the key to reading any Angular template.

| Syntax | Direction | Example |
| --- | --- | --- |
| `{{ value }}` | Component → view | `{{ product().name }}` |
| `[property]="value"` | Component → view | `[disabled]="saving()"` |
| `(event)="handler()"` | View → component | `(click)="save()"` |
| `[(ngModel)]="value"` / `[(value)]` | Both ways | `[(ngModel)]="query"` |

## Interpolation

```html
<h2>{{ product().name }}</h2>
<p>{{ product().price * qty() }} in total</p>
<p>Updated {{ lastUpdated() | date: 'short' }}</p>
```

Interpolation converts values to strings and inserts them as **text** — HTML in the value is escaped, which protects against XSS.

## Property binding

Set a DOM property (or a component input) to an expression:

```html
<img [src]="product().imageUrl" [alt]="product().name" />
<button [disabled]="!form.valid">Submit</button>
<app-rating [value]="product().rating" />
```

Without brackets, the value is a plain string: `<img src="product().imageUrl">` would literally request that text.

### Attribute, class and style bindings

Some HTML attributes have no DOM property (ARIA, `colspan`):

```html
<button [attr.aria-expanded]="open()" [attr.aria-controls]="panelId">Menu</button>
<td [attr.colspan]="span()">…</td>
```

Classes and styles:

```html
<li [class.active]="item.id === selectedId()">…</li>
<div [class]="{ card: true, featured: product().featured, 'out-of-stock': product().stock === 0 }">…</div>
<div [style.width.%]="progress()"></div>
<p [style.color]="error() ? 'crimson' : null">…</p>
```

## Event binding

```html
<button (click)="addToCart()">Add</button>
<input (input)="onSearch($event)" />
<input (keyup.enter)="submit()" />
<form (submit)="save($event)">…</form>
```

`$event` is the DOM event (or the value emitted by a component output):

```ts
onSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  this.query.set(value)
}
```

Key-event filters like `(keyup.enter)`, `(keydown.escape)` and `(keydown.control.s)` keep handlers clean.

## Template reference variables

`#name` gives the template a reference to an element or component:

```html
<input #email type="email" />
<button (click)="subscribe(email.value)">Subscribe</button>
```

## Two-way binding

Two-way binding combines a property binding and an event binding. With `FormsModule`, `ngModel` binds form controls:

```ts
import { Component, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-search',
  imports: [FormsModule],
  template: `
    <input [(ngModel)]="query" placeholder="Search products" />
    <p>Searching for: {{ query() }}</p>
  `,
})
export class Search {
  query = signal('')
}
```

`[(ngModel)]` works directly with writable signals. The "banana in a box" `[( )]` is shorthand for `[ngModel]="query()" (ngModelChange)="query.set($event)"`.

For anything beyond simple inputs, reactive forms (covered later) are the better tool.

Your own components can support two-way binding with `model()` inputs — see the inputs and outputs lesson.

## A complete example: quantity picker

```ts
import { Component, computed, signal } from '@angular/core'
import { CurrencyPipe } from '@angular/common'

@Component({
  selector: 'app-quantity-picker',
  imports: [CurrencyPipe],
  template: `
    <div class="picker">
      <button type="button" (click)="change(-1)" [disabled]="qty() <= 1" aria-label="Decrease">−</button>
      <span aria-live="polite">{{ qty() }}</span>
      <button type="button" (click)="change(1)" [disabled]="qty() >= max" aria-label="Increase">+</button>
    </div>
    <p [class.discount]="qty() >= 5">Total: {{ total() | currency: 'INR' }}</p>
  `,
})
export class QuantityPicker {
  readonly max = 10
  unitPrice = signal(799)
  qty = signal(1)
  total = computed(() => this.unitPrice() * this.qty() * (this.qty() >= 5 ? 0.9 : 1))

  change(delta: number) {
    this.qty.update((q) => Math.min(this.max, Math.max(1, q + delta)))
  }
}
```

## Try it yourself

Build a "profile editor" component with name and bio inputs using `[(ngModel)]`, a live preview card that updates as you type, a character counter for the bio that turns red over 160 characters (class binding), and a Save button disabled while the name is empty.
