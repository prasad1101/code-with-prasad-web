React's built-in tools — `useState`, `useReducer`, context — cover a lot. As apps grow, shared **client state** that many components read and update (cart, UI preferences, multi-step workflows) benefits from a dedicated store with selective subscriptions and good tooling. The two most popular choices are **Zustand** (minimal) and **Redux Toolkit** (structured).

## First: what kind of state is it?

| State | Best home |
| --- | --- |
| Local UI (open, hover, input text) | `useState` in the component |
| Shared between a few nearby components | Lift state up |
| Low-frequency global values (theme, user, locale) | Context |
| Server data (products, orders) | **TanStack Query** (or framework loaders) — not a client store |
| URL-worthy (filters, page, tab) | Router search params |
| Frequently updated global client state | **Zustand / Redux Toolkit** |

Most "we need Redux" problems disappear once server state moves to TanStack Query.

## Zustand

A store is a hook. Components subscribe to **slices** of state and re-render only when those change:

```bash
npm install zustand
```

```tsx
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CartItem = { id: string; name: string; price: number; qty: number }

type CartStore = {
  items: CartItem[]
  add: (product: { id: string; name: string; price: number }) => void
  remove: (id: string) => void
  clear: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      add: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id)
          return {
            items: existing
              ? state.items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
              : [...state.items, { ...product, qty: 1 }],
          }
        }),
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'cart' }, // persisted to localStorage
  ),
)
```

```tsx
function CartBadge() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0))   // re-renders only when count changes
  return <span className="badge">{count}</span>
}

function AddToCartButton({ product }: { product: { id: string; name: string; price: number } }) {
  const add = useCartStore((s) => s.add)
  return <button onClick={() => add(product)}>Add to cart</button>
}
```

- No provider needed.
- **Selectors** (`(s) => s.items`) control what each component subscribes to.
- When selecting several values into a new object or array, use `useShallow` to avoid re-rendering on every store change.
- Actions can be async — just call `set` when the work completes.

## Redux Toolkit

Redux uses a single store, **actions** describing what happened, and **reducers** computing the next state. Redux Toolkit (RTK) is the modern, official way to write Redux — far less boilerplate than classic Redux.

```bash
npm install @reduxjs/toolkit react-redux
```

```ts
// features/cart/cartSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type CartState = { items: CartItem[] }
const initialState: CartState = { items: [] }

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    itemAdded(state, action: PayloadAction<{ id: string; name: string; price: number }>) {
      const existing = state.items.find((i) => i.id === action.payload.id)
      if (existing) existing.qty += 1                     // Immer makes this "mutation" safe
      else state.items.push({ ...action.payload, qty: 1 })
    },
    itemRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload)
    },
    cleared(state) {
      state.items = []
    },
  },
  selectors: {
    selectCount: (state) => state.items.reduce((n, i) => n + i.qty, 0),
  },
})

export const { itemAdded, itemRemoved, cleared } = cartSlice.actions
export const { selectCount } = cartSlice.selectors
```

```ts
// store.ts
import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { cartSlice } from './features/cart/cartSlice'

export const store = configureStore({ reducer: { cart: cartSlice.reducer } })

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

```tsx
// main.tsx: <Provider store={store}><App /></Provider>

function CartBadge() {
  const count = useAppSelector(selectCount)
  return <span>{count}</span>
}

function AddButton({ product }: { product: { id: string; name: string; price: number } }) {
  const dispatch = useAppDispatch()
  return <button onClick={() => dispatch(itemAdded(product))}>Add</button>
}
```

RTK includes **Immer** (write "mutating" logic safely), the **Redux DevTools** integration (time-travel debugging, action logs), `createAsyncThunk` for async logic, and **RTK Query** for data fetching and caching (an alternative to TanStack Query when you're all-in on Redux).

## Zustand or Redux Toolkit?

| | Zustand | Redux Toolkit |
| --- | --- | --- |
| Boilerplate | Minimal | Moderate (slices, store setup) |
| Structure | Flexible | Opinionated, consistent across large teams |
| DevTools / time travel | Via middleware | Built in and excellent |
| Middleware ecosystem | Small, sufficient | Large (listeners, RTK Query) |
| Best for | Small–medium apps, focused stores | Large apps, many developers, complex event flows |

Both are excellent. Many existing enterprise React apps use Redux; many newer apps use Zustand + TanStack Query.

## Principles regardless of library

- Keep server state out of client stores.
- Store minimal state; **derive** the rest with selectors.
- Keep updates immutable (or use Immer).
- Colocate: feature-specific state lives with the feature.
- Name actions after events (`itemAdded`), not setters.

## Try it yourself

Implement the same "wishlist + cart" feature twice — with Zustand (with persistence) and with Redux Toolkit (with a selector for the cart total). Measure re-renders with the React DevTools profiler when adding an item, and compare the amount of code.
