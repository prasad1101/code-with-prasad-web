Kafka stores and delivers events; **stream processing** engines transform them continuously — filtering, enriching, aggregating over time windows and joining streams — to power real-time dashboards, alerts, fraud detection and continuously updated tables. The leading engines are **Spark Structured Streaming** and **Apache Flink** (plus Kafka Streams and cloud services).

## Key concepts

- **Unbounded data** — the stream never ends; results are updated continuously.
- **Event time vs. processing time** — when an event *happened* vs. when it's *processed*. Mobile apps go offline, networks delay messages; correct results use event time.
- **Windows** — group events into time buckets:
  - **Tumbling**: fixed, non-overlapping (every 5 minutes).
  - **Sliding (hopping)**: fixed size, overlapping (last 10 minutes, every minute).
  - **Session**: grouped by gaps in activity.
- **Watermarks** — how long to wait for late events before finalising a window ("events up to 10 minutes late are included").
- **State** — aggregations and joins keep state between events; engines checkpoint it for fault tolerance.
- **Exactly-once results** — via checkpointing plus replayable sources and idempotent/transactional sinks.

## Spark Structured Streaming

Structured Streaming treats a stream as an **unbounded table**: you write the same DataFrame code as for batch, and Spark runs it incrementally.

A self-contained example using Spark's built-in `rate` source (which generates timestamped rows) and an in-memory sink:

```python
import time
from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.master("local[2]").appName("streaming").config("spark.sql.shuffle.partitions", "2").getOrCreate()
spark.sparkContext.setLogLevel("ERROR")

events = (
    spark.readStream.format("rate").option("rowsPerSecond", 20).load()        # columns: timestamp, value
    .withColumn("category", F.when(F.col("value") % 3 == 0, "books").otherwise("electronics"))
)

per_window = (
    events
    .withWatermark("timestamp", "10 seconds")                                  # tolerate events up to 10s late
    .groupBy(F.window("timestamp", "5 seconds"), "category")                  # tumbling 5-second windows
    .count()
)

query = (
    per_window.writeStream
    .outputMode("update")
    .format("memory")                        # for demos only; production sinks: Kafka, Delta/Iceberg, databases
    .queryName("category_counts")
    .trigger(processingTime="2 seconds")
    .start()
)

time.sleep(12)
rows = spark.sql("SELECT category, SUM(count) AS events FROM category_counts GROUP BY category ORDER BY category").collect()
print([(r["category"], r["events"] > 0) for r in rows])
query.stop()
spark.stop()
```

```text
[('books', True), ('electronics', True)]
```

Reading from Kafka in production looks like this:

```python
orders = (
    spark.readStream.format("kafka")
    .option("kafka.bootstrap.servers", "broker:9092")
    .option("subscribe", "orders")
    .option("startingOffsets", "latest")
    .load()
    .select(F.from_json(F.col("value").cast("string"), "order_id LONG, amount DOUBLE, ts TIMESTAMP, city STRING").alias("o"))
    .select("o.*")
)

(orders
    .withWatermark("ts", "15 minutes")
    .groupBy(F.window("ts", "1 minute"), "city")
    .agg(F.sum("amount").alias("revenue"))
    .writeStream
    .format("delta")                                   # or iceberg / kafka / foreachBatch to a database
    .outputMode("append")
    .option("checkpointLocation", "s3://lake/checkpoints/revenue_by_city")
    .start("s3://lake/gold/revenue_by_city_1m"))
```

The **checkpoint location** stores offsets and state so the query resumes exactly where it stopped after a failure or deployment.

### Output modes

- **append** — only finalised rows (for windowed aggregations, after the watermark passes).
- **update** — rows that changed in this trigger.
- **complete** — the entire result table each trigger (small aggregations only).

### `foreachBatch` for arbitrary sinks

`foreachBatch` gives you each micro-batch as a regular DataFrame — useful for MERGE/upserts into tables or databases, with the batch id available to make writes idempotent.

## Apache Flink

Flink is a true event-at-a-time streaming engine with very low latency, sophisticated state management and event-time semantics, widely used for large real-time systems (fraud detection, real-time pricing). **Flink SQL** makes it accessible:

```sql
SELECT window_start, city, SUM(amount) AS revenue
FROM TABLE(TUMBLE(TABLE orders, DESCRIPTOR(ts), INTERVAL '1' MINUTE))
GROUP BY window_start, window_end, city;
```

## Choosing an approach

| Need | Good fit |
| --- | --- |
| Near-real-time (seconds to minutes), team already on Spark/Databricks | Spark Structured Streaming |
| Very low latency, complex event-time logic, large stateful streaming | Flink |
| Simple per-event transformations inside a JVM microservice | Kafka Streams |
| Minimal operations | Managed services (Confluent/Flink SQL, Kinesis Data Analytics, Dataflow) |
| Minutes of latency are fine | Frequent **micro-batch** jobs (every 5–15 minutes) — simpler and cheaper |

Streaming adds operational complexity; choose it when low latency creates real business value.

## Common challenges

- **Late and out-of-order data** — watermarks and event-time windows.
- **Duplicates** — idempotent sinks, deduplication by event id with a bounded state window (`dropDuplicatesWithinWatermark`).
- **Schema changes** — schema registry and compatible evolution.
- **Backpressure and lag** — monitor consumer lag and processing rates; scale partitions and executors.
- **Reprocessing** — keep raw events (in Kafka with long retention or in the lake) so you can rebuild results after fixing bugs.

## Try it yourself

Using the `rate` source (or a local Kafka topic), build a streaming job that computes events per category in 10-second tumbling windows with a 20-second watermark, writes results with `foreachBatch` into DuckDB or Parquet, and restarts from its checkpoint without losing or duplicating results.
