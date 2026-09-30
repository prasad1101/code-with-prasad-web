Objects and arrays cover most needs, but JavaScript also has dedicated collection types that are faster and clearer for specific jobs: `Map`, `Set`, and their "weak" variants.

## `Map`: key–value pairs with any key type

```js
const visits = new Map()

visits.set('/home', 10)
visits.set('/blog', 4)
visits.get('/home')     // 10
visits.has('/about')    // false
visits.size             // 2
visits.delete('/blog')

for (const [path, count] of visits) {
  console.log(path, count)
}
```

Why use a `Map` instead of an object?

| | Object | Map |
| --- | --- | --- |
| Key types | Strings and symbols | **Any value** — objects, functions, numbers |
| Order | Mostly insertion order (integer-like keys sorted first) | Always insertion order |
| Size | `Object.keys(obj).length` | `map.size` |
| Accidental keys | Inherits from `Object.prototype` (`'toString' in {}` is `true`) | None |
| Frequent add/remove | Slower | Optimised for it |

Use an object for fixed, known shapes (a user record). Use a `Map` for dynamic dictionaries, especially with non-string keys:

```js
const elementState = new Map()
const button = document.querySelector('button')
elementState.set(button, { clicks: 0 }) // a DOM node as a key
```

Converting between the two:

```js
const map = new Map(Object.entries({ a: 1, b: 2 }))
const obj = Object.fromEntries(map)
```

## `Set`: unique values

```js
const tags = new Set(['js', 'node', 'js'])
tags.size          // 2
tags.add('react')
tags.has('node')   // true

const unique = [...new Set([3, 1, 3, 2, 1])] // [3, 1, 2]
```

`set.has()` is much faster than `array.includes()` for large collections: it's typically constant time rather than a linear scan.

### Set operations

Modern runtimes include built-in set algebra:

```js
const frontend = new Set(['js', 'css', 'react'])
const backend = new Set(['js', 'node', 'sql'])

frontend.union(backend)        // Set {'js','css','react','node','sql'}
frontend.intersection(backend) // Set {'js'}
frontend.difference(backend)   // Set {'css','react'}
frontend.isSubsetOf(backend)   // false
```

In older environments, write them with spread and `filter`:

```js
const intersection = new Set([...frontend].filter((x) => backend.has(x)))
```

## Grouping data

`Map.groupBy` and `Object.groupBy` group items by a key function:

```js
const orders = [
  { id: 1, status: 'paid' },
  { id: 2, status: 'pending' },
  { id: 3, status: 'paid' },
]

const byStatus = Object.groupBy(orders, (o) => o.status)
// { paid: [{id:1…},{id:3…}], pending: [{id:2…}] }
```

## `WeakMap` and `WeakSet`

Weak collections only accept **objects** (and non-registered symbols) as keys, and **don't prevent those keys from being garbage-collected**. When nothing else references the key, the entry disappears automatically.

```js
const cache = new WeakMap()

function getMetadata(element) {
  if (!cache.has(element)) {
    cache.set(element, expensiveComputation(element))
  }
  return cache.get(element)
}
```

If the element is removed from the page and dropped elsewhere, its cache entry can be collected — no memory leak. The trade-off: weak collections aren't iterable and have no `size`, because their contents can change at any time.

Typical uses:

- Caching data about objects you don't own (DOM nodes, library objects).
- Storing private data per instance.
- Tracking "already processed" objects with a `WeakSet`.

## Try it yourself

1. Given a long string of text, use a `Map` to count word frequencies, then print the top five words.
2. Given two arrays of user IDs (yesterday's and today's visitors), use `Set` to find new visitors, returning visitors and those who didn't come back.
