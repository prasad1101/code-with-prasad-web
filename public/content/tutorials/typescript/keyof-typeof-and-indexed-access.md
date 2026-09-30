Three operators let you **derive types from other types and from values**: `keyof`, `typeof` and indexed access (`T[K]`). They're the foundation of every advanced TypeScript pattern.

## `keyof`

`keyof T` produces a union of `T`'s property names:

```ts
interface Product {
  id: string
  title: string
  price: number
}

type ProductKey = keyof Product // 'id' | 'title' | 'price'

function sortBy(items: Product[], key: keyof Product) {
  return [...items].sort((a, b) => (a[key] < b[key] ? -1 : 1))
}

sortBy(products, 'price')   // OK
sortBy(products, 'colour')  // Error
```

For types with index signatures, `keyof` gives the index type: `keyof Record<string, number>` is `string` (in fact `string | number`, since numeric keys are allowed too).

## `typeof` (in type positions)

In a type position, `typeof` gets the type of a **value**:

```ts
const defaultSettings = {
  theme: 'dark',
  fontSize: 16,
  notifications: { email: true, push: false },
}

type Settings = typeof defaultSettings
// { theme: string; fontSize: number; notifications: { email: boolean; push: boolean } }

function saveSettings(s: Settings) { /* … */ }
```

This makes the runtime object the single source of truth. Combined with `as const`, you get literal types:

```ts
const SIZES = ['sm', 'md', 'lg'] as const
type Size = (typeof SIZES)[number] // 'sm' | 'md' | 'lg'
```

`typeof` also works on functions and modules:

```ts
import * as api from './api'
type Api = typeof api
type LoadUser = typeof api.loadUser
```

## Indexed access types

`T[K]` looks up the type of a property:

```ts
type Price = Product['price']                 // number
type IdOrTitle = Product['id' | 'title']      // string

interface ApiResponse {
  data: { users: { id: string; profile: { city: string } }[] }
}
type ApiUser = ApiResponse['data']['users'][number]   // element type of the array
type City = ApiUser['profile']['city']                // string
```

`[number]` extracts an array's element type — useful for types you don't control, like generated API clients.

## Putting them together: type-safe helpers

A type-safe `get`:

```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}
```

A type-safe event map:

```ts
const handlers = {
  login: (user: { id: string }) => {},
  logout: () => {},
  purchase: (order: { id: string; total: number }) => {},
}

type EventName = keyof typeof handlers
type PayloadOf<E extends EventName> = Parameters<(typeof handlers)[E]>[0]

function emit<E extends EventName>(event: E, ...args: Parameters<(typeof handlers)[E]>) {
  ;(handlers[event] as (...a: unknown[]) => void)(...args)
}

emit('purchase', { id: 'o-1', total: 499 })
emit('logout')
emit('login')          // Error: expected 1 argument
```

## `keyof` with generics: building lookup tables

```ts
function indexBy<T, K extends keyof T>(items: T[], key: K): Map<T[K], T> {
  return new Map(items.map((item) => [item[key], item]))
}

const byId = indexBy(products, 'id') // Map<string, Product>
```

## Common pitfall: `Object.keys`

`Object.keys(obj)` returns `string[]`, not `(keyof T)[]`, because objects can have extra properties at runtime that the type doesn't mention. When you're sure the object has exactly the known keys, cast deliberately:

```ts
const keys = Object.keys(defaultSettings) as (keyof Settings)[]
```

## Try it yourself

1. Given a `const ROUTES = { home: '/', blog: '/blog', about: '/about' } as const`, derive `RouteName` and `RoutePath` types.
2. Write `pluck<T, K extends keyof T>(items: T[], key: K): T[K][]`.
3. From a deeply nested API response interface, extract the type of a single nested array element using indexed access.
