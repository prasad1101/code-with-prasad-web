## What is Node.js and how is it different from JavaScript in the browser?
Level: Beginner | Tags: basics

Node.js is a JavaScript **runtime** built on the V8 engine and libuv. It runs JavaScript outside the browser, with access to the file system, network sockets, processes and OS APIs.

Differences from the browser:

- No DOM or `window`; global object is `globalThis`/`global`.
- Access to `fs`, `net`, `child_process`, `process` etc.
- Supports both CommonJS and ES modules.
- Shares many web APIs: `fetch`, `URL`, timers, `AbortController`, Web Streams, `crypto.randomUUID`.

It's used for APIs, real-time servers, CLIs, build tools and serverless functions.

## Node.js is single-threaded — how does it handle many concurrent requests?
Level: Beginner | Tags: event-loop, concurrency

Your JavaScript runs on one thread, but I/O is **non-blocking**. When a request needs the database or network, Node starts the operation and moves on to other work. The OS (or libuv's thread pool for fs/DNS/crypto) performs the I/O, and when it completes the callback is queued and run by the **event loop**.

Since typical API requests spend most of their time waiting on I/O, one thread can juggle thousands of them. The weakness is CPU-heavy work: while JavaScript computes, nothing else runs — so heavy computation belongs in worker threads or separate services.

## Explain the phases of the Node.js event loop.
Level: Intermediate | Tags: event-loop

Each loop iteration runs these phases:

1. **Timers** — expired `setTimeout`/`setInterval` callbacks.
2. **Pending callbacks** — some deferred system callbacks.
3. **Idle/prepare** — internal.
4. **Poll** — fetch new I/O events and run their callbacks; block here waiting for I/O when nothing else is queued.
5. **Check** — `setImmediate` callbacks.
6. **Close callbacks** — e.g. socket `close` events.

After **each** callback, Node drains the `process.nextTick` queue, then the promise microtask queue. Inside an I/O callback, `setImmediate` always runs before `setTimeout(fn, 0)` because the check phase comes next.

## What is the difference between `process.nextTick`, `setImmediate` and `setTimeout(fn, 0)`?
Level: Intermediate | Tags: event-loop

- `process.nextTick(fn)` — runs right after the current operation, **before** promise microtasks and before the event loop continues. Recursive use can starve I/O.
- `setImmediate(fn)` — runs in the **check** phase, after I/O polling. The right tool to yield to the event loop between chunks of work.
- `setTimeout(fn, 0)` — runs in the **timers** phase once at least ~1 ms has passed.

From the main module, the order of `setImmediate` vs `setTimeout(0)` isn't guaranteed; inside an I/O callback, `setImmediate` always runs first.

## What is libuv and what is the thread pool used for?
Level: Intermediate | Tags: libuv, event-loop

libuv is the C library that provides Node's event loop and cross-platform asynchronous I/O. Network I/O uses the OS's non-blocking mechanisms (epoll, kqueue, IOCP) and needs no extra threads.

Operations without good async OS APIs run on libuv's **thread pool** (default 4 threads, configurable with `UV_THREADPOOL_SIZE`):

- most `fs` operations,
- `dns.lookup`,
- CPU-heavy `crypto` (`pbkdf2`, `scrypt`, `randomBytes`),
- `zlib` compression.

If many such operations run at once, they queue for the pool — a hidden bottleneck under load.

## What are streams and why are they important?
Level: Intermediate | Tags: streams

Streams process data in chunks instead of loading it all into memory. Types: **Readable** (file read, HTTP request), **Writable** (file write, HTTP response), **Duplex** (socket) and **Transform** (gzip, encryption).

Benefits: constant memory usage for arbitrarily large data, faster time-to-first-byte, and composability:

```js
await pipeline(createReadStream('big.log'), createGzip(), createWriteStream('big.log.gz'))
```

Use `stream.pipeline` (not `.pipe`) so errors in any stage are propagated and all streams are cleaned up.

## What is backpressure?
Level: Advanced | Tags: streams

Backpressure is the mechanism that slows a fast producer when the consumer can't keep up. When a writable's internal buffer exceeds its `highWaterMark`, `write()` returns `false`; the producer should stop writing until the `'drain'` event.

Without it, data accumulates in memory until the process runs out of memory — e.g. reading from a fast disk and writing to a slow client. `pipeline()` and `.pipe()` handle backpressure automatically; manual `write()` loops must check the return value.

## What is the difference between CommonJS and ES modules in Node.js?
Level: Beginner | Tags: modules

- **CommonJS**: `require()` / `module.exports`, loaded synchronously, `__dirname` available, the default for `.js` without `"type": "module"`.
- **ES modules**: `import` / `export`, statically analysable (tree-shaking), top-level `await`, live bindings, file extensions required in relative imports, `import.meta.dirname` instead of `__dirname`.

Node picks the format by extension (`.mjs`/`.cjs`) or the `"type"` field in `package.json`. ESM can import CommonJS; recent Node versions can also `require()` ES modules that don't use top-level `await`.

## How do you handle errors in Node.js applications?
Level: Intermediate | Tags: errors

- Distinguish **operational errors** (invalid input, timeouts, missing files — handle them) from **programmer errors** (bugs — log, fix, possibly restart).
- Use `try/catch` with `async/await`; never leave promises un-awaited without a `.catch`.
- Use custom error classes with status codes, and translate them to responses in one central error handler.
- Add context with `new Error(msg, { cause })`.
- Always listen for `'error'` on event emitters and streams — an unhandled `'error'` event throws.
- Log `uncaughtException`/`unhandledRejection` and exit; let a process manager restart the process.
- Set timeouts on all outbound calls.

## What happens on an unhandled promise rejection?
Level: Intermediate | Tags: errors, promises

Since Node 15, an unhandled rejection **crashes the process** by default (`--unhandled-rejections=throw`), after emitting `'unhandledRejection'`.

Causes: a rejected promise with no `.catch`, forgetting `await`, or async functions used as callbacks where the caller ignores the returned promise (e.g. `emitter.on('x', async () => …)` or `array.forEach(async …)`).

Fix the root cause by awaiting or handling every promise. A process-level handler should only log and exit, not keep a possibly corrupted process running.

## How would you scale a Node.js application across CPU cores?
Level: Intermediate | Tags: scaling

A single Node process uses one core for JavaScript. Options:

- **`cluster` module** — a primary process forks workers that share a port.
- **PM2** in cluster mode (`pm2 start app.js -i max`).
- **Containers** — one process per container, scaled horizontally by Kubernetes/ECS behind a load balancer (the most common approach today).

All require the app to be **stateless**: sessions, caches, uploads, rate-limit counters and scheduled jobs must live in shared stores (Redis, object storage, a queue), not in process memory.

## What is the difference between worker threads, child processes and cluster?
Level: Advanced | Tags: concurrency

- **Worker threads** — parallel JavaScript threads in the same process, each with its own event loop; communicate by message passing (can share memory via `SharedArrayBuffer`). Best for CPU-heavy JavaScript.
- **Child processes** — separate OS processes (`spawn`, `execFile`, `fork`); run other programs or isolate risky code. Heavier, but a crash doesn't affect the parent.
- **Cluster** — multiple Node processes running the same server code sharing a port; for using all cores to handle HTTP traffic.

## How do you find and fix a memory leak in Node.js?
Level: Advanced | Tags: memory, performance

Symptoms: memory grows steadily under constant load and eventually the process crashes with "heap out of memory".

Diagnosis:

1. Run with `--inspect`, take heap snapshots in Chrome DevTools before and after load, and use the comparison view.
2. Find object types whose counts keep growing and inspect their **retainers**.
3. Tools like Clinic.js heap profiler help.

Usual causes: unbounded in-memory caches, listeners added per request and never removed, forgotten timers, closures holding large objects, global arrays of request data. Fix by bounding caches (LRU/TTL), removing listeners, clearing timers, and streaming large data.

## What is the purpose of `package-lock.json`?
Level: Beginner | Tags: npm

It records the **exact** version and integrity hash of every installed package, including transitive dependencies. This makes installs reproducible across developers, CI and production.

Commit it. Use `npm ci` in CI/Docker — it installs exactly from the lockfile and fails if `package.json` and the lockfile disagree. `package.json` ranges like `^1.2.3` only describe *acceptable* versions; the lockfile pins the ones actually used.

## How do you secure a Node.js REST API?
Level: Advanced | Tags: security

- Validate and size-limit all input with schemas.
- Prevent injection: parameterised SQL, no raw objects in Mongo queries, no user data in shell commands.
- Hash passwords with bcrypt/scrypt/argon2; rate-limit auth endpoints.
- Authorise every request at the object level (prevent IDOR).
- Use `helmet`, strict CORS, HTTPS, secure cookie flags.
- Keep secrets in environment/secret managers; never log them.
- Keep dependencies updated (`npm audit`, Dependabot).
- Return generic error messages; log details server-side.
- Protect against SSRF when fetching user-supplied URLs.

## What is middleware?
Level: Beginner | Tags: express, middleware

Middleware are functions that run in sequence during request handling, each receiving the request, response and a `next` function. They can modify the request/response, end the request, or pass control on.

```js
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => console.log(req.method, req.url, res.statusCode, Date.now() - start))
  next()
})
```

Typical middleware: body parsing, logging, authentication, CORS, rate limiting, compression, error handling.

## How would you implement graceful shutdown?
Level: Advanced | Tags: production

On `SIGTERM`/`SIGINT`:

1. Mark the instance as not ready (readiness probe returns 503) so the load balancer stops sending traffic.
2. `server.close()` to stop accepting connections and wait for in-flight requests; close idle keep-alive connections.
3. Stop queue consumers and finish current jobs.
4. Close database and cache connections.
5. Exit with code 0, with a hard timeout (e.g. 15 s) that forces exit if something hangs.

In Docker, run `node` directly (not via `npm start`) so the signal reaches the process.

## What is the difference between `readFile` and `createReadStream`?
Level: Beginner | Tags: fs, streams

- `readFile` loads the **entire** file into memory, then gives you the content. Simple, fine for small files (configs, templates).
- `createReadStream` reads the file in **chunks** (64 KB by default) as a stream. Memory stays constant regardless of file size, and processing can start immediately.

For large files, uploads or downloads, use streams. And avoid `readFileSync` in request handlers — it blocks the event loop.

## How does `require` resolve modules?
Level: Intermediate | Tags: modules

1. **Core modules** (`fs`, `node:path`) are returned directly.
2. Paths starting with `./`, `../` or `/` are resolved as files: exact name, then with `.js`, `.json`, `.node` extensions, then as a directory (`package.json` `main`, or `index.js`).
3. Otherwise Node searches `node_modules` folders from the current directory up to the root, respecting the package's `exports` field.

Modules are **cached** after the first load — every `require` of the same resolved file returns the same exports object. That's why module-level state behaves like a singleton.

## What are some ways to improve the performance of a Node.js API?
Level: Advanced | Tags: performance

1. **Measure first**: load test (autocannon, k6) and profile (`--cpu-prof`, Clinic.js, APM).
2. **Database**: indexes, avoid N+1 queries, project only needed fields, paginate, connection pooling.
3. **Concurrency**: `Promise.all` for independent calls.
4. **Caching**: Redis, HTTP caching, CDN.
5. **Don't block the event loop**: async APIs, streaming, worker threads for CPU work.
6. **Smaller payloads**: compression, pagination, selective fields.
7. **Offload slow work** to queues.
8. **Scale horizontally** once the code is efficient.
9. Use fast libraries on hot paths (pino for logging, Fastify if framework overhead matters).

## What is `AsyncLocalStorage` used for?
Level: Expert | Tags: async, observability

`AsyncLocalStorage` (from `node:async_hooks`) keeps a context value available across all async operations started within a call — like thread-local storage for async code.

```js
import { AsyncLocalStorage } from 'node:async_hooks'
export const context = new AsyncLocalStorage()

app.use((req, res, next) => {
  context.run({ requestId: req.headers['x-request-id'] ?? crypto.randomUUID() }, next)
})

// Anywhere deeper, without passing it through every function:
logger.info({ requestId: context.getStore()?.requestId }, 'Charging card')
```

Uses: request IDs in logs, tracing (OpenTelemetry uses it), per-request tenant or user context.

## Explain the difference between `spawn`, `exec`, `execFile` and `fork`.
Level: Intermediate | Tags: child-process

- `spawn(cmd, args)` — starts a process and **streams** its stdio; best for long-running processes or large output.
- `exec(commandString)` — runs a command **in a shell** and buffers output; supports pipes/globs but is vulnerable to injection with user input.
- `execFile(file, args)` — runs a program directly (no shell) and buffers output; safer than `exec`.
- `fork(modulePath)` — spawns a new Node.js process with an IPC channel (`process.send`/`on('message')`).

## What is an EventEmitter memory leak warning?
Level: Intermediate | Tags: events, memory

Node prints `MaxListenersExceededWarning` when more than 10 listeners are added for the same event on one emitter. It usually indicates a leak — e.g. adding a listener inside a request handler on a long-lived object and never removing it.

Fix: remove listeners when done (`off`, `once`, `AbortSignal` option), or restructure so listeners are registered once. Only raise the limit with `setMaxListeners` when many listeners are genuinely intended.

## How do you manage configuration and secrets?
Level: Intermediate | Tags: configuration, security

- Read configuration from **environment variables** (twelve-factor), using `.env` files only for local development (`node --env-file=.env`).
- Validate all configuration at startup and fail fast with a clear error.
- Centralise it in one `config` module instead of reading `process.env` everywhere.
- Store production secrets in a secrets manager (AWS Secrets Manager, Vault, Kubernetes secrets); never commit them; rotate regularly.
- Don't expose secrets in logs, error messages or client bundles.

## What is the difference between horizontal and vertical scaling, and what makes a Node app "stateless"?
Level: Intermediate | Tags: scaling, architecture

**Vertical** scaling = a bigger machine; **horizontal** = more instances behind a load balancer. Node apps typically scale horizontally.

A stateless app keeps no request-related data in local memory or disk that another instance would need: sessions in Redis or JWTs, files in object storage, caches in Redis, jobs in a queue, WebSocket fan-out via pub/sub. Then any instance can serve any request, and instances can be added, removed or restarted freely.

## How would you design a rate limiter?
Level: Expert | Tags: security, system-design

Common algorithms:

- **Fixed window** — count requests per key per minute; simple but allows bursts at window edges.
- **Sliding window** — smoother; counts over a rolling interval.
- **Token bucket** — tokens refill at a steady rate; each request consumes one; allows controlled bursts.

Keys: IP, user ID, API key, or route. With multiple instances, keep counters in a shared store like **Redis** (atomic `INCR` + `EXPIRE`, or a Lua script for token bucket). Respond with `429 Too Many Requests` and a `Retry-After` header. Apply stricter limits to sensitive endpoints (login, password reset, OTP).

## What are the security risks of `eval` and how can user input reach it indirectly?
Level: Advanced | Tags: security

`eval`, `new Function`, `vm.runInThisContext` and `setTimeout(string)` execute strings as code with full access to the process — remote code execution if user input reaches them.

Indirect paths: template engines compiling user-provided templates, unsafe deserialisation libraries, dynamic `require()` of user-controlled paths, and prototype pollution that changes options used by libraries that generate code. Avoid these APIs, validate input strictly, and keep dependencies updated. Node's `vm` module is **not** a security sandbox.

## How do you debug a Node.js application?
Level: Beginner | Tags: debugging

- `node --inspect` (or `--inspect-brk` to pause on start) and attach Chrome DevTools (`chrome://inspect`) or VS Code's debugger — set breakpoints, inspect variables, step through async code.
- `console.log`/structured logging for quick checks; `console.trace` for call stacks.
- `NODE_DEBUG=http,net` to see internal module debug output.
- `--cpu-prof` / `--heap-prof` and heap snapshots for performance and memory problems.
- Reproduce with a failing test, then fix.

## What is the outbox pattern and why is it useful?
Level: Expert | Tags: architecture, microservices

When a service updates its database and publishes an event (e.g. `order.placed`), doing both separately risks inconsistency: the DB write succeeds but publishing fails, or vice versa.

With the **outbox pattern**, the service writes the event into an `outbox` table/collection **in the same transaction** as the data change. A separate relay process reads unpublished outbox records and publishes them to the message broker, marking them as sent (retrying until success). Consumers must be **idempotent**, since events can be delivered more than once. Change-data-capture tools (e.g. Debezium) can act as the relay.

## Why should you avoid synchronous APIs in a Node.js server?
Level: Beginner | Tags: performance, event-loop

Synchronous APIs (`fs.readFileSync`, `crypto.pbkdf2Sync`, `zlib.gzipSync`) block the only JavaScript thread until they finish. While blocked, the server can't accept connections, run callbacks or respond to any other request — latency spikes for every user.

They're acceptable at **startup** (loading config) and in CLI scripts. In request handlers, use the asynchronous versions or streams.
