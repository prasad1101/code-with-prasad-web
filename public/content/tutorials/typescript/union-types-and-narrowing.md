**Union types** say "this value is one of several types". **Narrowing** is how TypeScript figures out which one you have at a given point in the code. Together they let you model real-world data precisely.

## Union types

```ts
type Id = string | number

function printId(id: Id) {
  console.log(id.toUpperCase()) // Error: 'toUpperCase' does not exist on type 'number'
}
```

You can only use members common to every type in the union — until you narrow.

## Narrowing techniques

### `typeof`

```ts
function printId(id: string | number) {
  if (typeof id === 'string') {
    console.log(id.toUpperCase())   // id: string
  } else {
    console.log(id.toFixed(0))      // id: number
  }
}
```

### Truthiness and equality

```ts
function greet(name?: string | null) {
  if (!name) return 'Hello, guest'  // handles undefined, null and ''
  return `Hello, ${name}`           // name: string
}
```

### `in`

```ts
type Admin = { name: string; permissions: string[] }
type Guest = { name: string; expiresAt: Date }

function describe(user: Admin | Guest) {
  if ('permissions' in user) return `${user.name} (${user.permissions.length} permissions)`
  return `${user.name} (guest until ${user.expiresAt.toDateString()})`
}
```

### `instanceof`

```ts
function formatError(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}
```

### Custom type guards

Functions returning `value is T` (covered in the functions lesson).

## Literal types

A literal type is a single exact value:

```ts
type Direction = 'up' | 'down' | 'left' | 'right'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type Dice = 1 | 2 | 3 | 4 | 5 | 6

function move(direction: Direction) { /* … */ }
move('up')
move('north') // Error
```

String-literal unions are usually a better choice than enums for fixed sets of values.

## Discriminated unions

The most useful pattern in TypeScript. Give each variant a common **literal** property (the *discriminant*), and TypeScript narrows on it:

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

function render(state: RequestState<string[]>) {
  switch (state.status) {
    case 'idle':
      return 'Start a search'
    case 'loading':
      return 'Loading…'
    case 'success':
      return state.data.join(', ')   // data only exists here
    case 'error':
      return `Failed: ${state.error}` // error only exists here
  }
}
```

This makes **impossible states impossible**: you can't have `data` and `error` at the same time, or `data` while loading.

## Exhaustiveness checking with `never`

If someone adds a new variant, make the compiler tell you every place that needs updating:

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`)
}

function label(state: RequestState<unknown>): string {
  switch (state.status) {
    case 'idle': return 'Idle'
    case 'loading': return 'Loading'
    case 'success': return 'Done'
    case 'error': return 'Error'
    default: return assertNever(state) // Error here if a case is missing
  }
}
```

## Control-flow analysis

TypeScript tracks types through `if`, `return`, `throw`, assignments and more:

```ts
function process(input: string | string[] | null) {
  if (input === null) return
  // input: string | string[]
  const list = typeof input === 'string' ? [input] : input
  // list: string[]
  return list.map((s) => s.trim())
}
```

## Unions of arrays vs. arrays of unions

```ts
type A = string[] | number[]      // all strings OR all numbers
type B = (string | number)[]      // a mix is allowed
```

## Try it yourself

1. Model a `Shape` discriminated union (`circle` with `radius`, `rectangle` with `width`/`height`, `triangle` with `base`/`height`) and write an exhaustive `area(shape)` function.
2. Add a `square` variant and watch the compiler point at the missing case.
3. Write a `PaymentResult` union for success (with a transaction id), declined (with a reason) and requires-action (with a URL).
