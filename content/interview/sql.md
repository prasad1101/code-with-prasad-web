## What is the difference between `WHERE` and `HAVING`?
Level: Beginner | Tags: aggregation

`WHERE` filters **rows before** grouping; `HAVING` filters **groups after** `GROUP BY` and can use aggregates.

```sql
SELECT category, AVG(price)
FROM products
WHERE stock > 0            -- rows
GROUP BY category
HAVING AVG(price) > 1000;  -- groups
```

Put conditions that don't involve aggregates in `WHERE` — fewer rows reach the grouping step.

## Explain the different types of joins.
Level: Beginner | Tags: joins

- **INNER JOIN** — only rows with a match in both tables.
- **LEFT (OUTER) JOIN** — all rows from the left table; `NULL`s where the right has no match.
- **RIGHT (OUTER) JOIN** — all rows from the right table (usually rewritten as a left join).
- **FULL OUTER JOIN** — all rows from both sides, matched where possible.
- **CROSS JOIN** — every combination (Cartesian product).
- **SELF JOIN** — a table joined to itself (e.g. employee → manager).

A common trap: filtering the right table of a `LEFT JOIN` in `WHERE` turns it into an inner join; put such conditions in `ON`.

## What is the logical order of execution of a SELECT query?
Level: Intermediate | Tags: fundamentals

1. `FROM` / `JOIN`
2. `WHERE`
3. `GROUP BY`
4. `HAVING`
5. `SELECT` (including window functions)
6. `DISTINCT`
7. `ORDER BY`
8. `LIMIT` / `OFFSET`

Consequences: `SELECT` aliases can't be used in `WHERE` but can in `ORDER BY`; window functions can't be filtered in `WHERE` (wrap them in a subquery/CTE).

## How do `COUNT(*)`, `COUNT(column)` and `COUNT(DISTINCT column)` differ?
Level: Beginner | Tags: aggregation, null

- `COUNT(*)` counts all rows.
- `COUNT(column)` counts rows where `column` is not `NULL`.
- `COUNT(DISTINCT column)` counts distinct non-null values.

In a `LEFT JOIN`, use `COUNT(right_table.id)` to count matches — `COUNT(*)` counts the unmatched row as 1.

## How does SQL handle NULL?
Level: Beginner | Tags: null

`NULL` means unknown. Any comparison with `NULL` (`=`, `<>`, `>`) is **unknown**, not true or false, so `WHERE col = NULL` matches nothing — use `IS NULL` / `IS NOT NULL` (or `IS DISTINCT FROM`).

Other rules: aggregates (except `COUNT(*)`) ignore NULLs; `NULL + 1` is `NULL`; `NOT IN (…, NULL)` returns no rows; `COALESCE(a, b)` returns the first non-null value; `NULLIF(a, b)` returns `NULL` when equal (useful to avoid division by zero). In `ORDER BY`, NULLs sort last in ascending order in PostgreSQL (first in MySQL/SQL Server) — control with `NULLS FIRST/LAST`.

## What is the difference between `UNION` and `UNION ALL`?
Level: Beginner | Tags: set-operations

Both combine results of queries with matching columns. `UNION` removes duplicates (extra sort/hash work); `UNION ALL` keeps all rows and is faster. Use `UNION ALL` unless you specifically need de-duplication.

## Find the second highest salary.
Level: Intermediate | Tags: window-functions, subqueries

```sql
-- With DENSE_RANK (handles ties, generalises to Nth)
SELECT DISTINCT salary
FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk FROM employees) t
WHERE rnk = 2;

-- With a subquery
SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);

-- With OFFSET
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;
```

Discuss ties and what to return if there is no second value (the subquery version returns `NULL`).

## What is the difference between `ROW_NUMBER`, `RANK` and `DENSE_RANK`?
Level: Intermediate | Tags: window-functions

For salaries 100, 90, 90, 80 ordered descending:

