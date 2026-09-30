Programs constantly make decisions: *is the user logged in? Is the cart empty? Is the password long enough?* **Conditionals** run different code depending on the answer.

## `if`

```js
const temperature = 32

if (temperature > 30) {
  console.log("It's hot — drink water!")
}
```

The code inside `{ }` runs only if the condition is truthy.

## `if … else`

```js
const age = 16

if (age >= 18) {
  console.log('You can vote.')
} else {
  console.log(`You can vote in ${18 - age} years.`)
}
```

## `else if` for several cases

Conditions are checked from top to bottom; the first one that matches wins.

```js
const score = 72

if (score >= 90) {
  console.log('Grade: A')
} else if (score >= 75) {
  console.log('Grade: B')
} else if (score >= 60) {
  console.log('Grade: C')
} else {
  console.log('Grade: F')
}
// Grade: C
```

## Combining conditions

```js
const isWeekend = true
const isRaining = false

if (isWeekend && !isRaining) {
  console.log('Go for a hike!')
}
```

## `switch`

`switch` compares one value against many possible matches using `===`:

```js
const day = 'sat'

switch (day) {
  case 'sat':
  case 'sun':
    console.log('Weekend')
    break
  case 'fri':
    console.log('Almost the weekend')
    break
  default:
    console.log('Weekday')
}
```

Don't forget `break` — without it, execution "falls through" into the next case. Above, `'sat'` intentionally falls through to share the `'sun'` branch.

## Early returns keep code flat

Inside functions (covered soon), returning early avoids deep nesting:

```js
function checkout(cart) {
  if (cart.length === 0) {
    return 'Your cart is empty.'
  }
  if (!cart.every((item) => item.inStock)) {
    return 'Some items are out of stock.'
  }
  return 'Proceeding to payment…'
}
```

## Lookup objects instead of long chains

When you're mapping values to values, an object is often cleaner than `if`/`switch`:

```js
const shippingDays = { standard: 5, express: 2, sameDay: 0 }
const method = 'express'

console.log(`Arrives in ${shippingDays[method] ?? 'unknown'} days`)
```

## Try it yourself

Write code that takes a number `hour` (0–23) and prints "Good morning" (5–11), "Good afternoon" (12–16), "Good evening" (17–21) or "Good night" otherwise.
