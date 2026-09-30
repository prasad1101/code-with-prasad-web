**NumPy** provides the `ndarray`: a fast, fixed-type, multi-dimensional array. pandas, scikit-learn and most of the Python data ecosystem are built on it. You'll rarely analyse business data with NumPy alone, but understanding arrays and **vectorisation** makes everything else faster and clearer.

## Creating arrays

```python
import numpy as np

prices = np.array([799, 3499, 120, 199, 899])
print(prices, prices.dtype, prices.shape)

print(np.zeros(3), np.ones(3), np.arange(0, 10, 2), np.linspace(0, 1, 5))

rng = np.random.default_rng(seed=42)          # reproducible random numbers
print(rng.integers(1, 100, size=5))
```

```text
[ 799 3499  120  199  899] int64 (5,)
[0. 0. 0.] [1. 1. 1.] [0 2 4 6 8] [0.   0.25 0.5  0.75 1.  ]
[ 9 77 65 44 43]
```

## Vectorised operations

Operations apply to every element at once — no Python loops, and usually 10–100× faster:

```python
import numpy as np

prices = np.array([799, 3499, 120, 199, 899])
qty = np.array([2, 1, 10, 5, 1])

revenue = prices * qty
print(revenue, revenue.sum())
print(np.round(prices * 1.18, 2))             # add 18% GST to every price
print(prices.mean(), prices.max(), prices.argmax())
```

```text
[1598 3499 1200  995  899] 8191
[ 942.82 4128.82  141.6   234.82 1060.82]
1103.2 3499 1
```

## Boolean masks: filtering

A comparison produces an array of `True`/`False` that can select elements:

```python
import numpy as np

prices = np.array([799, 3499, 120, 199, 899])
expensive = prices > 500
print(expensive)
print(prices[expensive])
print(prices[(prices > 100) & (prices < 900)])   # combine with & and |, parentheses required
print(np.where(prices > 500, "premium", "budget"))
```

```text
[ True  True False False  True]
[ 799 3499  899]
[799 120 199 899]
['premium' 'premium' 'budget' 'budget' 'premium']
```

## Two-dimensional arrays

```python
import numpy as np

# rows = stores, columns = months
sales = np.array([
    [120, 135, 150],
    [ 90,  95, 110],
    [200, 180, 210],
])
print(sales.shape)
print(sales.sum(axis=0))      # total per month (down the columns)
print(sales.sum(axis=1))      # total per store (across the rows)
print(sales[:, -1])           # last month for every store
```

```text
(3, 3)
[410 410 470]
[405 295 590]
[150 110 210]
```

`axis=0` aggregates down the rows (one result per column); `axis=1` aggregates across the columns (one result per row).

## Broadcasting

Arrays of different shapes combine when the shapes are compatible:

```python
import numpy as np

sales = np.array([[120, 135, 150], [90, 95, 110], [200, 180, 210]])
monthly_targets = np.array([150, 150, 150])
print(sales - monthly_targets)                 # the target row is applied to every store
print(np.round(sales / sales.sum(axis=1, keepdims=True) * 100, 1))   # % share of each store's total
```

```text
[[-30 -15   0]
 [-60 -55 -40]
 [ 50  30  60]]
[[29.6 33.3 37. ]
 [30.5 32.2 37.3]
 [33.9 30.5 35.6]]
```

## Missing values: `NaN`

```python
import numpy as np

ratings = np.array([4.5, np.nan, 3.8, 5.0])
print(ratings.mean())         # nan — NaN spreads through calculations
print(np.nanmean(ratings))    # ignore NaN
```

```text
nan
4.433333333333334
```

## Why vectorisation matters

```python
import time
import numpy as np

values = np.random.default_rng(1).random(1_000_000)

start = time.perf_counter()
total = 0.0
for v in values:
    total += v * 1.18
loop_time = time.perf_counter() - start

start = time.perf_counter()
total_vec = (values * 1.18).sum()
vec_time = time.perf_counter() - start

print(f"loop is ~{loop_time / vec_time:.0f}x slower")
```

When working with data in Python, always look for the vectorised operation before writing a loop.

## Try it yourself

Create a 12×4 array of monthly sales for four regions using a seeded random generator. Compute each region's annual total, the best month for each region (`argmax` along the right axis), and each month's share of the annual total as percentages.
