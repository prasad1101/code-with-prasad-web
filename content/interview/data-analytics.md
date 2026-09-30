## What does a data analyst do, and how is it different from a data scientist or data engineer?
Level: Beginner | Tags: roles

- **Data analyst** — answers business questions with data: querying (SQL), cleaning, analysing, visualising and communicating insights; runs A/B test analyses and builds dashboards.
- **Data scientist** — builds predictive and statistical models (forecasting, recommendation, classification), designs experiments, often more advanced statistics and ML.
- **Data engineer** — builds and maintains the pipelines, warehouses and data models that analysts and scientists rely on.

The roles overlap; analysts who can also write production-quality SQL and Python are highly valued.

## Walk me through how you would approach a new analysis request.
Level: Beginner | Tags: process

1. **Clarify** the business question and the decision it supports; agree on the metric and definitions.
2. **Find the data** and understand its grain, sources and limitations.
3. **Clean and validate** — duplicates, missing values, types, outliers; reconcile totals with a trusted source.
4. **Explore** — distributions, trends, segments.
5. **Analyse** — aggregate, compare, test hypotheses; quantify impact.
6. **Communicate** — headline finding first, supporting charts, recommendation with owner and next steps.
7. **Follow up** — measure whether the action worked; automate if recurring.

## How do you handle missing data?
Level: Intermediate | Tags: data-cleaning

First understand **why** it's missing (not recorded, not applicable, system error) and how much. Options:

- **Drop** rows when the field is essential and few rows are affected (and the missingness is random).
- **Fill with a label** ("Unknown") for categories to keep rows and make gaps visible.
- **Impute** with median/mode, group-level statistics, or forward-fill for time series — carefully, as imputation can bias results.
- **Keep as missing** when absence is meaningful (no coupon used), or add a "was missing" flag.

Always document the choice and its impact on row counts.

## What is the difference between mean and median, and when would you use each?
Level: Beginner | Tags: statistics

The mean is the arithmetic average; the median is the middle value. The mean is sensitive to outliers and skew; the median is robust. For skewed data (incomes, order values, response times) report the median (or both); for roughly symmetric data the mean is fine and has useful mathematical properties. When mean ≫ median, the data is right-skewed.

## How do you detect and treat outliers?
Level: Intermediate | Tags: data-cleaning, statistics

Detect with visualisation (box plots, histograms, scatter plots) and rules such as the IQR rule (below Q1 − 1.5×IQR or above Q3 + 1.5×IQR) or z-scores for roughly normal data. Then **investigate**: data errors (a price of ₹0 or 10⁹) should be fixed or removed; genuine extreme values (a large corporate order) should usually be kept. Options include analysing with and without them, capping (winsorising), using robust statistics (median, IQR) or segmenting them separately.

## Explain INNER, LEFT and FULL OUTER joins, and a common mistake when joining.
Level: Beginner | Tags: sql, joins

- **INNER** — only matching rows.
- **LEFT** — all rows from the left table plus matches (NULLs where none).
- **FULL OUTER** — all rows from both sides.

Common mistakes: rows silently disappearing in inner joins (check row counts, use indicators/anti-joins), and **fan-out** — joining to a table where the key isn't unique multiplies rows and inflates sums. Validate key uniqueness (`validate="many_to_one"` in pandas) and aggregate at the right grain before joining.

## What is the difference between WHERE and HAVING?
Level: Beginner | Tags: sql

`WHERE` filters rows before aggregation; `HAVING` filters groups after `GROUP BY` and can use aggregates (`HAVING COUNT(*) > 5`). Filter in `WHERE` when possible for efficiency.

## How would you calculate month-over-month growth in SQL and pandas?
Level: Intermediate | Tags: sql, pandas, time-series

SQL with a window function:

```sql
WITH monthly AS (SELECT DATE_TRUNC('month', ordered_at) AS month, SUM(amount) AS revenue FROM orders GROUP BY 1)
SELECT month, revenue,
       100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month) AS mom_pct
FROM monthly;
```

pandas: `monthly = df.resample("ME", on="date")["amount"].sum(); monthly.pct_change() * 100`. Make sure every month exists (fill gaps) so `LAG`/`shift` compares adjacent months.

