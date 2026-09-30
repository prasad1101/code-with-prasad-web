"Revenue by city", "average order value per month", "top customers by lifetime spend" — most analysis questions are answered by **grouping** rows and **aggregating** each group. In pandas, that's `groupby` (the equivalent of SQL's `GROUP BY`).

We'll use this dataset throughout:

```python
import pandas as pd

orders = pd.DataFrame({
    "order_id": range(1, 11),
    "customer": ["Asha", "Ravi", "Asha", "Meera", "Kabir", "Ravi", "Asha", "Sara", "Meera", "Ravi"],
    "city": ["Pune", "Mumbai", "Pune", "Bengaluru", "Pune", "Mumbai", "Pune", "Delhi", "Bengaluru", "Mumbai"],
    "category": ["electronics", "books", "stationery", "electronics", "books", "electronics", "books", "electronics", "stationery", "books"],
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098, 600, 1599],
    "month": ["2026-07", "2026-07", "2026-07", "2026-08", "2026-08", "2026-08", "2026-09", "2026-09", "2026-09", "2026-09"],
})
orders.to_csv("orders.csv", index=False)
print(orders.head())
```

```text
   order_id customer       city     category  amount    month
0         1     Asha       Pune  electronics    3499  2026-07
1         2     Ravi     Mumbai        books     899  2026-07
2         3     Asha       Pune   stationery     240  2026-07
3         4    Meera  Bengaluru  electronics    1899  2026-08
4         5    Kabir       Pune        books    1599  2026-08
```

## Basic grouping

```python
import pandas as pd

orders = pd.DataFrame({
    "customer": ["Asha", "Ravi", "Asha", "Meera", "Kabir", "Ravi", "Asha", "Sara", "Meera", "Ravi"],
    "city": ["Pune", "Mumbai", "Pune", "Bengaluru", "Pune", "Mumbai", "Pune", "Delhi", "Bengaluru", "Mumbai"],
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098, 600, 1599],
})
print(orders.groupby("city")["amount"].sum().sort_values(ascending=False))
print(orders.groupby("city")["customer"].nunique())
```

```text
city
Pune         6237
Delhi        5098
Mumbai       3297
Bengaluru    2499
Name: amount, dtype: int64
city
Bengaluru    1
Delhi        1
Mumbai       1
Pune         2
Name: customer, dtype: int64
```

## Several aggregations with named results

```python
import pandas as pd

orders = pd.DataFrame({
    "customer": ["Asha", "Ravi", "Asha", "Meera", "Kabir", "Ravi", "Asha", "Sara", "Meera", "Ravi"],
    "city": ["Pune", "Mumbai", "Pune", "Bengaluru", "Pune", "Mumbai", "Pune", "Delhi", "Bengaluru", "Mumbai"],
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098, 600, 1599],
})
summary = (
    orders.groupby("city")
    .agg(
        orders=("amount", "size"),
        revenue=("amount", "sum"),
        avg_order=("amount", "mean"),
        customers=("customer", "nunique"),
        largest=("amount", "max"),
    )
    .sort_values("revenue", ascending=False)
    .round(1)
)
print(summary)
```

```text
           orders  revenue  avg_order  customers  largest
city
Pune            4     6237     1559.2          2     3499
Delhi           1     5098     5098.0          1     5098
Mumbai          3     3297     1099.0          1     1599
Bengaluru       2     2499     1249.5          1     1899
```

Named aggregation (`new_name=(column, function)`) gives clean column names in one step.

## Grouping by several columns

```python
import pandas as pd

orders = pd.DataFrame({
    "category": ["electronics", "books", "stationery", "electronics", "books", "electronics", "books", "electronics", "stationery", "books"],
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098, 600, 1599],
    "month": ["2026-07", "2026-07", "2026-07", "2026-08", "2026-08", "2026-08", "2026-09", "2026-09", "2026-09", "2026-09"],
})
by_month_cat = orders.groupby(["month", "category"], as_index=False)["amount"].sum()
print(by_month_cat)
```

```text
     month     category  amount
0  2026-07        books     899
1  2026-07  electronics    3499
2  2026-07   stationery     240
3  2026-08        books    1599
4  2026-08  electronics    2698
5  2026-09        books    2498
6  2026-09  electronics    5098
7  2026-09   stationery     600
```

`as_index=False` keeps the group keys as regular columns — handy for further processing or charting.

## Share of total and ranks within groups: `transform`

`transform` returns a result aligned with the original rows, so you can compare each row with its group:

