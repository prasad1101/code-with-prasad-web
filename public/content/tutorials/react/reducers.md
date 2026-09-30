When a component has many related pieces of state and many ways to change them, scattered `useState` calls and event handlers become hard to follow. A **reducer** consolidates all state-update logic into one pure function.

## The idea

Instead of telling React *how* to set state in each handler, you **dispatch actions** describing *what happened*. The reducer decides how the state changes:

```text
event handler → dispatch({ type: 'item_added', product }) → reducer(state, action) → new state → re-render
```

## `useReducer`

```tsx
import { useReducer } from 'react'

type CartItem = { id: string; name: string; price: number; qty: number }
type CartState = { items: CartItem[]; coupon: string | null }

type CartAction =
  | { type: 'item_added'; product: { id: string; name: string; price: number } }
  | { type: 'quantity_changed'; id: string; qty: number }
  | { type: 'item_removed'; id: string }
  | { type: 'coupon_applied'; code: string }
  | { type: 'cleared' }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'item_added': {
      const existing = state.items.find((i) => i.id === action.product.id)
      const items = existing
        ? state.items.map((i) => (i.id === action.product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...state.items, { ...action.product, qty: 1 }]
      return { ...state, items }
    }
    case 'quantity_changed':
      return {
        ...state,
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, qty: action.qty } : i))
          .filter((i) => i.qty > 0),
      }
    case 'item_removed':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'coupon_applied':
      return { ...state, coupon: action.code.toUpperCase() }
    case 'cleared':
      return { items: [], coupon: null }
    default: {
      const unreachable: never = action
      throw new Error(`Unknown action: ${JSON.stringify(unreachable)}`)
    }
  }
}

function Cart() {
  const [state, dispatch] = useReducer(cartReducer, { items: [], coupon: null })
  const total = state.items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <section>
      {state.items.map((item) => (
        <div key={item.id}>
          {item.name}
          <input
            type="number"
            min={0}
            value={item.qty}
            onChange={(e) => dispatch({ type: 'quantity_changed', id: item.id, qty: Number(e.target.value) })}
          />
          <button onClick={() => dispatch({ type: 'item_removed', id: item.id })}>Remove</button>
        </div>
      ))}
      <p>Total: ₹{total}</p>
      <button onClick={() => dispatch({ type: 'cleared' })}>Clear cart</button>
    </section>
  )
}
```

## Reducer rules

1. **Pure** — same state and action in, same state out. No API calls, timers or randomness inside.
2. **Immutable** — return new objects/arrays; never mutate `state`.
3. **Actions describe what happened** (`item_added`, `coupon_applied`), not how to set fields (`set_items`).
4. **Handle every action type** — the `never` check above makes TypeScript flag missing cases.

## Why reducers help

- **All update logic in one place**, separate from rendering.
- **Easy to test** — reducers are plain functions:

```ts
it('increments quantity when the same product is added twice', () => {
  const p = { id: 'p1', name: 'Mouse', price: 799 }
  let s = cartReducer({ items: [], coupon: null }, { type: 'item_added', product: p })
  s = cartReducer(s, { type: 'item_added', product: p })
  expect(s.items[0].qty).toBe(2)
})
```

- **Easier debugging** — log every action to see exactly how state evolved.
- **Stable `dispatch`** — the function identity never changes, so it's safe to pass deeply without causing re-renders.

## `useState` or `useReducer`?

| Prefer `useState` | Prefer `useReducer` |
| --- | --- |
| Independent, simple values | Several related values updated together |
| Few ways to update | Many different update events |
| Logic is trivial | Logic is complex or needs testing on its own |

Both are fine; many components start with `useState` and move to a reducer as they grow.

## Async work with reducers

Reducers must stay synchronous. Perform side effects in event handlers (or data-fetching libraries) and dispatch actions for each stage:

```tsx
async function applyCoupon(code: string) {
  dispatch({ type: 'coupon_requested' })
  try {
    const discount = await validateCoupon(code)
    dispatch({ type: 'coupon_applied', code, discount })
  } catch {
    dispatch({ type: 'coupon_rejected', code })
  }
}
```

## Scaling up

- Combine `useReducer` with context to share state across a feature (see the context lesson).
- For application-wide state with devtools, middleware and many slices, **Redux Toolkit** uses exactly this reducer model (covered in the state management lesson).
- **Immer** (built into Redux Toolkit, or via `use-immer`) lets you write "mutating" code that produces immutable updates — handy for deeply nested state.

## Try it yourself

Model a multi-step checkout with a reducer: steps (`address` → `payment` → `review` → `done`), address and payment data, validation errors, and actions such as `address_submitted`, `back_clicked`, `payment_failed` and `order_placed`. Write unit tests for the reducer before building the UI.
