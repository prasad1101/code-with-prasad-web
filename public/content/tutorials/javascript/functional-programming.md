Functional programming (FP) is a style built on **pure functions**, **immutable data** and **composition**. JavaScript isn't a purely functional language, but FP ideas make code more predictable, easier to test and easier to reuse.

## Pure functions

A pure function:

1. Returns the same output for the same input.
2. Has no side effects (doesn't modify external state, the DOM, files, or its arguments).

```js
// Impure: depends on and changes outside state
let total = 0
function addToTotal(n) {
  total += n
  return total
}

// Pure
const add = (a, b) => a + b
```

Pure functions are trivially testable and safe to cache, parallelise and reorder. Real programs need side effects, of course — the goal is to **push them to the edges** and keep the core logic pure.

## Immutability

Instead of changing data, create new versions:

```js
const user = { name: 'Asha', skills: ['JS'] }

// Mutating — every holder of `user` sees the change
user.skills.push('SQL')

// Immutable update
const updated = { ...user, skills: [...user.skills, 'SQL'] }
```

Modern array methods return copies instead of mutating:

```js
const nums = [3, 1, 2]
nums.toSorted()          // [1, 2, 3] — nums unchanged
nums.toReversed()        // [2, 1, 3]
nums.with(0, 99)         // [99, 1, 2]
nums.toSpliced(1, 1)     // [3, 2]
```

`Object.freeze` prevents accidental mutation (shallowly). For deep copies use `structuredClone`.

Immutability is why frameworks like React can detect changes cheaply: a new object means "something changed".

## Higher-order functions

Functions that take or return functions. You already use them: `map`, `filter`, `reduce`, `addEventListener`.

```js
const withLogging = (fn) => (...args) => {
  console.log(`${fn.name}(${args.join(', ')})`)
  return fn(...args)
}

const loggedAdd = withLogging(add)
loggedAdd(2, 3) // logs "add(2, 3)", returns 5
```

## Declarative data transformation

```js
const orders = [
  { customer: 'Asha', total: 1200, status: 'paid' },
  { customer: 'Ravi', total: 300, status: 'refunded' },
  { customer: 'Asha', total: 800, status: 'paid' },
]

const revenueByCustomer = orders
  .filter((o) => o.status === 'paid')
  .reduce((acc, o) => ({ ...acc, [o.customer]: (acc[o.customer] ?? 0) + o.total }), {})
// { Asha: 2000 }
```

The code describes **what** to compute, not **how** to loop.

(For large arrays, spreading the accumulator on every step is O(n²). In hot paths, mutate a local accumulator — it's still pure from the outside because nobody else can see it.)

## Composition

Build complex functions from small ones:

```js
const pipe = (...fns) => (input) => fns.reduce((value, fn) => fn(value), input)

const slugify = pipe(
  (s) => s.trim(),
  (s) => s.toLowerCase(),
  (s) => s.replace(/[^a-z0-9\s-]/g, ''),
  (s) => s.replace(/\s+/g, '-'),
)

slugify('  Hello, Functional World! ') // 'hello-functional-world'
```

`pipe` applies left to right; `compose` is the same thing right to left.

## Currying and partial application

**Currying** turns `f(a, b, c)` into `f(a)(b)(c)`. It makes functions easy to specialise:

```js
const curry = (fn) =>
  function curried(...args) {
    return args.length >= fn.length ? fn(...args) : (...more) => curried(...args, ...more)
  }

const hasRole = curry((role, user) => user.roles.includes(role))
const isAdmin = hasRole('admin')

users.filter(isAdmin)
```

**Partial application** fixes some arguments up front, e.g. with `bind` or a closure:

```js
const logError = console.log.bind(console, '[error]')
```

## Avoiding shared mutable state

Many bugs come from two parts of a program changing the same object. FP's answer: pass data in, return new data out. Reducers (Redux, `useReducer`) are exactly this — `(state, action) => newState`.

```js
function cartReducer(state, action) {
  switch (action.type) {
    case 'add':
      return { ...state, items: [...state.items, action.item] }
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    default:
      return state
  }
}
```

## Try it yourself

1. Write a pure `applyDiscount(cart, percent)` that returns a new cart without modifying the original.
2. Use `pipe` to build `normaliseEmail` (trim → lowercase → remove `+tags` before the `@`).
3. Write a curried `between(min)(max)(n)` and use it with `filter`.
