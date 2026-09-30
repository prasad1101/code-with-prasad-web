`for…of`, spread (`...`), destructuring and `Array.from` all work on **iterables**. Understanding the iteration protocol lets you make your own objects iterable and produce values lazily with **generators**.

## The iteration protocol

An object is **iterable** if it has a `[Symbol.iterator]()` method that returns an **iterator** — an object with a `next()` method returning `{ value, done }`:

```js
const letters = ['a', 'b']
const it = letters[Symbol.iterator]()

it.next() // { value: 'a', done: false }
it.next() // { value: 'b', done: false }
it.next() // { value: undefined, done: true }
```

Arrays, strings, `Map`, `Set`, `arguments` and NodeLists are all iterable. Plain objects are not.

## Making an object iterable

```js
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from
    const last = this.to
    return {
      next: () =>
        current <= last ? { value: current++, done: false } : { value: undefined, done: true },
    }
  },
}

console.log([...range]) // [1, 2, 3, 4, 5]
for (const n of range) console.log(n)
```

## Generators

Writing iterators by hand is fiddly. A **generator function** (`function*`) does it for you: each `yield` produces the next value and pauses the function until the next value is requested.

```js
function* range(from, to, step = 1) {
  for (let i = from; i <= to; i += step) {
    yield i
  }
}

console.log([...range(0, 10, 5)]) // [0, 5, 10]

const gen = range(1, 3)
gen.next() // { value: 1, done: false }
```

### Lazy and infinite sequences

Generators only compute values when asked, so they can represent infinite sequences:

```js
function* fibonacci() {
  let [a, b] = [0, 1]
  while (true) {
    yield a
    ;[a, b] = [b, a + b]
  }
}

function* take(iterable, n) {
  if (n <= 0) return
  for (const value of iterable) {
    yield value
    if (--n === 0) return
  }
}

console.log([...take(fibonacci(), 8)]) // [0, 1, 1, 2, 3, 5, 8, 13]
```

### Iterator helpers

Modern runtimes add array-like helper methods directly to iterators, so you can chain lazily without building intermediate arrays:

```js
const firstEvenSquares = fibonacci()
  .filter((n) => n % 2 === 0)
  .map((n) => n * n)
  .take(3)
  .toArray()
// [0, 4, 64]
```

(Supported in current Chrome, Firefox, Safari and Node.js 22+. For older targets, use helpers like `take` above.)

### Delegating with `yield*`

```js
function* walk(tree) {
  yield tree.value
  for (const child of tree.children ?? []) {
    yield* walk(child) // yield every value from the nested generator
  }
}

const tree = { value: 1, children: [{ value: 2 }, { value: 3, children: [{ value: 4 }] }] }
console.log([...walk(tree)]) // [1, 2, 3, 4]
```

## Async iteration

`for await…of` consumes **async iterables** — sequences where each value arrives asynchronously, such as pages from an API or chunks from a stream:

```js
async function* fetchAllPages(url) {
  let next = url
  while (next) {
    const res = await fetch(next)
    const page = await res.json()
    yield* page.items
    next = page.nextUrl
  }
}

for await (const item of fetchAllPages('/api/orders?page=1')) {
  console.log(item.id)
}
```

Node.js streams are async iterables too:

```js
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const lines = createInterface({ input: createReadStream('access.log') })
for await (const line of lines) {
  if (line.includes(' 500 ')) console.log(line)
}
```

## When to use generators

- Producing sequences lazily (pagination, tree traversal, large data processing).
- Representing potentially infinite streams.
- Keeping memory flat: process one item at a time instead of loading everything into an array.

## Try it yourself

1. Write a generator `chunk(array, size)` that yields sub-arrays of `size` items.
2. Write an async generator that yields a number every second, and stop consuming it after 5 values with `break`.
