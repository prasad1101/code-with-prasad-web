Mongoose (covered in the Express course) adds schemas and models. The **official MongoDB Node.js driver** is thinner and faster, maps directly to the shell commands you've learned, and is a great choice for services, scripts and TypeScript projects that validate with Zod.

## Installing and connecting

```bash
npm install mongodb
```

```js
// src/db.js
import { MongoClient } from 'mongodb'

export const client = new MongoClient(process.env.MONGODB_URI, {
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 5000,
})

await client.connect()
export const db = client.db('shop')
```

Create **one** `MongoClient` per process and reuse it. It manages a connection pool; creating a client per request exhausts connections.

## CRUD with the driver

```js
import { ObjectId } from 'mongodb'

const products = db.collection('products')

// Create
const { insertedId } = await products.insertOne({ name: 'Desk Lamp', price: 1299, createdAt: new Date() })

// Read
const lamp = await products.findOne({ _id: insertedId })
const cheap = await products
  .find({ price: { $lt: 500 } }, { projection: { name: 1, price: 1 } })
  .sort({ price: 1 })
  .limit(20)
  .toArray()

// Update
await products.updateOne({ _id: insertedId }, { $set: { price: 999 }, $currentDate: { updatedAt: true } })

// Delete
await products.deleteOne({ _id: insertedId })
```

### ObjectIds from strings

```js
function toObjectId(id) {
  if (!ObjectId.isValid(id)) throw new ValidationError('Invalid id')
  return new ObjectId(id)
}

await products.findOne({ _id: toObjectId(req.params.id) })
```

A string `'66f1…'` does **not** match an `ObjectId` — always convert.

## Streaming large result sets

A cursor fetches documents in batches. Iterate it instead of calling `toArray()` on huge results:

```js
for await (const order of db.collection('orders').find({ status: 'paid' })) {
  await exportRow(order)
}
```

## Aggregation

```js
const report = await db.collection('orders').aggregate([
  { $match: { status: 'paid' } },
  { $group: { _id: '$userId', spent: { $sum: '$total' } } },
  { $sort: { spent: -1 } },
  { $limit: 10 },
]).toArray()
```

## TypeScript support

```ts
interface Product {
  _id?: ObjectId
  name: string
  price: number
  tags: string[]
}

const products = db.collection<Product>('products')
const p = await products.findOne({ price: { $gt: 100 } }) // Product | null — filters are type-checked too
```

## Handling errors

```js
try {
  await db.collection('users').insertOne({ email })
} catch (err) {
  if (err.code === 11000) throw new ConflictError('Email already registered') // duplicate key
  throw err
}
```

## Write concern and read preference

- **Write concern** controls when a write is acknowledged. `w: 'majority'` (the default for replica sets) waits until most members have the write — it survives a primary failover.
- **Read preference** controls which members serve reads. The default `primary` gives the latest data; `secondaryPreferred` spreads read load but may return slightly stale data.

```js
db.collection('analyticsEvents', { readPreference: 'secondaryPreferred' })
```

## Creating indexes at startup

```js
await db.collection('users').createIndexes([
  { key: { email: 1 }, unique: true },
  { key: { createdAt: -1 } },
])
```

`createIndex` is idempotent — calling it again with the same definition does nothing. For large production collections, manage index builds deliberately (migrations or ops runbooks) rather than on every deploy.

## Retryable writes and reads

Modern drivers automatically retry a single write or read once after transient network errors or a failover (`retryWrites=true` is the default). Your code should still handle errors that persist.

## Graceful shutdown

```js
process.on('SIGTERM', async () => {
  await client.close()
  process.exit(0)
})
```

## Driver vs. Mongoose

| | Official driver | Mongoose |
| --- | --- | --- |
| Schema & validation | Bring your own (Zod, `$jsonSchema`) | Built-in schemas |
| Middleware/hooks, `populate` | No | Yes |
| Performance overhead | Minimal | Some (use `.lean()`) |
| API | Same as the shell | Model-based |

## Try it yourself

Write a small repository module with the driver: `createUser` (handling duplicate emails), `findUserById` (validating the id), `listUsers` with cursor pagination, and a script that streams all users to a CSV file.
