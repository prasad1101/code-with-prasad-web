Your Express API works. This lesson makes it fast and production-ready: compression, caching, logging, pagination, health checks and graceful shutdown.

## Compression

```bash
npm install compression
```

```js
import compression from 'compression'
app.use(compression()) // gzip/deflate responses above a size threshold
```

If Nginx or a CDN in front of the app already compresses responses, do it there instead of in Node.

## HTTP caching

Let clients and CDNs reuse responses:

```js
// Public, rarely changing data
app.get('/api/categories', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=300') // 5 minutes
  res.json({ data: await categoriesService.list() })
})

// Private, per-user data
res.set('Cache-Control', 'private, no-store')
```

Express generates **ETags** automatically for `res.send`/`res.json` bodies: repeat requests with `If-None-Match` get a cheap `304 Not Modified`.

## Application caching with Redis

For expensive queries, cache results in Redis (cache-aside):

```js
async function getProductCached(id) {
  const key = `product:${id}`
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)

  const product = await Product.findById(id).lean()
  if (product) await redis.set(key, JSON.stringify(product), { EX: 300 })
  return product
}

// Invalidate on update
async function updateProduct(id, changes) {
  const product = await Product.findByIdAndUpdate(id, changes, { new: true }).lean()
  await redis.del(`product:${id}`)
  return product
}
```

## Pagination that scales

Offset pagination (`skip`) gets slower as the page number grows, because the database still walks past skipped documents. For large or infinite-scroll lists, use **cursor pagination**:

```js
// GET /api/products?limit=20&after=<lastId>
const filter = after ? { _id: { $lt: after } } : {}
const items = await Product.find(filter).sort({ _id: -1 }).limit(limit + 1).lean()
const hasMore = items.length > limit
res.json({ data: items.slice(0, limit), meta: { nextCursor: hasMore ? items[limit - 1]._id : null } })
```

## Efficient database access

- Add indexes for your common filters and sorts (check with `explain()`).
- `.lean()` and `.select()` for read endpoints.
- Avoid N+1 queries: batch with `$in` or `populate` once.
- Run independent queries in parallel with `Promise.all`.

## Structured request logging

```bash
npm install pino pino-http
```

```js
import pinoHttp from 'pino-http'
import { logger } from './shared/logger.js'

app.use(pinoHttp({
  logger,
  genReqId: (req) => req.get('X-Request-Id') ?? crypto.randomUUID(),
  customLogLevel: (req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
  redact: ['req.headers.authorization', 'req.headers.cookie'],
}))
```

Each log line is JSON with method, URL, status, response time and request ID — ready for Elasticsearch, Loki, CloudWatch or Datadog.

## Health checks

```js
app.get('/health/live', (req, res) => res.json({ status: 'ok' }))

app.get('/health/ready', async (req, res) => {
  const dbOk = mongoose.connection.readyState === 1
  res.status(dbOk && !shuttingDown ? 200 : 503).json({ db: dbOk, shuttingDown })
})
```

## Graceful shutdown

```js
// src/server.js
const server = app.listen(config.PORT)
let shuttingDown = false

async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'Shutting down gracefully')
  setTimeout(() => process.exit(1), 15_000).unref()

  server.close(async () => {
    await mongoose.disconnect()
    await redis.quit()
    process.exit(0)
  })
  server.closeIdleConnections()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
```

## Timeouts

```js
server.requestTimeout = 30_000     // max time to receive a full request
server.headersTimeout = 20_000
server.keepAliveTimeout = 65_000   // longer than the load balancer's idle timeout
```

## Running multiple instances

Run one process per container and scale containers horizontally, or use PM2 cluster mode on a VM. Keep the app stateless: sessions, rate-limit counters and caches in Redis; uploads in object storage.

## Load testing before launch

```bash
npx autocannon -c 50 -d 30 http://localhost:3000/api/products
```

Watch p99 latency, error rate, CPU, memory and event loop delay. Find the bottleneck, fix it, and repeat.

## Production checklist

- [ ] `NODE_ENV=production`
- [ ] Helmet, CORS allow-list, rate limits, body limits
- [ ] Validation on every endpoint, central error handler
- [ ] Structured logs with request IDs; no secrets in logs
- [ ] Health endpoints and graceful shutdown
- [ ] Indexes for all hot queries
- [ ] Caching strategy for expensive reads
- [ ] Metrics and alerting (latency, errors, saturation)
- [ ] Automated tests and CI/CD with rollbacks

## Try it yourself

Add compression, `pino-http` logging, Redis caching for `GET /api/products/:id` with invalidation on update, cursor pagination for the product list, and graceful shutdown. Load test before and after caching and compare p99 latency.
