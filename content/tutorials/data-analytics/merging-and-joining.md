Analysis usually combines several tables: orders with customers, products with categories, targets with actuals. pandas' `merge` works like SQL joins; `concat` stacks tables.

```python
import pandas as pd

customers = pd.DataFrame({
    "customer_id": [1, 2, 3, 4],
    "name": ["Asha", "Ravi", "Meera", "Kabir"],
    "city": ["Pune", "Mumbai", "Bengaluru", "Pune"],
})
orders = pd.DataFrame({
    "order_id": [101, 102, 103, 104, 105],
    "customer_id": [1, 2, 1, 3, 9],          # customer 9 doesn't exist
    "amount": [1200, 850, 430, 2200, 999],
})
customers.to_csv("customers.csv", index=False)
orders.to_csv("orders.csv", index=False)
print(customers, orders, sep="\n\n")
```

```text
   customer_id   name       city
0            1   Asha       Pune
1            2   Ravi     Mumbai
2            3  Meera  Bengaluru
3            4  Kabir       Pune

   order_id  customer_id  amount
0       101            1    1200
1       102            2     850
2       103            1     430
3       104            3    2200
4       105            9     999
```

## Inner join

Only rows with a match in both tables:

```python
import pandas as pd

customers = pd.DataFrame({"customer_id": [1, 2, 3, 4], "name": ["Asha", "Ravi", "Meera", "Kabir"], "city": ["Pune", "Mumbai", "Bengaluru", "Pune"]})
orders = pd.DataFrame({"order_id": [101, 102, 103, 104, 105], "customer_id": [1, 2, 1, 3, 9], "amount": [1200, 850, 430, 2200, 999]})

print(orders.merge(customers, on="customer_id", how="inner"))
```

```text
   order_id  customer_id  amount   name       city
0       101            1    1200   Asha       Pune
1       102            2     850   Ravi     Mumbai
2       103            1     430   Asha       Pune
3       104            3    2200  Meera  Bengaluru
```

Order 105 disappeared because customer 9 doesn't exist — silently losing rows is the most common join mistake.

## Left join

Keep every row of the left table:

```python
import pandas as pd

customers = pd.DataFrame({"customer_id": [1, 2, 3, 4], "name": ["Asha", "Ravi", "Meera", "Kabir"], "city": ["Pune", "Mumbai", "Bengaluru", "Pune"]})
orders = pd.DataFrame({"order_id": [101, 102, 103, 104, 105], "customer_id": [1, 2, 1, 3, 9], "amount": [1200, 850, 430, 2200, 999]})

joined = orders.merge(customers, on="customer_id", how="left", indicator=True)
print(joined)
print(joined["_merge"].value_counts())
```

```text
   order_id  customer_id  amount   name       city     _merge
0       101            1    1200   Asha       Pune       both
1       102            2     850   Ravi     Mumbai       both
2       103            1     430   Asha       Pune       both
3       104            3    2200  Meera  Bengaluru       both
4       105            9     999    NaN        NaN  left_only
_merge
both          4
left_only     1
right_only    0
Name: count, dtype: int64
```

`indicator=True` adds a `_merge` column showing where each row came from — a quick data-quality check for orphaned records.

## Finding non-matches (anti-join)

```python
import pandas as pd

customers = pd.DataFrame({"customer_id": [1, 2, 3, 4], "name": ["Asha", "Ravi", "Meera", "Kabir"]})
orders = pd.DataFrame({"order_id": [101, 102, 103, 104, 105], "customer_id": [1, 2, 1, 3, 9]})

never_ordered = customers[~customers["customer_id"].isin(orders["customer_id"])]
print(never_ordered)
```

```text
   customer_id   name
3            4  Kabir
```

## Join types

| `how=` | Keeps |
| --- | --- |
| `"inner"` | Only matching keys |
| `"left"` | All left rows (+ matches) |
| `"right"` | All right rows (+ matches) |
| `"outer"` | All rows from both |
| `"cross"` | Every combination |

## Different key names and multiple keys

```python
import pandas as pd

targets = pd.DataFrame({"city_name": ["Pune", "Mumbai"], "month": ["2026-09", "2026-09"], "target": [5000, 4000]})
actuals = pd.DataFrame({"city": ["Pune", "Mumbai"], "month": ["2026-09", "2026-09"], "revenue": [5630, 3350]})

report = actuals.merge(targets, left_on=["city", "month"], right_on=["city_name", "month"]).drop(columns="city_name")
report["vs_target_pct"] = (report["revenue"] / report["target"] * 100).round(1)
print(report)
```

```text
     city    month  revenue  target  vs_target_pct
0    Pune  2026-09     5630    5000          112.6
1  Mumbai  2026-09     3350    4000           83.8
```

## Guard against duplicated keys

If the key isn't unique on the side you expect, a join multiplies rows (a "fan-out") and totals inflate. Let pandas check:

```python
import pandas as pd

orders = pd.DataFrame({"order_id": [1, 2], "customer_id": [1, 1]})
customers = pd.DataFrame({"customer_id": [1, 1], "segment": ["retail", "vip"]})   # duplicate key!

try:
    orders.merge(customers, on="customer_id", validate="many_to_one")
except pd.errors.MergeError as e:
    print("MergeError:", e)
```

```text
MergeError: Merge keys are not unique in right dataset; not a many-to-one merge

Duplicates in right:
  customer_id
           1 ...
```

`validate="one_to_one"`, `"one_to_many"` or `"many_to_one"` turns silent fan-outs into loud errors. Also compare row counts before and after every join.

## Stacking tables with `concat`

```python
import pandas as pd

aug = pd.DataFrame({"order_id": [1, 2], "amount": [500, 700]})
sep = pd.DataFrame({"order_id": [3, 4], "amount": [650, 900]})

all_orders = pd.concat([aug.assign(month="2026-08"), sep.assign(month="2026-09")], ignore_index=True)
print(all_orders)
```

```text
   order_id  amount    month
0         1     500  2026-08
1         2     700  2026-08
2         3     650  2026-09
3         4     900  2026-09
```

Use `concat` to combine monthly files, or data with the same columns from different sources.

## Try it yourself

With `customers`, `orders`, `order_items` and `products` tables: build an order-line fact table with customer city and product category, check row counts after each join, find orders whose products are missing from the catalogue, and compute revenue per city and category.
