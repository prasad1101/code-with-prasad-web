Real data lives in files, databases and APIs. pandas reads almost any format into a DataFrame with one function — and the options you pass at load time save a lot of cleaning later.

## CSV

```python
import pandas as pd
from io import StringIO

csv_text = """order_id,order_date,customer,city,amount
1001,2026-09-01,Asha,Pune,1200
1002,2026-09-01,Ravi,Mumbai,850
1003,2026-09-02,Meera,Bengaluru,
1004,2026-09-03,Kabir,Pune,430
"""

orders = pd.read_csv(
    StringIO(csv_text),                 # normally a path: "data/raw/orders.csv"
    parse_dates=["order_date"],         # parse dates at load time
    dtype={"order_id": "string"},       # ids are labels, not numbers
)
print(orders)
print(orders.dtypes)
```

```text
  order_id order_date customer       city  amount
0     1001 2026-09-01     Asha       Pune  1200.0
1     1002 2026-09-01     Ravi     Mumbai   850.0
2     1003 2026-09-02    Meera  Bengaluru     NaN
3     1004 2026-09-03    Kabir       Pune   430.0
order_id              string
order_date    datetime64[us]
customer                 str
city                     str
amount               float64
dtype: object
```

Useful `read_csv` options:

| Option | Purpose |
| --- | --- |
| `sep=";"` | Non-comma separators |
| `usecols=[...]` | Load only needed columns (saves memory) |
| `dtype={...}` | Force column types |
| `parse_dates=[...]` | Parse date columns |
| `na_values=["NA", "-", ""]` | Extra strings to treat as missing |
| `encoding="latin-1"` | Non-UTF-8 files |
| `nrows=1000` | Preview a large file |
| `chunksize=100_000` | Process huge files in pieces |
| `thousands=","` | Numbers like `1,234` |

## Excel

```python
import pandas as pd

sales = pd.DataFrame({"region": ["North", "South"], "q3": [120_000, 98_500]})
sales.to_excel("sales.xlsx", sheet_name="Q3", index=False)

df = pd.read_excel("sales.xlsx", sheet_name="Q3")
all_sheets = pd.read_excel("sales.xlsx", sheet_name=None)   # dict of DataFrames, one per sheet
print(df)
print(list(all_sheets))
```

```text
  region      q3
0  North  120000
1  South   98500
['Q3']
```

## JSON

```python
import pandas as pd

api_response = [
    {"id": 1, "name": "Asha", "address": {"city": "Pune", "pin": "411001"}, "tags": ["vip"]},
    {"id": 2, "name": "Ravi", "address": {"city": "Mumbai", "pin": "400001"}, "tags": []},
]

customers = pd.json_normalize(api_response)     # flattens nested objects into columns
print(customers)
```

```text
   id  name   tags address.city address.pin
0   1  Asha  [vip]         Pune      411001
1   2  Ravi     []       Mumbai      400001
```

`pd.read_json("file.json")` reads JSON files; `lines=True` reads newline-delimited JSON (one record per line), common for logs and exports.

## SQL databases

```python
import sqlite3
import pandas as pd

con = sqlite3.connect(":memory:")
pd.DataFrame({"id": [1, 2, 3], "status": ["paid", "paid", "cancelled"], "total": [1200, 850, 430]}).to_sql("orders", con, index=False)

paid = pd.read_sql("SELECT status, COUNT(*) AS orders, SUM(total) AS revenue FROM orders GROUP BY status", con)
print(paid)
```

```text
      status  orders  revenue
0  cancelled       1      430
1       paid       2     2050
```

For PostgreSQL, MySQL and others, pass a SQLAlchemy engine (`create_engine("postgresql+psycopg://…")`). **Filter and aggregate in SQL** when you can — pulling millions of rows into pandas just to sum them is slow.

## Parquet: the analyst's friend

**Parquet** is a compressed, columnar file format that preserves data types and loads far faster than CSV:

```python
import numpy as np
import pandas as pd

df = pd.DataFrame({"order_id": np.arange(100_000), "amount": np.random.default_rng(0).integers(100, 5000, 100_000)})
df.to_csv("orders.csv", index=False)
df.to_parquet("orders.parquet", index=False)

import os
print(f"CSV: {os.path.getsize('orders.csv') / 1e6:.1f} MB, Parquet: {os.path.getsize('orders.parquet') / 1e6:.1f} MB")
print(pd.read_parquet("orders.parquet", columns=["amount"]).shape)   # read only the columns you need
```

```text
CSV: 1.1 MB, Parquet: 0.8 MB
(100000, 1)
```

Use Parquet for intermediate and processed datasets; keep CSV/Excel for exchanging data with people.

## Saving results

```python
import pandas as pd

summary = pd.DataFrame({"city": ["Pune", "Mumbai"], "revenue": [2610, 2350]})
summary.to_csv("summary.csv", index=False)
summary.to_excel("summary.xlsx", index=False)
summary.to_parquet("summary.parquet", index=False)
print(open("summary.csv").read())
```

```text
city,revenue
Pune,2610
Mumbai,2350
```

Pass `index=False` unless the index carries meaning.

## Try it yourself

Download a public CSV dataset (for example from data.gov.in or Kaggle), load only the columns you need with correct types and parsed dates, check `info()` and `describe()`, and save the result as Parquet. Compare load times of the CSV and Parquet versions with `%timeit` in Jupyter.
