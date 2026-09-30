Much of Node.js is built on the **`EventEmitter`** pattern: objects emit named events, and listeners react to them. HTTP servers, streams, sockets and child processes are all event emitters.

## Using `EventEmitter`

```js
import { EventEmitter } from 'node:events'

const orders = new EventEmitter()

orders.on('placed', (order) => {
  console.log(`Send confirmation email for ${order.id}`)
})

orders.on('placed', (order) => {
  console.log(`Reserve stock for ${order.items.length} items`)
})

orders.emit('placed', { id: 'o-1', items: ['pen', 'book'] })
```

- `on(event, listener)` — subscribe (alias `addListener`).
- `once(event, listener)` — subscribe for the next emission only.
- `off(event, listener)` — unsubscribe (alias `removeListener`).
- `emit(event, ...args)` — call every listener **synchronously**, in registration order.

Because `emit` is synchronous, a slow listener delays the code that emitted. Move heavy work to async functions or queues.

## Extending `EventEmitter`

```js
class Uploader extends EventEmitter {
  async upload(file) {
    this.emit('start', file.name)
    for (let pct = 0; pct <= 100; pct += 25) {
      await new Promise((r) => setTimeout(r, 100))
      this.emit('progress', pct)
    }
    this.emit('done', { name: file.name, url: `/files/${file.name}` })
  }
}

const uploader = new Uploader()
uploader.on('progress', (pct) => console.log(`${pct}%`))
uploader.once('done', (result) => console.log('Uploaded:', result.url))
await uploader.upload({ name: 'photo.jpg' })
```

## The special `error` event

If an emitter emits `'error'` and there is **no** listener, Node throws the error — which usually crashes the process:

```js
const emitter = new EventEmitter()
emitter.emit('error', new Error('boom')) // throws: Unhandled 'error' event
```

Always attach an `error` listener to emitters that can fail (streams, sockets, servers):

```js
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error('Port already in use')
  else throw err
})
```

## Awaiting events

`events.once` returns a promise that resolves with the event's arguments — handy for waiting on a single event:

```js
import { once } from 'node:events'

const server = app.listen(3000)
await once(server, 'listening')
console.log('Server ready')
```

`events.on` returns an **async iterator** of events:

```js
import { on } from 'node:events'

for await (const [order] of on(orders, 'placed')) {
  await processOrder(order)
}
```

Both accept an `AbortSignal` to stop waiting.

## Memory leak warnings

By default Node warns if more than 10 listeners are added for the same event on one emitter:

```text
MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
```

This usually means you're adding a listener on every request and never removing it. Fix the leak (remove listeners, or use `once`) rather than just raising the limit with `setMaxListeners`.

## Events vs. direct function calls

Events **decouple** the emitter from its listeners: the order module doesn't need to know about email or stock modules. The trade-offs: control flow is harder to follow, and errors in listeners surface far from their cause. Use events for genuinely independent reactions (notifications, logging, analytics), and plain function calls for steps that must succeed together.

For events that must survive process restarts or be handled by other services, use a real message queue (RabbitMQ, Kafka, SQS) instead of an in-process emitter.

## Try it yourself

Build a `Timer` class extending `EventEmitter` that emits `tick` every second with the elapsed seconds and `done` after N seconds. Consume it once with listeners and once with `for await (… of on(timer, 'tick'))`, stopping with an `AbortController`.
