## What is TypeScript and why use it over JavaScript?
Level: Beginner | Tags: basics

TypeScript is a superset of JavaScript that adds a static type system. The compiler checks types at build time and outputs plain JavaScript (types are erased).

Benefits:

- Catches bugs before runtime: typos, wrong argument types, `null`/`undefined` access.
- Much better tooling: autocomplete, go-to-definition, safe refactoring.
- Types act as documentation and contracts between modules and teams.
- Scales well in large code bases.

Trade-offs: a build/type-check step, a learning curve for advanced types, and the fact that types don't validate runtime data (you still need validation at boundaries).

## What is the difference between `interface` and `type`?
Level: Beginner | Tags: interfaces, types

Both can describe object shapes and are largely interchangeable for that. Differences:

- `type` can express **unions, intersections, tuples, primitives, mapped and conditional types**; `interface` only describes object/function shapes.
- `interface` supports **declaration merging** — declaring the same interface twice merges the members (used to augment library types like Express's `Request` or `Window`).
- Interfaces extend with `extends`; types compose with `&`.
- Error messages and performance for large object hierarchies are sometimes better with interfaces.

A common convention: `interface` for public object contracts and class shapes, `type` for unions and everything else. Consistency matters more than the choice.

## What is the difference between `any`, `unknown` and `never`?
Level: Beginner | Tags: types

- **`any`** disables type checking. Anything can be assigned to it and you can do anything with it. It spreads silently and hides bugs — avoid it.
- **`unknown`** is the type-safe counterpart: anything can be assigned to it, but you must **narrow** it (with `typeof`, `instanceof`, type guards or validation) before using it. Use it for external data and `catch` variables.
- **`never`** is the type with no values: functions that never return (throw or loop forever), and impossible branches. It's used for exhaustiveness checks.

```ts
function handle(value: unknown) {
  if (typeof value === 'string') return value.toUpperCase()
  if (typeof value === 'number') return value.toFixed(2)
  return String(value)
}
```

## What is type narrowing? Name some ways to narrow a type.
Level: Intermediate | Tags: narrowing, unions

Narrowing is how TypeScript refines a broad type (like a union) to a more specific one based on control flow.

- `typeof x === 'string'`
- `x instanceof Date`
- `'prop' in x`
- Equality and truthiness checks (`if (x)`, `x === null`)
- Discriminated unions (`switch (x.kind)`)
- User-defined type guards (`function isCat(x): x is Cat`)
- Assertion functions (`asserts x is T`)

```ts
function len(x: string | string[] | null) {
  if (!x) return 0                        // x: string | string[]
  return typeof x === 'string' ? x.length : x.length
}
```

## What is a discriminated union and why is it useful?
Level: Intermediate | Tags: unions, narrowing

A union of object types that share a literal property (the discriminant). Checking that property narrows to the exact variant:

```ts
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number }

function area(s: Shape) {
  switch (s.kind) {
    case 'circle': return Math.PI * s.radius ** 2
    case 'rect': return s.width * s.height
  }
}
```

Benefits: impossible states can't be represented (e.g. a request can't be both `loading` and have `data`), each branch only sees relevant fields, and with a `never` check the compiler flags any unhandled new variant.

## How do you do exhaustiveness checking in TypeScript?
Level: Intermediate | Tags: never, unions

Assign the value to `never` in the default branch. If a case is missing, the value's type isn't `never` and compilation fails:

```ts
function assertNever(x: never): never {
  throw new Error(`Unexpected: ${JSON.stringify(x)}`)
}

function label(s: Shape): string {
  switch (s.kind) {
    case 'circle': return 'Circle'
    case 'rect': return 'Rectangle'
    default: return assertNever(s)
  }
}
```

Alternatives: a `Record<Union, Handler>` object checked with `satisfies`, or the `switch-exhaustiveness-check` lint rule.

## What are generics? Give an example with a constraint.
Level: Intermediate | Tags: generics

Generics let you write code that works with many types while preserving type information, by using type parameters:

```ts
function first<T>(items: T[]): T | undefined {
  return items[0]
}

function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

getProp({ name: 'Asha', age: 28 }, 'age') // number
```

`K extends keyof T` is a **constraint**: `K` must be one of `T`'s keys. Constraints let you use properties of the type parameter safely (e.g. `T extends { length: number }`).

## Explain the common utility types.
Level: Intermediate | Tags: utility-types

