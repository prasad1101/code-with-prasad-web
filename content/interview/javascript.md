## What are the differences between `var`, `let` and `const`?
Level: Beginner | Tags: variables, scope

| | `var` | `let` | `const` |
| --- | --- | --- | --- |
| Scope | Function | Block | Block |
| Hoisting | Hoisted, initialised to `undefined` | Hoisted, but in the temporal dead zone until declared | Same as `let` |
| Re-declare in same scope | Allowed | Error | Error |
| Reassign | Yes | Yes | No |

```js
if (true) {
  var a = 1
  let b = 2
}
console.log(a) // 1 — var leaks out of the block
console.log(b) // ReferenceError
```

`const` prevents **reassignment**, not mutation: a `const` array can still be `push`ed to.

**In practice:** use `const` by default, `let` when you need to reassign, and avoid `var`.

## What is the difference between `==` and `===`?
Level: Beginner | Tags: operators, types

`===` (strict equality) compares value **and** type with no conversion. `==` (loose equality) converts operands to a common type first, which produces surprising results:

```js
0 == ''            // true
'1' == 1           // true
null == undefined  // true
[] == false        // true
0 === ''           // false
```

Use `===` everywhere. The one idiom some teams allow is `value == null`, which checks for both `null` and `undefined` — though `value ?? fallback` and `value === null || value === undefined` are clearer.

## What are the primitive types in JavaScript?
Level: Beginner | Tags: types

Seven primitives: `string`, `number`, `bigint`, `boolean`, `undefined`, `null` and `symbol`. Everything else is an object (including arrays and functions).

Primitives are **immutable** and compared **by value**; objects are compared **by reference**:

```js
'abc' === 'abc'   // true
{} === {}         // false — two different objects
```

Gotcha: `typeof null === 'object'` is a historical bug kept for compatibility. Use `value === null` to check for null, and `Array.isArray` to detect arrays.

## What is the difference between `null` and `undefined`?
Level: Beginner | Tags: types

- `undefined` means a value has **not been assigned**: uninitialised variables, missing object properties, missing function arguments, functions without `return`.
- `null` is an **intentional** "no value", assigned by the programmer.

```js
let a
typeof a           // 'undefined'
typeof null        // 'object' (quirk)
null == undefined  // true
null === undefined // false
```

APIs commonly use `null` for "known to be empty" and leave `undefined` for "not provided". The `??` operator treats both as missing.

## What are truthy and falsy values?
Level: Beginner | Tags: types, operators

In a boolean context (`if`, `&&`, `||`, `!`), every value is treated as either true or false. The **falsy** values are:

`false`, `0`, `-0`, `0n`, `''`, `null`, `undefined`, `NaN`

Everything else is **truthy** — including `'0'`, `'false'`, `[]` and `{}`.

This matters for defaults: `count || 10` replaces a legitimate `0` with `10`. Use `count ?? 10`, which only replaces `null`/`undefined`.

## What is hoisting?
Level: Beginner | Tags: hoisting, scope

Before code in a scope runs, JavaScript registers all declarations in that scope. This is called hoisting, and each declaration type behaves differently:

- **Function declarations** are hoisted with their body — you can call them before the line they appear on.
- **`var`** is hoisted and initialised to `undefined`.
- **`let`, `const` and `class`** are hoisted but uninitialised: accessing them before the declaration throws a `ReferenceError` (the *temporal dead zone*).

```js
greet()                 // works
function greet() {}

console.log(x)          // undefined
var x = 1

console.log(y)          // ReferenceError
let y = 2
```

## What is a closure? Give a practical example.
Level: Intermediate | Tags: closures, functions, scope

A closure is a function together with the variables from the scope where it was **defined**. The function keeps access to those variables even after the outer function has returned.

```js
function createCounter() {
  let count = 0
  return {
    increment: () => ++count,
    get: () => count,
  }
}

const counter = createCounter()
counter.increment()
counter.get() // 1 — `count` lives on, and is private
```

