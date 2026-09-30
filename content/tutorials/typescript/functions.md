Functions are where types pay off most: every call is checked against the function's signature.

## Parameter and return types

```ts
function add(a: number, b: number): number {
  return a + b
}

const multiply = (a: number, b: number): number => a * b

add(2, '3') // Error: Argument of type 'string' is not assignable to parameter of type 'number'.
add(2)      // Error: Expected 2 arguments, but got 1.
```

## Optional and default parameters

```ts
function greet(name: string, greeting?: string) {
  return `${greeting ?? 'Hello'}, ${name}`
}

function paginate(page = 1, pageSize = 20) {   // types inferred from defaults
  return { skip: (page - 1) * pageSize, limit: pageSize }
}
```

Optional parameters must come after required ones.

## Rest parameters

```ts
function sum(...values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}
```

## Object parameters

Destructured parameters are typed as a whole object:

```ts
type SearchOptions = { query: string; limit?: number; sort?: 'asc' | 'desc' }

function search({ query, limit = 10, sort = 'asc' }: SearchOptions) {
  // query: string, limit: number, sort: 'asc' | 'desc'
}

search({ query: 'typescript', sort: 'desc' })
```

Options objects scale better than long positional parameter lists.

## Function types

```ts
type Comparator<T> = (a: T, b: T) => number
type Handler = (event: MouseEvent) => void

const byAge: Comparator<{ age: number }> = (a, b) => a.age - b.age

function onClick(handler: Handler) { /* … */ }
```

Callback parameters are **contextually typed** — you don't need to annotate `a` and `b` above.

### `void` return types in callbacks

A function type returning `void` accepts functions that return something — the value is simply ignored. That's why this works:

```ts
const nums: number[] = []
;[1, 2, 3].forEach((n) => nums.push(n)) // push returns number, forEach expects void — fine
```

## Overloads

When a function's return type depends on its arguments in ways a union can't express, declare **overload signatures**:

```ts
function parse(value: string): number
function parse(value: string[]): number[]
function parse(value: string | string[]): number | number[] {
  return Array.isArray(value) ? value.map(Number) : Number(value)
}

const one = parse('42')          // number
const many = parse(['1', '2'])   // number[]
```

The implementation signature isn't callable directly; only the overloads are visible. Often a union or a generic (later lesson) is simpler than overloads — reach for them only when needed.

## `this` parameters

You can declare what `this` must be:

```ts
function handleClick(this: HTMLButtonElement, e: MouseEvent) {
  this.disabled = true
}
button.addEventListener('click', handleClick)
```

`this` parameters are erased from the output — they exist only for checking.

## Type predicates

A function returning `value is Type` narrows types for the caller:

```ts
type Cat = { meow(): void }
type Dog = { bark(): void }

function isCat(pet: Cat | Dog): pet is Cat {
  return 'meow' in pet
}

function speak(pet: Cat | Dog) {
  if (isCat(pet)) pet.meow()
  else pet.bark()
}
```

Predicates are ideal for filtering:

```ts
const values = ['a', null, 'b', undefined]
const strings = values.filter((v): v is string => v != null) // string[]
```

(Recent TypeScript versions infer simple predicates like this automatically.)

## Assertion functions

```ts
function assertDefined<T>(value: T, message: string): asserts value is NonNullable<T> {
  if (value == null) throw new Error(message)
}

const el = document.getElementById('app')
assertDefined(el, '#app not found')
el.innerHTML = '' // el is HTMLElement here
```

## Try it yourself

1. Write `formatDate(date: Date, options?: { withTime?: boolean }): string`.
2. Write overloads for `createElement('input')` returning `HTMLInputElement` and `createElement('div')` returning `HTMLDivElement`.
3. Write a type predicate `isNonEmptyString(v: unknown): v is string`.
