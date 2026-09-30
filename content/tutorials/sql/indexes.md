Without an index, finding rows means reading the entire table (a **sequential scan**). An index is a separate, sorted data structure that lets the database locate rows quickly — like the index at the back of a book. Indexes are the most important tool for query performance.

## Creating indexes

```sql
CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE UNIQUE INDEX idx_customers_email ON customers (email);   -- also enforces uniqueness
DROP INDEX idx_orders_customer_id;
```

Primary keys and `UNIQUE` constraints create indexes automatically. **Foreign keys do not** in PostgreSQL — index foreign key columns that you join or filter on.

## B-tree indexes

The default index type is a **B-tree**, which supports:

- Equality: `WHERE email = '…'`
- Ranges: `WHERE ordered_at >= '2026-09-01'`
- Sorting: `ORDER BY ordered_at DESC`
- Prefix matches: `WHERE name LIKE 'Desk%'` (with the `text_pattern_ops` operator class or the C collation)

## Composite (multi-column) indexes

```sql
CREATE INDEX idx_orders_customer_date ON orders (customer_id, ordered_at DESC);
```

This index efficiently serves:

```sql
SELECT * FROM orders WHERE customer_id = 1 ORDER BY ordered_at DESC LIMIT 10;
SELECT * FROM orders WHERE customer_id = 1;          -- leftmost prefix
```

but not `WHERE ordered_at > …` alone, because `ordered_at` isn't the leading column. Rule of thumb: **equality columns first, then the range or sort column**.

## Seeing whether an index is used

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 1 ORDER BY ordered_at DESC LIMIT 10;
```

Look for `Index Scan` / `Index Only Scan` / `Bitmap Index Scan` instead of `Seq Scan`. (On a tiny table like our sample data, the planner may still choose a sequential scan — reading 8 rows is cheaper than using an index. Test with realistic data volumes.) The query optimisation lesson covers `EXPLAIN` in depth.

## Why an index might not be used

- The query applies a function to the column: `WHERE LOWER(email) = '…'` — create an **expression index** instead.
- The condition matches a large fraction of the table (the planner prefers a sequential scan).
- Leading wildcards: `LIKE '%mouse'`.
- Type mismatches or implicit casts.
- Outdated statistics — run `ANALYZE`.

## Special-purpose indexes

```sql
-- Expression index for case-insensitive lookups
CREATE INDEX idx_customers_email_lower ON customers (LOWER(email));

-- Partial index: only index the rows you query
CREATE INDEX idx_orders_pending ON orders (ordered_at) WHERE status = 'pending';

-- Covering index: include extra columns for index-only scans
CREATE INDEX idx_products_category ON products (category) INCLUDE (name, price);

-- GIN for JSONB, arrays and full-text search
CREATE INDEX idx_products_tags ON products USING gin (tags);

-- BRIN for huge, naturally ordered tables (e.g. append-only logs by time)
CREATE INDEX idx_events_time ON events USING brin (created_at);
```

## The cost of indexes

- Every `INSERT`, `DELETE` and many `UPDATE`s must also update each index.
- Indexes use disk and memory.
- Too many overlapping indexes slow writes without helping reads.

Find unused indexes:

```sql
SELECT relname AS table, indexrelname AS index, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Building indexes on live tables

`CREATE INDEX` blocks writes to the table while it builds. In production use:

```sql
CREATE INDEX CONCURRENTLY idx_orders_status ON orders (status);
```

It takes longer but doesn't block writes.

## Index checklist

- Primary keys and unique constraints (automatic)
- Foreign keys used in joins
- Columns in frequent `WHERE`, `JOIN` and `ORDER BY` clauses
- Composite indexes matching common query shapes (equality → range/sort)
- Nothing redundant (an index on `(a)` is redundant if `(a, b)` exists)

## Try it yourself

1. Generate 1 million rows into an `events(id, user_id, type, created_at)` table with `generate_series`.
2. Time `SELECT * FROM events WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20` with `EXPLAIN ANALYZE`.
3. Add the right composite index and compare.
4. Add a partial index for `type = 'error'` and check its size with `pg_relation_size`.