- `Partial<T>` / `Required<T>` — make all properties optional / required.
- `Readonly<T>` — make all properties read-only.
- `Pick<T, K>` / `Omit<T, K>` — keep / remove properties.
- `Record<K, V>` — object with keys `K` and values `V`.
- `Exclude<U, X>` / `Extract<U, X>` — filter union members.
- `NonNullable<T>` — remove `null` and `undefined`.
- `ReturnType<F>`, `Parameters<F>`, `Awaited<T>`, `InstanceType<C>`.

They let you **derive** types (e.g. `type NewUser = Omit<User, 'id' | 'createdAt'>`) so they stay in sync with the source type.

## What is the difference between `type` assertions (`as`) and type annotations?
Level: Beginner | Tags: types

An **annotation** (`const x: User = …`) asks the compiler to *check* that the value matches the type.

An **assertion** (`value as User`) tells the compiler to *trust* you — it performs no runtime check or conversion and only rejects obviously impossible conversions. Wrong assertions hide bugs:

```ts
const user = JSON.parse(text) as User  // nothing verifies this
```

Prefer annotations, narrowing and validation. Use assertions sparingly (e.g. DOM element types after a selector you control), and avoid double assertions (`as unknown as T`).

## What does `strict` mode enable and why should you use it?
Level: Intermediate | Tags: tsconfig

`"strict": true` enables a family of checks, most importantly:

- `strictNullChecks` — `null`/`undefined` aren't assignable to other types, so you must handle them.
- `noImplicitAny` — no silently inferred `any`.
- `strictFunctionTypes` — sound checking of function parameter types.
- `strictPropertyInitialization` — class fields must be initialised.
- `useUnknownInCatchVariables` — `catch (e)` is `unknown`.

Without strict mode, TypeScript misses the most common runtime crash (accessing properties of `undefined`). Always enable it in new projects; migrate old ones option by option.

## What are mapped types?
Level: Advanced | Tags: mapped-types

Mapped types create a new type by transforming each property of an existing one:

```ts
type Optional<T> = { [K in keyof T]?: T[K] }
type Mutable<T> = { -readonly [K in keyof T]: T[K] }
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] }
```

- `[K in keyof T]` iterates over keys.
- `?`, `readonly` and `-?`, `-readonly` add or remove modifiers.
- `as` remaps keys (rename, or filter by mapping to `never`).

`Partial`, `Readonly`, `Pick` and `Record` are all mapped types.

## What are conditional types and what does `infer` do?
Level: Advanced | Tags: conditional-types, infer

A conditional type picks a type based on assignability: `T extends U ? X : Y`.

`infer` introduces a type variable that captures part of the matched type:

```ts
type ElementOf<T> = T extends (infer E)[] ? E : never
type Unpromise<T> = T extends Promise<infer V> ? V : T
type MyReturnType<F> = F extends (...args: any[]) => infer R ? R : never
```

When `T` is a naked type parameter and receives a union, conditional types **distribute** over each member (`Exclude` relies on this). Wrap in brackets (`[T] extends [U]`) to prevent distribution.

## What is the difference between `keyof` and `typeof` in types?
Level: Intermediate | Tags: keyof, typeof

- `keyof T` produces a union of the property names of **type** `T`: `keyof { a: 1; b: 2 }` is `'a' | 'b'`.
- `typeof value` (in a type position) produces the **type of a value**: `typeof config`.

They're often combined to derive types from runtime objects:

```ts
const ROUTES = { home: '/', blog: '/blog' } as const
type RouteName = keyof typeof ROUTES               // 'home' | 'blog'
type RoutePath = (typeof ROUTES)[RouteName]        // '/' | '/blog'
```

## What does `as const` do?
Level: Intermediate | Tags: literal-types

`as const` makes TypeScript infer the narrowest, read-only type for a literal:

```ts
const a = ['sm', 'md']            // string[]
const b = ['sm', 'md'] as const   // readonly ['sm', 'md']
type Size = (typeof b)[number]    // 'sm' | 'md'
```

It's commonly used to derive union types from arrays or objects (a single source of truth for values and types), and to keep literal types in configuration objects.

## What is the `satisfies` operator?
Level: Intermediate | Tags: satisfies

`expr satisfies Type` checks that an expression is compatible with `Type` **without changing** the expression's inferred type.

```ts
const palette = {
  primary: '#7c3aed',
  accent: [124, 58, 237],
} satisfies Record<string, string | number[]>

palette.primary.toUpperCase()  // still known to be a string
palette.accent.map((n) => n)   // still known to be number[]
```

With an annotation (`const palette: Record<string, string | number[]>`), each property would widen to the union and the specific keys would be lost. Use `satisfies` for config objects and lookup tables.