Practical uses:

- **Data privacy** — `count` can't be changed except through the returned functions.
- **Function factories** — `const double = multiplier(2)`.
- **Memoisation** — a cache variable captured by the returned function.
- **Event handlers and callbacks** that remember context (an item's id, an index).

A common pitfall is **stale closures**: a long-lived callback keeps seeing the variables from when it was created (e.g. an old React render's state).

## Explain the output: `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))`.
Level: Intermediate | Tags: closures, event-loop, scope

It prints `3, 3, 3`.

- `var` is function-scoped, so there is **one** `i` shared by every iteration.
- The callbacks run later (after the loop finishes, when the event loop processes the timers), by which time `i` is `3`.

Fixes:

```js
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i))   // 0 1 2 — new binding per iteration

for (var i = 0; i < 3; i++) setTimeout((n) => console.log(n), 0, i) // pass the value as an argument
```

## How does `this` work in JavaScript?
Level: Intermediate | Tags: this, functions

`this` is determined by **how a function is called**:

1. **Method call** — `obj.method()` → `this` is `obj`.
2. **Plain call** — `fn()` → `undefined` in strict mode (the global object in sloppy mode).
3. **Explicit** — `fn.call(obj)`, `fn.apply(obj)`, `fn.bind(obj)` → `this` is `obj`.
4. **Constructor** — `new Fn()` → `this` is the new object.

**Arrow functions** have no `this` of their own; they use `this` from the enclosing scope, and `call`/`bind` can't change it.

The classic bug is losing `this` when passing a method as a callback:

```js
setTimeout(user.greet, 0)             // `this` is lost
setTimeout(() => user.greet(), 0)     // fine
setTimeout(user.greet.bind(user), 0)  // fine
```

## What is the difference between `call`, `apply` and `bind`?
Level: Intermediate | Tags: this, functions

All three set `this` explicitly:

- `fn.call(thisArg, a, b)` — calls immediately, arguments listed individually.
- `fn.apply(thisArg, [a, b])` — calls immediately, arguments as an array.
- `fn.bind(thisArg, a)` — **returns a new function** with `this` (and optionally leading arguments) fixed, to call later.

```js
function greet(greeting) { return `${greeting}, ${this.name}` }
const user = { name: 'Asha' }

greet.call(user, 'Hi')        // 'Hi, Asha'
greet.apply(user, ['Hello'])  // 'Hello, Asha'
const hey = greet.bind(user, 'Hey')
hey()                         // 'Hey, Asha'
```

With spread syntax, `apply` is rarely needed today: `fn.call(obj, ...args)`.

## How do arrow functions differ from regular functions?
Level: Intermediate | Tags: functions, this

- **No own `this`** — they use the surrounding scope's `this` (great for callbacks, wrong for object methods).
- **No `arguments` object** — use rest parameters `(...args)`.
- **Can't be used with `new`** and have no `prototype`.
- **Shorter syntax** with implicit return for single expressions: `x => x * 2`. Returning an object literal needs parentheses: `() => ({ ok: true })`.

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => this.seconds++, 1000) // arrow keeps `this` = timer
  },
}
```

## Explain the JavaScript event loop.
Level: Intermediate | Tags: event-loop, async

JavaScript runs on one thread with a **call stack**. Asynchronous work (timers, network, I/O) is handled by the runtime, and its callbacks are queued:

- **Microtask queue** — promise reactions (`.then`, `await` continuations), `queueMicrotask`.
- **Task (macrotask) queue** — `setTimeout`, `setInterval`, I/O, UI events.

The loop: run the current task to completion → drain **all** microtasks → (browser) render if needed → take the next task.

```js
console.log(1)
setTimeout(() => console.log(2))
Promise.resolve().then(() => console.log(3))
console.log(4)
// 1 4 3 2
```

Consequences: a long synchronous function freezes the page; microtasks always beat timers; `setTimeout(fn, 0)` means "as soon as possible after current work and microtasks", not "now".

## What is the difference between microtasks and macrotasks?
Level: Advanced | Tags: event-loop, async

- **Microtasks**: promise callbacks, `await` continuations, `queueMicrotask`, `MutationObserver`. The whole microtask queue is drained after every task — including microtasks added while draining.
- **Macrotasks (tasks)**: `setTimeout`, `setInterval`, I/O callbacks, message and UI events. One task is processed per loop iteration.

Because microtasks drain completely, code that keeps scheduling microtasks (a recursive promise chain) **starves** rendering and timers. In Node.js, `process.nextTick` callbacks run even before promise microtasks.

```js
setTimeout(() => console.log('timeout'))
queueMicrotask(() => console.log('micro 1'))
Promise.resolve().then(() => {
  console.log('micro 2')
  queueMicrotask(() => console.log('micro 3'))
})
// micro 1, micro 2, micro 3, timeout
```

## What are promises and what states can they be in?
Level: Beginner | Tags: promises, async

A promise represents a value that will be available in the future. It is in one of three states:

- **pending** — not settled yet;
- **fulfilled** — completed with a value;
- **rejected** — failed with a reason (usually an `Error`).

Once settled, a promise never changes state. You consume it with `.then/.catch/.finally` or `await`:

```js
fetch('/api/user')
  .then((res) => res.json())
  .then((user) => console.log(user))
  .catch((err) => console.error(err))
