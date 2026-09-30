## What does a data engineer do?
Level: Beginner | Tags: basics

Designs, builds and operates the systems that move and prepare data: ingestion from sources (databases, APIs, events, files), storage (warehouses, lakes, lakehouses), transformation into trustworthy models, orchestration, data quality, and serving data to analytics, ML and applications — while handling scale, cost, security and governance.

## What is the difference between ETL and ELT?
Level: Beginner | Tags: etl, elt

- **ETL** transforms data in a separate engine before loading it into the target.
- **ELT** loads raw data first, then transforms it inside the warehouse/lakehouse (typically with SQL/dbt).

ELT is the modern default with scalable cloud warehouses: raw data is preserved (easy reprocessing), and transformations are version-controlled SQL. ETL still fits heavy processing or when sensitive data must be filtered before landing.

## Compare data warehouses, data lakes and lakehouses.
Level: Intermediate | Tags: architecture

- **Warehouse** — structured, modelled data optimised for SQL analytics; strong governance and performance; historically proprietary storage.
- **Lake** — cheap object storage for any data type in open formats; flexible but prone to becoming a "swamp" without transactions or schema enforcement.
- **Lakehouse** — open table formats (Delta, Iceberg, Hudi) on lake storage adding ACID transactions, schema evolution, time travel and MERGE — warehouse-like reliability with lake economics and openness, serving both BI and ML.

## What is the difference between OLTP and OLAP?
Level: Beginner | Tags: architecture

OLTP systems handle many small, concurrent reads and writes of individual rows for running the business (normalised, row-oriented: PostgreSQL, MySQL). OLAP systems handle large scans and aggregations for analysis (denormalised, columnar: Snowflake, BigQuery, ClickHouse). Data is replicated from OLTP to OLAP so analytics doesn't slow down production.

## Why are columnar formats like Parquet faster for analytics?
Level: Intermediate | Tags: file-formats

