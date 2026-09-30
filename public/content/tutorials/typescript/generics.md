**Generics** let you write functions, types and classes that work with many types while keeping full type information. They're how `Array<T>`, `Promise<T>`, `Map<K, V>` and most library APIs are typed.

## The problem generics solve

```ts
function firstAny(items: any[]): any {
  return items[0]
}
const n = firstAny([1, 2, 3]) // any — type information lost
```

```ts
function first<T>(items: T[]): T | undefined {
  return items[0]
}

const n = first([1, 2, 3])        // number | undefined
const s = first(['a', 'b'])       // string | undefined
```

`T` is a **type parameter** — a placeholder filled in at each call. Usually TypeScript **infers** it from the arguments; you can also pass it explicitly: `first<string>([])`.

## Multiple type parameters

```ts
function pair<K, V>(key: K, value: V): [K, V] {
  return [key, value]
}

function mapValues<T, U>(obj: Record<string, T>, fn: (value: T) => U): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]))
}

const lengths = mapValues({ a: 'one', b: 'three' }, (s) => s.length) // Record<string, number>
```

## Constraints with `extends`

Restrict what a type parameter can be:

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b
}

longest('hello', 'hi')      // string
longest([1, 2], [1, 2, 3])  // number[]
longest(10, 20)             // Error: number has no 'length'
```

### `keyof` constraints

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { name: 'Asha', age: 28 }
getProp(user, 'name')  // string
getProp(user, 'age')   // number
getProp(user, 'email') // Error: '"email"' is not assignable to '"name" | "age"'
```

`T[K]` is an **indexed access type** — the type of property `K` on `T`.

## Generic types and interfaces

```ts
type ApiResponse<T> = {
  data: T
  error: string | null
  fetchedAt: Date
}

interface Page<T> {
  items: T[]
  total: number
  nextCursor?: string
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

const page = await fetchJson<Page<{ id: string; title: string }>>('/api/posts')
page.items[0].title // string
```

Note that `fetchJson<T>` *asserts* the type — nothing checks the JSON at runtime. See the runtime-validation lesson for making this safe.

## Default type parameters

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

function tryParse(json: string): Result<unknown> {
  try {
    return { ok: true, value: JSON.parse(json) }
  } catch (e) {
    return { ok: false, error: e as Error }
  }
}
```

## Generic classes

```ts
class TypedEventEmitter<Events extends Record<string, unknown>> {
  private handlers: { [E in keyof Events]?: ((payload: Events[E]) => void)[] } = {}

  on<E extends keyof Events>(event: E, handler: (payload: Events[E]) => void) {
    ;(this.handlers[event] ??= []).push(handler)
  }

  emit<E extends keyof Events>(event: E, payload: Events[E]) {
    this.handlers[event]?.forEach((h) => h(payload))
  }
}

type ShopEvents = {
  'cart:add': { productId: string; qty: number }
  'order:placed': { orderId: string }
}

const bus = new TypedEventEmitter<ShopEvents>()
bus.on('cart:add', (p) => console.log(p.qty))         // p is typed
bus.emit('order:placed', { orderId: 'o-1' })
bus.emit('order:placed', { id: 'o-1' })               // Error
```

## Generic React/Angular patterns

```tsx
type ListProps<T> = {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  getKey: (item: T) => string
}

function List<T>({ items, renderItem, getKey }: ListProps<T>) {
  return <ul>{items.map((i) => <li key={getKey(i)}>{renderItem(i)}</li>)}</ul>
}
```

## Guidelines

- **Use a type parameter only if it relates two or more things** (an input to an output, two inputs). `function log<T>(x: T): void` gains nothing over `(x: unknown)`.
- Prefer inference; pass explicit type arguments only when inference can't work.
- Keep constraints as loose as possible and as tight as necessary.
- Name parameters meaningfully when there are several: `TKey`, `TValue`, `TEvent`.

## Try it yourself

1. Write `groupBy<T, K extends string>(items: T[], getKey: (item: T) => K): Record<K, T[]>`.
2. Write a generic `Stack<T>` class with `push`, `pop` and `peek`.
3. Write `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`.
