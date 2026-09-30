## What is MongoDB and how does it differ from a relational database?
Level: Beginner | Tags: basics

MongoDB is a document database. Data is stored as BSON documents (JSON-like, with nested objects and arrays) in collections, instead of rows in tables with fixed columns.

Key differences from SQL databases:

- **Flexible schema** — documents in a collection can have different fields (validation can still enforce rules).
- **Rich documents** — related data is often embedded, reducing the need for joins.
- **Horizontal scaling** built in through sharding; high availability through replica sets.
- Joins exist (`$lookup`) but are used less; multi-document ACID transactions exist but good designs need them less often.

Choose based on access patterns: hierarchical, variable, read-together data suits MongoDB; highly relational data with complex ad-hoc joins often suits SQL.

## What is BSON and why does MongoDB use it?
Level: Beginner | Tags: basics

BSON (Binary JSON) is MongoDB's storage and wire format. Compared with JSON it:

- Adds types: `ObjectId`, `Date`, `Decimal128`, 32/64-bit integers, binary data, regex.
- Stores length prefixes, making traversal and scanning fast.
- Is binary, so it's efficient to encode/decode.

Documents are limited to 16 MB of BSON.

## What is an ObjectId?
Level: Beginner | Tags: basics

The default type of the `_id` field: a 12-byte value made of a 4-byte timestamp (seconds), a 5-byte random value unique to the process, and a 3-byte incrementing counter. It's generated client-side, unique without coordination, and roughly sortable by creation time (`ObjectId.getTimestamp()`).

A common bug is querying `_id` with a string — `'66f1…'` doesn't equal `ObjectId('66f1…')`; convert first.

## When would you embed documents vs. reference them?
Level: Intermediate | Tags: data-modeling

**Embed** when data is read together, belongs to one parent, is bounded in size and changes with the parent — e.g. addresses in a user, line items in an order (with price snapshots). Benefit: one read, atomic updates.

**Reference** when the related data is unbounded (comments, logs), shared by many parents, changes independently and frequently, or is queried on its own — e.g. reviews, users in many groups.

Hybrid patterns are common: reference the full list, embed a subset (latest 10 reviews) or a few copied fields (extended reference).

## What is the aggregation pipeline?
Level: Intermediate | Tags: aggregation

A framework for data processing inside the database: an array of stages, each transforming the stream of documents:

```js
db.orders.aggregate([
  { $match: { status: 'paid' } },
  { $group: { _id: '$userId', total: { $sum: '$total' } } },
  { $sort: { total: -1 } },
  { $limit: 10 },
])
```

Common stages: `$match`, `$project`/`$set`, `$group`, `$sort`, `$limit`, `$unwind`, `$lookup`, `$facet`, `$bucket`, `$setWindowFields`, `$merge`. Put `$match` and `$sort`/`$limit` early so they can use indexes.

## How do indexes work in MongoDB, and what is the ESR rule?
Level: Intermediate | Tags: indexes, performance

Indexes are B-tree structures on field values that let queries find documents without a collection scan. Types: single-field, compound, multikey (arrays), text, geospatial, hashed, wildcard, partial, TTL, unique.

For compound indexes, order fields by **Equality → Sort → Range**: equality-matched fields first, then sort fields (so results come out ordered, no in-memory sort), then range-filtered fields. A compound index also serves queries on its prefixes.

Verify with `explain('executionStats')`: `IXSCAN` and `totalDocsExamined ≈ nReturned`.

## How do you analyse a slow query?
Level: Intermediate | Tags: performance, explain

1. Find it: profiler (`db.setProfilingLevel(1, { slowms: 100 })`), slow query logs, Atlas Query Profiler/Performance Advisor.
2. Run `explain('executionStats')`.
3. Look for `COLLSCAN`, a `SORT` stage, and a large gap between `totalDocsExamined`/`totalKeysExamined` and `nReturned`.
4. Add or reorder an index (ESR), add a projection, limit results, or restructure the query.
5. Re-run `explain` and load-test.

If indexing can't fix it, the schema may need to change (e.g. precomputed fields, different embedding).

## What is a covered query?
Level: Intermediate | Tags: indexes

A query where all filtered and returned fields are in one index, so MongoDB answers from the index alone without fetching documents (`totalDocsExamined: 0`). You usually need to exclude `_id` in the projection unless it's in the index. Covered queries are very fast for hot lookups.

## What are replica sets?
Level: Intermediate | Tags: replication, availability

A replica set is a group of `mongod` instances with the same data: one **primary** takes writes; **secondaries** replicate its oplog. If the primary fails, the remaining members elect a new primary automatically. Production sets have at least three members (an odd number for majority elections), ideally across availability zones.

They provide high availability, data redundancy and optional read scaling via read preferences. They're also required for transactions and change streams. Replication is not a backup — mistakes replicate too.

