pandas loads everything into memory. That's fine for millions of rows, but at tens or hundreds of millions — or files larger than your RAM — you need different techniques. This lesson covers making pandas lean, processing in chunks, and faster engines: **Polars** and **DuckDB**.

## 1. Load less

```python
import numpy as np
import pandas as pd

n = 1_000_000
rng = np.random.default_rng(0)
pd.DataFrame({
    "order_id": np.arange(n),
    "city": rng.choice(["Pune", "Mumbai", "Delhi", "Bengaluru"], n),
    "status": rng.choice(["paid", "shipped", "cancelled"], n),
    "amount": rng.integers(100, 5000, n),
    "notes": ["n/a"] * n,
}).to_csv("orders.csv", index=False)

full = pd.read_csv("orders.csv")
lean = pd.read_csv(
    "orders.csv",
    usecols=["city", "status", "amount"],                     # only needed columns
    dtype={"city": "category", "status": "category", "amount": "int32"},
)
print(f"full: {full.memory_usage(deep=True).sum() / 1e6:.0f} MB")
print(f"lean: {lean.memory_usage(deep=True).sum() / 1e6:.0f} MB")
```

```text
full: 53 MB
lean: 6 MB
```

- **`usecols`** — skip columns you don't need.
- **`category` dtype** — for low-cardinality text (city, status), stores each distinct value once.
- **Smaller numeric types** — `int32`/`float32` when the range allows.

## 2. Process in chunks

Aggregate a file that doesn't fit in memory piece by piece:

```python
import numpy as np
import pandas as pd

n = 500_000
rng = np.random.default_rng(1)
pd.DataFrame({"city": rng.choice(["Pune", "Mumbai"], n), "amount": rng.integers(100, 5000, n)}).to_csv("big.csv", index=False)

totals = None
for chunk in pd.read_csv("big.csv", chunksize=100_000):
    part = chunk.groupby("city")["amount"].sum()
    totals = part if totals is None else totals.add(part, fill_value=0)
print(totals)
```

```text
city
Mumbai    637502564
Pune      637274519
Name: amount, dtype: int64
```

This works for aggregations that can be combined (sums, counts, min/max). Means need sums and counts combined separately.

## 3. Use Parquet

Columnar, compressed and typed: reading only the columns you need from Parquet is dramatically faster than parsing CSV (see the loading data lesson). Partitioned Parquet datasets (`year=2026/month=09/…`) let tools skip irrelevant files entirely.

## 4. DuckDB: SQL on files larger than memory

DuckDB streams through files, uses all CPU cores, and spills to disk when needed:

```python
import duckdb
import numpy as np
import pandas as pd

n = 1_000_000
rng = np.random.default_rng(2)
pd.DataFrame({
    "city": rng.choice(["Pune", "Mumbai", "Delhi"], n),
    "amount": rng.integers(100, 5000, n),
}).to_parquet("orders.parquet")

print(duckdb.sql("""
    SELECT city, COUNT(*) AS orders, ROUND(AVG(amount), 1) AS avg_amount
    FROM 'orders.parquet'
    GROUP BY city ORDER BY city
""").df())
```

```text
     city  orders  avg_amount
0   Delhi  333259      2551.0
1  Mumbai  333844      2547.5
2    Pune  332897      2547.5
```

## 5. Polars: a fast DataFrame library

**Polars** is a DataFrame library written in Rust: multi-threaded, memory-efficient, with a **lazy** API that optimises the whole query before running it:

```python
import numpy as np
import pandas as pd
import polars as pl

n = 1_000_000
rng = np.random.default_rng(3)
pd.DataFrame({
    "city": rng.choice(["Pune", "Mumbai", "Delhi"], n),
    "status": rng.choice(["paid", "cancelled"], n, p=[0.9, 0.1]),
    "amount": rng.integers(100, 5000, n),
}).to_parquet("orders.parquet")

result = (
    pl.scan_parquet("orders.parquet")          # lazy: nothing is read yet
    .filter(pl.col("status") == "paid")
    .group_by("city")
    .agg(pl.len().alias("orders"), pl.col("amount").sum().alias("revenue"))
    .sort("revenue", descending=True)
    .collect()                                  # optimise (column pruning, predicate pushdown) and execute
)
print(result)
```

```text
shape: (3, 3)
┌────────┬────────┬───────────┐
│ city   ┆ orders ┆ revenue   │
│ ---    ┆ ---    ┆ ---       │
│ str    ┆ u32    ┆ i64       │
╞════════╪════════╪═══════════╡
│ Mumbai ┆ 300853 ┆ 766598404 │
│ Delhi  ┆ 300381 ┆ 766181874 │
│ Pune   ┆ 299258 ┆ 762750943 │
└────────┴────────┴───────────┘
```

Polars expressions (`pl.col(...)`) replace pandas' index-based operations. Convert when needed with `result.to_pandas()` / `pl.from_pandas(df)`.

## Choosing a tool

| Data size | Tool |
| --- | --- |
| Up to a few million rows | pandas (with sensible dtypes) |
| Tens of millions of rows / files larger than RAM, single machine | DuckDB or Polars (lazy) |
| Data already in a warehouse | SQL in BigQuery/Snowflake/Redshift; pull aggregates only |
| Hundreds of GB–TB, distributed processing | Spark (see the Data Engineering course) |

Often the biggest win is **pushing aggregation to where the data lives** and bringing only the summarised result into pandas.

## Try it yourself

Generate a 10-million-row sales Parquet file. Compute revenue per city and month three ways — pandas, DuckDB and Polars (lazy) — and compare run time and peak memory (use `tracemalloc` or your OS activity monitor).
