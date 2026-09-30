MongoDB is designed to stay available when servers fail and to scale beyond one machine. **Replication** provides high availability; **sharding** provides horizontal scale.

## Replica sets

A replica set is a group of `mongod` processes holding the same data:

- One **primary** receives all writes.
- **Secondaries** replicate the primary's operations log (**oplog**) and can serve reads.
- If the primary fails, the members **elect** a new primary automatically — usually within seconds.

```text
             writes
  app ───▶  PRIMARY ──oplog──▶ SECONDARY
                  └────oplog──▶ SECONDARY
```

A production replica set has at least **three** members (an odd number enables majority elections). Drivers discover the topology from the connection string and follow failovers automatically; retryable writes cover most in-flight operations during an election.

### Write concern and durability

```js
await orders.insertOne(order, { writeConcern: { w: 'majority' } })
```

With `w: 'majority'`, the write is acknowledged only after most members have it — it won't be lost if the primary fails. `w: 1` is faster but a write acknowledged only by the old primary can be rolled back after failover.

### Read preference

| Preference | Reads from | Trade-off |
| --- | --- | --- |
| `primary` (default) | Primary | Always latest data |
| `primaryPreferred` | Primary, secondary if unavailable | Availability |
| `secondary` / `secondaryPreferred` | Secondaries | Offloads reads; may be slightly stale |
| `nearest` | Lowest latency member | Geo-distributed apps |

Use secondaries for analytics and reports that tolerate slight staleness, not for "read your own write" flows.

### Replication lag

Secondaries apply operations slightly behind the primary. Monitor lag (`rs.printSecondaryReplicationInfo()`, Atlas metrics); heavy writes or undersized secondaries increase it.

## Sharding

When data or write throughput outgrows a single replica set, **sharding** distributes data across multiple replica sets (**shards**):

```text
            app
             │
          mongos (router)  ◀── config servers (metadata)
       ┌─────┼─────┐
    shard1 shard2 shard3   (each a replica set)
```

- **`mongos`** routes queries to the right shards.
- Data is split into ranges (chunks) by a **shard key** and balanced across shards automatically.

### Choosing a shard key

The shard key is the most important sharding decision. A good key has:

- **High cardinality** — many distinct values.
- **Even distribution** — no single value gets most of the writes.
- **Query isolation** — common queries include the shard key, so `mongos` targets one shard instead of broadcasting to all.

```js
sh.shardCollection('shop.orders', { customerId: 1, createdAt: 1 })   // ranged compound key
sh.shardCollection('iot.readings', { deviceId: 'hashed' })           // hashed for even writes
```

Anti-patterns:

- A monotonically increasing key (`createdAt`, ObjectId) with ranged sharding sends **all inserts to one shard** (a hotspot). Hash it or combine it with a high-cardinality prefix.
- A low-cardinality key (`country`, `status`) creates huge, unsplittable chunks.

Queries **without** the shard key become scatter-gather across all shards — slower as you add shards.

Since MongoDB 5.0 you can **reshard** a collection with a new key, but it's an expensive operation; choose carefully up front.

## Do you need sharding?

Usually not at first. A well-indexed replica set on appropriately sized hardware handles a lot. Consider sharding when:

- The working set (hot data + indexes) no longer fits in RAM on the largest practical machine.
- Write throughput exceeds what one primary can sustain.
- You need data placed in specific regions (zone sharding for data residency).

## Backups and disaster recovery

Replication is **not** a backup — a bad `deleteMany` replicates instantly. Use point-in-time backups (Atlas backups, `mongodump` for small datasets, filesystem snapshots) and regularly test restoring them.

## Try it yourself

1. Start a three-member replica set with Docker Compose, connect with `mongosh`, and run `rs.status()`.
2. Stop the primary container and watch a secondary get elected.
3. For a multi-tenant SaaS `events` collection (tenantId, userId, timestamp), propose a shard key and explain which queries it isolates.