```

`.then` returns a **new** promise, which is what makes chaining work. Returning a promise inside `.then` makes the chain wait for it.

## Compare `Promise.all`, `allSettled`, `race` and `any`.
Level: Intermediate | Tags: promises, async

- **`Promise.all`** — fulfils with an array of all results; **rejects as soon as any rejects**. Use when every result is required.
- **`Promise.allSettled`** — always fulfils with `{ status, value | reason }` for each. Use when you want every outcome (batch jobs, dashboards with independent widgets).
- **`Promise.race`** — settles like the **first** promise to settle, fulfilled or rejected. Use for timeouts.
- **`Promise.any`** — fulfils with the first **fulfilled** result; rejects with an `AggregateError` only if all reject. Use for redundant sources (mirrors, fallbacks).

None of them cancel the "losing" operations — pair them with `AbortController` if work should stop.

## How does `async`/`await` work, and how do you handle errors with it?
Level: Intermediate | Tags: async, promises, errors

`async` functions always return a promise. `await` pauses the function until a promise settles, then resumes with its value (or throws its rejection reason). It's syntax over promises: the rest of the function runs as a microtask.

```js
async function loadDashboard() {
  try {
    const [user, stats] = await Promise.all([getUser(), getStats()]) // run in parallel
    return { user, stats }
  } catch (err) {
    logger.error(err)
    throw new Error('Dashboard failed to load', { cause: err })
  }
}
```

Common mistakes:

- Awaiting independent calls **sequentially** instead of with `Promise.all`.
- Using `await` inside `forEach` (it doesn't wait) — use `for…of` or `Promise.all(map(...))`.
- Forgetting to `await` or `return` a promise, causing unhandled rejections.

## What is the prototype chain?
Level: Intermediate | Tags: prototypes, inheritance, objects

Every object has an internal link to a **prototype** object. When you access a property the object doesn't own, JavaScript looks it up on the prototype, then its prototype, and so on until `null`.

```js
const arr = [1, 2]
arr.map                                          // found on Array.prototype
Object.getPrototypeOf(arr) === Array.prototype   // true
Object.getPrototypeOf(Array.prototype) === Object.prototype // true
```

This is how methods are shared without copying. `class` syntax builds exactly this chain: instances link to `Class.prototype`, which links to the parent class's prototype. `instanceof` checks whether `Class.prototype` appears in an object's chain.

## How do ES6 classes relate to prototypes?
Level: Intermediate | Tags: classes, prototypes

Classes are mostly syntactic sugar over constructor functions and prototypes:

- Methods go on `Class.prototype` and are shared.
- `extends` sets up the prototype chain (and the chain between the constructors for static members).
- `typeof MyClass === 'function'`.

Differences from old-style constructors: classes must be called with `new`, their bodies are always strict mode, methods are non-enumerable, and they support **private fields** (`#x`) and static blocks that have no direct pre-class equivalent.

