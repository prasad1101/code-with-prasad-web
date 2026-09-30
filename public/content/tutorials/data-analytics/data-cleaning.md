Real-world data is messy: missing values, duplicates, inconsistent spellings, numbers stored as text, impossible values. Cleaning often takes most of an analyst's time — and skipping it produces confidently wrong answers.

## A messy dataset

```python
import numpy as np
import pandas as pd

raw = pd.DataFrame({
    "order_id": ["1001", "1002", "1002", "1003", "1004", "1005"],
    "customer": ["Asha Patil", " ravi kumar", " ravi kumar", "MEERA IYER", None, "Kabir Shah"],
    "city": ["Pune", "mumbai", "mumbai", "Bengaluru", "Pune ", "Pune"],
    "amount": ["1,200", "850", "850", "abc", "430", "-50"],
    "order_date": ["2026-09-01", "2026-09-01", "2026-09-01", "2026/09/02", "2026-09-03", "not a date"],
})
print(raw)
raw.info()
```

```text
  order_id     customer       city amount  order_date
0     1001   Asha Patil       Pune  1,200  2026-09-01
1     1002   ravi kumar     mumbai    850  2026-09-01
2     1002   ravi kumar     mumbai    850  2026-09-01
3     1003   MEERA IYER  Bengaluru    abc  2026/09/02
4     1004          NaN      Pune     430  2026-09-03
5     1005   Kabir Shah       Pune    -50  not a date
<class 'pandas.DataFrame'>
RangeIndex: 6 entries, 0 to 5
Data columns (total 5 columns):
 #   Column      Non-Null Count  Dtype
---  ------      --------------  -----
 0   order_id    6 non-null      str
 1   customer    5 non-null      str
 2   city        6 non-null      str
 3   amount      6 non-null      str
 4   order_date  6 non-null      str
dtypes: str(5)
memory usage: 563.0 bytes
```

## 1. Duplicates

```python
import pandas as pd

raw = pd.DataFrame({"order_id": ["1001", "1002", "1002", "1003"], "amount": [1200, 850, 850, 430]})
print(raw.duplicated().sum(), "exact duplicate rows")
print(raw.duplicated(subset=["order_id"]).sum(), "duplicate order ids")

clean = raw.drop_duplicates(subset=["order_id"], keep="first")
print(clean)
```

```text
1 exact duplicate rows
1 duplicate order ids
  order_id  amount
0     1001    1200
1     1002     850
3     1003     430
```

Decide what defines a duplicate for your data (all columns, or a business key like `order_id`), and investigate before dropping — duplicates can signal an upstream bug.

## 2. Text cleanup

```python
import pandas as pd

df = pd.DataFrame({"customer": ["Asha Patil", " ravi kumar", "MEERA IYER"], "city": ["Pune", "mumbai", "Pune "]})
df["customer"] = df["customer"].str.strip().str.title()
df["city"] = df["city"].str.strip().str.title()
print(df)
print(df["city"].unique())
```

```text
     customer    city
0  Asha Patil    Pune
1  Ravi Kumar  Mumbai
2  Meera Iyer    Pune
<ArrowStringArray>
['Pune', 'Mumbai']
Length: 2, dtype: str
```

For inconsistent category labels, map them explicitly:

```python
import pandas as pd

cities = pd.Series(["Bangalore", "Bengaluru", "BLR", "Mumbai", "Bombay"])
canonical = {"Bangalore": "Bengaluru", "BLR": "Bengaluru", "Bombay": "Mumbai"}
print(cities.replace(canonical).value_counts())
```

```text
Bengaluru    3
Mumbai       2
Name: count, dtype: int64
```

## 3. Converting types

Numbers stored as text can't be summed or averaged correctly:

```python
import pandas as pd

amount = pd.Series(["1,200", "850", "abc", "430", "-50"])
cleaned = pd.to_numeric(amount.str.replace(",", "", regex=False), errors="coerce")  # invalid → NaN
print(cleaned)

dates = pd.Series(["2026-09-01", "2026/09/02", "not a date"])
print(pd.to_datetime(dates, format="mixed", errors="coerce"))
```

```text
0    1200.0
1     850.0
2       NaN
3     430.0
4     -50.0
dtype: float64
0   2026-09-01
1   2026-09-02
2          NaT
dtype: datetime64[us]
```

`errors="coerce"` turns unparseable values into missing values — then **count them** so you know how much data was affected.

## 4. Missing values

```python
import numpy as np
import pandas as pd

df = pd.DataFrame({
    "customer": ["Asha", None, "Meera", "Kabir"],
    "amount": [1200, 850, np.nan, 430],
    "city": ["Pune", "Mumbai", None, "Pune"],
})
print(df.isna().sum())                         # missing values per column
print(f"{df.isna().any(axis=1).mean():.0%} of rows have a missing value")
```

