File formats have an enormous impact on pipeline speed, storage cost and reliability. This lesson compares the common formats, then covers compression and partitioning.

## Row-oriented text formats

- **CSV** — universal and human-readable, but no types (everything is text), ambiguous quoting and encodings, no schema, slow to parse, large.
- **JSON / JSON Lines** — handles nested data; JSON Lines (one object per line) is splittable and common for logs and API exports. Verbose and schema-less.

Use them at the **edges** — ingesting from and exporting to external systems — not as your internal storage format.

## Columnar binary formats

**Parquet** is the default analytical file format:

- **Columnar** — engines read only the columns a query needs.
- **Typed schema** stored in the file (integers, decimals, timestamps, nested types).
- **Compressed** per column (Snappy, Zstandard), often 5–10× smaller than CSV.
- **Statistics** (min/max per column chunk) let engines skip data that can't match a filter (predicate pushdown).

```python
import numpy as np
import pandas as pd
import pyarrow.parquet as pq

n = 200_000
rng = np.random.default_rng(0)
df = pd.DataFrame({
    "event_id": np.arange(n),
    "user_id": rng.integers(1, 20_000, n),
    "event_type": rng.choice(["view", "click", "purchase"], n),
    "amount": rng.gamma(2, 500, n).round(2),
})
df.to_csv("events.csv", index=False)
df.to_parquet("events.parquet", index=False, compression="zstd")

import os
print(f"CSV     {os.path.getsize('events.csv') / 1e6:.1f} MB")
print(f"Parquet {os.path.getsize('events.parquet') / 1e6:.1f} MB")
print(pq.read_schema("events.parquet"))
```

```text
CSV     5.2 MB
Parquet 1.9 MB
event_id: int64
user_id: int64
event_type: large_string
amount: double
-- schema metadata --
pandas: '{"index_columns": [], "column_indexes": [], "columns": [{"name":' + 546
```

**ORC** is a similar columnar format common in the Hive ecosystem.

## Avro: rows with schemas

**Avro** is a row-oriented binary format with an embedded schema and well-defined **schema evolution** rules. It's popular for **streaming** and messaging (Kafka), where records are written one at a time and producers and consumers evolve independently. Protobuf plays a similar role in many systems.

## Choosing a format

| Use case | Format |
| --- | --- |
| Analytical storage in a lake | Parquet (inside Delta/Iceberg tables) |
| Event streams / messages | Avro or Protobuf (with a schema registry), or JSON |
| Exchanging data with people/external tools | CSV, Excel, JSON |
| Logs, semi-structured raw data | JSON Lines (compressed) |

## Compression

| Codec | Characteristics |
| --- | --- |
| Snappy | Fast, moderate compression (Parquet default in many tools) |
| Zstandard (zstd) | Excellent ratio with good speed — a great default today |
| Gzip | Good ratio, slower; ubiquitous |
| LZ4 | Very fast, lighter compression |

Note: a single gzip-compressed CSV file can't be split across parallel workers; Parquet files compress internally per column chunk and stay splittable.

## Partitioning

Partitioning splits a dataset into directories by the values of one or more columns, so queries filtering on those columns read only the relevant files:

```python
import numpy as np
import pandas as pd
import duckdb

n = 100_000
rng = np.random.default_rng(1)
df = pd.DataFrame({
    "event_date": pd.to_datetime("2026-09-01") + pd.to_timedelta(rng.integers(0, 30, n), unit="D"),
    "country": rng.choice(["IN", "AE", "DE"], n),
    "amount": rng.gamma(2, 500, n).round(2),
})
df["event_date"] = df["event_date"].dt.date.astype(str)
df.to_parquet("events", partition_cols=["event_date"], index=False)

import os
print(sorted(os.listdir("events"))[:3], "...", len(os.listdir("events")), "partitions")
print(duckdb.sql("""
    SELECT country, ROUND(SUM(amount)) AS revenue
    FROM read_parquet('events/*/*.parquet', hive_partitioning = true)
    WHERE event_date = '2026-09-15'           -- only one directory is read
    GROUP BY country ORDER BY country
""").df())
```

```text
['event_date=2026-09-01', 'event_date=2026-09-02', 'event_date=2026-09-03'] ... 30 partitions
  country    revenue
0      AE  1113958.0
1      DE  1153631.0
2      IN  1078167.0
```

Guidelines:

- Partition by columns used in **most filters** — usually a date.
- Avoid **high-cardinality** partition keys (user id): millions of tiny directories and files slow everything down.
- Aim for files of roughly **100 MB–1 GB**; many tiny files ("small files problem") hurt performance. Compact them periodically.
- Table formats like Iceberg offer **hidden partitioning** (partition by `day(event_ts)` without a separate column) and partition evolution.

## Schema evolution

Data changes: new columns appear, types widen. Plan for it:

- **Additive changes** (new optional columns) are usually safe.
- **Renames and type changes** break readers — use table formats or schema registries that track versions, and coordinate with consumers.
- Validate incoming schemas at ingestion and alert on unexpected changes.

## Try it yourself

Convert a 1-million-row CSV to Parquet with Snappy and with Zstandard. Compare file sizes and the time to compute one aggregate with DuckDB from each. Then partition the Parquet data by month and verify that a query for one month reads only that partition (use `EXPLAIN ANALYZE` in DuckDB).