## What are window functions and why are they useful for analysts?
Level: Intermediate | Tags: sql

Window functions compute values across related rows without collapsing them: rankings (`ROW_NUMBER`, `RANK`), running totals (`SUM() OVER (ORDER BY date)`), moving averages (frames), previous/next values (`LAG`/`LEAD`), and percent of total (`SUM(x) OVER ()`). They make "top N per group", period-over-period growth, retention and sessionisation queries concise.

## What is a p-value?
Level: Intermediate | Tags: statistics, hypothesis-testing

The probability of observing a result at least as extreme as the one seen, **assuming the null hypothesis is true**. A small p-value (below the pre-chosen α, often 0.05) suggests the data is unlikely under H₀, so we reject it. It is **not** the probability that H₀ is true, and it says nothing about the size or importance of the effect — report effect sizes and confidence intervals too.

## What are Type I and Type II errors?
Level: Intermediate | Tags: statistics

- **Type I (false positive)** — concluding there's an effect when there isn't; its probability is α (e.g. 5%).
- **Type II (false negative)** — missing a real effect; probability β. **Power** = 1 − β (commonly targeted at 80%).

Increasing sample size reduces Type II errors without raising α. Peeking at results and testing many metrics inflate Type I errors.

## How do you design and analyse an A/B test?
Level: Advanced | Tags: ab-testing, experimentation

Design: hypothesis, one primary metric plus guardrails, randomisation unit (usually user), minimum detectable effect, sample size from a power calculation, and a fixed duration covering full weekly cycles.

Run: consistent assignment, check for sample ratio mismatch, avoid peeking.

Analyse: difference in means/proportions with confidence intervals and p-values (t-test, z-test for proportions, or Mann–Whitney for skewed metrics), check guardrails and pre-specified segments, then decide based on practical as well as statistical significance.

## What is a sample ratio mismatch and why does it matter?
Level: Advanced | Tags: ab-testing

When the observed split between groups differs significantly from the intended split (e.g. 52/48 instead of 50/50 on 100k users, checked with a chi-square test). It signals a bug in assignment, tracking or filtering (e.g. one variant crashes for some users), which can bias results — the test's conclusions shouldn't be trusted until the cause is found.

## What's the difference between correlation and causation? How can you establish causation?
Level: Intermediate | Tags: statistics

Correlation means two variables move together; causation means changing one changes the other. Correlations can arise from confounders (both driven by a third factor), reverse causality or chance. Establish causation with **randomised experiments** (A/B tests) where possible; otherwise use quasi-experimental methods (difference-in-differences, regression discontinuity, instrumental variables) with careful assumptions.

## What is Simpson's paradox?
Level: Advanced | Tags: statistics

A trend that appears in several groups reverses (or disappears) when the groups are combined, because group sizes or compositions differ. Example: variant B converts better on both mobile and desktop, but worse overall because it received mostly mobile traffic, which converts lower. Always check key segments and compute rates from totals, not averages of rates.

## How would you investigate a sudden drop in a key metric (e.g. daily orders fell 20%)?
Level: Advanced | Tags: analysis, case-study

1. **Verify the data** — tracking or pipeline issue? Compare sources, check data freshness and recent deployments.
2. **Scope it** — when exactly did it start; is it sudden or gradual; is it seasonal (compare same period last year/week)?
3. **Segment** — by channel, platform, device, region, customer type, product, traffic source; find where the drop concentrates.
4. **Decompose the metric** — orders = visitors × conversion; revenue = orders × AOV; walk down the funnel to find the failing step.
5. **Check external factors** — releases, pricing changes, outages, competitor promotions, holidays.
6. **Quantify and recommend** — impact in money, likely cause, action and owner.

## What is cohort analysis?
Level: Intermediate | Tags: analysis, retention

Grouping users by a shared starting point (usually signup or first-purchase month) and tracking their behaviour over time (retention, revenue per user). The resulting cohort table/triangle shows whether newer cohorts retain better than older ones — separating product improvements from the effects of growth in new users, which aggregate metrics hide.

## How do you calculate retention and churn?
Level: Intermediate | Tags: metrics