| | 100 | 90 | 90 | 80 |
| --- | --- | --- | --- | --- |
| `ROW_NUMBER` | 1 | 2 | 3 | 4 |
| `RANK` | 1 | 2 | 2 | 4 |
| `DENSE_RANK` | 1 | 2 | 2 | 3 |

`ROW_NUMBER` is unique (ties broken arbitrarily — add a tie-breaker); `RANK` leaves gaps after ties; `DENSE_RANK` doesn't.

## How do you get the top N rows per group?
Level: Intermediate | Tags: window-functions

```sql
SELECT *
FROM (
  SELECT p.*, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn
  FROM products p
) t
WHERE rn <= 3;
```

Use `RANK` to include ties. Alternatives: `LATERAL` subqueries with `LIMIT` (efficient with an index on `(category, price)`), or `DISTINCT ON` in PostgreSQL for N = 1.

## What are window functions and how do they differ from GROUP BY?
Level: Intermediate | Tags: window-functions

Window functions compute a value over a set of rows related to the current row (`OVER (PARTITION BY … ORDER BY … frame)`) **without collapsing rows**. `GROUP BY` returns one row per group.

Uses: rankings, running totals (`SUM() OVER (ORDER BY date)`), moving averages (frames), `LAG`/`LEAD` comparisons, percent of total (`SUM(x) / SUM(SUM(x)) OVER ()`), first/last values per group.

## Write a query for a running total.
Level: Intermediate | Tags: window-functions

```sql
SELECT day, revenue,
  SUM(revenue) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM daily_revenue;
```

Add `PARTITION BY store_id` for per-store totals. Explicit `ROWS` avoids the default `RANGE` frame treating rows with equal `day` values as peers.

## What is the difference between a subquery and a CTE?
Level: Intermediate | Tags: cte, subqueries

A CTE (`WITH name AS (…)`) is a named subquery defined before the main query. Differences are mostly about readability: CTEs can be referenced multiple times, chained step by step, and can be **recursive**. In modern PostgreSQL, non-recursive CTEs referenced once are inlined, so performance is usually the same as a subquery (you can force `MATERIALIZED`).

## What is a correlated subquery?
Level: Intermediate | Tags: subqueries

A subquery that references columns of the outer query, so it's logically evaluated per outer row:

```sql
SELECT p.name FROM products p
WHERE p.price > (SELECT AVG(price) FROM products WHERE category = p.category);
```

They're expressive but can be slow on large data if the optimiser can't decorrelate them; joins, window functions or `LATERAL` are often alternatives.

## `EXISTS` vs. `IN` vs. `JOIN` — when to use which?
Level: Intermediate | Tags: subqueries, joins

- `EXISTS` — test for the presence of related rows; stops at the first match; the idiomatic semi-join.
- `IN (subquery)` — similar for positive checks; fine in modern optimisers.
- `NOT EXISTS` — preferred over `NOT IN`, which returns no rows if the subquery yields any `NULL`.
- `JOIN` — when you need columns from both tables; beware of duplicate rows with one-to-many relationships.

## What are indexes and how do they work?
Level: Beginner | Tags: indexes

An index is a separate data structure (usually a B-tree) that stores column values in sorted order with pointers to rows, letting the database find rows without scanning the whole table. It speeds up `WHERE`, `JOIN`, `ORDER BY` and `MIN/MAX`, at the cost of slower writes and extra storage.

Other types: hash, GIN (JSONB, arrays, full-text), GiST (geospatial, ranges), BRIN (huge naturally ordered tables). Composite indexes follow the leftmost-prefix rule.

## What is a composite index and why does column order matter?
Level: Intermediate | Tags: indexes

A composite index covers several columns, sorted by the first, then the second within it, and so on. It can serve queries on its **leftmost prefix**: an index on `(customer_id, created_at)` helps `WHERE customer_id = ?` and `WHERE customer_id = ? ORDER BY created_at`, but not `WHERE created_at > ?` alone.

Put equality-filtered columns first, then range or sort columns. Choose based on real query patterns.

## Why might a query not use an index?
Level: Intermediate | Tags: indexes, performance

