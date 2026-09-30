Most APIs need to know **who** is calling (authentication) and **what they're allowed to do** (authorisation). This lesson implements registration, login and protected routes with hashed passwords and **JSON Web Tokens (JWTs)**.

## How JWT authentication works

1. The user logs in with email and password.
2. The server verifies the password and returns a **signed token** containing the user's id and role.
3. The client sends the token with each request: `Authorization: Bearer <token>`.
4. The server verifies the signature and expiry — no session lookup needed.

A JWT has three base64url parts: `header.payload.signature`. The payload is **readable by anyone** — never put secrets in it. The signature only proves it wasn't tampered with.

## Setup

```bash
npm install jsonwebtoken bcrypt
```

```text
# .env — use a long random value: node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
JWT_SECRET=replace-with-a-long-random-secret
```

## The User model

```js
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false }, // excluded from queries by default
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  },
  { timestamps: true },
)

export const User = mongoose.model('User', userSchema)
```

## Registration and login

```js
// src/auth/auth.service.js
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../users/user.model.js'
import { ConflictError, UnauthorizedError } from '../errors.js'

const TOKEN_TTL = '15m'

function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_TTL,
    issuer: 'code-with-prasad-api',
  })
}

export async function register({ email, name, password }) {
  if (await User.exists({ email })) throw new ConflictError('Email already registered')
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ email, name, passwordHash })
  return { user: { id: user._id, email, name, role: user.role }, token: signToken(user) }
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash')
  const ok = user && (await bcrypt.compare(password, user.passwordHash))
  if (!ok) throw new UnauthorizedError('Invalid email or password') // same message either way
  return { user: { id: user._id, email: user.email, name: user.name, role: user.role }, token: signToken(user) }
}
```

- `bcrypt.hash(password, 12)` — a cost factor of 12 makes brute-forcing stolen hashes slow.
- The error message doesn't reveal whether the email exists.

## Routes

```js
authRouter.post('/register', validate({ body: registerBody }), async (req, res) => {
  res.status(201).json(await auth.register(req.valid.body))
})

authRouter.post('/login', loginLimiter, validate({ body: loginBody }), async (req, res) => {
  res.json(await auth.login(req.valid.body))
})
```

## The authentication middleware

```js
// src/middleware/auth.js
import jwt from 'jsonwebtoken'
import { ForbiddenError, UnauthorizedError } from '../errors.js'

export function requireAuth(req, res, next) {
  const header = req.get('Authorization') ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) throw new UnauthorizedError()

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'code-with-prasad-api',
    })
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) throw new ForbiddenError()
  next()
}
```

Always pin `algorithms` when verifying, so an attacker can't switch the algorithm.

## Protecting routes

```js
productsRouter.post('/', requireAuth, requireRole('admin'), validate({ body: productBody }), createHandler)

ordersRouter.get('/:id', requireAuth, async (req, res) => {
  const order = await Order.findById(req.params.id).lean()
  if (!order) throw new NotFoundError('Order')
  // Object-level authorisation: users can only see their own orders
  if (String(order.user) !== req.user.id && req.user.role !== 'admin') throw new ForbiddenError()
  res.json({ data: order })
})
```

Checking **ownership** on every resource prevents users reading others' data by changing an ID.

## Short-lived access tokens and refresh tokens

JWTs can't be revoked before they expire (without extra infrastructure), so keep access tokens short (5–15 minutes) and add a **refresh token**:

- Store a long-lived, random refresh token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
- Keep a hash of it in the database, linked to the user and device.
- `POST /auth/refresh` verifies it, **rotates** it (issues a new one, invalidates the old), and returns a new access token.
- Logout deletes the stored refresh token.

## Where should the browser keep the access token?

In memory (a JavaScript variable) is the safest simple option: it's not readable by other tabs and disappears on reload (the refresh cookie gets a new one). `localStorage` is readable by any script on the page, so an XSS bug would expose it.

## Alternatives

- **Server sessions** (`express-session` with a Redis store) — simple, revocable, great for server-rendered apps.
- **OAuth 2.0 / OpenID Connect providers** (Auth0, Cognito, Keycloak, Azure AD) — "Sign in with Google", SSO for enterprises; your API validates the provider's JWTs.

## Try it yourself

Implement register, login and a `GET /api/me` route protected by `requireAuth`. Add a `loginLimiter` (5 attempts per 15 minutes per IP + email), and write tests for: correct login, wrong password, expired token (use a 1-second expiry), and a customer trying to create a product (403).
