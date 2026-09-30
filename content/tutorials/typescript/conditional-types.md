**Conditional types** choose a type based on a condition: `A extends B ? X : Y`. Combined with `infer`, they let you extract types from inside other types. They're what powers `ReturnType`, `Awaited`, `Parameters` and much of what makes libraries like tRPC, Prisma and Zod feel magical.

## The basic form

```ts
type IsString<T> = T extends string ? true : false

type A = IsString<'hello'> // true
type B = IsString<42>      // false
```

Read `T extends U` as "is `T` assignable to `U`?".

A practical example — different return types for different inputs:

```ts
type Id = string | number
type Entity<T extends Id> = T extends string ? { slug: T } : { numericId: T }

declare function find<T extends Id>(id: T): Entity<T>
find('about')  // { slug: 'about' }
find(42)       // { numericId: 42 }
```

## Distributive conditional types

When the checked type is a **naked type parameter** and you pass a union, the condition is applied to each member separately:

```ts
type ToArray<T> = T extends unknown ? T[] : never

type R = ToArray<string | number> // string[] | number[]  (not (string | number)[])
```

This is how `Exclude` works:

```ts
type MyExclude<T, U> = T extends U ? never : T
type R2 = MyExclude<'a' | 'b' | 'c', 'a'> // 'b' | 'c'
```

To **disable** distribution, wrap both sides in brackets:

```ts
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never
type R3 = ToArrayNonDist<string | number> // (string | number)[]
```

## `infer`: extracting types

`infer X` declares a type variable to capture part of a matched type:

```ts
type ElementOf<T> = T extends (infer E)[] ? E : never
type E1 = ElementOf<string[]> // string

type MyReturnType<F> = F extends (...args: any[]) => infer R ? R : never
type MyAwaited<T> = T extends Promise<infer V> ? MyAwaited<V> : T   // recursive unwrapping

type FirstArg<F> = F extends (first: infer A, ...rest: any[]) => any ? A : never
type F1 = FirstArg<(id: string, opts?: object) => void> // string
```

`infer` with constraints narrows what's captured:

```ts
type NumericString<T> = T extends `${infer N extends number}` ? N : never
type N = NumericString<'42'> // 42
```

## Real-world examples

### Unwrapping API response types

```ts
type ApiResult<T> = { data: T } | { error: string }
type DataOf<R> = R extends { data: infer D } ? D : never

type UsersData = DataOf<ApiResult<{ id: string }[]>> // { id: string }[]
```

### Making some keys optional

```ts
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type NewProduct = PartialBy<Product, 'id'> // id is optional, everything else required
```

### Function overload replacement

```ts
type ParseResult<T> = T extends string ? number : T extends string[] ? number[] : never

function parse<T extends string | string[]>(input: T): ParseResult<T> {
  return (Array.isArray(input) ? input.map(Number) : Number(input)) as ParseResult<T>
}
```

Note the cast in the implementation: TypeScript can't verify a value against an unresolved conditional type, so implementations of such functions usually need an assertion.

## Readability matters

Conditional types can become unreadable quickly. Guidelines:

- Name intermediate types instead of nesting ternaries five deep.
- Write test cases with a helper:

```ts
type Expect<T extends true> = T
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false

type _tests = [
  Expect<Equal<ElementOf<number[]>, number>>,
  Expect<Equal<FirstArg<(a: boolean) => void>, boolean>>,
]
```

- Keep complex types in library/infrastructure code; application code should mostly use simple, named types.

## Try it yourself

1. Write `UnwrapArray<T>` that returns the element type for arrays and `T` otherwise.
2. Write `PromiseValues<T>` that turns `{ a: Promise<number>; b: Promise<string> }` into `{ a: number; b: string }` (hint: mapped type + `Awaited`).
3. Write `IsNever<T>` (careful: distribution over `never` produces `never` — use the bracket trick).
