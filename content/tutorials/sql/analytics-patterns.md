SQL is the primary language of data analysis. This lesson collects the patterns analysts use every day — growth metrics, cohorts, funnels, retention, deduplication and percentiles — built from the techniques in earlier lessons.

## Period-over-period growth

```sql
WITH monthly AS (
  SELECT DATE_TRUNC('month', o.ordered_at)::date AS month,
         SUM(oi.qty * oi.unit_price) AS revenue
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY 1
)
SELECT month, revenue,
  LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
  ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
        / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 1) AS mom_growth_pct
FROM monthly
ORDER BY month;
```

For year-over-year, use `LAG(revenue, 12)` on a complete monthly series (generate missing months first so gaps don't shift the comparison).

## Filling gaps with a date spine

Charts need a row for every period, even with no data:

```sql
SELECT d::date AS day, COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue
FROM generate_series(DATE '2026-09-01', DATE '2026-09-30', INTERVAL '1 day') AS d
LEFT JOIN orders o ON o.ordered_at::date = d::date AND o.status <> 'cancelled'
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY 1
ORDER BY 1;
```

## Cohort retention

Group customers by the month of their first order, then measure how many ordered again in later months:

```sql
WITH first_orders AS (
  SELECT customer_id, DATE_TRUNC('month', MIN(ordered_at)) AS cohort
  FROM orders WHERE status <> 'cancelled'
  GROUP BY customer_id
),
activity AS (
  SELECT DISTINCT o.customer_id, DATE_TRUNC('month', o.ordered_at) AS active_month
  FROM orders o WHERE o.status <> 'cancelled'
)
SELECT
  f.cohort::date,
  (EXTRACT(YEAR FROM a.active_month) - EXTRACT(YEAR FROM f.cohort)) * 12
    + EXTRACT(MONTH FROM a.active_month) - EXTRACT(MONTH FROM f.cohort) AS month_number,
  COUNT(DISTINCT a.customer_id) AS active_customers
FROM first_orders f
JOIN activity a ON a.customer_id = f.customer_id
GROUP BY 1, 2
ORDER BY 1, 2;
```

Divide each row by the cohort's month-0 size to get retention percentages — the classic cohort triangle.

## Funnels

How many users reached each step, in order:

```sql
WITH steps AS (
  SELECT user_id,
    MIN(created_at) FILTER (WHERE type = 'view')     AS viewed,
    MIN(created_at) FILTER (WHERE type = 'click')    AS clicked,
    MIN(created_at) FILTER (WHERE type = 'purchase') AS purchased
  FROM events
  GROUP BY user_id
)
SELECT
  COUNT(viewed)                                            AS viewed,
  COUNT(clicked)   FILTER (WHERE clicked > viewed)         AS clicked_after_view,
  COUNT(purchased) FILTER (WHERE clicked > viewed AND purchased > clicked) AS purchased_after_click
FROM steps;
```

Each step's condition must include the previous steps' conditions, so every stage is a subset of the one before it.

## Deduplication: keep the latest row per key

```sql
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC) AS rn
  FROM raw_signups
)
SELECT * FROM ranked WHERE rn = 1;
```

PostgreSQL's `DISTINCT ON` is a concise alternative:

```sql
SELECT DISTINCT ON (email) * FROM raw_signups ORDER BY email, updated_at DESC;
```

## Percentiles and distributions

```sql
SELECT
  PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY total) AS median_order,
  PERCENTILE_CONT(0.9)  WITHIN GROUP (ORDER BY total) AS p90_order,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total) AS p99_order
FROM order_summaries;
```

Histogram buckets:

```sql
SELECT WIDTH_BUCKET(total, 0, 10000, 10) AS bucket, COUNT(*)
FROM order_summaries
GROUP BY 1 ORDER BY 1;
```

## RFM segmentation

Recency, frequency and monetary value per customer, scored into quintiles:

```sql
WITH rfm AS (
  SELECT customer_id,
    CURRENT_DATE - MAX(ordered_at)::date AS recency_days,
    COUNT(*) AS frequency,
    SUM(total) AS monetary
  FROM order_summaries_by_customer
  GROUP BY customer_id
)
SELECT *,
  NTILE(5) OVER (ORDER BY recency_days DESC) AS r_score,
  NTILE(5) OVER (ORDER BY frequency)         AS f_score,
  NTILE(5) OVER (ORDER BY monetary)          AS m_score
FROM rfm;
```

## Sessionisation

Group events into sessions when the gap between events exceeds 30 minutes:

```sql
WITH gaps AS (
  SELECT user_id, created_at,
    CASE WHEN created_at - LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at)
              > INTERVAL '30 minutes' THEN 1 ELSE 0 END AS new_session
  FROM events
)
SELECT user_id, created_at,
  SUM(new_session) OVER (PARTITION BY user_id ORDER BY created_at) AS session_number
FROM gaps;
```

## Good analytical SQL habits

- Build queries as a series of CTEs; check row counts at each step.
- Be explicit about the **grain** (one row per what?) of every intermediate result to avoid double counting.
- Handle NULLs and division by zero deliberately (`COALESCE`, `NULLIF`).
- Use half-open date ranges and be explicit about time zones.
- Validate results against a known number (e.g. total revenue from the finance report).

## Try it yourself

1. Compute month-over-month revenue growth for the sample shop.
2. Build a cohort table of customers by signup month and the months in which they ordered.
3. For the generated `events` table, compute a view → click → purchase funnel and the conversion rate at each step.
