**Common Table Expressions (CTEs)** give names to intermediate results with `WITH`, turning a tangle of nested subqueries into a readable, top-to-bottom sequence of steps. **Recursive CTEs** go further and traverse hierarchies and graphs.

## A basic CTE

```sql
WITH order_totals AS (
  SELECT o.id, o.customer_id, SUM(oi.qty * oi.unit_price) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id, o.customer_id
)
SELECT c.name, COUNT(*) AS orders, SUM(t.total) AS lifetime_value
FROM order_totals t
JOIN customers c ON c.id = t.customer_id
GROUP BY c.name
ORDER BY lifetime_value DESC;
```

The CTE `order_totals` exists only for this statement. It reads like a named variable.

## Several CTEs

Each CTE can use the ones before it:

```sql
WITH order_totals AS (
  SELECT o.id, o.customer_id, SUM(oi.qty * oi.unit_price) AS total
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id, o.customer_id
),
customer_value AS (
  SELECT customer_id, SUM(total) AS lifetime_value
  FROM order_totals
  GROUP BY customer_id
),
average AS (
  SELECT AVG(lifetime_value) AS avg_value FROM customer_value
)
SELECT c.name, cv.lifetime_value
FROM customer_value cv
JOIN customers c ON c.id = cv.customer_id
CROSS JOIN average a
WHERE cv.lifetime_value > a.avg_value;
```

Complex analytics queries become a sequence of small, testable steps — you can run each CTE on its own while developing.

## CTEs and performance

In PostgreSQL 12+, a CTE referenced once is usually **inlined** (optimised together with the main query), so CTEs cost nothing extra. You can force either behaviour:

```sql
WITH totals AS MATERIALIZED (...)      -- compute once, reuse (good for expensive CTEs referenced many times)
WITH totals AS NOT MATERIALIZED (...)  -- always inline
```

## Data-modifying CTEs (PostgreSQL)

Chain writes in one statement:

```sql
WITH archived AS (
  DELETE FROM orders
  WHERE status = 'cancelled' AND ordered_at < now() - INTERVAL '1 year'
  RETURNING *
)
INSERT INTO orders_archive SELECT * FROM archived;
```

## Recursive CTEs

A recursive CTE has two parts joined by `UNION ALL`:

1. An **anchor** query — the starting rows.
2. A **recursive** query that references the CTE itself — repeated until it returns no new rows.

### Walking an org chart

```sql
WITH RECURSIVE chain AS (
  -- anchor: the top of the hierarchy
  SELECT id, name, manager_id, 1 AS level, name::text AS path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- recursive step: people who report to someone already found
  SELECT e.id, e.name, e.manager_id, c.level + 1, c.path || ' > ' || e.name
  FROM employees e
  JOIN chain c ON e.manager_id = c.id
)
SELECT level, name, path FROM chain ORDER BY path;
```

```text
 level |     name     |                   path
-------+--------------+------------------------------------------
     1 | Nisha Verma  | Nisha Verma
     2 | Anita Joshi  | Nisha Verma > Anita Joshi
     3 | Deepa Menon  | Nisha Verma > Anita Joshi > Deepa Menon
     3 | Imran Sheikh | Nisha Verma > Anita Joshi > Imran Sheikh
     2 | Arjun Mehta  | Nisha Verma > Arjun Mehta
     3 | Priya Nair   | Nisha Verma > Arjun Mehta > Priya Nair
     3 | Rohan Das    | Nisha Verma > Arjun Mehta > Rohan Das
```

### All reports under a manager (subtree)

```sql
WITH RECURSIVE team AS (
  SELECT id, name FROM employees WHERE name = 'Arjun Mehta'
  UNION ALL
  SELECT e.id, e.name FROM employees e JOIN team t ON e.manager_id = t.id
)
SELECT * FROM team;
```

The same technique handles category trees, comment threads, bill-of-materials and folder structures.

### Generating series

```sql
WITH RECURSIVE days AS (
  SELECT DATE '2026-09-01' AS day
  UNION ALL
  SELECT day + 1 FROM days WHERE day < DATE '2026-09-30'
)
SELECT d.day, COUNT(o.id) AS orders
FROM days d
LEFT JOIN orders o ON o.ordered_at::date = d.day
GROUP BY d.day
ORDER BY d.day;
```

This produces a row for **every** day, including days with zero orders — essential for charts. (PostgreSQL's `generate_series` does this more simply.)

### Guarding against cycles

If the data contains a cycle (A manages B, B manages A), recursion never ends. Track visited ids, or use PostgreSQL's `CYCLE` clause:

```sql
WITH RECURSIVE chain AS (
  SELECT id, manager_id FROM employees WHERE id = 3
  UNION ALL
  SELECT e.id, e.manager_id FROM employees e JOIN chain c ON e.id = c.manager_id
) CYCLE id SET is_cycle USING path
SELECT * FROM chain;
```

## Try it yourself

1. Rewrite a nested-subquery report from earlier lessons as a sequence of CTEs.
2. List each employee with their full management chain up to the top (walk upwards).
3. Produce a daily revenue report for September 2026 with zero-revenue days included.