## Should you use enums? What are the alternatives?
Level: Intermediate | Tags: enums

Enums create a runtime object as well as a type. Drawbacks: they generate code (incompatible with "type-stripping" runtimes and `erasableSyntaxOnly`), numeric enums are loosely checked, string enums don't accept matching plain strings (awkward with JSON), and `const enum` breaks with per-file compilers.

Common alternatives:

```ts
type Status = 'pending' | 'paid'                          // literal union

const STATUS = { Pending: 'pending', Paid: 'paid' } as const
type Status2 = (typeof STATUS)[keyof typeof STATUS]       // const object
```

Enums are still fine in code bases that already use them (common in Angular); prefer string enums over numeric ones.

## How do you type a function that can be called in different ways?
Level: Intermediate | Tags: functions, overloads

Options, from simplest:

1. **Union parameter types** when the return type doesn't depend on the input.
2. **Generics** when the return type follows the input type.
3. **Overloads** when specific input combinations map to specific outputs:

```ts
function toArray(value: string): string[]
function toArray(value: number): number[]
function toArray(value: string | number) {
  return [value]
}
```

Only the overload signatures are visible to callers. Keep overloads few; conditional return types or separate functions are sometimes clearer.

## What are declaration files (`.d.ts`) and `@types` packages?
Level: Intermediate | Tags: declarations, modules

`.d.ts` files contain only type information describing JavaScript that exists elsewhere. Libraries either ship their own (`"types"` in `package.json`) or the community publishes them on DefinitelyTyped as `@types/<name>`.

You write your own `.d.ts` to:

- type an untyped package (`declare module 'lib' { … }`),
- declare globals (`declare const __VERSION__: string`, extending `Window`),
- augment library types (module augmentation),
- type non-code imports (`declare module '*.svg'`).

## Why don't TypeScript types protect you from bad API data? How do you fix that?
Level: Advanced | Tags: runtime-validation

Types are erased at compile time. `await res.json() as User` is just an assertion; if the API returns something else, the program fails later in confusing ways.

The fix is **runtime validation at the boundaries** (HTTP responses, request bodies, environment variables, storage). Schema libraries like Zod let you define the schema once and infer the type:

```ts
const User = z.object({ id: z.string(), age: z.number() })
type User = z.infer<typeof User>

const user = User.parse(await res.json()) // throws if invalid
```

After validation, the rest of the code can trust the types.

## What are branded types and when would you use them?
Level: Advanced | Tags: branded-types, patterns

TypeScript is structural, so `type UserId = string` and `type OrderId = string` are interchangeable. A **brand** adds a phantom property so they aren't:

```ts
type Brand<T, B> = T & { readonly __brand: B }
type UserId = Brand<string, 'UserId'>
type OrderId = Brand<string, 'OrderId'>

declare function cancel(id: OrderId): void
cancel('abc' as UserId) // Error
```

Use them for IDs of different entities, units (`Paise` vs `Rupees`), and validated values (`Email`, `SanitizedHtml`) created only by a validating function — the type then proves validation happened.

## What is the difference between `private` and `#private` in a TypeScript class?
Level: Intermediate | Tags: classes

- `private` is a **compile-time** check only. At runtime it's a normal property; it can be accessed with `obj['field']` or seen in `JSON.stringify` and debuggers.
- `#field` is a JavaScript **private field**, enforced by the runtime — truly inaccessible from outside the class, even with bracket access.

`private` is fine for design-time encapsulation; use `#private` when real privacy matters (libraries, security-sensitive state). Note that `#private` fields make instances incompatible with `Proxy`-based wrappers.

## How does TypeScript's structural typing differ from nominal typing?
Level: Intermediate | Tags: type-system

