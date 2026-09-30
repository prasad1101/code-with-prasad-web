React is fast by default, but large apps can suffer from components re-rendering far more than needed, heavy calculations during render, and big JavaScript bundles. This lesson explains why components re-render and the tools to fix slow ones — including the **React Compiler**, which automates most memoisation.

## Why components re-render

A component re-renders when:

1. Its **state** changes,
2. Its **parent** re-renders (by default, children re-render too — even if their props didn't change), or
3. A **context** it reads changes.

Re-rendering isn't a problem in itself — it's usually cheap. It becomes a problem when expensive components re-render often, e.g. a 1,000-row table re-rendering on every keystroke in a search box above it.

## Measure first

Use the **React DevTools Profiler**: record an interaction and see which components rendered, why ("props changed", "hook changed", "parent rendered") and how long they took. Enable "Highlight updates when components render" to spot excessive re-renders visually. Optimise what the profiler shows, not what you guess.

## The React Compiler

The **React Compiler** is a build-time tool that automatically memoises components and values, so they only re-render and recompute when their inputs actually change. With it enabled, most manual `memo`, `useMemo` and `useCallback` usage becomes unnecessary.

Enable it with the Babel plugin (for Vite, via the React plugin's Babel options):

```ts
// vite.config.ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react({ babel: { plugins: ['babel-plugin-react-compiler'] } })],
})
```

The compiler relies on your code following the **Rules of React** (pure components, no mutation of props/state, hooks at the top level). The `eslint-plugin-react-hooks` recommended rules flag code it can't optimise. Frameworks like Next.js and Expo offer it as a configuration option.

## Manual memoisation (without the compiler, or for fine control)

### `memo`: skip re-rendering when props are unchanged

```tsx
import { memo } from 'react'

const ProductRow = memo(function ProductRow({ product, onAdd }: { product: Product; onAdd: (id: string) => void }) {
  return (
    <tr>
      <td>{product.name}</td>
      <td><button onClick={() => onAdd(product.id)}>Add</button></td>
    </tr>
  )
})
```

`memo` compares props shallowly. It only helps if the props really are stable between renders.

### `useCallback`: stable function references

A new function is created on every render, which breaks `memo`:

```tsx
function ProductTable({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<string[]>([])

  // Same function identity across renders, so memoised rows don't re-render
  const handleAdd = useCallback((id: string) => setCart((c) => [...c, id]), [])

  return (
    <table>
      <tbody>{products.map((p) => <ProductRow key={p.id} product={p} onAdd={handleAdd} />)}</tbody>
    </table>
  )
}
```

### `useMemo`: cache expensive calculations

```tsx
const filtered = useMemo(
  () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).toSorted(byPrice),
  [products, query],
)
```

Only memoise calculations that are measurably expensive (e.g. > 1 ms for large lists) or values passed to memoised children/effects. Memoising everything adds complexity for little gain.

## Structural fixes (often better than memoisation)

### Move state down

```tsx
// ✗ typing re-renders the whole page, including the huge table
function Page() {
  const [query, setQuery] = useState('')
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <HugeTable />
    </>
  )
}

// ✓ state lives in a small component; HugeTable doesn't re-render
function SearchInput() {
  const [query, setQuery] = useState('')
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

### Pass components as children

A component passed as `children` isn't re-rendered when the wrapper's state changes, because it was created by the parent:

```tsx
function ScrollTracker({ children }: { children: React.ReactNode }) {
  const [y, setY] = useState(0)
  // …update y on scroll…
  return <div data-scroll={y}>{children}</div>   // children don't re-render on scroll
}
```

### Keep context values narrow

Split fast- and slow-changing context, and memoise provider values (see the context lesson).

## Long lists: virtualisation

Rendering 10,000 rows creates 10,000 DOM nodes. **Virtualisation** renders only the visible rows:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function OrderList({ orders }: { orders: Order[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  })

  return (
    <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div key={row.key} style={{ position: 'absolute', top: 0, transform: `translateY(${row.start}px)`, height: row.size }}>
            {orders[row.index].number}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Keeping typing responsive

`useDeferredValue` lets React render an urgent update (the input) first and the expensive part (results) afterwards, without debounce timers:

```tsx
const [query, setQuery] = useState('')
const deferredQuery = useDeferredValue(query)
// <input value={query} …/>  <Results query={deferredQuery} />  (Results memoised)
```

See the transitions lesson for details.

## Loading performance

- **Code-split** routes and heavy components with `lazy` and `Suspense` (next lesson).
- Audit bundles (`vite-bundle-visualizer`, `source-map-explorer`); replace heavy dependencies.
- Optimise images (modern formats, correct sizes, `loading="lazy"`, width/height to prevent layout shift).
- Server rendering or static generation for content-heavy pages (expert chapter).

## Checklist

- [ ] Profile with React DevTools before optimising
- [ ] React Compiler enabled and lint rules passing
- [ ] State kept as low in the tree as possible
- [ ] Stable, unique `key`s in lists; virtualisation for long lists
- [ ] Expensive calculations memoised (or compiler-optimised)
- [ ] Context values narrow and memoised
- [ ] Routes and heavy widgets code-split

## Try it yourself

Build a page with a search box and a 5,000-row product table. Profile typing, then fix it three ways and compare: moving state down, `memo` + `useCallback` + `useMemo`, and the React Compiler. Finally, add virtualisation and measure again.
