Programs often wait: for web pages, database queries, files, or long calculations. **Concurrency** lets a program make progress on several tasks at once. Python offers three main tools — threads, processes and asyncio — and choosing correctly depends on whether your work is **I/O-bound** or **CPU-bound**.

## I/O-bound vs. CPU-bound

- **I/O-bound** — most time is spent waiting (network, disk, database). Threads or asyncio help: while one task waits, another runs.
- **CPU-bound** — most time is spent computing (image processing, number crunching, parsing huge files). You need true parallelism across CPU cores: multiple processes.

## The GIL

In the standard CPython interpreter, the **Global Interpreter Lock** allows only one thread to execute Python bytecode at a time. Consequences:

- Threads **do** speed up I/O-bound work (the GIL is released while waiting on I/O).
- Threads **don't** speed up pure-Python CPU-bound work — use processes instead.
- Libraries like NumPy release the GIL inside their C code, so threads can help there.

Recent Python versions also offer an optional **free-threaded** build (no GIL), officially supported since Python 3.14 but not the default; check that your dependencies support it before relying on it.

## `concurrent.futures`: the simplest API

The same interface works for threads and processes:

```python
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

def fetch(url: str) -> str:
    time.sleep(0.5)                  # simulates a network request
    return f"{url}: ok"

urls = [f"https://example.com/page/{i}" for i in range(8)]

start = time.perf_counter()
with ThreadPoolExecutor(max_workers=8) as pool:
    futures = [pool.submit(fetch, url) for url in urls]
    for future in as_completed(futures):     # results in completion order
        print(future.result())
print(f"Took {time.perf_counter() - start:.2f}s")   # ~0.5s instead of ~4s
```

`pool.map(func, items)` is an even shorter form that returns results in input order.

### Processes for CPU-bound work

```python
import math
from concurrent.futures import ProcessPoolExecutor

def count_primes(limit: int) -> int:
    return sum(1 for n in range(2, limit) if all(n % d for d in range(2, math.isqrt(n) + 1)))

if __name__ == "__main__":                  # required for multiprocessing on Windows/macOS
    chunks = [50_000, 50_000, 50_000, 50_000]
    with ProcessPoolExecutor() as pool:
        print(sum(pool.map(count_primes, chunks)))
```

Each process has its own interpreter and memory, so arguments and results are pickled and copied between processes — send compact data, not huge objects.

## Threads and shared state

Threads share memory, which means **race conditions** when several threads modify the same data:

```python
import threading

counter = 0
lock = threading.Lock()

def increment(times: int) -> None:
    global counter
    for _ in range(times):
        with lock:                  # without the lock, updates can be lost
            counter += 1

threads = [threading.Thread(target=increment, args=(100_000,)) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(counter)                      # 400000
```

Better still, avoid shared mutable state: give each worker its own data and combine results at the end, or communicate through a thread-safe `queue.Queue`.

### Producer–consumer with a queue

```python
import queue
import threading

jobs: queue.Queue[int | None] = queue.Queue()
results: list[int] = []

def worker() -> None:
    while (item := jobs.get()) is not None:
        results.append(item * item)          # list.append is thread-safe in CPython
        jobs.task_done()
    jobs.task_done()

workers = [threading.Thread(target=worker) for _ in range(3)]
for w in workers:
    w.start()
for n in range(10):
    jobs.put(n)
for _ in workers:
    jobs.put(None)                            # one stop signal per worker
jobs.join()
print(sorted(results))
```

## Choosing the right tool

| Workload | Tool |
| --- | --- |
| Many network/database calls, moderate concurrency | `ThreadPoolExecutor` |
| Thousands of concurrent connections (servers, crawlers, websockets) | `asyncio` (next lesson) |
| CPU-heavy pure Python | `ProcessPoolExecutor` / `multiprocessing` |
| Numeric arrays | Vectorised NumPy/pandas first — often faster than any parallelism |
| Distributed or very large jobs | Task queues (Celery, RQ) or frameworks (Dask, Ray, Spark) |

## Common pitfalls

- Using threads for CPU-bound Python code and seeing no speed-up (the GIL).
- Forgetting `if __name__ == "__main__":` with process pools.
- Unbounded thread counts — use pools with a sensible `max_workers`.
- Swallowed exceptions: an exception in a worker is only raised when you call `future.result()` — always collect results.
- Deadlocks from acquiring several locks in different orders.

## Try it yourself

1. Download (or simulate downloading) 20 URLs sequentially, with a thread pool, and compare timings.
2. Compute SHA-256 hashes of 200 large random byte strings with a process pool and compare with a single process.
3. Build a producer–consumer pipeline where one thread reads lines from a file and three worker threads parse them.
