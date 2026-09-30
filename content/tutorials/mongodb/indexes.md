Without an index, MongoDB must scan **every document** in a collection to answer a query (`COLLSCAN`). An index is a sorted structure (a B-tree) that lets MongoDB jump straight to matching documents. Indexes are the single biggest lever for MongoDB performance.

## Creating indexes

```js
db.products.createIndex({ category: 1 })                    // single field, ascending
db.products.createIndex({ category: 1, price: -1 })          // compound
db.users.createIndex({ email: 1 }, { unique: true })         // enforce uniqueness
db.products.getIndexes()
db.products.dropIndex('category_1')
```

Every collection has an automatic unique index on `_id`.

## Reading `explain()`

```js
db.products.find({ category: 'electronics', price: { $lt: 2000 } })
  .sort({ price: 1 })
  .explain('executionStats')
```

Check:

- `winningPlan` stage: `IXSCAN` (good) vs. `COLLSCAN` (full scan).
- `nReturned` vs. `totalKeysExamined` vs. `totalDocsExamined` — ideally all close to each other.
- A `SORT` stage means an in-memory sort — the index doesn't support the sort.

## Compound indexes and the ESR rule

Field order in a compound index matters. Follow **Equality → Sort → Range**:

```js
// Query: category = X, price < Y, sorted by rating desc
db.products.find({ category: 'electronics', price: { $lt: 2000 } }).sort({ rating: -1 })

// ESR index
db.products.createIndex({ category: 1, rating: -1, price: 1 })
```

- **Equality** fields first narrow the index to one contiguous range.
- **Sort** fields next mean results come out already ordered.
- **Range** fields last are filtered while scanning that ordered range.

### Prefixes

The index `{ category: 1, rating: -1, price: 1 }` also supports queries on `{ category }` and `{ category, rating }` — its **prefixes** — but not `{ rating }` alone. Drop single-field indexes made redundant by a compound index with the same prefix.

## Covered queries

If the filter and projection use only indexed fields, MongoDB answers from the index without touching documents:

```js
db.users.createIndex({ email: 1, name: 1 })
db.users.find({ email: 'asha@example.com' }, { _id: 0, email: 1, name: 1 })
// explain: totalDocsExamined: 0
```

## Multikey indexes (arrays)

Indexing an array field creates one index entry per element:

```js
db.products.createIndex({ tags: 1 })
db.products.find({ tags: 'usb-c' })  // uses the index
```

A compound index may contain **at most one** array field per document.

## Special index types

```js
// Partial: index only documents matching a filter (smaller, cheaper)
db.orders.createIndex({ userId: 1, createdAt: -1 }, { partialFilterExpression: { status: 'pending' } })

// TTL: delete documents automatically after a time
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })

// Text: basic full-text search
db.articles.createIndex({ title: 'text', body: 'text' })
db.articles.find({ $text: { $search: 'mongodb indexing' } }, { score: { $meta: 'textScore' } })

// Geospatial
db.stores.createIndex({ location: '2dsphere' })

// Wildcard: index all fields under a path (for unpredictable attributes)
db.products.createIndex({ 'specs.$**': 1 })

// Hashed: even distribution, used as a shard key
db.events.createIndex({ deviceId: 'hashed' })
```

For rich search (typo tolerance, relevance, facets), use **Atlas Search** instead of text indexes.

## The cost of indexes

Every index:

- Slows every insert, delete, and update that touches indexed fields.
- Uses RAM — performance is best when indexes fit in memory.
- Takes time to build on large collections.

Find unused indexes:

```js
db.orders.aggregate([{ $indexStats: {} }])
```

Before dropping an index in production, **hide** it (`db.orders.hideIndex('name')`) to confirm nothing regresses, then drop it.

## Indexing strategy

1. List your application's most frequent and most latency-sensitive queries (and sorts).
2. Design compound indexes with ESR that serve several of them via prefixes.
3. Verify with `explain('executionStats')`.
4. Use the **profiler** or Atlas **Performance Advisor** to find slow queries in production.
5. Remove redundant and unused indexes.

The blog post [MongoDB Indexing Strategies That Actually Matter](/blog/mongodb-indexing-strategies) goes deeper into these techniques.

## Try it yourself

With 100,000 generated orders (`userId`, `status`, `total`, `createdAt`):

1. Run `find({ userId: X, status: 'paid' }).sort({ createdAt: -1 })` with `explain` — note the plan and docs examined.
2. Create the ESR index and compare.
3. Create a TTL index on a `sessions` collection and watch documents expire.
