**Change streams** let applications subscribe to real-time changes in a collection, database or entire deployment — inserts, updates, replaces and deletes — without polling. They're built on the replication oplog, so they require a replica set or sharded cluster.

## Watching a collection

```js
const changeStream = db.collection('orders').watch()

for await (const change of changeStream) {
  console.log(change.operationType, change.documentKey._id)
  // 'insert' | 'update' | 'replace' | 'delete' | …
}
```

A change event includes:

- `operationType`
- `documentKey` (the `_id`)
- `fullDocument` (for inserts and replaces; optional for updates)
- `updateDescription` (`updatedFields`, `removedFields`) for updates
- `_id` — the **resume token**
- `clusterTime`

## Filtering with a pipeline

Only receive what you need:

```js
const stream = db.collection('orders').watch([
  { $match: {
      operationType: 'update',
      'updateDescription.updatedFields.status': { $exists: true },
  } },
  { $project: { documentKey: 1, 'updateDescription.updatedFields.status': 1 } },
])
```

## Getting the full document on updates

```js
const stream = db.collection('orders').watch([], { fullDocument: 'updateLookup' })
// change.fullDocument now contains the current version of the document
```

`updateLookup` reads the document *at the time the event is processed*, which may include later changes. For exact before/after values, enable **pre- and post-images** on the collection (`changeStreamPreAndPostImages`) and use `fullDocumentBeforeChange`.

## Resuming after a restart

Change streams are resumable. Store the resume token after processing each event and pass it back when you reconnect:

```js
const saved = await db.collection('streamState').findOne({ _id: 'orders-projector' })

const stream = db.collection('orders').watch([], {
  resumeAfter: saved?.token,
  fullDocument: 'updateLookup',
})

for await (const change of stream) {
  await handleChange(change)
  await db.collection('streamState').updateOne(
    { _id: 'orders-projector' },
    { $set: { token: change._id } },
    { upsert: true },
  )
}
```

A token can only be resumed while the corresponding oplog entry still exists — size the oplog to cover your longest expected downtime.

## Common uses

- **Real-time notifications**: push order status changes to users via WebSockets.
- **Cache invalidation**: delete Redis keys when documents change.
- **Search sync**: keep Elasticsearch/OpenSearch or a vector index in sync.
- **Event-driven integration**: publish domain events to Kafka (the MongoDB Kafka connector uses change streams).
- **Audit trails** and **materialised views** that update incrementally.

## Example: live order updates with Socket.IO

```js
const stream = db.collection('orders').watch(
  [{ $match: { operationType: 'update', 'updateDescription.updatedFields.status': { $exists: true } } }],
  { fullDocument: 'updateLookup' },
)

stream.on('change', (change) => {
  const order = change.fullDocument
  io.to(`user:${order.userId}`).emit('order:updated', { id: order._id, status: order.status })
})

stream.on('error', (err) => {
  logger.error({ err }, 'Change stream failed — restarting')
  // reopen with the last saved resume token
})
```

## Things to watch out for

- **Delivery is at-least-once** after resuming — make handlers idempotent.
- **One consumer per stream instance**: with several app instances, each receives every event. For work that should happen once, use a single worker, a lock, or push events into a queue with consumer groups.
- **Filter early** to avoid sending every change over the network.
- Each open change stream uses a server connection and resources — don't open one per user; open a few and fan out in your app.

## Try it yourself

Build a small "activity feed" service: watch the `orders` and `reviews` collections, write a simplified entry into an `activity` collection for each relevant change, persist resume tokens, and verify that restarting the service doesn't lose or duplicate entries (make the insert idempotent with the event's `_id`).
