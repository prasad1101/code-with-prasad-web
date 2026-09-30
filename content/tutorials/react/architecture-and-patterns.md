React gives you building blocks, not an architecture. As a codebase and team grow, consistent structure and patterns matter more than any single API. This lesson collects the patterns used in large, maintainable React applications.

## Feature-based folder structure

Organise by **feature**, not by file type:

```text
src/
  app/                    # app shell: providers, router, layouts, global styles
  features/
    catalogue/
      api/                # query options, fetchers, schemas
      components/         # feature components
      hooks/
      routes/             # route components (pages)
      index.ts            # public API of the feature
    cart/
    checkout/
    account/
  shared/
    ui/                   # design-system components: Button, Dialog, Table
    hooks/                # generic hooks: useDebouncedValue, useMediaQuery
    lib/                  # utilities, API client, formatting
```

Rules that keep it healthy:

- Features import from `shared/` and from other features only through their `index.ts` public API.
- `shared/` never imports from `features/`.
- Enforce the rules with ESLint (`import/no-restricted-paths` or boundaries plugins).

## Separate data, logic and presentation

```tsx
// features/catalogue/api/queries.ts — data access
export const productQueries = {
  list: (filters: ProductFilters) =>
    queryOptions({ queryKey: ['products', filters], queryFn: () => api.getProducts(filters) }),
}

// features/catalogue/hooks/useProductFilters.ts — logic
export function useProductFilters() {
  const [params, setParams] = useSearchParams()
  const filters = { category: params.get('category') ?? undefined, page: Number(params.get('page') ?? 1) }
  const setCategory = (category: string) => setParams({ category, page: '1' })
  return { filters, setCategory }
}

// features/catalogue/components/ProductGrid.tsx — presentation (props in, events out)
export function ProductGrid({ products, onAddToCart }: { products: Product[]; onAddToCart: (id: string) => void }) {
  return <div className="grid">{products.map((p) => <ProductCard key={p.id} product={p} onAdd={onAddToCart} />)}</div>
}

// features/catalogue/routes/CataloguePage.tsx — composition
export function CataloguePage() {
  const { filters, setCategory } = useProductFilters()
  const { data = [] } = useQuery(productQueries.list(filters))
  const add = useCartStore((s) => s.add)
  return (
    <>
      <CategoryFilter value={filters.category} onChange={setCategory} />
      <ProductGrid products={data} onAddToCart={(id) => add(data.find((p) => p.id === id)!)} />
    </>
  )
}
```

Presentational components are easy to test, reuse and showcase in Storybook; hooks hold logic you can unit test; data access is centralised.

## Reusable component patterns

### Composition with `children` and slots

Prefer composable APIs over many configuration props:

```tsx
<Card>
  <Card.Header>Order #1024</Card.Header>
  <Card.Body>…</Card.Body>
  <Card.Footer><Button>Track</Button></Card.Footer>
</Card>
```

### Compound components

Components that share implicit state through context (`Tabs`, `Accordion`, `Menu`) — see the context lesson.

### Headless components and hooks

Separate behaviour from markup: a `useCombobox()` hook (or a headless library like Radix UI, React Aria or Headless UI) provides state, keyboard handling and ARIA attributes; you supply the styling. This gives accessibility without fighting a component library's design.

### Polymorphic components

Components that render as different elements (`<Button as="a" href="…">`) — type them with discriminated unions (see the TypeScript lesson).

## Error handling strategy

- **Error boundaries** at route level and around independent widgets, with retry buttons.
- API errors normalised in one API client (consistent error shape, auth redirects).
- Mutations show inline errors; queries show error states with retry.
- Unexpected errors reported to monitoring (Sentry etc.) with user and route context.

## Design system

A shared `ui` library built on accessible primitives, themed with CSS variables/design tokens, documented in Storybook, and tested (including accessibility checks). Consistency across screens comes from here — not from copy-pasting styles.

## API layer

- One configured client (base URL, auth headers, error normalisation, timeouts).
- Runtime validation of responses (Zod) at the boundary.
- Generated types/clients from OpenAPI where possible.
- All server state through TanStack Query (or framework loaders), with query-key conventions per feature.

## Performance by default

- Route-level code splitting; lazy-load heavy widgets.
- React Compiler enabled; state kept local.
- Virtualise long lists; optimise images.
- Budgets and Lighthouse CI in the pipeline.

## Quality gates

- TypeScript `strict`; ESLint with `react-hooks` rules; Prettier.
- Tests: unit (logic), component (RTL), a few E2E (Playwright).
- Pull-request checks: type-check, lint, test, build, bundle size.
- Architecture decision records for significant choices (state library, styling approach, rendering strategy).

## Micro frontends

Splitting a React app into independently deployed pieces (Module Federation) helps when many teams need independent release cycles. It adds significant complexity (shared dependencies, consistent UX, cross-app routing). A well-structured monorepo usually delivers most of the benefits first.

## Common anti-patterns

- **Prop drilling through 5+ levels** — restructure with composition, context or a store.
- **God components** of 800 lines — split by responsibility.
- **Effects for derived state** — compute during render.
- **Copying server data into global client state** — use a server-state cache.
- **`index` as `key`** for dynamic lists.
- **Business logic inside JSX** — move it to hooks or functions.

## Try it yourself

Take a React app you've built during this course and restructure it into features with public `index.ts` APIs, separate presentational components from data-fetching routes, add an ESLint rule preventing cross-feature deep imports, and document the structure in a short `ARCHITECTURE.md`.
