Is the difference real, or just random noise? **Hypothesis tests** answer that question with probability. They're essential for A/B tests, comparing segments, and avoiding decisions based on coincidences.

## The logic

1. **Null hypothesis (H₀)** — "there is no difference/effect" (e.g. both checkout designs convert equally).
2. **Alternative (H₁)** — there is a difference.
3. Choose a **significance level** α (commonly 0.05) *before* looking at results.
4. Compute a **test statistic** and its **p-value**: the probability of seeing a result at least this extreme **if H₀ were true**.
5. If p < α, reject H₀ ("statistically significant"); otherwise, you don't have enough evidence.

A p-value is **not** the probability that H₀ is true, and "not significant" doesn't prove there's no effect — the test may simply lack enough data.

## Comparing two means: t-test

Did customers acquired via the app spend more than web customers?

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(10)
web = rng.normal(1500, 400, 200)
app = rng.normal(1580, 400, 200)

t, p = stats.ttest_ind(app, web, equal_var=False)     # Welch's t-test (doesn't assume equal variances)
print(f"mean web={web.mean():.0f}, app={app.mean():.0f}")
print(f"t={t:.2f}, p={p:.4f}")
```

```text
mean web=1403, app=1555
t=3.93, p=0.0001
```

Welch's t-test is a safe default for comparing two group means. For strongly skewed data or small samples, the non-parametric **Mann–Whitney U** test compares distributions without assuming normality:

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(10)
web = rng.lognormal(7.2, 0.5, 200)
app = rng.lognormal(7.3, 0.5, 200)
u, p = stats.mannwhitneyu(app, web, alternative="two-sided")
print(f"median web={np.median(web):.0f}, app={np.median(app):.0f}, p={p:.4f}")
```

```text
median web=1186, app=1437, p=0.0001
```

## Comparing proportions: chi-square test

Does conversion differ between two landing pages?

```python
import numpy as np
from scipy import stats

#                converted  not converted
table = np.array([[120,      1880],     # page A: 2,000 visitors
                  [165,      1835]])    # page B: 2,000 visitors
chi2, p, dof, expected = stats.chi2_contingency(table)
print(f"conversion A={120/2000:.1%}, B={165/2000:.1%}")
print(f"chi2={chi2:.2f}, p={p:.4f}")
```

```text
conversion A=6.0%, B=8.2%
chi2=7.31, p=0.0068
```

The chi-square test also works for larger tables (e.g. payment method × city).

## Confidence intervals

A 95% confidence interval gives a range of plausible values for the true effect — more informative than a yes/no significance decision:

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(10)
app = rng.normal(1580, 400, 200)
mean = app.mean()
sem = stats.sem(app)
low, high = stats.t.interval(0.95, df=len(app) - 1, loc=mean, scale=sem)
print(f"mean order value {mean:.0f} (95% CI {low:.0f}–{high:.0f})")
```

```text
mean order value 1483 (95% CI 1429–1537)
```

Report effects as "+₹80 per order (95% CI: +₹5 to +₹155)" — decision-makers can weigh both the size and the uncertainty.

## Statistical vs. practical significance

With enough data, tiny differences become "significant". A statistically significant 0.1% conversion lift may not be worth the engineering cost. Always report the **effect size** (difference in means or rates, relative lift) alongside the p-value, and judge it against business impact.

## Common pitfalls

- **Peeking** — checking results repeatedly and stopping as soon as p < 0.05 inflates false positives. Decide the sample size up front.
- **Multiple comparisons** — test 20 metrics and one will be "significant" by chance at α = 0.05. Pre-register a primary metric; adjust (e.g. Bonferroni) when testing many.
- **Non-independent data** — repeated measurements of the same users violate test assumptions; analyse at the right unit (user, not session).
- **Confusing correlation with causation** in observational data — hypothesis tests on non-randomised groups can still be confounded.

## Choosing a test

| Question | Test |
| --- | --- |
| Two group means (roughly normal) | Welch's t-test |
| Two groups, skewed / ordinal data | Mann–Whitney U |
| Before/after on the same subjects | Paired t-test / Wilcoxon signed-rank |
| Proportions / categorical association | Chi-square test (or z-test for two proportions) |
| Three or more group means | ANOVA (or Kruskal–Wallis) |
| Relationship between two numeric variables | Correlation test (Pearson/Spearman) |

## Try it yourself

Simulate two groups of 500 customers with slightly different average spend. Run a t-test, compute a 95% confidence interval for the difference, and repeat the simulation 1,000 times with **no** true difference — count how often p < 0.05. (You should see about 5% false positives.)
