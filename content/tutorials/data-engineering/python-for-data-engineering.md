Python is the glue of data engineering: extracting from APIs, moving files, orchestrating jobs and transforming data. This lesson builds a small but production-minded ETL pipeline and covers the practices that make pipelines reliable.

## A simple ETL pipeline

Extract orders from a source (simulated API responses), transform them, and load them into an analytical store (DuckDB):

```python
import json
from datetime import datetime, timezone

import duckdb
import pandas as pd

# --- Extract --------------------------------------------------------------
def extract_orders(pages: list[str]) -> list[dict]:
    """In production: paginated HTTP requests with retries and timeouts."""
    records = []
    for page in pages:
        records.extend(json.loads(page)["data"])
    return records

api_pages = [
    '{"data": [{"id": 1, "customer": "asha", "amount": "1200.50", "ts": "2026-09-30T10:00:00Z", "status": "PAID"},'
    '          {"id": 2, "customer": "ravi", "amount": "850", "ts": "2026-09-30T10:05:00Z", "status": "paid"}]}',
    '{"data": [{"id": 3, "customer": "meera", "amount": null, "ts": "2026-09-30T11:00:00Z", "status": "cancelled"},'
    '          {"id": 2, "customer": "ravi", "amount": "850", "ts": "2026-09-30T10:05:00Z", "status": "paid"}]}',
]

# --- Transform ------------------------------------------------------------
def transform(records: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(records)
    return (
        df.drop_duplicates(subset="id")
        .assign(
            customer=lambda d: d["customer"].str.title(),
            amount=lambda d: pd.to_numeric(d["amount"], errors="coerce"),
            ts=lambda d: pd.to_datetime(d["ts"], utc=True),
            status=lambda d: d["status"].str.lower(),
            loaded_at=datetime.now(timezone.utc),
        )
        .rename(columns={"id": "order_id", "ts": "ordered_at"})
    )

# --- Load -----------------------------------------------------------------
def load(df: pd.DataFrame, con: duckdb.DuckDBPyConnection) -> None:
    con.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER PRIMARY KEY, customer VARCHAR, amount DECIMAL(12, 2),
            ordered_at TIMESTAMPTZ, status VARCHAR, loaded_at TIMESTAMPTZ
        )
    """)
    con.register("staging", df)
    # Upsert: re-running the pipeline never creates duplicates (idempotent)
    con.execute("INSERT OR REPLACE INTO orders SELECT order_id, customer, amount, ordered_at, status, loaded_at FROM staging")

con = duckdb.connect()
for run in (1, 2):                                     # run twice to prove idempotency
    load(transform(extract_orders(api_pages)), con)
print(con.sql("SELECT order_id, customer, amount, status FROM orders ORDER BY order_id").df())
print("rows:", con.sql("SELECT COUNT(*) FROM orders").fetchone()[0])
```

```text
   order_id customer  amount     status
0         1     Asha  1200.5       paid
1         2     Ravi   850.0       paid
2         3    Meera     NaN  cancelled
rows: 3
```

Running the pipeline twice still produces three rows — the load is **idempotent**.

## Practices that make pipelines reliable

### Idempotency

Retries, backfills and reruns happen constantly. Design every step so rerunning it doesn't duplicate or corrupt data:

- **Upsert/merge** on a business key instead of blind inserts.
- **Overwrite partitions** (e.g. replace all data for `2026-09-30`) rather than appending.
- Write to a temporary location, then atomically swap/rename.

### Retries with backoff for external calls

```python
import random
import time

def with_retries(func, attempts=4, base_delay=0.1):
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except ConnectionError:
            if attempt == attempts:
                raise
            sleep = base_delay * 2 ** (attempt - 1) + random.uniform(0, base_delay)
            print(f"attempt {attempt} failed, retrying in {sleep:.2f}s")
            time.sleep(sleep)

calls = {"n": 0}
def flaky_api():
    calls["n"] += 1
    if calls["n"] < 3:
        raise ConnectionError("503 Service Unavailable")
    return {"rows": 42}

print(with_retries(flaky_api))
```

```text
attempt 1 failed, retrying in 0.12s
attempt 2 failed, retrying in 0.24s
{'rows': 42}
```

### Stream large data instead of loading it all

Process API pages or file chunks with generators, writing batches as you go — memory stays flat regardless of volume.

### Configuration and secrets

Read connection strings and API keys from environment variables or a secrets manager; never hard-code them or commit them.

### Logging and metrics

Log structured information for every run: source, time window processed, rows extracted/loaded/rejected, duration. These become your pipeline's observability.

### Validate early

Check schemas and critical fields at extraction time, and quarantine bad records (with the reason) rather than failing the whole run — or failing silently.

### Testing

Keep transformations as pure functions (DataFrame in, DataFrame out) so they can be unit-tested with small fixtures in pytest.

## Useful Python libraries

| Need | Library |
| --- | --- |
| HTTP APIs | `httpx` / `requests` (+ `tenacity` for retries) |
| DataFrames | pandas, Polars |
| SQL on files/DataFrames | DuckDB |
| Databases | SQLAlchemy, psycopg, database-specific connectors |
| Cloud storage | boto3 (AWS), google-cloud-storage, azure-storage-blob, fsspec |
| Validation | Pydantic, pandera |
| Big data | PySpark |

## Try it yourself

Build a pipeline that extracts exchange rates from a public API (or a local JSON file), validates the response, transforms it into one row per currency per day, and upserts it into DuckDB. Run it twice for the same day and prove there are no duplicates; then simulate an API failure and show the retry logic working.
