## What are Python's key features?
Level: Beginner | Tags: basics

- **Readable syntax** with significant indentation.
- **Dynamically typed** (types checked at runtime) but **strongly typed** (`"1" + 1` is an error), with optional type hints.
- **Interpreted** (compiled to bytecode and run by a virtual machine).
- **Multi-paradigm**: procedural, object-oriented and functional.
- **Batteries included**: a large standard library, plus a huge package ecosystem (PyPI).
- Automatic memory management (reference counting + cyclic garbage collector).

Widely used for web back ends, data analysis, machine learning, automation and data engineering.

## What is the difference between a list and a tuple?
Level: Beginner | Tags: data-structures

| | List | Tuple |
| --- | --- | --- |
| Mutability | Mutable | Immutable |
| Syntax | `[1, 2]` | `(1, 2)` |
| Hashable | No | Yes, if its items are — usable as dict keys / in sets |
| Typical use | Collections of similar items that change | Fixed records (coordinates, function return values) |

Tuples are slightly faster and smaller, and their immutability communicates intent.

## Explain mutable and immutable types.
Level: Beginner | Tags: types

Immutable objects can't be changed after creation (`int`, `float`, `str`, `tuple`, `frozenset`, `bytes`); "modifying" them creates a new object. Mutable objects can change in place (`list`, `dict`, `set`, most custom classes).

This matters for: dictionary keys (must be hashable, typically immutable), function arguments (mutations are visible to the caller), default arguments (mutable defaults are shared across calls) and copying (shallow copies share nested mutable objects).

## What is the difference between `is` and `==`?
Level: Beginner | Tags: operators

`==` compares **values** (calls `__eq__`); `is` compares **identity** (same object in memory). Use `is` only for singletons like `None`, `True`, `False`:

```python
a = [1, 2]; b = [1, 2]
a == b   # True
a is b   # False
x is None  # correct way to check for None
```

Small integers and some strings are cached, so `is` may appear to work for them — never rely on that.

## What is the mutable default argument problem?
Level: Intermediate | Tags: functions, gotchas

Default values are evaluated **once**, when the function is defined, so a mutable default is shared between calls:

```python
def add(item, items=[]):
    items.append(item)
    return items

add(1)  # [1]
add(2)  # [1, 2]  ← shared list
```

Fix: use `None` as the default and create a new object inside the function.

## How does Python pass arguments to functions?
Level: Intermediate | Tags: functions

"Pass by object reference" (call by sharing): the parameter name is bound to the same object the caller passed. Mutating a mutable object inside the function is visible to the caller; **rebinding** the parameter (`items = []`) only changes the local name. Immutable objects therefore behave like pass-by-value.

## What are `*args` and `**kwargs`?
Level: Beginner | Tags: functions

- `*args` collects extra positional arguments into a tuple.
- `**kwargs` collects extra keyword arguments into a dict.

```python
def log(message, *args, **kwargs):
    print(message, args, kwargs)

log("hi", 1, 2, level="info")   # hi (1, 2) {'level': 'info'}
```

The same syntax unpacks at call sites: `f(*values, **options)`. Parameters after `*` are keyword-only; parameters before `/` are positional-only.

## What are list comprehensions and generator expressions?
Level: Beginner | Tags: comprehensions

A list comprehension builds a list in one expression: `[x * 2 for x in data if x > 0]`. A generator expression uses parentheses and produces values lazily: `sum(x * 2 for x in data)`.

Use comprehensions for simple transformations/filters; generator expressions when the result is consumed once (sum, any, feeding another function) or the data is large — they don't build the whole list in memory.

## What are generators and how do they differ from regular functions?
Level: Intermediate | Tags: generators

A function containing `yield` returns a generator. Each `next()` resumes execution until the next `yield`, then pauses, keeping local state. Generators:

- produce values lazily (constant memory for huge or infinite sequences),
- can be single-pass (exhausted after iteration),
- compose into pipelines (`parse(read_lines(path))`).

`yield from` delegates to another iterable/generator. Regular functions compute everything and return once.

## What are decorators?
Level: Intermediate | Tags: decorators

A decorator is a callable that takes a function (or class) and returns a replacement, usually wrapping it with extra behaviour:

```python
import functools, time

def timed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            print(func.__name__, time.perf_counter() - start)
    return wrapper
```

`@timed` is shorthand for `f = timed(f)`. Decorators with arguments add another level (`@retry(times=3)`). Use `functools.wraps` to preserve metadata. Common uses: logging, timing, caching (`@cache`), retries, auth, route registration.

## What is a context manager?
Level: Intermediate | Tags: context-managers

An object that sets up and tears down a resource around a `with` block via `__enter__`/`__exit__`, guaranteeing cleanup even if an exception occurs (files, locks, transactions, temporary directories). The easiest way to write one is `@contextlib.contextmanager` with `try/finally` around `yield`. `__exit__` returning `True` suppresses exceptions. Async versions use `async with`.

## Explain the GIL.
Level: Advanced | Tags: concurrency, internals

