An **object** groups related data and behaviour under one name. Where an array is an *ordered list*, an object is a collection of **key–value pairs** — perfect for describing a thing: a user, a product, a config.

## Creating objects

```js
const user = {
  name: 'Asha',
  age: 28,
  isAdmin: false,
  skills: ['JavaScript', 'SQL'],
}
```

## Reading and writing properties

```js
console.log(user.name)        // dot notation → 'Asha'
console.log(user['age'])      // bracket notation → 28

const key = 'isAdmin'
console.log(user[key])        // brackets are needed when the key is in a variable

user.age = 29                 // update
user.city = 'Pune'            // add a new property
delete user.isAdmin           // remove a property
```

Reading a property that doesn't exist gives `undefined` rather than an error. Use optional chaining for nested values that might be missing: `user.address?.pincode`.

## Methods

A function stored on an object is called a **method**. Inside it, `this` refers to the object:

```js
const account = {
  owner: 'Ravi',
  balance: 500,
  deposit(amount) {
    this.balance += amount
    return this.balance
  },
}

account.deposit(250) // 750
```

## Shorthand properties

When a variable has the same name as the key, you can write it once:

```js
const name = 'Meera'
const role = 'developer'

const person = { name, role } // { name: 'Meera', role: 'developer' }
```

## Destructuring

Pull properties out into variables:

```js
const { name, skills, city = 'Unknown' } = user
console.log(name)  // 'Asha'
console.log(city)  // 'Pune', or 'Unknown' if it were missing
```

It works in function parameters too — a very common pattern:

```js
function describe({ name, age }) {
  return `${name} is ${age}`
}

describe(user) // 'Asha is 29'
```

## Spread: copying and merging

```js
const defaults = { theme: 'dark', fontSize: 16 }
const saved = { fontSize: 18 }

const settings = { ...defaults, ...saved }
// { theme: 'dark', fontSize: 18 } — later properties win
```

Spread makes a **shallow** copy: nested objects are still shared. `structuredClone(obj)` makes a deep copy.

## Looping over objects

```js
const prices = { tea: 20, coffee: 35, juice: 50 }

Object.keys(prices)    // ['tea', 'coffee', 'juice']
Object.values(prices)  // [20, 35, 50]

for (const [item, price] of Object.entries(prices)) {
  console.log(`${item}: ₹${price}`)
}
```

## Objects are shared by reference

Assigning an object to another variable doesn't copy it — both names point to the same object:

```js
const a = { count: 1 }
const b = a
b.count = 2
console.log(a.count) // 2
```

## JSON

**JSON** (JavaScript Object Notation) is the standard text format for exchanging data with APIs. Convert between objects and JSON text with:

```js
const text = JSON.stringify({ id: 1, tags: ['js'] }) // '{"id":1,"tags":["js"]}'
const data = JSON.parse(text)                        // back to an object
```

## Try it yourself

Create a `book` object with `title`, `author`, `year` and a method `summary()` that returns `"<title> by <author> (<year>)"`. Then create a copy with a different `year` using spread, and print both summaries.
