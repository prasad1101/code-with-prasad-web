`SELECT` retrieves data. It's the statement you'll write most often, so let's master its basic clauses.

## Selecting columns

```sql
SELECT * FROM products;                 -- every column (fine for exploring, avoid in app code)
SELECT name, price FROM products;       -- specific columns
```

List columns explicitly in real queries: it's clearer, transfers less data, and doesn't break when columns are added.

## Filtering rows with `WHERE`

```sql
SELECT name, price
FROM products
WHERE category = 'electronics'
ORDER BY price DESC;
```

```text
        name         |  price
---------------------+---------
 Mechanical Keyboard | 3499.00
 USB-C Hub           | 1899.00
 Wireless Mouse      |  799.00
```

String literals use **single quotes**. Double quotes are for identifiers (column/table names).

## Sorting with `ORDER BY`

```sql
SELECT name, category, price FROM products ORDER BY category, price DESC;
```

Sort by several columns: first by `category` ascending, then by `price` descending within each category. Without `ORDER BY`, **row order is not guaranteed** — never rely on it.

## Limiting results

```sql
SELECT name, price FROM products ORDER BY price DESC LIMIT 3;          -- top 3
SELECT name, price FROM products ORDER BY price DESC LIMIT 3 OFFSET 3; -- next 3
```

The SQL-standard form works in PostgreSQL, SQL Server and Oracle:

```sql
SELECT name, price FROM products ORDER BY price DESC FETCH FIRST 3 ROWS ONLY;
```

(SQL Server's older syntax is `SELECT TOP 3 …`.)

## Computed columns and aliases

```sql
SELECT name, price, price * 1.18 AS price_with_gst
FROM products
ORDER BY price
LIMIT 3;
```

```text
      name      | price  | price_with_gst
----------------+--------+----------------
 Notebook A5    | 120.00 |       141.6000
 Gel Pen Pack   | 199.00 |       234.8200
 Wireless Mouse | 799.00 |       942.8200
```

`AS` names the output column. Round it with `ROUND(price * 1.18, 2)`.

Common functions:

```sql
SELECT
  UPPER(name),                       -- 'WIRELESS MOUSE'
  LENGTH(name),
  name || ' (' || category || ')',   -- string concatenation (CONCAT() also works)
  ROUND(price / 3, 2),
  CURRENT_DATE,
  NOW()
FROM products;
```

## Removing duplicates

```sql
SELECT DISTINCT category FROM products ORDER BY category;
SELECT DISTINCT city FROM customers;   -- NULL appears once too
```

## Table aliases

```sql
SELECT p.name, p.price FROM products AS p WHERE p.stock > 0;
```

Aliases become essential once you join several tables.

## How a SELECT is evaluated

Although written as `SELECT … FROM … WHERE … ORDER BY`, the database logically processes the clauses in this order:

1. `FROM` (and joins) — which rows exist
2. `WHERE` — filter rows
3. `GROUP BY` — form groups
4. `HAVING` — filter groups
5. `SELECT` — compute output columns
6. `DISTINCT`
7. `ORDER BY`
8. `LIMIT` / `OFFSET`

That's why you **can't use a `SELECT` alias in `WHERE`** (it doesn't exist yet), but you **can** use it in `ORDER BY`.

## Comments

```sql
-- single-line comment
/* multi-line
   comment */
```

## Try it yourself

1. List all books with their price, cheapest first.
2. Show the three products with the most stock.
3. Show each product's name and its stock value (`price * stock`) as `stock_value`, highest first.
4. List the distinct cities of customers, alphabetically.
