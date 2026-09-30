JavaScript's inheritance is **prototype-based**: objects inherit directly from other objects. Classes are syntax on top of this mechanism, so understanding prototypes explains how classes, built-in methods and `instanceof` really work.

## The prototype chain

Every object has an internal link to another object: its **prototype**. When you read a property that the object doesn't have, JavaScript looks it up on the prototype, then the prototype's prototype, and so on, until it reaches `null`.

```js
const animal = {
  eats: true,
  describe() {
    return `${this.name} eats: ${this.eats}`
  },
}

const rabbit = Object.create(animal) // rabbit's prototype is animal
rabbit.name = 'Bugs'

rabbit.describe()                          // 'Bugs eats: true' — found on animal
Object.getPrototypeOf(rabbit) === animal   // true
rabbit.hasOwnProperty('eats')              // false — inherited
Object.hasOwn(rabbit, 'name')              // true — own property (modern form)
```

Writing a property always creates or updates it on the object itself — it never modifies the prototype:

```js
rabbit.eats = false
animal.eats // still true
```

## Where built-in methods come from

```js
const arr = [1, 2, 3]
Object.getPrototypeOf(arr) === Array.prototype              // true
Object.getPrototypeOf(Array.prototype) === Object.prototype // true
Object.getPrototypeOf(Object.prototype)                     // null
```

`arr.map` isn't stored on `arr`; it's found on `Array.prototype`. `arr.hasOwnProperty` comes from `Object.prototype`, one level further up. Sharing methods through prototypes means a million arrays don't need a million copies of `map`.

## Constructor functions and `prototype`

Before classes, "types" were constructor functions. Every function has a `prototype` property, and objects created with `new` get it as their prototype:

```js
function User(name) {
  this.name = name // own property on each instance
}

User.prototype.greet = function () {
  return `Hi, ${this.name}` // shared by all instances
}

const u = new User('Asha')
u.greet()                                  // 'Hi, Asha'
Object.getPrototypeOf(u) === User.prototype // true
```

Don't confuse the two:

- `User.prototype` — the object that **instances** will inherit from.
- `Object.getPrototypeOf(User)` — the prototype of the function itself (`Function.prototype`).

## Classes are prototypes underneath

```js
class Admin extends User {
  ban(other) {
    return `${this.name} banned ${other}`
  }
}

const a = new Admin('Ravi')

Object.getPrototypeOf(a) === Admin.prototype                 // true
Object.getPrototypeOf(Admin.prototype) === User.prototype    // true
typeof Admin                                                 // 'function'
```

`a.greet()` is found by walking: `a` → `Admin.prototype` → `User.prototype`.

## How `instanceof` works

`x instanceof C` checks whether `C.prototype` appears anywhere in `x`'s prototype chain:

```js
a instanceof Admin  // true
a instanceof User   // true
a instanceof Object // true
```

## Objects without a prototype

`Object.create(null)` makes an object with no prototype — no inherited keys at all. Useful as a pure dictionary (though a `Map` is usually better):

```js
const dict = Object.create(null)
dict.toString // undefined
```

## Prototype pollution

If code merges untrusted JSON into objects without checks, an attacker can send `{"__proto__": {"isAdmin": true}}` and add properties to `Object.prototype` — affecting **every** object in the application.

```js
// Vulnerable deep merge
function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object') merge((target[key] ??= {}), source[key])
    else target[key] = source[key]
  }
}
```

Defences: skip the keys `__proto__`, `constructor` and `prototype` when merging; validate input with a schema; use `Map` or `Object.create(null)` for user-controlled keys.

## Performance note

Changing an object's prototype after creation (`Object.setPrototypeOf`) de-optimises property access in modern engines. Set prototypes at creation time with `Object.create` or classes.

## Try it yourself

1. Without using `class`, create a `Shape` constructor with an `area()` method on its prototype, and a `Square` constructor that inherits from it (`Object.create(Shape.prototype)`).
2. Verify the chain with `Object.getPrototypeOf` and `instanceof`.
3. Rewrite both with `class` syntax and compare.
