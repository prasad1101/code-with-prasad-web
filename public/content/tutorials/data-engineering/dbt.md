**dbt** (data build tool) brings software engineering practices to SQL transformations. You write `SELECT` statements as **models**; dbt builds them in dependency order as tables or views in your warehouse, and adds testing, documentation, lineage and environments. It's the standard tool for the "T" in ELT.

## Project structure

```text
analytics/
  dbt_project.yml
  models/
    staging/                 # 1:1 with sources: rename, cast, clean
      _sources.yml
      stg_orders.sql
      stg_customers.sql
    intermediate/            # joins and business logic building blocks
      int_order_totals.sql
    marts/                   # business-facing facts and dimensions
      fct_orders.sql
      dim_customers.sql
      _marts.yml             # tests and documentation
  snapshots/
  tests/
  macros/
```

## Sources and staging models

```yaml
# models/staging/_sources.yml
sources:
  - name: shop
    schema: raw_shop
    tables:
      - name: orders
        loaded_at_field: _loaded_at
        freshness:
          warn_after: { count: 2, period: hour }
          error_after: { count: 6, period: hour }
      - name: customers
```

```sql
-- models/staging/stg_orders.sql
select
    id::integer                 as order_id,
    customer_id::integer        as customer_id,
    lower(status)               as status,
    amount::numeric(12, 2)      as amount,
    created_at::timestamp       as ordered_at
from {{ source('shop', 'orders') }}
where id is not null
```

Staging models do light cleanup only — one per source table — so every downstream model starts from consistent names and types.

## Building on other models with `ref`

```sql
-- models/marts/fct_orders.sql
{{ config(materialized='table') }}

with orders as (
    select * from {{ ref('stg_orders') }}
),
customers as (
    select * from {{ ref('stg_customers') }}
)

select
    o.order_id,
    o.customer_id,
    c.city,
    o.status,
    o.amount,
    o.ordered_at,
    date_trunc('day', o.ordered_at) as order_date
from orders o
left join customers c using (customer_id)
where o.status <> 'cancelled'
```

`ref()` tells dbt about dependencies, so it builds `stg_orders` and `stg_customers` before `fct_orders`, and draws the lineage graph automatically. It also resolves to the right schema per environment (dev vs. prod).

## Materialisations

| Materialisation | Behaviour | Use for |
| --- | --- | --- |
| `view` | Created as a view; no data stored | Staging models, cheap logic |
| `table` | Rebuilt fully each run | Marts of moderate size |
| `incremental` | Only new/changed rows processed | Large fact tables |
| `ephemeral` | Inlined as a CTE | Small reusable snippets |

### Incremental models

```sql
-- models/marts/fct_events.sql
{{ config(materialized='incremental', unique_key='event_id', incremental_strategy='merge') }}

select event_id, user_id, event_type, occurred_at
from {{ ref('stg_events') }}

{% if is_incremental() %}
  -- only process rows newer than what's already in the target table (with a small overlap)
  where occurred_at > (select max(occurred_at) - interval '1 hour' from {{ this }})
{% endif %}
```

## Tests

```yaml
# models/marts/_marts.yml
models:
  - name: fct_orders
    description: "One row per non-cancelled order."
    columns:
      - name: order_id
        description: "Primary key."
        data_tests:
          - unique
          - not_null
      - name: status
        data_tests:
          - accepted_values:
              arguments:
                values: ['placed', 'paid', 'shipped']
      - name: customer_id
        data_tests:
          - relationships:
              arguments:
                to: ref('dim_customers')
                field: customer_id
```

(Recent dbt versions call these `data_tests` and expect test parameters under `arguments:`; older projects use `tests:` with parameters directly under the test name.)

Custom tests are SQL files that return failing rows:

```sql
-- tests/assert_order_amount_positive.sql
select * from {{ ref('fct_orders') }} where amount <= 0
```

## Running dbt

```bash
dbt run                        # build models
dbt test                       # run tests
dbt build                      # run + test (+ snapshots, seeds) in dependency order
dbt build --select fct_orders+ # a model and everything downstream of it
dbt source freshness           # check source freshness
dbt docs generate && dbt docs serve   # documentation site with lineage graph
```

In production, an orchestrator (Airflow, Dagster, dbt Cloud) runs `dbt build` on a schedule or when sources update, and CI runs it on every pull request against a temporary schema.

## Snapshots: SCD Type 2 for free

```sql
-- snapshots/customers_snapshot.sql
{% snapshot customers_snapshot %}
{{ config(target_schema='snapshots', unique_key='customer_id', strategy='check', check_cols=['city', 'segment']) }}
select * from {{ source('shop', 'customers') }}
{% endsnapshot %}
```

Each run records changes with `dbt_valid_from` / `dbt_valid_to` columns — the SCD Type 2 pattern from the data modelling lesson, maintained automatically.

## Macros and packages

Jinja macros remove repetition (e.g. a `cents_to_rupees(column)` macro), and packages like `dbt_utils` and `dbt_expectations` add ready-made macros and tests.

## Best practices

- Layers: **staging → intermediate → marts**, with clear naming (`stg_`, `int_`, `fct_`, `dim_`).
- Every model has a declared **grain**, a primary key test and a description.
- Keep business logic in one place (marts), not repeated in dashboards.
- Use incremental models only when full rebuilds are too slow — they add complexity.
- Code review, CI and environments for every change — treat analytics code like application code.

## Try it yourself

With dbt and DuckDB (`dbt-duckdb` adapter), build a small project from CSV seed files: staging models for orders and customers, a `fct_orders` mart, a `dim_customers` model with a snapshot, tests for uniqueness, nulls, accepted values and relationships, and generate the docs site to explore the lineage graph.
