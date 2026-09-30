Let's put everything together in a realistic analysis: an online store's leadership asks, **"Why did revenue drop in September, and what should we do about it?"** We'll go from raw data to a recommendation.

Each code block below is self-contained (it regenerates the same synthetic dataset), so you can run any step on its own.

## Step 1: The data

```python
import numpy as np
import pandas as pd

def make_orders(seed: int = 11) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 6000
    dates = pd.to_datetime("2026-06-01") + pd.to_timedelta(rng.integers(0, 122, n), unit="D")
    channel = rng.choice(["app", "web", "store"], n, p=[0.45, 0.4, 0.15])
    customer = rng.integers(1, 2200, n)
    amount = rng.gamma(2.2, 550, n).round()
    # September: web conversion problem → fewer, smaller web orders
    sep_web = (dates.month == 9) & (channel == "web")
    amount = np.where(sep_web, amount * 0.8, amount).round()
    keep = ~(sep_web & (rng.random(n) < 0.35))
    df = pd.DataFrame({"order_date": dates, "channel": channel, "customer_id": customer, "amount": amount})[keep]
    return df.sort_values("order_date").reset_index(drop=True)

orders = make_orders()
print(orders.head())
print(orders.shape)
```

```text
  order_date channel  customer_id  amount
0 2026-06-01     web         1473   920.0
1 2026-06-01     app         1962  1587.0
2 2026-06-01     web          437   848.0
3 2026-06-01     web         1633  1525.0
4 2026-06-01     web          423  4630.0
(5784, 4)
```

## Step 2: Check data quality

```python
import numpy as np
import pandas as pd

def make_orders(seed: int = 11) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 6000
    dates = pd.to_datetime("2026-06-01") + pd.to_timedelta(rng.integers(0, 122, n), unit="D")
    channel = rng.choice(["app", "web", "store"], n, p=[0.45, 0.4, 0.15])
    customer = rng.integers(1, 2200, n)
    amount = rng.gamma(2.2, 550, n).round()
    sep_web = (dates.month == 9) & (channel == "web")
    amount = np.where(sep_web, amount * 0.8, amount).round()
    keep = ~(sep_web & (rng.random(n) < 0.35))
    df = pd.DataFrame({"order_date": dates, "channel": channel, "customer_id": customer, "amount": amount})[keep]
    return df.sort_values("order_date").reset_index(drop=True)

orders = make_orders()
print(orders.isna().sum().to_dict())
print("non-positive amounts:", (orders["amount"] <= 0).sum())
print("date range:", orders["order_date"].min().date(), "→", orders["order_date"].max().date())
print(orders["amount"].describe().round(0))
```

```text
{'order_date': 0, 'channel': 0, 'customer_id': 0, 'amount': 0}
non-positive amounts: 0
date range: 2026-06-01 → 2026-09-30
count    5784.0
mean     1197.0
std       792.0
min        10.0
25%       613.0
50%      1043.0
75%      1586.0
max      6262.0
Name: amount, dtype: float64
```

No missing values, a complete date range, and a right-skewed amount distribution (mean above median) — as expected for order values. We'll report medians alongside means.

## Step 3: Confirm the problem

```python
import numpy as np
import pandas as pd

def make_orders(seed: int = 11) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 6000
    dates = pd.to_datetime("2026-06-01") + pd.to_timedelta(rng.integers(0, 122, n), unit="D")
    channel = rng.choice(["app", "web", "store"], n, p=[0.45, 0.4, 0.15])
    customer = rng.integers(1, 2200, n)
    amount = rng.gamma(2.2, 550, n).round()
    sep_web = (dates.month == 9) & (channel == "web")
    amount = np.where(sep_web, amount * 0.8, amount).round()
    keep = ~(sep_web & (rng.random(n) < 0.35))
    df = pd.DataFrame({"order_date": dates, "channel": channel, "customer_id": customer, "amount": amount})[keep]
    return df.sort_values("order_date").reset_index(drop=True)

orders = make_orders()
monthly = (
    orders.assign(month=orders["order_date"].dt.to_period("M"))
    .groupby("month")
    .agg(orders=("amount", "size"), revenue=("amount", "sum"), aov=("amount", "mean"))
)
monthly["revenue_mom_pct"] = (monthly["revenue"].pct_change() * 100).round(1)
print(monthly.round(0))
```