In **structural** typing (TypeScript), compatibility is based on shape: any value with the required properties is accepted, regardless of its declared type name. In **nominal** typing (Java, C#), types must be explicitly declared as related.

```ts
interface Point { x: number; y: number }
class Vec { constructor(public x: number, public y: number) {} }
const p: Point = new Vec(1, 2) // OK — same shape
```

Consequences: easy interop with plain objects and duck typing, but accidentally compatible types (two `string` IDs) need brands to be kept apart. Classes with `private`/`protected` members behave nominally.

## Explain variance: why can't I pass a `(dog: Dog) => void` where `(animal: Animal) => void` is expected?
Level: Expert | Tags: variance, functions

Function parameters are **contravariant**. A function expecting `(animal: Animal) => void` may call the callback with a `Cat`. A callback that only handles `Dog`s would then receive a `Cat` — unsound. So under `strictFunctionTypes`:

- `(a: Animal) => void` is assignable to `(d: Dog) => void` ✅ (handles more than required)
- `(d: Dog) => void` is **not** assignable to `(a: Animal) => void` ❌

Return types are **covariant** (a function returning `Dog` can be used where one returning `Animal` is expected). Method shorthand in interfaces is checked bivariantly for backward compatibility, which is slightly less safe than property-style function types.

## What are template literal types?
Level: Advanced | Tags: template-literal-types

Types built like template strings, combining literal types:

```ts
type Entity = 'user' | 'order'
type Action = 'created' | 'deleted'
type EventName = `${Entity}.${Action}` // 4 combinations

type Getter<K extends string> = `get${Capitalize<K>}`
```

With `infer`, they can parse string types — e.g. extracting `:param` names from a route path to type the params object. Watch out for combinatorial explosion with large unions.

## How would you type a generic, type-safe event emitter?
Level: Advanced | Tags: generics, patterns

Use an event map type and index it with the event name:

```ts
type Events = {
  login: { userId: string }
  logout: undefined
}

class Emitter<E extends Record<string, unknown>> {
  private handlers: { [K in keyof E]?: Array<(p: E[K]) => void> } = {}

  on<K extends keyof E>(event: K, fn: (payload: E[K]) => void) {
    ;(this.handlers[event] ??= []).push(fn)
  }

  emit<K extends keyof E>(event: K, payload: E[K]) {
    this.handlers[event]?.forEach((fn) => fn(payload))
  }
}

const bus = new Emitter<Events>()
bus.on('login', (p) => p.userId)          // p typed
bus.emit('login', { userId: 'u1' })
```

## What is declaration merging and module augmentation?
Level: Advanced | Tags: declarations

**Declaration merging**: multiple declarations with the same name are combined — e.g. two `interface User` declarations merge their members; a function and a namespace can merge.

**Module augmentation** uses this to extend types from another module:

```ts
import 'express'
declare module 'express-serve-static-core' {
  interface Request { user?: { id: string } }
}
```

It's how you add custom properties to framework types (Express `Request`, Vue component properties, `Window`) without forking their typings.

## How do you make TypeScript builds fast in a large monorepo?
Level: Expert | Tags: performance, tooling

- `skipLibCheck: true` and `incremental: true`.
- **Project references** with `composite: true`, built with `tsc -b` so only changed packages are rechecked.
- Transpile with fast per-file tools (esbuild, SWC, Vite) and run `tsc --noEmit` separately (CI, parallel).
- Explicit return types on exported functions; avoid huge unions and deeply recursive conditional types.
- Profile with `--extendedDiagnostics` and `--generateTrace`.
- Consider the native (Go) TypeScript compiler once your toolchain supports it.

## What does `readonly` do for arrays and properties? Does it make objects immutable?
Level: Intermediate | Tags: immutability

`readonly` prevents **assignment through that type** at compile time:

```ts
function sum(values: readonly number[]) {
  values.push(1) // Error
}
```

It's shallow and compile-time only: nested objects remain mutable, and another reference with a non-readonly type can still modify the data. For runtime immutability use `Object.freeze` (also shallow). `Readonly<T>` and `ReadonlyArray<T>` express intent in APIs — "this function won't modify your data".

## What's the difference between `unknown[]`, `any[]`, `[]` and `never[]`?
Level: Expert | Tags: types, arrays

- `any[]` — elements unchecked; anything goes.
- `unknown[]` — an array of anything; each element must be narrowed before use. The safe choice for "some array".
- `[]` — the **empty tuple** type; only an array of length 0 is assignable.
- `never[]` — an array that can never hold an element. You usually meet it by accident: with `strict` on, an empty array literal in an object (`const state = { items: [] }`) is inferred as `never[]`, so `state.items.push(1)` fails. Annotate it: `{ items: [] as number[] }` or type the object.

(A standalone `const items = []` is different: under `noImplicitAny` it's an "evolving" array whose type grows as you push values.)

## What are assertion functions?
Level: Advanced | Tags: narrowing, functions

Functions whose return type is `asserts condition` or `asserts value is Type`. If they return normally, TypeScript narrows accordingly for the rest of the scope:

```ts
function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg)
}

function assertIsString(v: unknown): asserts v is string {
  if (typeof v !== 'string') throw new TypeError('Expected string')
}

const input: unknown = getInput()
assertIsString(input)
input.toUpperCase() // input: string
```

They're useful for invariants and validation helpers. Assertion functions must be declared with an explicit type annotation to be usable.
