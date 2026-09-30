TypeScript's types vanish at runtime. When data comes from outside your program — an API response, a form, `localStorage`, environment variables, a message queue — the compiler can't know what it really contains. This lesson shows how to **validate at the boundaries** and get types for free.

## The problem

```ts
interface User { id: string; name: string; age: number }

const user = (await (await fetch('/api/me')).json()) as User
user.age.toFixed(0) // crashes if the API sent age: null or "28"
```

The `as User` is a promise to the compiler that nobody checks.

## Validating with a schema library

Libraries like **Zod** (also Valibot, ArkType, Yup) let you declare a schema once and derive the TypeScript type from it:

```ts
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  age: z.number().int().nonnegative(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).default('user'),
})

type User = z.infer<typeof UserSchema>
// { id: string; name: string; age: number; email?: string; role: 'admin' | 'user' }
```

One definition, both a runtime check and a static type — they can never drift apart.

### `parse` vs. `safeParse`

```ts
const user = UserSchema.parse(json)          // throws a ZodError if invalid

const result = UserSchema.safeParse(json)    // never throws
if (!result.success) {
  console.error(result.error.issues)         // [{ path: ['age'], message: 'Expected number…' }]
} else {
  result.data.age                            // number, guaranteed
}
```

### A typed, validated fetch

```ts
async function fetchValidated<S extends z.ZodType>(url: string, schema: S): Promise<z.infer<S>> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return schema.parse(await res.json())
}

const users = await fetchValidated('/api/users', z.array(UserSchema))
```

## Transformations and coercion

Schemas can also clean up data:

```ts
const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),   // "2" → 2
  q: z.string().trim().max(100).optional(),
  from: z.coerce.date().optional(),                   // ISO string → Date
})

const query = QuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams))
```

## Environment variables

Fail fast at startup instead of discovering a missing variable at 3 a.m.:

```ts
const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(32),
})

export const env = Env.parse(process.env)
```

## Validating API request bodies (server side)

```ts
const CreateOrder = z.object({
  items: z.array(z.object({ sku: z.string(), qty: z.number().int().positive() })).min(1),
  couponCode: z.string().optional(),
})

app.post('/orders', (req, res) => {
  const parsed = CreateOrder.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })
  createOrder(parsed.data) // fully typed and trusted
})
```

## Where to validate

Validate **once, at the edge**, then trust the types inside:

- HTTP request bodies, query strings and headers (server).
- API responses (client) — especially third-party APIs.
- Data read from storage, files, queues and environment variables.
- Messages from `postMessage`, WebSockets and workers.

Don't re-validate the same data in every function; the whole point is that after the boundary, the types are true.

## Hand-written type guards

For small cases, a type guard is enough:

```ts
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' && value !== null &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).age === 'number'
  )
}
```

Guards get verbose quickly and can drift from the interface — which is why schema libraries exist.

## Sharing schemas across front end and back end

In a monorepo (or a shared package), export schemas from one place. The server validates requests with them, the client validates forms with them, and both use the inferred types. Tools like tRPC build on this idea to give end-to-end type safety without code generation.

## Try it yourself

1. Write a Zod schema for a product (`id`, `title`, `price > 0`, `tags` array, optional `discount` between 0 and 1) and infer its type.
2. Build `fetchValidated` and use it against a public JSON API; break the schema deliberately and read the error.
3. Validate `process.env` at startup in a small Node script.
