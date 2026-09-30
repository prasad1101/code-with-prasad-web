**Metaprogramming** means writing code that inspects or changes how other code behaves. JavaScript's main tools for this are `Proxy`, `Reflect` and symbols. They power reactive frameworks (Vue's reactivity is built on proxies), validation libraries, ORMs and mocking tools.

## `Proxy`: intercepting operations

A proxy wraps a target object and lets you intercept fundamental operations — property reads, writes, deletes, `in` checks, function calls — using **traps**:

```js
const user = { name: 'Asha', age: 28 }

const logged = new Proxy(user, {
  get(target, prop, receiver) {
    console.log(`read ${String(prop)}`)
    return Reflect.get(target, prop, receiver)
  },
  set(target, prop, value, receiver) {
    console.log(`write ${String(prop)} = ${value}`)
    return Reflect.set(target, prop, value, receiver)
  },
})

logged.name       // logs "read name"
logged.age = 29   // logs "write age = 29"
```

Common traps: `get`, `set`, `has` (the `in` operator), `deleteProperty`, `ownKeys` (`Object.keys`, `for…in`), `apply` (calling a function), and `construct` (`new`).

## `Reflect`: the default behaviour

`Reflect` has a method for every trap, performing the **default** operation. Inside traps, use `Reflect` to forward to the target correctly — it handles getters, inheritance and the `receiver` properly, and returns booleans instead of throwing.

```js
Reflect.has(user, 'name')        // same as 'name' in user
Reflect.ownKeys(user)            // ['name', 'age']
Reflect.defineProperty(user, 'id', { value: 1, writable: false })
```

## Practical examples

### Validation

```js
function validated(target, schema) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const check = schema[prop]
      if (check && !check(value)) {
        throw new TypeError(`Invalid value for ${String(prop)}: ${value}`)
      }
      return Reflect.set(obj, prop, value)
    },
  })
}

const person = validated({}, {
  age: (v) => Number.isInteger(v) && v >= 0,
  email: (v) => /^\S+@\S+$/.test(v),
})

person.age = 30     // ok
person.age = -1     // TypeError
```

### Default values and safe access

```js
const withDefault = (obj, fallback) =>
  new Proxy(obj, { get: (t, p) => (p in t ? t[p] : fallback) })

const scores = withDefault({ asha: 90 }, 0)
scores.ravi // 0
```

### Reactivity (the idea behind Vue)

```js
function reactive(obj, onChange) {
  return new Proxy(obj, {
    set(target, prop, value) {
      const old = target[prop]
      const ok = Reflect.set(target, prop, value)
      if (old !== value) onChange(prop, value)
      return ok
    },
  })
}

const state = reactive({ count: 0 }, (prop, value) => {
  document.querySelector('#count').textContent = value
})
state.count++ // the DOM updates automatically
```

### Read-only views

```js
const readonly = (obj) =>
  new Proxy(obj, {
    set() { throw new TypeError('Read-only') },
    deleteProperty() { throw new TypeError('Read-only') },
  })
```

## Well-known symbols

Symbols let objects hook into built-in language behaviour:

```js
class Money {
  constructor(amount, currency) {
    this.amount = amount
    this.currency = currency
  }

  // Controls conversion in `+money`, template literals, comparisons
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.amount : `${this.amount.toFixed(2)} ${this.currency}`
  }

  // Controls Object.prototype.toString output
  get [Symbol.toStringTag]() {
    return 'Money'
  }
}

const price = new Money(49.5, 'INR')
console.log(`${price}`) // '49.50 INR'
console.log(+price)     // 49.5
```

Others include `Symbol.iterator` (iteration — see the generators lesson) and `Symbol.asyncIterator`.

## Property descriptors

Every property has a descriptor controlling whether it's writable, enumerable and configurable:

```js
const config = {}
Object.defineProperty(config, 'version', {
  value: '1.0',
  writable: false,
  enumerable: true,
  configurable: false,
})

config.version = '2.0' // silently ignored (TypeError in strict mode)
Object.getOwnPropertyDescriptor(config, 'version')
```

`Object.freeze` makes all properties non-writable and non-configurable; `Object.seal` prevents adding or deleting properties.

## Caveats

- Proxies add overhead to every intercepted operation — avoid them in hot paths.
- `proxy !== target`: identity checks and `WeakMap` keys differ.
- Some built-ins (`Map`, `Set`, `Date`, private class fields) rely on internal slots and don't work transparently through a proxy without extra handling.
- Metaprogramming makes code "magic" — use it in libraries and infrastructure, sparingly in application code.

## Try it yourself

1. Write `trackAccess(obj)` that returns a proxy plus a `Set` of every property name read.
2. Build a `negativeIndexArray(arr)` proxy so `arr[-1]` returns the last element.
3. Give a `Range` class a `Symbol.iterator` so `[...new Range(1, 5)]` works.
