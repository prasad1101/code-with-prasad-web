A good chart makes a pattern obvious in seconds; a bad one misleads. This lesson covers the main plotting libraries, choosing the right chart, and design principles that make charts clear and honest.

## The libraries

- **Matplotlib** — the foundation; full control over every element.
- **seaborn** — statistical charts with good defaults, built on Matplotlib, works directly with DataFrames.
- **pandas `.plot()`** — quick charts straight from a DataFrame (uses Matplotlib).
- **Plotly** — interactive charts (hover, zoom) for notebooks and web dashboards.

## Quick charts with pandas

```python
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")                     # render to files (not needed in Jupyter)
import matplotlib.pyplot as plt

days = pd.date_range("2026-07-01", periods=90, freq="D")
sales = pd.Series(1000 + np.arange(90) * 5 + np.random.default_rng(3).normal(0, 80, 90), index=days)

ax = sales.plot(figsize=(9, 4), alpha=0.4, label="Daily sales")
sales.rolling(7).mean().plot(ax=ax, linewidth=2, label="7-day average")
ax.set_title("Daily sales, Jul–Sep 2026")
ax.set_ylabel("Revenue (₹)")
ax.legend()
plt.tight_layout()
plt.savefig("daily_sales.png", dpi=150)
print("saved daily_sales.png")
```

```text
saved daily_sales.png
```

## Matplotlib's structure

A **Figure** contains one or more **Axes** (plots). Use the object-oriented API for anything beyond a quick plot:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

cities = ["Pune", "Mumbai", "Bengaluru", "Delhi"]
revenue = [5630, 3297, 2499, 5098]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

ax1.barh(cities, revenue, color="#6d28d9")
ax1.set_title("Revenue by city")
ax1.invert_yaxis()                              # largest at the top if sorted

ax2.plot(["Jul", "Aug", "Sep"], [4638, 4297, 8196], marker="o", color="#0891b2")
ax2.set_title("Monthly revenue")
ax2.set_ylim(0)                                 # start at zero

for spine in ("top", "right"):
    ax1.spines[spine].set_visible(False)
    ax2.spines[spine].set_visible(False)

fig.tight_layout()
fig.savefig("dashboard.png", dpi=150)
print("saved dashboard.png")
```

```text
saved dashboard.png
```

## Statistical charts with seaborn

```python
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

rng = np.random.default_rng(0)
orders = pd.DataFrame({
    "channel": rng.choice(["web", "app", "store"], 300),
    "amount": rng.gamma(2, 600, 300).round(),
})

fig, axes = plt.subplots(1, 2, figsize=(10, 4))
sns.histplot(data=orders, x="amount", bins=30, ax=axes[0])
axes[0].set_title("Distribution of order values")
sns.boxplot(data=orders, x="channel", y="amount", ax=axes[1])
axes[1].set_title("Order value by channel")
fig.tight_layout()
fig.savefig("distributions.png", dpi=150)
print(orders.groupby("channel")["amount"].median())
```

```text
channel
app      1066.0
store     956.0
web       875.5
Name: amount, dtype: float64
```

## Choosing the right chart

| Question | Chart |
| --- | --- |
| How does a value change over time? | Line chart |
| How do categories compare? | Bar chart (horizontal for long labels), sorted |
| What's the distribution? | Histogram, box plot, violin plot |
| How do two numeric variables relate? | Scatter plot (add a trend line) |
| What's the composition of a whole? | Stacked bar; pie only for 2–4 parts |
| How do two categories interact? | Heatmap of a pivot table |

## Design principles

1. **Start from the message.** Title charts with the insight: "Weekend sales are 35% higher" beats "Sales by weekday".
2. **Bar charts start at zero.** Truncated axes exaggerate differences.
3. **Sort bars** by value unless the categories have a natural order (months, sizes).
4. **Reduce clutter** — remove unnecessary gridlines, borders, 3-D effects and legends that repeat labels.
5. **Use colour with purpose** — highlight what matters; use grey for context; keep palettes colour-blind friendly.
6. **Label clearly** — axis labels with units, readable fonts, formatted numbers (₹1.2L, 12%).
7. **One idea per chart.** Several simple charts beat one complicated one.

## Highlighting the insight

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
avg_sales = [1210, 1195, 1230, 1220, 1260, 1640, 1625]
colors = ["#cbd5e1"] * 5 + ["#6d28d9"] * 2

fig, ax = plt.subplots(figsize=(7, 4))
ax.bar(weekdays, avg_sales, color=colors)
ax.set_title("Weekend sales are ~33% higher than weekdays", loc="left", fontweight="bold")
ax.set_ylabel("Average daily revenue (₹)")
for s in ("top", "right"):
    ax.spines[s].set_visible(False)
fig.tight_layout()
fig.savefig("weekend.png", dpi=150)
weekday_avg = sum(avg_sales[:5]) / 5
weekend_avg = sum(avg_sales[5:]) / 2
print(f"weekend uplift: {weekend_avg / weekday_avg - 1:.0%}")
```

```text
weekend uplift: 33%
```

(Always verify the number in your title against the data — here the computed uplift confirms the headline.)

## Interactive charts with Plotly

```python
import plotly.express as px

fig = px.line(df, x="date", y="revenue", color="city", title="Revenue by city")
fig.show()                          # interactive in Jupyter; fig.write_html("chart.html") to share
```

## Try it yourself

Using a sales dataset, create a one-page figure with four panels: monthly revenue (line), revenue by category (sorted horizontal bars), distribution of order values (histogram), and average order value by weekday (bars with weekends highlighted). Give each panel a title stating its insight.
