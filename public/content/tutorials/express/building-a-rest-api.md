Time to put routing, middleware and responses together. We'll build a complete CRUD API for products with an in-memory store — later lessons add validation, a database and authentication.

## Project structure

```text
src/
  app.js                       # builds the Express app (no listen)
  server.js                    # starts the server
  products/
    products.router.js
    products.service.js
    products.store.js
```

Separating `app.js` from `server.js` lets tests import the app without opening a port.

## The store

```js
// src/products/products.store.js
const products = new Map()

export const store = {
  all: () => [...products.values()],
  get: (id) => products.get(id),
  save: (product) => (products.set(product.id, product), product),
  remove: (id) => products.delete(id),
}
```

## The service

Business rules live here, independent of HTTP:

```js
// src/products/products.service.js
import { store } from './products.store.js'

export class NotFoundError extends Error {
  status = 404
}

export function listProducts({ category, sort = 'name', page = 1, limit = 10 }) {
  let items = store.all()
  if (category) items = items.filter((p) => p.category === category)
  items.sort((a, b) => (a[sort] > b[sort] ? 1 : a[sort] < b[sort] ? -1 : 0))
  const start = (page - 1) * limit
  return { data: items.slice(start, start + limit), meta: { page, limit, total: items.length } }
}

export function getProduct(id) {
  const product = store.get(id)
  if (!product) throw new NotFoundError(`Product ${id} not found`)
  return product
}

export function createProduct({ name, price, category }) {
  const now = new Date().toISOString()
  return store.save({ id: crypto.randomUUID(), name, price, category, createdAt: now, updatedAt: now })
}

export function updateProduct(id, changes) {
  const product = getProduct(id)
  return store.save({ ...product, ...changes, id, updatedAt: new Date().toISOString() })
}

export function deleteProduct(id) {
  getProduct(id)
  store.remove(id)
}
```

## The router

The router translates HTTP into service calls and back:

```js
// src/products/products.router.js
import { Router } from 'express'
import * as service from './products.service.js'

export const productsRouter = Router()

productsRouter.get('/', (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Number(req.query.limit) || 10)
  res.json(service.listProducts({ category: req.query.category, sort: req.query.sort, page, limit }))
})

productsRouter.get('/:id', (req, res) => {
  res.json({ data: service.getProduct(req.params.id) })
})

productsRouter.post('/', (req, res) => {
  const product = service.createProduct(req.body)
  res.status(201).location(`/api/products/${product.id}`).json({ data: product })
})

productsRouter.patch('/:id', (req, res) => {
  res.json({ data: service.updateProduct(req.params.id, req.body) })
})

productsRouter.delete('/:id', (req, res) => {
  service.deleteProduct(req.params.id)
  res.sendStatus(204)
})
```

## The app

```js
// src/app.js
import express from 'express'
import { productsRouter } from './products/products.router.js'

export function createApp() {
  const app = express()
  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (req, res) => res.json({ status: 'ok' }))
  app.use('/api/products', productsRouter)

  app.use((req, res) => res.status(404).json({ error: { message: 'Route not found' } }))

  app.use((err, req, res, next) => {
    const status = err.status ?? 500
    if (status >= 500) console.error(err)
    res.status(status).json({ error: { message: status >= 500 ? 'Internal server error' : err.message } })
  })

  return app
}
```

```js
// src/server.js
import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3000)
createApp().listen(port, () => console.log(`API on http://localhost:${port}`))
```

## Trying it out

```bash
curl -X POST localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Notebook","price":120,"category":"stationery"}'

curl 'localhost:3000/api/products?category=stationery&sort=price'
curl -X PATCH localhost:3000/api/products/<id> -H 'Content-Type: application/json' -d '{"price":99}'
curl -X DELETE -i localhost:3000/api/products/<id>
```

Tools like Postman, Insomnia, Bruno or the VS Code REST Client make this more comfortable.

## What's missing

- **Validation** — `POST` currently accepts anything (next lesson).
- **Persistence** — data disappears on restart (MongoDB lesson).
- **Authentication** — anyone can delete products.
- **PATCH safety** — clients could overwrite fields like `createdAt`; validation will whitelist allowed fields.

## PUT vs. PATCH

- `PUT` **replaces** the entire resource — the client sends every field.
- `PATCH` **partially updates** — only the fields sent change.

Most APIs implement `PATCH` for updates; implement `PUT` only if clients genuinely replace whole resources.

## Idempotency

`GET`, `PUT` and `DELETE` are idempotent: repeating them has the same effect as doing them once. `POST` is not — retrying a `POST /orders` could create two orders. For critical creates, accept an `Idempotency-Key` header and return the original result for repeated keys.

## Try it yourself

Add a `GET /api/products/stats` endpoint returning the count and average price per category — and make sure it's registered so that it isn't captured by `/:id`.
