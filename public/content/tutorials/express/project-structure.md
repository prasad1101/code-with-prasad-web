Small Express apps fit in one file. Real ones don't. A clear structure makes an API easy to navigate, test and grow — and lets several developers work on it without stepping on each other.

## Feature-based layout

```text
src/
  app.js                        # builds the app: middleware, routers, error handling
  server.js                     # connects to the DB, starts listening, graceful shutdown
  config/
    index.js                    # validated environment config
  shared/
    errors.js                   # AppError and subclasses
    logger.js
    middleware/
      auth.js
      validate.js
      error-handler.js
      request-id.js
  modules/
    auth/
      auth.router.js
      auth.service.js
      auth.schemas.js
    products/
      products.router.js        # HTTP layer
      products.service.js       # business logic
      products.repository.js    # data access
      product.model.js          # Mongoose schema
      products.schemas.js       # Zod request schemas
    orders/
      …
test/
  products.test.js
  helpers.js
```

Each module contains everything for one feature. Adding "coupons" means adding one folder, not touching five technical folders.

## Responsibilities of each layer

**Router (controller)** — HTTP only:

```js
productsRouter.post('/', requireAuth, requireRole('admin'), validate({ body: productBody }), async (req, res) => {
  const product = await productsService.create(req.valid.body, req.user)
  res.status(201).location(`/api/products/${product.id}`).json({ data: product })
})
```

**Service** — business rules, no `req`/`res`:

```js
export function createProductsService({ repo, events }) {
  return {
    async create(input, actor) {
      if (await repo.slugExists(input.slug)) throw new ConflictError('Slug already in use')
      const product = await repo.insert({ ...input, createdBy: actor.id })
      events.emit('product.created', product)
      return product
    },
  }
}
```

**Repository** — the only place that knows about Mongoose:

```js
export function createProductsRepository(Product) {
  return {
    slugExists: (slug) => Product.exists({ slug }).then(Boolean),
    insert: (data) => Product.create(data).then((d) => d.toObject()),
    findById: (id) => Product.findById(id).lean(),
  }
}
```

## The composition root

Wire everything together in one place:

```js
// src/app.js
export function createApp({ models, events, config }) {
  const productsRepo = createProductsRepository(models.Product)
  const productsService = createProductsService({ repo: productsRepo, events })

  const app = express()
  app.use(express.json({ limit: '100kb' }))
  app.use('/api/products', createProductsRouter({ productsService }))
  app.use(notFound)
  app.use(errorHandler)
  return app
}
```

Benefits: dependencies are visible, tests can swap any piece, and there are no hidden module-level singletons.

## Configuration

```js
// src/config/index.js
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default('http://localhost:4200'),
})

export const config = schema.parse(process.env)
```

## Conventions worth agreeing on

- File naming (`products.service.js`, kebab-case folders).
- A standard response envelope and error format.
- Where validation happens (router), where authorisation happens (router for roles, service for ownership rules).
- Logging fields (`reqId`, `userId`, `module`).
- Lint and format rules enforced in CI.

## TypeScript

For large APIs, TypeScript adds a lot of safety: typed request bodies (inferred from Zod schemas), typed services and repositories, and compile-time checks when a model changes. The structure stays the same.

## When to reach for NestJS

NestJS provides this architecture out of the box — modules, controllers, providers, dependency injection, pipes for validation, guards for auth, interceptors — using decorators and TypeScript. It's a good fit for large teams (and will feel familiar to Angular developers). Express with a clear structure is lighter and gives you more control.

## Try it yourself

Refactor an API where route handlers talk directly to Mongoose into router → service → repository layers with a composition root. Write one service test using a fake repository and confirm it runs without a database.
