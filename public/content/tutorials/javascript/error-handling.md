Errors are inevitable: invalid input, network failures, bugs. Good error handling means failing **loudly in development**, **gracefully in production**, and never silently.

## `try` / `catch` / `finally`

```js
function parseConfig(text) {
  try {
    return JSON.parse(text)
  } catch (error) {
    console.error('Invalid config:', error.message)
    return {}
  } finally {
    console.log('parseConfig finished') // always runs
  }
}

parseConfig('{ bad json')
```

If you don't need the error object, omit the binding: `catch { … }`.

## Built-in error types

| Type | Typical cause |
| --- | --- |
| `SyntaxError` | Invalid code or invalid JSON passed to `JSON.parse` |
| `TypeError` | Using a value the wrong way — calling `undefined`, reading a property of `null` |
| `ReferenceError` | Using a variable that doesn't exist |
| `RangeError` | A number outside the allowed range — `new Array(-1)` |

## Throwing errors

Throw `Error` objects (or subclasses), never strings — only `Error` objects carry a **stack trace**:

```js
function withdraw(balance, amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new TypeError(`amount must be a number, got ${typeof amount}`)
  }
  if (amount > balance) {
    throw new RangeError('Insufficient funds')
  }
  return balance - amount
}
```

## Custom error classes

Custom errors let callers react to specific failures:

```js
class ValidationError extends Error {
  constructor(field, message) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

class NotFoundError extends Error {
  name = 'NotFoundError'
}

try {
  throw new ValidationError('email', 'Email is required')
} catch (error) {
  if (error instanceof ValidationError) {
    showFieldError(error.field, error.message)
  } else {
    throw error // not ours — rethrow
  }
}
```

**Only catch what you can handle.** Rethrow anything else so it isn't swallowed.

## Wrapping errors with `cause`

When you translate a low-level error into a higher-level one, keep the original with `cause`:

```js
async function loadUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    throw new Error(`Failed to load user ${id}`, { cause: error })
  }
}
```

Logging tools and browser consoles show the full chain.

## Errors in asynchronous code

`try`/`catch` only catches errors thrown *while it's running*. For promises, use `await` inside `try`, or `.catch()`:

```js
async function save(data) {
  try {
    await api.save(data)
  } catch (error) {
    notify('Save failed — please retry')
  }
}

fetchStats().catch((error) => reportError(error))
```

A callback scheduled for later is **not** covered by the surrounding `try`:

```js
try {
  setTimeout(() => {
    throw new Error('boom') // NOT caught below
  }, 0)
} catch {
  console.log('never runs')
}
```

## Global safety nets

Catch anything that slips through — to log it, not to hide it:

```js
// Browser
window.addEventListener('error', (e) => report(e.error))
window.addEventListener('unhandledrejection', (e) => report(e.reason))

// Node.js
process.on('uncaughtException', (err) => { report(err); process.exit(1) })
process.on('unhandledRejection', (reason) => report(reason))
```

After an `uncaughtException` in Node, the process may be in an unknown state — log it and exit, letting a process manager restart it.

## Good practices

- Validate input at the boundaries (user input, API responses) and throw early with a clear message.
- Include context in messages: *which* user, *which* file, *what* value.
- Show users friendly messages; log technical details for developers.
- Never write an empty `catch {}` without a comment explaining why ignoring the error is safe.

## Try it yourself

Write `parseAge(input)` that throws a `ValidationError` for empty input, non-numeric input and ages outside 0–130. Call it for several inputs inside `try`/`catch`, printing a friendly message for validation errors and rethrowing anything else.
