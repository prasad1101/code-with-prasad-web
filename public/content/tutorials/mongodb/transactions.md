Single-document operations in MongoDB are always atomic. When an operation must update **several documents or collections** all-or-nothing, use a **multi-document transaction**.

## When you need a transaction

- Placing an order: create the order **and** decrement stock for each product.
- Transferring money between two accounts.
- Moving an item between two collections (e.g. from `cart` to `orders`).

Before reaching for transactions, check whether a different model avoids them — e.g. embedding the data in one document, or using a conditional atomic update. Transactions have overhead and should be short.

## Requirements

Transactions require a **replica set** or **sharded cluster**. Atlas clusters qualify; locally, run a single-node replica set (see the setup lesson).

## Using transactions in Node.js

```js
const session = client.startSession()

try {
  await session.withTransaction(async () => {
    const orders = db.collection('orders')
    const products = db.collection('products')

    for (const item of cart.items) {
      const res = await products.updateOne(
        { _id: item.productId, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { session },                                    // pass the session to every operation
      )
      if (res.modifiedCount === 0) {
        throw new ConflictError(`Not enough stock for ${item.productId}`) // aborts the transaction
      }
    }

    await orders.insertOne(
      { userId, items: cart.items, total: cart.total, status: 'placed', createdAt: new Date() },
      { session },
    )
  }, {
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' },
  })
} finally {
  await session.endSession()
}
```

`withTransaction`:

- Commits if the callback finishes, aborts if it throws.
- **Retries automatically** on transient errors (e.g. write conflicts, failovers) — so the callback must be safe to run more than once (no side effects like sending emails inside it).

Every operation inside must receive `{ session }`; an operation without it runs **outside** the transaction.

## Isolation and conflicts

Inside a transaction you read from a consistent snapshot. If two transactions modify the same document, one gets a **write conflict** and is retried (by `withTransaction`). Heavy contention on the same "hot" documents (a single global counter) causes many retries — redesign to spread writes.

## Limits and good practice

- Keep transactions **short**: by default a transaction is aborted after 60 seconds (`transactionLifetimeLimitSeconds`).
- Modify a reasonable number of documents (thousands, not millions); batch large jobs outside transactions.
- Do external calls (payment gateways, emails) **after** committing — or use the outbox pattern: write an outbox record inside the transaction and publish it afterwards.
- Create collections and indexes before running transactions that use them.

## Transactions in Mongoose

```js
const session = await mongoose.startSession()
await session.withTransaction(async () => {
  await Product.updateOne({ _id: id, stock: { $gte: qty } }, { $inc: { stock: -qty } }, { session })
  await Order.create([{ user: userId, items }], { session })
})
await session.endSession()
```

## Read and write concerns in brief

- `writeConcern: { w: 'majority' }` — the commit is durable across a failover.
- `readConcern: 'snapshot'` — reads within the transaction see a consistent point-in-time view.
- Outside transactions, `readConcern: 'majority'` returns only data acknowledged by a majority (it can't be rolled back).

## Try it yourself

Implement `transferPoints(fromUserId, toUserId, amount)` that fails if the sender has insufficient points, and records a `transfers` document — all in one transaction. Run two concurrent transfers from the same user in a script and confirm the balance never goes negative.
