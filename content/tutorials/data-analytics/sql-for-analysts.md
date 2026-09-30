SQL is the language analysts use most. Data lives in databases and warehouses; querying it there is faster and more scalable than exporting everything to pandas. This lesson focuses on analytical SQL patterns and on **DuckDB**, which lets you run SQL directly on CSV/Parquet files and pandas DataFrames. (The SQL course covers the language in depth.)

## DuckDB: SQL on your laptop's data

DuckDB is an in-process analytical database — no server needed — and extremely fast on large files:

```python
import duckdb
import pandas as pd

orders = pd.DataFrame({
    "order_id": range(1, 9),
    "customer": ["Asha", "Ravi", "Asha", "Meera", "Kabir", "Ravi", "Asha", "Sara"],
    "city": ["Pune", "Mumbai", "Pune", "Bengaluru", "Pune", "Mumbai", "Pune", "Delhi"],
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098],
    "ordered_at": pd.to_datetime(["2026-07-02", "2026-07-15", "2026-07-20", "2026-08-03", "2026-08-11", "2026-08-25", "2026-09-05", "2026-09-18"]),
})

result = duckdb.sql("""
    SELECT city, COUNT(*) AS orders, SUM(amount) AS revenue, ROUND(AVG(amount)) AS avg_order
    FROM orders                        -- queries the pandas DataFrame directly
    GROUP BY city
    ORDER BY revenue DESC
""").df()
print(result)
```

```text
        city  orders  revenue  avg_order
0       Pune       4   6237.0     1559.0
1      Delhi       1   5098.0     5098.0
2  Bengaluru       1   1899.0     1899.0
3     Mumbai       2   1698.0      849.0
```

It reads files directly, too:

```python
import duckdb
import pandas as pd

pd.DataFrame({"city": ["Pune", "Mumbai", "Pune"], "amount": [100, 250, 300]}).to_parquet("orders.parquet")
print(duckdb.sql("SELECT city, SUM(amount) AS revenue FROM 'orders.parquet' GROUP BY city ORDER BY city").df())
```

```text
     city  revenue
0  Mumbai    250.0
1    Pune    400.0
```

## Analytical patterns

### Monthly metrics with growth

```python
import duckdb
import pandas as pd

orders = pd.DataFrame({
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098],
    "ordered_at": pd.to_datetime(["2026-07-02", "2026-07-15", "2026-07-20", "2026-08-03", "2026-08-11", "2026-08-25", "2026-09-05", "2026-09-18"]),
})
print(duckdb.sql("""
    WITH monthly AS (
        SELECT DATE_TRUNC('month', ordered_at) AS month, SUM(amount) AS revenue
        FROM orders GROUP BY 1
    )
    SELECT strftime(month, '%Y-%m') AS month, revenue,
           ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month), 1) AS mom_pct
    FROM monthly ORDER BY month
""").df())
```

```text
     month  revenue  mom_pct
0  2026-07   4638.0      NaN
1  2026-08   4297.0     -7.4
2  2026-09   5997.0     39.6
```

### Top N per group

```python
import duckdb
import pandas as pd

orders = pd.DataFrame({
    "customer": ["Asha", "Ravi", "Asha", "Meera", "Kabir", "Ravi", "Asha", "Sara"],
    "city": ["Pune", "Mumbai", "Pune", "Bengaluru", "Pune", "Mumbai", "Pune", "Delhi"],
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098],
})
print(duckdb.sql("""
    SELECT city, customer, spend
    FROM (
        SELECT city, customer, SUM(amount) AS spend,
               ROW_NUMBER() OVER (PARTITION BY city ORDER BY SUM(amount) DESC) AS rn
        FROM orders GROUP BY city, customer
    )
    WHERE rn = 1
    ORDER BY spend DESC
""").df())
```

```text
        city customer   spend
0      Delhi     Sara  5098.0
1       Pune     Asha  4638.0
2  Bengaluru    Meera  1899.0
3     Mumbai     Ravi  1698.0
```

### Repeat-purchase rate

```python
import duckdb
import pandas as pd

orders = pd.DataFrame({"customer": ["Asha", "Ravi", "Asha", "Meera", "Kabir", "Ravi", "Asha", "Sara"]})
print(duckdb.sql("""
    WITH per_customer AS (SELECT customer, COUNT(*) AS n FROM orders GROUP BY customer)
    SELECT COUNT(*) AS customers,
           COUNT(*) FILTER (WHERE n >= 2) AS repeat_customers,
           ROUND(100.0 * COUNT(*) FILTER (WHERE n >= 2) / COUNT(*), 1) AS repeat_rate_pct
    FROM per_customer
""").df())
```

```text
   customers  repeat_customers  repeat_rate_pct
0          5                 2             40.0
```

## SQL or pandas?

| Use SQL when… | Use pandas when… |
| --- | --- |
| Data is large and lives in a database/warehouse | Data fits comfortably in memory |
| You're filtering, joining and aggregating | You need custom Python logic, statistics or ML |
| The query will become a scheduled report/dashboard | You're exploring interactively with charts |

The common workflow: **aggregate in SQL, then analyse and visualise the (much smaller) result in pandas**. DuckDB blurs the line — you can switch between SQL and DataFrames in the same notebook.

## Good habits for analytical SQL

- Use CTEs to build queries step by step; check row counts at each step.
- Be explicit about the grain of each CTE to avoid double counting after joins.
- Use half-open date ranges and be deliberate about time zones.
- Name metrics clearly and document their definitions (what counts as an "active user"?).
- Parameterise and version-control queries that feed recurring reports.

## Try it yourself

Load a public dataset (CSV or Parquet) with DuckDB and answer three business questions purely in SQL: monthly trend with growth, the top item per category, and a repeat-rate metric. Then bring one result into pandas and chart it.
