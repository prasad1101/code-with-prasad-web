Beyond embedding vs. referencing, the MongoDB community has named patterns for recurring problems. Knowing them lets you model performance-critical data quickly.

## Attribute pattern

Products with many different, sparse attributes (a TV has `screenSize`, a shirt has `size` and `fabric`) are hard to index as separate fields. Store them as an array of key–value pairs:

```js
{
  name: 'Smart TV 55"',
  attributes: [
    { k: 'screenSize', v: 55 },
    { k: 'resolution', v: '4K' },
    { k: 'refreshRate', v: 120 },
  ],
}
```

One compound index covers every attribute:

```js
db.products.createIndex({ 'attributes.k': 1, 'attributes.v': 1 })
db.products.find({ attributes: { $elemMatch: { k: 'resolution', v: '4K' } } })
```

## Extended reference pattern

Copy the few fields of a related document that you need most often, to avoid a `$lookup`:

```js
// order.customer copies only what the order screens need
customer: { _id: ObjectId('…'), name: 'Asha Patil', email: 'asha@example.com' }
```

## Subset pattern

Keep the most-used portion of a large related list embedded, and the rest in another collection:

```js
// product document
{
  name: 'Clean Code',
  reviewCount: 1823,
  recentReviews: [ /* latest 10 reviews */ ],
}
// full list in the reviews collection, paginated
```

The product page loads in one read; "see all reviews" queries the reviews collection.

## Computed pattern

Precompute values that are expensive to calculate on every read:

```js
// Update the product's rating summary whenever a review is added
db.products.updateOne({ _id: productId }, {
  $inc: { 'rating.count': 1, 'rating.sum': newRating },
})
// average = sum / count, computed on read or stored with an aggregation-pipeline update
```

Reads become trivial; the cost moves to writes, which are far less frequent.

## Bucket pattern

For time series, group many measurements into one document per time window instead of one document per reading:

```js
{
  sensorId: 's-17',
  hour: ISODate('2026-09-30T10:00:00Z'),
  count: 60,
  readings: [ { t: ISODate('…10:00:00Z'), temp: 22.1 }, /* … */ ],
  sum: 1329.6,
}
```

Fewer, larger documents mean smaller indexes and faster range queries. MongoDB's native **time series collections** apply this automatically:

```js
db.createCollection('readings', {
  timeseries: { timeField: 'timestamp', metaField: 'sensorId', granularity: 'minutes' },
})
```

## Outlier pattern

Most documents are small, but a few are huge (a celebrity with millions of followers). Design for the common case, and flag outliers:

```js
{ _id: 'user-1', followers: [ /* up to 1,000 ids */ ], hasOverflow: true }
// overflow documents: { userId: 'user-1', page: 2, followers: [ … ] }
```

## Polymorphic pattern

Store different but related types in one collection with a type field:

```js
{ type: 'article', title: '…', body: '…' }
{ type: 'video', title: '…', durationSec: 312, url: '…' }
{ type: 'podcast', title: '…', episode: 42 }
```

One feed query returns all content types; the application renders each by `type`.

## Schema versioning pattern

```js
{ schemaVersion: 2, name: { first: 'Asha', last: 'Patil' } }   // new shape
{ name: 'Ravi Kumar' }                                           // old shape (version 1)
```

The application reads both and upgrades documents gradually.

## Approximation pattern

For high-frequency counters where exact precision isn't needed (page views), update the database every N events (or with a probability of 1/N and increment by N) instead of on every event.

## Archive pattern

Move old, rarely read data (orders older than two years) to an archive collection or cheaper storage (e.g. Atlas Online Archive), keeping the hot collection and its indexes small.

## Choosing patterns

Start from the queries your application runs most often and their latency targets, then apply patterns where a simple design would be too slow or too large. Every pattern trades write complexity (keeping copies and precomputed values in sync) for read performance — make that trade deliberately.

## Try it yourself

Model a ride-sharing app's driver location updates (every 5 seconds per driver) and trip history. Which patterns would you apply for live locations, historical analytics, and the driver's profile with ratings?
