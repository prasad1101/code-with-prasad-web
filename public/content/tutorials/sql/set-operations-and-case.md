This lesson covers tools for combining result sets and for writing conditional logic inside queries — used constantly in reporting and data cleaning.

## `UNION` and `UNION ALL`

Stack the results of two queries with the same number and types of columns:

```sql
SELECT city FROM customers WHERE city IS NOT NULL
UNION
SELECT 'Hyderabad'
ORDER BY city;
```

```text
   city
-----------
 Bengaluru
 Delhi
 Hyderabad
 Mumbai
 Pune
```

- `UNION` removes duplicates (which requires sorting or hashing — slower).
- `UNION ALL` keeps everything — faster; use it whenever duplicates are impossible or wanted.

A typical use — combining similar data from different tables into one feed:

```sql
SELECT 'order' AS type, id, ordered_at AS happened_at FROM orders
UNION ALL
SELECT 'signup', id, signed_up::timestamptz FROM customers
ORDER BY happened_at DESC
LIMIT 10;
```

## `INTERSECT` and `EXCEPT`

```sql
-- Customers who ordered both electronics and books
SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id WHERE p.category = 'electronics'
INTERSECT
SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id WHERE p.category = 'books';

-- Customers who never ordered
SELECT id FROM customers
EXCEPT
SELECT customer_id FROM orders;
```

(Oracle calls `EXCEPT` `MINUS`.)

## `CASE` expressions

`CASE` is SQL's if/else — it works anywhere an expression is allowed:

```sql
SELECT name, price,
  CASE
    WHEN price < 500  THEN 'budget'
    WHEN price < 2000 THEN 'mid-range'
    ELSE 'premium'
  END AS band
FROM products
ORDER BY price;
```

```text
                 name                  |  price  |   band
---------------------------------------+---------+-----------
 Notebook A5                           |  120.00 | budget
 Gel Pen Pack                          |  199.00 | budget
 Wireless Mouse                        |  799.00 | mid-range
 Clean Code                            |  899.00 | mid-range
 Desk Lamp                             | 1299.00 | mid-range
 Designing Data-Intensive Applications | 1599.00 | mid-range
 USB-C Hub                             | 1899.00 | mid-range
 Mechanical Keyboard                   | 3499.00 | premium
```

Conditions are checked in order; the first true branch wins. Without `ELSE`, unmatched rows get `NULL`.

The "simple" form compares one expression:

```sql
SELECT id,
  CASE status WHEN 'paid' THEN 'Awaiting shipment' WHEN 'shipped' THEN 'On the way' ELSE INITCAP(status) END
FROM orders;
```

### `CASE` in aggregation (pivoting)

```sql
SELECT
  DATE_TRUNC('month', ordered_at)::date AS month,
  COUNT(*) AS orders,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
  ROUND(100.0 * SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(*), 1) AS cancel_rate_pct
FROM orders
GROUP BY 1
ORDER BY 1;
```

Multiplying by `100.0` (not `100`) avoids integer division.

### `CASE` in `ORDER BY`

```sql
SELECT id, status FROM orders
ORDER BY CASE status WHEN 'pending' THEN 1 WHEN 'paid' THEN 2 WHEN 'shipped' THEN 3 ELSE 4 END;
```

## `COALESCE`, `NULLIF` and `GREATEST`/`LEAST`

```sql
SELECT name, COALESCE(city, 'Unknown') FROM customers;             -- first non-null
SELECT revenue / NULLIF(orders, 0) FROM monthly_stats;             -- avoid division by zero
SELECT GREATEST(price - 100, 0) AS discounted FROM products;       -- never below zero
```

## Type casting

```sql
SELECT '42'::int + 1;                      -- PostgreSQL shorthand
SELECT CAST('2026-09-30' AS date);         -- standard SQL
SELECT price::int FROM products;           -- rounds numeric → integer
```

## Try it yourself

1. Label customers as `'new'` (signed up in the last 180 days of the data), `'regular'` or `'unknown city'` when city is missing.
2. A monthly report with columns `paid`, `shipped`, `cancelled` counts using conditional aggregation.
3. A single list of "events" combining orders and customer signups, newest first.
4. Customers who bought electronics but never books (`EXCEPT`).
