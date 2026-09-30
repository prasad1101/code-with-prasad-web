As an app grows, state gets shared across components and features: the logged-in user, the cart, filters, cached server data. **State management** is about deciding where each piece of state lives, who can change it, and how changes flow to the UI.

## Kinds of state

| Kind | Examples | Where it usually belongs |
| --- | --- | --- |
| Local UI state | open/closed, hover, input text | A signal in the component |
| Shared client state | cart, theme, current user | A signal-based service (store) |
| Server state (cached API data) | products, orders | `httpResource` / a data service with caching |
| URL state | filters, page, selected tab | Router query parameters |
| Form state | values, validation | Reactive or signal forms |

Most state bugs come from putting state in the wrong place — e.g. copying server data into a global store and forgetting to refresh it.

## Level 1: signals in a component

Start here. Don't create a store for state that only one component uses.

## Level 2: a signal-based service store

```ts
import { Injectable, computed, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'

interface CartItem { productId: string; name: string; price: number; qty: number }
interface CartState { items: CartItem[]; saving: boolean; error: string | null }

@Injectable({ providedIn: 'root' })
export class CartStore {
  private http = inject(HttpClient)
  private state = signal<CartState>({ items: [], saving: false, error: null })

  // Selectors
  readonly items = computed(() => this.state().items)
  readonly count = computed(() => this.items().reduce((n, i) => n + i.qty, 0))
  readonly total = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0))
  readonly saving = computed(() => this.state().saving)

  // Actions
  add(product: { id: string; name: string; price: number }) {
    this.state.update((s) => {
      const existing = s.items.find((i) => i.productId === product.id)
      const items = existing
        ? s.items.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...s.items, { productId: product.id, name: product.name, price: product.price, qty: 1 }]
      return { ...s, items }
    })
  }

  async checkout() {
    this.state.update((s) => ({ ...s, saving: true, error: null }))
    try {
      await firstValueFrom(this.http.post('/api/orders', { items: this.items() }))
      this.state.set({ items: [], saving: false, error: null })
    } catch {
      this.state.update((s) => ({ ...s, saving: false, error: 'Checkout failed, please try again' }))
    }
  }
}
```

Principles:

- **Single source of truth** — one private writable signal.
- **Read-only selectors** (`computed`) for consumers.
- **Named methods** for every change — no one else can set state arbitrarily.
- **Immutable updates** — new objects and arrays on every change.

This pattern handles the needs of most applications.

## Level 3: NgRx SignalStore

For larger teams, **NgRx SignalStore** (`@ngrx/signals`) provides the same idea with less boilerplate and consistent structure:

```ts
import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'

type CartState = { items: CartItem[] }

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({ items: [] }),
  withComputed(({ items }) => ({
    count: computed(() => items().reduce((n, i) => n + i.qty, 0)),
    total: computed(() => items().reduce((s, i) => s + i.price * i.qty, 0)),
  })),
  withMethods((store) => ({
    add(item: CartItem) {
      patchState(store, { items: [...store.items(), item] })
    },
    clear() {
      patchState(store, { items: [] })
    },
  })),
)
```

Plugins add entity collections, persistence, devtools integration and RxJS-based async methods.

## Level 4: NgRx Store (Redux pattern)

The classic **NgRx Store** uses actions, reducers, selectors and effects:

```text
component → dispatch(action) → reducer → new state → selectors → component
                     ↘ effects (API calls) → success/failure actions
```

It offers strict unidirectional data flow, time-travel debugging and a clear audit of every change — valuable in very large apps with complex, cross-cutting state and many developers. It's also more code. Many enterprise Angular apps already use it, so it's worth being able to read.

## Server state: don't duplicate it

Data from APIs has its own lifecycle — loading, errors, staleness, refetching. Rather than copying it into a global store:

- Load it where it's needed with `httpResource`, or
- Put fetching and caching in a data service (with `shareReplay` or a signal cache keyed by id), and
- Invalidate/refetch after mutations.

Libraries such as TanStack Query for Angular specialise in server-state caching.

## URL as state

Filters, sorting, pagination and selected tabs belong in the URL so users can bookmark, share and use the back button:

```ts
export class ProductListPage {
  private router = inject(Router)
  category = input<string>()        // bound from ?category=
  page = input(1, { transform: numberAttribute })

  setCategory(category: string) {
    this.router.navigate([], { queryParams: { category, page: 1 }, queryParamsHandling: 'merge' })
  }
}
```

## Choosing an approach

| App size / need | Recommendation |
| --- | --- |
| Small to medium app | Component signals + signal-based service stores |
| Many teams, want conventions | NgRx SignalStore |
| Complex event-driven workflows, strong audit/debugging needs | NgRx Store |
| Mostly server data | `httpResource` / data services with caching; minimal global state |

## Try it yourself

Build a `WishlistStore` as a signal-based service with `add`, `remove`, `toggle`, a `count` selector and persistence to `localStorage` (via an `effect`). Then reimplement it with NgRx SignalStore and compare the two.
