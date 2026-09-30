A robust API handles failures in **one consistent way**: expected errors become clear 4xx responses, unexpected ones become safe 500s, and everything is logged with enough context to debug.

## How Express handles errors

Any middleware with **four parameters** is an error handler:

```js
app.use((err, req, res, next) => {
  res.status(500).json({ error: { message: 'Something went wrong' } })
})
```

Express routes errors to it when:

- a handler throws synchronously,
- an `async` handler throws or returns a rejected promise (**Express 5**),
- a handler calls `next(err)`.

In **Express 4**, rejected promises were *not* caught — you needed `try/catch` with `next(err)`, a wrapper like `asyncHandler(fn)`, or the `express-async-errors` package. Upgrading to Express 5 removes that boilerplate.

## Custom error classes

```js
// src/errors.js
export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details, cause } = {}) {
    super(message, { cause })
    this.name = this.constructor.name
    this.status = status
    this.code = code
    this.details = details
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, { status: 404, code: 'NOT_FOUND' })
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, { status: 409, code: 'CONFLICT' })
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { status: 401, code: 'UNAUTHORIZED' })
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to do this') {
    super(message, { status: 403, code: 'FORBIDDEN' })
  }
}
```

Services throw these; they never touch `res`:

```js
export async function registerUser(input) {
  if (await Users.exists({ email: input.email })) {
    throw new ConflictError('An account with this email already exists')
  }
  return Users.create(input)
}
```

## The central error handler

```js
// src/middleware/error-handler.js
import { AppError } from '../errors.js'
import { logger } from '../logger.js'

export function notFound(req, res) {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: `No route for ${req.method} ${req.path}` } })
}

export function errorHandler(err, req, res, next) {
  // Malformed JSON from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } })
  }

  // Mongoose: duplicate key and bad ObjectId
  if (err.code === 11000) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Resource already exists', details: err.keyValue } })
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: { code: 'INVALID_ID', message: `Invalid ${err.path}` } })
  }

  const status = err instanceof AppError ? err.status : 500
  if (status >= 500) {
    logger.error({ err, reqId: req.id, path: req.path }, 'Unhandled error')
  }

  if (res.headersSent) return next(err) // let Express close the connection

  res.status(status).json({
    error: {
      code: err instanceof AppError ? err.code : 'INTERNAL_ERROR',
      message: status >= 500 ? 'Something went wrong' : err.message,
      ...(err.details && { details: err.details }),
      requestId: req.id,
    },
  })
}
```

```js
// app.js — after all routes
app.use(notFound)
app.use(errorHandler)
```

Key rules:

- **Never leak internals** (stack traces, SQL, file paths) in 500 responses — log them instead.
- Include a **request ID** so users can report it and you can find the log line.
- If headers are already sent (e.g. a streaming response failed midway), delegate to Express's default handler with `next(err)`.

## Operational vs. programmer errors

- Operational errors (not found, validation, conflicts, upstream timeouts) → 4xx or 503 with a meaningful message.
- Programmer errors (a `TypeError` from a bug) → generic 500, logged with the stack; fix the bug.

## Handling errors from outside Express

Errors thrown in timers, event listeners or un-awaited promises never reach Express. Handle them where they occur, and keep process-level handlers that log and exit:

```js
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled rejection')
  process.exit(1)
})
```

## Testing the error paths

Every endpoint should have tests for its error responses: invalid body (400), missing auth (401), wrong user (403), unknown ID (404), duplicate (409). These are the responses front-end developers depend on.

## Try it yourself

Implement `AppError` subclasses and the central handler. Then make `GET /api/products/:id` return 400 for a malformed ID, 404 for an unknown one, and verify that a deliberate `throw new Error('boom')` in a route returns a generic 500 while the stack appears in the server log.