## What are write concern and read concern?
Level: Advanced | Tags: replication, consistency

**Write concern** — how many members must acknowledge a write: `w: 1` (primary only), `w: 'majority'` (durable across failover; default in replica sets), plus `j: true` for journal durability and a `wtimeout`.

**Read concern** — what consistency reads get: `local` (latest data on the node, may be rolled back), `majority` (acknowledged by a majority, can't be rolled back), `snapshot` (consistent point-in-time, used in transactions), `linearizable` (strongest, for single-document reads).

**Read preference** (separately) chooses which member serves the read.

## What is sharding and how do you choose a shard key?
Level: Advanced | Tags: sharding, scaling

Sharding partitions a collection across multiple replica sets (shards). `mongos` routers direct queries using metadata in config servers; the balancer moves chunks to keep data even.

A good shard key has high cardinality, distributes writes evenly (no monotonic hotspot), and appears in most queries so they target one shard. Hashed keys give even writes but make range queries scatter; compound keys (e.g. `{ tenantId: 1, createdAt: 1 }`) balance isolation and distribution. Avoid low-cardinality keys and ranged monotonically increasing keys like timestamps or ObjectIds.

## Does MongoDB support transactions?
Level: Intermediate | Tags: transactions

Yes. Single-document operations are always atomic. Since 4.0 (replica sets) and 4.2 (sharded clusters), MongoDB supports multi-document ACID transactions with snapshot isolation.

Use them for all-or-nothing changes across documents (order + stock, transfers). Keep them short (default 60-second limit), pass the session to every operation, use `withTransaction` for automatic retries, and do external side effects after commit. Often, modelling data to fit in one document or using conditional atomic updates avoids the need.

## How would you implement an atomic stock decrement that never goes negative?
Level: Intermediate | Tags: updates, concurrency

Use a conditional update with `$inc`:

```js
const res = await products.updateOne(
  { _id: productId, stock: { $gte: qty } },
  { $inc: { stock: -qty } },
)
if (res.modifiedCount === 0) throw new Error('Insufficient stock')
```

The filter and update execute atomically on one document, so concurrent requests can't oversell. Read-modify-write (`findOne` then `$set`) has a race condition.

## Explain the positional operators `$`, `$[]` and `$[<id>]`.
Level: Intermediate | Tags: updates, arrays

- `$` — updates the **first** array element that matched the query filter: `{ 'items.productId': 'p1' }` + `{ $inc: { 'items.$.qty': 1 } }`.
- `$[]` — updates **all** elements: `{ $set: { 'items.$[].reserved': false } }`.
- `$[<id>]` with `arrayFilters` — updates all elements matching a condition:

```js
db.orders.updateMany({}, { $set: { 'items.$[i].flag': true } }, { arrayFilters: [{ 'i.qty': { $gt: 5 } }] })
```

## What's the difference between `$elemMatch` and dot-notation conditions on arrays?
Level: Advanced | Tags: queries, arrays

With dot notation, each condition can be satisfied by a **different** array element:

```js
{ 'items.productId': 'p1', 'items.qty': { $gte: 2 } } // p1 with qty 1 + another item with qty 3 matches
```

`$elemMatch` requires a **single** element to satisfy all conditions:

```js
{ items: { $elemMatch: { productId: 'p1', qty: { $gte: 2 } } } }
```

## What is the 16 MB document limit and how do you design around it?
Level: Intermediate | Tags: data-modeling

A BSON document can't exceed 16 MB. Hitting it usually indicates an **unbounded array** (comments, events, followers) or embedded binary data.

Design around it: move growing lists to their own collection (reference the parent), use the bucket pattern for time series, keep a bounded subset embedded, store files in object storage (or GridFS for special cases). Large-but-legal documents are also slow to read and update, so keep documents focused.

## What is `$lookup` and when should you avoid it?
Level: Intermediate | Tags: aggregation, joins

`$lookup` performs a left outer join to another collection in the same database, either by matching fields or with a sub-pipeline.

It's fine for occasional reports and admin screens. Avoid relying on it for every high-traffic read: it adds work per document, and without an index on the foreign field it scans the joined collection. If a page always needs the joined data, consider embedding or copying the needed fields (extended reference), or precomputing results with `$merge`.

## What are TTL indexes?
Level: Beginner | Tags: indexes

A TTL (time-to-live) index on a date field makes MongoDB delete documents automatically after a given number of seconds:

```js
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })
```

A background task runs about every 60 seconds, so deletion isn't instant. Use it for sessions, OTPs, temporary tokens, caches and logs with a retention period. You can also set `expireAfterSeconds: 0` and store the exact expiry time in the field.

## How do you do pagination efficiently?
Level: Intermediate | Tags: queries, performance

`skip/limit` is simple but slow for deep pages (the server walks past skipped entries) and unstable when data changes.

Range-based (keyset) pagination is better for large collections: sort by an indexed unique key (or a key + `_id` tie-breaker), and fetch the next page with `{ sortKey: { $gt: lastValue } }` (plus the tie-breaker condition). Performance stays constant, and results don't shift when new documents are inserted.

## What are change streams?
Level: Advanced | Tags: change-streams, real-time

Change streams let applications subscribe to inserts, updates, replaces and deletes on a collection, database or deployment in real time, built on the oplog (replica sets required).

Features: aggregation filters on events, `fullDocument: 'updateLookup'`, pre/post images, and **resume tokens** to continue after restarts. Uses: real-time notifications, cache invalidation, syncing search indexes, event-driven microservices, audit trails. Handlers should be idempotent (at-least-once delivery after resume).

## What's the difference between `find` + `sort` in memory and index-supported sorts?
Level: Advanced | Tags: indexes, performance

If an index matches the sort (with equality prefix fields before it), MongoDB reads documents already ordered — no extra work, and `limit` stops early. Otherwise it performs a **blocking in-memory sort** (a `SORT` stage) over all matching documents, limited by memory (it may spill to disk with `allowDiskUse`) — slow for large result sets. Design compound indexes so common sorts are index-supported.

## How would you model a many-to-many relationship?
Level: Intermediate | Tags: data-modeling

Options:

1. **Array of references on one side**: `student.courseIds: [...]` — good when that side's list is small and bounded.
2. **Arrays on both sides** — fast reads in both directions, but two documents to update (use a transaction if they must stay consistent).
3. **A linking collection**: `enrollments { studentId, courseId, enrolledAt, progress }` — best when both sides can be large or the relationship has its own attributes. Index both ids.

Choose based on list sizes and which direction queries run most.

## What schema design patterns do you know?
Level: Advanced | Tags: data-modeling, patterns

- **Attribute** — variable attributes as `[{k, v}]` with one index.
- **Extended reference** — copy frequently used fields of a related document.
- **Subset** — embed the most-used part of a large list.
- **Computed** — precompute aggregates (rating summary) on write.
- **Bucket** — group time-series points per time window (or use time series collections).
- **Outlier** — handle rare huge documents separately.
- **Polymorphic** — several types in one collection with a `type` field.
- **Schema versioning** — `schemaVersion` for gradual migrations.
- **Archive** — move cold data out of hot collections.

## How do you secure a MongoDB deployment?
Level: Advanced | Tags: security

- Enable authentication; least-privilege users per application.
- Never expose it to the public internet; private networking, IP allow-lists, TLS.
- Encryption at rest; client-side field-level or Queryable Encryption for sensitive fields.
- Prevent operator injection in the application (validate types, sanitise filters).
- Auditing, backups with tested restores, monitoring and alerts.
- Keep versions patched; store credentials in secret managers.

## What is the WiredTiger cache and the working set?
Level: Expert | Tags: performance, internals

WiredTiger is MongoDB's default storage engine. It keeps recently used data and indexes in an internal cache (by default roughly half of RAM minus 1 GB), with compression on disk and document-level concurrency control.

The **working set** is the data and indexes your workload actively touches. If it fits in the cache, most operations are served from memory; if not, reads go to disk and latency rises sharply. Monitor cache usage and eviction; reduce the working set with fewer/partial indexes, projections, archiving, or add memory/shards.

## What is the difference between `$out` and `$merge`?
Level: Advanced | Tags: aggregation

Both write aggregation results to a collection:

- `$out` replaces the target collection entirely (atomically) with the pipeline output.
- `$merge` merges results into an existing collection — insert, replace, merge or keep existing documents per match on a key — so you can update materialised views incrementally (e.g. recompute only today's stats).

`$merge` is the usual choice for scheduled rollups and dashboards.

## How do you handle schema migrations in MongoDB?
Level: Advanced | Tags: data-modeling, operations

Without enforced schemas, migrations are about evolving data safely while the app runs:

- Add a `schemaVersion` field; make code read old and new shapes.
- **Lazy migration**: upgrade a document when it's next written.
- **Background migration**: batched `updateMany` or aggregation-pipeline updates, throttled to limit load.
- Keep changes backward compatible across deployments (add fields before using them, remove after old code is gone).
- Update `$jsonSchema` validators with `validationLevel: 'moderate'` during the transition.
- Tools such as `migrate-mongo` track applied migration scripts.

## What is `explain()` telling you when you see `FETCH` after `IXSCAN`?
Level: Expert | Tags: explain, indexes

`IXSCAN` walks the index to find matching keys; `FETCH` then loads the full documents for those keys (to apply remaining filters or return non-indexed fields). A `FETCH` is normal, but compare counts: if `totalKeysExamined` is much larger than `nReturned`, the index isn't selective enough. If `FETCH` filters out many documents, move those filter fields into the index. If you only need indexed fields, a covered query eliminates `FETCH` entirely.
