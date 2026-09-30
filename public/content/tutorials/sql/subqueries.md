A **subquery** is a query inside another query. Subqueries let you use the result of one question to answer another: "products priced above the average", "customers who never ordered", "each customer's latest order".

## Scalar subqueries

A subquery returning a single value can be used like a constant:

```sql
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price DESC;
```

```text
                 name                  |  price
---------------------------------------+---------
 Mechanical Keyboard                   | 3499.00
 USB-C Hub                             | 1899.00
 Designing Data-Intensive Applications | 1599.00
 Desk Lamp                             | 1299.00
```

In the `SELECT` list:

```sql
SELECT name, price, price - (SELECT AVG(price) FROM products) AS diff_from_avg
FROM products;
```

## Subqueries with `IN`

```sql
-- Customers who have at least one shipped order
SELECT name FROM customers
WHERE id IN (SELECT customer_id FROM orders WHERE status = 'shipped');
```

## `EXISTS` and `NOT EXISTS`

`EXISTS` is true if the subquery returns any row. It's the idiomatic way to test for related rows:

```sql
-- Customers with no orders
SELECT c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

**Prefer `NOT EXISTS` over `NOT IN`**: if the subquery returns any `NULL`, `NOT IN` returns no rows at all, because `x NOT IN (1, NULL)` is unknown for every `x`.

## Correlated subqueries

A **correlated** subquery refers to the outer query's row — it's logically evaluated once per outer row:

```sql
-- Products priced above their category's average
SELECT p.name, p.category, p.price
FROM products p
WHERE p.price > (
  SELECT AVG(p2.price) FROM products p2 WHERE p2.category = p.category
);
```

Modern optimisers often turn correlated subqueries into joins, but for large tables a join or window function (later lesson) is usually clearer and faster.

## Derived tables (subqueries in `FROM`)

Aggregate first, then query the result:

```sql
-- Average order value per customer
SELECT c.name, ROUND(AVG(t.total), 2) AS avg_order_value
FROM (
  SELECT o.id, o.customer_id, SUM(oi.qty * oi.unit_price) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id, o.customer_id
) AS t
JOIN customers c ON c.id = t.customer_id
GROUP BY c.name
ORDER BY avg_order_value DESC;
```

This avoids the double-counting problem from the joins lesson: totals are computed per order first.

## Latest row per group with `LATERAL`

`LATERAL` lets a subquery in `FROM` reference earlier tables — perfect for "top N per group":

```sql
-- Each customer's most recent order
SELECT c.name, latest.id, latest.ordered_at
FROM customers c
LEFT JOIN LATERAL (
  SELECT o.id, o.ordered_at
  FROM orders o
  WHERE o.customer_id = c.id
  ORDER BY o.ordered_at DESC
  LIMIT 1
) AS latest ON true;
```

(SQL Server calls this `OUTER APPLY`.) Window functions offer another way to do this.

## `ANY` and `ALL`

```sql
SELECT name FROM products
WHERE price > ALL (SELECT price FROM products WHERE category = 'books');  -- pricier than every book
```

## Subquery or join?

- Use **`EXISTS` / `NOT EXISTS`** to test for the presence of related rows.
- Use **joins** when you need columns from both tables.
- Use **derived tables or CTEs** to aggregate before joining.
- Readability first — then check the plan with `EXPLAIN` if performance matters.

## Try it yourself

1. Customers who ordered a product from the `books` category.
2. Orders whose total is above the average order total.
3. The most expensive product in each category (with a correlated subquery, then with `LATERAL`).
4. Categories where every product is in stock (hint: `NOT EXISTS`).
