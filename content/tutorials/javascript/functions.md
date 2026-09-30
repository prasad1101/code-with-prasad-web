A **function** is a reusable block of code with a name. You define it once and call it whenever you need it, optionally passing in values and getting a result back.

## Declaring and calling a function

```js
function greet(name) {
  return `Hello, ${name}!`
}

console.log(greet('Asha'))  // Hello, Asha!
console.log(greet('Ravi'))  // Hello, Ravi!
```

- `name` is a **parameter** — a placeholder for the input.
- `'Asha'` is an **argument** — the actual value passed in.
- `return` sends a value back to the caller and ends the function.

A function without a `return` returns `undefined`.

## Default parameters

```js
function greet(name = 'friend') {
  return `Hello, ${name}!`
}

greet()        // Hello, friend!
greet('Meera') // Hello, Meera!
```

## Function expressions and arrow functions

Functions are values, so you can store them in variables:

```js
const square = function (n) {
  return n * n
}
```

**Arrow functions** are a shorter syntax you'll see everywhere in modern code:

```js
const square = (n) => n * n          // implicit return
const add = (a, b) => a + b
const log = (msg) => {
  console.log(`[log] ${msg}`)        // block body needs an explicit return
}
```

If an arrow function's body is a single expression, its value is returned automatically.

## Rest parameters

Accept any number of arguments as an array:

```js
function sum(...numbers) {
  let total = 0
  for (const n of numbers) total += n
  return total
}

sum(1, 2, 3)       // 6
sum(10, 20, 30, 40) // 100
```

## Scope

Variables declared inside a function are only visible inside it:

```js
function makeTotal() {
  const tax = 0.18
  return 100 * (1 + tax)
}

console.log(makeTotal()) // 118
console.log(tax)         // ReferenceError: tax is not defined
```

## Functions as arguments (callbacks)

Because functions are values, you can pass them to other functions. This is one of the most important ideas in JavaScript:

```js
function repeat(times, action) {
  for (let i = 0; i < times; i++) action(i)
}

repeat(3, (i) => console.log(`Run #${i + 1}`))
```

## Closures

A function remembers the variables from where it was created, even after that outer function has finished:

```js
function createCounter() {
  let count = 0
  return () => {
    count++
    return count
  }
}

const counter = createCounter()
counter() // 1
counter() // 2
counter() // 3
```

`count` isn't accessible from outside, but the inner function keeps it alive. Closures are how JavaScript creates private state.

## Keep functions small

A good function does **one thing** and has a name that says what it does: `calculateTotal`, `formatDate`, `isValidEmail`. If you can't name a function clearly, it's probably doing too much.

## Try it yourself

1. Write `isEven(n)` that returns `true` or `false`.
2. Write an arrow function `celsiusToFahrenheit(c)` (°F = °C × 9/5 + 32).
3. Write `createMultiplier(factor)` that returns a function; `createMultiplier(3)(5)` should return `15`.
