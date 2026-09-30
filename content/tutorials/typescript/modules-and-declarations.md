Real projects combine your own modules with npm packages written in JavaScript. This lesson explains how TypeScript finds types for everything you import, and how to write declarations when types are missing.

## Importing and exporting types

TypeScript uses standard ES module syntax. Types can be exported like values:

```ts
// models.ts
export interface User { id: string; name: string }
export type Role = 'admin' | 'user'
export const DEFAULT_ROLE: Role = 'user'
```

Use `import type` for imports that are only types — they're guaranteed to be erased, which matters for bundlers and `verbatimModuleSyntax`:

```ts
import type { User, Role } from './models'
import { DEFAULT_ROLE } from './models'

// or inline
import { DEFAULT_ROLE, type Role } from './models'
```

## Where types for packages come from

1. **Bundled types** — the package ships `.d.ts` files (listed under `"types"` or `"exports"` in its `package.json`). Most modern packages do.
2. **DefinitelyTyped** — community types published as `@types/<package>`:

```bash
npm install express
npm install -D @types/express
```

3. **Neither** — TypeScript reports "Could not find a declaration file for module". You can write your own.

## Declaration files (`.d.ts`)

A `.d.ts` file contains only types — no implementation. It describes JavaScript that exists elsewhere.

Minimal declaration for an untyped package:

```ts
// src/types/legacy-slugify.d.ts
declare module 'legacy-slugify' {
  export default function slugify(text: string, options?: { lower?: boolean }): string
}
```

Quick escape hatch (everything becomes `any`, use temporarily):

```ts
declare module 'some-untyped-lib'
```

## Declaring globals

Values injected by a script tag or the build tool:

```ts
// src/types/globals.d.ts
declare const __APP_VERSION__: string

interface Window {
  analytics?: { track(event: string, props?: Record<string, unknown>): void }
}
```

Vite, for example, types `import.meta.env` via `vite/client`; you extend it like this:

```ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
}
```

## Module augmentation

Add to types from another module — for example, attaching `user` to Express's `Request`:

```ts
// src/types/express.d.ts
import 'express'

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: 'admin' | 'user' }
  }
}
```

The `import` at the top makes the file a module, so `declare module` *augments* rather than replaces.

## Non-code imports

Tell TypeScript about files your bundler handles:

```ts
declare module '*.svg' {
  const url: string
  export default url
}

declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
```

## Publishing types for your own library

Set `"declaration": true` in `tsconfig.json` so `tsc` emits `.d.ts` files next to the JavaScript, and point `package.json` at them:

```json
{
  "name": "my-lib",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

## Module resolution in brief

`moduleResolution` controls how import paths are resolved:

- **`bundler`** — for apps built with Vite, webpack, esbuild; allows extensionless relative imports.
- **`nodenext`** — for code run directly by Node.js; follows Node's rules, so relative ESM imports need file extensions (`./util.js`, even when the source is `util.ts`).

## Try it yourself

1. Install a small JavaScript-only package without types and write a `declare module` for the functions you use.
2. Add a global `__BUILD_TIME__` constant declaration and use it.
3. Augment `Window` with a typed `dataLayer: unknown[]`.
