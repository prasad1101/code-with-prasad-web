## What is Express.js and why is it used?
Level: Beginner | Tags: basics

Express is a minimal, unopinionated web framework for Node.js. It wraps Node's `http` module with:

- **Routing** by HTTP method and path, with parameters.
- **Middleware** — a pipeline of functions for parsing, auth, logging, errors.
- **Convenient request/response helpers** (`req.params`, `req.query`, `res.json`, `res.status`).

It's the most widely used Node.js framework, the "E" in MEAN/MERN, and the foundation for many others (NestJS can run on it). Being minimal, it leaves structure, validation and security choices to you.

## What is middleware in Express? Give examples.
Level: Beginner | Tags: middleware

Middleware functions have the signature `(req, res, next)`. They run in registration order and can modify `req`/`res`, end the request by sending a response, or call `next()` to continue.

Examples:

- Built-in: `express.json()`, `express.urlencoded()`, `express.static()`.
- Third-party: `helmet`, `cors`, `compression`, `morgan`/`pino-http`, `express-rate-limit`, `multer`.
- Custom: authentication, request IDs, timing, feature flags.

Error-handling middleware has four arguments: `(err, req, res, next)`.

## What is the difference between `app.use()` and `app.get()`?
Level: Beginner | Tags: routing, middleware

- `app.use(path?, fn)` mounts middleware for **all HTTP methods**, matching any path that **starts with** the given prefix (default `/`). The prefix is stripped from `req.path` inside mounted routers.
- `app.get(path, fn)` handles only **GET** requests whose path **matches exactly** (with parameters).

`app.use` is for middleware and routers; `app.get/post/…` are for endpoints.

## How do route parameters and query strings differ?
Level: Beginner | Tags: routing

- **Route parameters** are part of the path and identify a resource: `/users/:id` → `req.params.id`.
- **Query strings** are optional modifiers after `?`: filtering, sorting, pagination — `/users?role=admin&page=2` → `req.query`.

Both are strings (query values may also be arrays), so validate and convert them. Rule of thumb: identity in the path, options in the query.

## How does error handling work in Express 5 compared to Express 4?
Level: Intermediate | Tags: errors, express5

Errors reach the error-handling middleware `(err, req, res, next)` when a handler throws synchronously or calls `next(err)`.

- **Express 4**: a rejected promise from an `async` handler was **not** caught — it became an unhandled rejection unless you used `try/catch` + `next(err)`, a wrapper, or `express-async-errors`.
- **Express 5**: rejected promises from handlers and middleware are **automatically forwarded** to the error handler.

Best practice in both: throw typed errors (`NotFoundError`, `ValidationError`) from services, and translate them into responses in one central error handler registered after all routes.

## How do you structure a large Express application?
Level: Intermediate | Tags: architecture

- **Feature modules**: `modules/products/{router, service, repository, model, schemas}`.
- **Layers**: routers handle HTTP; services hold business logic (no `req`/`res`); repositories encapsulate database access.
- **Composition root**: build the app in `createApp()` and wire dependencies explicitly (enables testing); start the server in a separate file.
- **Shared** folder for errors, logger, middleware, config.
- Validated configuration, consistent response/error formats, and a central error handler.

For very large teams, NestJS provides this structure (modules, DI, guards, pipes) out of the box.

## How do you validate request data in Express?
Level: Intermediate | Tags: validation

Use a schema library (Zod, Joi, Yup, express-validator) in a reusable middleware that validates `params`, `query` and `body`, returns `400` with details on failure, and exposes the parsed data (e.g. `req.valid.body`).

Important details:

- Use `.strict()` / whitelisting to prevent **mass assignment** of unexpected fields (`role`, `isAdmin`).
- Coerce query/params strings to numbers/dates.
- Keep business validation (unique email, stock available) in services, returning `409`/`422`.

## How do you implement authentication in an Express API?
Level: Intermediate | Tags: auth, jwt

Typical JWT flow:

1. `POST /auth/login` verifies the password with bcrypt/argon2 and returns a short-lived signed access token (and sets a refresh token in an `HttpOnly` cookie).
2. Clients send `Authorization: Bearer <token>`.
3. An `requireAuth` middleware verifies the signature, expiry, issuer and pinned algorithm, then sets `req.user`.
4. `requireRole('admin')` middleware and per-resource ownership checks handle authorisation.

Alternatives: server-side sessions with `express-session` + Redis (revocable, simple), or delegating to an OAuth/OIDC provider and validating its tokens.

## What is the difference between authentication and authorisation?
Level: Beginner | Tags: auth, security

