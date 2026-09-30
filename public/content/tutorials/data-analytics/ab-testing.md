An **A/B test** randomly splits users between a control (A) and a variant (B) and compares a metric — the gold standard for learning whether a change *causes* an improvement. Product, marketing and growth teams run them constantly; analysts design and interpret them.

## 1. Design before you launch

- **Hypothesis**: "Showing delivery dates on product pages will increase add-to-cart rate."
- **Primary metric**: one metric that decides the test (add-to-cart rate). Add **guardrail metrics** that must not get worse (page load time, refund rate).
- **Unit of randomisation**: usually the user (not the page view), so each person consistently sees one version.
- **Minimum detectable effect (MDE)**: the smallest lift worth detecting (e.g. +1 percentage point).
- **Sample size and duration**: calculated up front — and run for full weeks to cover weekly cycles.

## 2. Sample size

How many users per group are needed to detect the MDE with enough power?

```python
import math
from scipy.stats import norm

def sample_size_per_group(baseline: float, mde: float, alpha: float = 0.05, power: float = 0.8) -> int:
    """Two-sided test for the difference between two proportions."""
    p1, p2 = baseline, baseline + mde
    z_alpha = norm.ppf(1 - alpha / 2)
    z_beta = norm.ppf(power)
    p_bar = (p1 + p2) / 2
    n = ((z_alpha * math.sqrt(2 * p_bar * (1 - p_bar)) + z_beta * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) / mde ** 2
    return math.ceil(n)

print(sample_size_per_group(baseline=0.10, mde=0.01))    # 10% → 11%
print(sample_size_per_group(baseline=0.10, mde=0.02))    # 10% → 12%
```

```text
14751
3841
```

Halving the detectable effect roughly **quadruples** the sample needed. If you can't reach the sample size in a reasonable time, test a bolder change.

## 3. Run the test

- Randomise with a stable hash of the user id so assignment is consistent.
- Check the **sample ratio** early: a 50/50 split that comes out 52/48 on large numbers signals a bug (a **sample ratio mismatch**) that invalidates results.
- **Don't peek and stop early** when it looks significant.

```python
from scipy.stats import chisquare

control_users, variant_users = 50_410, 49_590
stat, p = chisquare([control_users, variant_users])
print(f"SRM check p-value: {p:.4f}")      # a very small p suggests broken assignment
```

```text
SRM check p-value: 0.0095
```

## 4. Analyse the results

```python
import numpy as np
from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep

conversions = np.array([5_120, 5_480])       # control, variant
users = np.array([50_000, 50_000])

rate_a, rate_b = conversions / users
z, p = proportions_ztest(conversions, users)
low, high = confint_proportions_2indep(conversions[1], users[1], conversions[0], users[0], compare="diff")

print(f"control {rate_a:.2%}, variant {rate_b:.2%}")
print(f"absolute lift {rate_b - rate_a:+.2%} (95% CI {low:+.2%} to {high:+.2%}), relative lift {rate_b / rate_a - 1:+.1%}")
print(f"p-value {p:.4f}")
```

```text
control 10.24%, variant 10.96%
absolute lift +0.72% (95% CI +0.34% to +1.10%), relative lift +7.0%
p-value 0.0002
```

Report the lift, its confidence interval and the p-value — plus guardrail metrics and any important segment differences.

## 5. Decide

| Result | Decision |
| --- | --- |
| Significant improvement, guardrails fine | Ship B |
| Significant harm | Keep A; learn why |
| Not significant, CI includes meaningful effects | Inconclusive — more data or a bolder test |
| Not significant, CI excludes meaningful effects | No worthwhile effect; keep the simpler option |

## Common pitfalls

- **Peeking / early stopping** — inflates false positives. Use fixed durations or sequential-testing methods designed for continuous monitoring.
- **Too many metrics** — one primary metric; treat the rest as exploratory.
- **Novelty effects** — users react to anything new; run long enough (and check whether the effect fades).
- **Interference** — users in different groups affect each other (marketplaces, social features); randomise by cluster or region.
- **Segment fishing** — "it worked for iOS users in Pune on Tuesdays" is usually noise. Pre-specify segments.
- **Revenue metrics are noisy** — heavy-tailed spend needs larger samples; consider trimming extreme values or using per-user metrics.

## Beyond classic A/B tests

- **A/B/n** tests compare several variants (adjust for multiple comparisons).
- **Bayesian** analysis reports "probability that B beats A" — intuitive for stakeholders.
- **CUPED** (variance reduction using pre-experiment data) reaches conclusions with fewer users.
- **Multi-armed bandits** shift traffic toward winning variants — good for short-lived optimisation (headlines, offers), less so for learning.

## Try it yourself

Design an A/B test for a free-shipping threshold change (₹499 → ₹399): hypothesis, primary and guardrail metrics, MDE, sample size at a 12% baseline conversion, duration given 20,000 daily users, and the decision rules. Then simulate results with a true +0.8 point lift and analyse them.