- A function or expression on the column (`WHERE LOWER(email) = …`, `DATE(created_at) = …`).
- Leading wildcard `LIKE '%x'`.
- Low selectivity — the planner prefers a sequential scan when many rows match.
- Wrong column order in a composite index.
- Implicit type casts or mismatched collations.
- Outdated statistics (run `ANALYZE`).
- Tiny tables where a scan is cheaper.

Check with `EXPLAIN ANALYZE`.

## What is normalisation? Explain 1NF, 2NF and 3NF.
Level: Intermediate | Tags: database-design

Normalisation organises data to reduce redundancy and update anomalies.

- **1NF** — atomic values, no repeating groups, a primary key.
- **2NF** — 1NF + no partial dependency on part of a composite key.
- **3NF** — 2NF + no transitive dependencies (non-key columns depend only on the key).

"The key, the whole key, and nothing but the key." Denormalise deliberately for read performance (caches, warehouses) and document how copies stay consistent.

## What are ACID properties?
Level: Beginner | Tags: transactions

- **Atomicity** — all statements in a transaction succeed or none do.
- **Consistency** — transactions move the database between valid states (constraints hold).
- **Isolation** — concurrent transactions don't interfere as defined by the isolation level.
- **Durability** — committed data survives crashes (write-ahead log).

## Explain transaction isolation levels and the anomalies they prevent.
Level: Advanced | Tags: transactions, concurrency

- **Read uncommitted** — may see uncommitted data (dirty reads). PostgreSQL treats it as read committed.
- **Read committed** (PostgreSQL default) — each statement sees data committed before it began; non-repeatable reads and phantoms possible.
- **Repeatable read** — the transaction sees one snapshot; in PostgreSQL also prevents phantoms, but write skew is possible.
- **Serializable** — equivalent to some serial order; conflicting transactions abort and must be retried.

Also mention lost updates (prevented by atomic updates, `SELECT … FOR UPDATE`, or optimistic version checks) and that PostgreSQL uses MVCC so readers and writers don't block each other.

## What is a deadlock and how do you prevent it?
Level: Advanced | Tags: transactions, concurrency

Two transactions each hold a lock the other needs, so neither can proceed. The database detects it and aborts one.

Prevention: acquire locks in a consistent order (e.g. sort ids), keep transactions short, avoid user interaction inside transactions, use appropriate indexes (so updates lock fewer rows), and retry the aborted transaction.

## What is the difference between `DELETE`, `TRUNCATE` and `DROP`?
Level: Beginner | Tags: ddl, dml

- `DELETE` removes rows matching a `WHERE` (or all), row by row; fires triggers; can be rolled back; leaves the table.
- `TRUNCATE` removes **all** rows quickly by deallocating storage; minimal logging; resets identity with `RESTART IDENTITY`; transactional in PostgreSQL (not in all databases).
- `DROP` removes the table itself (structure, data, indexes, constraints).

## What is a primary key vs. a unique key vs. a foreign key?
Level: Beginner | Tags: constraints

- **Primary key** — uniquely identifies each row; not null; one per table.
- **Unique constraint** — values must be unique; allows NULLs (treated as distinct by default); several per table.
- **Foreign key** — a column referencing a primary/unique key in another table, enforcing referential integrity, with `ON DELETE`/`ON UPDATE` actions (restrict, cascade, set null).

## What is a view? How is a materialised view different?
Level: Intermediate | Tags: views

A **view** is a stored query; reading it runs the query each time. It simplifies complex joins, provides a stable interface and can restrict columns for security.

A **materialised view** stores the result physically — fast reads, but stale until `REFRESH MATERIALIZED VIEW` (optionally `CONCURRENTLY` with a unique index). Used for expensive dashboards and reports.

## How do you read an execution plan?
Level: Advanced | Tags: performance, explain

Use `EXPLAIN (ANALYZE, BUFFERS)`. Read the tree from the innermost nodes. Check:

