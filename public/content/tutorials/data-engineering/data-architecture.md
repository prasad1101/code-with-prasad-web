Where data lives and how it flows determines what's possible, how fast and at what cost. This lesson covers the building blocks of modern data architecture.

## OLTP vs. OLAP

| | OLTP (operational) | OLAP (analytical) |
| --- | --- | --- |
| Purpose | Run the business: place orders, update accounts | Understand the business: reports, analysis |
| Queries | Many small reads/writes of individual rows | Few large scans and aggregations over millions of rows |
| Schema | Normalised | Denormalised (star schemas, wide tables) |
| Storage | Row-oriented | **Column-oriented** |
| Examples | PostgreSQL, MySQL, MongoDB | Snowflake, BigQuery, Redshift, ClickHouse, DuckDB |

Running heavy analytics directly on the production database slows the application — so data is copied into analytical systems.

### Why columnar storage is fast for analytics

A query like `SELECT SUM(amount) FROM orders WHERE order_date >= '2026-09-01'` needs only two columns. A columnar store reads just those columns (and skips blocks whose date range doesn't match), compressing each column efficiently because similar values sit together. A row store must read every column of every row.

## Data warehouse

A central, structured store of cleaned, integrated, modelled data, optimised for SQL analytics. Modern **cloud warehouses** separate storage from compute, scale automatically and charge by usage (Snowflake, BigQuery, Redshift, Azure Synapse/Fabric).

Strengths: fast SQL, strong governance, easy for analysts. Limitations: less suited to unstructured data (images, logs) and ML workloads that want raw files.

## Data lake

Cheap, scalable **object storage** (S3, GCS, Azure Data Lake Storage) holding raw data of any type in open file formats (Parquet, JSON, CSV, images). Compute engines (Spark, Trino, DuckDB) query the files.

Strengths: low cost, any data type, open formats. Risks: without discipline it becomes a "data swamp" — no schema enforcement, no transactions, hard to know what's trustworthy.

## Lakehouse

A **lakehouse** adds warehouse capabilities on top of lake storage using **open table formats** — Delta Lake, Apache Iceberg, Apache Hudi. They bring ACID transactions, schema enforcement and evolution, time travel and efficient updates to Parquet files on object storage. Databricks, Snowflake (Iceberg tables), BigQuery (BigLake) and others support this model. (Covered in depth in the expert chapter.)

## The medallion (multi-hop) architecture

A common way to organise a lake or lakehouse:

| Layer | Contains | Consumers |
| --- | --- | --- |
| **Bronze** (raw) | Data as ingested, append-only, with load metadata | Engineers, reprocessing |
| **Silver** (clean) | Deduplicated, typed, validated, conformed data | Engineers, data scientists |
| **Gold** (curated) | Business-level models: facts, dimensions, aggregates, metrics | Analysts, BI, applications |

Keeping bronze intact means you can always rebuild silver and gold when logic changes or bugs are found.

## Data mesh (organisational pattern)

In large organisations, a central data team becomes a bottleneck. **Data mesh** distributes ownership: domain teams (payments, logistics) own and publish their data as **products**, on a shared self-service platform with federated governance standards. It's an organisational approach as much as a technical one — useful at scale, overkill for small teams.

## Reference architecture

```text
 App DBs ──CDC──►┐
 SaaS APIs ─────►├──► Object storage (bronze) ──► Spark/dbt ──► Silver ──► Gold ──► BI / ML / APIs
 Event stream ──►┘         (Parquet / Iceberg / Delta)                 (warehouse or lakehouse)
                       Orchestration (Airflow) · Quality checks · Catalogue & access control
```

## Choosing an architecture

- **Small team, mostly structured data, SQL analytics** → a cloud warehouse with ELT (dbt) is usually simplest.
- **Large volumes, varied data, ML workloads, cost sensitivity** → a lakehouse on open formats.
- **Many autonomous domains** → consider data mesh principles on top of either.

Start simple; add components when a real need appears.

## Try it yourself

For a company with a PostgreSQL order database, a Salesforce CRM, website clickstream events (~50 million per day) and product images, sketch a data architecture: where each source lands, which layers you'd have, what goes into the warehouse vs. the lake, and how analysts and the ML team would access data.
