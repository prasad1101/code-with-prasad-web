**TypeScript** is JavaScript with a static type system. You describe the shapes of your data, and the compiler checks your code *before* it runs — catching typos, `undefined` errors and wrong arguments while you type. TypeScript compiles to plain JavaScript, so it runs anywhere JavaScript does.

## Why TypeScript?

```js
// JavaScript: this bug only shows up at runtime
function total(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}
total([{ price: 10, quantity: 2 }]) // NaN — `qty` doesn't exist
```

```ts
// TypeScript: the mistake is caught in the editor
type Item = { price: number; qty: number }

function total(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}
total([{ price: 10, quantity: 2 }])
// Error: Object literal may only specify known properties, and 'quantity' does not exist in type 'Item'.
```

Benefits:

- **Fewer runtime bugs** — whole classes of errors (typos, null access, wrong argument types) are caught at compile time.
- **Better tooling** — accurate autocomplete, go-to-definition, safe automated refactoring.
- **Living documentation** — types describe what functions expect and return.
- **Confidence at scale** — large teams and code bases can change code safely.

Angular is written in TypeScript and uses it by default; most React, Node.js and NestJS projects use it too.

## Types disappear at runtime

TypeScript's types exist only at compile time. The compiler **erases** them and outputs JavaScript:

```ts
const greet = (name: string): string => `Hello, ${name}`
```

becomes

```js
const greet = (name) => `Hello, ${name}`
```

This means types can't validate data arriving at runtime (API responses, user input) — you'll learn how to handle that in the runtime-validation lesson.

## Setting up

```bash
mkdir ts-playground && cd ts-playground
npm init -y
npm install -D typescript
npx tsc --init          # creates tsconfig.json
```

Create `src/index.ts`:

```ts
const message: string = 'Hello, TypeScript'
console.log(message)
```

Compile and run:

```bash
npx tsc                 # emits JavaScript according to tsconfig.json
node dist/index.js      # if "outDir" is "dist"
```

For quick experiments, run TypeScript directly with **tsx**, or with Node.js itself — recent Node versions can execute `.ts` files by stripping the types:

```bash
npx tsx src/index.ts
node src/index.ts       # Node 22.18+ / 24 (type stripping)
```

Type **stripping** doesn't type-check; run `npx tsc --noEmit` (or rely on your editor) to check types.

The online **TypeScript Playground** (typescriptlang.org/play) is great for trying snippets without installing anything.

## Type inference

You don't need to annotate everything. TypeScript **infers** types from values:

```ts
let count = 0            // inferred as number
count = 'zero'           // Error: Type 'string' is not assignable to type 'number'

const names = ['Asha', 'Ravi']  // string[]
const upper = names.map((n) => n.toUpperCase()) // string[] — n is inferred as string
```

A good rule: annotate **function parameters** and **public APIs**; let inference handle local variables.

## Gradual adoption

TypeScript accepts valid JavaScript, so existing projects can migrate file by file: rename `.js` to `.ts`, fix the errors, and tighten settings over time. You can even type-check plain JavaScript with JSDoc comments and `// @ts-check`.

## Try it yourself

Set up a project, write a function `formatPrice(amount: number, currency: string): string`, and try calling it with wrong arguments to see the errors your editor shows.
