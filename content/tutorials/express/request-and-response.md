Every handler receives a request object and a response object. Express extends Node's versions with convenient properties and methods.

## The request: `req`

```js
app.post('/api/orders/:id/items', (req, res) => {
  req.method        // 'POST'
  req.path          // '/api/orders/42/items'
  req.originalUrl   // including the query string
  req.params.id     // '42'
  req.query         // parsed query string
  req.body          // parsed body (needs body-parsing middleware)
  req.headers       // all headers, lower-cased names
  req.get('Content-Type')
  req.ip            // client IP (configure 'trust proxy' behind load balancers)
  req.cookies       // with the cookie-parser middleware
  req.is('json')    // content-type check
})
```

### Parsing request bodies

Express doesn't parse bodies by default — add the built-in middleware:

```js
app.use(express.json({ limit: '100kb' }))                 // application/json
app.use(express.urlencoded({ extended: false }))          // HTML form posts
```

In Express 5, `req.body` is `undefined` if no parser handled the request — handle that case in validation.

## The response: `res`

### Sending data

```js
res.send('Plain text or HTML')
res.json({ id: 1, name: 'Pen' })        // sets Content-Type: application/json
res.status(201).json(createdProduct)    // status + body
res.sendStatus(204)                     // status with default text body
res.end()                               // end without a body
```

Always send **exactly one** response per request. Sending twice throws "Cannot set headers after they are sent" — a common bug when you forget to `return` after an early response:

```js
if (!product) {
  return res.status(404).json({ error: 'Not found' }) // `return` stops execution here
}
res.json(product)
```

### Headers and cookies

```js
res.set('Cache-Control', 'no-store')
res.set({ 'X-Request-Id': req.id, 'X-Powered-By': undefined })
res.cookie('session', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 3600_000 })
res.clearCookie('session')
```

### Redirects and files

```js
res.redirect('/login')
res.redirect(301, 'https://new.example.com')

res.sendFile(path.join(import.meta.dirname, '../public/terms.pdf'))
res.download('/reports/2026-09.csv', 'september-report.csv')
```

### Content negotiation

```js
res.format({
  'application/json': () => res.json(report),
  'text/csv': () => res.type('csv').send(toCsv(report)),
  default: () => res.status(406).send('Not Acceptable'),
})
```

## Status codes to use

| Situation | Status |
| --- | --- |
| Successful read | `200 OK` |
| Resource created | `201 Created` (+ `Location` header) |
| Success with no body (delete) | `204 No Content` |
| Invalid input | `400 Bad Request` |
| Not logged in / bad token | `401 Unauthorized` |
| Logged in but not allowed | `403 Forbidden` |
| Resource doesn't exist | `404 Not Found` |
| Duplicate / state conflict | `409 Conflict` |
| Semantically invalid entity | `422 Unprocessable Entity` |
| Rate limit | `429 Too Many Requests` |
| Unexpected server error | `500 Internal Server Error` |

## A consistent response format

Agree on one shape for success and errors, and stick to it:

```js
// Success
res.json({ data: products, meta: { page: 1, total: 120 } })

// Error
res.status(400).json({
  error: { code: 'VALIDATION_FAILED', message: 'Invalid request body', details: [...] },
})
```

Consistent formats make front-end code and API clients much simpler.

## `res.locals`

`res.locals` carries data for the current request between middleware (for example, a request ID or the authenticated user) without polluting `req`:

```js
app.use((req, res, next) => {
  res.locals.requestId = crypto.randomUUID()
  next()
})
```

## Try it yourself

Create `POST /api/contact` that accepts JSON `{ name, email, message }`, returns `400` with a descriptive error if any field is missing, `201` with the saved message (plus a generated `id` and `createdAt`) otherwise, and sets a `Location: /api/contact/:id` header.
