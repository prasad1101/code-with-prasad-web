As programs grow, you split them across files. A **module** is simply a `.py` file; a **package** is a folder of modules. Python also ships with a huge **standard library**, and hundreds of thousands of third-party packages are available from PyPI.

## Importing from the standard library

```python
import math
print(math.sqrt(16))    # 4.0
print(math.pi)          # 3.141592653589793

from datetime import date
print(date.today())     # e.g. 2026-09-30

import random
print(random.choice(["rock", "paper", "scissors"]))
```

Forms of `import`:

```python
import statistics                  # use as statistics.mean(...)
import statistics as st            # alias: st.mean(...)
from statistics import mean, median  # use mean(...) directly
```

Avoid `from module import *` — it makes it unclear where names come from.

## Standard library highlights

| Module | Use it for |
| --- | --- |
| `pathlib` | Working with file paths |
| `json` | Reading and writing JSON |
| `datetime` | Dates and times |
| `collections` | `Counter`, `defaultdict`, `deque` |
| `random` | Random numbers and choices |
| `csv` | Reading and writing CSV files |
| `os`, `sys` | Environment and interpreter details |

```python
from pathlib import Path
import json

config = json.loads(Path("config.json").read_text())
print(config["debug"])
```

## Writing your own module

Create `helpers.py`:

```python
"""Small text helpers."""

def slugify(text: str) -> str:
    return "-".join(text.lower().split())

GREETING = "Hello"
```

Use it from `main.py` in the same folder:

```python
from helpers import slugify, GREETING

print(slugify("My First Blog Post"))   # my-first-blog-post
print(GREETING)
```

## `if __name__ == "__main__":`

Code at the top level of a module runs whenever the module is imported. To have code run **only** when the file is executed directly, guard it:

```python
def main():
    print("Running as a script")

if __name__ == "__main__":
    main()
```

## Packages

A package is a folder of modules:

```text
shop/
    __init__.py
    cart.py
    pricing.py
main.py
```

```python
from shop.pricing import apply_discount
```

The `__init__.py` file marks the folder as a regular package (it can be empty).

## Virtual environments and pip

Third-party packages are installed with **pip**. Install them into a **virtual environment** — an isolated set of packages for each project — so projects don't interfere with each other:

```bash
python -m venv .venv

# Activate it
source .venv/bin/activate        # macOS / Linux
.venv\Scripts\activate           # Windows

python -m pip install requests
python -m pip freeze > requirements.txt
```

Later, anyone can recreate the environment with `python -m pip install -r requirements.txt`.

```python
import requests

res = requests.get("https://jsonplaceholder.typicode.com/todos/1", timeout=10)
print(res.json()["title"])
```

## Try it yourself

1. Create a module `mathtools.py` with functions `average(numbers)` and `percentage(part, whole)`, and use them from another file.
2. Use `random` to simulate rolling two dice 1,000 times and `collections.Counter` to show how often each total appears.