- **Retention (period N)** = users from a cohort active in period N ÷ users in the cohort.
- **Churn rate** = customers lost during a period ÷ customers at the start of the period.

Define "active" and the period carefully (daily/weekly/monthly), handle reactivations explicitly, and compute from counts rather than averaging percentages across differently sized cohorts.

## What makes a good dashboard?
Level: Intermediate | Tags: visualisation, dashboards

A clear audience and purpose; a few well-defined KPIs with context (targets, previous period); trends and breakdowns that explain changes; consistent filters; fast load times; data-freshness indicators; documented metric definitions; and visual design that highlights what matters (sorted bars, zero-based axes, minimal clutter, purposeful colour). Dashboards should support decisions, not display every available number.

## How do you choose the right chart?
Level: Beginner | Tags: visualisation

- Trend over time → line chart.
- Compare categories → sorted bar chart (horizontal for long labels).
- Distribution → histogram or box plot.
- Relationship between two numeric variables → scatter plot.
- Part-to-whole → stacked bar (pie only for 2–4 parts).
- Two categorical dimensions → heatmap.

Title charts with the insight, start bar axes at zero, and highlight the key data point.

## How do you work with datasets too large for pandas?
Level: Advanced | Tags: performance, big-data

Load less (`usecols`, efficient dtypes such as `category`, `int32`), process in chunks for combinable aggregations, use Parquet instead of CSV, push aggregation to the database/warehouse with SQL, or use engines designed for larger data on one machine — DuckDB (SQL over files, out-of-core) and Polars (multi-threaded, lazy execution). For distributed scale, Spark.

## Explain `groupby` + `transform` vs. `groupby` + `agg` in pandas.
Level: Intermediate | Tags: pandas

`agg` returns **one row per group** (e.g. total revenue per city). `transform` returns a result **aligned with the original rows** (each row gets its group's total), enabling row-level comparisons like percent of group total, deviation from group mean or within-group normalisation — similar to SQL window functions with `PARTITION BY`.

## What is the difference between `loc` and `iloc`?
Level: Beginner | Tags: pandas

`loc` selects by **labels** (index values and column names; slices include the end); `iloc` selects by **integer position** (slices exclude the end). Use `loc` with boolean conditions for filtering and assignment: `df.loc[df["city"] == "Pune", "region"] = "West"` — avoiding chained assignment, which doesn't modify the original under pandas' Copy-on-Write.

## How do you ensure your analysis is accurate?
Level: Intermediate | Tags: quality

- Reconcile totals with trusted sources (finance reports, source systems).
- Check row counts after every join and filter; watch for duplicates and fan-out.
- Validate assumptions about grain, time zones and definitions.
- Sanity-check results against intuition and historical ranges; investigate surprises.
- Make analyses reproducible (code, versioned queries, raw data kept read-only) and ask a peer to review key numbers.

## What KPIs would you track for an e-commerce business?
Level: Intermediate | Tags: metrics, business

Revenue, orders, average order value, conversion rate (sessions → orders), funnel step conversion (view → cart → checkout → payment), customer acquisition cost (CAC), customer lifetime value (LTV) and LTV/CAC, repeat-purchase rate and retention by cohort, churn, return/refund rate, gross margin, delivery time and on-time rate, and customer satisfaction (NPS/CSAT). Choose a few that align with current business goals.

## How would you explain a complex finding to a non-technical stakeholder?
Level: Beginner | Tags: communication

Lead with the conclusion and its business impact in plain language; support it with one or two simple, well-labelled charts; use concrete examples and money or customer numbers rather than statistical jargon; state confidence and limitations briefly; and finish with a specific recommendation and next step. Adapt depth to the audience and keep methodology in an appendix.

## What is data normalisation vs. standardisation in feature preparation?
Level: Intermediate | Tags: statistics, preprocessing

- **Min–max normalisation** rescales values to a fixed range (usually 0–1): `(x − min) / (max − min)`; sensitive to outliers.
- **Standardisation (z-score)** centres to mean 0 and standard deviation 1: `(x − mean) / std`.

Used when comparing variables on different scales or before distance-based and many ML algorithms. (Not to be confused with database normalisation, which organises tables to reduce redundancy.)
