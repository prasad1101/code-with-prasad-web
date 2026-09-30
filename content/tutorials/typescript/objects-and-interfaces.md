Most data in an application is objects: users, orders, API responses. TypeScript describes object shapes with **type aliases** and **interfaces**.

## Object types

```ts
type User = {
  id: number
  name: string
  email?: string            // optional
  readonly createdAt: Date  // can't be reassigned
}

const user: User = { id: 1, name: 'Asha', createdAt: new Date() }
user.createdAt = new Date() // Error: read-only
```

TypeScript is **structural**: any object with the right shape is compatible, regardless of what it's called or how it was created.

## Interfaces

```ts
interface Product {
  id: string
  title: string
  price: number
}

interface DigitalProduct extends Product {
  downloadUrl: string
}
```

### `type` vs. `interface`

Both describe object shapes and are mostly interchangeable. Differences:

| | `interface` | `type` |
| --- | --- | --- |
| Object shapes | Yes | Yes |
| Unions, tuples, primitives, mapped/conditional types | No | Yes |
| Extending | `extends` | Intersections (`&`) |
| Declaration merging (re-opening) | Yes | No |

A common convention: use `interface` for object shapes that others may extend (public APIs, class contracts), and `type` for everything else. Consistency within a code base matters more than the choice.

**Declaration merging** lets you add to an existing interface — used to extend library types:

```ts
// Add a property to Express's Request type
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string }
    }
  }
}
```

## Intersections

`&` combines types:

```ts
type Timestamps = { createdAt: Date; updatedAt: Date }
type Post = { title: string; body: string } & Timestamps
```

## Index signatures

For objects used as dictionaries with unknown keys:

```ts
type Scores = { [studentName: string]: number }
const scores: Scores = { asha: 91, ravi: 78 }

// Record is the idiomatic shorthand
const visits: Record<string, number> = {}
```

With `noUncheckedIndexedAccess` enabled (recommended), reading `scores['meera']` has type `number | undefined`, forcing you to handle missing keys.

## Excess property checks

Object **literals** are checked for unknown properties — this catches typos:

```ts
const p: Product = { id: '1', title: 'Pen', price: 10, colour: 'blue' }
// Error: Object literal may only specify known properties
```

Variables that aren't fresh literals are only checked structurally (extra properties allowed), so this check only applies at the point of creation.

## Nested and reusable types

```ts
type Address = { street: string; city: string; pincode: string }

type Customer = {
  id: string
  name: string
  addresses: Address[]
  preferences: {
    newsletter: boolean
    language: 'en' | 'hi' | 'mr'
  }
}
```

Extract nested shapes into named types once they're reused.

## Methods in types

```ts
interface Repository<T> {
  findById(id: string): Promise<T | null>
  save(entity: T): Promise<void>
  delete: (id: string) => Promise<boolean>   // property holding a function
}
```

## `readonly` arrays and objects

```ts
function average(values: readonly number[]) {
  values.push(1) // Error — the function promises not to modify its input
  return values.reduce((a, b) => a + b, 0) / values.length
}
```

`Readonly<T>` makes every property of `T` read-only (shallowly).

## Optional chaining with types

```ts
function cityOf(customer?: Customer) {
  return customer?.addresses[0]?.city ?? 'Unknown' // type: string
}
```

## Try it yourself

1. Model an `Order` with an id, a customer, line items (product + quantity), a status (`'pending' | 'paid' | 'shipped'`) and optional `shippedAt`.
2. Write `orderTotal(order: Order): number`.
3. Use declaration merging to add a `theme` property to an interface you defined in another file.
