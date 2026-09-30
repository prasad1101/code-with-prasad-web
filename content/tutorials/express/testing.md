API tests exercise your routes the way real clients do — through HTTP — and catch regressions in status codes, validation and authorisation. We'll use **Vitest** (or Node's test runner) with **Supertest**.

## Setup

```bash
npm install -D vitest supertest mongodb-memory-server
```

```json
{ "scripts": { "test": "vitest run", "test:watch": "vitest" } }
```

## Make the app testable

Export a factory that builds the app **without** calling `listen`, and inject dependencies where practical:

```js
// src/app.js
export function createApp({ logger = defaultLogger } = {}) {
  const app = express()
  // …middleware and routes…
  return app
}
```

Supertest starts the app on an ephemeral port for each request, so no real server is needed.

## Database per test run

```js
// test/setup.js
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, beforeAll, beforeEach } from 'vitest'

let mongo

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections()
  await Promise.all(collections.map((c) => c.deleteMany({})))
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})
```

```js
// vitest.config.js
export default { test: { setupFiles: ['test/setup.js'], env: { JWT_SECRET: 'test-secret' } } }
```

## Testing routes

```js
// test/products.test.js
import request from 'supertest'
import { describe, expect, it, beforeEach } from 'vitest'
import { createApp } from '../src/app.js'
import { createUserAndToken } from './helpers.js'

const app = createApp()

describe('POST /api/products', () => {
  let adminToken, customerToken

  beforeEach(async () => {
    adminToken = (await createUserAndToken({ role: 'admin' })).token
    customerToken = (await createUserAndToken({ role: 'customer' })).token
  })

  it('creates a product as admin', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Notebook', price: 120, category: 'stationery' })

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ name: 'Notebook', price: 120 })
    expect(res.headers.location).toMatch(/\/api\/products\//)
  })

  it('rejects invalid input with details', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'N', price: -5 })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_FAILED')
    expect(res.body.error.details.map((d) => d.path)).toEqual(expect.arrayContaining(['name', 'price']))
  })

  it('requires authentication', async () => {
    const res = await request(app).post('/api/products').send({})
    expect(res.status).toBe(401)
  })

  it('forbids customers', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Notebook', price: 120, category: 'stationery' })
    expect(res.status).toBe(403)
  })
})
```

Test helpers keep tests short:

```js
// test/helpers.js
import jwt from 'jsonwebtoken'
import { User } from '../src/users/user.model.js'

export async function createUserAndToken({ role = 'customer' } = {}) {
  const user = await User.create({ email: `${crypto.randomUUID()}@test.dev`, name: 'Test', passwordHash: 'x', role })
  const token = jwt.sign({ sub: String(user._id), role }, process.env.JWT_SECRET, { issuer: 'code-with-prasad-api' })
  return { user, token }
}
```

## Unit-testing services with fakes

Business rules are faster to test without HTTP or a database:

```js
import { vi, it, expect } from 'vitest'
import { createOrderService } from '../src/orders/orders.service.js'

it('rejects orders when stock is insufficient', async () => {
  const products = { reserveStock: vi.fn().mockResolvedValue(false) }
  const service = createOrderService({ products, orders: { insert: vi.fn() } })
  await expect(service.place('u1', [{ productId: 'p1', qty: 5 }])).rejects.toThrow('Not enough stock')
})
```

## What to cover for each endpoint

- ✅ Happy path (correct status, body shape, headers)
- ✅ Validation errors (400 with details)
- ✅ Authentication (401) and authorisation (403, including another user's resource)
- ✅ Not found (404) and conflicts (409)
- ✅ Edge cases: pagination limits, empty lists, boundary values

## Mocking external services

Don't call real payment gateways or email providers in tests. Inject clients and pass fakes, or intercept HTTP with tools like `nock` or MSW for Node.

## Running in CI

```yaml
- run: npm ci
- run: npm run lint
- run: npm test
```

`mongodb-memory-server` downloads a MongoDB binary on first run — cache it in CI, or use a MongoDB service container instead.

## Try it yourself

Write the full test suite for your products API: listing with pagination and filters, get by id (200/400/404), create (201/400/401/403), update and delete — then deliberately break a validation rule and watch the right test fail.
