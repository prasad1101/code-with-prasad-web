**Regular expressions** (regex) describe text patterns: "an email address", "a 6-digit PIN code", "a date like 30/09/2026". Python's `re` module uses them to search, validate, extract and replace text.

## Basic matching

```python
import re

text = "Order SO-1042 shipped to Pune 411001 on 2026-09-30"

print(re.search(r"\d{6}", text).group())        # 411001 — first match anywhere
print(re.findall(r"\d+", text))                  # ['1042', '411001', '2026', '09', '30']
print(bool(re.fullmatch(r"\d{6}", "411001")))    # True — the whole string must match
```

Use **raw strings** (`r"..."`) for patterns so backslashes aren't interpreted by Python first.

| Function | Returns |
| --- | --- |
| `re.search(p, s)` | First match anywhere (or `None`) |
| `re.match(p, s)` | Match at the start (or `None`) |
| `re.fullmatch(p, s)` | Match of the entire string (or `None`) — best for validation |
| `re.findall(p, s)` | List of all matches |
| `re.finditer(p, s)` | Iterator of match objects |
| `re.sub(p, repl, s)` | String with matches replaced |
| `re.split(p, s)` | List split on the pattern |

## Pattern building blocks

| Pattern | Matches |
| --- | --- |
| `.` | Any character except newline |
| `\d` / `\D` | Digit / non-digit |
| `\w` / `\W` | Word character (letters, digits, `_`) / non-word |
| `\s` / `\S` | Whitespace / non-whitespace |
| `[aeiou]`, `[A-Z0-9]` | Character sets and ranges |
| `[^0-9]` | Anything except digits |
| `^` / `$` | Start / end of string (or line with `re.MULTILINE`) |
| `\b` | Word boundary |
| `a|b` | `a` or `b` |

### Quantifiers

| Quantifier | Meaning |
| --- | --- |
| `*` | 0 or more |
| `+` | 1 or more |
| `?` | 0 or 1 |
| `{3}` | Exactly 3 |
| `{2,4}` | 2 to 4 |

Quantifiers are **greedy** (match as much as possible); add `?` to make them lazy: `.*?`.

## Groups: extracting parts

```python
import re

match = re.search(r"(\d{4})-(\d{2})-(\d{2})", "Delivered on 2026-09-30")
year, month, day = match.groups()
print(year, month, day)   # 2026 09 30

# Named groups are clearer
m = re.search(r"(?P<code>SO-\d+) shipped to (?P<city>\w+)", "Order SO-1042 shipped to Pune")
print(m["code"], m["city"])   # SO-1042 Pune
```

## Replacing text

```python
import re

phone = "+91 98765-43210"
digits = re.sub(r"\D", "", phone)                  # '919876543210'

masked = re.sub(r"\d(?=\d{4})", "*", "9876543210")  # '******3210' (lookahead)

# Reformat dates from DD/MM/YYYY to YYYY-MM-DD
text = "Due 30/09/2026 and 15/10/2026"
print(re.sub(r"(\d{2})/(\d{2})/(\d{4})", r"\3-\2-\1", text))  # Due 2026-09-30 and 2026-10-15
```

## Flags and compiled patterns

```python
import re

EMAIL = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$", re.IGNORECASE)

for email in ["asha@example.com", "not-an-email", "ravi.k+shop@mail.co.in"]:
    print(email, bool(EMAIL.fullmatch(email)))
```

Compiling a pattern you use repeatedly is clearer and slightly faster. Useful flags: `re.IGNORECASE`, `re.MULTILINE`, `re.DOTALL` (`.` matches newlines), `re.VERBOSE` (allows comments and whitespace in patterns).

```python
import re

PIN_CODE = re.compile(r"""
    ^[1-9]      # first digit can't be zero
    \d{5}$      # five more digits
""", re.VERBOSE)

print(bool(PIN_CODE.fullmatch("411001")), bool(PIN_CODE.fullmatch("011001")))  # True False
```

## When not to use regex

- **Parsing HTML, JSON or CSV** — use a proper parser (`html.parser`/BeautifulSoup, `json`, `csv`).
- **Complex validation like emails** — a simple regex catches typos; real validation means sending a confirmation email.
- **Simple checks** — `s.startswith("SO-")`, `s.isdigit()` and `in` are clearer.

Be careful with patterns that can backtrack excessively (nested quantifiers like `(a+)+`) on untrusted input — they can take exponential time.

## Try it yourself

1. Extract all hashtags (`#python`, `#DataScience`) from a tweet.
2. Validate Indian mobile numbers: optional `+91`, then 10 digits starting with 6–9.
3. Convert `camelCaseNames` to `snake_case_names` with `re.sub`.
4. Parse log lines like `2026-09-30 18:45:01 ERROR [payments] Timeout after 30s` into a dictionary with named groups.
