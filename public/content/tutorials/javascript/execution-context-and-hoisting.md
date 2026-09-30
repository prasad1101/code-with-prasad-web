Why can you call a function before its declaration, but not use a `let` variable before its line? The answer is how JavaScript **creates execution contexts** and **hoists** declarations.

## Execution contexts

Whenever JavaScript runs code, it does so inside an **execution context**:

- The **global context**, created when a script starts.
- A **function context**, created each time a function is called.
- A **module context** for each ES module.

Each context is created in two phases:

1. **Creation phase** — the engine scans the code and sets up bindings for every declaration in that scope.
2. **Execution phase** — code runs line by line.

Contexts are tracked on the **call stack**: calling a function pushes its context; returning pops it.

```js
function a() { b() }
function b() { console.trace() } // shows the stack: b ← a ← (global)
a()
```

Too many nested calls exhaust the stack: `RangeError: Maximum call stack size exceeded` — usually a recursion without a base case.

## Hoisting

During the creation phase, declarations are registered before any code runs. This is called **hoisting**, and each kind of declaration behaves differently:

| Declaration | Hoisted? | Value before its line |
| --- | --- | --- |
| `function f() {}` | Yes, fully | The complete function |
| `var x` | Yes | `undefined` |
| `let x` / `const x` | Yes, but uninitialised | **ReferenceError** (temporal dead zone) |
| `class C {}` | Yes, but uninitialised | **ReferenceError** |
| `import` | Yes | The imported binding |

### Function declarations

```js
greet() // works — 'Hello'

function greet() {
  console.log('Hello')
}
```

Function **expressions** follow the rules of the variable they're assigned to:

```js
sayHi() // TypeError: sayHi is not a function (it's undefined)
var sayHi = function () { console.log('Hi') }

sayBye() // ReferenceError: Cannot access 'sayBye' before initialization
const sayBye = () => console.log('Bye')
```

### `var` hoisting

```js
console.log(total) // undefined — declared, not yet assigned
var total = 10
```

### The temporal dead zone (TDZ)

`let`, `const` and `class` bindings exist from the start of their block but can't be accessed until the declaration line runs. The span in between is the **temporal dead zone**:

```js
{
  // TDZ for `price` starts here
  console.log(price) // ReferenceError
  let price = 42     // TDZ ends
}
```

The TDZ exists to catch bugs: reading a variable before it's set is almost always a mistake, and `var`'s silent `undefined` hides it.

A subtle consequence — an inner declaration shadows the outer one for the **whole block**:

```js
const name = 'outer'
function show() {
  console.log(name) // ReferenceError — the inner `name` is in its TDZ
  const name = 'inner'
}
```

## `var` in loops: a classic bug

`var` is function-scoped, so there's one variable shared by every iteration:

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)) // 3, 3, 3
}

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j)) // 0, 1, 2 — a fresh binding per iteration
}
```

## Strict mode

Strict mode (automatic in modules and classes, or enabled with `'use strict'`) turns silent mistakes into errors, for example assigning to an undeclared variable:

```js
'use strict'
totl = 5 // ReferenceError instead of silently creating a global
```

## Practical takeaways

- Use `const` by default and `let` when reassigning; avoid `var`.
- Declare variables at the top of the block where they're used.
- Relying on function-declaration hoisting is fine (e.g. helpers at the bottom of a file), but be consistent.

## Try it yourself

Predict the output before running:

```js
console.log(typeof hoisted, typeof notHoisted)
function hoisted() {}
var notHoisted = () => {}

let x = 1
{
  console.log(typeof x)
  let x = 2
}
```

(Answer: `function undefined`, then a `ReferenceError` — `typeof` doesn't protect you inside the TDZ.)
