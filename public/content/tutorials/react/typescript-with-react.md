TypeScript and React are an excellent match: props become self-documenting, editors autocomplete component APIs, and whole classes of bugs (missing props, wrong event types, invalid states) are caught before the browser. This lesson collects the patterns you'll use daily. (See the TypeScript course for the language itself.)

## Typing props

```tsx
type ProductCardProps = {
  product: Product
  variant?: 'compact' | 'detailed'
  onAddToCart: (productId: string) => void
  children?: React.ReactNode
}

function ProductCard({ product, variant = 'detailed', onAddToCart, children }: ProductCardProps) {
  return (
    <article className={variant}>
      <h3>{product.name}</h3>
      {children}
      <button onClick={() => onAddToCart(product.id)}>Add</button>
    </article>
  )
}
```

- Use a `type` (or `interface`) per component; export it if other components need it.
- `React.ReactNode` accepts anything renderable: elements, strings, numbers, arrays, `null`.
- Prefer plain function declarations over `React.FC` — they're simpler and handle generics better.

## Extending native element props

```tsx
type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost'
  loading?: boolean
}

function Button({ variant = 'primary', loading = false, children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} disabled={disabled || loading} {...rest}>
      {loading ? 'Please wait…' : children}
    </button>
  )
}

<Button type="submit" onClick={handleSave} aria-describedby="save-hint">Save</Button>
```

`React.ComponentProps<'input'>`, `'a'`, `'select'` etc. include every valid attribute and event handler — and in React 19, `ref` too.

## Typing state

```tsx
const [count, setCount] = useState(0)                     // inferred: number
const [user, setUser] = useState<User | null>(null)        // explicit when starting empty
const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
```

### Modelling states with discriminated unions

```tsx
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

function Results({ state }: { state: RequestState<Product[]> }) {
  switch (state.status) {
    case 'idle': return <p>Search for something</p>
    case 'loading': return <Spinner />
    case 'error': return <p role="alert">{state.error}</p>
    case 'success': return <ProductList products={state.data} />
  }
}
```

Impossible combinations (data *and* error) can't be represented.

## Typing events

```tsx
function SearchForm({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSearch(q)
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setQ('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={q} onChange={handleChange} onKeyDown={handleKeyDown} />
    </form>
  )
}
```

Tip: write the handler inline first (`onChange={(e) => …}`), hover over `e` to see its type, then extract it.

## Refs

```tsx
const inputRef = useRef<HTMLInputElement>(null)           // DOM ref: current is HTMLInputElement | null
const timerRef = useRef<number | null>(null)              // mutable value ref
```

## Context

```tsx
type AuthContextValue = { user: User | null; login: (email: string) => Promise<void>; logout: () => void }
const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx                                               // narrowed to AuthContextValue
}
```

## Generic components

A list component that works with any item type, with full type safety for the render function:

```tsx
type ListProps<T> = {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  empty?: React.ReactNode
}

function List<T>({ items, getKey, renderItem, empty = <p>Nothing here</p> }: ListProps<T>) {
  if (items.length === 0) return <>{empty}</>
  return <ul>{items.map((item) => <li key={getKey(item)}>{renderItem(item)}</li>)}</ul>
}

<List items={orders} getKey={(o) => o.id} renderItem={(o) => <span>{o.number}</span>} />
// `o` is inferred as Order
```

## Props that depend on each other

Use unions to make invalid prop combinations impossible:

```tsx
type LinkButtonProps =
  | ({ as: 'link'; href: string } & Omit<React.ComponentProps<'a'>, 'href'>)
  | ({ as?: 'button' } & React.ComponentProps<'button'>)

function ActionButton(props: LinkButtonProps) {
  if (props.as === 'link') {
    const { as: _as, ...rest } = props
    return <a {...rest} />
  }
  const { as: _as, ...rest } = props
  return <button {...rest} />
}

<ActionButton as="link" href="/pricing">Pricing</ActionButton>
<ActionButton onClick={save}>Save</ActionButton>
<ActionButton as="link">Oops</ActionButton>     // Error: href is required
```

## Typing API data

Types describe what you *expect* — they don't check what the server actually sends. Validate external data at the boundary with a schema library (Zod) and infer the type from the schema:

```ts
const ProductSchema = z.object({ id: z.string(), name: z.string(), price: z.number() })
type Product = z.infer<typeof ProductSchema>

const fetchProduct = async (id: string) => ProductSchema.parse(await (await fetch(`/api/products/${id}`)).json())
```

## Useful built-in types

| Type | Use |
| --- | --- |
| `React.ReactNode` | Anything renderable (children, slots) |
| `React.ReactElement` | A JSX element specifically |
| `React.ComponentProps<typeof X>` | The props of an existing component |
| `React.ComponentProps<'div'>` | All props of an HTML element |
| `React.CSSProperties` | Inline style objects |
| `React.Dispatch<React.SetStateAction<T>>` | The type of a `useState` setter |

## Try it yourself

Type a `DataTable<T>` component with `columns: { key: keyof T; header: string; render?: (row: T) => React.ReactNode }[]`, `rows: T[]` and `onRowClick?: (row: T) => void`. Use it for orders and users, and confirm that a typo in a column key is a compile error.
