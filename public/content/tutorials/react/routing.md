React itself has no router. **React Router** is the most widely used routing library: it maps URLs to components, supports nested layouts, dynamic parameters, data loading, navigation and more. It can be used as a library (this lesson) or as a full-stack framework with server rendering (see the expert chapter).

## Installing

```bash
npm install react-router
```

(Everything, including the browser bindings, now comes from the single `react-router` package; older apps import from `react-router-dom`.)

## Defining routes

```tsx
// main.tsx
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import NotFound from './pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: 'products', Component: ProductList },
      { path: 'products/:productId', Component: ProductDetail },
      { path: '*', Component: NotFound },
    ],
  },
])

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)
```

## Layouts with `<Outlet>`

Parent routes render shared layout; child routes render into the `<Outlet />`:

```tsx
import { NavLink, Outlet } from 'react-router'

export default function RootLayout() {
  return (
    <>
      <header>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/products">Products</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}
```

`NavLink` adds an `active` class (and `aria-current="page"`) when its route matches. Use `Link` for ordinary links — never `<a href>` for internal navigation, which would reload the whole app.

## Route parameters

```tsx
import { useParams } from 'react-router'

export default function ProductDetail() {
  const { productId } = useParams()
  return <h1>Product {productId}</h1>
}
```

## Query strings

```tsx
import { useSearchParams } from 'react-router'

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') ?? 'all'

  return (
    <select
      value={category}
      onChange={(e) =>
        setSearchParams((prev) => {
          prev.set('category', e.target.value)
          prev.set('page', '1')
          return prev
        })
      }
    >
      <option value="all">All</option>
      <option value="books">Books</option>
    </select>
  )
}
```

Keeping filters, sorting and pagination in the URL makes them bookmarkable and shareable, and the back button works.

## Navigating in code

```tsx
import { useNavigate } from 'react-router'

function CheckoutButton() {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/checkout', { state: { from: 'cart' } })}>Checkout</button>
}
```

`navigate(-1)` goes back; `{ replace: true }` replaces the current history entry (useful after login).

## Loading data with loaders

React Router can load data **before** rendering a route, in parallel for nested routes, avoiding request waterfalls:

```tsx
import { useLoaderData, type LoaderFunctionArgs } from 'react-router'

async function productLoader({ params }: LoaderFunctionArgs) {
  const res = await fetch(`/api/products/${params.productId}`)
  if (res.status === 404) throw new Response('Not found', { status: 404 })
  return (await res.json()) as Product
}

function ProductDetail() {
  const product = useLoaderData<typeof productLoader>()
  return <h1>{product.name}</h1>
}

// route definition
{ path: 'products/:productId', Component: ProductDetail, loader: productLoader, ErrorBoundary: ProductError }
```

Use `useNavigation().state === 'loading'` to show a global progress bar during navigation. Errors thrown in loaders render the route's `ErrorBoundary` (read the error with `useRouteError()`).

## Protected routes

```tsx
import { Navigate, Outlet, useLocation } from 'react-router'

function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

// routes
{ Component: RequireAuth, children: [{ path: 'account', Component: Account }, { path: 'orders', Component: Orders }] }
```

A layout route without a `path` wraps its children without adding a URL segment. Remember: hiding routes is UX — the API must enforce access.

## Lazy loading routes

```tsx
{ path: 'admin', lazy: () => import('./pages/Admin').then((m) => ({ Component: m.default })) }
```

The admin code is downloaded only when the route is visited.

## Declarative mode

Simple apps can use JSX routes instead of the data router:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router'

<BrowserRouter>
  <Routes>
    <Route path="/" element={<RootLayout />}>
      <Route index element={<Home />} />
      <Route path="products/:productId" element={<ProductDetail />} />
    </Route>
  </Routes>
</BrowserRouter>
```

Loaders, actions and fetchers require the data router (`createBrowserRouter`).

## Hosting single-page apps

Browser routing needs the server to return `index.html` for unknown paths (a "SPA fallback"). On static hosts that can't do this (like GitHub Pages), use `createHashRouter` (URLs like `/#/products`) or a 404 redirect trick.

## Try it yourself

Build a small shop router: a root layout with navigation, a product list with category and page in the query string, a product detail route with a loader and an error boundary for 404s, a protected `/account` area using a layout route, and a lazily loaded `/admin` route.