The Global Interpreter Lock in CPython lets only one thread execute Python bytecode at a time. It simplifies memory management (reference counting) but limits CPU-bound parallelism with threads.

- I/O-bound work still benefits from threads (the GIL is released while waiting).
- CPU-bound pure-Python work needs multiple **processes** (or C extensions that release the GIL, like NumPy).
- Python 3.13+ offers an optional free-threaded build without the GIL (officially supported in 3.14, not the default).

## When would you use threading, multiprocessing or asyncio?
Level: Advanced | Tags: concurrency

- **threading** / `ThreadPoolExecutor` — I/O-bound tasks with moderate concurrency using blocking libraries (requests, sync DB drivers).
- **multiprocessing** / `ProcessPoolExecutor` — CPU-bound work across cores; data is pickled between processes.
- **asyncio** — very high concurrency I/O (thousands of sockets) with async libraries (httpx, asyncpg); single-threaded, cooperative scheduling; blocking calls must be offloaded (`asyncio.to_thread`).

For numeric work, vectorised NumPy/pandas often beats all three.

## How does asyncio work?
Level: Advanced | Tags: asyncio

An event loop runs coroutines (`async def`). When a coroutine hits `await` on an I/O operation, it yields control, and the loop runs other ready tasks. Concurrency comes from overlapping waiting, all on one thread.

Key tools: `asyncio.run`, `asyncio.gather`, `TaskGroup` (structured concurrency with automatic cancellation on failure), `asyncio.timeout`, `Semaphore` for limiting concurrency, `asyncio.to_thread` for blocking code. Never call blocking functions directly inside coroutines.

## What is the difference between shallow and deep copy?
Level: Intermediate | Tags: copying

A shallow copy (`copy.copy`, `list(x)`, `dict.copy()`, slicing) creates a new container but shares the nested objects. A deep copy (`copy.deepcopy`) recursively copies everything, so nested mutable objects are independent. Classic bug: `grid = [[0] * 3] * 3` creates three references to the same inner list — use `[[0] * 3 for _ in range(3)]`.

## How is memory managed in Python?
Level: Advanced | Tags: internals, memory

CPython uses **reference counting**: objects are freed as soon as nothing references them. A **cyclic garbage collector** (generational) periodically finds groups of objects that reference each other but are unreachable. Memory for small objects comes from Python's own allocator (pymalloc). Tools: `sys.getrefcount`, `gc`, `tracemalloc` for tracking allocations, `weakref` for references that don't keep objects alive (caches, observers).

## Explain LEGB scope and the `global`/`nonlocal` keywords.
Level: Intermediate | Tags: scope

Names are looked up in **L**ocal, **E**nclosing (outer functions), **G**lobal (module) and **B**uilt-in scopes, in that order. Assigning to a name makes it local by default. `global x` rebinds a module-level name; `nonlocal x` rebinds a name in the nearest enclosing function (used in closures like counters). Reading or mutating outer objects needs neither keyword.

## What are `@staticmethod`, `@classmethod` and instance methods?
Level: Beginner | Tags: oop

- **Instance methods** receive `self` and work with instance data.
- **Class methods** receive `cls`; used for alternative constructors (`from_json`) and class-level state; they respect subclassing.
- **Static methods** receive neither; utility functions grouped with the class.

## What are dunder (magic) methods?
Level: Intermediate | Tags: oop

Special methods with double underscores that integrate objects with Python's syntax and built-ins: `__init__`, `__repr__`/`__str__`, `__eq__`/`__lt__`/`__hash__`, `__len__`, `__getitem__`, `__iter__`, `__contains__`, `__add__`, `__call__`, `__enter__`/`__exit__`. Defining `__eq__` without `__hash__` makes instances unhashable; `@functools.total_ordering` fills in comparison methods from `__eq__` and one ordering method.

## What are dataclasses?
Level: Beginner | Tags: oop

`@dataclass` generates `__init__`, `__repr__` and `__eq__` (optionally ordering, hashing, immutability with `frozen=True`, and memory-efficient `slots=True`) from annotated fields. Use `field(default_factory=list)` for mutable defaults and `__post_init__` for validation. For validation of external data, Pydantic models add parsing and type coercion.

## What is the difference between `__str__` and `__repr__`?
Level: Beginner | Tags: oop

`__repr__` is an unambiguous representation for developers (ideally valid code to recreate the object), used in the REPL, logs and containers. `__str__` is a readable representation for end users, used by `print()` and `str()`. If only `__repr__` is defined, it's used for both.

## How do you handle exceptions properly in Python?
Level: Intermediate | Tags: errors

- Catch **specific** exceptions; avoid bare `except:`.
- Use `else` for code that runs only if no exception occurred, and `finally` (or context managers) for cleanup.
- Re-raise with context: `raise ServiceError("…") from exc`.
- Define custom exception hierarchies for your domain.
- Log with `logger.exception(...)` to include the traceback.
- Follow EAFP ("easier to ask forgiveness than permission"): try the operation and handle failure rather than pre-checking (avoids race conditions).

