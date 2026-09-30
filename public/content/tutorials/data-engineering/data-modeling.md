Raw operational data is normalised for transactions, not for analysis. **Dimensional modelling** reshapes it into tables that are fast to query, easy to understand and consistent across reports. It's one of the most valuable — and most asked-about — data engineering skills.

## Facts and dimensions

- **Fact tables** record measurable business events: order lines, payments, page views. They contain **foreign keys** to dimensions and **numeric measures** (quantity, amount).
- **Dimension tables** describe the context of those events: customer, product, date, store. They contain descriptive attributes used for filtering and grouping.

## The star schema

```text
                 dim_date
                    │
dim_customer ── fact_order_lines ── dim_product
                    │
                 dim_store
```

```sql
CREATE TABLE dim_customer (
  customer_key   INTEGER PRIMARY KEY,     -- surrogate key
  customer_id    VARCHAR,                 -- natural key from the source system
  name           VARCHAR,
  city           VARCHAR,
  segment        VARCHAR
);

CREATE TABLE dim_product (
  product_key    INTEGER PRIMARY KEY,
  product_id     VARCHAR,
  name           VARCHAR,
  category       VARCHAR,
  brand          VARCHAR
);

CREATE TABLE dim_date (
  date_key       INTEGER PRIMARY KEY,     -- e.g. 20260930
  date           DATE,
  year INTEGER, quarter INTEGER, month INTEGER, month_name VARCHAR,
  day_of_week VARCHAR, is_weekend BOOLEAN, is_holiday BOOLEAN
);

CREATE TABLE fact_order_lines (
  order_id       VARCHAR,
  line_number    INTEGER,
  date_key       INTEGER REFERENCES dim_date(date_key),
  customer_key   INTEGER REFERENCES dim_customer(customer_key),
  product_key    INTEGER REFERENCES dim_product(product_key),
  quantity       INTEGER,
  unit_price     DECIMAL(12, 2),
  discount       DECIMAL(12, 2),
  net_amount     DECIMAL(12, 2)
);
```

Queries become simple joins from the fact to whichever dimensions a question needs:

```sql
SELECT d.month_name, p.category, SUM(f.net_amount) AS revenue
FROM fact_order_lines f
JOIN dim_date d ON d.date_key = f.date_key
JOIN dim_product p ON p.product_key = f.product_key
WHERE d.year = 2026
GROUP BY 1, 2;
```

A **snowflake schema** normalises dimensions further (product → category table). It saves a little space but adds joins; star schemas are usually preferred for analytics.

## Grain: the most important decision

The **grain** states exactly what one row in a fact table represents: "one row per order line", "one row per customer per day". Declare it first — every measure and dimension must be consistent with it. Mixing grains (order-level shipping fees on order-line rows) causes double counting.

## Types of fact tables

| Type | Grain | Example |
| --- | --- | --- |
| Transaction | One row per event | Order lines, payments |
| Periodic snapshot | One row per entity per period | Daily account balances, month-end inventory |
| Accumulating snapshot | One row per process instance, updated as it progresses | Order lifecycle: placed, packed, shipped, delivered timestamps |
| Factless | Events with no measures | Student attendance, product promotions coverage |

## Surrogate keys

Dimensions use **surrogate keys** (meaningless integers or hashes) rather than source-system ids because:

- sources can reuse or change their ids,
- several sources may describe the same entity,
- history tracking (below) needs several rows per natural key.

## Slowly changing dimensions (SCD)

Dimension attributes change: a customer moves from Pune to Mumbai. How should history be kept?

- **Type 1 — overwrite**: keep only the current value. Simple; history is lost (past orders now appear under Mumbai).
- **Type 2 — add a new row**: keep every version with validity dates. Past facts stay attached to the version valid at the time.
- **Type 3 — add a column** (`previous_city`): limited history.

### SCD Type 2 in practice

```python
import duckdb

con = duckdb.connect()
con.execute("""
    CREATE TABLE dim_customer (
        customer_key INTEGER, customer_id VARCHAR, city VARCHAR,
        valid_from DATE, valid_to DATE, is_current BOOLEAN
    )
""")
con.execute("""
    INSERT INTO dim_customer VALUES
        (1, 'C001', 'Pune',   DATE '2025-01-15', DATE '9999-12-31', true),
        (2, 'C002', 'Mumbai', DATE '2025-02-03', DATE '9999-12-31', true)
""")

# Today's snapshot from the source: C001 moved to Mumbai, C003 is new
con.execute("CREATE TABLE source_customers AS SELECT * FROM (VALUES ('C001', 'Mumbai'), ('C002', 'Mumbai'), ('C003', 'Delhi')) t(customer_id, city)")
load_date = "2026-09-30"

# 1. Expire current rows whose tracked attributes changed
con.execute(f"""
    UPDATE dim_customer d
    SET valid_to = DATE '{load_date}' - 1, is_current = false
    FROM source_customers s
    WHERE d.customer_id = s.customer_id AND d.is_current AND d.city <> s.city
""")

# 2. Insert new versions for changed customers and rows for new customers
con.execute(f"""
    INSERT INTO dim_customer
    SELECT (SELECT MAX(customer_key) FROM dim_customer) + ROW_NUMBER() OVER (ORDER BY s.customer_id),
           s.customer_id, s.city, DATE '{load_date}', DATE '9999-12-31', true
    FROM source_customers s
    LEFT JOIN dim_customer d ON d.customer_id = s.customer_id AND d.is_current
    WHERE d.customer_id IS NULL
""")

print(con.sql("SELECT * FROM dim_customer ORDER BY customer_id, valid_from").df())
```

```text
   customer_key customer_id    city valid_from   valid_to  is_current
0             1        C001    Pune 2025-01-15 2026-09-29       False
1             3        C001  Mumbai 2026-09-30 9999-12-31        True
2             2        C002  Mumbai 2025-02-03 9999-12-31        True
3             4        C003   Delhi 2026-09-30 9999-12-31        True
```

Facts loaded before 30 September keep pointing at key 1 (Pune); new facts use key 3 (Mumbai). To query "as of" a date: `WHERE date BETWEEN valid_from AND valid_to`. Tools like dbt **snapshots** automate this pattern.

## One Big Table (OBT) and semantic layers

Modern columnar warehouses handle wide, denormalised tables well, so some teams build **one big table** per use case (facts with dimension attributes pre-joined) for simplicity and dashboard speed. Many combine approaches: dimensional models as the governed core, wide marts on top, and a **semantic/metrics layer** (dbt Semantic Layer, LookML, Cube) so every tool computes "revenue" the same way.

## Try it yourself

Design a dimensional model for a ride-hailing company: define the grain of a trips fact table, its measures, the dimensions (rider, driver, vehicle, date, time of day, zones), which dimension attributes need SCD Type 2 (e.g. driver rating tier, vehicle type), and write the SQL for "revenue by city zone and hour of day last month".
