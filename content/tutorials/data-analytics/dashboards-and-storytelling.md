Analysis only creates value when it changes a decision. This lesson covers how to communicate findings: structuring a data story, designing dashboards people actually use, and presenting to stakeholders.

## Start with the decision

Before building anything, answer:

- **Who** is the audience (CEO, product manager, operations team)?
- **What decision** will they make with this?
- **Which few metrics** inform that decision?
- **How often** do they need it (one-off analysis, weekly review, real-time monitoring)?

A one-off analysis becomes a **report or presentation**; a recurring need becomes a **dashboard**.

## Structure a data story

Use a clear narrative arc — the same one consultants use:

1. **Context** — what we looked at and why.
2. **Key finding** — the headline, stated as a conclusion: "Repeat customers generate 62% of revenue but only 18% receive retention emails."
3. **Evidence** — two or three charts that prove it.
4. **Implication** — why it matters (size of the opportunity, risk).
5. **Recommendation** — a specific action, owner and expected impact.

Put the conclusion **first** (the "pyramid principle"). Busy readers may never reach slide 10.

### Write insight titles

| Descriptive (weak) | Insight (strong) |
| --- | --- |
| Revenue by month | Revenue grew 18% in Q3, driven entirely by the app |
| Conversion by device | Mobile web converts at half the app's rate |
| Orders by city | Pune has the highest order volume but the lowest margin |

## Quantify impact

Translate findings into business terms:

```python
monthly_visitors = 200_000
current_conversion = 0.021
average_order_value = 1_450

for uplift in (0.001, 0.002, 0.005):
    extra_orders = monthly_visitors * uplift
    print(f"+{uplift:.1%} conversion → +{extra_orders:,.0f} orders ≈ ₹{extra_orders * average_order_value / 1e5:,.1f} lakh / month")
```

```text
+0.1% conversion → +200 orders ≈ ₹2.9 lakh / month
+0.2% conversion → +400 orders ≈ ₹5.8 lakh / month
+0.5% conversion → +1,000 orders ≈ ₹14.5 lakh / month
```

"Improving mobile checkout conversion by half a point is worth about ₹14.5 lakh per month" gets attention in a way "conversion is 2.1%" doesn't.

## Dashboard design

### Layout

- **Top**: 3–5 headline KPIs with comparison (vs. last period, vs. target) — e.g. revenue ₹48.5L ▲13% MoM.
- **Middle**: trends over time for those KPIs.
- **Bottom**: breakdowns (by channel, region, product) that explain changes.
- Read left-to-right, top-to-bottom; most important information top-left.

### Principles

- **Fewer metrics, clearly defined.** Every metric needs a written definition (what counts as an "active user"?).
- **Context for every number** — a target, a previous period, or a benchmark. A number alone isn't information.
- **Consistent filters** (date range, region) applied across all charts.
- **Performance** — slow dashboards don't get used; pre-aggregate data.
- **Trust** — show data freshness ("updated 2 hours ago") and reconcile totals with finance/source systems.

### Tools

| Tool | Notes |
| --- | --- |
| Power BI | Popular in enterprises using Microsoft 365; DAX for measures |
| Tableau | Powerful visual exploration |
| Looker / Looker Studio | Governed metrics layer (LookML); free Looker Studio for Google data |
| Metabase / Superset | Open-source, quick to set up on your own database |
| Streamlit / Dash | Python-built interactive apps when you need custom logic |

A minimal Python dashboard with Streamlit:

```python
# app.py — run with: streamlit run app.py
import pandas as pd
import streamlit as st

df = pd.read_parquet("data/processed/daily_sales.parquet")
city = st.selectbox("City", ["All"] + sorted(df["city"].unique()))
view = df if city == "All" else df[df["city"] == city]

col1, col2 = st.columns(2)
col1.metric("Revenue", f"₹{view['revenue'].sum():,.0f}")
col2.metric("Orders", f"{view['orders'].sum():,}")
st.line_chart(view.groupby("date")["revenue"].sum())
```

## Presenting to stakeholders

- Lead with the answer; keep methodology in an appendix.
- Anticipate questions ("is this seasonal?", "what about returns?") and have backup slides.
- State limitations and confidence honestly — credibility is an analyst's most valuable asset.
- End with a clear ask: a decision, an owner and a date.

## Metric hygiene

- Maintain a **metrics dictionary**: name, definition, SQL/logic, owner, known caveats.
- Version-control the queries behind dashboards.
- Monitor data quality (row counts, null rates, freshness) so dashboards don't silently break.

## Try it yourself

Take one analysis from this course and produce: a one-page summary with a headline finding, three supporting charts with insight titles, a quantified impact estimate and a recommendation. Then sketch a dashboard for the same topic with 4 KPIs, 2 trend charts and 2 breakdowns, and write definitions for each metric.
