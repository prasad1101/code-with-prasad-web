Performance work starts with **measurement**. Guessing where time goes is usually wrong; profilers tell you exactly. This lesson covers load testing, CPU and memory profiling, and the fixes that matter most for Node.js services.

## Load testing

Measure throughput and latency under realistic concurrency before and after every optimisation:

```bash
npx autocannon -c 100 -d 20 http://localhost:3000/api/products
```

Look at **p99 latency** (the slowest 1% of requests), not just the average — users feel the tail. Other tools: k6, Artillery, wrk.

## CPU profiling

```bash
node --cpu-prof src/index.js      # writes a .cpuprofile on exit
```

Open the file in Chrome DevTools (Performance panel) or VS Code to see a flame graph of where CPU time goes.

For interactive profiling:

```bash
node --inspect src/index.js
```

Then open `chrome://inspect` → your process → **Profiler**, start recording, run your load test, and stop.

Tools like **Clinic.js** (`clinic doctor`, `clinic flame`) and **0x** automate profiling under load and highlight common problems.

## Memory profiling

Symptoms of a leak: memory grows steadily under constant load and never returns to baseline; eventually the process crashes with "JavaScript heap out of memory".

1. Start with `node --inspect`.
2. In DevTools → **Memory**, take a heap snapshot.
3. Run load for a while, take another snapshot, and compare ("Comparison" view).
4. Look for object types whose count keeps growing, and follow their **retainers** to find what holds them.

You can also write snapshots programmatically:

```js
import { writeHeapSnapshot } from 'node:v8'
process.on('SIGUSR2', () => console.log('Heap snapshot:', writeHeapSnapshot()))
```

Common leak sources: module-level caches without limits, listeners added per request, timers never cleared, closures capturing large objects, and globally stored request data.

## Measuring in code

```js
import { performance } from 'node:perf_hooks'

const start = performance.now()
const result = await expensiveQuery()
logger.info({ ms: performance.now() - start }, 'expensiveQuery')
```

In production, use **APM / tracing** (OpenTelemetry with a backend like Grafana, Datadog or New Relic) to see time spent in each database call and outbound request per endpoint.

## High-impact optimisations

### 1. Fix the database first

Most slow endpoints are slow because of the database: missing indexes, N+1 queries, fetching unneeded fields, or no pagination.

```js
// N+1: one query per order
for (const order of orders) order.customer = await Customers.findById(order.customerId)

// One query for all customers
const ids = [...new Set(orders.map((o) => o.customerId))]
const customers = new Map((await Customers.find({ _id: { $in: ids } })).map((c) => [String(c._id), c]))
orders.forEach((o) => (o.customer = customers.get(String(o.customerId))))
```

### 2. Do independent work concurrently

```js
const [user, orders, recommendations] = await Promise.all([
  getUser(id), getOrders(id), getRecommendations(id),
])
```

### 3. Cache

Cache expensive, frequently read data (Redis, in-memory with TTL, HTTP caching).

### 4. Avoid blocking the event loop

See the event loop lesson: no sync I/O in handlers, stream large payloads, workers for CPU-heavy tasks.

### 5. Reduce payload size

Paginate, select only needed fields, compress responses (gzip/brotli, usually at the reverse proxy), and avoid serialising huge objects.

### 6. Reuse connections

Use connection pools for databases, and keep-alive agents for outbound HTTP (Node's `fetch` keeps connections alive by default).

### 7. Pick efficient libraries on hot paths

A faster JSON logger (pino), a faster framework (Fastify) or schema-compiled serialisation can matter at high request rates — but only after the bigger wins above.

## Memory settings

Node's default heap limit depends on the system. In containers, set it explicitly below the container's memory limit:

```bash
node --max-old-space-size=1536 src/index.js   # MB
```

## A performance workflow

1. Define a target ("p99 < 200 ms at 500 req/s").
2. Load test to get a baseline.
3. Profile to find the biggest bottleneck.
4. Fix one thing.
5. Measure again. Repeat.

## Try it yourself

Take an endpoint that loops over 50 items and fetches related data one at a time. Load test it, profile it, rewrite it to batch the queries and run independent calls with `Promise.all`, and compare p99 latency before and after.
