Data comes in two broad shapes. **Long** (tidy) data has one row per observation — ideal for grouping, filtering and plotting. **Wide** data spreads a variable across columns — ideal for reports and spreadsheets. `pivot_table` and `melt` convert between them.

## Long to wide: `pivot_table`

```python
import pandas as pd

sales = pd.DataFrame({
    "month": ["2026-07", "2026-07", "2026-08", "2026-08", "2026-09", "2026-09", "2026-09"],
    "city": ["Pune", "Mumbai", "Pune", "Mumbai", "Pune", "Mumbai", "Pune"],
    "revenue": [3739, 899, 1599, 799, 899, 1599, 600],
})

report = sales.pivot_table(index="month", columns="city", values="revenue", aggfunc="sum", fill_value=0, margins=True, margins_name="Total")
print(report)
```

```text
city     Mumbai  Pune  Total
month
2026-07     899  3739   4638
2026-08     799  1599   2398
2026-09    1599  1499   3098
Total      3297  6837  10134
```

- `aggfunc` decides how duplicates combine (September has two Pune rows, summed here).
- `fill_value=0` replaces missing combinations.
- `margins=True` adds row and column totals.

`pivot` (without `_table`) is the simpler version that fails if index/column pairs are duplicated.

## Cross-tabulation

Counts (or percentages) of combinations:

```python
import pandas as pd

orders = pd.DataFrame({
    "city": ["Pune", "Pune", "Mumbai", "Mumbai", "Delhi", "Pune"],
    "payment": ["UPI", "Card", "UPI", "UPI", "Card", "UPI"],
})
print(pd.crosstab(orders["city"], orders["payment"]))
print(pd.crosstab(orders["city"], orders["payment"], normalize="index").round(2))   # row percentages
```

```text
payment  Card  UPI
city
Delhi       1    0
Mumbai      0    2
Pune        1    2
payment  Card   UPI
city
Delhi    1.00  0.00
Mumbai   0.00  1.00
Pune     0.33  0.67
```

## Wide to long: `melt`

Spreadsheets often arrive wide — one column per month. Melt them into long form for analysis:

```python
import pandas as pd

wide = pd.DataFrame({
    "region": ["North", "South"],
    "Jul": [120, 98],
    "Aug": [135, 104],
    "Sep": [150, 111],
})
long = wide.melt(id_vars="region", var_name="month", value_name="sales")
print(long)
print(long.groupby("region")["sales"].sum())
```

```text
  region month  sales
0  North   Jul    120
1  South   Jul     98
2  North   Aug    135
3  South   Aug    104
4  North   Sep    150
5  South   Sep    111
region
North    405
South    313
Name: sales, dtype: int64
```

## `stack` and `unstack`

With a multi-level index, `unstack` moves an index level to columns and `stack` does the reverse:

```python
import pandas as pd

sales = pd.DataFrame({
    "month": ["2026-08", "2026-08", "2026-09", "2026-09"],
    "city": ["Pune", "Mumbai", "Pune", "Mumbai"],
    "revenue": [1599, 799, 1499, 1599],
})
grouped = sales.groupby(["month", "city"])["revenue"].sum()
print(grouped)
print(grouped.unstack("city"))
```

```text
month    city
2026-08  Mumbai     799
         Pune      1599
2026-09  Mumbai    1599
         Pune      1499
Name: revenue, dtype: int64
city     Mumbai  Pune
month
2026-08     799  1599
2026-09    1599  1499
```

## Exploding list columns

```python
import pandas as pd

products = pd.DataFrame({"name": ["Mouse", "Hub"], "tags": [["wireless", "usb-c"], ["usb-c"]]})
print(products.explode("tags"))
print(products.explode("tags")["tags"].value_counts())
```

```text
    name      tags
0  Mouse  wireless
0  Mouse     usb-c
1    Hub     usb-c
tags
usb-c       2
wireless    1
Name: count, dtype: int64
```

## Which shape when?

| Task | Shape |
| --- | --- |
| groupby, filtering, most charts (seaborn/Plotly) | Long |
| Reports, spreadsheets, heatmaps, side-by-side comparisons | Wide |
| Storing data in databases | Long |

A good workflow: keep data long while analysing, and pivot to wide at the very end for presentation.

## Try it yourself

Take a wide spreadsheet of monthly sales per product (one column per month), melt it to long form, compute each product's month-over-month growth with `groupby` + `pct_change`, and pivot the growth rates back into a wide report with products as rows and months as columns.
