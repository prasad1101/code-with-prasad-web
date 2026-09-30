SQL is declarative: the **query planner** decides how to execute your query — which indexes to use, which join algorithm, in what order. `EXPLAIN` shows you that plan. Reading plans is the core skill of SQL performance tuning.

## `EXPLAIN` and `EXPLAIN ANALYZE`

```sql
EXPLAIN SELECT * FROM events WHERE user_id = 42;            -- estimated plan, doesn't run the query
EXPLAIN ANALYZE SELECT * FROM events WHERE user_id = 42;    -- runs it, shows actual rows and timings
EXPLAIN (ANALYZE, BUFFERS) SELECT …;                        -- plus pages read from cache/disk
```

`EXPLAIN ANALYZE` **executes** the statement — wrap data-modifying statements in a transaction and roll back.

## A real before/after

On a table with 500,000 `events` rows:

```sql
EXPLAIN ANALYZE
SELECT * FROM events WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;
```

**Before** (no suitable index):

```text
 Limit (actual rows=20 loops=1)
   ->  Gather Merge (actual rows=20 loops=1)
         Workers Planned: 2
         ->  Sort (actual rows=7 loops=3)
               Sort Key: created_at DESC
               ->  Parallel Seq Scan on events (actual rows=9 loops=3)
                     Filter: (user_id = 42)
                     Rows Removed by Filter: 166658
 Execution Time: 16.784 ms
```

Every row was read and ~500,000 were thrown away; then the matches were sorted.

```sql
CREATE INDEX idx_events_user_created ON events (user_id, created_at DESC);
```

**After:**

```text
 Limit (actual rows=20 loops=1)
   ->  Index Scan using idx_events_user_created on events (actual rows=20 loops=1)
         Index Cond: (user_id = 42)
 Execution Time: 0.033 ms
```

The index finds the user's rows already sorted by date, and the scan stops after 20 — about **500× faster**, and the gap grows with table size.

## Reading a plan

Plans are trees; read from the most indented node outwards. Common nodes:

| Node | Meaning |
| --- | --- |
| `Seq Scan` | Reads the whole table |
| `Index Scan` | Walks an index, fetches matching rows |
| `Index Only Scan` | Answers from the index alone (covering index) |
| `Bitmap Heap Scan` | Collects matches from an index, then reads table pages in order — good for medium selectivity |
| `Nested Loop` | For each outer row, look up inner rows — great when the outer side is small and the inner side is indexed |
| `Hash Join` | Build a hash table of one side, probe with the other — good for large unsorted inputs |
| `Merge Join` | Merge two sorted inputs |
| `Sort`, `HashAggregate`, `GroupAggregate` | Sorting and grouping |

What to look for:

- **Estimated vs. actual rows** — a big mismatch (estimated 10, actual 100,000) means bad statistics or a hard-to-estimate predicate, leading to poor plan choices. Run `ANALYZE`, or consider extended statistics.
- **`Rows Removed by Filter`** in the thousands — a missing or unused index.
- **Sorts spilling to disk** (`external merge`) — increase `work_mem` for that query or add an index that provides the order.
- **Nested loops with a large outer side** — often caused by underestimated row counts.

## Common causes of slow queries — and fixes

### Functions on indexed columns

```sql
-- Can't use an index on created_at
WHERE DATE(created_at) = '2026-09-30'
-- Sargable rewrite
WHERE created_at >= '2026-09-30' AND created_at < '2026-10-01'
```

### Leading wildcards

`LIKE '%term%'` can't use a B-tree index. Use trigram indexes (`pg_trgm`) or full-text search.

### `SELECT *` on wide tables

Fetching unneeded columns (especially large text/JSON) increases I/O and prevents index-only scans.

### N+1 queries from applications

One query for a list, then one query per row. Replace with a join or a single `WHERE id = ANY($1)` query.

### Deep `OFFSET` pagination

`OFFSET 100000` still reads and discards 100,000 rows. Use keyset pagination:

```sql
SELECT * FROM events
WHERE (created_at, id) < ('2026-09-01 10:00+00', 98231)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### `OR` across different columns

`WHERE a = 1 OR b = 2` may not use indexes well; rewriting as `UNION ALL` of two indexed queries sometimes helps.

### `NOT IN` with subqueries

Prefer `NOT EXISTS` — clearer semantics with NULLs and usually a better plan (an anti-join).

### Counting everything

`SELECT COUNT(*)` on a huge table scans it. For UI totals, cache counts or use estimates (`pg_class.reltuples`).

## Statistics and maintenance

The planner relies on statistics about data distribution:

- **`ANALYZE`** refreshes them (autovacuum does this automatically; run it manually after bulk loads).
- **`VACUUM`** reclaims space from updated/deleted row versions (MVCC). Autovacuum must keep up with write-heavy tables, or tables and indexes **bloat**.

## Finding the queries to fix

Enable the `pg_stat_statements` extension and look at the queries with the most **total** time — a 5 ms query run a million times matters more than a 2 s report run once a day:

```sql
SELECT query, calls, ROUND(total_exec_time) AS total_ms, ROUND(mean_exec_time, 2) AS mean_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

Also log slow queries with `log_min_duration_statement` and review lock waits in `pg_stat_activity`.

## A tuning workflow

1. Find the most expensive queries (`pg_stat_statements`, slow logs, APM).
2. `EXPLAIN (ANALYZE, BUFFERS)` them with realistic parameters on production-sized data.
3. Fix the biggest problem: an index, a query rewrite, better statistics, or a schema change.
4. Measure again; check the change doesn't slow down writes or other queries.

## Try it yourself

With the generated `events` table:

1. Compare plans for `WHERE DATE(created_at) = …` and the range version.
2. Build a page-50 query with `OFFSET` and with keyset pagination; compare `EXPLAIN ANALYZE` timings.
3. Create a partial index for `type = 'error'` and check which queries use it.
