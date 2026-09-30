REST is request/response: the client asks, the server answers. Chat, notifications, live dashboards and collaborative editing need the **server to push** updates. **WebSockets** provide a persistent two-way connection, and **Socket.IO** adds rooms, automatic reconnection, acknowledgements and fallbacks on top.

## Setup

```bash
npm install socket.io            # server
npm install socket.io-client     # client (browser or Node)
```

## Attaching Socket.IO to Express

Socket.IO needs the underlying HTTP server:

```js
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: ['http://localhost:4200'], credentials: true },
})

io.on('connection', (socket) => {
  console.log('connected', socket.id)

  socket.on('chat:message', (text) => {
    io.emit('chat:message', { from: socket.id, text, at: Date.now() }) // broadcast to everyone
  })

  socket.on('disconnect', (reason) => console.log('disconnected', socket.id, reason))
})

httpServer.listen(3000)
```

## The client

```js
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', { auth: { token: accessToken } })

socket.on('connect', () => console.log('connected as', socket.id))
socket.on('chat:message', (msg) => renderMessage(msg))

socket.emit('chat:message', 'Hello everyone!')
```

## Emitting to the right audience

```js
socket.emit('event', data)                 // only this client
socket.broadcast.emit('event', data)       // everyone except this client
io.emit('event', data)                     // everyone
io.to('room:42').emit('event', data)       // everyone in a room
io.to(`user:${userId}`).emit('notification', n) // a specific user's sockets
```

### Rooms

```js
socket.on('room:join', (roomId) => {
  socket.join(`room:${roomId}`)
  socket.to(`room:${roomId}`).emit('room:user-joined', { id: socket.id })
})
```

Rooms are server-side groupings; a socket can be in many rooms. Joining each socket to `user:<id>` makes "notify this user on all their devices" trivial.

## Authentication

Verify the token once, during the handshake:

```js
io.use((socket, next) => {
  try {
    const payload = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    socket.data.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    next(new Error('Unauthorized'))
  }
})

io.on('connection', (socket) => {
  socket.join(`user:${socket.data.user.id}`)
})
```

Still check **authorisation** per event (e.g. may this user join this room?).

## Acknowledgements

Get a response for an emit, like a mini RPC:

```js
// client
const res = await socket.emitWithAck('order:track', { orderId })

// server
socket.on('order:track', async ({ orderId }, ack) => {
  const status = await ordersService.status(orderId, socket.data.user)
  ack({ ok: true, status })
})
```

## Pushing events from REST handlers

A common pattern: the REST API changes data, and Socket.IO notifies interested clients:

```js
ordersRouter.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  const order = await ordersService.updateStatus(req.params.id, req.body.status)
  io.to(`user:${order.userId}`).emit('order:updated', { id: order.id, status: order.status })
  res.json({ data: order })
})
```

## Validating event payloads

Socket events are user input like any request body — validate them:

```js
socket.on('chat:message', (payload) => {
  const parsed = z.object({ roomId: z.string(), text: z.string().min(1).max(2000) }).safeParse(payload)
  if (!parsed.success) return
  io.to(`room:${parsed.data.roomId}`).emit('chat:message', { from: socket.data.user.id, text: parsed.data.text })
})
```

Rate-limit chatty events too.

## Scaling across instances

With several server instances, a client connected to instance A won't receive events emitted on instance B. Use an **adapter** backed by Redis (or another pub/sub):

```js
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

const pub = createClient({ url: process.env.REDIS_URL })
const sub = pub.duplicate()
await Promise.all([pub.connect(), sub.connect()])
io.adapter(createAdapter(pub, sub))
```

Load balancers must also support WebSockets (and sticky sessions if the HTTP long-polling fallback is enabled).

## Alternatives

- **Server-Sent Events (SSE)** — one-way server → client over plain HTTP; simpler for notifications and live feeds.
- **Plain WebSockets** (`ws` library) — lighter, no Socket.IO protocol; you implement rooms and reconnection yourself.
- **Managed services** (Pusher, Ably, AWS API Gateway WebSockets) — offload connection management.

## Try it yourself

Build a live order-status feature: customers join their `user:<id>` room after authenticating; an admin endpoint updates an order's status and emits `order:updated`; the customer's page updates instantly. Then run two server instances with the Redis adapter and verify events cross instances.
