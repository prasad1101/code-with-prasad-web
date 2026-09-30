Much business data is indexed by time: daily revenue, hourly traffic, monthly sign-ups. pandas has first-class support for time series — resampling, rolling windows, period comparisons and date-aware indexing.

## A daily sales series

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
days = pd.date_range("2026-06-01", "2026-09-30", freq="D")
trend = np.linspace(1000, 1600, len(days))
weekly = np.where(days.dayofweek >= 5, 400, 0)           # weekend boost
sales = pd.Series(np.round(trend + weekly + rng.normal(0, 120, len(days))), index=days, name="sales")
sales.to_csv("daily_sales.csv")
print(sales.head())
print(len(sales), "days")
```

```text
2026-06-01    1000.0
2026-06-02    1041.0
2026-06-03     977.0
2026-06-04     908.0
2026-06-05     965.0
Freq: D, Name: sales, dtype: float64
122 days
```

## Date-based selection

With a `DatetimeIndex`, select by date strings:

```python
import numpy as np
import pandas as pd

days = pd.date_range("2026-06-01", "2026-09-30", freq="D")
sales = pd.Series(np.arange(len(days)) * 10 + 1000.0, index=days)

print(sales.loc["2026-09-01":"2026-09-03"])
print(sales.loc["2026-08"].sum())          # the whole of August
```

```text
2026-09-01    1920.0
2026-09-02    1930.0
2026-09-03    1940.0
Freq: D, dtype: float64
54560.0
```

## Resampling: changing frequency

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
days = pd.date_range("2026-06-01", "2026-09-30", freq="D")
sales = pd.Series(np.round(np.linspace(1000, 1600, len(days)) + np.where(days.dayofweek >= 5, 400, 0) + rng.normal(0, 120, len(days))), index=days)

monthly = sales.resample("ME").sum()          # month end
weekly = sales.resample("W-MON").mean()      # weeks ending Monday
print(monthly)
print(weekly.head(3).round(1))
```

```text
2026-06-30    33866.0
2026-07-31    41124.0
2026-08-31    46497.0
2026-09-30    48543.0
Freq: ME, dtype: float64
2026-06-01    1000.0
2026-06-08    1118.6
2026-06-15    1149.6
Freq: W-MON, dtype: float64
```

Common frequencies: `"D"` day, `"W"` week, `"ME"` month end, `"MS"` month start, `"QE"` quarter end, `"YE"` year end, `"h"` hour.

## Growth rates

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
days = pd.date_range("2026-06-01", "2026-09-30", freq="D")
sales = pd.Series(np.round(np.linspace(1000, 1600, len(days)) + np.where(days.dayofweek >= 5, 400, 0) + rng.normal(0, 120, len(days))), index=days)

monthly = sales.resample("ME").sum().to_frame("revenue")
monthly["mom_growth_pct"] = (monthly["revenue"].pct_change() * 100).round(1)
monthly["prev_month"] = monthly["revenue"].shift(1)
print(monthly)
```

```text
            revenue  mom_growth_pct  prev_month
2026-06-30  33866.0             NaN         NaN
2026-07-31  41124.0            21.4     33866.0
2026-08-31  46497.0            13.1     41124.0
2026-09-30  48543.0             4.4     46497.0
```

`shift(1)` moves values down one period (the previous value); `shift(12)` on monthly data gives the same month last year.

## Rolling windows

Smooth noisy daily data to see the trend:

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
days = pd.date_range("2026-06-01", "2026-09-30", freq="D")
sales = pd.Series(np.round(np.linspace(1000, 1600, len(days)) + np.where(days.dayofweek >= 5, 400, 0) + rng.normal(0, 120, len(days))), index=days)

smoothed = pd.DataFrame({
    "sales": sales,
    "avg_7d": sales.rolling(7).mean().round(1),
    "sum_28d": sales.rolling(28).sum(),
})
print(smoothed.tail(3))
print(sales.expanding().max().tail(1))   # running maximum
```

```text
             sales  avg_7d  sum_28d
2026-09-28  1613.0  1680.4  45408.0
2026-09-29  1606.0  1688.3  45599.0
2026-09-30  1529.0  1682.4  45541.0
2026-09-30    2180.0
Freq: D, dtype: float64
```

A 7-day rolling average removes the weekday/weekend pattern, revealing the underlying trend.

## Seasonality: day-of-week pattern

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
days = pd.date_range("2026-06-01", "2026-09-30", freq="D")
sales = pd.Series(np.round(np.linspace(1000, 1600, len(days)) + np.where(days.dayofweek >= 5, 400, 0) + rng.normal(0, 120, len(days))), index=days)

by_weekday = sales.groupby(sales.index.day_name()).mean().round(0)
order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
print(by_weekday.reindex(order))
```

```text
Monday       1277.0
Tuesday      1265.0
Wednesday    1308.0
Thursday     1249.0
Friday       1315.0
Saturday     1669.0
Sunday       1692.0
dtype: float64
```

## Filling gaps

Transactional data only has rows for days *with* activity. Reindex to a complete calendar before computing averages or plotting:

```python
import pandas as pd

sparse = pd.Series([500, 700, 650], index=pd.to_datetime(["2026-09-01", "2026-09-03", "2026-09-06"]))
full = sparse.reindex(pd.date_range("2026-09-01", "2026-09-06"), fill_value=0)
print(full)
print("true daily average:", full.mean().round(1), "vs naive:", sparse.mean().round(1))
```

```text
2026-09-01    500
2026-09-02      0
2026-09-03    700
2026-09-04      0
2026-09-05      0
2026-09-06    650
Freq: D, dtype: int64
true daily average: 308.3 vs naive: 616.7
```

## Time zones

```python
import pandas as pd

events = pd.Series([1, 1], index=pd.to_datetime(["2026-09-30 20:30", "2026-09-30 23:45"]).tz_localize("UTC"))
print(events.tz_convert("Asia/Kolkata"))
```

```text
2026-10-01 02:00:00+05:30    1
2026-10-01 05:15:00+05:30    1
dtype: int64
```

Store timestamps in UTC; convert to local time before grouping by day — otherwise "daily" totals follow UTC days, not your customers' days.

## Forecasting (preview)

Simple baselines — last year's value, a moving average, or trend + seasonality decomposition (`statsmodels.tsa.seasonal_decompose`) — are often good enough and easy to explain. For more, libraries like statsmodels (ARIMA/ETS) and Prophet provide statistical forecasting models.

## Try it yourself

With the generated daily series: compute weekly totals and week-over-week growth, find the best and worst weeks, plot the raw series with a 7-day rolling average, and estimate how much higher weekend sales are than weekday sales on average.
