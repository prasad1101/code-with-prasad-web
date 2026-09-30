**Closures** are one of JavaScript's most powerful features — and a favourite interview topic. A closure is a function bundled together with the variables from the scope where it was created.

## Lexical scope

JavaScript uses **lexical** (static) scope: what a function can see is determined by where it's *written*, not where it's *called*.

```js
const greeting = 'Hello'

function outer() {
  const name = 'Asha'
  function inner() {
    console.log(`${greeting}, ${name}`) // looks outward: inner → outer → global
  }
  return inner
}

outer()() // Hello, Asha
```

When a variable is referenced, the engine searches the current scope, then each enclosing scope — the **scope chain** — up to the global scope.

## Closures

When `outer` returns, you might expect `name` to disappear. But `inner` still references it, so the variable stays alive. That combination — a function plus its captured variables — is a **closure**.

```js
function createCounter() {
  let count = 0
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  }
}

const a = createCounter()
const b = createCounter()
a.increment()
a.increment()
b.increment()
console.log(a.value(), b.value()) // 2 1 — each call creates a separate `count`
```

Closures capture **variables, not values**: if the variable changes, the closure sees the new value.

## Practical uses

### Data privacy

`count` above can't be modified except through the returned functions — encapsulation without classes.

### Function factories

```js
const multiplier = (factor) => (n) => n * factor
const double = multiplier(2)
const triple = multiplier(3)
double(5) // 10
triple(5) // 15
```

### Memoisation

```js
function memoize(fn) {
  const cache = new Map()
  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg))
    return cache.get(arg)
  }
}

const slowSquare = (n) => { for (let i = 0; i < 1e7; i++); return n * n }
const fastSquare = memoize(slowSquare)
fastSquare(9) // slow the first time
fastSquare(9) // instant — served from the closure's cache
```

### Event handlers and callbacks

```js
function setupButtons(buttons) {
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      console.log(`Button ${index} clicked`) // each handler closes over its own `index`
    })
  })
}
```

### Once-only functions

```js
function once(fn) {
  let called = false
  let result
  return (...args) => {
    if (!called) {
      called = true
      result = fn(...args)
    }
    return result
  }
}

const init = once(() => console.log('initialised'))
init() // initialised
init() // (nothing)
```

## Stale closures

Every function call creates **new** variables. A closure created during one call keeps seeing that call's variables — even after later calls have created newer ones. This is exactly what happens in UI frameworks, where each render is a function call:

```js
let latestCount = 0

function render(count) {
  latestCount = count
  // This timer closes over the `count` variable of *this* render.
  setTimeout(() => console.log(`closure: ${count}, latest: ${latestCount}`), 1000)
}

render(1)
render(2)
// closure: 1, latest: 2
// closure: 2, latest: 2
```

The first timer is "stale": it still sees `count = 1`. In React, an interval set up in the first render reads the first render's state forever. Fixes include reading from a longer-lived reference (a ref or a module variable), using functional updates (`setCount(c => c + 1)`), or re-creating the callback whenever the value changes.

## Closures and memory

A closure keeps its captured variables alive as long as the closure itself is reachable. If you store closures in long-lived places (global arrays, event listeners that are never removed, caches), they can keep large objects in memory. Remove listeners you no longer need and avoid capturing big objects unnecessarily.

## Try it yourself

1. Write `createRateLimiter(limit)` that returns a function; the function returns `true` for the first `limit` calls and `false` after that.
2. Write `debounce(fn, ms)` — the returned function delays calling `fn` until `ms` milliseconds have passed without another call. (You'll use this in the performance lesson.)
