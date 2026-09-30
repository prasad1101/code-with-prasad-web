**Change data capture (CDC)** streams every insert, update and delete from an operational database into the data platform, in near real time, without heavy queries against the source. It solves the problems of watermark-based extraction — missed deletes, missed updates without timestamps, and load on the production database.

## How log-based CDC works

Databases write every change to a transaction log before applying it (PostgreSQL's **WAL**, MySQL's **binlog**, SQL Server's transaction log, MongoDB's **oplog**). Log-based CDC tools read this log and emit a change event for each row change:

```text
App ──► PostgreSQL ──WAL──► Debezium (Kafka Connect) ──► Kafka topic "shop.public.orders" ──► lake / warehouse
```

Benefits over query-based extraction:

- Captures **every change, including deletes**, in commit order.
- Minimal load on the source (reads the log, not the tables).
- Low latency (seconds).
- No reliance on `updated_at` columns.

## Change events

A typical Debezium-style event contains the row **before** and **after** the change, the operation and metadata:

```json
{
  "op": "u",
  "before": { "order_id": 1042, "status": "placed",  "amount": 1299.00 },
  "after":  { "order_id": 1042, "status": "shipped", "amount": 1299.00 },
  "source": { "db": "shop", "table": "orders", "lsn": 39561048, "ts_ms": 1790812800000 },
  "ts_ms": 1790812800123
}
```

`op` is `c` (create), `u` (update), `d` (delete) or `r` (snapshot read). The initial **snapshot** copies existing rows, after which the connector streams ongoing changes.

## Applying changes to a target table

Consumers apply events in order, typically as a MERGE. Within each batch, keep only the **latest** event per key (ordered by the log position), then upsert or delete:

```python
import duckdb
import pandas as pd

con = duckdb.connect()
con.execute("CREATE TABLE orders (order_id INT PRIMARY KEY, status VARCHAR, amount DECIMAL(10, 2))")

changes = pd.DataFrame([
    {"lsn": 1, "op": "c", "order_id": 1, "status": "placed",  "amount": 1200.0},
    {"lsn": 2, "op": "c", "order_id": 2, "status": "placed",  "amount": 850.0},
    {"lsn": 3, "op": "u", "order_id": 1, "status": "paid",    "amount": 1200.0},
    {"lsn": 4, "op": "c", "order_id": 3, "status": "placed",  "amount": 430.0},
    {"lsn": 5, "op": "d", "order_id": 2, "status": None,      "amount": None},
    {"lsn": 6, "op": "u", "order_id": 1, "status": "shipped", "amount": 1200.0},
])
con.register("changes", changes)

def apply_batch():
    con.execute("""
        MERGE INTO orders AS t
        USING (
            SELECT * FROM changes
            QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY lsn DESC) = 1   -- latest change per key
        ) AS s
        ON t.order_id = s.order_id
        WHEN MATCHED AND s.op = 'd' THEN DELETE
        WHEN MATCHED THEN UPDATE SET status = s.status, amount = s.amount
        WHEN NOT MATCHED AND s.op <> 'd' THEN INSERT VALUES (s.order_id, s.status, s.amount)
    """)

apply_batch()
apply_batch()        # replaying the same batch is harmless: the merge is idempotent
print(con.sql("SELECT * FROM orders ORDER BY order_id").df())
```

```text
   order_id   status  amount
0         1  shipped  1200.0
1         3   placed   430.0
```

Order 1 ends as `shipped`, order 2 is deleted, order 3 is inserted — and replaying the batch doesn't change the result.

## Keeping history

Instead of (or as well as) the current-state table, append every change event to a **change log table** in the bronze layer. It gives you full history (who changed what, when), makes SCD Type 2 dimensions easy to derive, and allows rebuilding current state at any point in time.

## Tools

| Tool | Notes |
| --- | --- |
| **Debezium** | Open-source CDC connectors on Kafka Connect (PostgreSQL, MySQL, SQL Server, MongoDB, Oracle, …) |
| Managed ingestion (Fivetran, Airbyte, Estuary, Striim) | CDC into warehouses without running infrastructure |
| Cloud services | AWS DMS, Google Datastream, Azure Data Factory CDC |
| Lakehouse ingestion | Delta Live Tables / DLT `APPLY CHANGES`, Iceberg/Hudi merge-on-read |

## Practical considerations

- **Source configuration** — logical replication must be enabled (PostgreSQL `wal_level=logical`, a replication slot; MySQL row-based binlog). An unconsumed replication slot makes the WAL grow — monitor it.
- **Schema changes** in the source must propagate safely (schema registry, alerting).
- **Initial snapshots** of large tables take time — plan them outside peak hours.
- **Ordering** is per key/partition — key Kafka topics by the primary key.
- **Deletes** — decide whether targets hard-delete, soft-delete (`is_deleted` flag) or keep history.
- **Personal data** — CDC copies everything, including PII; mask or filter columns in the pipeline.

## CDC and the outbox pattern

CDC also powers the **transactional outbox** pattern in microservices: a service writes domain events to an `outbox` table in the same transaction as its data change, and CDC publishes those events to Kafka — reliably connecting operational systems and the data platform.

## Try it yourself

Run PostgreSQL and Debezium locally with Docker Compose (the Debezium tutorial provides a ready-made setup), capture changes from an `orders` table into Kafka, and write a consumer that maintains both a current-state table and an append-only change log in DuckDB. Test inserts, updates, deletes and a replay from offset zero.
