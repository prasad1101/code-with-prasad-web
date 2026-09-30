Update operators modify documents **in place and atomically** on the server — no read-modify-write round trip, and no lost updates when two clients update the same document at once.

## Field operators

```js
db.products.updateOne({ _id: id }, {
  $set: { price: 749, 'specs.dpi': 3200 },   // set values (creates missing fields)
  $unset: { legacyCode: '' },                // remove a field
  $inc: { stock: -2, 'stats.views': 1 },     // add (use negative numbers to subtract)
  $mul: { price: 1.1 },                      // multiply
  $currentDate: { updatedAt: true },         // set to the current server date
})

db.products.updateOne({ _id: id }, { $min: { lowestPrice: 699 } })  // only if lower
db.products.updateOne({ _id: id }, { $max: { highestBid: 5000 } })  // only if higher
db.users.updateMany({}, { $rename: { fullname: 'fullName' } })
```

### Why `$inc` beats read-modify-write

```js
// Race condition: two requests read stock 10, both write 9 — one sale is lost
const p = await products.findOne({ _id: id })
await products.updateOne({ _id: id }, { $set: { stock: p.stock - 1 } })

// Atomic: always correct under concurrency
await products.updateOne({ _id: id, stock: { $gt: 0 } }, { $inc: { stock: -1 } })
```

The filter `stock: { $gt: 0 }` makes the decrement **conditional** — if `modifiedCount` is 0, the item was out of stock.

## Array operators

```js
// Add
db.posts.updateOne({ _id: id }, { $push: { tags: 'mongodb' } })
db.posts.updateOne({ _id: id }, { $addToSet: { tags: 'mongodb' } })  // only if not present
db.posts.updateOne({ _id: id }, { $push: { tags: { $each: ['nosql', 'db'] } } })

// Keep only the latest 50 activity entries
db.users.updateOne({ _id: id }, {
  $push: { activity: { $each: [{ type: 'login', at: new Date() }], $sort: { at: -1 }, $slice: 50 } },
})

// Remove
db.posts.updateOne({ _id: id }, { $pull: { tags: 'draft' } })
db.carts.updateOne({ _id: id }, { $pull: { items: { productId: 'p1' } } })
db.queue.updateOne({ _id: id }, { $pop: { jobs: -1 } })  // remove first element (1 = last)
```

## Updating array elements

### The positional `$` operator

Updates the **first** element that matched the query:

```js
db.carts.updateOne(
  { _id: cartId, 'items.productId': 'p1' },
  { $inc: { 'items.$.qty': 1 } },
)
```

### All elements: `$[]`

```js
db.carts.updateOne({ _id: cartId }, { $set: { 'items.$[].reserved': false } })
```

### Filtered elements: `$[<identifier>]` with `arrayFilters`

```js
db.orders.updateMany(
  {},
  { $set: { 'items.$[item].status': 'backordered' } },
  { arrayFilters: [{ 'item.stock': 0 }] },
)
```

## Upserts with `$setOnInsert`

```js
db.dailyStats.updateOne(
  { date: '2026-09-30', page: '/pricing' },
  {
    $inc: { views: 1 },
    $setOnInsert: { createdAt: new Date() },
  },
  { upsert: true },
)
```

A unique index on `{ date: 1, page: 1 }` prevents duplicates when two upserts race.

## Updates with aggregation pipelines

Pass an array to compute new values from existing fields:

```js
db.products.updateMany({}, [
  {
    $set: {
      finalPrice: { $round: [{ $multiply: ['$price', { $subtract: [1, { $ifNull: ['$discount', 0] }] }] }, 2] },
      priceBand: {
        $switch: {
          branches: [
            { case: { $lt: ['$price', 500] }, then: 'budget' },
            { case: { $lt: ['$price', 2000] }, then: 'mid' },
          ],
          default: 'premium',
        },
      },
    },
  },
])
```

## Optimistic concurrency with a version field

When an update depends on a document's state that the client saw, include a version in the filter:

```js
const res = await db.docs.updateOne(
  { _id: id, version: 7 },
  { $set: { body: newBody }, $inc: { version: 1 } },
)
if (res.matchedCount === 0) throw new Error('Document was modified by someone else — reload and retry')
```

## Try it yourself

1. Add a `lastViewedAt` date and increment `views` on a product in one update.
2. In a cart, increase the quantity of product `p2` by 1, or push it with `qty: 1` if it isn't there (two operations — think about which filter to use for each).
3. Keep only the 10 most recent entries in a `searchHistory` array while pushing a new one.
4. Mark every order item with `qty > 5` as `bulk: true` using `arrayFilters`.
