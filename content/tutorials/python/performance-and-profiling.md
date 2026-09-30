Python is fast enough for most tasks — when slow, it's usually due to an inefficient algorithm, the wrong data structure, or doing work in pure Python that a library could do in C. The key rule: **measure before optimising**.

## Timing small snippets: `timeit`

```python
import timeit

setup = "data = list(range(10_000)); lookup = set(data)"
print(timeit.timeit("9_999 in data", setup=setup, number=1_000))     # list: linear search
print(timeit.timeit("9_999 in lookup", setup=setup, number=1_000))   # set: hash lookup — far faster
```

From the command line: `python -m timeit -s "data = list(range(10_000))" "9_999 in data"`.

## Profiling whole programs: `cProfile`

```bash
python -m cProfile -s cumulative my_script.py
```

Or in code:

```python
import cProfile
import pstats

def slow_function():
    return sorted(str(i) for i in range(200_000))

with cProfile.Profile() as profiler:
    slow_function()

stats = pstats.Stats(profiler).sort_stats("cumulative")
stats.print_stats(5)             # the 5 most expensive call paths
```

Look at **cumulative time** to find the call paths that matter. Visual tools like **snakeviz** (flame graphs of cProfile output) and the sampling profiler **py-spy** (attach to a running process without code changes) make this easier. **Scalene** profiles CPU and memory together.

## The biggest wins

### 1. Choose the right data structure

| Operation | `list` | `set` / `dict` |
| --- | --- | --- |
| `x in collection` | O(n) | O(1) average |
| Lookup by key | O(n) search | O(1) average |
| Insert at front | O(n) | — (use `collections.deque`: O(1)) |

```python
from collections import Counter, defaultdict, deque

words = "the cat and the hat and the bat".split()
print(Counter(words).most_common(2))        # [('the', 3), ('and', 2)]

groups = defaultdict(list)
for w in words:
    groups[len(w)].append(w)

recent = deque(maxlen=3)                     # keeps only the last 3 items
for event in ["a", "b", "c", "d"]:
    recent.append(event)
print(list(recent))                          # ['b', 'c', 'd']
```

### 2. Better algorithms beat micro-optimisations

Turning an O(n²) nested loop into an O(n) dictionary lookup matters far more than any syntax trick:

```python
orders = [{"id": i, "customer_id": i % 100} for i in range(10_000)]
customers = [{"id": i, "name": f"Customer {i}"} for i in range(100)]

# O(n × m): scans all customers for every order
slow = [(o["id"], next(c["name"] for c in customers if c["id"] == o["customer_id"])) for o in orders]

# O(n + m): build an index once
by_id = {c["id"]: c["name"] for c in customers}
fast = [(o["id"], by_id[o["customer_id"]]) for o in orders]
assert slow == fast
```

### 3. Use built-ins and vectorised libraries

Built-ins (`sum`, `min`, `sorted`, `any`, `str.join`) run in C. For numeric data, **NumPy** and **pandas** process whole arrays in C, often 10–100× faster than Python loops:

```python
import numpy as np

prices = np.random.rand(1_000_000) * 1000
with_gst = prices * 1.18                    # one vectorised operation, no Python loop
print(with_gst.mean())
```

### 4. Avoid repeated work

- Cache expensive pure functions with `functools.cache` / `lru_cache`.
- Move invariant computations out of loops.
- Build strings with `"".join(parts)`, not `+=` in a loop.
- Read large files lazily (generators) instead of loading everything.

### 5. Reduce memory

```python
import sys

numbers_list = [i for i in range(1_000_000)]
numbers_gen = (i for i in range(1_000_000))
print(sys.getsizeof(numbers_list), sys.getsizeof(numbers_gen))   # megabytes vs. ~200 bytes
```

Use generators for streams, `__slots__`/`@dataclass(slots=True)` for millions of small objects, and appropriate NumPy dtypes (`float32`, `int32`). Track memory with `tracemalloc`:

```python
import tracemalloc

tracemalloc.start()
data = [str(i) * 10 for i in range(100_000)]
current, peak = tracemalloc.get_traced_memory()
print(f"peak: {peak / 1_000_000:.1f} MB")
tracemalloc.stop()
```

## When pure Python isn't enough

- **Parallelism** for CPU-bound work (process pools — see the concurrency lesson).
- **Compiled extensions**: Cython, or Rust via PyO3 for hot inner loops.
- **JIT compilation**: Numba for numeric functions (`@njit`), or the PyPy interpreter for long-running pure-Python programs.
- **Newer Python versions** — each release brings interpreter speed-ups; upgrading is often a free win.

## A performance workflow

1. Write clear, correct code with tests.
2. Measure with realistic data; profile to find the hotspot.
3. Fix the algorithm or data structure first; then use built-ins/vectorisation; parallelise or compile only if still needed.
4. Measure again and keep the tests green.

## Try it yourself

Write a script that reads a 1-million-line CSV of transactions and computes total spend per customer. Profile a naive version (lists and nested loops), then optimise it with dictionaries, then with pandas, and record the timings for each.
