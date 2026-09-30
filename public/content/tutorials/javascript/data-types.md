Every value in JavaScript has a **type**. The type determines what you can do with the value — you can do maths with numbers, join strings together, and so on.

## Primitive types

JavaScript has seven primitive types:

| Type | Example | Notes |
| --- | --- | --- |
| `string` | `'hello'`, `"hi"`, `` `hey` `` | Text |
| `number` | `42`, `3.14`, `-7` | Integers and decimals share one type |
| `boolean` | `true`, `false` | Yes/no values |
| `undefined` | `undefined` | A variable that hasn't been given a value |
| `null` | `null` | An intentional "no value" |
| `bigint` | `9007199254740993n` | Integers larger than `number` can hold safely |
| `symbol` | `Symbol('id')` | Unique identifiers (advanced) |

Everything else — arrays, objects, functions, dates — is an **object**.

## Strings

```js
const single = 'single quotes'
const double = "double quotes"
const name = 'Asha'
const template = `Hello, ${name}! 2 + 2 = ${2 + 2}`

console.log(template)        // Hello, Asha! 2 + 2 = 4
console.log(name.length)     // 4
console.log(name.toUpperCase()) // ASHA
```

**Template literals** (backticks) can include expressions with `${…}` and can span multiple lines.

## Numbers

```js
const price = 19.99
const quantity = 3
console.log(price * quantity) // 59.97

console.log(10 / 0)           // Infinity
console.log('abc' * 2)        // NaN — "Not a Number"
console.log(0.1 + 0.2)        // 0.30000000000000004
```

The last line surprises everyone once. Numbers are stored in binary floating point, so some decimals can't be represented exactly. For money, work in whole units (cents or paise) or round when displaying: `(0.1 + 0.2).toFixed(2)` gives `'0.30'`.

## Booleans

```js
const isLoggedIn = true
const hasItems = 5 > 0   // true
```

## `null` vs. `undefined`

- `undefined` means a value hasn't been set yet.
- `null` means "deliberately empty".

```js
let middleName = null  // we know there isn't one
let nickname           // undefined — not set
```

## Checking a type with `typeof`

```js
typeof 'hi'         // 'string'
typeof 42           // 'number'
typeof true         // 'boolean'
typeof undefined    // 'undefined'
typeof {}           // 'object'
typeof []           // 'object'  (use Array.isArray to check for arrays)
typeof null         // 'object'  (a famous historical quirk)
```

## Type conversion

JavaScript converts types automatically in some situations, which can be surprising:

```js
'5' + 1    // '51'  — + with a string joins text
'5' - 1    // 4     — - converts the string to a number
```

Convert explicitly to avoid surprises:

```js
Number('42')     // 42
Number('4x')     // NaN
String(42)       // '42'
Boolean('')      // false
Boolean('text')  // true
```

## Try it yourself

Create variables of each primitive type (except `symbol`) and print each one with its `typeof`. Then predict — before running it — what `'10' * '2'` and `'10' + '2'` return.
