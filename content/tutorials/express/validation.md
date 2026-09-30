Never trust client input. Validation rejects malformed requests early, with clear messages, and guarantees that your business logic only ever sees well-formed data. We'll use **Zod** to validate bodies, params and query strings with one reusable middleware.

## Installing Zod

```bash
npm install zod
```

## Defining schemas

```js
// src/products/products.schemas.js
import { z } from 'zod'

export const productBody = z.object({
  name: z.string().trim().min(2).max(120),
  price: z.number().positive().max(1_000_000),
  category: z.enum(['stationery', 'books', 'electronics']),
  tags: z.array(z.string().max(30)).max(10).default([]),
}).strict() // reject unknown fields

export const productPatch = productBody.partial().refine(
  (body) => Object.keys(body).length > 0,
  { message: 'Provide at least one field to update' },
)

export const idParams = z.object({ id: z.string().uuid() })

export const listQuery = z.object({
  category: productBody.shape.category.optional(),
  sort: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
```

`z.coerce.number()` converts query-string values like `'2'` into numbers.

## A reusable validation middleware

```js
// src/middleware/validate.js
export const validate = (schemas) => (req, res, next) => {
  const errors = []
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue
    const result = schemas[part].safeParse(req[part] ?? {})
    if (result.success) {
      req.valid = { ...req.valid, [part]: result.data }
    } else {
      errors.push(...result.error.issues.map((i) => ({ location: part, path: i.path.join('.'), message: i.message })))
    }
  }
  if (errors.length) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Invalid request', details: errors } })
  }
  next()
}
```

We store the parsed, typed values on `req.valid` rather than overwriting `req.query` (which is a read-only getter in Express 5).

## Using it in routes

```js
import { validate } from '../middleware/validate.js'
import { idParams, listQuery, productBody, productPatch } from './products.schemas.js'

productsRouter.get('/', validate({ query: listQuery }), (req, res) => {
  res.json(service.listProducts(req.valid.query))
})

productsRouter.post('/', validate({ body: productBody }), (req, res) => {
  const product = service.createProduct(req.valid.body)
  res.status(201).json({ data: product })
})

productsRouter.patch('/:id', validate({ params: idParams, body: productPatch }), (req, res) => {
  res.json({ data: service.updateProduct(req.valid.params.id, req.valid.body) })
})
```

A bad request now gets a helpful response (messages shown are Zod 4's defaults — pass your own with e.g. `z.number().positive('Price must be positive')`):

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid request",
    "details": [
      { "location": "body", "path": "price", "message": "Too small: expected number to be >0" },
      { "location": "body", "path": "", "message": "Unrecognized key: \"colour\"" }
    ]
  }
}
```

## Why `.strict()` matters

Without it, extra fields pass through. With a database behind the API, a client could send `{ "role": "admin" }` or `{ "createdAt": … }` and overwrite fields you never meant to expose (**mass assignment**). Whitelisting fields with a schema prevents that.

## Custom and cross-field rules

```js
const signup = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(12),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
})

const dateRange = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
}).refine((r) => r.from <= r.to, { message: '`from` must be before `to`' })
```

## Business validation vs. input validation

Schemas check **shape and format**. Rules that need data — "email already registered", "product out of stock" — belong in the service layer and typically return `409 Conflict` or `422 Unprocessable Entity`.

## Sharing schemas

In a MERN/MEAN monorepo, put schemas in a shared package: the API validates requests with them, the front end validates forms with them, and both use the inferred TypeScript types (`z.infer<typeof productBody>`).

## Try it yourself

Add validation to a `POST /api/orders` endpoint: `items` must be a non-empty array of `{ productId: uuid, qty: int 1–20 }`, `couponCode` optional uppercase alphanumeric up to 12 characters, and `deliveryDate` must be at least tomorrow.
