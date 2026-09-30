This lesson collects patterns that experienced TypeScript developers use to make illegal states unrepresentable and APIs impossible to misuse.

## Branded (nominal) types

TypeScript is structural, so two `string` aliases are interchangeable — which lets bugs through:

```ts
type UserId = string
type OrderId = string

function cancelOrder(id: OrderId) { /* … */ }
const userId: UserId = 'u-1'
cancelOrder(userId) // compiles — oops
```

A **brand** adds a phantom property that exists only in the type system:

```ts
type Brand<T, B extends string> = T & { readonly __brand: B }

type UserId = Brand<string, 'UserId'>
type OrderId = Brand<string, 'OrderId'>

const asOrderId = (id: string) => id as OrderId   // the only way to create one

function cancelOrder(id: OrderId) { /* … */ }
cancelOrder(asOrderId('o-9'))      // OK
cancelOrder('o-9')                 // Error
cancelOrder(userId as UserId)      // Error — different brand
```

Brands are also great for **validated values**: `Email`, `PositiveInt`, `SanitizedHtml`. Create them only in a function that performs the validation, and the type guarantees it happened.

```ts
type Email = Brand<string, 'Email'>

function parseEmail(input: string): Email {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) throw new Error('Invalid email')
  return input.toLowerCase() as Email
}

function sendWelcome(to: Email) { /* … */ }  // can't be called with an unchecked string
```

## Making illegal states unrepresentable

Replace combinations of optional fields with discriminated unions:

```ts
// Allows nonsense: { loading: false, data: undefined, error: undefined }
type Bad = { loading: boolean; data?: User; error?: string }

// Only valid states exist
type Good =
  | { state: 'loading' }
  | { state: 'loaded'; data: User }
  | { state: 'failed'; error: string }
```

Use tuple types for "at least one": `type NonEmpty<T> = [T, ...T[]]`.

```ts
function average(values: NonEmpty<number>) {
  return values.reduce((a, b) => a + b) / values.length // no empty-array division
}
average([])        // Error
average([4, 8])    // OK
```

## The Result pattern

Encode failure in the return type instead of throwing, so callers *must* handle it:

```ts
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

function divide(a: number, b: number): Result<number> {
  return b === 0 ? err('Division by zero') : ok(a / b)
}

const r = divide(10, 2)
if (r.ok) console.log(r.value)
else console.error(r.error)
```

Use it for expected failures (validation, "not found"); keep exceptions for truly exceptional situations.

## Type-safe builders

A builder whose type tracks which steps have been completed:

```ts
type QueryState = { table?: string; where?: string }

class Query<S extends QueryState = {}> {
  private constructor(private state: S) {}
  static create() { return new Query({}) }

  from<T extends string>(table: T) {
    return new Query({ ...this.state, table })
  }

  where(clause: string) {
    return new Query({ ...this.state, where: clause })
  }

  // Only callable once `from` has been called
  build(this: Query<{ table: string } & QueryState>) {
    const { table, where } = this.state
    return `SELECT * FROM ${table}${where ? ` WHERE ${where}` : ''}`
  }
}

Query.create().from('users').where('age > 18').build() // OK
Query.create().where('age > 18').build()               // Error: 'from' missing
```

## Exhaustive handling with `satisfies` and records

Map every variant of a union to a handler; adding a variant forces an update:

```ts
type Status = 'draft' | 'review' | 'published'

const statusLabel = {
  draft: 'Draft',
  review: 'In review',
  published: 'Live',
} satisfies Record<Status, string>
```

## Variance in one paragraph

Function **parameters** are checked *contravariantly* under `strictFunctionTypes`: a handler for `Animal` can be used where a handler for `Dog` is expected, but not the other way round. Return types are *covariant*. Method-style signatures (`method(x: T): void` in an interface) are checked bivariantly for compatibility with older code, which is why property-style function types (`method: (x: T) => void`) are slightly safer. Library authors can annotate generic parameters with `in` / `out` to document and enforce variance.

## Typing overloaded APIs with generics and maps

Instead of many overloads, use a map type:

```ts
interface ElementMap {
  input: HTMLInputElement
  button: HTMLButtonElement
  canvas: HTMLCanvasElement
}

function create<K extends keyof ElementMap>(tag: K): ElementMap[K] {
  return document.createElement(tag) as ElementMap[K]
}

create('canvas').getContext('2d') // HTMLCanvasElement
```

This is exactly how the DOM's own `createElement` is typed (via `HTMLElementTagNameMap`).

## Try it yourself

1. Create branded `Paise` and `Rupees` number types with conversion functions, and a `total(items: { price: Paise }[])` that rejects rupee values.
2. Refactor a function that throws on validation errors to return a `Result`.
3. Model a checkout wizard as a discriminated union where each step carries only the data collected so far.
