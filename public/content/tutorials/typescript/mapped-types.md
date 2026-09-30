A **mapped type** creates a new object type by transforming each property of an existing one. `Partial`, `Readonly`, `Record` and `Pick` are all mapped types — once you understand the syntax, you can build your own.

## The basic syntax

```ts
type Flags<T> = {
  [K in keyof T]: boolean
}

interface Features {
  darkMode: () => void
  newCheckout: () => void
}

type FeatureFlags = Flags<Features> // { darkMode: boolean; newCheckout: boolean }
```

`[K in keyof T]` iterates over every key of `T`; the right side gives each property's new type. Use `T[K]` to refer to the original property type.

## Re-implementing built-ins

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] }
type MyReadonly<T> = { readonly [K in keyof T]: T[K] }
type MyPick<T, K extends keyof T> = { [P in K]: T[P] }
type MyRecord<K extends PropertyKey, V> = { [P in K]: V }
```

## Modifiers: adding and removing `?` and `readonly`

Prefix with `+` (default) or `-`:

```ts
type Mutable<T> = { -readonly [K in keyof T]: T[K] }
type Complete<T> = { [K in keyof T]-?: T[K] }   // same as Required<T>

type Config = Readonly<{ host?: string; port?: number }>
type EditableConfig = Mutable<Complete<Config>> // { host: string; port: number }
```

## Key remapping with `as`

Rename or filter keys while mapping:

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

interface Person { name: string; age: number }
type PersonGetters = Getters<Person>
// { getName: () => string; getAge: () => number }
```

Filter keys by mapping them to `never`:

```ts
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
}

type Strs = OnlyStrings<{ id: string; age: number; name: string }> // { id: string; name: string }
```

## Practical examples

### Form state for any model

```ts
type FormState<T> = {
  values: T
  errors: { [K in keyof T]?: string }
  touched: { [K in keyof T]?: boolean }
}

const form: FormState<{ email: string; password: string }> = {
  values: { email: '', password: '' },
  errors: { email: 'Required' },
  touched: {},
}
```

### Event handler props

```ts
type Events = { click: MouseEvent; keydown: KeyboardEvent; focus: FocusEvent }

type HandlerProps = {
  [E in keyof Events as `on${Capitalize<E>}`]?: (event: Events[E]) => void
}
// { onClick?: (e: MouseEvent) => void; onKeydown?: …; onFocus?: … }
```

### Deep partial (recursive mapped type)

```ts
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

function mergeConfig(base: AppConfig, overrides: DeepPartial<AppConfig>): AppConfig { /* … */ }
```

(A production-quality `DeepPartial` also special-cases arrays, functions and dates.)

## Homomorphic mapped types

Mapped types over `keyof T` are **homomorphic**: they preserve the original's optional and readonly modifiers, and they map over arrays and tuples element-wise:

```ts
type Stringify<T> = { [K in keyof T]: string }
type A = Stringify<[number, boolean]> // [string, string] — still a tuple
```

## Try it yourself

1. Write `Nullable<T>` that makes every property `T[K] | null`.
2. Write `Setters<T>` producing `setName(value: string): void` methods.
3. Write `PickByType<T, V>` that keeps only properties whose type is assignable to `V`.
