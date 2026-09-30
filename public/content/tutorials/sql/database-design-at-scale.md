A single well-tuned PostgreSQL server handles a surprising amount of load. When you outgrow it — in data size, write volume, or availability requirements — these are the techniques to reach for, roughly in the order you'll need them.

## 1. Connection pooling

Each PostgreSQL connection is a process with memory overhead. Hundreds of application instances each opening many connections will exhaust the server long before CPU does.

- Use a pool in each application (e.g. `pg.Pool`), sized modestly.
- Put **PgBouncer** (transaction pooling mode) in front of the database to multiplex thousands of client connections onto a few dozen server connections.

## 2. Read replicas

Streaming replication keeps **standby** servers in sync with the primary. Use them for:

- **High availability** — promote a standby if the primary fails (automated with Patroni, or managed services like RDS, Cloud SQL, Azure Database).
- **Read scaling** — send reporting and read-heavy traffic to replicas.

Replicas lag slightly behind. Flows that must read their own writes (after checkout, show the order) should read from the primary.

## 3. Partitioning

Split a huge table into smaller physical partitions by a key, while querying it as one table:

```sql
CREATE TABLE events (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_09 PARTITION OF events
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE events_2026_10 PARTITION OF events
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
```

Benefits:

- **Partition pruning** — queries filtered by date only touch relevant partitions.
- **Cheap retention** — drop an old partition instantly instead of deleting millions of rows.
- Smaller indexes per partition; maintenance per partition.

Partition by what you filter on most (usually time). Tools like `pg_partman` automate creating future partitions. Other strategies: `LIST` (by region/tenant) and `HASH` (even spread).

## 4. Caching

Take read pressure off the database: HTTP/CDN caching, application caches (Redis) for hot objects, and materialised views for expensive aggregates. Every cache needs an invalidation strategy.

## 5. Archiving and data lifecycle

Move cold data (old orders, logs) to archive tables, cheaper storage, or a data warehouse. Keeping the hot working set small keeps indexes in memory and queries fast.

## 6. Separating OLTP and OLAP

Transactional workloads (many small reads/writes) and analytical workloads (large scans and aggregations) compete for resources. Replicate data into a **warehouse** (BigQuery, Snowflake, Redshift, ClickHouse) via change data capture or batch pipelines, and run analytics there. The data engineering course covers this.

## 7. Sharding

When one primary can't handle the write volume or data size, **shard**: split data across multiple independent databases by a shard key (tenant, customer, region).

- Application-level sharding (route queries by key), or extensions/products like **Citus** (distributed PostgreSQL) — or distributed SQL databases (CockroachDB, YugabyteDB, Spanner).
- Choose a key that keeps related data together (all of a tenant's data on one shard) so most queries and transactions stay on one shard.
- Cross-shard joins, transactions and resharding are hard — sharding is a last resort, not a first step.

## 8. Multi-tenancy

For SaaS products, choose how tenants share the database:

| Model | Isolation | Cost | Notes |
| --- | --- | --- | --- |
| Shared tables with `tenant_id` | Low | Lowest | Enforce with **row-level security**; index `tenant_id` first |
| Schema per tenant | Medium | Medium | Migrations run per schema |
| Database per tenant | High | Highest | Easy per-tenant backup/restore and residency |

Row-level security example:

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.tenant_id')::int);
```

## 9. Security

- Separate roles: an application role with only the privileges it needs, read-only roles for analysts, migration roles for schema changes.

```sql
CREATE ROLE app_rw LOGIN PASSWORD '…';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_rw;
CREATE ROLE analyst LOGIN PASSWORD '…';
GRANT SELECT ON order_summaries TO analyst;     -- a view, not raw tables
```

- TLS for connections, encryption at rest, no public network exposure.
- Parameterised queries everywhere (SQL injection).
- Audit logging (`pgaudit`) where required; mask or tokenise personal data in non-production copies.

## 10. Backups, migrations and operations

- Continuous archiving with **point-in-time recovery** (pgBackRest, WAL-G, or managed backups); test restores.
- Zero-downtime migrations: add columns as nullable, backfill in batches, add constraints `NOT VALID` then validate, create indexes `CONCURRENTLY`, and deploy code that works with both old and new schemas.
- Monitor: connections, replication lag, cache hit ratio, slow queries (`pg_stat_statements`), locks, autovacuum activity, disk usage and table bloat.

## Scaling path summary

1. Indexes, query fixes and a right-sized server
2. Connection pooling
3. Caching and read replicas
4. Partitioning and archiving
5. OLAP offloaded to a warehouse
6. Sharding / distributed SQL — only when truly needed

## Try it yourself

Design the database for a multi-tenant invoicing SaaS expected to reach 10,000 tenants and 500 million invoice lines: choose a tenancy model, partitioning strategy, key indexes, retention approach and how analytics will be served. Justify each choice.
