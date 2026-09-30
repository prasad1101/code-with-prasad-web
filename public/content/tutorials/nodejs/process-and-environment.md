The global `process` object connects your program to the operating system: command-line arguments, environment variables, standard input/output, exit codes and signals.

## Command-line arguments

```js
// node greet.js Asha --shout
console.log(process.argv) // ['/usr/bin/node', '/path/greet.js', 'Asha', '--shout']
```

Parse flags with the built-in `util.parseArgs`:

```js
import { parseArgs } from 'node:util'

const { values, positionals } = parseArgs({
  options: {
    shout: { type: 'boolean', short: 's' },
    times: { type: 'string', short: 'n', default: '1' },
  },
  allowPositionals: true,
})

const name = positionals[0] ?? 'world'
for (let i = 0; i < Number(values.times); i++) {
  const msg = `Hello, ${name}`
  console.log(values.shout ? msg.toUpperCase() : msg)
}
```

## Environment variables

Configuration that differs between environments (ports, database URLs, API keys) belongs in environment variables, not in code:

```js
const port = Number(process.env.PORT ?? 3000)
const isProduction = process.env.NODE_ENV === 'production'
```

Load a local `.env` file in development:

```bash
node --env-file=.env src/index.js
node --env-file-if-exists=.env src/index.js   # don't fail if the file is missing
```

### Validate configuration at startup

Every value in `process.env` is a string (or `undefined`). Parse and validate once, and fail fast:

```js
// config.js
function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  logLevel: process.env.LOG_LEVEL ?? 'info',
}
```

Import `config` everywhere instead of reading `process.env` throughout the code base. (A schema library such as Zod makes this even more robust.)

## Standard streams

```js
process.stdout.write('No newline added\n')
console.error('Errors and diagnostics go to stderr')

// Read piped input: cat data.json | node count.js
let input = ''
for await (const chunk of process.stdin) input += chunk
console.log(JSON.parse(input).length)
```

Writing data to **stdout** and messages to **stderr** lets users pipe your output to other tools without the noise.

## Exit codes

```js
if (!file) {
  console.error('Usage: node convert.js <file>')
  process.exitCode = 1 // non-zero = failure; lets the process exit naturally
}
```

Prefer setting `process.exitCode` over calling `process.exit()`, which terminates immediately — even while writes to stdout or files are still pending.

## Signals and graceful shutdown

Process managers (Docker, Kubernetes, systemd, PM2) stop your app by sending `SIGTERM`; Ctrl+C sends `SIGINT`:

```js
async function shutdown(signal) {
  console.log(`${signal} received — closing server and database`)
  await new Promise((resolve) => server.close(resolve))
  await db.close()
  process.exit(0)
}

process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
```

## Process information

```js
process.pid                 // process id
process.cwd()               // current working directory
process.uptime()            // seconds since start
process.memoryUsage()       // { rss, heapTotal, heapUsed, external, arrayBuffers }
process.version             // Node version
process.platform            // 'linux', 'darwin', 'win32'
```

## Last-resort error handlers

```js
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection', reason)
  process.exitCode = 1
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err)
  process.exit(1) // state may be corrupt — restart via your process manager
})
```

Since Node 15, an unhandled promise rejection crashes the process by default. These handlers are for logging before exit, not for keeping a broken process alive.

## Try it yourself

Write a CLI `wordcount.js` that reads text from a file argument **or** from stdin, supports `--top N` via `parseArgs`, prints the top N words, exits with code 2 when the file doesn't exist, and handles `SIGINT` by printing partial results.
