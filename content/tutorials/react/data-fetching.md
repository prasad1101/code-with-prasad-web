Fetching data in `useEffect` works for simple cases, but real apps need caching, deduplication, loading and error states, retries, background refetching, pagination and cache invalidation after mutations. **TanStack Query** (formerly React Query) handles all of this and has become the standard way to manage **server state** in React.

## Setup

```bash
npm install @tanstack/react-query
```

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000 }, // data is fresh for 30 s
  },
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
)
```

## Queries

```tsx
import { useQuery } from '@tanstack/react-query'

type Product = { id: string; name: string; price: number }

async function fetchProducts(category: string): Promise<Product[]> {
  const res = await fetch(`/api/products?category=${encodeURIComponent(category)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function ProductList({ category }: { category: string }) {
  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: ['products', category],
    queryFn: () => fetchProducts(category),
  })

  if (isPending) return <p>Loading…</p>
  if (isError) return <p role="alert">Error: {error.message}</p>

  return (
    <>
      {isFetching && <small>Refreshing…</small>}
      <ul>{data.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
    </>
  )
}
```

- **`queryKey`** identifies the data in the cache. Include every variable the query depends on (`['products', category]`); when it changes, TanStack Query fetches the new data.
- **`queryFn`** fetches the data and must throw on errors (`fetch` doesn't throw on HTTP errors by itself).
- Components using the same key share one request and one cache entry.

## Caching behaviour

- **`staleTime`** — how long data is considered fresh. Fresh data is served from cache without refetching.
- **`gcTime`** — how long unused data stays in memory (default 5 minutes).
- Stale data is refetched in the background when a component mounts, the window regains focus, or the network reconnects — users see cached data instantly while it updates.
- Failed queries are retried (3 times with exponential backoff by default).

## Mutations

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function AddProductForm() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (product: Omit<Product, 'id'>) =>
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      }).then((r) => {
        if (!r.ok) throw new Error('Could not create product')
        return r.json() as Promise<Product>
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] }) // refetch every products list
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        mutation.mutate({ name: String(data.get('name')), price: Number(data.get('price')) })
      }}
    >
      <input name="name" required />
      <input name="price" type="number" required />
      <button disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Add product'}</button>
      {mutation.isError && <p role="alert">{mutation.error.message}</p>}
    </form>
  )
}
```

`invalidateQueries({ queryKey: ['products'] })` matches every key starting with `'products'`, so all filtered lists refresh.

### Optimistic updates

```tsx
useMutation({
  mutationFn: toggleFavourite,
  onMutate: async (productId: string) => {
    await queryClient.cancelQueries({ queryKey: ['favourites'] })
    const previous = queryClient.getQueryData<string[]>(['favourites'])
    queryClient.setQueryData<string[]>(['favourites'], (old = []) =>
      old.includes(productId) ? old.filter((id) => id !== productId) : [...old, productId],
    )
    return { previous }
  },
  onError: (_err, _id, context) => queryClient.setQueryData(['favourites'], context?.previous), // roll back
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['favourites'] }),
})
```

## Organising queries

Keep keys and fetchers together with `queryOptions`, so they're reusable and type-safe:

```ts
import { queryOptions } from '@tanstack/react-query'

export const productQueries = {
  list: (category: string) =>
    queryOptions({ queryKey: ['products', 'list', category], queryFn: () => fetchProducts(category) }),
  detail: (id: string) =>
    queryOptions({ queryKey: ['products', 'detail', id], queryFn: () => fetchProduct(id), staleTime: 60_000 }),
}

const { data } = useQuery(productQueries.detail(productId))
queryClient.prefetchQuery(productQueries.detail(nextId)) // e.g. on hover
```

## Pagination and infinite scrolling

```tsx
const { data } = useQuery({
  queryKey: ['orders', page],
  queryFn: () => fetchOrders(page),
  placeholderData: (previous) => previous, // keep showing the old page while the next loads
})

const feed = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => fetchFeed(pageParam),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})
// feed.fetchNextPage(), feed.hasNextPage, feed.data.pages
```

## Suspense mode

`useSuspenseQuery` suspends while loading, so loading states are handled by `<Suspense>` boundaries and errors by error boundaries (see the Suspense lesson). `data` is then always defined.

## Server state vs. client state

TanStack Query manages **server state** — data owned by the server that can become stale. Keep **client state** (open modals, form drafts, theme) in React state or a client store. Mixing them (copying query data into Redux) creates duplicated, stale data.

## Devtools

`@tanstack/react-query-devtools` shows every query, its status, data and freshness — invaluable for debugging caching.

## Try it yourself

Build a product admin page: a paginated list query keyed by page and category, a detail query prefetched on hover, a create mutation that invalidates lists, an optimistic "toggle featured" mutation with rollback, and infinite scrolling for an activity feed.
