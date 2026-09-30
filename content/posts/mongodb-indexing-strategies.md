Adding an index is the single most effective way to speed up a slow MongoDB query — and adding the *wrong* index is one of the easiest ways to slow down every write without helping reads at all. These are the strategies I keep coming back to.

## Start with `explain()`, not guesses

Before creating any index, look at what the query is doing now:

```js
db.orders
  .find({ customerId: 42, status: 'shipped' })
  .sort({ createdAt: -1 })
  .explain('executionStats')
```

The fields that matter most in `executionStats`:

| Field | What it tells you |
| --- | --- |
| `winningPlan.stage` | `COLLSCAN` = full collection scan; `IXSCAN` = index used |
| `nReturned` | Documents returned |
| `totalKeysExamined` | Index entries scanned |
| `totalDocsExamined` | Documents fetched from disk/cache |
| `executionTimeMillis` | Time spent |

The ideal ratio is **`totalKeysExamined ≈ totalDocsExamined ≈ nReturned`**. If you examine 50,000 documents to return 20, the index (or lack of one) is the problem. A `SORT` stage in the plan means MongoDB is sorting in memory — a sign your index doesn't support the sort.

## The ESR rule for compound indexes

For compound indexes, field order matters more than anything else. The rule of thumb is **ESR**:

1. **E**quality fields first — fields matched with an exact value (`status: 'shipped'`)
2. **S**ort fields next — fields in `.sort()`
3. **R**ange fields last — `$gt`, `$lt`, `$in` with many values, regexes

```js
// Query
db.orders.find({
  customerId: 42,                          // equality
  total: { $gte: 100 },                    // range
}).sort({ createdAt: -1 })                 // sort

// ESR index
db.orders.createIndex({ customerId: 1, createdAt: -1, total: 1 })
```

Why this order? Equality fields narrow the index to one contiguous slice. Within that slice, entries are already ordered by `createdAt`, so no in-memory sort is needed. The range filter on `total` is then applied while walking that ordered slice.

Put the range field before the sort field and MongoDB has to collect all matching entries and sort them in memory.

## Index prefixes: one index, several queries

A compound index can serve any query on its **prefix**. The index `{ customerId: 1, createdAt: -1, total: 1 }` supports queries on:

- `customerId`
- `customerId` + `createdAt`
- `customerId` + `createdAt` + `total`

It does **not** efficiently support a query on `createdAt` alone. So before adding `{ customerId: 1 }`, check whether an existing compound index already starts with it — if so, the single-field index is redundant.

## Covered queries

If every field the query filters on **and** returns is in the index, MongoDB can answer from the index alone without fetching documents:

```js
db.users.createIndex({ email: 1, name: 1 })

db.users.find(
  { email: 'ada@example.com' },
  { _id: 0, email: 1, name: 1 }   // exclude _id — it's not in the index
)
```

In `explain()`, a covered query shows `totalDocsExamined: 0`. For hot read paths such as lookups and autocomplete, this is a big win.

## Partial indexes: index only what you query

If you only ever query a subset of documents, index only that subset:

```js
db.orders.createIndex(
  { customerId: 1, createdAt: -1 },
  { partialFilterExpression: { status: 'pending' } }
)
```

The index is smaller, uses less RAM, and costs nothing on writes to non-matching documents. The catch: the query must include a filter compatible with the partial expression (here, `status: 'pending'`) or the planner can't use the index.

A partial index is also the right way to express "unique if present":

```js
db.users.createIndex(
  { username: 1 },
  { unique: true, partialFilterExpression: { username: { $type: 'string' } } }
)
```

## TTL indexes for data that expires

Sessions, OTP codes, and temporary tokens don't need a cron job to clean up:

```js
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 })
```

A background task deletes documents once `createdAt` is older than the TTL. It runs about once a minute, so treat expiry as "eventually", not "to the second".

## Multikey indexes and arrays

Indexing an array field creates a **multikey** index with one entry per array element — great for queries like `{ tags: 'mongodb' }`. Two things to remember:

- A compound index can include **at most one** array field per document.
- Large arrays mean many index entries per document, and every array update rewrites them.

## Every index has a write cost

Each index is updated on every insert, on every delete, and on every update that touches indexed fields. It also competes for RAM with your working set. So audit regularly:

```js
db.orders.aggregate([{ $indexStats: {} }])
```

`accesses.ops` shows how often each index has been used since the server last restarted. An index at zero over a representative period is a candidate for removal.

Before dropping one in production, **hide** it first. The planner ignores it, but it's still maintained, so you can unhide it instantly if something regresses:

```js
db.orders.hideIndex('customerId_1')
// …watch your metrics for a while…
db.orders.dropIndex('customerId_1')   // or unhideIndex() if you need it back
```

## A checklist

1. Run `explain('executionStats')` on the slow query and look for `COLLSCAN`, in-memory `SORT`, and a high docs-examined to returned ratio.
2. Design compound indexes with **Equality → Sort → Range**.
3. Reuse index prefixes instead of adding overlapping indexes.
4. Use covered queries for hot, narrow lookups.
5. Use partial indexes when you query a well-defined subset.
6. Use TTL indexes for expiring data.
7. Audit with `$indexStats`, hide before dropping, and remember every index costs writes and memory.
