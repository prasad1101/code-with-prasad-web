In a server, one unhandled error can crash the process and drop every in-flight request. Node.js error handling is about **categorising errors**, **handling them in the right place**, and **failing safely** when something truly unexpected happens.

## Operational errors vs. programmer errors

- **Operational errors** are expected in a running system: invalid user input, a missing file, a database timeout, a third-party API returning 503. Handle them: retry, return a 4xx/5xx response, log a warning.
- **Programmer errors** are bugs: reading a property of `undefined`, calling a function with the wrong arguments. You can't reliably "handle" a bug at runtime — log it, return a generic 500, and fix the code. If the process state may be corrupted, restart.

## Error-first callbacks

Older Node APIs pass the error as the first callback argument:

```js
import { readFile } from 'node:fs'

readFile('config.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Could not read config', err)
    return
  }
  console.log(JSON.parse(data))
})
```

Always check `err` first. Convert callback APIs to promises with `util.promisify`, or use the `node:*/promises` variants.

## Promises and async/await

```js
async function getUser(id) {
  const user = await db.users.findOne({ id })
  if (!user) throw new NotFoundError(`User ${id} not found`)
  return user
}
```

Errors propagate up through `await` like synchronous exceptions. The danger is **promises nobody awaits**:

```js
// Fire-and-forget: if sendEmail rejects, it's an unhandled rejection → the process crashes
sendEmail(user)

// Handle it explicitly if you really don't want to wait
sendEmail(user).catch((err) => logger.warn({ err }, 'Welcome email failed'))
```

## Custom error classes

```js
export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL', cause } = {}) {
    super(message, { cause })
    this.name = this.constructor.name
    this.status = status
    this.code = code
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, { status: 404, code: 'NOT_FOUND' })
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, { status: 400, code: 'VALIDATION_FAILED' })
    this.details = details
  }
}
```

Throw specific errors in business logic; translate them into HTTP responses in **one** central place (the Express course shows an error-handling middleware).

## Adding context with `cause`

```js
try {
  await paymentGateway.charge(order.total)
} catch (err) {
  throw new AppError(`Payment failed for order ${order.id}`, { status: 502, code: 'PAYMENT_FAILED', cause: err })
}
```

The original error (with its stack) is preserved for logs, while callers get a meaningful message.

## Retrying transient failures

Network calls and databases fail transiently. Retry **idempotent** operations with backoff and a limit (see the Promise Patterns lesson in the JavaScript course), and give up with a clear error.

## Timeouts everywhere

An operation that never finishes is worse than one that fails — it ties up memory and connections:

```js
const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
```

Configure timeouts on database drivers, HTTP clients and queue consumers.

## Logging errors properly

Log the **whole error** (stack, cause, code) with context, as structured JSON in production:

```js
import pino from 'pino'
const logger = pino()

logger.error({ err, orderId: order.id, userId: user.id }, 'Checkout failed')
```

Never log secrets, passwords, tokens or full card numbers.

## Crash safely

```js
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — exiting')
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled rejection — exiting')
  process.exit(1)
})
```

After an uncaught exception the process may hold half-updated state or leaked resources. Let it exit and have a process manager (Docker, Kubernetes, PM2) start a fresh one. Run several instances so one crash doesn't cause downtime.

## Try it yourself

Create `AppError`, `NotFoundError` and `ValidationError`. Write a `getOrder(id)` function that throws `ValidationError` for malformed ids and `NotFoundError` for unknown ones, and a small HTTP handler that maps them to 400/404/500 responses while logging only the 500s with their stack.
