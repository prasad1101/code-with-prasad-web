A **variable** is a named container for a value. You create variables so you can store data, give it a meaningful name and use it later.

## Declaring variables

JavaScript has three keywords for declaring variables:

```js
let score = 0          // can be reassigned
const pi = 3.14159     // cannot be reassigned
var legacy = 'old'     // older style — avoid in new code
```

### `let`

Use `let` for values that will change:

```js
let count = 1
count = count + 1
console.log(count) // 2
```

### `const`

Use `const` for values that should never be reassigned. **Prefer `const` by default** — it makes your code easier to reason about.

```js
const siteName = 'Code with Prasad'
siteName = 'Something else' // TypeError: Assignment to constant variable.
```

`const` prevents *reassignment*, not *changes*. The contents of a `const` object or array can still be modified:

```js
const colors = ['red', 'green']
colors.push('blue')    // allowed
console.log(colors)    // ['red', 'green', 'blue']
```

### Why avoid `var`?

`var` is function-scoped rather than block-scoped, and it can be used before its declaration line (it's "hoisted" with the value `undefined`). Both behaviours cause subtle bugs:

```js
if (true) {
  var leaked = 'I escape the block'
  let contained = 'I stay inside'
}
console.log(leaked)     // 'I escape the block'
console.log(contained)  // ReferenceError: contained is not defined
```

## Block scope

A **block** is any code between `{` and `}`. Variables declared with `let` and `const` exist only inside the block where they're declared:

```js
const message = 'outer'

{
  const message = 'inner'
  console.log(message) // 'inner'
}

console.log(message)   // 'outer'
```

## Naming rules

- Names can contain letters, digits, `_` and `$`, but can't start with a digit.
- Names are case-sensitive: `total` and `Total` are different variables.
- Reserved words such as `let`, `class` or `return` can't be used as names.

By convention, JavaScript uses **camelCase**: `firstName`, `totalPrice`, `isLoggedIn`. Choose names that describe the value — `userAge` is much clearer than `x`.

## Declaring without a value

A variable declared with `let` but not assigned has the value `undefined`:

```js
let result
console.log(result) // undefined
result = 42
```

A `const` must be given a value when it's declared.

## Try it yourself

1. Create a `const` called `birthYear` with your birth year.
2. Create a `let` called `age` and calculate it from the current year.
3. Print a sentence using both values, e.g. `I was born in 1995, so I'm 31.`
