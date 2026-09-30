A Node.js API is exposed to the whole internet. This lesson is a practical checklist of the vulnerabilities that matter most for back-end JavaScript — many map directly to the **OWASP Top 10**.

## 1. Validate all input

Treat every request field — body, query string, params, headers, cookies — as hostile. Validate type, format, length and range with a schema, and reject everything else:

```js
import { z } from 'zod'

const CreateUser = z.object({
  email: z.string().email().max(254),
  name: z.string().trim().min(1).max(100),
  age: z.number().int().min(13).max(130).optional(),
}).strict() // reject unexpected fields

const input = CreateUser.parse(req.body)
```

Set **size limits** on request bodies and uploads to prevent memory exhaustion.

## 2. Injection

### NoSQL injection

```js
// Vulnerable: body { "email": "a@b.com", "password": { "$ne": null } } bypasses the check
const user = await users.findOne({ email: req.body.email, password: req.body.password })
```

Validate that fields are strings (schema validation does this), never pass raw request objects into queries, and consider Mongoose's `sanitizeFilter` or `express-mongo-sanitize`.

### SQL injection

Always use parameterised queries — never string concatenation:

```js
await pool.query('SELECT * FROM users WHERE email = $1', [email])
```

### Command injection

Use `execFile`/`spawn` with argument arrays, never `exec` with user data (see the child processes lesson).

## 3. Authentication done right

- **Hash passwords** with a slow, salted algorithm — `bcrypt`, `scrypt` or `argon2`. Never store plain text or fast hashes like SHA-256.

```js
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
const scryptAsync = promisify(scrypt)

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':')
  const hash = await scryptAsync(password, Buffer.from(saltHex, 'hex'), 64)
  return timingSafeEqual(hash, Buffer.from(hashHex, 'hex'))
}
```

- **Rate-limit** login, signup and password-reset endpoints to stop brute force and credential stuffing.
- **Generic errors**: "Invalid email or password" — don't reveal which one was wrong.
- **JWTs**: sign with a strong secret or asymmetric key, set short expiries, validate `alg`, `iss`, `aud` and `exp`, and never put secrets inside the payload (it's only base64-encoded).
- **Sessions/cookies**: `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`.

## 4. Authorisation on every request

Authentication says *who* you are; authorisation says *what you may do*. Check ownership and roles on the server for every resource:

```js
const order = await Orders.findById(req.params.id)
if (!order) return res.sendStatus(404)
if (order.userId !== req.user.id && req.user.role !== 'admin') return res.sendStatus(403)
```

Missing object-level checks (**IDOR** — insecure direct object reference) is one of the most common API vulnerabilities: users simply change an ID in the URL.

## 5. Secure HTTP headers and CORS

```js
import helmet from 'helmet'
import cors from 'cors'

app.use(helmet()) // CSP, HSTS, X-Content-Type-Options, frame protection…
app.use(cors({ origin: ['https://app.example.com'], credentials: true }))
```

Never use `origin: '*'` together with credentials, and don't reflect arbitrary origins.

## 6. Protect against abuse

- Rate limiting (per IP and per user) — e.g. `express-rate-limit` with a Redis store.
- Timeouts on requests and outbound calls.
- Pagination limits (`limit` capped at, say, 100).
- Avoid **ReDoS**: don't run complex regexes on unbounded user input.

## 7. Secrets management

- Load secrets from environment variables or a secrets manager — never commit them. Add `.env` to `.gitignore`.
- Different secrets per environment; rotate them.
- Don't log tokens, passwords or full request bodies.

## 8. Dependencies and supply chain

```bash
npm audit
npm ci                     # lockfile-exact installs in CI
npx npm-check-updates      # see what's outdated
```

Enable Dependabot/Renovate, keep dependencies minimal, pin versions via the lockfile, and review new packages before adding them. Node's **permission model** (`node --permission --allow-fs-read=…`) can restrict what a process may access.

## 9. Error handling that doesn't leak

Return generic messages for 500 errors; keep stack traces in logs, not in responses. Set `NODE_ENV=production` so frameworks disable verbose error pages.

## 10. Server-side request forgery (SSRF)

If your server fetches URLs supplied by users (webhooks, image imports), an attacker can make it call internal services (`http://169.254.169.254/` cloud metadata, `http://localhost:6379`). Allow-list domains, block private IP ranges after DNS resolution, and disable redirects or re-validate them.

## Checklist

- [ ] Schema validation and size limits on all input
- [ ] Parameterised queries; no user data in shell commands
- [ ] Strong password hashing, rate-limited auth endpoints
- [ ] Authorisation checks on every resource
- [ ] Helmet, strict CORS, HTTPS everywhere
- [ ] Secrets outside code, not logged
- [ ] `npm audit` and automated updates in CI
- [ ] Generic error responses in production

## Try it yourself

Take an API you've built and try to break it: send `{"$ne": null}` as a password, a 50 MB JSON body, another user's order ID, and 1,000 login attempts in a minute. Fix each issue you find.
