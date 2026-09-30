**Data engineering** is the discipline of building the systems that collect, store, transform and serve data reliably — so that analysts, data scientists, applications and machine-learning models can use it. If data analysts answer questions with data, data engineers make sure the right data is there, correct, on time and at scale.

## What data engineers build

- **Ingestion** — moving data from sources (application databases, APIs, event streams, files, SaaS tools) into a central platform.
- **Storage** — data warehouses, data lakes and lakehouses, organised and cost-efficient.
- **Transformation** — cleaning, joining and modelling raw data into trustworthy tables (facts, dimensions, metrics).
- **Orchestration** — scheduling and coordinating pipelines, with retries and alerting.
- **Data quality** — tests, monitoring and contracts that catch bad data before it reaches dashboards.
- **Serving** — making data available to BI tools, APIs, ML features and reverse-ETL into business tools.
- **Governance** — security, privacy, access control, lineage and documentation.

## The data engineering lifecycle

```text
 Sources ──► Ingestion ──► Storage ──► Transformation ──► Serving ──► Analytics / ML / Apps
 (DBs, APIs,   (batch or     (lake,       (SQL, Spark,      (BI, APIs,
  events,       streaming)    warehouse)   dbt)              reverse ETL)
  files)
            └───────────── orchestration · quality · security · observability ─────────────┘
```

## Batch vs. streaming

| | Batch | Streaming |
| --- | --- | --- |
| Data processed | In chunks on a schedule (hourly, daily) | Continuously, event by event |
| Latency | Minutes to hours | Seconds or less |
| Complexity | Lower | Higher |
| Typical uses | Reporting, finance, ML training | Fraud detection, live dashboards, alerts, personalisation |

Most platforms are batch-first, adding streaming where low latency genuinely creates value.

## Core skills and tools

| Area | Tools |
| --- | --- |
| Languages | **SQL** (most important), **Python** |
| Storage & compute | PostgreSQL/MySQL (sources), Snowflake, BigQuery, Redshift, Databricks, object storage (S3, GCS, ADLS) |
| Processing | pandas/Polars/DuckDB (small–medium), **Apache Spark** (large), Flink (streaming) |
| Transformation | **dbt** |
| Orchestration | **Apache Airflow**, Dagster, Prefect |
| Streaming | **Apache Kafka**, cloud equivalents (Kinesis, Pub/Sub, Event Hubs) |
| Table formats | Delta Lake, Apache Iceberg, Hudi |
| Infrastructure | Docker, Kubernetes, Terraform, CI/CD, cloud platforms (AWS, GCP, Azure) |

## Principles you'll see throughout this course

- **Idempotency** — running a pipeline twice produces the same result (no duplicates), so retries are safe.
- **Immutability of raw data** — keep the original data; rebuild derived tables from it when logic changes.
- **Incremental processing** — process only new or changed data where possible.
- **Data as a product** — well-documented, tested, owned datasets with clear contracts.
- **Observability** — know when data is late, wrong or missing before your users do.

## Prerequisites

Comfortable SQL (see the SQL course) and Python (see the Python course, including files and generators), plus basic command-line skills. The Data Analytics course is helpful context for how data is consumed.

## Try it yourself

Pick an app you know (a food-delivery or ride-sharing app). List five data sources it has, three questions the business would ask, and sketch a pipeline: which data would be ingested in batch vs. streaming, where it would be stored, and which tables analysts would query.
