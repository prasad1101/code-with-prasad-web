Running Node.js in production means more than `node index.js`. This lesson covers configuration, logging, health checks, graceful shutdown, containers and CI/CD — the things that keep a service reliable at 3 a.m.

## The twelve-factor basics

- **Config in the environment** — ports, URLs and secrets from environment variables, validated at startup.
- **Stateless processes** — no local sessions or files; any instance can be replaced.
- **Logs to stdout** — let the platform collect and ship them.
- **Same build everywhere** — build once, promote the same artifact from staging to production.
- **Fast startup, graceful shutdown.**

## Structured logging

Log JSON with a fast logger such as **pino**, and include context:

```js
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'password', '*.token'],
})

logger.info({ orderId, userId, durationMs }, 'Order placed')
logger.error({ err }, 'Payment provider unavailable')
```

Add a **request ID** to every log line (from an incoming `X-Request-Id` header or generated per request) so you can follow one request across services. `AsyncLocalStorage` can carry it through async calls automatically.

## Health checks

Expose two endpoints for the load balancer/orchestrator:

```js
app.get('/health/live', (req, res) => res.json({ status: 'ok' }))   // process is up

app.get('/health/ready', async (req, res) => {                     // can serve traffic
  try {
    await db.command({ ping: 1 })
    res.json({ status: 'ready' })
  } catch {
    res.status(503).json({ status: 'not ready' })
  }
})
```

- **Liveness** failing → restart the container.
- **Readiness** failing → stop sending traffic (e.g. during startup or when the database is unreachable).

## Graceful shutdown

On deployments, instances receive `SIGTERM`. Stop taking new work, finish in-flight requests, then close resources:

```js
let shuttingDown = false

async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'Shutting down')

  const force = setTimeout(() => process.exit(1), 15_000)
  force.unref()

  server.close(async () => {        // waits for active requests
    await queueWorker.close()
    await mongoClient.close()
    logger.info('Shutdown complete')
    process.exit(0)
  })
  server.closeIdleConnections()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
```

Make the readiness endpoint return 503 once shutdown begins, so the load balancer stops routing new requests.

## Docker

A production-ready multi-stage `Dockerfile`:

```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build            # e.g. compile TypeScript

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node                    # don't run as root
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Notes:

- Run `node` directly (not `npm start`) so signals reach your process.
- Add a `.dockerignore` (`node_modules`, `.git`, `.env`, tests).
- Keep images small and rebuild regularly for security patches.

## CI/CD pipeline

A typical pipeline on every push:

1. `npm ci`
2. Lint, type-check, unit tests
3. Integration tests (with a database container)
4. `npm audit` / dependency scanning
5. Build the Docker image, tag it with the commit SHA, push to a registry
6. Deploy to staging automatically; production after approval
7. Run smoke tests; roll back automatically on failure

Jenkins, GitHub Actions, GitLab CI and Bitbucket Pipelines all support this flow.

## Deployment strategies

- **Rolling** — replace instances a few at a time (default in Kubernetes).
- **Blue/green** — run the new version alongside the old, switch traffic at once, switch back if needed.
- **Canary** — send a small percentage of traffic to the new version, watch metrics, then ramp up.

Database migrations must be **backward compatible** with the running version (add columns before using them; remove only after the old code is gone).

## Observability

- **Metrics**: request rate, error rate, latency percentiles, event loop delay, memory, DB pool usage (Prometheus/OpenTelemetry).
- **Tracing**: OpenTelemetry auto-instrumentation shows each request's path through HTTP, database and queue calls.
- **Alerts** on symptoms users feel (error rate, p99 latency), not on every CPU spike.

## Running behind a reverse proxy

Nginx, a cloud load balancer or an API gateway usually terminates TLS, compresses responses and serves static files. Tell Express to trust the proxy so `req.ip` and `req.protocol` are correct: `app.set('trust proxy', 1)`.

## Try it yourself

Containerise a small Express API with the multi-stage Dockerfile, add liveness and readiness endpoints, implement graceful shutdown, and verify it: start a slow request, run `docker stop`, and confirm the request completes before the container exits.