- Scan types (`Seq Scan` vs `Index Scan`/`Index Only Scan`/`Bitmap`).
- Join algorithms (nested loop, hash, merge) and whether they fit the row counts.
- **Estimated vs. actual rows** — large mismatches mean poor statistics and bad plans.
- `Rows Removed by Filter`, sorts spilling to disk, time per node and buffer reads.

Then fix the biggest cost: add or adjust an index, rewrite the predicate to be sargable, update statistics, or restructure the query.

## How would you optimise a slow query?
Level: Advanced | Tags: performance

1. Reproduce with realistic data and parameters; `EXPLAIN ANALYZE`.
2. Add appropriate indexes (composite, covering, partial, expression).
3. Make predicates sargable (no functions on indexed columns; half-open date ranges).
4. Select only needed columns; avoid `SELECT *`.
5. Replace N+1 query patterns with joins or batched queries.
6. Aggregate before joining to reduce rows; avoid unnecessary `DISTINCT`.
7. Use keyset pagination instead of deep `OFFSET`.
8. Refresh statistics; consider partitioning, materialised views or caching for heavy reports.

## What is the difference between `CHAR`, `VARCHAR` and `TEXT`?
Level: Beginner | Tags: data-types

- `CHAR(n)` — fixed length, padded with spaces.
- `VARCHAR(n)` — variable length up to `n`.
- `TEXT` — variable length without a declared limit.

In PostgreSQL, `TEXT` and `VARCHAR` perform identically; use `VARCHAR(n)` or a `CHECK` only when a limit is a real business rule. Other databases differ (e.g. MySQL `TEXT` columns have indexing limitations).

## How would you find duplicate rows and remove them?
Level: Intermediate | Tags: data-cleaning, window-functions

Find:

```sql
SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1;
```

Delete all but the newest per email (PostgreSQL):

```sql
DELETE FROM customers c
USING (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) AS rn
  FROM customers
) d
WHERE c.id = d.id AND d.rn > 1;
```

Then add a `UNIQUE` constraint so it can't happen again.

## What is a recursive CTE? Give a use case.
Level: Advanced | Tags: cte, recursion

A CTE that references itself: an anchor query plus a recursive part combined with `UNION ALL`, repeated until no new rows are produced.

Use cases: org charts, category trees, threaded comments, bill of materials, graph traversal, generating date series.

```sql
WITH RECURSIVE reports AS (
  SELECT id, name FROM employees WHERE id = 2
  UNION ALL
  SELECT e.id, e.name FROM employees e JOIN reports r ON e.manager_id = r.id
)
SELECT * FROM reports;
```

Guard against cycles with a visited path or the `CYCLE` clause.

## What is the difference between OLTP and OLAP?
Level: Intermediate | Tags: database-design, analytics

- **OLTP** (online transaction processing) — many small, concurrent reads/writes; normalised schemas; row-oriented storage; latency-sensitive (orders, payments).
- **OLAP** (online analytical processing) — large scans and aggregations over history; denormalised star/snowflake schemas; columnar storage; throughput-oriented (dashboards, BI).

Systems typically replicate OLTP data into a warehouse (BigQuery, Snowflake, Redshift) for analytics rather than running heavy reports on the production database.

## How do you prevent SQL injection?
Level: Beginner | Tags: security

Never build SQL by concatenating user input. Use **parameterised queries / prepared statements**, where values are sent separately from the SQL text:

```js
await pool.query('SELECT * FROM users WHERE email = $1', [email])
```

Also: allow-list identifiers (column names for sorting) instead of passing them through, use least-privilege database roles, and rely on ORMs/query builders' parameter binding (while being careful with their "raw" query escape hatches).

## Explain partitioning vs. sharding.
Level: Expert | Tags: scaling, database-design

**Partitioning** splits one logical table into partitions **within the same database server** (by range, list or hash). Benefits: partition pruning, fast retention (drop old partitions), smaller indexes.

**Sharding** distributes data across **multiple database servers**, each holding a subset (by a shard key such as tenant). It scales writes and storage beyond one machine but complicates cross-shard queries, transactions, and rebalancing.

Try indexing, caching, replicas and partitioning before sharding.
