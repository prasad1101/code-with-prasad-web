**Template literal types** build string types the same way template strings build string values. They let TypeScript understand string formats: event names, CSS values, route paths, keys with prefixes.

## Basics

```ts
type Greeting = `Hello, ${string}`

const a: Greeting = 'Hello, Asha'   // OK
const b: Greeting = 'Hi, Asha'      // Error
```

With unions, you get every combination:

```ts
type Size = 'sm' | 'md' | 'lg'
type Color = 'primary' | 'secondary'
type ButtonClass = `btn-${Color}-${Size}`
// 'btn-primary-sm' | 'btn-primary-md' | … (6 members)
```

## Intrinsic string manipulation types

```ts
type A = Uppercase<'hello'>      // 'HELLO'
type B = Lowercase<'HELLO'>      // 'hello'
type C = Capitalize<'order'>     // 'Order'
type D = Uncapitalize<'Order'>   // 'order'
```

## Typed event names

```ts
type Entity = 'user' | 'order' | 'product'
type Action = 'created' | 'updated' | 'deleted'
type DomainEvent = `${Entity}.${Action}`

function subscribe(event: DomainEvent, handler: () => void) { /* … */ }

subscribe('order.created', () => {})   // OK
subscribe('order.shipped', () => {})   // Error
```

## Parsing strings with `infer`

Template literal types can be matched with `infer` — effectively parsing strings at the type level:

```ts
type RouteParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof RouteParams<`/${Rest}`>]: string }
    : Path extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {}

type P = RouteParams<'/users/:userId/posts/:postId'>
// { userId: string; postId: string }

function navigate<Path extends string>(path: Path, params: RouteParams<Path>) { /* … */ }

navigate('/users/:userId/posts/:postId', { userId: '1', postId: '9' }) // OK
navigate('/users/:userId', {})                                        // Error: userId missing
```

This is how typed routers infer route parameters from path strings.

## Deriving keys from objects

Combine with mapped types and key remapping:

```ts
interface State {
  name: string
  age: number
}

type Setters = {
  [K in keyof State as `set${Capitalize<K>}`]: (value: State[K]) => void
}
// { setName: (value: string) => void; setAge: (value: number) => void }

type ChangeEvents = `${keyof State}Changed` // 'nameChanged' | 'ageChanged'
```

## Constraining string formats

```ts
type HexColor = `#${string}`
type CssLength = `${number}${'px' | 'rem' | '%'}`
type ApiPath = `/api/${string}`

function setWidth(width: CssLength) { /* … */ }
setWidth('24px')    // OK
setWidth('24')      // Error
```

`${number}` matches any string that parses as a number.

Note: these checks only apply to values TypeScript can see as literals. A `string` from user input won't be assignable without validation — which is correct: you should validate it.

## Performance caution

Unions multiply: `${A}-${B}-${C}` with 20 members each yields 8,000 members, and very large unions slow the compiler (TypeScript caps them at 100,000). Keep combinatorial types small.

## Try it yourself

1. Create a `Breakpoint` type (`'sm' | 'md' | 'lg'`) and a `ResponsiveClass` type like `'sm:hidden' | 'md:flex'` for a list of utilities.
2. Write `KebabToCamel<S>` that turns `'user-first-name'` into `'userFirstName'` using recursive template literal inference.
3. Type a `t('greeting.hello')` translation function whose keys come from a nested translations object.
