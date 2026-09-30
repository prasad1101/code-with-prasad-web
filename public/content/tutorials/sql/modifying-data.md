DML statements change data: `INSERT`, `UPDATE`, `DELETE` and upserts. They're simple to write — and easy to get catastrophically wrong without a `WHERE` clause. This lesson covers them safely.

## INSERT

```sql
INSERT INTO customers (name, email, city)
VALUES ('Neha Gupta', 'neha@example.com', 'Pune');

-- Several rows at once
INSERT INTO products (name, category, price, stock) VALUES
  ('Whiteboard Marker', 'stationery', 45, 200),
  ('Laptop Stand',      'electronics', 1499, 20);
```

Always list the columns explicitly — the statement keeps working if columns are added or reordered.

### `RETURNING` (PostgreSQL)

Get generated values back without a second query:

```sql
INSERT INTO orders (customer_id, status)
VALUES (1, 'pending')
RETURNING id, ordered_at;
```

### `INSERT … SELECT`

```sql
INSERT INTO archived_orders (id, customer_id, status, ordered_at)
SELECT id, customer_id, status, ordered_at
FROM orders
WHERE ordered_at < '2026-01-01';
```

## UPDATE

```sql
UPDATE products SET price = 749 WHERE id = 1;

UPDATE products
SET price = ROUND(price * 1.05, 2), stock = stock + 10
WHERE category = 'stationery'
RETURNING id, name, price;
```

**Forgetting `WHERE` updates every row.** Before running an update, run the same `WHERE` as a `SELECT` to see which rows it affects.

### Updating from another table

```sql
-- Set each order's status to shipped when a shipment record exists
UPDATE orders o
SET status = 'shipped'
FROM shipments s
WHERE s.order_id = o.id AND o.status = 'paid';
```

(MySQL and SQL Server use `UPDATE … JOIN` syntax instead.)

## DELETE

```sql
DELETE FROM order_items WHERE order_id = 4;
DELETE FROM customers WHERE id NOT IN (SELECT customer_id FROM orders) RETURNING name;
```

Many applications prefer **soft deletes** — `UPDATE … SET deleted_at = now()` — to keep history and allow recovery.

## Upserts: insert or update

Insert a row, or update it if it already exists (based on a unique constraint):

```sql
INSERT INTO product_stats (product_id, views)
VALUES (1, 1)
ON CONFLICT (product_id)
DO UPDATE SET views = product_stats.views + EXCLUDED.views;
```

`EXCLUDED` refers to the row you tried to insert. Use `ON CONFLICT DO NOTHING` to skip duplicates.

The SQL-standard `MERGE` (PostgreSQL 15+, SQL Server, Oracle) handles more complex sync logic:

```sql
MERGE INTO products p
USING staged_products s ON s.sku = p.sku
WHEN MATCHED THEN UPDATE SET price = s.price, stock = s.stock
WHEN NOT MATCHED THEN INSERT (sku, name, category, price, stock)
  VALUES (s.sku, s.name, s.category, s.price, s.stock);
```

(MySQL uses `INSERT … ON DUPLICATE KEY UPDATE`.)

## Doing it safely: transactions

Wrap risky changes in a transaction so you can check the result before committing:

```sql
BEGIN;

UPDATE products SET price = price * 0.9 WHERE category = 'books';
SELECT name, price FROM products WHERE category = 'books';   -- verify

COMMIT;    -- or ROLLBACK; to undo everything since BEGIN
```

Multi-step changes that must succeed together (placing an order and decrementing stock) must always run in one transaction — see the transactions lesson.

## Safe patterns for data changes

- Run a `SELECT` with the same `WHERE` first.
- Use `RETURNING` to see exactly what changed.
- Update in batches on huge tables (`WHERE id BETWEEN …`) to avoid long locks and bloated transaction logs.
- Take a backup (or have point-in-time recovery) before bulk operations in production.
- Never interpolate user input into SQL strings in application code — use **parameterised queries**:

```js
// Node.js with pg
await pool.query('UPDATE products SET price = $1 WHERE id = $2', [price, id])
```

## Bulk loading

For large imports, `COPY` is dramatically faster than many `INSERT`s:

```sql
COPY products (name, category, price, stock) FROM '/data/products.csv' WITH (FORMAT csv, HEADER true);
```

(From a client machine, use `psql`'s `\copy`, which reads the local file.)

## Try it yourself

1. Insert a new customer and an order for them in one transaction, returning the new order id.
2. Increase the stock of every out-of-stock product by 50 and return their names.
3. Upsert a `daily_sales(day, revenue)` row, adding to the revenue if the day already exists.
4. Soft-delete customers who signed up more than a year ago and never ordered.
