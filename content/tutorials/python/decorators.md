A **decorator** wraps a function (or class) to add behaviour — logging, timing, caching, retries, access control — without changing its code. You've already used some: `@property`, `@classmethod`, `@dataclass`. Frameworks like Flask, FastAPI and Django rely on them heavily.

## Functions are objects

Decorators build on two facts: functions can be passed around, and functions can return functions.

```python
def shout(text):
    return text.upper()

def apply(func, value):
    return func(value)

print(apply(shout, "hello"))   # HELLO
```

## Writing a decorator

```python
import functools
import time

def timed(func):
    @functools.wraps(func)                      # keep the original name and docstring
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            elapsed = (time.perf_counter() - start) * 1000
            print(f"{func.__name__} took {elapsed:.1f} ms")
    return wrapper

@timed
def build_report(n):
    return sum(i * i for i in range(n))

build_report(100_000)          # build_report took … ms
```

`@timed` above `def build_report` is shorthand for `build_report = timed(build_report)`.

Always use `functools.wraps` — without it, the decorated function loses its `__name__`, docstring and signature, which breaks debugging and tools.

## Decorators with arguments

Add one more level: a function that takes the arguments and returns the decorator.

```python
import functools
import time

def retry(times=3, delay=0.5, exceptions=(Exception,)):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as exc:
                    if attempt == times:
                        raise
                    print(f"Attempt {attempt} failed: {exc}; retrying")
                    time.sleep(delay * attempt)
        return wrapper
    return decorator

calls = {"n": 0}

@retry(times=3, delay=0.01, exceptions=(ConnectionError,))
def fetch_rates():
    calls["n"] += 1
    if calls["n"] < 3:
        raise ConnectionError("temporary network error")
    return {"USD": 83.2}

print(fetch_rates())   # succeeds on the third attempt
```

## Built-in decorators you should know

### Caching with `functools.cache` / `lru_cache`

```python
from functools import cache, lru_cache

@cache
def fibonacci(n: int) -> int:
    return n if n < 2 else fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(80))   # instant, thanks to memoisation

@lru_cache(maxsize=256)
def exchange_rate(currency: str) -> float:
    ...                  # expensive lookup, keeps the 256 most recent results
```

Arguments must be hashable. Don't cache functions whose results change over time without an expiry strategy.

### Others

- `@property`, `@classmethod`, `@staticmethod` — see the advanced OOP lesson.
- `@dataclass` — generates methods for data classes.
- `@functools.singledispatch` — function overloading by argument type.
- `@contextlib.contextmanager` — see the next lesson.

## Stacking decorators

```python
@timed
@retry(times=2)
def sync_inventory():
    ...
```

Decorators apply bottom-up: `sync_inventory = timed(retry(times=2)(sync_inventory))` — so timing includes the retries.

## Class decorators and registration

Decorators can register functions — a common framework pattern:

```python
HANDLERS = {}

def on(event: str):
    def decorator(func):
        HANDLERS[event] = func
        return func                # return the function unchanged
    return decorator

@on("order.placed")
def send_confirmation(order):
    return f"Confirmation sent for {order['id']}"

print(HANDLERS["order.placed"]({"id": "SO-1"}))
```

This is exactly how `@app.get("/users")` in FastAPI or `@app.route` in Flask map URLs to functions.

## Decorating methods

The same decorators work on methods — `self` simply arrives in `*args`. For decorators that need access to the instance, read `args[0]`.

## When to use decorators

Good for **cross-cutting concerns** applied to many functions: logging, timing, caching, retries, authentication, validation, registration. Avoid decorators that change a function's behaviour in surprising ways — readers should be able to understand what a function does from its name and the decorator's name.

## Try it yourself

1. Write `@log_calls` that prints the arguments and return value of every call.
2. Write `@require_role("admin")` that checks a `user` keyword argument and raises `PermissionError` otherwise.
3. Write `@rate_limited(calls=5, per_seconds=1)` that raises an exception when called too often.
