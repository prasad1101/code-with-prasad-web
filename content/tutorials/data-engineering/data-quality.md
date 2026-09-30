A pipeline that runs successfully but produces wrong numbers is worse than one that fails — people make decisions on bad data without knowing it. **Data quality** engineering catches problems before they reach dashboards, and makes them visible when they happen.

## Dimensions of data quality

| Dimension | Question | Example check |
| --- | --- | --- |
| Completeness | Is anything missing? | No nulls in `order_id`; yesterday's partition exists |
| Uniqueness | Are there duplicates? | `order_id` is unique |
| Validity | Do values follow rules? | `amount > 0`, `status` in allowed set, valid emails |
| Consistency | Do related data agree? | Every order's `customer_id` exists in customers |
| Accuracy | Does it match reality? | Revenue reconciles with the payment provider |
| Freshness | Is it up to date? | Latest record is less than 2 hours old |
| Volume | Is the amount plausible? | Today's rows within ±30% of the 4-week average |

## Writing checks

Checks are just queries that should return nothing (or a number within bounds). A small check runner:

```python
import duckdb
import pandas as pd

con = duckdb.connect()
con.register("orders", pd.DataFrame({
    "order_id": [1, 2, 2, 4, 5],
    "customer_id": [10, 11, 11, 99, 12],
    "status": ["paid", "paid", "paid", "refunded?", "shipped"],
    "amount": [1200.0, 850.0, 850.0, -40.0, None],
}))
con.register("customers", pd.DataFrame({"customer_id": [10, 11, 12]}))

CHECKS = {
    "order_id is unique": "SELECT order_id FROM orders GROUP BY order_id HAVING COUNT(*) > 1",
    "amount is not null": "SELECT * FROM orders WHERE amount IS NULL",
    "amount is positive": "SELECT * FROM orders WHERE amount <= 0",
    "status is valid": "SELECT * FROM orders WHERE status NOT IN ('placed', 'paid', 'shipped', 'cancelled')",
    "customer exists": "SELECT o.* FROM orders o LEFT JOIN customers c USING (customer_id) WHERE c.customer_id IS NULL",
}

failures = 0
for name, sql in CHECKS.items():
    bad = con.execute(f"SELECT COUNT(*) FROM ({sql})").fetchone()[0]
    print(f"{'PASS' if bad == 0 else 'FAIL'}  {name}" + (f"  ({bad} rows)" if bad else ""))
    failures += bad > 0
print(f"{failures} of {len(CHECKS)} checks failed")
```

```text
FAIL  order_id is unique  (1 rows)
FAIL  amount is not null  (1 rows)
FAIL  amount is positive  (1 rows)
FAIL  status is valid  (1 rows)
FAIL  customer exists  (1 rows)
5 of 5 checks failed
```

## Where to check

- **At ingestion** — schema matches expectations, required fields present, row counts non-zero. Quarantine bad records instead of dropping them silently.
- **After transformation** — uniqueness of keys, referential integrity, business rules, no unexpected nulls from joins.
- **Before publishing** — reconciliation against source totals; volume and freshness.

## Blocking vs. warning

Not every failure should stop the pipeline:

- **Blocking (error)** — primary key duplicates, missing partitions, broken joins: stop and don't publish (keep yesterday's good data).
- **Warning** — small percentages of invalid optional fields: publish, alert and track.

Define **thresholds** — "fail if more than 1% of emails are invalid" — rather than zero-tolerance everywhere.

## Anomaly detection on metrics

Static rules miss unexpected changes. Track metrics per run (row counts, null rates, sums) and alert when they deviate from recent history:

```python
import pandas as pd

history = pd.Series([10_120, 9_980, 10_340, 10_050, 9_870, 10_210, 10_160])   # daily row counts
today = 6_450
mean, std = history.mean(), history.std()
z = (today - mean) / std
print(f"expected ~{mean:,.0f} ± {2 * std:,.0f}; today {today:,} (z = {z:.1f})")
print("ALERT: volume anomaly" if abs(z) > 3 else "ok")
```

```text
expected ~10,104 ± 309; today 6,450 (z = -23.6)
ALERT: volume anomaly
```

Account for seasonality (weekends, month-end) by comparing with the same weekday or using rolling baselines.

## Tools

| Tool | Approach |
| --- | --- |
| **dbt tests** | `unique`, `not_null`, `accepted_values`, `relationships` and custom SQL tests on models (next lesson) |
| **Great Expectations / GX** | Declarative "expectations" suites with data docs |
| **Soda** | Checks written in a YAML-based language (SodaCL) |
| **pandera** | Schema validation for pandas/Polars DataFrames in Python pipelines |
| **Data observability platforms** (Monte Carlo, Elementary, etc.) | Automated freshness, volume, schema and distribution monitoring with lineage |

## Data contracts

A **data contract** is an agreement between a data producer (e.g. the orders service team) and consumers: schema, semantics, freshness and quality guarantees, and how changes are communicated. Enforcing contracts at the source — for example validating events against a schema registry — stops breaking changes before they enter the pipeline.

## Incident process

When bad data slips through:

1. **Detect** (alert) and **communicate** — tell consumers which dashboards are affected.
2. **Contain** — pause downstream jobs; roll back to the last good version (table formats with time travel make this easy).
3. **Fix** the root cause and **backfill**.
4. **Add a check** so the same problem is caught automatically next time.

## Try it yourself

Write a quality-check module for an orders pipeline with at least eight checks across completeness, uniqueness, validity, consistency, freshness and volume. Classify each as blocking or warning, store results in a `dq_results` table per run, and make the pipeline refuse to publish when a blocking check fails.
