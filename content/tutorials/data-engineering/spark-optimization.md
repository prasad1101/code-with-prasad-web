Spark jobs that take hours often need only a few changes to run in minutes. Most performance problems come from **shuffles**, **skew**, **too many or too few partitions**, and **reading more data than necessary**. This lesson shows how to diagnose and fix them.

## Narrow vs. wide transformations

- **Narrow** transformations (`filter`, `select`, `withColumn`) work within each partition — no data movement.
- **Wide** transformations (`groupBy`, `join`, `distinct`, `orderBy`, window functions) need a **shuffle**: rows with the same key are sent across the network to the same partition. Shuffles are the most expensive operation in Spark.

Jobs are split into **stages** at shuffle boundaries. The **Spark UI** (port 4040 locally) shows stages, task durations, shuffle sizes and spills — always start there.

## Read less data

- Store data as **Parquet/Delta/Iceberg**, not CSV/JSON.
- **Select only needed columns** early — columnar formats then skip the rest.
- **Filter on partition columns** so whole directories are skipped (partition pruning), and on other columns so Parquet row groups are skipped (predicate pushdown).

Check the physical plan with `explain()`:

```python
from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.master("local[2]").appName("plan").getOrCreate()
spark.sparkContext.setLogLevel("ERROR")

df = spark.range(1_000).withColumn("day", (F.col("id") % 3).cast("string")).withColumn("amount", F.col("id") * 10)
df.write.mode("overwrite").partitionBy("day").parquet("/tmp/cwp_spark_events")

events = spark.read.parquet("/tmp/cwp_spark_events")
query = events.filter((F.col("day") == "1") & (F.col("amount") > 500)).select("id", "amount")
plan = query._jdf.queryExecution().executedPlan().toString()
print("PartitionFilters" in plan, "PushedFilters" in plan)
print(query.count())
spark.stop()
```

```text
True True
316
```

`PartitionFilters` in the plan confirm that only the `day=1` directory is read; `PushedFilters` show the amount filter pushed down into the Parquet reader.

## Joins

Spark chooses a join strategy based on table sizes:

- **Broadcast hash join** — the small table is copied to every executor; no shuffle of the large table. Ideal when one side is small (a dimension table under tens to hundreds of MB).
- **Sort-merge join** — both sides are shuffled and sorted by the key; used for two large tables.

```python
from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.master("local[2]").appName("joins").getOrCreate()
spark.sparkContext.setLogLevel("ERROR")

facts = spark.range(100_000).withColumn("country_id", F.col("id") % 5)
countries = spark.createDataFrame([(i, f"C{i}") for i in range(5)], ["country_id", "name"])

joined = facts.join(F.broadcast(countries), "country_id")      # explicit broadcast hint
plan = joined._jdf.queryExecution().executedPlan().toString()
print("BroadcastHashJoin" in plan)
print(joined.groupBy("name").count().orderBy("name").collect()[0])
spark.stop()
```

```text
True
Row(name='C0', count=20000)
```

Spark broadcasts automatically below `spark.sql.autoBroadcastJoinThreshold`; the hint helps when statistics are missing.

## Adaptive Query Execution (AQE)

AQE (on by default in Spark 3.2+) re-optimises queries at runtime using actual statistics from completed stages:

- **Coalesces** many small shuffle partitions into fewer, larger ones.
- **Switches** sort-merge joins to broadcast joins when one side turns out to be small.
- **Splits skewed partitions** in joins.

Keep it enabled (`spark.sql.adaptive.enabled=true`) — it fixes many problems automatically.

## Partitioning

- `spark.sql.shuffle.partitions` (default 200) sets the partition count after shuffles. Too few → huge tasks and memory spills; too many → scheduling overhead and tiny files. With AQE coalescing, a higher starting number is usually fine.
- `repartition(n, "col")` redistributes data with a full shuffle (e.g. before writing, to control file counts per partition).
- `coalesce(n)` reduces partitions **without** a full shuffle — cheaper for shrinking before a write.

Aim for tasks processing roughly 100–200 MB each.

## Data skew

When one key has far more rows than others (a single huge customer, `NULL` keys), one task runs for hours while the rest finish in seconds. Symptoms in the Spark UI: one or two tasks much slower than the median.

Fixes:

1. Let **AQE skew join handling** split skewed partitions.
2. **Filter or handle nulls** separately before joining.
3. **Salting** — add a random suffix to the skewed key on the large side and replicate the small side across the suffixes, spreading the hot key over several partitions.
4. Broadcast the smaller side if possible.

## Caching

`df.cache()` / `persist()` keeps a DataFrame in memory for reuse across several actions. Use it only when a result is reused multiple times and is expensive to recompute — and `unpersist()` afterwards. Caching everything wastes memory and can slow jobs down.

## Avoid

- **Python UDFs** where built-in functions exist (JVM ↔ Python serialisation overhead). Prefer built-ins or pandas UDFs.
- **`collect()`** on large DataFrames — it pulls all data to the driver and can crash it.
- **Many small output files** — compact with `repartition`/`coalesce` before writing, or use table-format compaction (`OPTIMIZE`).
- **`count()` for logging in the middle of pipelines** — every action re-executes the plan unless cached.

## Cluster and memory tuning

Right-size executors (cores and memory per executor), enable dynamic allocation for variable workloads, and watch for **spill to disk** and **garbage-collection time** in the Spark UI. Managed platforms (Databricks, EMR Serverless, Dataproc Serverless) handle much of this automatically.

## A tuning checklist

- [ ] Columnar formats; column pruning; partition and predicate pushdown confirmed in `explain()`
- [ ] Broadcast joins for small dimensions
- [ ] AQE enabled; shuffle partitions sensible
- [ ] Skew identified and handled
- [ ] No unnecessary UDFs, `collect()` or caching
- [ ] Output files well-sized; tables compacted

## Try it yourself

Create a skewed dataset (80% of rows share one key) and join it with a dimension table. Observe task durations in the Spark UI, then fix the skew with AQE, then with salting, and compare run times.
