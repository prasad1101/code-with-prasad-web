**State** is data that belongs to a component and changes over time — a counter, whether a menu is open, the text in a search box. When state changes, React re-renders the component. **Events** are how users trigger those changes.

## `useState`

```tsx
import { useState } from 'react'

function LikeButton() {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(41)

  function handleClick() {
    setLiked(!liked)
    setLikes(liked ? likes - 1 : likes + 1)
  }

  return (
    <button aria-pressed={liked} onClick={handleClick}>
      {liked ? '♥' : '♡'} {likes}
    </button>
  )
}
```

`useState(initial)` returns the current value and a setter. Calling the setter schedules a re-render with the new value.

## Hooks rules

`useState` is a **hook** — a function starting with `use`. Hooks must:

1. Be called at the **top level** of a component (not inside `if`, loops or nested functions).
2. Only be called from components or other hooks.

React relies on hooks being called in the same order on every render.

## Handling events

```tsx
<button onClick={handleClick}>Save</button>                   // pass the function
<button onClick={() => remove(item.id)}>Delete</button>      // wrap to pass arguments
<button onClick={handleClick()}>Save</button>                 // ✗ calls it during render!
```

Event handlers receive a synthetic event object:

```tsx
function SearchBox() {
  const [query, setQuery] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        console.log('Search for', query)
      }}
    >
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button type="submit">Search</button>
    </form>
  )
}
```

## State is a snapshot

Inside a render, a state variable holds the value **for that render**. Setting state doesn't change it immediately:

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  function addThree() {
    setCount(count + 1)
    setCount(count + 1)
    setCount(count + 1)
    console.log(count) // still 0 — the new value arrives on the next render
  }
  // After clicking, count is 1, not 3
}
```

### Updater functions

When the new state depends on the previous one, pass a function:

```tsx
function addThree() {
  setCount((c) => c + 1)
  setCount((c) => c + 1)
  setCount((c) => c + 1)   // now count becomes 3
}
```

React queues updates and applies them in order. Multiple updates in one event are **batched** into a single re-render.

## Objects and arrays in state: never mutate

React detects changes by comparing references. Mutating an object or array in place doesn't create a new reference, so React may not re-render — always create a new value:

```tsx
const [user, setUser] = useState({ name: 'Asha', address: { city: 'Pune' } })

setUser({ ...user, name: 'Asha Patil' })                               // update a field
setUser({ ...user, address: { ...user.address, city: 'Mumbai' } })    // nested update

const [items, setItems] = useState<CartItem[]>([])

setItems([...items, newItem])                                          // add
setItems(items.filter((i) => i.id !== id))                             // remove
setItems(items.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i))) // update one
```

For deeply nested state, consider flattening it, `useReducer`, or a helper like Immer.

## Where state lives: lifting state up

When two components need the same state, move it to their closest common parent and pass it down as props:

```tsx
function Accordion() {
  const [openId, setOpenId] = useState<string | null>('shipping')

  return (
    <>
      <Panel id="shipping" title="Shipping" isOpen={openId === 'shipping'} onToggle={setOpenId} />
      <Panel id="returns" title="Returns" isOpen={openId === 'returns'} onToggle={setOpenId} />
    </>
  )
}

function Panel(props: { id: string; title: string; isOpen: boolean; onToggle: (id: string | null) => void }) {
  return (
    <section>
      <button aria-expanded={props.isOpen} onClick={() => props.onToggle(props.isOpen ? null : props.id)}>
        {props.title}
      </button>
      {props.isOpen && <p>Details for {props.title.toLowerCase()}…</p>}
    </section>
  )
}
```

Data flows down (props); changes flow up (callbacks).

## Don't store what you can calculate

```tsx
const [items, setItems] = useState<CartItem[]>([])
const [total, setTotal] = useState(0)          // ✗ redundant state that can drift out of sync

const total = items.reduce((s, i) => s + i.price * i.qty, 0)   // ✓ derive it during render
```

Derived values should be computed from existing state, not stored separately.

## Try it yourself

Build a shopping cart: a list of products with "Add" buttons, a cart showing quantities with +/− buttons, a remove button, and a derived total and item count. Keep the cart state in the parent and pass handlers down to the product list and cart components.