- **Authentication** — verifying *who* the caller is (password, token, SSO). Failure → `401 Unauthorized`.
- **Authorisation** — deciding *what* an authenticated caller may do (roles, ownership, permissions). Failure → `403 Forbidden`.

A common vulnerability is authenticating correctly but forgetting object-level authorisation — e.g. any logged-in user can fetch `/orders/123` belonging to someone else (IDOR).

## What is CORS and how do you configure it in Express?
Level: Intermediate | Tags: cors, security

CORS (Cross-Origin Resource Sharing) is a browser mechanism: a page on `https://app.com` can only read responses from `https://api.com` if the API returns appropriate `Access-Control-Allow-*` headers. For non-simple requests, the browser first sends a preflight `OPTIONS` request.

In Express, use the `cors` package with an explicit allow-list:

```js
app.use(cors({ origin: ['https://app.example.com'], credentials: true }))
```

Don't combine `origin: '*'` with credentials, and don't reflect any origin. CORS doesn't protect the API from non-browser clients — authentication does.

## How do you secure an Express application?
Level: Advanced | Tags: security

- `helmet()` for security headers; disable `x-powered-by`.
- Strict CORS allow-list.
- Rate limiting (global + stricter on auth endpoints), with a shared store for multiple instances.
- Body size limits; schema validation with whitelisting.
- NoSQL/SQL injection prevention (typed validation, parameterised queries, `sanitizeFilter`).
- Password hashing, short-lived tokens, secure cookies (`HttpOnly`, `Secure`, `SameSite`).
- Authorisation checks on every resource.
- `trust proxy` configured correctly behind load balancers.
- Generic error messages; secrets out of code and logs; dependency audits.

## Explain `next()`, `next(err)`, `next('route')` and `next('router')`.
Level: Intermediate | Tags: middleware

- `next()` — continue to the next matching middleware/handler.
- `next(err)` — skip all remaining non-error middleware and jump to the error-handling middleware.
- `next('route')` — skip the remaining handlers of the **current route** and continue matching later routes (only in route handlers, not `app.use`).
- `next('router')` — exit the current router and continue after it.

Calling `next()` after sending a response, or sending twice, causes "Cannot set headers after they are sent".

## How do you handle file uploads in Express?
Level: Intermediate | Tags: uploads

Use `multer` for `multipart/form-data`:

- `upload.single('field')`, `.array()`, `.fields()`.
- Set `limits` (file size, count) and a `fileFilter` for allowed types.
- Verify content (magic bytes), not just the client-supplied mimetype; re-encode images (sharp).
- Generate your own filenames; never trust `originalname` in paths.
- Store in object storage (S3/GCS/Azure) rather than local disk when running multiple instances; for large files, issue pre-signed URLs so clients upload directly.

## How would you implement pagination in an Express + MongoDB API?
Level: Intermediate | Tags: pagination, mongodb

**Offset pagination**: `?page=2&limit=20` → `.skip((page-1)*limit).limit(limit)` plus `countDocuments` for totals. Simple, supports jumping to pages, but slows down for deep pages and can skip/duplicate items when data changes.

**Cursor pagination**: `?after=<lastId>&limit=20` → `find({ _id: { $lt: after } }).sort({ _id: -1 }).limit(limit + 1)`; fetch one extra to know if there's a next page and return `nextCursor`. Consistent performance and stable results — ideal for feeds and infinite scroll.

Always cap `limit` and index the sort field.

## How do you test an Express API?
Level: Intermediate | Tags: testing

- Export `createApp()` (no `listen`) and use **Supertest** to make real HTTP requests against it.
- Use a real test database (`mongodb-memory-server`, Testcontainers) and clean it between tests.
- Unit-test services with fake repositories.
- Cover happy paths plus 400/401/403/404/409 cases for each endpoint.
- Mock external HTTP services (nock/MSW) rather than calling them.
- Run in CI with lint and type checks.

## What are some ways to improve Express API performance?
Level: Advanced | Tags: performance

- Efficient DB access: indexes, `.lean()`, projections, no N+1 queries, `Promise.all` for independent calls.
- Caching: HTTP `Cache-Control`/ETags, CDN, Redis for expensive reads (with invalidation).
- Compression (or at the proxy).
- Cursor pagination and payload limits.
- Don't block the event loop: avoid sync APIs, stream large responses, offload heavy work to queues/workers.
- Fast logging (pino) and fewer middlewares on hot paths.
- Horizontal scaling behind a load balancer; tune keep-alive timeouts.
- Measure with load tests and APM before and after changes.

