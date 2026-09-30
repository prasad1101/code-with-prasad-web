Express is minimal by design, which means security is your job. This lesson assembles a production-grade security setup: headers, CORS, rate limiting, input sanitisation and safe defaults.

## Security headers with Helmet

```bash
npm install helmet
```

```js
import helmet from 'helmet'

app.use(helmet())
app.disable('x-powered-by') // Helmet already removes it; shown for clarity
```

Helmet sets headers such as `Content-Security-Policy`, `Strict-Transport-Security` (HSTS), `X-Content-Type-Options: nosniff`, `Referrer-Policy` and `Cross-Origin-*` policies. For a pure JSON API, the defaults are fine; if Express also serves HTML, tune the CSP to your front end.

## CORS

Browsers block cross-origin requests unless the server allows them. Allow **only** your front-end origins:

```js
import cors from 'cors'

const allowed = new Set(process.env.CORS_ORIGINS.split(','))

app.use(cors({
  origin(origin, cb) {
    // allow same-origin/server-to-server requests (no Origin header) and listed origins
    if (!origin || allowed.has(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,             // needed if the browser sends cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  maxAge: 600,                   // cache preflight responses for 10 minutes
}))
```

Remember: CORS protects **users' browsers**, not your API. Anyone can still call your API with `curl` — authentication and authorisation are what protect data.

## Rate limiting

```bash
npm install express-rate-limit
```

```js
import rateLimit from 'express-rate-limit'

app.use('/api', rateLimit({
  windowMs: 60_000,
  limit: 300,                    // requests per window per IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}))

export const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  keyGenerator: (req) => `${req.ip}:${req.body?.email ?? ''}`,
  message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts, try again later' } },
})
```

With multiple instances, use a shared store (e.g. `rate-limit-redis`) so limits apply across all of them.

## Trust proxy

Behind a load balancer or reverse proxy, `req.ip` is the proxy's IP unless you tell Express to trust it — which would make rate limiting useless:

```js
app.set('trust proxy', 1) // trust the first proxy hop
```

Set it to the exact number of proxies in front of the app; trusting everything lets clients spoof their IP with `X-Forwarded-For`.

## Body size limits

```js
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: false, limit: '100kb' }))
```

Large bodies can exhaust memory and CPU (JSON parsing is synchronous).

## NoSQL injection

Mongo query operators in user input can bypass logic:

```js
// POST /login  { "email": "admin@shop.com", "password": { "$ne": "" } }
```

Defences, in order of importance:

1. **Validate types** with schemas — `password: z.string()` rejects objects.
2. Never pass `req.body` or `req.query` objects straight into queries — pick known fields.
3. Enable Mongoose's `sanitizeFilter`:

```js
mongoose.set('sanitizeFilter', true) // wraps $-prefixed keys in user-provided filters with $eq
```

## Cookies

```js
res.cookie('refreshToken', token, {
  httpOnly: true,      // not readable by JavaScript
  secure: true,        // HTTPS only
  sameSite: 'strict',  // not sent on cross-site requests (CSRF protection)
  path: '/api/auth/refresh',
  maxAge: 7 * 24 * 3600_000,
})
```

If you authenticate with cookies and use `sameSite: 'none'`, you need CSRF tokens.

## Other essentials

- **Authorisation on every route** — check roles and resource ownership (see the auth lesson).
- **Generic error messages** — never leak stack traces or database errors in responses.
- **Timeouts** — on outbound HTTP calls and database queries.
- **Dependency hygiene** — `npm audit`, automated updates, a committed lockfile, `npm ci` in builds.
- **Secrets** — environment variables or a secrets manager; `.env` in `.gitignore`.
- **HTTPS everywhere** — terminate TLS at the load balancer and enable HSTS.
- **Logging** — log authentication failures and permission denials (without secrets) for incident response.

## A hardened app setup

```js
export function createApp() {
  const app = express()
  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors(corsOptions))
  app.use(express.json({ limit: '100kb' }))
  app.use(requestId)
  app.use(httpLogger)
  app.use('/api', apiLimiter)

  app.use('/api/auth', authRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/orders', requireAuth, ordersRouter)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
```

## Try it yourself

Harden your API: add Helmet, a strict CORS allow-list from an environment variable, a global rate limit plus a stricter login limiter, `trust proxy`, and body limits. Then verify each with `curl` — a disallowed `Origin`, the 6th login attempt, a 1 MB JSON body, and a `{"$gt": ""}` password.
