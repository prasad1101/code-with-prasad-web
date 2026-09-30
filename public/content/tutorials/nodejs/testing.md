Well-tested Node.js services can be refactored and deployed with confidence. This lesson covers unit tests, API integration tests, and testing with real databases.

## The built-in test runner

Node ships a test runner — no dependencies needed:

```js
// src/pricing.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { applyCoupon } from './pricing.js'

describe('applyCoupon', () => {
  it('applies a percentage discount', () => {
    assert.equal(applyCoupon(1000, { type: 'percent', value: 10 }), 900)
  })

  it('never goes below zero', () => {
    assert.equal(applyCoupon(100, { type: 'flat', value: 500 }), 0)
  })

  it('rejects unknown coupon types', () => {
    assert.throws(() => applyCoupon(100, { type: 'bogus' }), /Unknown coupon type/)
  })
})
```

```bash
node --test                          # finds *.test.js files
node --test --watch                  # re-run on change
node --test --experimental-test-coverage
```

Vitest and Jest are popular alternatives with richer mocking, snapshot testing and TypeScript support; the concepts are the same.

## Mocking

```js
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'
import { createOrderService } from './orders.service.js'

test('sends a confirmation after placing an order', async () => {
  const repo = { insert: mock.fn(async (o) => ({ ...o, id: 'o-1' })) }
  const mailer = { send: mock.fn(async () => {}) }
  const service = createOrderService({ repo, mailer })

  await service.place({ userEmail: 'a@b.com', items: [{ sku: 'pen', qty: 1 }] })

  assert.equal(mailer.send.mock.callCount(), 1)
  assert.deepEqual(mailer.send.mock.calls[0].arguments, ['a@b.com', 'Order o-1 confirmed'])
})
```

Dependency injection (passing `repo` and `mailer` in) makes this easy — no module-mocking tricks required.

Fake timers:

```js
test('expires sessions after 30 minutes', (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'] })
  const session = createSession()
  t.mock.timers.tick(30 * 60 * 1000)
  assert.equal(session.isExpired(), true)
})
```

## Testing HTTP APIs

Test routes end to end through the HTTP layer. With Express, **Supertest** sends requests to the app without opening a real port:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'

test('POST /users validates the email', async () => {
  const app = createApp({ db: fakeDb() })
  const res = await request(app).post('/users').send({ email: 'not-an-email' })
  assert.equal(res.status, 400)
  assert.match(res.body.error, /email/i)
})
```

Exporting a `createApp()` factory (separate from the file that calls `listen`) makes the app testable and lets tests inject dependencies.

## Integration tests with a real database

Mocks can't tell you whether your queries actually work. For repository and API tests, run against a real database:

- **Testcontainers** starts a throwaway MongoDB/PostgreSQL in Docker for the test run.
- **mongodb-memory-server** runs an in-memory MongoDB for fast tests.
- Or a dedicated test database started by `docker compose` in CI.

```js
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient } from 'mongodb'
import { before, after, beforeEach } from 'node:test'

let mongo, client, db
before(async () => {
  mongo = await MongoMemoryServer.create()
  client = await MongoClient.connect(mongo.getUri())
  db = client.db('test')
})
beforeEach(() => db.dropDatabase())   // isolate tests
after(async () => { await client.close(); await mongo.stop() })
```

## What to test where

| Layer | Test type | Dependencies |
| --- | --- | --- |
| Pure logic (pricing, validation, mapping) | Unit | None |
| Services (business rules) | Unit with fakes | Injected fakes |
| Repositories (queries) | Integration | Real database |
| Routes (status codes, validation, auth) | API integration | App + real or fake DB |
| Critical flows (sign up → order → pay) | End-to-end | Everything, few tests |

## Good habits

- Test **behaviour**, not implementation details.
- Each test sets up its own data; never depend on test order.
- Cover error paths: invalid input, not found, upstream failure, timeouts.
- Keep tests fast so developers actually run them; run the slower integration suite in CI.
- Run tests on every pull request, along with linting and type-checking.

## Try it yourself

For a small Express or raw-HTTP API with `GET /products/:id` and `POST /products`:

1. Unit test the validation function.
2. API test the 201, 400 and 404 responses with Supertest.
3. Run the repository tests against `mongodb-memory-server`.