## What are type hints and are they enforced?
Level: Intermediate | Tags: typing

Annotations describing expected types (`def f(x: int) -> str`). They're **not enforced at runtime** by default; static checkers (mypy, pyright) and IDEs use them to find bugs. Features: unions (`int | None`), generics (`list[str]`, `def f[T](x: T) -> T`), `Protocol` for structural typing, `TypedDict`, `Literal`. For runtime validation of external data, libraries like Pydantic read the hints and validate/coerce values.

## How would you make a slow Python program faster?
Level: Advanced | Tags: performance

1. Profile (`cProfile`, py-spy, scalene) to find the hotspot.
2. Improve the algorithm and data structures (sets/dicts for lookups, avoid O(n²) nested loops).
3. Use built-ins and vectorised libraries (NumPy, pandas) instead of Python loops.
4. Cache repeated work (`functools.cache`), stream data with generators.
5. Parallelise: threads/asyncio for I/O, processes for CPU.
6. Compile hot paths (Cython, Numba, Rust extensions) or try PyPy.
7. Upgrade Python — newer versions are significantly faster.

## What is the difference between `append` and `extend`?
Level: Beginner | Tags: lists

`append(x)` adds `x` as a single element (a list becomes a nested list); `extend(iterable)` adds each element of the iterable:

```python
a = [1, 2]; a.append([3, 4])   # [1, 2, [3, 4]]
b = [1, 2]; b.extend([3, 4])   # [1, 2, 3, 4]
```

## How do dictionaries work internally, and what can be a key?
Level: Advanced | Tags: dict, internals

Dictionaries are hash tables: a key's `hash()` determines where it's stored, giving average O(1) lookup, insert and delete. Keys must be **hashable** — their hash must never change during their lifetime and equal objects must have equal hashes (immutable built-ins, tuples of hashables, frozensets, objects with consistent `__hash__`/`__eq__`). Since Python 3.7, dictionaries preserve insertion order.

## What are `__slots__`?
Level: Advanced | Tags: oop, memory

Declaring `__slots__ = ("x", "y")` (or `@dataclass(slots=True)`) stores attributes in a fixed structure instead of a per-instance `__dict__`. Benefits: lower memory per instance (significant for millions of objects) and slightly faster attribute access. Trade-off: you can't add arbitrary new attributes, and multiple inheritance with slots needs care.

## What are descriptors?
Level: Expert | Tags: internals, oop

Objects defining `__get__`, `__set__` and/or `__delete__`, stored as class attributes, that control how attribute access works on instances. `property`, methods (functions are descriptors that bind `self`), `classmethod` and `staticmethod` are descriptors. Frameworks use them for declarative fields with validation (Django model fields, SQLAlchemy columns). `__set_name__` lets a descriptor learn the attribute name it was assigned to.

## What is a metaclass? When would you use one?
Level: Expert | Tags: internals, oop

A metaclass is the class of a class (default `type`); it controls how classes are created. Frameworks use metaclasses to register subclasses, validate class definitions or build ORMs. In application code prefer simpler tools: class decorators or `__init_subclass__` (called whenever a subclass is defined), which cover most registration and validation needs.

## How do you structure and package a Python project?
Level: Intermediate | Tags: packaging

Use a `src/` layout with a `pyproject.toml` (metadata, dependencies, console scripts, tool config), a `tests/` folder, and a virtual environment per project. Manage dependencies with uv/Poetry/pip-tools and commit a lockfile for applications (libraries declare compatible ranges). Enforce quality with ruff (lint/format), mypy and pytest in CI. Build wheels (`uv build` / `python -m build`) and publish to PyPI.

## How do you write tests with pytest?
Level: Intermediate | Tags: testing

Test functions named `test_*` with plain `assert` statements; `pytest.raises` for exceptions; `@pytest.mark.parametrize` for data-driven tests; fixtures (`@pytest.fixture`, `conftest.py`) for reusable setup and teardown; built-in fixtures like `tmp_path`, `monkeypatch`, `capsys`; `unittest.mock` for replacing dependencies; `pytest-cov` for coverage. Keep tests fast, isolated and focused on behaviour.

## What does `if __name__ == "__main__":` do?
Level: Beginner | Tags: modules

`__name__` is `"__main__"` when a file is run directly and the module's name when it's imported. The guard runs code (like `main()`) only when executed as a script, so the module can also be imported without side effects. It's required for `multiprocessing` on platforms that spawn processes (Windows, macOS), which re-import the main module.

## What is the difference between `sort()` and `sorted()`?
Level: Beginner | Tags: lists

`list.sort()` sorts the list **in place** and returns `None`; `sorted(iterable)` returns a **new** sorted list from any iterable. Both accept `key=` and `reverse=`, and both are stable (equal elements keep their order), which enables multi-key sorting by successive sorts or tuple keys: `sorted(users, key=lambda u: (u.city, -u.age))`.
