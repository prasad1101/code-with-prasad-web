Once data is clean, you reshape it into what the analysis needs: derived columns, categories, date parts, text features. pandas provides vectorised tools for all of these — prefer them over row-by-row Python.

## Derived columns

```python
import pandas as pd

orders = pd.DataFrame({
    "order_id": [1, 2, 3, 4],
    "price": [799, 3499, 120, 199],
    "qty": [2, 1, 10, 5],
    "discount_pct": [0, 10, 5, 0],
})
orders["gross"] = orders["price"] * orders["qty"]
orders["net"] = (orders["gross"] * (1 - orders["discount_pct"] / 100)).round(2)
orders["is_bulk"] = orders["qty"] >= 5
print(orders)
```

```text
   order_id  price  qty  discount_pct  gross     net  is_bulk
0         1    799    2             0   1598  1598.0    False
1         2   3499    1            10   3499  3149.1    False
2         3    120   10             5   1200  1140.0     True
3         4    199    5             0    995   995.0     True
```

## Conditional values

```python
import numpy as np
import pandas as pd

orders = pd.DataFrame({"order_id": [1, 2, 3, 4], "net": [1598.0, 3149.1, 1140.0, 995.0]})

orders["size"] = np.where(orders["net"] >= 1500, "large", "small")

conditions = [orders["net"] >= 3000, orders["net"] >= 1000]
orders["tier"] = np.select(conditions, ["gold", "silver"], default="bronze")

orders["band"] = pd.cut(orders["net"], bins=[0, 1000, 2000, float("inf")], labels=["<1k", "1k-2k", "2k+"])
print(orders)
```

```text
   order_id     net   size    tier   band
0         1  1598.0  large  silver  1k-2k
1         2  3149.1  large    gold    2k+
2         3  1140.0  small  silver  1k-2k
3         4   995.0  small  bronze    <1k
```

## Mapping values

```python
import pandas as pd

orders = pd.DataFrame({"city": ["Pune", "Mumbai", "Delhi", "Pune"]})
region = {"Pune": "West", "Mumbai": "West", "Delhi": "North"}
orders["region"] = orders["city"].map(region)
print(orders)
```

```text
     city region
0    Pune   West
1  Mumbai   West
2   Delhi  North
3    Pune   West
```

Values missing from the mapping become `NaN` — check with `.isna().sum()`.

## Working with dates

The `.dt` accessor exposes date parts:

```python
import pandas as pd

orders = pd.DataFrame({"ordered_at": pd.to_datetime(["2026-09-01 10:15", "2026-09-06 21:40", "2026-10-02 08:05"])})
orders["date"] = orders["ordered_at"].dt.date
orders["month"] = orders["ordered_at"].dt.to_period("M")
orders["weekday"] = orders["ordered_at"].dt.day_name()
orders["hour"] = orders["ordered_at"].dt.hour
orders["is_weekend"] = orders["ordered_at"].dt.dayofweek >= 5
orders["days_since"] = (pd.Timestamp("2026-10-05") - orders["ordered_at"]).dt.days
print(orders)
```

```text
           ordered_at        date    month  weekday  hour  is_weekend  days_since
0 2026-09-01 10:15:00  2026-09-01  2026-09  Tuesday    10       False          33
1 2026-09-06 21:40:00  2026-09-06  2026-09   Sunday    21        True          28
2 2026-10-02 08:05:00  2026-10-02  2026-10   Friday     8       False           2
```

## Working with text

The `.str` accessor offers vectorised string methods:

```python
import pandas as pd

customers = pd.DataFrame({"email": ["Asha.Patil@Gmail.com", "ravi@company.co.in", "meera@gmail.com"]})
customers["email"] = customers["email"].str.lower()
customers["domain"] = customers["email"].str.split("@").str[1]
customers["is_gmail"] = customers["domain"].eq("gmail.com")
customers["first_name"] = customers["email"].str.extract(r"^([a-z]+)", expand=False).str.title()
print(customers)
```

```text
                  email         domain  is_gmail first_name
0  asha.patil@gmail.com      gmail.com      True       Asha
1    ravi@company.co.in  company.co.in     False       Ravi
2       meera@gmail.com      gmail.com      True      Meera
```

## `apply`: when nothing vectorised fits

```python
import pandas as pd

orders = pd.DataFrame({"qty": [1, 12, 50], "price": [799, 120, 199]})

def shipping_cost(row) -> int:
    if row["qty"] * row["price"] >= 5000:
        return 0
    return 49 if row["qty"] < 10 else 99

orders["shipping"] = orders.apply(shipping_cost, axis=1)
print(orders)
```

```text
   qty  price  shipping
0    1    799        49
1   12    120        99
2   50    199         0
```

`apply(axis=1)` calls a Python function per row — convenient but slow on millions of rows. Reach for `np.where`, `np.select`, `map` or arithmetic first.

## Method chaining

Express a whole transformation as one readable pipeline:

```python
import pandas as pd

orders = pd.DataFrame({
    "city": [" pune", "Mumbai", "Pune", "delhi"],
    "price": [799, 3499, 120, 199],
    "qty": [2, 1, 10, 5],
})

result = (
    orders
    .assign(city=lambda d: d["city"].str.strip().str.title(),
            revenue=lambda d: d["price"] * d["qty"])
    .query("revenue > 500")
    .sort_values("revenue", ascending=False)
    .reset_index(drop=True)
)
print(result)
```

```text
     city  price  qty  revenue
0  Mumbai   3499    1     3499
1    Pune    799    2     1598
2    Pune    120   10     1200
3   Delhi    199    5      995
```

Chained code is easy to read top to bottom, and there are no intermediate variables to get out of sync.

## Try it yourself

Given an orders table with `ordered_at`, `price`, `qty`, `coupon_code` (often missing) and `customer_email`, add: revenue, a `used_coupon` flag, order hour and weekday, a `time_of_day` label (morning/afternoon/evening/night) using `pd.cut` on the hour, and the email domain — all in one method chain.
