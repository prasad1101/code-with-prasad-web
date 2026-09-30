An **array** is an ordered list of values. Arrays are how you work with collections: a list of users, the items in a cart, the rows returned by an API.

## Creating and reading arrays

```js
const fruits = ['apple', 'banana', 'cherry']

console.log(fruits[0])       // 'apple' — indexes start at 0
console.log(fruits.length)   // 3
console.log(fruits.at(-1))   // 'cherry' — negative index counts from the end
console.log(fruits[10])      // undefined
```

## Adding and removing items

```js
const stack = [1, 2]

stack.push(3)      // add to the end      → [1, 2, 3]
stack.pop()        // remove from the end → [1, 2]
stack.unshift(0)   // add to the start    → [0, 1, 2]
stack.shift()      // remove from start   → [1, 2]
```

These methods **change the original array** (they "mutate" it).

## Searching

```js
const nums = [5, 12, 8, 130, 44]

nums.includes(8)              // true
nums.indexOf(130)             // 3
nums.find((n) => n > 10)      // 12 — first match
nums.findIndex((n) => n > 10) // 1
nums.some((n) => n > 100)     // true — at least one matches
nums.every((n) => n > 0)      // true — all match
```

## Transforming: `map`, `filter`, `reduce`

These three methods cover most everyday array work. They **return new arrays/values** and leave the original untouched.

```js
const products = [
  { name: 'Keyboard', price: 1500, inStock: true },
  { name: 'Mouse', price: 700, inStock: false },
  { name: 'Monitor', price: 12000, inStock: true },
]

// map: transform every item
const names = products.map((p) => p.name)
// ['Keyboard', 'Mouse', 'Monitor']

// filter: keep items that pass a test
const available = products.filter((p) => p.inStock)
// Keyboard and Monitor

// reduce: combine everything into one value
const total = available.reduce((sum, p) => sum + p.price, 0)
// 13500
```

They can be chained:

```js
const cheapInStock = products
  .filter((p) => p.inStock && p.price < 5000)
  .map((p) => p.name.toUpperCase())
// ['KEYBOARD']
```

## Sorting

```js
const scores = [40, 100, 1, 5, 25]

scores.sort()                  // [1, 100, 25, 40, 5] — compares as strings!
scores.sort((a, b) => a - b)   // [1, 5, 25, 40, 100] — numeric ascending
```

Always pass a compare function when sorting numbers. `sort` mutates the array; use `toSorted` (in modern runtimes) or `[...scores].sort(…)` to keep the original.

## Spread and destructuring

```js
const a = [1, 2]
const b = [3, 4]

const combined = [...a, ...b]   // [1, 2, 3, 4]
const copy = [...a]             // a shallow copy

const [first, second, ...rest] = [10, 20, 30, 40]
// first = 10, second = 20, rest = [30, 40]
```

## Other useful methods

```js
['a', 'b', 'c'].join('-')        // 'a-b-c'
[1, 2, 3, 4].slice(1, 3)         // [2, 3]
[[1, 2], [3]].flat()             // [1, 2, 3]
Array.from({ length: 3 }, (_, i) => i * 2) // [0, 2, 4]
```

## Try it yourself

Given `const marks = [72, 45, 90, 38, 66, 81]`:

1. Create an array of only the passing marks (≥ 40).
2. Calculate the average of all marks.
3. Find the highest mark without using a loop.