```python
import pandas as pd

orders = pd.DataFrame({
    "customer": ["Asha", "Ravi", "Asha", "Meera", "Kabir", "Ravi", "Asha", "Sara", "Meera", "Ravi"],
    "city": ["Pune", "Mumbai", "Pune", "Bengaluru", "Pune", "Mumbai", "Pune", "Delhi", "Bengaluru", "Mumbai"],
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098, 600, 1599],
})
orders["city_total"] = orders.groupby("city")["amount"].transform("sum")
orders["pct_of_city"] = (orders["amount"] / orders["city_total"] * 100).round(1)
orders["rank_in_city"] = orders.groupby("city")["amount"].rank(ascending=False, method="dense").astype(int)
print(orders.sort_values(["city", "rank_in_city"]))
```

```text
  customer       city  amount  city_total  pct_of_city  rank_in_city
3    Meera  Bengaluru    1899        2499         76.0             1
8    Meera  Bengaluru     600        2499         24.0             2
7     Sara      Delhi    5098        5098        100.0             1
9     Ravi     Mumbai    1599        3297         48.5             1
1     Ravi     Mumbai     899        3297         27.3             2
5     Ravi     Mumbai     799        3297         24.2             3
0     Asha       Pune    3499        6237         56.1             1
4    Kabir       Pune    1599        6237         25.6             2
6     Asha       Pune     899        6237         14.4             3
2     Asha       Pune     240        6237          3.8             4
```

## Top N per group

```python
import pandas as pd

orders = pd.DataFrame({
    "customer": ["Asha", "Ravi", "Asha", "Meera", "Kabir", "Ravi", "Asha", "Sara", "Meera", "Ravi"],
    "city": ["Pune", "Mumbai", "Pune", "Bengaluru", "Pune", "Mumbai", "Pune", "Delhi", "Bengaluru", "Mumbai"],
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098, 600, 1599],
})
top_per_city = (
    orders.sort_values("amount", ascending=False)
    .groupby("city")
    .head(1)
)
print(top_per_city)
```

```text
  customer       city  amount
7     Sara      Delhi    5098
0     Asha       Pune    3499
3    Meera  Bengaluru    1899
9     Ravi     Mumbai    1599
```

## Filtering groups

Keep only groups that satisfy a condition (SQL's `HAVING`):

```python
import pandas as pd

orders = pd.DataFrame({
    "customer": ["Asha", "Ravi", "Asha", "Meera", "Kabir", "Ravi", "Asha", "Sara", "Meera", "Ravi"],
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098, 600, 1599],
})
repeat_customers = orders.groupby("customer").filter(lambda g: len(g) >= 2)
print(repeat_customers["customer"].unique())
```

```text
<ArrowStringArray>
['Asha', 'Ravi', 'Meera']
Length: 3, dtype: str
```

## Customer-level metrics

A common pattern — turn orders into one row per customer:

```python
import pandas as pd

orders = pd.DataFrame({
    "customer": ["Asha", "Ravi", "Asha", "Meera", "Kabir", "Ravi", "Asha", "Sara", "Meera", "Ravi"],
    "amount": [3499, 899, 240, 1899, 1599, 799, 899, 5098, 600, 1599],
    "month": ["2026-07", "2026-07", "2026-07", "2026-08", "2026-08", "2026-08", "2026-09", "2026-09", "2026-09", "2026-09"],
})
customers = orders.groupby("customer").agg(
    orders=("amount", "size"),
    lifetime_value=("amount", "sum"),
    first_month=("month", "min"),
    last_month=("month", "max"),
)
customers["avg_order_value"] = (customers["lifetime_value"] / customers["orders"]).round(0)
print(customers.sort_values("lifetime_value", ascending=False))
```

```text
          orders  lifetime_value first_month last_month  avg_order_value
customer
Sara           1            5098     2026-09    2026-09           5098.0
Asha           3            4638     2026-07    2026-09           1546.0
Ravi           3            3297     2026-07    2026-09           1099.0
Meera          2            2499     2026-08    2026-09           1250.0
Kabir          1            1599     2026-08    2026-08           1599.0
```

## Watch the grain

Before aggregating, be clear about what one row represents (an order? an order line? a day?). Summing `order_total` from an order-*lines* table double-counts orders with several lines — aggregate at the right level first.

## Try it yourself

Using the dataset above: find each month's revenue and its change from the previous month (hint: `.pct_change()`), the category with the highest revenue in each city, the share of revenue from repeat customers, and the average number of orders per customer per city.
