**Suspense** lets components declare that they're "waiting" for something — code, data — while React shows a fallback. Combined with `lazy` and the `use` hook, it gives you declarative loading states and smaller initial bundles.

## Code splitting with `lazy`

By default, the bundler puts all your code in one bundle. `lazy` loads a component's code only when it's first rendered:

```tsx
import { lazy, Suspense, useState } from 'react'

const ChartPanel = lazy(() => import('./ChartPanel'))   // ChartPanel.tsx must have a default export

function Dashboard() {
  const [showChart, setShowChart] = useState(false)
  return (
    <>
      <button onClick={() => setShowChart(true)}>Show sales chart</button>
      {showChart && (
        <Suspense fallback={<p>Loading chart…</p>}>
          <ChartPanel />
        </Suspense>
      )}
    </>
  )
}
```

The chart library (often hundreds of KB) is downloaded only when needed. For named exports:

```tsx
const ChartPanel = lazy(() => import('./charts').then((m) => ({ default: m.ChartPanel })))
```

### Route-level splitting

Splitting by route gives the biggest wins — each page's code loads on navigation. React Router's `lazy` route property (routing lesson) or `lazy` components per route both work.

## Suspense boundaries

`<Suspense>` shows its `fallback` while **any** component inside it is suspended:

```tsx
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<ChartSkeleton />}>
    <SalesChart />
  </Suspense>
  <Suspense fallback={<TableSkeleton />}>
    <RecentOrders />
  </Suspense>
</Suspense>
```

Nesting boundaries controls the loading experience: independent sections can appear as soon as their own data is ready, instead of the whole page waiting for the slowest part. Design boundaries around meaningful UI regions — too many spinners feel jumpy; too few make everything wait.

## Suspending on data with `use`

`use(promise)` reads the result of a promise, suspending until it resolves:

```tsx
import { Suspense, use } from 'react'

function OrderDetails({ orderPromise }: { orderPromise: Promise<Order> }) {
  const order = use(orderPromise)       // suspends until resolved; throws to an error boundary if rejected
  return <h2>Order {order.number} — {order.status}</h2>
}

function OrderPage({ orderId }: { orderId: string }) {
  const [orderPromise] = useState(() => fetchOrder(orderId))  // create the promise once, not on every render
  return (
    <Suspense fallback={<p>Loading order…</p>}>
      <OrderDetails orderPromise={orderPromise} />
    </Suspense>
  )
}
```

Important: the promise must be **stable** — creating a new promise on every render would suspend forever. In practice, promises come from a cache: a framework loader, Server Components, or a library like TanStack Query (`useSuspenseQuery`), which handle caching for you.

```tsx
function ProductReviews({ productId }: { productId: string }) {
  const { data } = useSuspenseQuery(reviewQueries.forProduct(productId))  // data is always defined
  return <ReviewList reviews={data} />
}
```

## Error boundaries

Suspense handles *waiting*; **error boundaries** handle *failure*. An error boundary catches errors thrown during rendering (including rejected promises read with `use`) in its subtree and renders a fallback. They're still written as class components — or use the `react-error-boundary` package:

```tsx
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <div role="alert">
      <p>Couldn't load reviews: {error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )}
>
  <Suspense fallback={<ReviewsSkeleton />}>
    <ProductReviews productId={id} />
  </Suspense>
</ErrorBoundary>
```

Pair each meaningful Suspense boundary with an error boundary, so one failing widget doesn't take down the whole page. Error boundaries don't catch errors in event handlers or async code outside rendering — handle those with `try/catch`.

## Avoiding fallback flashes with transitions

When content that's already on screen would suspend again (e.g. switching tabs), React would hide it behind the fallback. Wrapping the update in a **transition** keeps the old UI visible until the new content is ready:

```tsx
const [tab, setTab] = useState('overview')
const [isPending, startTransition] = useTransition()

<button onClick={() => startTransition(() => setTab('reviews'))}>Reviews</button>
<div style={{ opacity: isPending ? 0.6 : 1 }}>
  <Suspense fallback={<Spinner />}>{tab === 'reviews' ? <Reviews /> : <Overview />}</Suspense>
</div>
```

## Preloading

Start loading before the user needs it:

```tsx
const loadChart = () => import('./ChartPanel')
const ChartPanel = lazy(loadChart)

<button onMouseEnter={loadChart} onFocus={loadChart} onClick={() => setShowChart(true)}>Show chart</button>
```

## Try it yourself

Build a dashboard with three independently loading widgets (stats, a lazy-loaded chart, recent orders via `useSuspenseQuery`), each with its own skeleton fallback and error boundary with a retry button. Add a tab switcher that uses a transition so the current tab stays visible while the next one loads.
