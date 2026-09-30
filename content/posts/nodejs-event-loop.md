Node.js runs your JavaScript on a single thread, yet a single process can serve thousands of concurrent connections. The piece that makes this work is the **event loop**. Once you have a clear picture of it, a lot of "weird" behaviour — timers firing late, `setImmediate` beating `setTimeout`, a server freezing under one heavy request — stops being mysterious.

## One thread, many waiting operations

When your code calls `fs.readFile` or makes an HTTP request, Node doesn't sit and wait. It hands the operation to **libuv** (the C library underneath Node), registers your callback, and moves on. When the operation completes, libuv queues the callback, and the event loop runs it the next time it gets the chance.

The key consequence: **your JavaScript is never interrupted**. A callback runs to completion before the loop can do anything else. That's what makes Node code easy to reason about — and what makes a slow callback dangerous.

## The phases of the loop

Each turn ("tick") of the event loop moves through a fixed sequence of phases. Each phase has its own queue of callbacks:

| Phase | What runs there |
| --- | --- |
| **timers** | Callbacks from `setTimeout` and `setInterval` whose time has elapsed |
| **pending callbacks** | Some system-level callbacks deferred from the previous tick (e.g. certain TCP errors) |
| **idle, prepare** | Internal use only |
| **poll** | Retrieves new I/O events and runs their callbacks; may block here waiting for I/O |
| **check** | Callbacks from `setImmediate` |
| **close callbacks** | `close` events, e.g. `socket.on('close', …)` |

The **poll** phase is where a Node server spends most of its life: waiting for sockets and files, then running the callbacks for whatever became ready.

## Microtasks: `process.nextTick` and promises

Microtasks aren't a phase — they run **between** callbacks. After every single callback the loop executes, Node drains two queues, in this order:

1. The `process.nextTick` queue
2. The promise microtask queue (`.then`, `await` continuations, `queueMicrotask`)

```js
setTimeout(() => console.log('timeout'), 0)
setImmediate(() => console.log('immediate'))
Promise.resolve().then(() => console.log('promise'))
process.nextTick(() => console.log('nextTick'))
console.log('sync')
```

Output:

```text
sync
nextTick
promise
timeout      ← these two may swap (see below)
immediate
```

Synchronous code runs first. Then, before the loop moves on, `nextTick` callbacks run, then promise callbacks. Only then does the loop start its phases.

This is the ordering for a CommonJS script. In an ES module (`.mjs`, or `"type": "module"`), the module body itself runs inside a promise job, so the promise callback prints *before* `nextTick` — one more reason not to depend on the exact interleaving of the two queues.

> Because microtask queues are fully drained before continuing, a recursive `process.nextTick` (or a promise chain that keeps scheduling more work) can **starve** the event loop — I/O callbacks never get a turn.

## `setTimeout(fn, 0)` vs. `setImmediate`

From the main module, the order of these two is **not guaranteed**. `setTimeout(fn, 0)` is really a 1 ms timer, and whether that millisecond has passed by the time the loop reaches the timers phase depends on how fast the process started.

Inside an I/O callback, however, the order is deterministic:

```js
import { readFile } from 'node:fs'

readFile(import.meta.filename, () => {
  setTimeout(() => console.log('timeout'), 0)
  setImmediate(() => console.log('immediate'))
})
// Always: immediate, then timeout
```

We're in the poll phase. The next phase is **check** (`setImmediate`), and the timers phase only comes around on the following tick. If you want "run this right after the current I/O work", `setImmediate` is the tool.

## The libuv thread pool

Not all asynchronous work is truly non-blocking at the OS level. For operations without a good async OS API, libuv uses a **thread pool** (4 threads by default):

- Most `fs` operations
- `dns.lookup`
- CPU-heavy `crypto` functions such as `pbkdf2`, `scrypt` and `randomBytes`
- `zlib` compression

Network I/O does *not* use the pool; it uses the OS's native async mechanisms (epoll, kqueue, IOCP).

You can see the pool's limit directly:

```js
import { pbkdf2 } from 'node:crypto'

const start = Date.now()
for (let i = 1; i <= 6; i++) {
  pbkdf2('secret', 'salt', 100_000, 64, 'sha512', () => {
    console.log(`hash ${i} done after ${Date.now() - start} ms`)
  })
}
```

With the default pool size, the first four hashes finish together and the last two take roughly twice as long. Setting `UV_THREADPOOL_SIZE` (before the pool is first used, typically as an environment variable) changes the pool size.

## Blocking the loop — and how to avoid it

Anything synchronous and slow blocks **every** request, not just the one that triggered it:

```js
app.get('/report', (req, res) => {
  const data = JSON.parse(hugeString) // 300 ms of CPU
  res.json(summarise(data))           // every other request waits too
})
```

Common culprits: large `JSON.parse`/`JSON.stringify`, synchronous `fs.*Sync` calls in request handlers, catastrophic regular expressions, and big loops over in-memory data.

Options, from simplest to most involved:

1. **Do less on the hot path** — paginate, stream, precompute.
2. **Use the async API** — `fs.promises` instead of `fs.readFileSync`.
3. **Break up the work** — process in chunks and yield with `setImmediate` between them.
4. **Move CPU work off the main thread** with `worker_threads`:

```js
// main.js
import { Worker } from 'node:worker_threads'

export function runReport(input) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./report-worker.js', import.meta.url), {
      workerData: input,
    })
    worker.once('message', resolve)
    worker.once('error', reject)
  })
}
```

```js
// report-worker.js
import { parentPort, workerData } from 'node:worker_threads'

parentPort.postMessage(expensiveComputation(workerData))
```

## Measuring event loop delay

Don't guess — measure. `perf_hooks` can sample how late the loop is running:

```js
import { monitorEventLoopDelay } from 'node:perf_hooks'

const h = monitorEventLoopDelay({ resolution: 20 })
h.enable()

setInterval(() => {
  console.log(`p99 loop delay: ${(h.percentile(99) / 1e6).toFixed(1)} ms`)
  h.reset()
}, 5000)
```

If p99 delay climbs into the tens of milliseconds under load, something is hogging the thread.

## Key takeaways

- Your JavaScript runs on one thread; callbacks never interrupt each other.
- The loop cycles through phases: timers → pending → poll → check → close.
- `process.nextTick` and promise callbacks run after *each* callback, before the loop continues.
- Inside I/O callbacks, `setImmediate` always runs before `setTimeout(fn, 0)`.
- File system, DNS lookup, crypto and zlib work uses a small thread pool.
- Keep request handlers fast; move heavy CPU work to worker threads and measure loop delay in production.
