Databases can store reusable logic: **views** (saved queries), **materialised views** (saved results), **functions**, **stored procedures** and **triggers**. Used well, they simplify application code and enforce rules close to the data.

## Views

A view is a named query that behaves like a table:

```sql
CREATE VIEW order_summaries AS
SELECT
  o.id,
  c.name AS customer,
  o.status,
  o.ordered_at,
  SUM(oi.qty * oi.unit_price) AS total,
  SUM(oi.qty) AS items
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, c.name;

SELECT * FROM order_summaries WHERE status = 'paid' ORDER BY total DESC;
```

Views:

- Hide complex joins behind a simple interface.
- Give a stable API to reporting tools even if underlying tables change.
- Restrict access: grant `SELECT` on a view that excludes sensitive columns instead of the base table.

A regular view stores no data — the query runs each time. Simple views (one table, no aggregates) are even **updatable**.

## Materialised views

A materialised view stores the query's **result**. It's fast to read, but stale until refreshed:

```sql
CREATE MATERIALIZED VIEW monthly_revenue AS
SELECT DATE_TRUNC('month', o.ordered_at)::date AS month,
       SUM(oi.qty * oi.unit_price) AS revenue
FROM orders o JOIN order_items oi ON oi.order_id = o.id
WHERE o.status <> 'cancelled'
GROUP BY 1;

CREATE UNIQUE INDEX ON monthly_revenue (month);

REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_revenue;   -- without blocking readers (needs a unique index)
```

Ideal for dashboards over large tables — refresh on a schedule (e.g. every 15 minutes with `pg_cron` or an external scheduler).

## Functions

SQL functions return values and can be used inside queries:

```sql
CREATE FUNCTION order_total(p_order_id INTEGER)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(qty * unit_price), 0)
  FROM order_items
  WHERE order_id = p_order_id;
$$;

SELECT id, order_total(id) FROM orders;
```

**PL/pgSQL** adds variables, conditions and loops:

```sql
CREATE FUNCTION loyalty_tier(p_customer_id INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  spent NUMERIC;
BEGIN
  SELECT COALESCE(SUM(oi.qty * oi.unit_price), 0) INTO spent
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.customer_id = p_customer_id AND o.status <> 'cancelled';

  RETURN CASE
    WHEN spent >= 5000 THEN 'gold'
    WHEN spent >= 2000 THEN 'silver'
    ELSE 'bronze'
  END;
END;
$$;

SELECT name, loyalty_tier(id) FROM customers;
```

Volatility labels (`IMMUTABLE`, `STABLE`, `VOLATILE`) tell the planner how the function may be optimised — label them accurately.

## Stored procedures

Procedures (`CREATE PROCEDURE`, called with `CALL`) can manage transactions themselves (`COMMIT` inside) and are used for batch jobs:

```sql
CREATE PROCEDURE archive_old_orders(cutoff DATE)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO orders_archive SELECT * FROM orders WHERE ordered_at < cutoff;
  DELETE FROM orders WHERE ordered_at < cutoff;
END;
$$;

CALL archive_old_orders('2025-01-01');
```

## Triggers

A trigger runs a function automatically when rows change:

```sql
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

ALTER TABLE products ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

Common uses: `updated_at` timestamps, audit logs, maintaining denormalised counters, enforcing complex rules.

## How much logic belongs in the database?

| In the database | In the application |
| --- | --- |
| Integrity rules (constraints, simple triggers) | Business workflows, external API calls |
| Performance-critical set-based processing | Logic that changes frequently |
| Reporting views | Anything needing unit tests and code review in the main codebase |

Heavy use of triggers and procedures makes behaviour harder to discover, test and version. A balanced approach: constraints and views freely, triggers sparingly for cross-cutting concerns (timestamps, audit), and business logic in the application — with all database objects managed through migrations.

## Try it yourself

1. Create a view `customer_stats` with each customer's order count, lifetime value and last order date.
2. Turn it into a materialised view with a unique index and refresh it concurrently.
3. Write an audit trigger that records price changes in a `price_history(product_id, old_price, new_price, changed_at)` table.
