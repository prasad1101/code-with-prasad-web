Aggregate functions summarise many rows into one value: counts, sums, averages, minimums and maximums. With `GROUP BY` they produce one summary row per group — the basis of every report and dashboard.

## Aggregate functions

```sql
SELECT
  COUNT(*)              AS products,
  SUM(stock)            AS units_in_stock,
  ROUND(AVG(price), 2)  AS avg_price,
  MIN(price)            AS cheapest,
  MAX(price)            AS most_expensive
FROM products;
```

### COUNT variants

```sql
SELECT COUNT(*), COUNT(city), COUNT(DISTINCT city) FROM customers;
```

```text
 count | count | count
-------+-------+-------
     6 |     5 |     4
```

- `COUNT(*)` counts rows.
- `COUNT(column)` counts **non-null** values.
- `COUNT(DISTINCT column)` counts distinct non-null values.

All aggregates except `COUNT(*)` **ignore NULLs**. `AVG` of `(10, NULL, 20)` is 15, not 10.

## `GROUP BY`

```sql
SELECT
  category,
  COUNT(*)             AS products,
  ROUND(AVG(price), 2) AS avg_price,
  MIN(price),
  MAX(price)
FROM products
GROUP BY category
ORDER BY products DESC, category;
```

```text
  category   | products | avg_price |   min   |   max
-------------+----------+-----------+---------+---------
 electronics |        3 |   2065.67 |  799.00 | 3499.00
 books       |        2 |   1249.00 |  899.00 | 1599.00
 stationery  |        2 |    159.50 |  120.00 |  199.00
 home        |        1 |   1299.00 | 1299.00 | 1299.00
```

**The rule:** every column in `SELECT` must either be in `GROUP BY` or be inside an aggregate function. Otherwise the database can't know which row's value to show.

```sql
SELECT category, name, COUNT(*) FROM products GROUP BY category; -- ERROR: name must appear in GROUP BY
```

Group by several columns, or by expressions:

```sql
SELECT DATE_TRUNC('month', ordered_at) AS month, status, COUNT(*)
FROM orders
GROUP BY month, status
ORDER BY month, status;
```

## Filtering groups with `HAVING`

`WHERE` filters rows **before** grouping; `HAVING` filters groups **after**:

```sql
SELECT status, COUNT(*) AS orders
FROM orders
GROUP BY status
HAVING COUNT(*) >= 2
ORDER BY orders DESC;
```

```text
 status  | orders
---------+--------
 paid    |      3
 shipped |      3
```

Using both:

```sql
-- Categories whose in-stock products average over ₹1,000
SELECT category, ROUND(AVG(price), 2) AS avg_price
FROM products
WHERE stock > 0                 -- rows
GROUP BY category
HAVING AVG(price) > 1000;       -- groups
```

Filter in `WHERE` whenever possible — it reduces the rows that need grouping.

## Conditional aggregation

Count or sum only some rows within each group using `FILTER` (PostgreSQL) or `CASE` (all databases):

```sql
SELECT
  COUNT(*) AS all_orders,
  COUNT(*) FILTER (WHERE status = 'shipped') AS shipped,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
FROM orders;
```

This "pivot" technique turns categories into columns in a single pass.

## Other useful aggregates

```sql
SELECT category, STRING_AGG(name, ', ' ORDER BY name) AS products
FROM products GROUP BY category;                    -- 'Clean Code, Designing …'

SELECT ARRAY_AGG(DISTINCT city) FROM customers;     -- PostgreSQL arrays
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS median_price FROM products;
SELECT BOOL_OR(stock = 0) AS any_out_of_stock FROM products;
```

(MySQL uses `GROUP_CONCAT`; SQL Server uses `STRING_AGG` too.)

## Totals and subtotals

```sql
SELECT category, SUM(stock)
FROM products
GROUP BY ROLLUP (category)   -- adds a grand-total row with category = NULL
ORDER BY category;
```

`GROUPING SETS` and `CUBE` produce several groupings in one query — useful for reports.

## Try it yourself

1. How many customers are there per city? Include customers without a city as "Unknown".
2. For each category, the total stock value (`price × stock`), only for categories with value over ₹10,000.
3. Orders per month with separate counts for paid, shipped and cancelled.
4. The median product price per category.
