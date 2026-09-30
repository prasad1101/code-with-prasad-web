**Signals** are Angular's reactive primitive: a value that notifies everything that depends on it when it changes. They make state changes explicit, give Angular fine-grained knowledge of what to re-render, and replace much of the boilerplate that RxJS was previously used for in components.

## Writable signals

```ts
import { signal } from '@angular/core'

const count = signal(0)

count()                     // read: 0
count.set(5)                // replace the value
count.update((c) => c + 1)  // compute from the previous value → 6
```

A signal is read by **calling** it. In templates, `{{ count() }}` registers the template as a consumer, so it re-renders when `count` changes.

### Signals with objects and arrays

Signals compare values with `Object.is` by default. Mutating an object in place doesn't change its identity, so **nothing updates**:

```ts
const cart = signal<CartItem[]>([])

cart().push(item)                              // ✗ mutation — no notification
cart.update((items) => [...items, item])       // ✓ new array
cart.update((items) => items.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)))
```

Treat signal values as **immutable**.

## Computed signals

`computed` derives a value from other signals. It's **lazy** (calculated only when read) and **memoised** (recalculated only when a dependency changes):

```ts
import { computed, signal } from '@angular/core'

const items = signal<CartItem[]>([])
const subtotal = computed(() => items().reduce((sum, i) => sum + i.price * i.qty, 0))
const shipping = computed(() => (subtotal() > 999 || subtotal() === 0 ? 0 : 49))
const total = computed(() => subtotal() + shipping())
```

Dependencies are tracked automatically — whatever signals are read during the computation. Computed signals are read-only.

## Effects

`effect` runs a side effect whenever the signals it reads change:

```ts
import { Component, effect, signal } from '@angular/core'

@Component({ selector: 'app-settings', template: `…` })
export class Settings {
  theme = signal<'light' | 'dark'>('light')

  constructor() {
    effect(() => {
      document.documentElement.dataset['theme'] = this.theme()
      localStorage.setItem('theme', this.theme())
    })
  }
}
```

Effects must be created in an **injection context** (a constructor or field initialiser) and are destroyed with their component.

**Use effects sparingly.** They're for syncing with the outside world — `localStorage`, logging, third-party libraries, the DOM. Don't use an effect to copy one signal into another; that's what `computed` (or `linkedSignal`) is for.

`untracked` reads a signal without creating a dependency:

```ts
effect(() => {
  const q = this.query()                     // tracked
  logger.log(q, untracked(this.user))        // not tracked
})
```

## `linkedSignal`: writable state that resets

Sometimes state should be derived from another signal but still be editable. Example: the selected option resets whenever the list of options changes:

```ts
import { linkedSignal, signal } from '@angular/core'

const shippingOptions = signal(['Standard', 'Express'])
const selected = linkedSignal(() => shippingOptions()[0])

selected.set('Express')                    // user choice
shippingOptions.set(['Standard', 'Same day']) // selected resets to 'Standard'
```

## Async data with `resource`

`resource` connects signals to asynchronous work — re-fetching whenever its parameters change:

```ts
import { Component, resource, signal } from '@angular/core'

@Component({
  selector: 'app-user-profile',
  template: `
    @if (user.isLoading()) {
      <p>Loading…</p>
    } @else if (user.error()) {
      <p>Could not load user.</p>
    } @else if (user.hasValue()) {
      <h2>{{ user.value().name }}</h2>
    }
  `,
})
export class UserProfile {
  userId = signal(1)

  user = resource({
    params: () => ({ id: this.userId() }),
    loader: async ({ params, abortSignal }) => {
      const res = await fetch(`/api/users/${params.id}`, { signal: abortSignal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as { id: number; name: string }
    },
  })
}
```

When `userId` changes, the previous request is aborted and a new one starts. For Angular's `HttpClient`, `httpResource` does the same with less code (see the HTTP lesson).

## Signals in services: shared state

```ts
import { Injectable, computed, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _items = signal<CartItem[]>([])

  readonly items = this._items.asReadonly()
  readonly count = computed(() => this._items().reduce((n, i) => n + i.qty, 0))
  readonly total = computed(() => this._items().reduce((s, i) => s + i.price * i.qty, 0))

  add(product: Product) {
    this._items.update((items) => {
      const existing = items.find((i) => i.id === product.id)
      return existing
        ? items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...items, { id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  remove(id: string) {
    this._items.update((items) => items.filter((i) => i.id !== id))
  }
}
```

Exposing a read-only signal and mutation methods keeps all state changes in one place — the basis of the state management lesson.

## Signals vs. RxJS

| Signals | RxJS Observables |
| --- | --- |
| Synchronous state with a current value | Streams of events over time |
| Great for UI state and derived values | Great for async orchestration: debouncing, cancellation, websockets, combining streams |
| Simple API | Powerful operators, steeper learning curve |

They interoperate: `toSignal(observable$)` and `toObservable(signal)` (from `@angular/core/rxjs-interop`). Use signals for state, RxJS for complex event streams.

## Try it yourself

Build a product list with a search box and a category filter. Keep `query`, `category` and `products` in signals, derive `filteredProducts` with `computed`, persist the chosen category to `localStorage` with an `effect`, and show a count of matching items.
