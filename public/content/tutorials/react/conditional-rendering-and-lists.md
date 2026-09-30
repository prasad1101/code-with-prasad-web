UIs constantly show different things depending on state (logged in or not, loading or loaded) and render collections (products, orders, messages). In React you do both with plain JavaScript.

## Conditional rendering

### `if` before `return`

```tsx
function OrderStatus({ status }: { status: 'loading' | 'error' | 'ready' }) {
  if (status === 'loading') return <Spinner />
  if (status === 'error') return <p role="alert">Could not load your orders.</p>
  return <OrderList />
}
```

### Ternary `? :`

```tsx
<button>{isFollowing ? 'Unfollow' : 'Follow'}</button>
{user ? <UserMenu user={user} /> : <LoginButton />}
```

### Logical `&&`

```tsx
{cart.length > 0 && <CartBadge count={cart.length} />}
{error && <p className="error">{error}</p>}
```

Beware of numbers on the left of `&&`: `{count && <Badge />}` renders `0` when `count` is `0`. Use a boolean: `{count > 0 && …}`.

### Returning `null`

A component can render nothing:

```tsx
function Banner({ message }: { message?: string }) {
  if (!message) return null
  return <div className="banner">{message}</div>
}
```

### Lookup objects for many cases

```tsx
const badge: Record<OrderStatus, React.ReactElement> = {
  pending: <span className="badge">Pending</span>,
  paid: <span className="badge blue">Paid</span>,
  shipped: <span className="badge green">Shipped</span>,
  cancelled: <span className="badge red">Cancelled</span>,
}

<td>{badge[order.status]}</td>
```

## Rendering lists

Use `map` to turn an array into elements:

```tsx
function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) return <p>No products found.</p>

  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          {p.name} — ₹{p.price}
        </li>
      ))}
    </ul>
  )
}
```

Filter and sort before mapping:

```tsx
const visible = products
  .filter((p) => p.stock > 0)
  .toSorted((a, b) => a.price - b.price)
```

(`toSorted` returns a new array; `sort` would mutate the prop — never mutate props or state.)

## Keys

Every element in a list needs a `key` that is **unique among its siblings** and **stable** across renders:

```tsx
{todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)}
```

Keys let React match elements between renders. With good keys, React moves, adds or removes only the changed items and keeps each item's state (like an input's text or a checkbox) attached to the right item.

What makes a bad key:

- **Array index** (`key={index}`) — when items are inserted, removed or reordered, indexes shift and state ends up attached to the wrong item. Only acceptable for static lists that never change order.
- **Random values** (`key={Math.random()}`) — a new key every render destroys and recreates every item.

Use ids from your data. If items don't have ids, generate them when the data is **created** (e.g. `crypto.randomUUID()`), not during render.

Keys go on the outermost element returned by `map`. For multiple elements per item, use a keyed Fragment:

```tsx
{faqs.map((faq) => (
  <Fragment key={faq.id}>
    <dt>{faq.question}</dt>
    <dd>{faq.answer}</dd>
  </Fragment>
))}
```

## Resetting state with a key

Changing a component's `key` makes React treat it as a brand-new component, discarding its state — a handy way to reset a form when switching records:

```tsx
<EditProfileForm key={selectedUser.id} user={selectedUser} />
```

## Try it yourself

Build a filterable order history: show a spinner while `loading`, an error message on failure, an empty state when there are no orders, and otherwise a table of orders with a status badge from a lookup object. Add buttons to filter by status and sort by date, and give each row a stable key.