## What is event delegation and why is it useful?
Level: Intermediate | Tags: dom, events

Most DOM events **bubble** up through ancestors. Event delegation attaches one listener to a common parent and uses `event.target` to work out which child was involved:

```js
list.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-id]')
  if (!button) return
  removeItem(button.dataset.id)
})
```

Benefits: one listener instead of many (less memory), and elements added later are handled automatically. Events that don't bubble (like `focus`) have bubbling alternatives (`focusin`).

## Explain debounce and throttle. When would you use each?
Level: Intermediate | Tags: performance, events

Both limit how often a function runs in response to rapid events.

- **Debounce** — wait until events **stop** for N ms, then run once. Use for search-as-you-type, autosave, window resize end.
- **Throttle** — run **at most once every** N ms while events continue. Use for scroll position, drag, analytics sampling.

```js
function debounce(fn, ms) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

function throttle(fn, ms) {
  let last = 0
  return (...args) => {
    const now = Date.now()
    if (now - last >= ms) {
      last = now
      fn(...args)
    }
  }
}
```

## What is the difference between shallow and deep copies?
Level: Intermediate | Tags: objects, immutability

A **shallow copy** duplicates the top level; nested objects are still shared. A **deep copy** duplicates everything.

```js
const original = { name: 'Asha', address: { city: 'Pune' } }

const shallow = { ...original }         // or Object.assign({}, original)
shallow.address.city = 'Mumbai'
original.address.city                   // 'Mumbai' — shared!

const deep = structuredClone(original)  // true deep copy
```

`structuredClone` handles nested objects, arrays, `Date`, `Map`, `Set` and circular references, but not functions or class prototypes. `JSON.parse(JSON.stringify(obj))` is an older trick that drops `undefined`, functions and converts dates to strings.

## How would you implement a deep equality check?
Level: Advanced | Tags: objects, recursion

```js
function deepEqual(a, b) {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k]))
}
```

Points interviewers look for: using `Object.is` (handles `NaN`), checking types and key counts, recursion, and mentioning limitations — circular references (track visited pairs with a `WeakMap`), `Date`/`Map`/`Set` needing special handling, and symbol keys.

## What is the difference between `map`, `forEach`, `filter` and `reduce`?
Level: Beginner | Tags: arrays, functional

- `forEach` — runs a function for each item; returns `undefined`. Use for side effects.
- `map` — returns a **new array** of transformed items, same length.
- `filter` — returns a new array of items that pass a test.
- `reduce` — combines all items into a single value (sum, object, grouped map).

```js
const nums = [1, 2, 3, 4]
nums.map((n) => n * 2)               // [2, 4, 6, 8]
nums.filter((n) => n % 2 === 0)      // [2, 4]
nums.reduce((sum, n) => sum + n, 0)  // 10
```

Always pass an initial value to `reduce` — without one, an empty array throws.

## How does garbage collection work, and what causes memory leaks?
Level: Advanced | Tags: memory, performance

JavaScript engines use **reachability**: objects reachable from roots (globals, the call stack, active closures) are kept; everything else is eventually freed. Modern collectors are generational (most objects die young) and incremental/concurrent to avoid long pauses.

Leaks happen when you unintentionally keep references:

- Event listeners, intervals and subscriptions never removed (their closures keep data alive).
- Unbounded caches or arrays that only grow.
- Detached DOM nodes still referenced from JavaScript.
- Accidental globals.

