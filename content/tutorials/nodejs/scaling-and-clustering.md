A single Node.js process runs your JavaScript on one CPU core. To use a multi-core machine — and to survive crashes and deployments without downtime — you run **multiple processes** and put a load balancer in front of them.

## Vertical vs. horizontal scaling

- **Vertical** — a bigger machine. Limited, and a single process can't use extra cores anyway.
- **Horizontal** — more processes/instances behind a load balancer. The standard approach for Node.js services.

## The `cluster` module

`node:cluster` forks worker processes that share the same server port:

```js
// server.js
import cluster from 'node:cluster'
import { availableParallelism } from 'node:os'
import { createServer } from 'node:http'

if (cluster.isPrimary) {
  const count = availableParallelism()
  console.log(`Primary ${process.pid} starting ${count} workers`)
  for (let i = 0; i < count; i++) cluster.fork()

  cluster.on('exit', (worker, code) => {
    console.log(`Worker ${worker.process.pid} exited (${code}) — starting a replacement`)
    cluster.fork()
  })
} else {
  createServer((req, res) => res.end(`Handled by ${process.pid}\n`)).listen(3000)
}
```

The primary process distributes incoming connections among workers and restarts crashed ones.

## Process managers

In practice, a process manager usually handles this. **PM2** runs your app in cluster mode, restarts on crash, reloads with zero downtime and aggregates logs:

```bash
npm install -g pm2
pm2 start src/index.js -i max --name api   # one process per core
pm2 reload api                             # zero-downtime reload
pm2 logs api
```

## Containers and orchestrators

In container platforms (Kubernetes, ECS, Cloud Run), the common pattern is **one Node.js process per container**, and you scale by running more containers. The orchestrator handles restarts, rolling deployments and load balancing, so `cluster`/PM2 aren't needed inside the container.

Set CPU and memory limits for each container, and size Node's heap to fit (`--max-old-space-size`), otherwise the container can be killed for exceeding its memory limit.

## Design for many instances: statelessness

Once requests can hit any instance, in-memory state breaks:

| Problem | Solution |
| --- | --- |
| In-memory sessions | Store sessions in Redis, or use stateless JWTs |
| In-memory cache per instance | Shared cache (Redis) or accept per-instance caches with short TTLs |
| Uploaded files on local disk | Object storage (S3, GCS, Azure Blob) |
| Scheduled jobs (cron) running on every instance | A single scheduler, a distributed lock, or a job queue |
| WebSocket broadcasts only reach clients on one instance | A pub/sub adapter (Redis) for Socket.IO |
| Rate limiting counters | Shared store (Redis) |

**Rule:** any instance can be killed at any time and nothing is lost.

## Offload work to queues

Slow tasks (emails, PDF generation, video processing, third-party syncs) shouldn't run inside the request. Put a job on a queue and respond immediately; separate worker processes consume the queue:

```js
import { Queue, Worker } from 'bullmq'

const connection = { host: 'localhost', port: 6379 }
export const emailQueue = new Queue('emails', { connection })

// In the API
await emailQueue.add('welcome', { userId }, { attempts: 5, backoff: { type: 'exponential', delay: 1000 } })

// In a separate worker process
new Worker('emails', async (job) => sendWelcomeEmail(job.data.userId), { connection })
```

Queues also smooth traffic spikes and give you retries for free.

## Caching

Caching is often the cheapest scalability win:

- **HTTP caching** (`Cache-Control`, `ETag`) and a CDN for public responses.
- **Application caching** in Redis for expensive queries (cache-aside: read cache → on miss, query DB and store with a TTL).
- **Memoising** hot, rarely changing data in memory with a short TTL.

Always define how the cache is invalidated before adding it.

## Database is usually the bottleneck

Scaling Node processes is easy; scaling the database isn't. Use connection pooling (and keep total connections across all instances within the database's limit), add the right indexes, read from replicas where appropriate, and avoid N+1 queries.

## Try it yourself

1. Run the `cluster` example, send requests with `curl` in a loop and observe different PIDs responding. Kill one worker and confirm it's replaced.
2. Load test a single process vs. the cluster with `npx autocannon -c 100 -d 10 http://localhost:3000` and compare requests/second.
