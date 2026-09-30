**Window functions** compute values across a set of rows related to the current row — without collapsing them into one row like `GROUP BY` does. Rankings, running totals, moving averages, previous/next values and percentages of totals all become simple. They're a favourite topic in SQL interviews.

## The `OVER` clause

```sql
SELECT
  name, department, salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk,
  ROUND(AVG(salary) OVER (PARTITION BY department), 0)       AS dept_avg
FROM employees
ORDER BY department, rnk, name;
```

```text
     name     | department  |  salary   | rnk | dept_avg
--------------+-------------+-----------+-----+----------
 Nisha Verma  | Engineering | 250000.00 |   1 |   182500
 Arjun Mehta  | Engineering | 180000.00 |   2 |   182500
 Priya Nair   | Engineering | 150000.00 |   3 |   182500
 Rohan Das    | Engineering | 150000.00 |   3 |   182500
 Anita Joshi  | Sales       | 160000.00 |   1 |   115000
 Deepa Menon  | Sales       |  95000.00 |   2 |   115000
 Imran Sheikh | Sales       |  90000.00 |   3 |   115000
```

- `PARTITION BY` splits rows into groups (like `GROUP BY`, but rows are kept).
- `ORDER BY` inside `OVER` orders rows within each partition.
- Every row keeps its own columns **and** gets the window result.

## Ranking functions

```sql
SELECT name, salary,
  ROW_NUMBER() OVER w AS row_number,
  RANK()       OVER w AS rank,
  DENSE_RANK() OVER w AS dense_rank
FROM employees
WHERE department = 'Engineering'
WINDOW w AS (ORDER BY salary DESC);
```

```text
    name     |  salary   | row_number | rank | dense_rank
-------------+-----------+------------+------+------------
 Nisha Verma | 250000.00 |          1 |    1 |          1
 Arjun Mehta | 180000.00 |          2 |    2 |          2
 Priya Nair  | 150000.00 |          3 |    3 |          3
 Rohan Das   | 150000.00 |          4 |    3 |          3
```

- `ROW_NUMBER` — unique sequence (ties broken arbitrarily unless you add a tie-breaker).
- `RANK` — ties share a rank; the next rank skips (1, 2, 3, 3, **5**).
- `DENSE_RANK` — ties share a rank; no gaps (1, 2, 3, 3, **4**).
- `NTILE(4)` — splits rows into quartiles.

### Top N per group

A classic interview question: "the highest-paid employee in each department".

```sql
SELECT name, department, salary
FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
  FROM employees
) ranked
WHERE rn = 1;
```

Window functions can't be used directly in `WHERE` (they're computed after it), hence the subquery or CTE. Use `RANK` instead of `ROW_NUMBER` to include ties.

## Running totals and previous values

```sql
WITH order_totals AS (
  SELECT o.id, o.customer_id, o.ordered_at, SUM(oi.qty * oi.unit_price) AS total
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id
)
SELECT customer_id, id, ordered_at::date, total,
  SUM(total) OVER (PARTITION BY customer_id ORDER BY ordered_at) AS running_total,
  LAG(total) OVER (PARTITION BY customer_id ORDER BY ordered_at) AS previous
FROM order_totals
ORDER BY customer_id, ordered_at;
```

```text
 customer_id | id | ordered_at |  total  | running_total | previous
-------------+----+------------+---------+---------------+----------
           1 |  1 | 2026-06-02 | 1159.00 |       1159.00 |
           1 |  2 | 2026-08-14 | 1599.00 |       2758.00 |  1159.00
           2 |  3 | 2026-06-20 | 5097.00 |       5097.00 |
           2 |  7 | 2026-09-02 | 1997.00 |       7094.00 |  5097.00
           3 |  5 | 2026-07-18 | 2499.00 |       2499.00 |
           4 |  6 | 2026-09-25 | 1299.00 |       1299.00 |
           5 |  8 | 2026-09-12 | 5098.00 |       5098.00 |
```

- `LAG(x)` / `LEAD(x)` — the value from the previous / next row. Great for period-over-period change: `total - LAG(total) OVER (...)`.
- `FIRST_VALUE`, `LAST_VALUE`, `NTH_VALUE` — values from specific positions in the window.

## Window frames

With `ORDER BY`, aggregate windows default to "from the start of the partition up to the current row" — which is why `SUM` produced a running total. You can specify the frame explicitly:

```sql
-- 7-day moving average of daily revenue
SELECT day, revenue,
  AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7
FROM daily_revenue;
```

- `ROWS` counts physical rows; `RANGE` uses values (e.g. `RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW`), which handles missing days correctly.
- `LAST_VALUE` usually needs `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, otherwise the frame ends at the current row.

## Percent of total

```sql
SELECT category, SUM(price * stock) AS stock_value,
  ROUND(100.0 * SUM(price * stock) / SUM(SUM(price * stock)) OVER (), 1) AS pct_of_total
FROM products
GROUP BY category
ORDER BY stock_value DESC;
```

`OVER ()` with an empty window spans all rows. Here a window function is applied on top of a `GROUP BY` aggregate — perfectly valid.

## Gaps and islands

Find consecutive streaks (e.g. consecutive days a user was active) by subtracting a row number from the date — consecutive dates produce the same difference:

```sql
SELECT user_id, MIN(day) AS streak_start, MAX(day) AS streak_end, COUNT(*) AS days
FROM (
  SELECT user_id, day, day - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day))::int AS grp
  FROM user_activity
) t
GROUP BY user_id, grp
ORDER BY days DESC;
```

## Try it yourself

1. Rank products by price within each category (with `DENSE_RANK`).
2. For each order, show the customer's previous order date and the number of days between them.
3. The top 2 most expensive products per category.
4. Each category's share of total revenue from non-cancelled orders.
5. A 3-order moving average of order totals over time.
