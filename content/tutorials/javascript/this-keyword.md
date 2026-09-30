`this` confuses almost everyone at first because, unlike other variables, its value depends on **how a function is called** — not where it's defined. (Arrow functions are the exception.) Four rules cover nearly every case.

## Rule 1: method call — `this` is the object before the dot

```js
const user = {
  name: 'Asha',
  greet() {
    return `Hi, I'm ${this.name}`
  },
}

user.greet() // "Hi, I'm Asha"
```

## Rule 2: plain function call — `this` is `undefined` (strict mode)

Take the method off the object and call it on its own, and the "object before the dot" is gone:

```js
const greet = user.greet
greet() // TypeError: Cannot read properties of undefined (reading 'name')
```

In strict mode (all modules and classes), `this` is `undefined`. In sloppy-mode scripts it falls back to the global object, which hides the bug.

This is the most common `this` bug — it happens whenever a method is passed as a callback:

```js
setTimeout(user.greet, 100)                 // loses `this`
button.addEventListener('click', user.greet) // `this` becomes the button!
```

## Rule 3: explicit binding — `call`, `apply`, `bind`

```js
function introduce(greeting, punctuation) {
  return `${greeting}, I'm ${this.name}${punctuation}`
}

const ravi = { name: 'Ravi' }

introduce.call(ravi, 'Hello', '!')     // arguments listed individually
introduce.apply(ravi, ['Hello', '!'])  // arguments as an array
const bound = introduce.bind(ravi)     // returns a new function with `this` fixed
bound('Hey', '.')                      // "Hey, I'm Ravi."
```

`bind` is the classic fix for callbacks:

```js
setTimeout(user.greet.bind(user), 100)
```

## Rule 4: `new` — `this` is the newly created object

```js
function Person(name) {
  this.name = name
}
const p = new Person('Meera') // `this` inside Person is the new object
```

Class constructors work the same way.

## Arrow functions: no own `this`

Arrow functions don't get their own `this`; they use the `this` of the scope they were **defined** in (lexical `this`). That makes them perfect for callbacks inside methods:

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds++ // `this` is `timer`, captured from start()
    }, 1000)
  },
}
```

…and a poor choice for object methods:

```js
const counter = {
  count: 0,
  increment: () => {
    this.count++ // `this` is NOT counter — it's the outer scope's `this`
  },
}
```

`call`, `apply` and `bind` can't change an arrow function's `this`.

## Precedence

When several rules could apply, the order is:

1. `new` binding
2. Explicit binding (`call` / `apply` / `bind`)
3. Method call (`obj.method()`)
4. Default (`undefined` in strict mode)

Arrow functions skip all of this and use lexical `this`.

## `this` in classes and event handlers

```js
class Toggle {
  on = false

  // Arrow function field: `this` is always the instance, safe to pass as a callback
  handleClick = () => {
    this.on = !this.on
  }
}

const t = new Toggle()
button.addEventListener('click', t.handleClick) // works
```

In a regular-function DOM listener, `this` is the element the listener is attached to (the same as `event.currentTarget`). Prefer `event.currentTarget` — it's explicit and works in arrow functions too.

## Try it yourself

Predict each result, then run it:

```js
const obj = {
  name: 'obj',
  regular() { return this?.name },
  arrow: () => this?.name,
  nested() {
    return [function () { return this?.name }(), (() => this.name)()]
  },
}

obj.regular()
obj.arrow()
const r = obj.regular; r()
obj.nested()
```

(Answers in an ES module: `'obj'`, `undefined`, `undefined`, `[undefined, 'obj']`.)
