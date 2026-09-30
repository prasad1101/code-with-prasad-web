**Node.js** is a JavaScript runtime that runs outside the browser. It's built on Chrome's V8 engine plus **libuv**, a C library that provides an event loop and asynchronous I/O. With Node.js you can build web servers, REST APIs, real-time apps, command-line tools and build tooling — all in JavaScript.

## Why Node.js?

- **One language across the stack** — the same JavaScript (or TypeScript) on the front end and back end; this is the "N" in MEAN and MERN.
- **Non-blocking I/O** — a single process handles thousands of concurrent connections efficiently, which suits APIs and real-time apps that spend most of their time waiting on databases and networks.
- **npm** — the largest package ecosystem in the world.
- **Fast startup and a small footprint** — well suited to containers and serverless functions.

Node.js is *not* ideal for heavy CPU work (video encoding, large number crunching) on the main thread — though worker threads help (covered later).

## Installing Node.js

Install the current **LTS** (long-term support) version from [nodejs.org](https://nodejs.org), or use a version manager so you can switch versions per project:

```bash
# macOS / Linux with nvm
nvm install --lts
nvm use --lts

node --version
npm --version
```

## The REPL

Run `node` with no arguments for an interactive shell:

```text
> 2 ** 10
1024
> const os = require('node:os')
> os.cpus().length
8
> .exit
```

## Your first script

```js
// hello.js
const name = process.argv[2] ?? 'world'
console.log(`Hello, ${name}! Running Node ${process.version} on ${process.platform}`)
```

```bash
node hello.js Asha
# Hello, Asha! Running Node v24.x on darwin
```

`process.argv` holds command-line arguments: `[nodePath, scriptPath, ...args]`.

Use `--watch` to restart automatically when files change during development:

```bash
node --watch hello.js
```

## Node.js vs. the browser

| | Browser | Node.js |
| --- | --- | --- |
| Global object | `window` | `globalThis` (`global`) |
| DOM | Yes | No |
| File system, processes, sockets | No (sandboxed) | Yes |
| Modules | ES modules | ES modules and CommonJS |
| Shared APIs | `fetch`, `URL`, `setTimeout`, `crypto.randomUUID`, `AbortController`, streams | Same — Node implements many web-standard APIs |

## Core modules

Node ships with built-in modules. Import them with the `node:` prefix to make it clear they're built in:

```js
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
```

## A tiny web server

```js
// server.js
import { createServer } from 'node:http'

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: 'Hello from Node.js', path: req.url }))
})

server.listen(3000, () => console.log('Listening on http://localhost:3000'))
```

Run it with `node server.js` and open the URL in your browser. In later lessons you'll see how this works in depth, and then how Express makes it more convenient.

## Running TypeScript

Recent Node versions can run `.ts` files directly by stripping type annotations (`node app.ts`). Type-check separately with `tsc --noEmit`.

## Try it yourself

Write `sysinfo.js` that prints the Node version, platform, number of CPU cores, total memory in GB and the current working directory (`process.cwd()`).
