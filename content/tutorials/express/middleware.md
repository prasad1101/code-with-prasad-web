**Middleware** is the heart of Express. A middleware is a function that runs during request processing and can read or modify the request and response, end the request, or pass control to the next function.

## Anatomy of a middleware

```js
function requestLogger(req, res, next) {
  const start = performance.now()
  res.on('finish', () => {
    const ms = (performance.now() - start).toFixed(1)
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms} ms)`)
  })
  next() // hand over to the next middleware/route
}

app.use(requestLogger)
```

A middleware must either **send a response** or **call `next()`** — otherwise the request hangs forever.

## Where middleware applies

```js
app.use(fn)                       // every request
app.use('/api', fn)               // paths starting with /api
router.use(fn)                    // every route in this router
app.get('/admin', requireAdmin, handler)   // one route (route-level middleware)
app.post('/upload', [auth, rateLimit, upload], handler) // several, in order
```

## Order matters

Middleware runs in registration order:

```js
app.use(helmet())                 // 1. security headers
app.use(cors(corsOptions))        // 2. CORS
app.use(express.json())           // 3. parse bodies before routes need them
app.use(requestLogger)            // 4. logging
app.use('/api', apiRouter)        // 5. routes
app.use(notFoundHandler)          // 6. nothing matched
app.use(errorHandler)             // 7. errors (always last)
```

A common bug: registering `express.json()` *after* the routes, so `req.body` is `undefined`.

## Writing configurable middleware

Return a middleware from a factory function:

```js
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

app.delete('/api/products/:id', requireRole('admin'), deleteProduct)
```

## Async middleware

In Express 5, `async` middleware and handlers can simply throw — the rejection is forwarded to the error handler:

```js
async function loadUser(req, res, next) {
  const token = req.get('Authorization')?.replace('Bearer ', '')
  req.user = token ? await verifyToken(token) : null  // a rejection goes to the error handler
  next()
}
```

## Skipping to the next route

`next('route')` skips the remaining handlers of the current route; `next('router')` exits the current router. Rarely needed, but useful for conditional routing.

## Common built-in and third-party middleware

| Middleware | Purpose |
| --- | --- |
| `express.json()` / `express.urlencoded()` | Parse request bodies |
| `express.static('public')` | Serve static files |
| `helmet` | Security headers |
| `cors` | Cross-origin resource sharing |
| `compression` | Gzip/Brotli responses |
| `cookie-parser` | Parse cookies |
| `express-rate-limit` | Rate limiting |
| `morgan` / `pino-http` | HTTP request logging |
| `multer` | Multipart file uploads |

## Serving static files

```js
app.use(express.static(path.join(import.meta.dirname, '../public'), {
  maxAge: '7d',        // cache headers
  index: 'index.html',
}))
```

For a single-page app, serve `index.html` for unknown non-API routes:

```js
app.get('/*splat', (req, res) => res.sendFile(path.join(publicDir, 'index.html')))
```

## Adding request IDs

```js
app.use((req, res, next) => {
  req.id = req.get('X-Request-Id') ?? crypto.randomUUID()
  res.set('X-Request-Id', req.id)
  next()
})
```

Include `req.id` in every log line to trace a request end to end.

## Try it yourself

Write three middleware functions:

1. `timing` — sets an `X-Response-Time` header.
2. `requireApiKey` — checks an `X-API-Key` header against an environment variable and returns 401 otherwise.
3. `maintenanceMode` — returns 503 for all requests when `process.env.MAINTENANCE === 'true'`, except `/health`.

Register them in the right order and test with `curl`.
