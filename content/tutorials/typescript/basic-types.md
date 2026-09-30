This lesson covers the building blocks: primitive types, arrays, tuples, and the special types `any`, `unknown`, `never` and `void`.

## Primitives

```ts
let name: string = 'Asha'
let age: number = 28          // integers and floats
let isAdmin: boolean = false
let big: bigint = 100n
let id: symbol = Symbol('id')
let nothing: null = null
let notSet: undefined = undefined
```

Use lowercase `string`, `number`, `boolean` — not the wrapper objects `String`, `Number`, `Boolean`.

## Arrays and tuples

```ts
const scores: number[] = [90, 85]
const tags: Array<string> = ['ts', 'js']   // same thing, generic syntax
const matrix: number[][] = [[1, 2], [3, 4]]
```

A **tuple** is a fixed-length array where each position has its own type:

```ts
const point: [number, number] = [10, 20]
const entry: [string, number] = ['age', 28]

// Labelled and optional elements
type Range = [start: number, end?: number]

// Read-only
const origin: readonly [number, number] = [0, 0]
origin[0] = 1 // Error
```

Tuples are how functions like React's `useState` return two differently typed values.

## `any`: opting out

`any` turns off type checking for a value. Anything goes — including mistakes:

```ts
let data: any = JSON.parse('{"name":"Asha"}')
data.nmae.toUpperCase() // no error at compile time — crashes at runtime
```

`any` is contagious: values derived from it are also `any`. Avoid it; enable `noImplicitAny` (part of `strict`) so the compiler never silently infers it.

## `unknown`: the safe "any"

`unknown` accepts any value, but you must **narrow** it before using it:

```ts
function parse(json: string): unknown {
  return JSON.parse(json)
}

const value = parse('{"name":"Asha"}')
value.name // Error: 'value' is of type 'unknown'

if (typeof value === 'object' && value !== null && 'name' in value) {
  console.log(value.name) // OK after narrowing
}
```

Use `unknown` for data from outside your program: JSON, `catch` clause errors, third-party callbacks.

## `void` and `never`

```ts
function log(message: string): void {
  console.log(message)          // returns nothing useful
}

function fail(message: string): never {
  throw new Error(message)      // never returns at all
}

function loopForever(): never {
  while (true) {}
}
```

`never` also represents impossible states — it's the key to exhaustive checks (see the narrowing lesson).

## Type annotations vs. inference

```ts
const port = 3000                 // inferred: number (actually the literal 3000 for const)
let host = 'localhost'            // inferred: string

function add(a: number, b: number) {
  return a + b                    // return type inferred: number
}
```

Annotate return types on exported functions: it documents intent and catches accidental changes.

## Type aliases

Give a type a name with `type`:

```ts
type UserId = string
type Coordinates = [lat: number, lng: number]
type Status = 'active' | 'suspended'   // a union of string literals (more soon)

const office: Coordinates = [18.52, 73.85]
```

## Type assertions

Sometimes you know more than the compiler. `as` tells it to trust you:

```ts
const input = document.querySelector('#email') as HTMLInputElement
input.value = 'asha@example.com'
```

Assertions don't check or convert anything at runtime. Use them sparingly — a wrong assertion is a hidden bug. The **non-null assertion** `value!` says "this isn't null or undefined"; prefer a real check.

## `null` and `undefined` with `strictNullChecks`

With `strict` enabled (recommended), `null` and `undefined` aren't assignable to other types unless you say so:

```ts
let nickname: string = null        // Error
let middleName: string | null = null // OK — explicitly nullable

function greet(name?: string) {    // name: string | undefined
  return `Hello, ${name ?? 'friend'}`
}
```

This one setting eliminates the most common JavaScript crash: "Cannot read properties of undefined".

## Try it yourself

1. Declare a tuple type `HttpResult` of `[status: number, body: string]` and a function returning it.
2. Write `safeJsonParse(text: string): unknown` and a function that narrows its result to check for a `version` number property.
