Most MongoDB performance problems come from a handful of causes: missing or wrong indexes, documents that are too big, unbounded arrays, and working sets that don't fit in memory. This lesson is a systematic approach to finding and fixing them.

## 1. Find the slow queries

**Database profiler** (self-managed):

```js
db.setProfilingLevel(1, { slowms: 100 })      // log operations slower than 100 ms
db.system.profile.find().sort({ ts: -1 }).limit(10).pretty()
```

The MongoDB log also records slow operations (`"Slow query"` entries). On **Atlas**, use the **Query Profiler**, **Performance Advisor** (suggests indexes) and **Real-Time Performance Panel**.

Look for high `docsExamined`, `COLLSCAN`, in-memory `SORT` stages and large `nreturned` values.

## 2. Analyse with `explain`

```js
db.orders.find({ userId, status: 'paid' }).sort({ createdAt: -1 }).limit(20).explain('executionStats')
```

Healthy query checklist:

- `IXSCAN`, not `COLLSCAN`
- `totalKeysExamined` ≈ `totalDocsExamined` ≈ `nReturned`
- no `SORT` stage (the index provides the order)
- `executionTimeMillis` within your budget

## 3. Fix the index

Apply ESR (Equality → Sort → Range), reuse compound prefixes, and remove indexes that are never used (`$indexStats`). A query that must examine many documents to return few is almost always an indexing problem.

## 4. Keep the working set in RAM

The **working set** is the data and indexes your application touches frequently. WiredTiger (MongoDB's storage engine) caches it in memory; when it doesn't fit, queries hit disk and latency jumps.

Check:

```js
db.orders.stats().totalIndexSize
db.serverStatus().wiredTiger.cache
```

Options: remove unused indexes, use partial indexes, archive old data, project fewer fields, or scale up/shard.

## 5. Right-size documents

- Avoid **unbounded arrays** (comments, logs) inside documents — they grow the document, slow updates and bloat multikey indexes.
- Don't store large blobs (images, PDFs) in documents; use object storage and keep a URL.
- Very large documents make every read of them expensive, even if you only need one field — use projections, or split rarely used fields into a separate collection.

## 6. Reduce round trips

- Batch writes with `insertMany` / `bulkWrite`.
- Fetch related data with one `$in` query instead of one query per item (N+1).
- Use aggregation to compute results on the server instead of fetching raw documents.

## 7. Connection management

- One `MongoClient` per process; tune `maxPoolSize` for your concurrency.
- Total connections = instances × pool size — keep it within your cluster's limits.
- Set `serverSelectionTimeoutMS` and operation timeouts (`maxTimeMS`, or the driver's `timeoutMS`) so slow queries fail fast instead of piling up:

```js
await orders.find(filter).maxTimeMS(2000).toArray()
```

## 8. Write performance

- Each index adds write cost — keep only the indexes you need.
- `w: 'majority'` is safer but adds latency; use it for important data, and consider `w: 1` only for data you can afford to lose (e.g. some analytics events).
- Avoid "hot" documents updated by every request (one global counter) — shard counters or buffer updates.
- Prefer many small inserts batched together over large, frequent in-place array growth.

## 9. Read scaling

- Cache frequently read, rarely changing data (Redis, application memory, HTTP caching).
- Send analytics reads to secondaries (`secondaryPreferred`) or to a separate analytics node.
- Materialise heavy aggregations with `$merge` on a schedule.

## 10. Monitor continuously

Track: operation latency (p95/p99), operations per second, cache hit ratio and eviction, replication lag, connections, disk IOPS, and queue lengths. Alert on trends before users notice.

## A tuning workflow

1. Pick the slowest, most frequent query from the profiler.
2. `explain` it; design or adjust an index.
3. Verify improvement with `explain` and a load test.
4. Repeat. Review the schema if indexes alone can't fix it.

## Try it yourself

Generate 1 million `events` documents (`userId`, `type`, `createdAt`, `payload`). Enable the profiler, run a dashboard query (events of a type for a user in the last 7 days, newest first), then optimise it until `docsExamined` equals `nReturned`. Measure index size before and after adding a partial index for only the last 30 days.