```text
         orders    revenue     aov  revenue_mom_pct
month
2026-06    1451  1787865.0  1232.0              NaN
2026-07    1488  1805637.0  1213.0              1.0
2026-08    1577  1911436.0  1212.0              6.0
2026-09    1268  1417941.0  1118.0            -26.0
```

## Step 4: Break it down by channel

```python
import numpy as np
import pandas as pd

def make_orders(seed: int = 11) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 6000
    dates = pd.to_datetime("2026-06-01") + pd.to_timedelta(rng.integers(0, 122, n), unit="D")
    channel = rng.choice(["app", "web", "store"], n, p=[0.45, 0.4, 0.15])
    customer = rng.integers(1, 2200, n)
    amount = rng.gamma(2.2, 550, n).round()
    sep_web = (dates.month == 9) & (channel == "web")
    amount = np.where(sep_web, amount * 0.8, amount).round()
    keep = ~(sep_web & (rng.random(n) < 0.35))
    df = pd.DataFrame({"order_date": dates, "channel": channel, "customer_id": customer, "amount": amount})[keep]
    return df.sort_values("order_date").reset_index(drop=True)

orders = make_orders()
orders["month"] = orders["order_date"].dt.to_period("M")
by_channel = orders.pivot_table(index="month", columns="channel", values="amount", aggfunc="sum").round(0)
print(by_channel)
print()
print("Aug → Sep change by channel (%):")
print((by_channel.pct_change().iloc[-1] * 100).round(1))
```

```text
channel       app     store       web
month
2026-06  771719.0  272952.0  743194.0
2026-07  876285.0  278066.0  651286.0
2026-08  836205.0  276653.0  798578.0
2026-09  808891.0  242421.0  366629.0

Aug → Sep change by channel (%):
channel
app      -3.3
store   -12.4
web     -54.1
Name: 2026-09, dtype: float64
```

Web revenue fell by more than half, while app was roughly flat (−3%). Store fell 12%, but it's a small channel — about ₹34k in absolute terms versus ₹4.3 lakh for web — so web is the priority (store goes on the follow-up list). Now separate **volume** (number of orders) from **value** (order size):

```python
import numpy as np
import pandas as pd

def make_orders(seed: int = 11) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 6000
    dates = pd.to_datetime("2026-06-01") + pd.to_timedelta(rng.integers(0, 122, n), unit="D")
    channel = rng.choice(["app", "web", "store"], n, p=[0.45, 0.4, 0.15])
    customer = rng.integers(1, 2200, n)
    amount = rng.gamma(2.2, 550, n).round()
    sep_web = (dates.month == 9) & (channel == "web")
    amount = np.where(sep_web, amount * 0.8, amount).round()
    keep = ~(sep_web & (rng.random(n) < 0.35))
    df = pd.DataFrame({"order_date": dates, "channel": channel, "customer_id": customer, "amount": amount})[keep]
    return df.sort_values("order_date").reset_index(drop=True)

orders = make_orders()
orders["month"] = orders["order_date"].dt.to_period("M").astype(str)
web = orders[orders["channel"] == "web"]
print(web.groupby("month").agg(orders=("amount", "size"), median_order=("amount", "median")).round(0))
```

```text
         orders  median_order
month
2026-06     592        1088.0
2026-07     548        1041.0
2026-08     656        1080.0
2026-09     365         886.0
```

Both the number of web orders **and** the typical web order size dropped in September.

## Step 5: Is the drop in order size significant?

