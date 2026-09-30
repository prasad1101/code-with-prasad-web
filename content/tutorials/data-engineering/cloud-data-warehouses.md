Cloud data warehouses store and query analytical data at massive scale without managing servers. Knowing how they work internally — and how they bill — is essential to building fast, affordable data platforms.

## The major platforms

| Platform | Architecture highlights |
| --- | --- |
| **Snowflake** | Separate storage and compute; independent "virtual warehouses" (compute clusters) per workload; zero-copy cloning; time travel; runs on AWS, Azure and GCP |
| **Google BigQuery** | Serverless; pay per data scanned (on-demand) or reserved slots; storage/compute separated; tight GCP integration |
| **Amazon Redshift** | Provisioned clusters or Serverless; columnar MPP; integrates with S3 via Spectrum |
| **Azure Synapse / Microsoft Fabric** | SQL warehouse plus lake-centric OneLake in Fabric |
| **Databricks SQL** | Warehouse-style SQL on a lakehouse (Delta tables) |

All are **columnar, massively parallel (MPP)** engines that separate storage from compute to some degree, so you can scale each independently.

## How queries get fast (and cheap)

Performance and cost come down to **how much data a query reads**:

- **Select only needed columns** — columnar storage reads only those columns. `SELECT *` on a wide table can cost many times more.
- **Filter on partition/clustering columns** — the engine skips whole blocks (pruning):
  - BigQuery: **partitioned tables** (by date/timestamp or integer range) and **clustering** (up to four columns).
  - Snowflake: automatic **micro-partitions** with min/max metadata; optional **clustering keys** for very large tables.
  - Redshift: **sort keys** and **distribution styles** (how rows are spread across nodes for joins).
- **Pre-aggregate** frequently used results (aggregate tables, materialised views).
- **Avoid exploding joins** — check join keys and grain.

```sql
-- BigQuery: partitioned + clustered fact table
CREATE TABLE analytics.fct_events
PARTITION BY DATE(occurred_at)
CLUSTER BY customer_id, event_type AS
SELECT * FROM staging.events;

-- This scans only one day's partition, and clustering narrows blocks further
SELECT event_type, COUNT(*)
FROM analytics.fct_events
WHERE DATE(occurred_at) = '2026-09-30' AND customer_id = 42
GROUP BY event_type;
```

Always check the bytes scanned / query profile before scheduling a query.

## Cost management

| Lever | Practice |
| --- | --- |
| Compute sizing | Right-size warehouses/slots; separate ETL, BI and ad-hoc workloads |
| Auto-suspend | Suspend idle compute quickly (Snowflake: 60 seconds is common) |
| Query design | Column pruning, partition filters, incremental models |
| Storage | Lifecycle policies; avoid long time-travel retention where unneeded |
| Guardrails | Budgets, resource monitors, per-query byte limits, cost dashboards per team |
| Caching | Result caches return repeated queries instantly and free |

Cost surprises usually come from a few expensive queries run frequently — monitor the top queries by cost.

## Loading data

- **Bulk loads** from object storage: `COPY INTO` (Snowflake), `LOAD DATA` / external tables (BigQuery), `COPY` (Redshift) — load compressed Parquet files of sensible size.
- **Streaming ingestion** (Snowpipe, BigQuery Storage Write API, Redshift streaming ingestion) for near-real-time data.
- **External tables / lakehouse integration** to query Parquet/Iceberg in object storage without loading.

## Features that change how you work

- **Zero-copy cloning** (Snowflake) — clone a production database instantly for testing or development.
- **Time travel** — query or restore a table as it was hours or days ago; undo accidental deletes.
- **Data sharing** — share live tables with other accounts without copying.
- **Semi-structured data** — query JSON natively (`VARIANT` in Snowflake, `JSON`/`STRUCT` in BigQuery).
- **In-warehouse ML and AI functions** — train models or call LLM functions from SQL.

## Security essentials

- Role-based access control with least privilege; separate roles for ingestion, transformation, BI and admins.
- Column-level security and dynamic data masking for PII.
- Row-level security for multi-tenant or regional access.
- Network policies / private connectivity; SSO; audit logs.

## Warehouse or lakehouse?

Warehouses offer the simplest experience for SQL-centric analytics. Lakehouses (open table formats on object storage) offer open formats, lower storage cost and a single copy of data for SQL and ML. The line keeps blurring — warehouses now read and write Iceberg tables, and lakehouse platforms provide warehouse-grade SQL. Choose based on your team's skills, workloads and existing cloud.

## Try it yourself

Using BigQuery's free tier (or DuckDB locally as a stand-in), load a public dataset, create a date-partitioned and clustered copy, and compare bytes scanned (or run time) for the same filtered query on both tables. Then write a short cost-guardrail policy for your team.
