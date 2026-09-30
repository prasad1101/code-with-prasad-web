**asyncio** runs many I/O-bound tasks concurrently on a single thread by switching between them whenever one is waiting. It powers modern Python web frameworks (FastAPI), HTTP clients, database drivers, websocket servers and bots — anything that juggles thousands of connections.

## Coroutines, `async` and `await`

```python
import asyncio

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)           # simulated I/O; yields control while waiting
    return f"{name} done"

async def main() -> None:
    result = await fetch("report", 0.5)
    print(result)

asyncio.run(main())
```

- `async def` defines a **coroutine function**; calling it returns a coroutine object that doesn't run until awaited.
- `await` pauses the current coroutine until the awaited thing completes, letting other tasks run meanwhile.
- `asyncio.run()` starts the event loop and runs the top-level coroutine.

## Running tasks concurrently

Awaiting one after another is sequential. To run concurrently, create tasks:

```python
import asyncio
import time

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return name

async def main() -> None:
    start = time.perf_counter()
    results = await asyncio.gather(fetch("users", 1), fetch("orders", 1), fetch("stats", 1))
    print(results, f"{time.perf_counter() - start:.1f}s")   # ['users', 'orders', 'stats'] 1.0s

asyncio.run(main())
```

### Task groups (structured concurrency)

`asyncio.TaskGroup` runs tasks together and, if one fails, cancels the others and raises the errors:

```python
import asyncio

async def load(name: str) -> str:
    await asyncio.sleep(0.2)
    return name.upper()

async def main() -> None:
    async with asyncio.TaskGroup() as tg:
        users = tg.create_task(load("users"))
        orders = tg.create_task(load("orders"))
    print(users.result(), orders.result())   # all tasks finished when the block exits

asyncio.run(main())
```

Prefer `TaskGroup` over loose `create_task` calls: no task is forgotten, and errors can't go unnoticed.

## Timeouts and cancellation

```python
import asyncio

async def slow_service() -> str:
    await asyncio.sleep(5)
    return "late"

async def main() -> None:
    try:
        async with asyncio.timeout(1):
            await slow_service()
    except TimeoutError:
        print("Service took too long — using cached data")

asyncio.run(main())
```

Cancellation raises `CancelledError` inside the task at its current `await`; use `try/finally` in coroutines to clean up resources.

## Limiting concurrency

Firing 10,000 requests at once can overwhelm a server (or get you rate-limited). Use a semaphore:

```python
import asyncio

async def fetch(i: int, limit: asyncio.Semaphore) -> int:
    async with limit:                     # at most N inside at the same time
        await asyncio.sleep(0.1)
        return i

async def main() -> None:
    limit = asyncio.Semaphore(10)
    results = await asyncio.gather(*(fetch(i, limit) for i in range(100)))
    print(len(results))                   # 100, in ~1 second (10 at a time)

asyncio.run(main())
```

## Real HTTP requests

`requests` is synchronous — it blocks the event loop. Use an async client such as **httpx** or **aiohttp**:

```python
import asyncio
import httpx

async def main() -> None:
    urls = [f"https://jsonplaceholder.typicode.com/posts/{i}" for i in range(1, 6)]
    async with httpx.AsyncClient(timeout=10) as client:
        responses = await asyncio.gather(*(client.get(u) for u in urls))
    for r in responses:
        print(r.status_code, r.json()["title"][:40])

asyncio.run(main())
```

## Never block the event loop

Everything in asyncio shares one thread. A blocking call (`time.sleep`, `requests.get`, heavy CPU work, synchronous database drivers) freezes **every** task:

```python
import asyncio
import time

def blocking_report() -> str:
    time.sleep(1)                 # blocking — e.g. a sync library
    return "report"

async def main() -> None:
    result = await asyncio.to_thread(blocking_report)   # runs in a worker thread
    print(result)

asyncio.run(main())
```

Use `asyncio.to_thread` for blocking I/O libraries, and a process pool (`loop.run_in_executor`) for CPU-heavy work.

## Async iteration and context managers

```python
import asyncio

async def ticker(n: int):
    for i in range(n):
        await asyncio.sleep(0.1)
        yield i                   # an async generator

async def main() -> None:
    async for tick in ticker(3):
        print("tick", tick)

asyncio.run(main())
```

Database pools, HTTP sessions and websockets use `async with` for setup and cleanup.

## When to use asyncio

- ✅ Many concurrent network operations: API aggregators, crawlers, chat servers, websockets, bots.
- ✅ Web APIs with async frameworks (FastAPI, Starlette, aiohttp).
- ❌ CPU-bound work (use processes).
- ❌ Small scripts with a few sequential requests — synchronous code is simpler.

asyncio is "all or nothing": once you're in async code, your I/O libraries must be async too.

## Try it yourself

Write an async price checker that fetches 20 (simulated) product pages with at most 5 concurrent requests, a 2-second timeout per request, and retries once on timeout. Collect results with a `TaskGroup` and print the cheapest product.
