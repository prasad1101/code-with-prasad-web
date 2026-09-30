**pandas** is the workhorse of data analysis in Python. Its two data structures — **Series** (a labelled column) and **DataFrame** (a table) — let you load, inspect, filter, transform and summarise data in a few lines.

## Series

```python
import pandas as pd

prices = pd.Series([799, 3499, 120], index=["mouse", "keyboard", "notebook"], name="price")
print(prices)
print(prices["keyboard"], prices.mean())
```

```text
mouse        799
keyboard    3499
notebook     120
Name: price, dtype: int64
3499 1472.6666666666667
```

## DataFrames

```python
import pandas as pd

products = pd.DataFrame({
    "name": ["Wireless Mouse", "Mechanical Keyboard", "Notebook A5", "Gel Pen Pack", "Clean Code"],
    "category": ["electronics", "electronics", "stationery", "stationery", "books"],
    "price": [799, 3499, 120, 199, 899],
    "stock": [42, 12, 300, 0, 25],
})
print(products)
print(products.shape)
print(products.dtypes)
```

```text
                  name     category  price  stock
0       Wireless Mouse  electronics    799     42
1  Mechanical Keyboard  electronics   3499     12
2          Notebook A5   stationery    120    300
3         Gel Pen Pack   stationery    199      0
4           Clean Code        books    899     25
(5, 4)
name          str
category      str
price       int64
stock       int64
dtype: object
```

## Inspecting data

The first thing to do with any dataset:

```python
import pandas as pd

products = pd.DataFrame({
    "name": ["Wireless Mouse", "Mechanical Keyboard", "Notebook A5", "Gel Pen Pack", "Clean Code"],
    "category": ["electronics", "electronics", "stationery", "stationery", "books"],
    "price": [799, 3499, 120, 199, 899],
    "stock": [42, 12, 300, 0, 25],
})
print(products.head(3))                          # first rows (tail() for the last)
products.info()                                  # columns, types, non-null counts, memory
print(products.describe())                       # summary statistics for numeric columns
print(products["category"].value_counts())       # frequency of each value
```

```text
                  name     category  price  stock
0       Wireless Mouse  electronics    799     42
1  Mechanical Keyboard  electronics   3499     12
2          Notebook A5   stationery    120    300
<class 'pandas.DataFrame'>
RangeIndex: 5 entries, 0 to 4
Data columns (total 4 columns):
 #   Column    Non-Null Count  Dtype
---  ------    --------------  -----
 0   name      5 non-null      str
 1   category  5 non-null      str
 2   price     5 non-null      int64
 3   stock     5 non-null      int64
dtypes: int64(2), str(2)
memory usage: 405.0 bytes
             price      stock
count     5.000000    5.00000
mean   1103.200000   75.80000
std    1383.686453  126.29806
min     120.000000    0.00000
25%     199.000000   12.00000
50%     799.000000   25.00000
75%     899.000000   42.00000
max    3499.000000  300.00000
category
electronics    2
stationery     2
books          1
Name: count, dtype: int64
```

## Selecting columns and rows

```python
import pandas as pd

products = pd.DataFrame({
    "name": ["Wireless Mouse", "Mechanical Keyboard", "Notebook A5", "Gel Pen Pack", "Clean Code"],
    "category": ["electronics", "electronics", "stationery", "stationery", "books"],
    "price": [799, 3499, 120, 199, 899],
    "stock": [42, 12, 300, 0, 25],
})
print(products["price"].max())                         # one column → Series
print(products[["name", "price"]].head(2))             # several columns → DataFrame

print(products.loc[1, "name"])                         # label-based: row label 1, column "name"
print(products.iloc[0, :2].tolist())                   # position-based: first row, first two columns
```

```text
3499
                  name  price
0       Wireless Mouse    799
1  Mechanical Keyboard   3499
Mechanical Keyboard
['Wireless Mouse', 'electronics']
```

- `.loc[rows, columns]` selects by **labels** (index values, column names); slices include the end.
- `.iloc[rows, columns]` selects by **integer position**; slices exclude the end.

## Filtering rows

```python
import pandas as pd

products = pd.DataFrame({
    "name": ["Wireless Mouse", "Mechanical Keyboard", "Notebook A5", "Gel Pen Pack", "Clean Code"],
    "category": ["electronics", "electronics", "stationery", "stationery", "books"],
    "price": [799, 3499, 120, 199, 899],
    "stock": [42, 12, 300, 0, 25],
})
print(products[products["price"] > 500])
print(products[(products["category"] == "stationery") & (products["stock"] > 0)])
print(products[products["category"].isin(["books", "stationery"])]["name"].tolist())
print(products.query("price < 1000 and stock > 0")["name"].tolist())
```

```text
                  name     category  price  stock
0       Wireless Mouse  electronics    799     42
1  Mechanical Keyboard  electronics   3499     12
4           Clean Code        books    899     25
          name    category  price  stock
2  Notebook A5  stationery    120    300
['Notebook A5', 'Gel Pen Pack', 'Clean Code']
['Wireless Mouse', 'Notebook A5', 'Clean Code']
```

Combine conditions with `&` (and), `|` (or) and `~` (not), with parentheses around each condition.

## Adding and modifying columns

```python
import pandas as pd

products = pd.DataFrame({
    "name": ["Wireless Mouse", "Mechanical Keyboard", "Notebook A5"],
    "price": [799, 3499, 120],
    "stock": [42, 12, 300],
})
products["stock_value"] = products["price"] * products["stock"]
products["price_band"] = pd.cut(products["price"], bins=[0, 500, 2000, float("inf")], labels=["budget", "mid", "premium"])
products = products.assign(in_stock=products["stock"] > 0)
print(products)
```

```text
                  name  price  stock  stock_value price_band  in_stock
0       Wireless Mouse    799     42        33558        mid      True
1  Mechanical Keyboard   3499     12        41988    premium      True
2          Notebook A5    120    300        36000     budget      True
```

## Sorting

```python
import pandas as pd

products = pd.DataFrame({"name": ["Mouse", "Keyboard", "Notebook", "Pens"], "category": ["tech", "tech", "office", "office"], "price": [799, 3499, 120, 199]})
print(products.sort_values("price", ascending=False))
print(products.sort_values(["category", "price"], ascending=[True, False]))
print(products.nlargest(2, "price")["name"].tolist())
```

```text
       name category  price
1  Keyboard     tech   3499
0     Mouse     tech    799
3      Pens   office    199
2  Notebook   office    120
       name category  price
3      Pens   office    199
2  Notebook   office    120
1  Keyboard     tech   3499
0     Mouse     tech    799
['Keyboard', 'Mouse']
```

## Copy-on-Write: avoid chained assignment

In pandas 3, every selection behaves like a copy (**Copy-on-Write**). Modifying a subset never changes the original, and "chained assignment" doesn't work:

```python
import pandas as pd

df = pd.DataFrame({"city": ["Pune", "Mumbai"], "sales": [100, 200]})

subset = df[df["city"] == "Pune"]
subset["sales"] = 0                       # modifies only `subset`
print(df)

df.loc[df["city"] == "Pune", "sales"] = 150   # the correct way to update the original
print(df)
```

```text
     city  sales
0    Pune    100
1  Mumbai    200
     city  sales
0    Pune    150
1  Mumbai    200
```

Always update a DataFrame with a single `.loc[row_condition, column] = value`.

## Try it yourself

Build a DataFrame of 10 employees (name, department, salary, years of experience). Find the three highest-paid employees, the average salary per department (hint: next lessons, or try `groupby`), everyone with more than 5 years' experience earning below the overall average, and add a `salary_band` column using `pd.cut`.