Queries read only the columns they need; values of the same type stored together compress very well (dictionary/run-length encoding); per-row-group min/max statistics enable predicate pushdown (skipping blocks that can't match); and the schema and types are stored in the file. The result: much less I/O than row formats like CSV/JSON, often 5–10× smaller files and far faster scans.

## What is a star schema? Explain facts and dimensions.
Level: Intermediate | Tags: data-modeling

A dimensional model with a central **fact table** of measurable events (order lines, payments) containing foreign keys and numeric measures, surrounded by **dimension tables** with descriptive attributes (customer, product, date, store). It's intuitive for analysts, efficient for aggregation queries, and consistent across reports. A snowflake schema normalises dimensions further, adding joins.

## What is the grain of a fact table and why does it matter?
Level: Intermediate | Tags: data-modeling

The grain defines exactly what one row represents ("one row per order line", "one row per store per day"). It must be declared first; every measure and dimension must be consistent with it. Mixing grains — e.g. storing an order-level shipping fee on order-line rows — causes double counting when summed.

## Explain Slowly Changing Dimensions (Types 1, 2 and 3).
Level: Intermediate | Tags: data-modeling, scd

How to handle changes to dimension attributes:

- **Type 1** — overwrite; no history (past facts show the new value).
- **Type 2** — add a new row per version with `valid_from`, `valid_to` and `is_current`, and surrogate keys; facts keep pointing to the version valid at the time. Most common for history.
- **Type 3** — keep a limited history in extra columns (`previous_city`).

dbt snapshots and lakehouse MERGE automate Type 2.

## What does idempotency mean in data pipelines and how do you achieve it?
Level: Intermediate | Tags: reliability

Running a pipeline (or a step) multiple times for the same input produces the same result — no duplicates or corruption — making retries and backfills safe. Techniques: MERGE/upsert on business keys, overwrite whole partitions for the processed interval, deduplicate by event id, write to staging then atomically swap, and parameterise jobs by logical date instead of "now".

## How do you implement incremental loads? What are the pitfalls?
Level: Intermediate | Tags: etl, incremental

Extract only new/changed rows using a **watermark** (max `updated_at` or an increasing id) stored in pipeline state, then MERGE into the target. Pitfalls: sources that don't update `updated_at` reliably, **hard deletes** being invisible, late-arriving updates with older timestamps (mitigate with an overlap window + idempotent merge), clock skew, and watermark updates committed before the load succeeds. Log-based **CDC** avoids most of these.

## What is Change Data Capture?
Level: Advanced | Tags: cdc

Capturing every insert, update and delete from a database by reading its transaction log (PostgreSQL WAL, MySQL binlog, MongoDB oplog) and streaming change events (e.g. Debezium → Kafka). Benefits: captures deletes, preserves commit order, low source load, near-real-time latency. Consumers apply events with MERGE (latest event per key, deletes handled explicitly) and often keep an append-only change log for history.

## What is Apache Airflow and what makes a good DAG?
Level: Intermediate | Tags: orchestration

Airflow schedules and orchestrates workflows defined as DAGs of tasks in Python, with retries, dependencies, backfills, alerting and a UI. Good DAGs: lightweight files (no heavy work at import), tasks that are atomic and idempotent, processing based on the run's logical date/interval, business logic in tested modules or SQL/dbt (the DAG only orchestrates), heavy compute pushed to the right engine, connections/secrets outside code, and data-aware scheduling (assets) where appropriate.

## How does Spark execute a job? What are transformations and actions?
Level: Intermediate | Tags: spark

The driver builds a logical plan from DataFrame transformations (lazy), Catalyst optimises it into a physical plan, and an **action** (`count`, `show`, `write`, `collect`) triggers execution. The job is split into **stages** at shuffle boundaries; each stage runs **tasks** (one per partition) on executors in parallel. Narrow transformations (filter, select) stay within partitions; wide ones (groupBy, join) require shuffles.

## What is a shuffle in Spark and how do you reduce its cost?
Level: Advanced | Tags: spark, performance

A shuffle redistributes data across the cluster so rows with the same key end up in the same partition — required by joins, aggregations, distinct and sorting. It involves disk and network I/O and is usually the most expensive part of a job. Reduce it by filtering and projecting early, broadcasting small tables in joins, pre-aggregating, avoiding unnecessary `distinct`/`orderBy`, tuning shuffle partitions (with AQE), and using bucketing/clustering for repeated joins on the same key.

## How do you handle data skew in Spark?
Level: Advanced | Tags: spark, performance

Skew — a few keys holding most rows — makes some tasks run far longer than others. Fixes: enable Adaptive Query Execution's skew-join handling; handle `NULL`/hot keys separately; broadcast the smaller side; **salt** the skewed key (add a random suffix on the large side and replicate the small side) to spread it across partitions; or pre-aggregate before joining. Diagnose via task-duration distribution in the Spark UI.

## Broadcast join vs. sort-merge join?
Level: Advanced | Tags: spark, joins

- **Broadcast hash join** — the small table is sent to every executor and joined locally; no shuffle of the large table. Best when one side is small (below the broadcast threshold).
- **Sort-merge join** — both sides are shuffled by key and sorted, then merged; scalable for two large tables.

Spark picks automatically from statistics (and AQE can switch at runtime); `broadcast()` hints help when stats are missing.

## What is Kafka and how do partitions and consumer groups work?
Level: Intermediate | Tags: kafka, streaming

Kafka is a distributed, durable, append-only event log. Topics are split into **partitions** — ordered logs that enable parallelism; events with the same key go to the same partition, preserving per-key order. A **consumer group** divides a topic's partitions among its members so each event is processed once per group; different groups independently consume all events. Offsets track progress, and retention keeps events for replay.

## Explain at-most-once, at-least-once and exactly-once delivery.
Level: Advanced | Tags: streaming

- **At-most-once** — commit offsets before processing; events may be lost.
- **At-least-once** — commit after processing; events may be processed twice after failures (most common).
- **Exactly-once** — each event affects results once, via idempotent producers, transactions (Kafka EOS) and transactional/idempotent sinks with checkpointing (Spark/Flink).

A practical approach: at-least-once delivery with idempotent processing (upserts, deduplication by event id).

## What are event time, processing time and watermarks?
Level: Advanced | Tags: stream-processing

**Event time** is when an event occurred; **processing time** is when the system handles it. They differ due to network delays and offline devices, so correct windowed aggregations use event time. A **watermark** is the engine's estimate of how far event time has progressed — it defines how long to wait for late events before finalising a window and discarding state. Larger watermarks capture more late data but increase latency and state size.

## How do you ensure data quality in pipelines?
Level: Intermediate | Tags: data-quality

Check completeness, uniqueness, validity, consistency, accuracy, freshness and volume at ingestion, after transformation and before publishing. Use tools like dbt tests, Great Expectations, Soda or pandera; classify checks as blocking (don't publish) or warning; monitor metrics for anomalies; enforce **data contracts** with producers (schema registry); quarantine bad records; and run an incident process with root-cause fixes and new checks.

## What is dbt and why is it popular?
Level: Intermediate | Tags: dbt

dbt turns SQL `SELECT` statements into managed models built in dependency order (`ref()`), with materialisations (view, table, incremental), tests, documentation, lineage, snapshots (SCD2), macros and environments. It brings software practices — version control, code review, CI, modularity — to analytics transformations, which is why it became the standard "T" in ELT.

## What are Delta Lake and Apache Iceberg?
Level: Advanced | Tags: lakehouse

Open table formats that add a metadata/transaction layer over Parquet files: ACID transactions, MERGE/UPDATE/DELETE, schema enforcement and evolution, time travel, and statistics for data skipping. Delta uses a transaction log (`_delta_log`), strongly integrated with Spark/Databricks; Iceberg uses metadata trees tracked by a catalog, with hidden partitioning and partition evolution, and broad multi-engine support. They enable reliable lakehouses readable by many engines.

## What is the small files problem and how do you fix it?
Level: Advanced | Tags: performance, storage

Many tiny files (from streaming writes, high-cardinality partitions or over-partitioned jobs) slow reads (per-file overhead, metadata listing) and strain metastores. Fixes: compaction jobs (`OPTIMIZE`, Iceberg rewrite data files), coalescing/repartitioning before writes, sensible partition keys (usually date, not ids), target file sizes of ~100 MB–1 GB, and auto-compaction features.

## How would you partition a large table?
Level: Intermediate | Tags: storage, partitioning

Partition by the column most queries filter on — usually a date/time at the right granularity (day or month) — so engines prune irrelevant partitions. Avoid high-cardinality keys (user id) that create millions of tiny partitions. Complement partitioning with clustering/sorting (Z-order, clustering keys, Iceberg sort orders) on other frequent filter columns. Consider hidden partitioning (Iceberg) and plan for partition evolution.

## What is data lineage and why does it matter?
Level: Intermediate | Tags: governance

Lineage records where data comes from and how it flows through transformations to tables, dashboards and models (ideally at column level). It enables impact analysis before changes, faster root-cause analysis during incidents, compliance (finding all copies of personal data), and trust in reported numbers. Catalogs and tools like dbt, OpenLineage, Unity Catalog and DataHub capture it.

## How do you protect PII in a data platform?
Level: Advanced | Tags: governance, security

Minimise collection; classify and tag sensitive columns at ingestion; apply column masking and row-level security via policies (ideally tag-based); tokenise or hash identifiers for analytics; encrypt at rest and in transit; restrict raw zones; enforce retention and deletion workflows (right to erasure) using lineage; audit access; and keep PII out of logs, test data and lower environments.

## Batch or streaming — how do you decide?
Level: Intermediate | Tags: architecture

Choose based on required latency and business value. Streaming is justified when decisions must happen in seconds (fraud, live operations, alerts, personalisation); it brings complexity (state, late data, exactly-once, operations). Many "real-time" needs are satisfied by frequent micro-batches (every 5–15 minutes) at much lower cost. Common architectures ingest events once (e.g. Kafka) and serve both streaming and batch consumers.

## How would you design a pipeline that ingests data from a REST API?
Level: Advanced | Tags: ingestion, design

- Authenticate with secrets from a vault; respect rate limits (throttling, backoff with jitter on 429/5xx).
- Paginate (cursor-based where available) and extract incrementally by `updated_since` with an overlap window.
- Validate responses against a schema; store raw JSON in bronze with load metadata (run id, extracted_at).
- Transform to typed silver tables with MERGE on the natural key (idempotent).
- Orchestrate by logical date with retries, timeouts and alerting; track row counts and freshness.
- Handle schema changes and deleted records (periodic full reconciliation if the API doesn't expose deletes).

## How do you design for cost efficiency on a cloud data platform?
Level: Expert | Tags: cost

Store data in compressed columnar/open formats with lifecycle tiers; process incrementally; prune with partitioning/clustering; avoid `SELECT *`; right-size and auto-suspend compute; separate workloads to control spend; use spot/preemptible instances for fault-tolerant batch jobs; cache and pre-aggregate hot queries; monitor top queries/jobs by cost with per-team attribution and budgets; and delete or archive unused tables and data past retention.

## Walk through how you would design a data platform for a fast-growing e-commerce company.
Level: Expert | Tags: system-design

Clarify use cases and latency/correctness needs → ingestion (CDC from operational DBs, events via Kafka, APIs via managed connectors) → lakehouse storage with bronze/silver/gold layers on an open table format → processing (dbt for SQL models, Spark for heavy event data, stream processing for the few real-time needs) → dimensional gold models with declared grains and a semantic layer → orchestration with idempotent, backfillable jobs → quality checks, contracts and observability → governance (catalog, lineage, PII policies, retention) → cost controls and a scaling plan → incremental delivery starting with the highest-value domain. Discuss trade-offs (warehouse vs. lakehouse, streaming vs. micro-batch, build vs. buy, centralised vs. mesh).