## What does `app.set('trust proxy', …)` do?
Level: Advanced | Tags: production, security

Behind a reverse proxy or load balancer, the TCP connection comes from the proxy. `trust proxy` tells Express to use `X-Forwarded-For`, `X-Forwarded-Proto` and `X-Forwarded-Host` to determine `req.ip`, `req.protocol`/`req.secure` and `req.hostname`.

Set it to the **exact number** of trusted proxy hops (e.g. `1`) or specific addresses. If it's not set, rate limiting and logging see only the proxy's IP; if set to `true` blindly, clients can spoof their IP by sending their own `X-Forwarded-For` header.

## How do you implement graceful shutdown in an Express server?
Level: Advanced | Tags: production

On `SIGTERM`/`SIGINT`: flip readiness to 503, call `server.close()` to stop accepting connections and wait for in-flight requests, close idle keep-alive connections, then close database/Redis/queue connections and exit. Add a hard timeout (e.g. 15 s) to force exit if something hangs. Run `node` directly in containers so signals are delivered.

## What's the difference between `res.send`, `res.json` and `res.end`?
Level: Beginner | Tags: response

- `res.json(obj)` — serialises to JSON, sets `Content-Type: application/json`.
- `res.send(body)` — sends strings (as HTML by default), Buffers, or objects (delegates to `json`); sets `Content-Length` and ETag.
- `res.end()` — Node's low-level method; ends the response without Express's processing (use for empty bodies or after streaming).

Also: `res.sendStatus(204)`, `res.status(201).json(…)`. Send exactly one response per request.

## How would you version an Express API?
Level: Intermediate | Tags: api-design

Common approaches:

- **URL versioning**: `/api/v1/products`, `/api/v2/products` — mount different routers; explicit and cache-friendly.
- **Header versioning**: `Accept: application/vnd.shop.v2+json` or a custom header — cleaner URLs, harder to test in a browser.

Minimise breaking changes (add fields rather than changing them), deprecate old versions with notice (`Deprecation`/`Sunset` headers), and document with OpenAPI.

## How do you add real-time features to an Express app?
Level: Advanced | Tags: websockets, socket-io

Attach **Socket.IO** (or `ws`) to the same HTTP server:

- Authenticate during the handshake (verify a JWT in `io.use`).
- Use **rooms** (`user:<id>`, `order:<id>`) to target events.
- Emit from REST handlers after state changes.
- Validate and rate-limit incoming events.
- Scale across instances with the Redis adapter; ensure the load balancer supports WebSockets.

For one-way server → client updates, **Server-Sent Events** are a simpler alternative.

## What is the purpose of `express.Router()`?
Level: Beginner | Tags: routing

`Router()` creates a mini-app with its own routes and middleware that can be mounted at a path:

```js
const products = Router()
products.use(requireAuth)
products.get('/', list)
products.get('/:id', get)
app.use('/api/products', products)
```

It keeps route definitions modular (one router per feature), allows router-level middleware, and makes large apps manageable.

## How do you prevent NoSQL injection in an Express + MongoDB app?
Level: Advanced | Tags: security, mongodb

Attackers send query operators in JSON, e.g. `{ "password": { "$ne": null } }`, to bypass checks.

Prevention:

1. Validate input types with schemas (a password must be a string).
2. Build queries from explicitly picked fields, never raw `req.body`/`req.query` objects.
3. Enable Mongoose `sanitizeFilter` (or use `express-mongo-sanitize`) to neutralise `$`-prefixed keys.
4. Avoid `$where` and server-side JavaScript with user input.

## How would you implement request logging and tracing?
Level: Advanced | Tags: observability

- Assign a request ID per request (from `X-Request-Id` or generated), return it in a response header.
- Use structured JSON logging (`pino-http`) including method, path, status, duration and request ID; redact auth headers and secrets.
- Propagate the request ID to downstream calls and logs (e.g. via `AsyncLocalStorage`).
- Add OpenTelemetry tracing for spans across HTTP, database and queue calls, exported to a tracing backend.
- Alert on error rate and latency percentiles.

## What causes "Cannot set headers after they are sent to the client"?
Level: Beginner | Tags: errors, response

The handler tries to send a response (or set headers) after a response has already been sent. Common causes:

- Missing `return` after an early `res.status(404).json(…)`.
- Calling `next()` after sending, so a later handler also responds.
- Sending inside a callback **and** after it.
- Async code responding after a timeout/error handler already responded.

Fix: `return res…` on early exits, ensure each code path sends once, and check `res.headersSent` in error handlers.
