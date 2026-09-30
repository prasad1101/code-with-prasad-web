Tests let you change code with confidence. Good tests catch regressions, document behaviour and make refactoring safe. This lesson uses **Vitest** (the API is almost identical to Jest) and Node's built-in test runner.

## The testing pyramid

- **Unit tests** — a single function or module in isolation. Fast, many of them.
- **Integration tests** — several parts together: an API route with a real database, a component with its child components.
- **End-to-end (E2E) tests** — the whole app in a real browser (Playwright, Cypress). Slow, few of them, covering critical user journeys.

## Setting up Vitest

```bash
npm install -D vitest
```

```json
{ "scripts": { "test": "vitest" } }
```

## A first test

```js
// cart.js
export function cartTotal(items, { discount = 0 } = {}) {
  if (discount < 0 || discount > 1) throw new RangeError('discount must be between 0 and 1')
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  return Math.round(subtotal * (1 - discount) * 100) / 100
}
```

```js
// cart.test.js
import { describe, expect, it } from 'vitest'
import { cartTotal } from './cart.js'

describe('cartTotal', () => {
  it('sums price × quantity', () => {
    expect(cartTotal([{ price: 10, qty: 2 }, { price: 5, qty: 1 }])).toBe(25)
  })

  it('returns 0 for an empty cart', () => {
    expect(cartTotal([])).toBe(0)
  })

  it('applies a discount', () => {
    expect(cartTotal([{ price: 100, qty: 1 }], { discount: 0.15 })).toBe(85)
  })

  it('rejects invalid discounts', () => {
    expect(() => cartTotal([], { discount: 2 })).toThrow(RangeError)
  })
})
```

Structure each test as **Arrange → Act → Assert**, and test behaviour (inputs and outputs), not implementation details.

## Common matchers

```js
expect(value).toBe(3)                    // strict equality (===)
expect(obj).toEqual({ a: 1 })            // deep equality
expect(list).toContain('js')
expect(str).toMatch(/error/i)
expect(fn).toThrow('message')
expect(value).toBeNull()
expect(n).toBeCloseTo(0.3, 5)            // floating point
```

## Testing asynchronous code

```js
it('loads a user', async () => {
  const user = await loadUser(1)
  expect(user.name).toBe('Asha')
})

it('rejects for unknown users', async () => {
  await expect(loadUser(999)).rejects.toThrow('Not found')
})
```

## Mocks, stubs and spies

Replace slow or unpredictable dependencies (network, time, randomness) with controlled fakes:

```js
import { vi } from 'vitest'

it('sends a welcome email on register', async () => {
  const mailer = { send: vi.fn().mockResolvedValue(undefined) }
  const db = { users: { insert: vi.fn().mockResolvedValue({ id: 1, email: 'a@b.com' }) } }
  const service = createUserService({ db, mailer })

  await service.register('a@b.com')

  expect(mailer.send).toHaveBeenCalledWith('a@b.com', 'Welcome!')
  expect(mailer.send).toHaveBeenCalledTimes(1)
})
```

Mocking `fetch`:

```js
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) }))
```

Fake timers for debounce, retries and intervals:

```js
it('debounces calls', () => {
  vi.useFakeTimers()
  const fn = vi.fn()
  const debounced = debounce(fn, 300)
  debounced(); debounced(); debounced()
  vi.advanceTimersByTime(300)
  expect(fn).toHaveBeenCalledTimes(1)
  vi.useRealTimers()
})
```

Mock at the **boundaries** of your system. Over-mocking internal modules makes tests pass while the real integration is broken.

## Node's built-in test runner

For libraries and scripts, Node ships a zero-dependency runner:

```js
// math.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { add } from './math.js'

test('adds numbers', () => {
  assert.equal(add(2, 3), 5)
})
```

```bash
node --test
```

## Code coverage

```bash
npx vitest run --coverage
```

Coverage shows which lines ran during tests — useful for finding untested branches. It doesn't prove the tests assert anything meaningful, so treat it as a guide, not a target.

## Test-driven development (TDD)

1. **Red** — write a failing test for the next small behaviour.
2. **Green** — write the simplest code that passes.
3. **Refactor** — clean up with the test as a safety net.

TDD works especially well for pure logic: parsers, calculations, validation.

## What makes a good test

- **Fast and deterministic** — no real network, no dependence on the current time or random values.
- **Independent** — tests don't share state or depend on run order.
- **Readable** — the test name states the behaviour: "rejects expired coupons".
- **Fails for the right reason** — when it fails, the message tells you what broke.

## Try it yourself

Write tests for the `retry` function from the Promise Patterns lesson: it succeeds on the first try, succeeds after two failures, gives up after the retry limit, and waits between attempts (use fake timers).
