**Loops** repeat a block of code. Instead of writing the same line 100 times, you describe the repetition once.

## The `for` loop

The classic loop has three parts: a starting point, a condition, and an update.

```js
for (let i = 1; i <= 5; i++) {
  console.log(`Step ${i}`)
}
// Step 1 … Step 5
```

1. `let i = 1` runs once at the start.
2. `i <= 5` is checked before every iteration; the loop stops when it's false.
3. `i++` runs after every iteration.

## `while`

Use `while` when you don't know in advance how many times to loop:

```js
let balance = 1000
let years = 0

while (balance < 2000) {
  balance *= 1.07 // 7% growth per year
  years++
}

console.log(`Doubled after ${years} years`) // Doubled after 11 years
```

Make sure the condition eventually becomes false, or the loop runs forever.

## `do … while`

Like `while`, but the body always runs at least once:

```js
let attempts = 0
do {
  attempts++
  console.log(`Attempt ${attempts}`)
} while (attempts < 3)
```

## `for … of` — loop over values

The cleanest way to go through an array (or a string):

```js
const fruits = ['apple', 'banana', 'cherry']

for (const fruit of fruits) {
  console.log(fruit)
}

for (const char of 'hi!') {
  console.log(char)
}
```

## `for … in` — loop over object keys

```js
const scores = { asha: 91, ravi: 78 }

for (const name in scores) {
  console.log(`${name}: ${scores[name]}`)
}
```

Use `for…in` for plain objects, and `for…of` for arrays.

## `break` and `continue`

- `break` exits the loop entirely.
- `continue` skips to the next iteration.

```js
const numbers = [3, 8, -1, 5, 12]

for (const n of numbers) {
  if (n < 0) {
    console.log('Negative found — stopping.')
    break
  }
  if (n % 2 !== 0) continue // skip odd numbers
  console.log(`Even: ${n}`)
}
// Even: 8
// Negative found — stopping.
```

## A common pattern: accumulate a result

```js
const prices = [120, 45, 300, 80]
let total = 0

for (const price of prices) {
  total += price
}

console.log(total) // 545
```

In the Arrays lesson you'll see methods such as `reduce` and `filter` that express patterns like this even more concisely.

## Try it yourself

1. Print the multiplication table for 7 (7 × 1 to 7 × 10).
2. Given `const words = ['sky', 'javascript', 'loop', 'function']`, print only the words longer than 4 characters.
3. **FizzBuzz**: print the numbers 1 to 30, but print "Fizz" for multiples of 3, "Buzz" for multiples of 5, and "FizzBuzz" for multiples of both.
