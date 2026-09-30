Frameworks like Express build on Node's built-in `node:http` module. Understanding the raw API helps you debug frameworks, write lightweight services, and understand what middleware actually does.

## A minimal server

```js
import { createServer } from 'node:http'

const server = createServer((req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end('Hello, HTTP!\n')
})

server.listen(3000, () => console.log('http://localhost:3000'))
```

The callback runs for **every request**. `req` is an `IncomingMessage` (a readable stream), `res` a `ServerResponse` (a writable stream).

## Routing by method and URL

```js
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { status: 'ok' })
  }

  if (req.method === 'GET' && url.pathname === '/search') {
    const q = url.searchParams.get('q') ?? ''
    return sendJson(res, 200, { query: q, results: [] })
  }

  if (req.method === 'POST' && url.pathname === '/users') {
    const body = await readJson(req)
    return sendJson(res, 201, { id: crypto.randomUUID(), ...body })
  }

  sendJson(res, 404, { error: 'Not found' })
})

function sendJson(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}
```

## Reading the request body

The body arrives as a stream of chunks. Collect them — with a size limit, or a client could exhaust your memory:

```js
async function readJson(req, limit = 1_000_000) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw Object.assign(new Error('Payload too large'), { status: 413 })
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 })
  }
}
```

(This is exactly what `express.json()` does for you.)

## Error handling

An exception thrown inside an async handler becomes an unhandled rejection unless you catch it. Wrap the handler:

```js
const server = createServer(async (req, res) => {
  try {
    await handle(req, res)
  } catch (err) {
    const status = err.status ?? 500
    if (status === 500) console.error(err)
    if (!res.headersSent) sendJson(res, status, { error: status === 500 ? 'Internal error' : err.message })
    else res.destroy()
  }
})
```

## Headers, status codes and caching

```js
res.writeHead(200, {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=60',
  'X-Request-Id': requestId,
})
```

Common status codes: `200 OK`, `201 Created`, `204 No Content`, `301/302` redirects, `304 Not Modified`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `413 Payload Too Large`, `422 Unprocessable Entity`, `429 Too Many Requests`, `500 Internal Server Error`, `503 Service Unavailable`.

## Making HTTP requests

Node has the global `fetch`:

```js
const res = await fetch('https://api.github.com/repos/nodejs/node', {
  headers: { 'User-Agent': 'my-app' },
  signal: AbortSignal.timeout(5000),
})
if (!res.ok) throw new Error(`GitHub API: ${res.status}`)
const repo = await res.json()
console.log(repo.stargazers_count)
```

Always set a timeout on outgoing requests — a hanging upstream can otherwise tie up your server.

## Timeouts and keep-alive

The server has defaults for how long it waits for headers and request bodies (`server.headersTimeout`, `server.requestTimeout`) and how long idle keep-alive connections stay open (`server.keepAliveTimeout`). Behind a load balancer, set `keepAliveTimeout` **longer** than the load balancer's idle timeout to avoid intermittent 502 errors.

## Graceful shutdown

When deploying, stop accepting new connections but let in-flight requests finish:

```js
process.on('SIGTERM', () => {
  console.log('Shutting down…')
  server.close(() => process.exit(0))          // stops new connections, waits for active ones
  server.closeIdleConnections()                // drop idle keep-alive sockets
  setTimeout(() => process.exit(1), 10_000).unref() // hard limit
})
```

## Why use a framework?

The raw API works, but real applications need routing with parameters, body parsing, middleware (auth, logging, CORS), error handling and validation. Express, Fastify, Koa and NestJS provide these. Knowing the underlying API makes those frameworks much less mysterious — the next course covers Express.

## Try it yourself

Build a small JSON API with the raw `http` module: in-memory `GET /todos`, `POST /todos` (with body size limit and validation), `DELETE /todos/:id` (parse the id from the path), proper status codes, and graceful shutdown.
