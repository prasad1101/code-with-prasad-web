This final lesson brings the course together by designing a complete data platform — the kind of exercise you'd face in a senior data engineering interview or when starting a platform at a growing company.

## The scenario

**QuickCart**, an Indian quick-commerce company (10-minute grocery delivery), is growing fast:

- **Sources**: PostgreSQL order and inventory databases (~2 million orders/day at peak), a MongoDB catalogue, app clickstream events (~300 million/day), rider GPS pings (every 5 seconds from 20,000 riders), a payment gateway API, and a CRM (SaaS).
- **Needs**:
  - Finance: accurate daily revenue, refunds and settlements by city (next morning, reconciled).
  - Operations: live dashboard of order backlog and delivery times per dark store (under 1 minute latency).
  - Product: funnel and cohort analytics on app events (hourly is fine).
  - Data science: demand forecasting per store and SKU; ETA prediction models.
  - Compliance: customer data governed under India's DPDP Act.

## Step 1: Clarify requirements

Before drawing boxes, ask:

- **Latency** per use case (seconds vs. hourly vs. daily).
- **Volume and growth** (events/day, bytes/day, 3-year projection).
- **Correctness** requirements (finance needs exact, reconciled numbers; dashboards can tolerate small delays).
- **Team skills and size**, existing cloud, budget.
- **Retention and compliance** constraints.

## Step 2: Architecture

```text
                      ┌──────────────── Streaming path (seconds) ────────────────┐
 Orders/Inventory DB ─CDC (Debezium)─┐                                           │
 Rider GPS / App events ─────────────┼──► Kafka ──► Flink / Spark Streaming ──► real-time store (e.g. ClickHouse/Pinot) ──► ops dashboard
 Catalogue (MongoDB) ─CDC────────────┘      │
                                            ▼
 Payment API / CRM ─(batch ingestion)─► Object storage lakehouse (Iceberg/Delta)
                                        bronze ──► silver ──► gold (dbt / Spark)
                                                           │
                                          Warehouse SQL (BI, finance) · Feature tables (ML) · Reverse ETL (CRM)
      Orchestration: Airflow/Dagster · Quality: dbt tests + observability · Catalog + access policies (Unity/Polaris/Glue)
```

Key decisions:

- **CDC over batch extraction** from PostgreSQL and MongoDB — captures deletes and updates, low source load.
- **Kafka as the central event bus** — events land once and feed both streaming and batch consumers.
- **Lakehouse with an open table format** as the single source of truth — cheap storage for 300M events/day, ACID MERGE for CDC, time travel for audits, and access from SQL engines and ML.
- **A dedicated real-time OLAP store** for the operations dashboard — the lakehouse isn't designed for sub-second queries on constantly changing data.
- **dbt** for gold-layer models with tests and documentation; **Spark** for heavy event processing.

## Step 3: Data modelling

- **Silver**: deduplicated, typed events; current-state tables from CDC (orders, inventory); SCD Type 2 snapshots of stores, SKUs and riders.
- **Gold**:
  - `fct_order_lines` (grain: one row per order line) with `dim_customer`, `dim_sku`, `dim_store`, `dim_date`, `dim_time`.
  - `fct_deliveries` (accumulating snapshot: placed → picked → dispatched → delivered timestamps).
  - `fct_app_events` (partitioned by event date, clustered by user) and funnel/cohort marts.
  - Finance marts reconciled against payment settlements.
- A **semantic layer** defining revenue, GMV, net revenue, AOV and delivery SLA consistently for all tools.

## Step 4: Processing details

- **Idempotency everywhere**: MERGE on keys for CDC, partition overwrite for daily batches, deduplication by event id for streams.
- **Late data**: event-time processing with watermarks; daily finance jobs rerun the last 3 days to absorb late events.
- **Backfills**: every job parameterised by logical date.
- **Small files**: streaming writes compacted hourly; tables clustered on common filters.

## Step 5: Quality and observability

- Contracts and schema registry for event producers (app, riders).
- dbt tests on keys, relationships and accepted values; volume and freshness monitors on tier-1 tables.
- Finance reconciliation checks (warehouse revenue vs. gateway settlements within tolerance) that **block** publication.
- Dashboards showing freshness per dataset; alerts routed to owning teams.

## Step 6: Governance and security

- PII (phone, address, precise location) classified and tagged at ingestion; masked by default; tokenised identifiers for analytics.
- Role-based access by domain; row-level policies for city-level operations teams.
- Retention: raw GPS pings aggregated after 30 days, raw clickstream after 13 months, per policy.
- Deletion workflow for data-principal requests using lineage and table-format deletes.

## Step 7: Cost and scale

- Object storage + open formats keep storage cheap; hot data clustered, cold data tiered.
- Separate compute for streaming, batch ETL, BI and data science; auto-suspend and autoscaling.
- Cost dashboards per team; review the most expensive queries and jobs monthly.
- Plan for 10× growth: Kafka partitions, table partitioning and cluster autoscaling sized accordingly.

## Step 8: Team and delivery plan

1. **Month 1–2**: CDC + lakehouse bronze/silver for orders; finance gold mart with reconciliation — highest business value.
2. **Month 3**: Clickstream ingestion and product analytics marts.
3. **Month 4**: Real-time operations pipeline and dashboard.
4. **Month 5–6**: ML feature tables, governance automation, cost optimisation.

Deliver value incrementally; avoid building the entire platform before anyone uses it.

## Trade-offs to discuss (interview gold)

- **Warehouse-only vs. lakehouse** — simplicity vs. cost, openness and ML flexibility.
- **Streaming vs. micro-batch** — latency vs. complexity; most "real-time" needs are satisfied by 5-minute batches.
- **Build vs. buy** — managed ingestion (Fivetran/Airbyte) and managed Kafka/Flink reduce operational load at a price.
- **Centralised team vs. data mesh** — consistency vs. domain autonomy as the organisation grows.
- **Exactly-once vs. at-least-once + idempotency** — the latter is simpler and usually sufficient.

## Checklist for any data platform design

- [ ] Use cases with latency, volume and correctness requirements
- [ ] Ingestion method per source (CDC, API, events, files)
- [ ] Storage layers and table formats
- [ ] Processing engines for batch and streaming
- [ ] Data models with declared grains
- [ ] Orchestration, idempotency, backfills
- [ ] Quality checks, contracts and observability
- [ ] Governance, security and compliance
- [ ] Cost model and scaling plan
- [ ] Incremental delivery roadmap

## Try it yourself

Design a data platform for a hospital network with electronic health records, lab systems, IoT bed monitors and billing — including real-time patient alerts, daily operational reporting, research datasets with de-identification, and strict compliance. Present it with a diagram, key decisions and trade-offs, as you would in a 45-minute system design interview.
