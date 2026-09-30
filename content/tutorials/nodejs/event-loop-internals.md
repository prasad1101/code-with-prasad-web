Node.js serves thousands of connections from one JavaScript thread because it never waits on I/O. Understanding how its event loop is structured tells you why a single slow function can stall a whole server — and how to prevent it.

## The architecture

- **V8** executes your JavaScript on the main thread.
- **libuv** provides the event loop and asynchronous I/O. Network I/O uses the OS's non-blocking APIs (epoll, kqueue, IOCP); file system operations, DNS lookups and some crypto/zlib work run on a **thread pool** (4 threads by default, set with `UV_THREADPOOL_SIZE`).
- When an operation completes, its callback is queued; the event loop runs it on the main thread.

## The phases

Each iteration of the loop goes through phases, each with its own queue:

1. **timers** — expired `setTimeout` / `setInterval` callbacks
2. **pending callbacks** — some deferred system callbacks
3. **idle, prepare** — internal
4. **poll** — retrieve new I/O events and run their callbacks; wait here for I/O if nothing else is scheduled
5. **check** — `setImmediate` callbacks
6. **close callbacks** — e.g. `socket.on('close')`

Between **every** callback, Node drains two microtask queues: first `process.nextTick`, then promise microtasks.

```js
import { readFile } from 'node:fs'

readFile(import.meta.filename, () => {
  setTimeout(() => console.log('timeout'), 0)
  setImmediate(() => console.log('immediate'))
  process.nextTick(() => console.log('nextTick'))
  Promise.resolve().then(() => console.log('promise'))
})
// nextTick, promise, immediate, timeout
```

Inside an I/O callback (poll phase) the next phase is **check**, so `setImmediate` always beats a zero-delay timer.

## `process.nextTick` vs. `setImmediate` vs. `queueMicrotask`

- `process.nextTick(fn)` — runs before any other queued work, even promise callbacks. Useful for emitting events after a constructor returns; dangerous in recursion (it can starve I/O).
- `queueMicrotask(fn)` — the standard microtask; runs after `nextTick` callbacks.
- `setImmediate(fn)` — runs in the check phase of the current or next loop iteration; the right way to yield to I/O between chunks of work.

## Blocking the event loop

While JavaScript runs, **no other request can be processed**:

```js
app.get('/hash', (req, res) => {
  const hash = crypto.pbkdf2Sync(req.query.pw, 'salt', 500_000, 64, 'sha512') // ~0.5 s of CPU
  res.send(hash.toString('hex'))
})
```

Under load, every other request waits in line. Common culprits:

- `*Sync` APIs (`readFileSync`, `pbkdf2Sync`) in request handlers
- `JSON.parse`/`JSON.stringify` of very large payloads
- Catastrophic regular expressions on user input (ReDoS)
- Large in-memory sorts, loops and data transformations

Fixes: use async APIs (`crypto.pbkdf2` uses the thread pool), paginate and stream, precompute, or move CPU work to worker threads.

## Thread pool saturation

Because only 4 threads handle fs, DNS lookup and heavy crypto, a burst of such calls queues up. Symptoms: file reads or password hashing getting slow under load while CPU looks idle. Options: raise `UV_THREADPOOL_SIZE` (set it before the pool is first used — typically as an environment variable), cache results, or reduce the number of pool-bound operations. Note that `dns.lookup` (used by `fetch`/`http` by default) uses the pool; heavy outbound traffic to many hosts can benefit from DNS caching.

## Measuring event loop health

```js
import { monitorEventLoopDelay, performance } from 'node:perf_hooks'

const h = monitorEventLoopDelay({ resolution: 10 })
h.enable()

setInterval(() => {
  const elu = performance.eventLoopUtilization()
  console.log({
    p99DelayMs: (h.percentile(99) / 1e6).toFixed(1),
    utilization: (elu.utilization * 100).toFixed(0) + '%',
  })
  h.reset()
}, 5000).unref()
```

- **Event loop delay** — how late timers fire; high values mean something is blocking.
- **Event loop utilisation** — the share of time the loop is busy. Close to 100% means the process is saturated.

Export these as metrics and alert on them in production.

## Keeping the loop responsive

- Break long synchronous work into chunks, yielding with `await new Promise(setImmediate)` between them.
- Stream large data instead of buffering it.
- Put CPU-heavy work in **worker threads** (next lesson) or a separate service/queue.
- Set limits on request body size and query complexity.
- Validate regexes applied to user input, or use safe regex engines.

## Try it yourself

1. Write a server with `/fast` and `/slow` (a 2-second synchronous loop) endpoints. While `/slow` runs, request `/fast` and observe the delay.
2. Add `monitorEventLoopDelay` logging and watch the p99 spike.
3. Rewrite `/slow` to process in chunks with `setImmediate` and compare.
