Descriptive statistics summarise data with a few numbers: where the "middle" is, how spread out values are, and how variables relate. They're the foundation of every report — and choosing the wrong one (a mean on skewed data) is a classic way to mislead.

## Central tendency: mean, median, mode

```python
import numpy as np
import pandas as pd

order_values = pd.Series([450, 520, 610, 580, 700, 640, 590, 15_000])   # one huge corporate order
print("mean:  ", round(order_values.mean(), 1))
print("median:", order_values.median())
print("mode:  ", pd.Series(["UPI", "Card", "UPI", "COD", "UPI"]).mode()[0])
```

```text
mean:   2386.2
median: 600.0
mode:   UPI
```

The single ₹15,000 order drags the mean far above what a typical customer spends. For **skewed** data (incomes, order values, response times), report the **median** — or both.

## Spread: range, variance, standard deviation, percentiles

```python
import pandas as pd

delivery_days = pd.Series([2, 3, 3, 4, 2, 5, 3, 7, 3, 4])
print("range:", delivery_days.max() - delivery_days.min())
print("std:  ", round(delivery_days.std(), 2))                 # sample standard deviation
print(delivery_days.quantile([0.25, 0.5, 0.75, 0.9]))
print("IQR:  ", delivery_days.quantile(0.75) - delivery_days.quantile(0.25))
```

```text
range: 5
std:   1.51
0.25    3.0
0.50    3.0
0.75    4.0
0.90    5.2
dtype: float64
IQR:   1.0
```

- **Standard deviation** — typical distance from the mean (same units as the data).
- **Percentiles** — "90% of orders arrive within X days" is often more useful to the business than an average. Latency and SLA reporting use p50/p90/p99.
- **IQR** (interquartile range) — spread of the middle 50%, robust to outliers.

## Distribution shape

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
symmetric = pd.Series(rng.normal(1000, 150, 5000))
skewed = pd.Series(rng.lognormal(6.5, 0.6, 5000))
print("skew (symmetric):", round(symmetric.skew(), 2))
print("skew (right-skewed):", round(skewed.skew(), 2))
print("right-skewed mean vs median:", round(skewed.mean()), round(skewed.median()))
```

```text
skew (symmetric): 0.0
skew (right-skewed): 2.4
right-skewed mean vs median: 800 657
```

Positive skew (a long right tail) means mean > median. Always look at a histogram before summarising.

## Summaries by group

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(1)
orders = pd.DataFrame({
    "channel": rng.choice(["web", "app"], 1000),
    "amount": rng.gamma(2, 600, 1000).round(),
})
print(orders.groupby("channel")["amount"].describe(percentiles=[0.5, 0.9]).round(0))
```

```text
         count    mean    std   min     50%     90%     max
channel
app      491.0  1135.0  793.0   9.0   945.0  2183.0  4644.0
web      509.0  1251.0  871.0  38.0  1009.0  2473.0  4636.0
```

## Relationships: correlation

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(3)
n = 200
ad_spend = rng.uniform(1000, 10_000, n)
visits = ad_spend * 0.8 + rng.normal(0, 1200, n)
returns = rng.uniform(0, 50, n)                     # unrelated
df = pd.DataFrame({"ad_spend": ad_spend, "visits": visits, "returns": returns})
print(df.corr().round(2))
```

```text
          ad_spend  visits  returns
ad_spend      1.00    0.85    -0.00
visits        0.85    1.00     0.03
returns      -0.00    0.03     1.00
```

The Pearson correlation coefficient ranges from −1 to 1:

| |r| | Strength |
| --- | --- |
| < 0.1 | Negligible |
| 0.1–0.3 | Weak |
| 0.3–0.5 | Moderate |
| > 0.5 | Strong |

Important caveats:

- **Correlation is not causation.** Ice-cream sales and drownings are correlated (both rise in summer). Establishing cause needs experiments (A/B tests) or careful causal methods.
- Pearson only measures **linear** relationships; use Spearman (`df.corr(method="spearman")`) for monotonic but non-linear relationships or ranked data.
- Outliers can create or hide correlations — always plot a scatter chart.

## Rates and ratios

Business metrics are often ratios: conversion rate, churn rate, average order value. Two traps:

```python
import pandas as pd

# Averaging percentages across groups of different sizes is wrong
segments = pd.DataFrame({"visitors": [100, 10_000], "orders": [20, 500]})
segments["rate"] = segments["orders"] / segments["visitors"]
print("wrong (mean of rates):", round(segments["rate"].mean(), 3))
print("right (total/total):  ", round(segments["orders"].sum() / segments["visitors"].sum(), 3))
```

```text
wrong (mean of rates): 0.125
right (total/total):   0.051
```

Also beware **Simpson's paradox**: a trend in every subgroup can reverse when the groups are combined, if group sizes differ. Always check whether a headline result holds within key segments.

## Try it yourself

For a dataset of orders, report: mean and median order value (and explain the difference), the p90 delivery time, the standard deviation of daily revenue, the correlation between discount and quantity, and the overall conversion rate computed correctly from segment totals.
