As a Node.js service grows, structure matters more than any single technique. This lesson covers proven ways to organise code, and when (and when not) to split into microservices.

## Layered architecture

Separate the code by responsibility:

```text
src/
  app.js                 # creates the Express app, wires middleware and routes
  server.js              # starts listening, handles shutdown
  config/                # validated configuration
  modules/
    orders/
      orders.routes.js       # HTTP: parse request, call service, format response
      orders.service.js      # business rules, no HTTP or DB details
      orders.repository.js   # data access (Mongo/SQL queries)
      orders.schemas.js      # validation schemas / DTOs
      orders.test.js
    users/
      …
  shared/                # logger, errors, middleware, utilities
```

- **Routes/controllers** know about HTTP (status codes, headers) but not about the database.
- **Services** contain the business logic; they're plain functions/classes you can unit test.
- **Repositories** hide the database; swapping Mongoose for another client touches only this layer.

Organising by **feature (module)** rather than by technical type (`controllers/`, `services/`, `models/` at the top level) keeps related code together and scales better as the team grows.

## Dependency injection without a framework

Create modules with factory functions that receive their dependencies:

```js
// orders.service.js
export function createOrderService({ ordersRepo, inventory, payments, events }) {
  return {
    async place(userId, items) {
      await inventory.reserve(items)
      const order = await ordersRepo.insert({ userId, items, status: 'pending' })
      await payments.charge(order)
      events.emit('order.placed', order)
      return order
    },
  }
}

// app.js — the composition root
const ordersRepo = createOrdersRepository(db)
const orderService = createOrderService({ ordersRepo, inventory, payments, events })
app.use('/orders', createOrdersRouter({ orderService }))
```

Everything is explicit, and tests pass fakes. NestJS provides the same idea with decorators and a DI container, plus conventions that help large teams.

## Designing good APIs

- Resource-oriented URLs: `GET /orders`, `GET /orders/:id`, `POST /orders`, `PATCH /orders/:id`.
- Consistent error format: `{ "error": { "code": "VALIDATION_FAILED", "message": "…", "details": […] } }`.
- Pagination (cursor-based for large, changing collections), filtering and sorting via query parameters.
- Versioning strategy (`/v1/…` or headers) before the first external consumer appears.
- An **OpenAPI** specification, generated from your schemas or written first, so clients can generate typed SDKs.
- **Idempotency keys** for operations like payments, so retries don't charge twice.

## Monolith first

A well-structured **modular monolith** — one deployable service with clear internal module boundaries — is the right starting point for most products:

- Simple deployment, debugging and transactions.
- Refactoring across modules is easy.
- Modules can be extracted into services later if a real need appears.

## When microservices make sense

Split a service out when there's a concrete reason:

- **Independent scaling** — one part has very different load (e.g. image processing).
- **Team autonomy** — separate teams need to deploy independently.
- **Different technology or reliability needs** — a component needs another language, or must stay up when others fail.

Costs you take on: network calls that fail, distributed data and no cross-service transactions, versioned APIs, service discovery, distributed tracing, and much more operational work.

## Communication between services

- **Synchronous** (HTTP/REST, gRPC) — simple request/response; creates runtime coupling. Use timeouts, retries with backoff, and circuit breakers.
- **Asynchronous** (events over Kafka, RabbitMQ, SQS) — services react to events like `order.placed`; more resilient and decoupled, but eventually consistent.

### Keeping data consistent

Each service owns its data. For workflows spanning services, use a **saga**: a sequence of local transactions with compensating actions (e.g. refund if shipping fails). Use the **outbox pattern** — write the event to an `outbox` table/collection in the same transaction as the data change, and publish it from there — so you never update the database without publishing the event, or vice versa.

## Resilience patterns

- **Timeouts** on every network call.
- **Retries** with exponential backoff and jitter, only for idempotent operations.
- **Circuit breakers** stop calling a failing dependency for a while (e.g. `opossum`).
- **Bulkheads** — separate connection pools/queues so one slow dependency can't exhaust all resources.
- **Graceful degradation** — show cached or partial data when a non-critical dependency is down.

## Architecture decision records

Write short ADRs for significant decisions ("Use MongoDB for the catalogue", "Split notifications into a separate service"): the context, the decision and its consequences. Future team members will thank you.

## Try it yourself

Take a small Express app with all logic in route handlers and refactor it into routes → service → repository layers with a composition root. Then write unit tests for the service using fake repositories, and note which tests became easier to write.
