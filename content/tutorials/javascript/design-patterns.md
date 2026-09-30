Design patterns are named, reusable solutions to recurring problems. In JavaScript, many classic patterns become simpler thanks to first-class functions, closures and modules. Here are the ones you'll actually meet in real code bases and interviews.

## Module pattern

Encapsulate private state and expose a public API. With ES modules, the file *is* the module:

```js
// idGenerator.js
let next = 1               // private to the module
export const nextId = () => next++
```

Before ES modules, the same effect came from an IIFE returning an object — you'll still see it in older code.

## Singleton

One shared instance. ES modules are evaluated once, so exporting an instance is enough:

```js
// db.js
import { MongoClient } from 'mongodb'
export const client = new MongoClient(process.env.MONGO_URL)
```

Singletons are global state in disguise — they make testing harder. Prefer passing dependencies explicitly where practical.

## Factory

A function that creates objects, hiding which concrete type is created:

```js
function createNotifier(channel) {
  switch (channel) {
    case 'email': return { send: (to, msg) => sendEmail(to, msg) }
    case 'sms': return { send: (to, msg) => sendSms(to, msg) }
    default: throw new Error(`Unknown channel: ${channel}`)
  }
}

createNotifier(user.preferredChannel).send(user.contact, 'Your order shipped')
```

## Observer / Pub-Sub

Objects subscribe to events and get notified when they happen. DOM events, Node's `EventEmitter` and RxJS are all built on this idea:

```js
class Emitter {
  #handlers = new Map()

  on(event, handler) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set())
    this.#handlers.get(event).add(handler)
    return () => this.#handlers.get(event).delete(handler) // unsubscribe
  }

  emit(event, payload) {
    this.#handlers.get(event)?.forEach((h) => h(payload))
  }
}

const cart = new Emitter()
const off = cart.on('change', (items) => console.log(`${items.length} items`))
cart.emit('change', [1, 2])
off()
```

Returning an unsubscribe function prevents the memory leaks covered in the performance lesson.

## Strategy

Swap algorithms at runtime by passing them in — in JavaScript, a strategy is usually just a function:

```js
const shippingStrategies = {
  standard: (order) => (order.total > 500 ? 0 : 50),
  express: (order) => 150,
  international: (order) => 400 + order.weightKg * 100,
}

const shippingCost = (order) => shippingStrategies[order.shipping](order)
```

This replaces long `if/else` or `switch` chains and makes adding a new option a one-line change.

## Decorator

Add behaviour to a function or object without changing it:

```js
const withRetry = (fn, retries = 2) => async (...args) => {
  for (let i = 0; ; i++) {
    try {
      return await fn(...args)
    } catch (e) {
      if (i >= retries) throw e
    }
  }
}

const withTiming = (fn) => async (...args) => {
  const start = performance.now()
  try {
    return await fn(...args)
  } finally {
    console.log(`${fn.name} took ${(performance.now() - start).toFixed(1)} ms`)
  }
}

const getUser = withTiming(withRetry(fetchUser))
```

Express middleware and React higher-order components are decorators too.

## Adapter

Make an incompatible interface fit the one your code expects:

```js
// Your app expects: storage.get(key) / storage.set(key, value) returning promises
const localStorageAdapter = {
  get: async (key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
  set: async (key, value) => localStorage.setItem(key, JSON.stringify(value)),
}

const redisAdapter = (redis) => ({
  get: async (key) => JSON.parse((await redis.get(key)) ?? 'null'),
  set: (key, value) => redis.set(key, JSON.stringify(value)),
})
```

The rest of the app depends only on `get`/`set`, so storage backends are interchangeable — and tests can pass an in-memory adapter.

## Facade

Offer one simple interface over a complex subsystem:

```js
export async function checkout(cart, user) {
  const order = await orders.create(cart, user)
  await payments.charge(order.total, user.paymentMethod)
  await inventory.reserve(order.items)
  await email.sendConfirmation(user.email, order)
  return order
}
```

## Dependency injection

Pass collaborators in instead of importing them directly. It's the simplest way to make code testable:

```js
export function createUserService({ db, mailer, clock = Date }) {
  return {
    async register(email) {
      const user = await db.users.insert({ email, createdAt: clock.now() })
      await mailer.send(email, 'Welcome!')
      return user
    },
  }
}

// In tests
const service = createUserService({ db: fakeDb, mailer: { send: vi.fn() }, clock: { now: () => 0 } })
```

Angular and NestJS have DI containers built in; in plain JavaScript, factory functions like this are usually enough.

## Choosing patterns wisely

Patterns are tools, not goals. Reach for one when you feel the problem it solves — duplicated conditionals (Strategy), tangled cross-cutting concerns (Decorator), untestable hard-wired dependencies (DI) — not in advance.

## Try it yourself

Build a small notification system: an `Emitter` for order events, a factory that creates email/SMS/push senders, a strategy map choosing the channel from user preferences, and a `withRetry` decorator around each sender.
