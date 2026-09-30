Plain Parquet files in a data lake have no transactions: two jobs writing at once can corrupt a table, a failed job can leave half-written files, and updating or deleting individual rows means rewriting whole files by hand. **Open table formats** — **Delta Lake**, **Apache Iceberg** and **Apache Hudi** — fix this by adding a metadata layer on top of Parquet, turning a data lake into a **lakehouse**.

## What table formats add

- **ACID transactions** — concurrent readers and writers see consistent snapshots; failed writes leave no trace.
- **Updates, deletes and MERGE** — row-level changes (CDC, GDPR deletions, corrections).
- **Schema enforcement and evolution** — reject bad writes; add or rename columns safely.
- **Time travel** — query the table as of an earlier version or timestamp; roll back mistakes.
- **Efficient reads** — file-level statistics for data skipping, compaction, clustering.
- **Engine independence** — the same table can be read and written by Spark, Trino, Flink, DuckDB, Snowflake, BigQuery, Databricks and more (support varies by format and engine).

## How it works: a transaction log

A Delta table is a directory of Parquet data files plus a `_delta_log/` folder of ordered JSON commit files. Each commit records which data files were added or removed. Readers use the log to find the exact set of files for a version; writers create a new commit atomically. (Iceberg uses a tree of metadata files and manifests, tracked by a catalog, to the same effect.)

## Delta Lake in Python

The `deltalake` package (delta-rs) works without Spark:

```python
import pandas as pd
from deltalake import DeltaTable, write_deltalake

path = "orders_delta"

# Version 0: initial load
write_deltalake(path, pd.DataFrame({
    "order_id": [1, 2, 3],
    "status": ["placed", "placed", "placed"],
    "amount": [1200.0, 850.0, 430.0],
}))

# Version 1: MERGE a batch of changes (update order 1, insert order 4)
changes = pd.DataFrame({"order_id": [1, 4], "status": ["shipped", "placed"], "amount": [1200.0, 999.0]})
(
    DeltaTable(path).merge(
        source=changes,
        predicate="t.order_id = s.order_id",
        source_alias="s",
        target_alias="t",
    )
    .when_matched_update_all()
    .when_not_matched_insert_all()
    .execute()
)

# Version 2: delete a row (e.g. a right-to-erasure request)
DeltaTable(path).delete("order_id = 2")

dt = DeltaTable(path)
print("current version:", dt.version())
print(dt.to_pandas().sort_values("order_id").to_string(index=False))

# Time travel: read the table as it was at version 0
print(DeltaTable(path, version=0).to_pandas().sort_values("order_id").to_string(index=False))

for entry in dt.history():
    print(entry["version"], entry["operation"])
```

```text
current version: 2
 order_id  status  amount
        1 shipped  1200.0
        3  placed   430.0
        4  placed   999.0
 order_id status  amount
        1 placed  1200.0
        2 placed   850.0
        3 placed   430.0
2 DELETE
1 MERGE
0 WRITE
```

## The same operations in Spark SQL

```sql
MERGE INTO silver.orders AS t
USING updates AS s
ON t.order_id = s.order_id
WHEN MATCHED AND s.op = 'd' THEN DELETE
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

SELECT * FROM silver.orders VERSION AS OF 12;             -- Delta time travel
SELECT * FROM silver.orders FOR TIMESTAMP AS OF '2026-09-29 00:00:00';  -- Iceberg time travel (Spark)

OPTIMIZE silver.orders ZORDER BY (customer_id);          -- Delta: compact small files and co-locate data
VACUUM silver.orders RETAIN 168 HOURS;                    -- remove files no longer referenced
```

## Delta Lake vs. Apache Iceberg vs. Hudi

| | Delta Lake | Apache Iceberg | Apache Hudi |
| --- | --- | --- | --- |
| Origin | Databricks | Netflix | Uber |
| Strengths | Deep Spark/Databricks integration, simple operations, delta-rs for non-JVM use | Engine-neutral design, hidden partitioning, partition evolution, broad multi-engine adoption (Snowflake, BigQuery, AWS, Trino, Flink) | Streaming upserts, incremental queries |
| Catalog | Unity Catalog, Hive/Glue | REST catalogs (Polaris, Nessie, Glue, Unity) | Hive/Glue |

The formats are converging (interoperability layers such as Delta UniForm let one table be read as another format). Choose based on the engines and platform your organisation uses.

## Iceberg's hidden partitioning

Iceberg partitions by **transforms** of columns without requiring separate partition columns:

```sql
CREATE TABLE lake.events (
  event_id BIGINT, user_id BIGINT, event_type STRING, occurred_at TIMESTAMP
) USING iceberg
PARTITIONED BY (days(occurred_at), bucket(16, user_id));
```

Queries filter on `occurred_at` naturally and still get partition pruning, and the partition scheme can evolve later without rewriting old data.

## Table maintenance

Lakehouse tables need housekeeping:

- **Compaction** — merge small files produced by frequent or streaming writes.
- **Clustering** (Z-order, liquid clustering, sort orders) — co-locate related rows for better data skipping.
- **Snapshot expiry / vacuum** — delete files older than the time-travel retention window.
- **Statistics** — keep column stats fresh for planning.

Many platforms automate this ("predictive optimisation", managed Iceberg tables).

## The catalog

A **catalog** tracks where tables live, their current metadata, and permissions — Unity Catalog, AWS Glue, Apache Polaris, Nessie, Hive Metastore. It's what lets many engines share the same tables safely, and it's the anchor for governance (next lesson).

## Try it yourself

With the `deltalake` package, build a bronze → silver pipeline: append raw CDC events to a bronze Delta table, MERGE them into a silver current-state table, delete a customer's records for a privacy request, and use time travel to show the table before and after. Then compact the table and inspect `history()`.
