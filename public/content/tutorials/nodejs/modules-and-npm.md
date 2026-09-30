Every Node.js project is a collection of modules plus a `package.json` describing its dependencies and scripts. This lesson covers both module systems and how to use npm well.

## `package.json`

```bash
mkdir my-api && cd my-api
npm init -y
```

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "test": "node --test"
  },
  "engines": { "node": ">=22" }
}
```

- `"type": "module"` makes `.js` files ES modules.
- `scripts` are run with `npm run <name>` (`npm start` and `npm test` are shortcuts).
- `engines` documents which Node versions are supported.

## ES modules vs. CommonJS

Node supports both:

```js
// ES modules (recommended for new code)
import express from 'express'
import { readFile } from 'node:fs/promises'
export function start() {}

// CommonJS (older, still very common)
const express = require('express')
const { readFile } = require('node:fs/promises')
module.exports = { start }
```

How Node decides:

- `.mjs` → ES module, `.cjs` → CommonJS.
- `.js` → ES module if the nearest `package.json` has `"type": "module"`, otherwise CommonJS.

Differences to remember in ESM:

- Relative imports need the file extension: `import { db } from './db.js'`.
- `__dirname` and `__filename` don't exist — use `import.meta.dirname` and `import.meta.filename`.
- Top-level `await` is allowed.
- Recent Node versions can `require()` ES modules synchronously (as long as they don't use top-level `await`), which makes mixing the two systems much easier.

## Installing packages

```bash
npm install express           # runtime dependency → "dependencies"
npm install -D vitest         # development only → "devDependencies"
npm uninstall express
npm install                   # install everything listed in package.json
```

`node_modules/` holds installed packages — never commit it. **Do** commit `package-lock.json`: it records the exact version of every package (including nested dependencies) so every machine installs the same tree.

In CI and Docker builds use:

```bash
npm ci   # clean install exactly from the lockfile; fails if it's out of sync
```

## Semantic versioning

Versions follow `MAJOR.MINOR.PATCH`:

- **MAJOR** — breaking changes
- **MINOR** — new features, backwards compatible
- **PATCH** — bug fixes

Version ranges in `package.json`:

| Range | Allows |
| --- | --- |
| `^4.19.2` | `4.x.x` ≥ 4.19.2 (default — minor and patch updates) |
| `~4.19.2` | `4.19.x` ≥ 4.19.2 (patch updates only) |
| `4.19.2` | Exactly that version |

## Useful npm commands

```bash
npm outdated           # which packages have newer versions
npm update             # update within allowed ranges
npm audit              # known vulnerabilities in the dependency tree
npm ls express         # where a package sits in the tree
npx <command>          # run a package binary without installing globally
npm run                # list available scripts
```

## Environment-specific configuration

Node 20.6+ can load a `.env` file without extra packages:

```bash
node --env-file=.env src/index.js
```

```text
# .env — never commit real secrets; commit a .env.example instead
PORT=3000
DATABASE_URL=mongodb://localhost:27017/shop
```

Read values with `process.env.PORT`. (Validating them is covered in the process lesson.)

## Creating your own modules

Organise code by feature, one responsibility per module:

```text
src/
  index.js          # starts the server
  config.js         # reads and validates configuration
  users/
    users.routes.js
    users.service.js
    users.repository.js
```

```js
// users/users.service.js
import { findById } from './users.repository.js'

export async function getProfile(id) {
  const user = await findById(id)
  if (!user) throw new Error('User not found')
  return { id: user.id, name: user.name }
}
```

## Choosing dependencies

Each dependency is code you must trust and maintain. Before installing, check: is it maintained, widely used, reasonably small, and does the platform already provide it? Modern Node includes `fetch`, a test runner, `.env` loading, `crypto.randomUUID`, `util.parseArgs` and file watching — many packages that used to be essential are now optional.

## Try it yourself

Create a project with `"type": "module"`, a `dev` script using `--watch`, a `.env` file loaded with `--env-file`, and a module that exports a `greet(name)` function imported by `src/index.js`.
