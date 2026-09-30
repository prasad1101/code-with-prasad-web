**Operators** combine or compare values. You've already used `=` and `+`; this lesson covers the ones you'll use every day.

## Arithmetic operators

| Operator | Meaning | Example | Result |
| --- | --- | --- | --- |
| `+` | Addition | `7 + 2` | `9` |
| `-` | Subtraction | `7 - 2` | `5` |
| `*` | Multiplication | `7 * 2` | `14` |
| `/` | Division | `7 / 2` | `3.5` |
| `%` | Remainder | `7 % 2` | `1` |
| `**` | Exponent | `7 ** 2` | `49` |

The remainder operator is handy for checking whether a number is even: `n % 2 === 0`.

## Assignment operators

```js
let total = 10
total += 5   // total = total + 5  → 15
total -= 3   // → 12
total *= 2   // → 24
total /= 4   // → 6
total++      // → 7
total--      // → 6
```

## Comparison operators

Comparisons produce a boolean:

```js
5 > 3      // true
5 <= 3     // false
5 === 5    // true
5 !== 3    // true
```

### `===` vs. `==`

Always use **strict equality** (`===` and `!==`). The loose versions (`==`, `!=`) convert types before comparing, with confusing results:

```js
0 == ''          // true  😬
0 === ''         // false ✔
'1' == 1         // true
'1' === 1        // false
null == undefined  // true
null === undefined // false
```

## Logical operators

| Operator | Meaning | Example |
| --- | --- | --- |
| `&&` | AND — true if both sides are true | `age >= 18 && hasTicket` |
| `\|\|` | OR — true if either side is true | `isAdmin \|\| isOwner` |
| `!` | NOT — flips a boolean | `!isLoggedIn` |

```js
const age = 20
const hasTicket = true
console.log(age >= 18 && hasTicket) // true
```

### Truthy and falsy

Logical operators work with any value, not just booleans. These values are **falsy** — they behave like `false`:

`false`, `0`, `''` (empty string), `null`, `undefined`, `NaN`

Everything else is **truthy**, including `'0'`, `[]` and `{}`.

## Default values with `??` and `||`

```js
const input = ''
const a = input || 'default'   // 'default' — '' is falsy
const b = input ?? 'default'   // ''        — ?? only replaces null/undefined
```

Use `??` (nullish coalescing) when `0` or `''` are valid values you want to keep.

## Optional chaining `?.`

Safely read nested properties that might not exist:

```js
const user = { profile: null }
console.log(user.profile?.email)  // undefined, instead of throwing an error
```

## The ternary operator

A compact if/else that produces a value:

```js
const age = 16
const status = age >= 18 ? 'adult' : 'minor'
console.log(status) // 'minor'
```

## Try it yourself

Given `const price = 250` and `const isMember = true`, compute the final price: members get 10% off, and orders over 200 also get free shipping. Print the price and a message saying whether shipping is free.
