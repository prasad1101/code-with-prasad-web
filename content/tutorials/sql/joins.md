Data in a relational database is spread across tables to avoid duplication. **Joins** combine it back together at query time. They're the most important concept in SQL after `SELECT` itself.

## INNER JOIN

Returns rows that have a match in **both** tables:

```sql
SELECT o.id AS order_id, c.name AS customer, o.status
FROM orders o
JOIN customers c ON c.id = o.customer_id      -- JOIN means INNER JOIN
ORDER BY o.id
LIMIT 4;
```

```text
 order_id |  customer  |  status
----------+------------+-----------
        1 | Asha Patil | shipped
        2 | Asha Patil | paid
        3 | Ravi Kumar | paid
        4 | Meera Iyer | cancelled
```

The `ON` clause states how rows relate — usually a foreign key equal to a primary key.

## Joining several tables

Order totals with the customer's name, excluding cancelled orders:

```sql
SELECT o.id, c.name, SUM(oi.qty * oi.unit_price) AS order_total
FROM orders o
JOIN customers c    ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status <> 'cancelled'
GROUP BY o.id, c.name
ORDER BY order_total DESC
LIMIT 3;
```

```text
 id |    name    | order_total
----+------------+-------------
  8 | Sara Khan  |     5098.00
  3 | Ravi Kumar |     5097.00
  5 | Meera Iyer |     2499.00
```

## LEFT JOIN

Keeps **every row from the left table**, filling columns from the right table with `NULL` when there's no match:

```sql
SELECT c.name, COUNT(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY orders DESC, c.name;
```

```text
    name    | orders
------------+--------
 Asha Patil |      2
 Meera Iyer |      2
 Ravi Kumar |      2
 Kabir Shah |      1
 Sara Khan  |      1
 Vikram Rao |      0
```

With an inner join, Vikram (no orders) would disappear. Note `COUNT(o.id)`, not `COUNT(*)` — `COUNT(*)` would count the `NULL`-filled row as 1.

### Finding rows without a match (anti-join)

```sql
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
```

```text
    name
------------
 Vikram Rao
```

### A classic mistake: filtering the right table in `WHERE`

```sql
-- Intends "all customers, with their PAID orders" — but turns into an inner join
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'paid';          -- rows with NULL status are removed

-- Correct: put the condition in ON
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid';
```

## RIGHT and FULL OUTER JOIN

- `RIGHT JOIN` keeps every row from the right table (you can always rewrite it as a `LEFT JOIN` by swapping the tables — most people do).
- `FULL OUTER JOIN` keeps all rows from both sides — useful for reconciling two data sources:

```sql
SELECT COALESCE(a.sku, b.sku) AS sku, a.qty AS system_qty, b.qty AS warehouse_qty
FROM inventory_system a
FULL OUTER JOIN warehouse_count b ON b.sku = a.sku
WHERE a.qty IS DISTINCT FROM b.qty;   -- mismatches, including items missing on either side
```

## Self join

A table joined to itself — for hierarchies like employees and managers:

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.id;
```

```text
   employee   |   manager
--------------+-------------
 Nisha Verma  |
 Arjun Mehta  | Nisha Verma
 Priya Nair   | Arjun Mehta
 Rohan Das    | Arjun Mehta
 Anita Joshi  | Nisha Verma
 Imran Sheikh | Anita Joshi
 Deepa Menon  | Anita Joshi
```

## CROSS JOIN

Every combination of rows — the Cartesian product. Occasionally useful to generate grids (every product × every month):

```sql
SELECT p.name, m.month
FROM products p
CROSS JOIN generate_series(DATE '2026-01-01', DATE '2026-03-01', INTERVAL '1 month') AS m(month);
```

Accidentally omitting a join condition produces a cross join — a common source of wildly inflated numbers.

## Join fan-out: double counting

Joining a one-to-many relationship repeats the "one" side for each match. Summing a column from the "one" side after such a join double-counts:

```sql
-- Wrong if an order has several items: each order's shipping fee is counted once per item
SELECT SUM(o.shipping_fee) FROM orders o JOIN order_items oi ON oi.order_id = o.id;
```

Aggregate at the right level first (in a subquery or CTE), then join.

## `USING` and natural joins

```sql
SELECT * FROM order_items JOIN orders USING (id);   -- only when column names match exactly
```

`USING` is convenient when both tables share a column name. Avoid `NATURAL JOIN` — it joins on *every* same-named column, which silently changes when columns are added.

## Try it yourself

1. List every order item with the product name, category and line total (`qty × unit_price`).
2. Total revenue per product category from non-cancelled orders.
3. Products that have never been ordered (anti-join) — in this dataset the answer is none; add a new product and try again.
4. Each employee with their manager and their manager's manager.
