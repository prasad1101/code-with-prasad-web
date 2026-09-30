React apps are built by **composing components**: small functions that each render part of the UI. **Props** are how a parent passes data to a child — like arguments to a function.

## Defining and using components

```tsx
type Product = { id: string; name: string; price: number; imageUrl: string }

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p>₹{product.price}</p>
    </article>
  )
}

export default function Catalogue() {
  const featured: Product = { id: 'p1', name: 'Wireless Mouse', price: 799, imageUrl: '/img/mouse.webp' }
  return (
    <section>
      <h2>Featured</h2>
      <ProductCard product={featured} />
    </section>
  )
}
```

Component names must start with a **capital letter** — `<productCard />` would be treated as an HTML tag.

## Props

Props are passed like HTML attributes and received as a single object, usually destructured:

```tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}

function Button({ variant = 'primary', size = 'md', disabled = false, onClick, children }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}

<Button variant="secondary" onClick={() => console.log('saved')}>Save</Button>
```

- String props can use quotes: `variant="secondary"`; everything else uses braces: `disabled={true}` (or just `disabled`).
- Default values come from destructuring defaults.
- **Props are read-only.** A component must never modify its props; to change something, the parent passes new props.

## `children`

Whatever you put between a component's tags arrives as the `children` prop — the key to reusable layout components:

```tsx
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="card-body">{children}</div>
    </section>
  )
}

<Card title="Order summary">
  <p>3 items</p>
  <strong>Total: ₹2,697</strong>
</Card>
```

You can also pass components or elements through other props ("slots"):

```tsx
function Layout({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="layout">
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  )
}

<Layout sidebar={<Filters />}><ProductGrid /></Layout>
```

## Spreading props

```tsx
function TextInput({ label, ...inputProps }: { label: string } & React.ComponentProps<'input'>) {
  return (
    <label>
      {label}
      <input {...inputProps} />
    </label>
  )
}

<TextInput label="Email" type="email" name="email" required autoComplete="email" />
```

`React.ComponentProps<'input'>` gives you every valid `<input>` attribute, so the wrapper stays flexible. Use spreading deliberately — passing everything through can hide which props a component really supports.

## Components are pure functions

Given the same props, a component should return the same JSX, and rendering shouldn't change anything outside the component:

```tsx
let renderCount = 0
function Bad() {
  renderCount++            // ✗ side effect during render
  return <p>{renderCount}</p>
}
```

Side effects (fetching data, timers, DOM changes) belong in event handlers or effects.

## Splitting components

Extract a component when a piece of UI:

- is repeated (product cards, list rows),
- has its own purpose you can name (`CheckoutSummary`),
- or makes the parent too long to read.

Keep each component in its own file once it's used in more than one place.

## Try it yourself

Build an `Avatar` (image with fallback initials), a `UserCard` that uses `Avatar` plus name and role, and a `Panel` layout component with a `title` prop, `children`, and an optional `actions` slot rendered in the header. Render three users inside a `Panel`.
