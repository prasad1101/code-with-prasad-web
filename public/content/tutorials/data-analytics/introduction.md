**Data analytics** turns raw data into answers and decisions: *Which products drive revenue? Why did sign-ups drop last month? Did the new checkout design increase conversion?* Analysts collect, clean, explore, analyse and communicate data — and it's one of the most in-demand skills across every industry.

## What a data analyst does

- **Asks the right question** — "increase revenue" becomes "which customer segments have the highest repeat-purchase rate?"
- **Gets the data** — from databases (SQL), spreadsheets, APIs, analytics tools.
- **Cleans and prepares it** — fixes missing values, duplicates, wrong types and inconsistent labels (often the majority of the work).
- **Explores and analyses** — summaries, trends, comparisons, statistical tests.
- **Communicates** — charts, dashboards and clear recommendations for decision-makers.

## Types of analytics

| Type | Question | Example |
| --- | --- | --- |
| Descriptive | What happened? | Revenue by month and region |
| Diagnostic | Why did it happen? | Revenue fell because repeat orders dropped in one city |
| Predictive | What is likely to happen? | Forecast next quarter's demand |
| Prescriptive | What should we do? | Which customers to target with a retention offer |

This course focuses on descriptive and diagnostic analytics, statistics and experimentation — the core of most analyst roles — and prepares you for predictive work.

## The analytics workflow

1. **Define** the question and the metric (and how you'll know the answer is useful).
2. **Collect** the relevant data.
3. **Clean** — handle missing, duplicate and invalid values.
4. **Explore** (EDA) — distributions, relationships, outliers.
5. **Analyse** — aggregate, compare segments, test hypotheses.
6. **Communicate** — visualise, tell the story, recommend actions.
7. **Automate** — turn repeated analyses into scheduled reports or dashboards.

## The toolkit

| Tool | Used for |
| --- | --- |
| **SQL** | Querying data where it lives (see the SQL course) |
| **Python** with **pandas** and **NumPy** | Cleaning, transforming, analysing |
| **Matplotlib / seaborn / Plotly** | Charts |
| **Jupyter notebooks** | Interactive exploration and sharing analyses |
| **Spreadsheets** | Quick checks and stakeholder-friendly outputs |
| **BI tools** (Power BI, Tableau, Looker, Metabase) | Dashboards for the business |
| **Statistics** (SciPy, statsmodels) | Confidence intervals, significance tests |

## A first taste

```python
import pandas as pd

orders = pd.DataFrame({
    "city": ["Pune", "Mumbai", "Pune", "Delhi", "Mumbai", "Pune"],
    "amount": [1200, 850, 430, 2200, 1500, 980],
})

summary = orders.groupby("city")["amount"].agg(["count", "sum", "mean"]).sort_values("sum", ascending=False)
print(summary)
```

```text
        count   sum    mean
city
Pune        3  2610   870.0
Mumbai      2  2350  1175.0
Delhi       1  2200  2200.0
```

Pune has the most orders and the highest total, while Delhi has the highest average order value from a single order. Notice how even this tiny summary raises new questions (is one Delhi order a pattern or a fluke?) — and that **sanity-checking every result** against what you expect is the most important habit an analyst can build.

## Prerequisites

Basic Python (variables, lists, dictionaries, functions, loops) — see the Python course's beginner chapters. Basic SQL helps for the SQL lesson.

## Try it yourself

Pick a question you care about (your monthly spending, a sports team's results, your city's weather). Write down the question, the metric that answers it, the data you'd need, and where you could get it.
