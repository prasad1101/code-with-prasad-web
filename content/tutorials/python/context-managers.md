A **context manager** sets something up, lets your code run, and guarantees cleanup afterwards — even if an exception occurs. You use them with the `with` statement: opening files, database transactions, locks, temporary directories, timers.

## Using context managers

```python
with open("data.txt", "w", encoding="utf-8") as f:
    f.write("hello")
# the file is closed here, whether or not an error happened
```

Several at once:

```python
with open("in.txt", "w") as a, open("out.txt", "w") as b:
    a.write("x")
    b.write("y")
```

## How `with` works

Any object with `__enter__` and `__exit__` methods is a context manager:

```python
import time

class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self                                  # bound to the name after `as`

    def __exit__(self, exc_type, exc_value, traceback):
        self.elapsed = time.perf_counter() - self.start
        print(f"Elapsed: {self.elapsed * 1000:.1f} ms")
        return False                                 # don't suppress exceptions

with Timer() as t:
    sum(range(1_000_000))
```

`__exit__` receives exception details if the block raised one. Returning `True` would **suppress** the exception — rarely what you want.

## The easy way: `@contextmanager`

Write a generator: code before `yield` is setup, code after is cleanup:

```python
from contextlib import contextmanager
import os

@contextmanager
def working_directory(path):
    previous = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(previous)          # always restored

with working_directory("/tmp"):
    print(os.getcwd())
print(os.getcwd())                   # back where we started
```

The `try`/`finally` around `yield` is essential — without it, cleanup is skipped when the block raises.

### A database-style transaction

```python
from contextlib import contextmanager

class FakeConnection:
    def begin(self): print("BEGIN")
    def commit(self): print("COMMIT")
    def rollback(self): print("ROLLBACK")

@contextmanager
def transaction(conn):
    conn.begin()
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    else:
        conn.commit()

conn = FakeConnection()
with transaction(conn):
    print("updating stock")          # BEGIN, updating stock, COMMIT

try:
    with transaction(conn):
        raise ValueError("insufficient stock")   # BEGIN, ROLLBACK, then the error propagates
except ValueError as e:
    print("Failed:", e)
```

Real database libraries (sqlite3, SQLAlchemy, psycopg) provide exactly this pattern.

## Useful context managers in the standard library

```python
from contextlib import suppress, redirect_stdout, ExitStack
import io, tempfile, threading

with suppress(FileNotFoundError):              # ignore a specific, expected error
    open("maybe-missing.txt").read()

buffer = io.StringIO()
with redirect_stdout(buffer):                  # capture printed output
    print("captured!")
print(buffer.getvalue().strip())

with tempfile.TemporaryDirectory() as tmp:     # deleted automatically afterwards
    print("working in", tmp)

lock = threading.Lock()
with lock:                                     # acquire and always release
    pass

with ExitStack() as stack:                     # a dynamic number of context managers
    files = [stack.enter_context(open(f"part{i}.txt", "w")) for i in range(3)]
```

## Async context managers

Async code uses `async with` and `__aenter__`/`__aexit__` (or `@asynccontextmanager`) — for example database pools and HTTP sessions (see the asyncio lesson):

```python
async with httpx.AsyncClient() as client:
    response = await client.get("https://api.example.com/rates")
```

## When to write one

Whenever something must be **undone** reliably: temporarily changing state (working directory, environment variables, settings), acquiring and releasing resources (connections, locks, files), or measuring a block of code.

## Try it yourself

1. Write `temporary_env(**vars)` that sets environment variables inside the block and restores the previous values afterwards.
2. Write a `Stopwatch` context manager that stores the elapsed time and logs a warning if the block took longer than a threshold.
3. Use `ExitStack` to open a list of files of unknown length and merge their contents.
