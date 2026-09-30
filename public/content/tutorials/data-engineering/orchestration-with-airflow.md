Real platforms run hundreds of dependent jobs: extract from ten sources, then transform, then run quality checks, then refresh dashboards — every hour, with retries, alerts and backfills. An **orchestrator** schedules and coordinates these workflows. **Apache Airflow** is the most widely used.

## Core concepts

- **DAG** (directed acyclic graph) — a workflow: tasks and the dependencies between them.
- **Task** — one unit of work (run a Python function, a SQL query, a Spark job, a dbt command).
- **Schedule** — when the DAG runs (cron expression, preset, or triggered by data updates).
- **Run / logical date** — each run processes a specific data interval, which enables backfills.
- **Scheduler, executor, workers** — the components that decide what runs and execute it.

## A DAG with the TaskFlow API

```python
# dags/daily_orders.py
from datetime import datetime, timedelta

from airflow.sdk import dag, task


@dag(
    schedule="@daily",
    start_date=datetime(2026, 9, 1),
    catchup=False,
    default_args={"retries": 3, "retry_delay": timedelta(minutes=5)},
    tags=["orders"],
)
def daily_orders():
    @task
    def extract(ds: str | None = None) -> list[dict]:
        # `ds` is the logical date (YYYY-MM-DD) of this run — process exactly that day
        print(f"Extracting orders for {ds}")
        return [{"order_id": 1, "amount": 1200.0}, {"order_id": 2, "amount": 850.0}]

    @task
    def transform(rows: list[dict]) -> list[dict]:
        return [r | {"amount_with_gst": round(r["amount"] * 1.18, 2)} for r in rows]

    @task
    def validate(rows: list[dict]) -> list[dict]:
        if not rows:
            raise ValueError("No orders extracted — failing the run")
        return rows

    @task
    def load(rows: list[dict]) -> None:
        print(f"Loading {len(rows)} rows")

    load(validate(transform(extract())))


daily_orders()
```

Calling tasks like functions defines dependencies and passes small results between them (via XCom). For large data, pass **references** (a file path or table name), not the data itself.

## Operators for common work

Besides Python tasks, providers offer operators for databases, cloud services and tools:

```python
from airflow.providers.common.sql.operators.sql import SQLExecuteQueryOperator

refresh_mart = SQLExecuteQueryOperator(
    task_id="refresh_sales_mart",
    conn_id="warehouse",
    sql="CALL refresh_sales_mart('{{ ds }}')",   # templated with the run's logical date
)
```

Connections (credentials) are stored in Airflow's connection store or a secrets backend — never in DAG code.

## Scheduling

| Schedule | Meaning |
| --- | --- |
| `"@hourly"`, `"@daily"`, `"@weekly"` | Presets |
| `"0 2 * * *"` | Cron: 02:00 every day |
| `None` | Only when triggered manually or by the API |
| Assets (data-aware) | Run when an upstream DAG updates a dataset |

Data-aware scheduling decouples pipelines: a transformation DAG runs whenever the ingestion DAG produces fresh data, rather than guessing a time.

```python
from datetime import datetime

from airflow.sdk import Asset, dag, task

raw_orders = Asset("s3://lake/raw/orders")

@dag(schedule="@hourly", start_date=datetime(2026, 9, 1), catchup=False)
def ingest_orders():
    @task(outlets=[raw_orders])
    def land_files() -> None: ...
    land_files()

@dag(schedule=[raw_orders], start_date=datetime(2026, 9, 1), catchup=False)
def build_order_models():
    @task
    def run_dbt() -> None: ...
    run_dbt()

ingest_orders()          # calling the decorated function registers the DAG
build_order_models()
```

## Backfills and idempotency

Because each run processes its own **logical interval**, you can reprocess history: `airflow backfill create --dag-id daily_orders --from-date 2026-09-01 --to-date 2026-09-30` (see the Airflow CLI docs for your version). This only works safely if every task is **idempotent** and uses the logical date — never `datetime.now()` — to decide what to process.

## Reliability features

- **Retries** with delay for transient failures.
- **Timeouts** (`execution_timeout`) so hung tasks don't block the pipeline.
- **SLAs / deadline alerts** and **failure callbacks** to notify on-call (Slack, email, PagerDuty).
- **Pools** to limit concurrency against fragile systems (e.g. max 3 tasks hitting an API).
- **Sensors / deferrable operators** to wait for external conditions efficiently.

## Best practices

- Keep DAG files **lightweight**: no heavy computation or network calls at import time (the scheduler parses them constantly).
- Put business logic in tested Python packages or SQL/dbt; the DAG only orchestrates.
- Make tasks **atomic** (one clear responsibility) and **idempotent**.
- Push heavy processing to the right engine (warehouse, Spark) rather than Airflow workers.
- Test DAGs in CI: they load without errors, have no cycles, and have expected tasks.

## Alternatives

- **Dagster** — asset-centric orchestration with strong typing, testing and lineage.
- **Prefect** — Pythonic flows with a lightweight developer experience.
- **Cloud-native** — AWS Step Functions, Azure Data Factory, Google Cloud Composer (managed Airflow).

## Try it yourself

Write a DAG that runs daily: extract a day's orders to a Parquet file (path includes the logical date), validate row counts, load them idempotently into DuckDB, and publish an asset that triggers a second DAG building a daily revenue table. Test that both DAGs import cleanly.