Diagnose with DevTools heap snapshots (compare before/after repeating an action). Prevent with cleanup functions, bounded caches, `WeakMap`/`WeakRef` for object-keyed metadata, and `AbortController` to remove groups of listeners.

## What are `WeakMap` and `WeakSet`, and when would you use them?
Level: Advanced | Tags: memory, collections

Their keys must be objects, and they hold them **weakly**: an entry doesn't stop its key from being garbage-collected. When the key object becomes unreachable elsewhere, the entry disappears.

Because contents can vanish at any time, they are **not iterable** and have no `size`.

Use cases:

- Caching computed data for objects you don't own (DOM nodes, library objects) without leaking memory.
- Private per-instance data (before `#private` fields existed).
- Marking objects as "seen" during traversal with a `WeakSet`.

```js
const sizes = new WeakMap()
function measure(el) {
  if (!sizes.has(el)) sizes.set(el, el.getBoundingClientRect())
  return sizes.get(el)
}
```

## What are generators and how are they useful?
Level: Advanced | Tags: generators, iterators

A generator function (`function*`) returns an iterator. Each `yield` produces a value and **pauses** execution until the next value is requested.

```js
function* idGenerator(prefix) {
  let n = 1
  while (true) yield `${prefix}-${n++}`
}

const ids = idGenerator('order')
ids.next().value // 'order-1'
ids.next().value // 'order-2'
```

Uses: lazy and infinite sequences, custom iterables (`[Symbol.iterator]() { … }`), tree traversal with `yield*`, and processing large data one item at a time to keep memory flat. **Async generators** (`async function*` with `for await…of`) model streams such as paginated APIs.

## Explain currying with an example.
Level: Intermediate | Tags: functional, closures

Currying transforms a function of several arguments into a chain of functions each taking one argument: `f(a, b, c)` → `f(a)(b)(c)`.

```js
const curry = (fn) =>
  function curried(...args) {
    return args.length >= fn.length ? fn(...args) : (...more) => curried(...args, ...more)
  }

const add3 = curry((a, b, c) => a + b + c)
add3(1)(2)(3) // 6
add3(1, 2)(3) // 6
```

It enables **specialisation**: `const hasRole = curry((role, user) => …); users.filter(hasRole('admin'))`. It relies on closures to remember earlier arguments.

## What is the difference between `Object.freeze`, `Object.seal` and `const`?
Level: Intermediate | Tags: objects, immutability

- `const` — the **binding** can't be reassigned; the object can still change.
- `Object.seal(obj)` — can't add or delete properties; existing ones can still be modified.
- `Object.freeze(obj)` — can't add, delete or modify properties.

Both `seal` and `freeze` are **shallow**:

```js
const config = Object.freeze({ db: { host: 'localhost' } })
config.db = {}            // ignored (TypeError in strict mode)
config.db.host = 'prod'   // allowed — nested object isn't frozen
```

For deep immutability, freeze recursively or use immutable update patterns.

## How do ES modules differ from CommonJS?
Level: Intermediate | Tags: modules, nodejs

| | ES modules (`import`/`export`) | CommonJS (`require`/`module.exports`) |
| --- | --- | --- |
| Loading | Static structure, asynchronous loading | Synchronous, at runtime |
| Tree-shaking | Yes — imports are statically analysable | Hard |
| Bindings | Live bindings | Copies of the exported value |
| Top-level `await` | Supported | Not supported |
| `this` at top level | `undefined` | `module.exports` |
| Default in | Browsers, modern Node (`.mjs` or `"type": "module"`) | Node (`.cjs` or default) |

Dynamic `import()` works in both and returns a promise — the basis of code splitting.

## What is XSS and how do you prevent it in JavaScript applications?
Level: Advanced | Tags: security

Cross-site scripting happens when untrusted data is executed as script in your page, letting an attacker steal tokens, act as the user or modify the page.

