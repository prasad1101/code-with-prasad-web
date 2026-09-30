TypeScript ships with **utility types** that transform existing types. They let you derive new types instead of duplicating definitions — so when the original changes, everything derived from it updates automatically.

We'll use this type throughout:

```ts
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: Date
}
```

## `Partial<T>` and `Required<T>`

`Partial` makes every property optional — perfect for updates:

```ts
function updateUser(id: string, changes: Partial<User>) { /* … */ }
updateUser('u1', { name: 'Asha P.' })
```

`Required` does the opposite, removing `?` from every property.

## `Readonly<T>`

```ts
const frozen: Readonly<User> = getUser()
frozen.name = 'x' // Error
```

## `Pick<T, K>` and `Omit<T, K>`

Select or remove properties:

```ts
type UserSummary = Pick<User, 'id' | 'name'>
type NewUser = Omit<User, 'id' | 'createdAt'>   // what the client sends when registering

function createUser(input: NewUser): User {
  return { ...input, id: crypto.randomUUID(), createdAt: new Date() }
}
```

## `Record<K, V>`

An object type with keys `K` and values `V`:

```ts
type Role = User['role']
const permissions: Record<Role, string[]> = {
  admin: ['read', 'write', 'delete'],
  user: ['read'],
}
// Forgetting a role is an error — Record requires every key
```

## `Exclude`, `Extract` and `NonNullable`

These work on **unions**:

```ts
type Status = 'draft' | 'published' | 'archived' | 'deleted'

type Visible = Exclude<Status, 'deleted' | 'archived'>  // 'draft' | 'published'
type Final = Extract<Status, 'archived' | 'deleted'>    // 'archived' | 'deleted'
type Name = NonNullable<string | null | undefined>      // string
```

## Function-related utilities

```ts
function createOrder(customerId: string, items: { sku: string; qty: number }[]) {
  return { id: 'o-1', customerId, items, total: 0 }
}

type OrderArgs = Parameters<typeof createOrder>   // [customerId: string, items: {…}[]]
type Order = ReturnType<typeof createOrder>       // { id: string; customerId: string; … }

async function fetchUser(): Promise<User> { /* … */ return getUser() }
type Fetched = Awaited<ReturnType<typeof fetchUser>> // User
```

`ReturnType` and `Awaited` are handy when a library doesn't export the type you need.

Class-related: `InstanceType<typeof MyClass>` and `ConstructorParameters<typeof MyClass>`.

## Combining utilities

Utilities compose. A form model where every field except `id` is editable and optional:

```ts
type EditUserForm = Partial<Omit<User, 'id' | 'createdAt'>> & Pick<User, 'id'>
```

An API response type derived from the model with dates serialised as strings:

```ts
type Serialized<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] }
type UserJson = Serialized<User> // createdAt: string
```

(That last one uses a mapped type and a conditional type — the next lessons explain how to write your own.)

## `NoInfer<T>`

Stops a position from being used to infer a type parameter:

```ts
function createFSM<S extends string>(states: S[], initial: NoInfer<S>) { /* … */ }

createFSM(['idle', 'loading'], 'idle')    // OK
createFSM(['idle', 'loading'], 'done')    // Error — 'done' isn't one of the states
```

Without `NoInfer`, TypeScript would widen `S` to include `'done'`.

## Try it yourself

Given an `Article` interface with `id`, `title`, `body`, `authorId`, `tags`, `publishedAt: Date | null`:

1. Create `ArticleDraft` (no `id`, `publishedAt` omitted).
2. Create `ArticlePreview` (just `id`, `title`, `tags`).
3. Create `ArticlePatch` for a PATCH endpoint (all optional except `id`).
4. Create a `Record` mapping each tag to a colour, using a `Tag` union.
