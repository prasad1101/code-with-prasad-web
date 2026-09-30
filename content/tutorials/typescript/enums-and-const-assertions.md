Applications are full of fixed sets of values: statuses, roles, event names. TypeScript offers several ways to model them. Knowing the trade-offs helps you pick the right one.

## String-literal unions (usually the best choice)

```ts
type Role = 'admin' | 'editor' | 'viewer'

function canEdit(role: Role) {
  return role === 'admin' || role === 'editor'
}

canEdit('editor')   // OK
canEdit('owner')    // Error
```

They have no runtime cost (erased at compile time), work naturally with JSON, and give excellent autocomplete.

## `as const`

`as const` tells TypeScript to infer the **narrowest** possible type and make everything read-only:

```ts
const config = { env: 'production', retries: 3 }
// { env: string; retries: number }

const frozen = { env: 'production', retries: 3 } as const
// { readonly env: 'production'; readonly retries: 3 }
```

Combine it with `typeof` and indexed access to derive a union from a runtime array — one source of truth for both the values and the type:

```ts
export const ROLES = ['admin', 'editor', 'viewer'] as const
export type Role = (typeof ROLES)[number] // 'admin' | 'editor' | 'viewer'

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value)
}

// Use the array for a dropdown, the type for checking
ROLES.map((r) => `<option>${r}</option>`)
```

The same trick works with objects:

```ts
export const STATUS = {
  Pending: 'pending',
  Paid: 'paid',
  Shipped: 'shipped',
} as const

export type Status = (typeof STATUS)[keyof typeof STATUS] // 'pending' | 'paid' | 'shipped'

order.status = STATUS.Paid
```

This "const object" pattern gives you named constants like an enum, while staying plain JavaScript.

## Enums

TypeScript's `enum` creates both a type and a runtime object:

```ts
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right,   // 3
}

enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Error = 'error',
}

function log(level: LogLevel, msg: string) { /* … */ }
log(LogLevel.Info, 'Started')
log('info', 'Started') // Error — string enums require the enum member
```

Drawbacks to be aware of:

- **Numeric enums are loosely checked**: historically, any number was assignable to a numeric enum type.
- Enums generate runtime code and aren't supported by "type stripping" tools (Node's built-in TypeScript support, `erasableSyntaxOnly`), because they're not just types.
- String enums are nominal: you can't pass a plain string that matches, which is awkward with JSON from APIs.

Many teams therefore prefer literal unions or const objects. Enums remain common in Angular and older code bases, so you should be able to read them.

### `const enum`

`const enum` members are inlined at compile time (no runtime object), but they don't work with isolated per-file compilers such as esbuild, SWC or Babel. Avoid them in libraries.

## `satisfies`

`satisfies` checks that a value matches a type **without widening** the value's inferred type:

```ts
type Theme = Record<string, string>

const annotated: Theme = { primary: '#7c3aed', secondary: '#0891b2' }
annotated.primray // no error — the annotation widened the type to "any string key"

const theme = {
  primary: '#7c3aed',
  secondary: '#0891b2',
} satisfies Theme

theme.primary   // OK — the exact keys are still known
theme.primray   // Error: Property 'primray' does not exist
theme.primary = 1 // Error — the value type is string
```

The object is checked against `Theme`, but keeps its own, more precise type. `satisfies` is ideal for configuration objects and lookup tables:

```ts
const routes = {
  home: '/',
  blog: '/blog',
  post: '/blog/:slug',
} as const satisfies Record<string, `/${string}`>
```

## Choosing

| Need | Use |
| --- | --- |
| A fixed set of string values | Literal union |
| Values *and* a type from one source | `as const` array/object + `typeof` |
| Validate a config object's shape but keep precise types | `satisfies` |
| Working in a code base that already uses enums | `enum` (prefer string enums) |

## Try it yourself

1. Define `const CURRENCIES = ['INR', 'USD', 'AED', 'EUR'] as const`, derive a `Currency` type, and write `isCurrency(value: string): value is Currency`.
2. Create a `PERMISSIONS` const object mapping roles to arrays of permissions, checked with `satisfies Record<Role, readonly string[]>`.