Prevention:

1. Render untrusted data as **text**: `textContent`, framework interpolation (`{value}` in React, `{{ value }}` in Angular) — both escape by default.
2. Avoid HTML sinks (`innerHTML`, `dangerouslySetInnerHTML`, `bypassSecurityTrustHtml`). When HTML is required, sanitise with DOMPurify.
3. Validate URLs — block `javascript:` in `href`/`src`.
4. Never `eval` or `new Function` with user data.
5. Add a strict **Content Security Policy** as defence in depth.
6. Keep auth tokens out of reach of scripts where possible (`HttpOnly` cookies).

## How would you implement a `Promise.all` polyfill?
Level: Advanced | Tags: promises, async

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable)
    const results = new Array(items.length)
    let remaining = items.length
    if (remaining === 0) return resolve(results)

    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value          // keep original order
        if (--remaining === 0) resolve(results)
      }, reject)                    // first rejection wins
    })
  })
}
```

Key points: results keep **input order** regardless of completion order; non-promise values are wrapped with `Promise.resolve`; an empty input resolves immediately; the first rejection rejects the whole thing.

## How would you optimise a slow web page?
Level: Expert | Tags: performance

Start by **measuring** (Lighthouse, Core Web Vitals, the DevTools Performance panel), then fix the biggest bottleneck:

- **Loading**: code-split with dynamic `import()`, tree-shake, remove heavy dependencies, compress and cache assets, preload critical resources, lazy-load below-the-fold images, serve modern image formats.
- **Main thread**: break long tasks up, move heavy computation to Web Workers, debounce/throttle frequent handlers.
- **Rendering**: avoid layout thrashing (batch DOM reads before writes), animate `transform`/`opacity`, virtualise long lists, reduce unnecessary re-renders in frameworks.
- **Network**: fewer round trips, HTTP caching, CDN, request deduplication, parallelise independent requests.
- **Memory**: fix leaks (listeners, intervals, caches) that degrade long sessions.

Then measure again to confirm the improvement.

## What is the temporal dead zone?
Level: Intermediate | Tags: hoisting, scope

The TDZ is the period between entering a scope and the line where a `let`, `const` or `class` binding is declared. The binding exists (it's hoisted) but can't be accessed — any access throws a `ReferenceError`.

```js
{
  console.log(typeof value) // ReferenceError — even typeof isn't safe here
  const value = 42
}
```

It exists to catch use-before-initialisation bugs that `var`'s silent `undefined` would hide.

## What is `Symbol` used for?
Level: Advanced | Tags: types, metaprogramming

A `Symbol` is a unique, immutable primitive, mainly used as a property key that can't collide with other keys:

```js
const id = Symbol('id')
const user = { [id]: 123, name: 'Asha' }
Object.keys(user) // ['name'] — symbol keys are hidden from normal enumeration
```

**Well-known symbols** let objects hook into language behaviour: `Symbol.iterator` (make an object iterable), `Symbol.asyncIterator`, `Symbol.toPrimitive` (type conversion), `Symbol.toStringTag`. `Symbol.for('key')` returns a shared symbol from a global registry.

## What are `Proxy` and `Reflect`?
Level: Expert | Tags: metaprogramming

A `Proxy` wraps an object and intercepts fundamental operations — property get/set, `in`, delete, function calls — through **trap** functions. `Reflect` provides the default implementation of each operation, used inside traps to forward correctly.

```js
const validated = new Proxy({}, {
  set(target, key, value) {
    if (key === 'age' && !Number.isInteger(value)) throw new TypeError('age must be an integer')
    return Reflect.set(target, key, value)
  },
})
```

Real uses: Vue 3's reactivity system, validation layers, logging/tracing, mocking in tests, read-only views. Caveats: performance overhead, identity (`proxy !== target`), and built-ins with internal slots (`Map`, `Date`, private fields) don't proxy transparently.
