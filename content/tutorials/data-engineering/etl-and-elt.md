Batch pipelines move data from sources into the analytical platform on a schedule. This lesson covers the two main approaches — **ETL** and **ELT** — and the techniques that make loads efficient and safe: incremental extraction, merges, backfills and idempotency.

## ETL vs. ELT

| | ETL (extract, transform, load) | ELT (extract, load, transform) |
| --- | --- | --- |
| Where transformations run | A processing engine before loading | Inside the warehouse/lakehouse, with SQL |
| Raw data kept? | Often not | Yes — raw data lands first |
| Typical tools | Spark, Python, legacy ETL tools | Fivetran/Airbyte + dbt, warehouse SQL |
| Strengths | Heavy processing, privacy filtering before landing | Flexibility, reprocessing from raw, analyst-friendly SQL |

With scalable cloud warehouses, **ELT** has become the default: land raw data with an ingestion tool, then transform it with SQL (often dbt) into clean models. ETL still makes sense for very large or complex processing, or when sensitive data must be removed before landing.

## Full vs. incremental loads

- **Full load** — re-extract everything every run. Simple and self-healing, but slow and expensive for large tables.
- **Incremental load** — extract only rows that are new or changed since the last run.

### Watermark-based incremental extraction

Track the highest `updated_at` value processed so far (the **watermark**) and fetch rows beyond it:

```python
import duckdb

con = duckdb.connect()
con.execute("CREATE TABLE source_orders (order_id INT, status VARCHAR, amount DECIMAL(10,2), updated_at TIMESTAMP)")
con.execute("CREATE TABLE warehouse_orders (order_id INT PRIMARY KEY, status VARCHAR, amount DECIMAL(10,2), updated_at TIMESTAMP)")
con.execute("CREATE TABLE pipeline_state (pipeline VARCHAR PRIMARY KEY, watermark TIMESTAMP)")
con.execute("INSERT INTO pipeline_state VALUES ('orders', TIMESTAMP '1970-01-01')")

def run_incremental():
    wm = con.execute("SELECT watermark FROM pipeline_state WHERE pipeline = 'orders'").fetchone()[0]
    batch = con.execute("SELECT * FROM source_orders WHERE updated_at > ?", [wm]).df()
    if batch.empty:
        print("nothing new")
        return
    con.register("batch", batch)
    # MERGE: update changed rows, insert new ones (idempotent)
    con.execute("""
        MERGE INTO warehouse_orders AS t
        USING batch AS s ON t.order_id = s.order_id
        WHEN MATCHED THEN UPDATE SET status = s.status, amount = s.amount, updated_at = s.updated_at
        WHEN NOT MATCHED THEN INSERT VALUES (s.order_id, s.status, s.amount, s.updated_at)
    """)
    con.execute("UPDATE pipeline_state SET watermark = ? WHERE pipeline = 'orders'", [batch["updated_at"].max()])
    print(f"merged {len(batch)} rows, new watermark {batch['updated_at'].max()}")

con.execute("""INSERT INTO source_orders VALUES
    (1, 'placed', 1200, TIMESTAMP '2026-09-30 09:00'),
    (2, 'placed',  850, TIMESTAMP '2026-09-30 09:30')""")
run_incremental()

con.execute("UPDATE source_orders SET status = 'shipped', updated_at = TIMESTAMP '2026-09-30 12:00' WHERE order_id = 1")
con.execute("INSERT INTO source_orders VALUES (3, 'placed', 430, TIMESTAMP '2026-09-30 12:05')")
run_incremental()
run_incremental()

print(con.sql("SELECT * FROM warehouse_orders ORDER BY order_id").df())
```

```text
merged 2 rows, new watermark 2026-09-30 09:30:00
merged 2 rows, new watermark 2026-09-30 12:05:00
nothing new
   order_id   status  amount          updated_at
0         1  shipped  1200.0 2026-09-30 12:00:00
1         2   placed   850.0 2026-09-30 09:30:00
2         3   placed   430.0 2026-09-30 12:05:00
```

Watermark caveats:

- The source must reliably update `updated_at` on every change (a database trigger or ORM hook).
- **Hard deletes** are invisible to watermarks — use soft deletes, periodic full reconciliations, or **change data capture** (see the CDC lesson).
- Late-arriving updates with older timestamps can be missed; re-read a small overlap window (e.g. watermark minus 1 hour) and rely on the idempotent merge.

## Partition overwrite

For event data partitioned by date, the simplest idempotent pattern is to **replace whole partitions**: reprocessing `2026-09-30` deletes and rewrites that day's data, so reruns never duplicate:

```sql
DELETE FROM fact_events WHERE event_date = '2026-09-30';
INSERT INTO fact_events SELECT … FROM staging_events WHERE event_date = '2026-09-30';
-- in Spark / table formats: INSERT OVERWRITE … PARTITION (event_date = '2026-09-30')
```

## Backfills

Reprocessing historical periods (after fixing a bug or adding a column) should be a normal, safe operation:

- Parameterise every pipeline by the **logical date/interval** it processes — never "now".
- Make every step idempotent.
- Run backfills in bounded chunks (a day or month at a time) to control cost and load.

Orchestrators like Airflow run backfills for a date range with one command.

## Staging, validation and swap

A robust load:

1. Load raw data into a **staging** table.
2. **Validate** it (row counts, nulls, uniqueness, referential checks).
3. **Merge or swap** into the production table in a transaction only if checks pass.
4. Record run metadata: rows read, written and rejected, duration, watermark.

Consumers never see half-loaded or invalid data.

## Ingestion tools

Managed and open-source connectors (Fivetran, Airbyte, Stitch, cloud-native services like AWS DMS or Azure Data Factory) handle extraction from hundreds of SaaS APIs and databases — pagination, rate limits, schema changes, incremental sync. Build custom extractors only when no connector exists or requirements are unusual.

## Try it yourself

Extend the watermark example to: re-read a 1-hour overlap window, detect deletions with a nightly full comparison of order ids, write a run log table (start, end, rows merged, watermark), and prove idempotency by running the same window three times.
