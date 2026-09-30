`tsconfig.json` controls how strict TypeScript is, which files it includes and what JavaScript it produces. A good configuration catches far more bugs than a lax one.

## A solid starting point for an application

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,

    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

For a Node.js service run with `tsc`, use `"module": "nodenext"`, `"moduleResolution": "nodenext"`, set `"outDir": "dist"` and remove `noEmit`.

## What `strict` turns on

`"strict": true` enables a family of checks. The most important:

| Option | Catches |
| --- | --- |
| `strictNullChecks` | Using possibly `null`/`undefined` values |
| `noImplicitAny` | Parameters and variables silently typed as `any` |
| `strictFunctionTypes` | Unsafe callback parameter types |
| `strictPropertyInitialization` | Class fields never initialised |
| `useUnknownInCatchVariables` | `catch (e)` typed `unknown` instead of `any` |
| `strictBindCallApply` | Wrong arguments to `bind`/`call`/`apply` |

Always enable `strict` in new projects. In migrations, turn options on one at a time.

## Extra safety worth enabling

- **`noUncheckedIndexedAccess`** — `arr[i]` and `record[key]` include `undefined`, because they might be missing.

```ts
const scores: Record<string, number> = {}
const s = scores['asha'] // number | undefined — forces a check
```

- **`exactOptionalPropertyTypes`** — distinguishes "property missing" from "property set to `undefined`".
- **`noImplicitReturns`** — every code path must return.
- **`noUnusedLocals` / `noUnusedParameters`** — dead code errors (some teams leave these to the linter).

## Emit settings

- **`target`** — which JavaScript version to output (syntax is down-levelled below it).
- **`lib`** — which built-in APIs are available to the type checker (`DOM` for browsers, newer `ES` versions for newer methods).
- **`module`** — which module format to output (`ESNext`, `NodeNext`, `CommonJS`).
- **`outDir` / `rootDir`** — where compiled files go.
- **`sourceMap`** — map compiled code back to TypeScript for debugging.
- **`declaration`** — emit `.d.ts` files (for libraries).
- **`noEmit`** — only type-check; a bundler (Vite, esbuild) produces the JavaScript.

## `isolatedModules` and `verbatimModuleSyntax`

Tools like Vite, esbuild and SWC compile each file separately without full type information. These options make TypeScript flag code those tools can't handle, e.g. re-exporting a type without `export type`. Enable them whenever something other than `tsc` compiles your code.

## Paths and aliases

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`paths` only affects type checking — your bundler or runtime must be configured with the same alias.

## Multiple configs and project references

Large repos often have:

- `tsconfig.base.json` with shared options, and `"extends": "./tsconfig.base.json"` in each package.
- Separate configs for app code, tests and build scripts (different `lib` and `types`).
- **Project references** (`"references"` + `"composite": true`) so `tsc -b` builds packages incrementally in dependency order — much faster in monorepos.

## Checking types in CI

```json
{ "scripts": { "typecheck": "tsc --noEmit" } }
```

Run it in CI alongside lint and tests. `skipLibCheck: true` skips re-checking third-party `.d.ts` files, which speeds this up significantly.

## Try it yourself

Take a small JavaScript project, add a `tsconfig.json` with `allowJs` and `checkJs`, rename one file to `.ts`, and enable `strict`. Fix the errors, then enable `noUncheckedIndexedAccess` and see what new issues appear.