```text
customer    1
amount      1
city        1
dtype: int64
50% of rows have a missing value
```

Options — choose per column, based on *why* the data is missing:

```python
import numpy as np
import pandas as pd

df = pd.DataFrame({
    "customer": ["Asha", None, "Meera", "Kabir"],
    "amount": [1200, 850, np.nan, 430],
    "city": ["Pune", "Mumbai", None, "Pune"],
})
print(df.dropna(subset=["customer"]))                              # drop rows missing a required field
print(df.fillna({"city": "Unknown"}))                              # fill with a label
print(df["amount"].fillna(df["amount"].median()))                  # impute with the median
```

```text
  customer  amount  city
0     Asha  1200.0  Pune
2    Meera     NaN   NaN
3    Kabir   430.0  Pune
  customer  amount     city
0     Asha  1200.0     Pune
1      NaN   850.0   Mumbai
2    Meera     NaN  Unknown
3    Kabir   430.0     Pune
0    1200.0
1     850.0
2     850.0
3     430.0
Name: amount, dtype: float64
```

- **Drop** when the missing field is essential and few rows are affected.
- **Fill with a label** ("Unknown") for categories — keeps the rows and makes the gap visible.
- **Impute** (median, group median, previous value for time series) only when it won't bias the analysis — and document it.
- **Keep as missing** when the absence itself is meaningful ("no coupon used").

## 5. Invalid values

```python
import pandas as pd

orders = pd.DataFrame({"order_id": [1, 2, 3, 4], "amount": [1200, -50, 850, 999_999]})
invalid = orders[(orders["amount"] <= 0) | (orders["amount"] > 100_000)]
print(invalid)
valid = orders[orders["amount"].between(1, 100_000)]
print(len(valid), "valid orders")
```

```text
   order_id  amount
1         2     -50
3         4  999999
2 valid orders
```

Encode business rules explicitly (amounts must be positive; ages between 0 and 120; end date after start date), and keep a record of rejected rows.

## 6. Outliers

Not every extreme value is an error — a ₹2 lakh corporate order may be real. Detect, investigate, then decide:

```python
import pandas as pd

amounts = pd.Series([520, 610, 580, 700, 640, 15_000, 590])
q1, q3 = amounts.quantile([0.25, 0.75])
iqr = q3 - q1
outliers = amounts[(amounts < q1 - 1.5 * iqr) | (amounts > q3 + 1.5 * iqr)]
print(outliers)
```

```text
5    15000
dtype: int64
```

Consider analysing with and without outliers, or using medians, which are robust to them.

## A reusable cleaning function

Put cleaning steps in a function so they're repeatable and testable:

```python
import numpy as np
import pandas as pd

def clean_orders(raw: pd.DataFrame) -> pd.DataFrame:
    df = raw.drop_duplicates(subset=["order_id"]).copy()
    df["customer"] = df["customer"].str.strip().str.title()
    df["city"] = df["city"].str.strip().str.title()
    df["amount"] = pd.to_numeric(df["amount"].str.replace(",", "", regex=False), errors="coerce")
    df["order_date"] = pd.to_datetime(df["order_date"], format="mixed", errors="coerce")
    df = df[df["amount"] > 0]
    return df.dropna(subset=["customer", "amount", "order_date"])

raw = pd.DataFrame({
    "order_id": ["1001", "1002", "1002", "1003", "1004", "1005"],
    "customer": ["Asha Patil", " ravi kumar", " ravi kumar", "MEERA IYER", None, "Kabir Shah"],
    "city": ["Pune", "mumbai", "mumbai", "Bengaluru", "Pune ", "Pune"],
    "amount": ["1,200", "850", "850", "abc", "430", "-50"],
    "order_date": ["2026-09-01", "2026-09-01", "2026-09-01", "2026/09/02", "2026-09-03", "not a date"],
})
clean = clean_orders(raw)
print(clean)
print(f"kept {len(clean)} of {len(raw)} rows")
```

```text
  order_id    customer    city  amount order_date
0     1001  Asha Patil    Pune  1200.0 2026-09-01
1     1002  Ravi Kumar  Mumbai   850.0 2026-09-01
kept 2 of 6 rows
```

Always report how many rows were removed and why — stakeholders need to know what the numbers cover.

## Try it yourself

Take a messy public dataset (or create one with typos, duplicates and mixed formats) and write a `clean()` function that standardises text, fixes types, handles missing values per column, removes invalid rows, and prints a cleaning report (rows in, rows out, reasons).
