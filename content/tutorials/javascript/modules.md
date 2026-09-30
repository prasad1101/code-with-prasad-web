As programs grow, you split them into files. **ES modules** (ESM) are JavaScript's standard module system: each file has its own scope and explicitly **exports** what others may **import**.

## Named exports

```js
// math.js
export const PI = 3.14159

export function area(radius) {
  return PI * radius ** 2
}

export function circumference(radius) {
  return 2 * PI * radius
}
```

```js
// app.js
import { area, PI } from './math.js'
import { circumference as perimeter } from './math.js' // rename on import

console.log(area(2), PI, perimeter(2))
```

## Default exports

A module can have one **default** export, imported under any name:

```js
// logger.js
export default function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}
```

```js
import log from './logger.js'
log('Server started')
```

Many teams prefer named exports everywhere: they're easier to search for, auto-import reliably, and can't be accidentally renamed differently in every file.

## Namespace imports and re-exports

```js
import * as math from './math.js'
math.area(3)

// index.js — a "barrel" that re-exports from several files
export { area, circumference } from './math.js'
export { default as log } from './logger.js'
```

## Modules in the browser

```html
<script type="module" src="./app.js"></script>
```

Module scripts are:

- **Deferred** — they run after the HTML is parsed.
- In **strict mode** automatically.
- Scoped — top-level variables don't become globals.
- Loaded with CORS, so they won't work from `file://`; use a local dev server.

## Modules in Node.js

Node.js supports both ESM and the older **CommonJS** format:

```js
// CommonJS
const fs = require('node:fs')
module.exports = { readConfig }

// ES modules
import fs from 'node:fs'
export { readConfig }
```

Node treats a file as ESM if it ends in `.mjs`, or ends in `.js` and the nearest `package.json` has `"type": "module"`.

## Dynamic imports

`import()` loads a module at runtime and returns a promise. Bundlers split dynamically imported modules into separate files, which is how apps **lazy-load** code:

```js
button.addEventListener('click', async () => {
  const { openEditor } = await import('./editor.js')
  openEditor()
})
```

## Top-level `await`

In ES modules you can `await` at the top level:

```js
// config.js
const response = await fetch('/config.json')
export const config = await response.json()
```

Any module importing `config.js` waits until it finishes. Use this sparingly — a slow top-level `await` delays everything that depends on it.

## Live bindings and module caching

- A module's code runs **once**, the first time it's imported; later imports share the same instance.
- Imports are **live bindings**, not copies: if the exporting module updates an exported `let`, importers see the new value. Importers can't reassign imports themselves.

```js
// counter.js
export let count = 0
export function increment() { count++ }

// app.js
import { count, increment } from './counter.js'
increment()
console.log(count) // 1
```

## Try it yourself

Split a small to-do app into modules: `storage.js` (load/save to `localStorage`), `render.js` (DOM updates) and `app.js` (wires events together). Then lazy-load a `stats.js` module only when the user clicks a "Show statistics" button.
