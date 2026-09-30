When data outgrows a single machine — hundreds of gigabytes to petabytes — **Apache Spark** distributes processing across a cluster. It's the most widely used engine for large-scale batch processing, and runs on Databricks, AWS EMR/Glue, Google Dataproc, Azure Synapse/Fabric and Kubernetes.

## How Spark works

- A **driver** program plans the work; **executors** on worker nodes process data in parallel.
- Data is split into **partitions**; each task processes one partition.
- You describe transformations on **DataFrames**; Spark builds an optimised plan (the **Catalyst** optimiser) and only executes when an **action** requests a result (**lazy evaluation**).

## Starting a session

```python
from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .master("local[*]")            # use all local cores; on a cluster this is set by the platform
    .appName("orders-etl")
    .getOrCreate()
)
```

(On Databricks and managed platforms, `spark` is created for you.)

## DataFrame basics

```python
from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.master("local[2]").appName("demo").getOrCreate()
spark.sparkContext.setLogLevel("ERROR")

orders = spark.createDataFrame(
    [
        (1, "Asha", "Pune", "electronics", 3499.0, "2026-09-01"),
        (2, "Ravi", "Mumbai", "books", 899.0, "2026-09-01"),
        (3, "Asha", "Pune", "books", 240.0, "2026-09-02"),
        (4, "Meera", "Bengaluru", "electronics", 1899.0, "2026-09-02"),
        (5, "Ravi", "Mumbai", "electronics", 799.0, "2026-09-03"),
    ],
    ["order_id", "customer", "city", "category", "amount", "order_date"],
)

orders.printSchema()

result = (
    orders
    .withColumn("order_date", F.to_date("order_date"))
    .withColumn("amount_with_gst", F.round(F.col("amount") * 1.18, 2))
    .filter(F.col("amount") > 500)
    .groupBy("city")
    .agg(F.count("*").alias("orders"), F.round(F.sum("amount_with_gst"), 2).alias("revenue"))
    .orderBy(F.desc("revenue"))
)
result.show()
spark.stop()
```

```text
root
 |-- order_id: long (nullable = true)
 |-- customer: string (nullable = true)
 |-- city: string (nullable = true)
 |-- category: string (nullable = true)
 |-- amount: double (nullable = true)
 |-- order_date: string (nullable = true)

+---------+------+-------+
|     city|orders|revenue|
+---------+------+-------+
|     Pune|     1|4128.82|
|Bengaluru|     1|2240.82|
|   Mumbai|     2|2003.64|
+---------+------+-------+
```

Transformations (`withColumn`, `filter`, `groupBy`, `join`) build the plan; actions (`show`, `count`, `collect`, `write`) execute it.

## Reading and writing data

```python
orders = (
    spark.read
    .option("header", True)
    .schema("order_id INT, customer STRING, city STRING, amount DOUBLE, order_ts TIMESTAMP")  # explicit schema: faster, safer
    .csv("s3://lake/raw/orders/2026-09-30/")
)

(orders
    .withColumn("order_date", F.to_date("order_ts"))
    .write
    .mode("overwrite")
    .partitionBy("order_date")
    .parquet("s3://lake/silver/orders/"))
```

Prefer explicit schemas over `inferSchema` for production jobs: inference requires an extra pass over the data and can guess wrong types.

## Spark SQL

Everything can also be expressed in SQL:

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.master("local[2]").appName("sql").getOrCreate()
spark.sparkContext.setLogLevel("ERROR")

spark.createDataFrame(
    [("Pune", 3499.0), ("Mumbai", 899.0), ("Pune", 240.0), ("Mumbai", 799.0)],
    ["city", "amount"],
).createOrReplaceTempView("orders")

spark.sql("""
    SELECT city, COUNT(*) AS orders, SUM(amount) AS revenue
    FROM orders
    GROUP BY city
    ORDER BY revenue DESC
""").show()
spark.stop()
```

```text
+------+------+-------+
|  city|orders|revenue|
+------+------+-------+
|  Pune|     2| 3739.0|
|Mumbai|     2| 1698.0|
+------+------+-------+
```

## Joins and window functions

```python
from pyspark.sql import SparkSession, Window, functions as F

spark = SparkSession.builder.master("local[2]").appName("windows").getOrCreate()
spark.sparkContext.setLogLevel("ERROR")

orders = spark.createDataFrame(
    [(1, 10, 3499.0), (2, 11, 899.0), (3, 10, 240.0), (4, 12, 1899.0), (5, 11, 799.0)],
    ["order_id", "customer_id", "amount"],
)
customers = spark.createDataFrame([(10, "Asha"), (11, "Ravi"), (12, "Meera")], ["customer_id", "name"])

w = Window.partitionBy("customer_id").orderBy(F.desc("amount"))
(orders
    .join(customers, "customer_id", "left")
    .withColumn("rank", F.row_number().over(w))
    .filter(F.col("rank") == 1)
    .select("name", "order_id", "amount")
    .orderBy("name")
    .show())
spark.stop()
```

```text
+-----+--------+------+
| name|order_id|amount|
+-----+--------+------+
| Asha|       1|3499.0|
|Meera|       4|1899.0|
| Ravi|       2| 899.0|
+-----+--------+------+
```

## Avoid Python UDFs when possible

Built-in functions (`pyspark.sql.functions`) run inside the JVM and are optimised by Catalyst. Python UDFs move every row between the JVM and Python — often 10× slower. If you must use Python logic, prefer **pandas UDFs** (vectorised with Apache Arrow).

## Spark vs. single-node tools

Spark has overhead: cluster startup, task scheduling, network shuffles. For datasets that fit on one machine (up to tens or low hundreds of GB), DuckDB or Polars are often faster and far simpler. Use Spark when data or parallelism genuinely exceeds a single machine, or when your platform (Databricks) is built around it.

## Try it yourself

With PySpark in local mode, generate 5 million synthetic orders, write them as Parquet partitioned by date, then compute daily revenue per category and each customer's largest order with a window function. Compare the run time with the same aggregation in DuckDB.