```python
import numpy as np
import pandas as pd
from scipy import stats

def make_orders(seed: int = 11) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 6000
    dates = pd.to_datetime("2026-06-01") + pd.to_timedelta(rng.integers(0, 122, n), unit="D")
    channel = rng.choice(["app", "web", "store"], n, p=[0.45, 0.4, 0.15])
    customer = rng.integers(1, 2200, n)
    amount = rng.gamma(2.2, 550, n).round()
    sep_web = (dates.month == 9) & (channel == "web")
    amount = np.where(sep_web, amount * 0.8, amount).round()
    keep = ~(sep_web & (rng.random(n) < 0.35))
    df = pd.DataFrame({"order_date": dates, "channel": channel, "customer_id": customer, "amount": amount})[keep]
    return df.sort_values("order_date").reset_index(drop=True)

orders = make_orders()
web = orders[orders["channel"] == "web"]
aug = web[web["order_date"].dt.month == 8]["amount"]
sep = web[web["order_date"].dt.month == 9]["amount"]
u, p = stats.mannwhitneyu(aug, sep, alternative="two-sided")
print(f"web median Aug={aug.median():.0f}, Sep={sep.median():.0f}, Mann-Whitney p={p:.4f}")
```

```text
web median Aug=1080, Sep=886, Mann-Whitney p=0.0001
```

We use Mann–Whitney because order values are skewed.

## Step 6: Size the impact

```python
import numpy as np
import pandas as pd

def make_orders(seed: int = 11) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 6000
    dates = pd.to_datetime("2026-06-01") + pd.to_timedelta(rng.integers(0, 122, n), unit="D")
    channel = rng.choice(["app", "web", "store"], n, p=[0.45, 0.4, 0.15])
    customer = rng.integers(1, 2200, n)
    amount = rng.gamma(2.2, 550, n).round()
    sep_web = (dates.month == 9) & (channel == "web")
    amount = np.where(sep_web, amount * 0.8, amount).round()
    keep = ~(sep_web & (rng.random(n) < 0.35))
    df = pd.DataFrame({"order_date": dates, "channel": channel, "customer_id": customer, "amount": amount})[keep]
    return df.sort_values("order_date").reset_index(drop=True)

orders = make_orders()
orders["month"] = orders["order_date"].dt.month
web = orders[orders["channel"] == "web"]
baseline = web[web["month"].isin([6, 7, 8])].groupby("month")["amount"].sum().mean()
september = web[web["month"] == 9]["amount"].sum()
print(f"web revenue: Jun–Aug average ₹{baseline:,.0f}/month vs September ₹{september:,.0f}")
print(f"shortfall ≈ ₹{(baseline - september) / 1e5:,.1f} lakh in September")
```

```text
web revenue: Jun–Aug average ₹731,019/month vs September ₹366,629
shortfall ≈ ₹3.6 lakh in September
```

## Step 7: Diagnose the cause

Data shows *where* and *how much*; the *why* usually needs more context. Next steps an analyst would take:

- Check the release calendar: was there a web checkout or pricing change in early September?
- Examine the funnel (sessions → product views → cart → checkout → payment) for web vs. app to locate the drop.
- Segment by device (mobile web vs. desktop) and by browser.
- Check error logs and payment-gateway success rates for web.

Suppose the funnel shows the payment step's success rate on mobile web fell from 92% to 71% after a 2 September release.

## Step 8: Recommend

> **Headline:** September revenue fell 26% month over month, and web explains almost all of it: web revenue halved (−54%) through fewer and smaller orders, while app was roughly flat.
>
> **Evidence:** Web orders fell from 656 to 365 and the median web order from ₹1,080 to ₹886 (Mann–Whitney p < 0.001); app revenue changed by only −3%; the payment step's success rate on mobile web fell after the 2 September release.
>
> **Impact:** About ₹3.6 lakh of web revenue lost in September versus the channel's June–August run-rate — and continuing every month until fixed.
>
> **Recommendation:** Roll back or fix the mobile web payment change (owner: payments team, this sprint); add payment-success monitoring with alerts; re-run this analysis two weeks after the fix to confirm recovery.

## What made this analysis work

- A precise question and a clear metric (revenue, decomposed into orders × order value).
- Data-quality checks before analysis.
- Drilling down from the total to the segment that explains the change.
- Robust statistics for skewed data, and an impact estimate in money.
- A recommendation with an owner, a timeline and a way to verify success.

## Try it yourself

Use a public e-commerce dataset (for example, the Brazilian Olist dataset on Kaggle) and answer: "Which product categories drive customer dissatisfaction, and what would improving delivery times be worth?" Follow the same eight steps and present your findings on one page.
