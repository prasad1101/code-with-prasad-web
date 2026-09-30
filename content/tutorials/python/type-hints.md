Python is dynamically typed, but **type hints** let you declare what types functions expect and return. Python doesn't enforce them at runtime; tools like **mypy**, **pyright** and your editor use them to catch bugs before running the code — and they make large codebases far easier to understand.

## Basic annotations

```python
def greet(name: str, excited: bool = False) -> str:
    return f"Hello, {name}{'!' if excited else '.'}"

count: int = 0
prices: list[float] = [99.0, 149.5]
stock: dict[str, int] = {"pen": 120}
point: tuple[float, float] = (18.52, 73.85)
tags: set[str] = {"python", "typing"}
```

Since Python 3.9 you can use built-in collections directly (`list[int]`, `dict[str, int]`).

## Optional values and unions

```python
def find_user(user_id: int) -> dict | None:       # may return None
    ...

def parse_amount(value: str | int | float) -> float:
    return float(value)
```

`X | None` (also written `Optional[X]`) forces you to handle the `None` case — type checkers flag `find_user(1)["name"]` without a check.

## Type aliases and literals

```python
from typing import Literal

type OrderStatus = Literal["pending", "paid", "shipped", "cancelled"]   # Python 3.12+ syntax
type Money = float

def update_status(order_id: str, status: OrderStatus) -> None: ...

update_status("SO-1", "paid")       # OK
update_status("SO-1", "delivered")  # type checker error
```

(On older Python versions: `OrderStatus = Literal[...]` or `OrderStatus: TypeAlias = ...`.)

## Typed dictionaries and dataclasses

```python
from dataclasses import dataclass
from typing import TypedDict, NotRequired

class ProductDict(TypedDict):          # the shape of a dict (e.g. parsed JSON)
    id: str
    name: str
    price: float
    discount: NotRequired[float]

@dataclass
class Product:                         # a real class with typed fields
    id: str
    name: str
    price: float
```

## Callables

```python
from collections.abc import Callable, Iterable

def apply_discount(prices: Iterable[float], rule: Callable[[float], float]) -> list[float]:
    return [rule(p) for p in prices]

print(apply_discount([100, 250], lambda p: p * 0.9))   # [90.0, 225.0]
```

Prefer abstract types from `collections.abc` for parameters (`Iterable`, `Sequence`, `Mapping`) — they accept more inputs — and concrete types for return values.

## Generics

```python
def first[T](items: list[T]) -> T | None:        # Python 3.12+ generic syntax
    return items[0] if items else None

x = first([1, 2, 3])          # inferred as int | None
y = first(["a", "b"])         # inferred as str | None

class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

s = Stack[int]()
s.push(1)
```

(Before 3.12: `T = TypeVar("T")` and `class Stack(Generic[T])`.)

## Protocols: structural typing

A `Protocol` describes the methods an object must have — any class with those methods matches, no inheritance required ("duck typing" that type checkers understand):

```python
from typing import Protocol

class SupportsSend(Protocol):
    def send(self, to: str, message: str) -> bool: ...

class EmailSender:
    def send(self, to: str, message: str) -> bool:
        print(f"email to {to}")
        return True

def notify(sender: SupportsSend, users: list[str]) -> int:
    return sum(sender.send(u, "Your order has shipped") for u in users)

print(notify(EmailSender(), ["asha@example.com", "ravi@example.com"]))   # 2
```

Protocols make code easy to test: pass any fake object with the right methods.

## Running a type checker

```bash
pip install mypy
mypy src/
```

Or use **pyright** (also built into the VS Code Pylance extension). Start lenient and tighten over time (`--strict` in mypy). Add type checking to CI.

## Runtime validation

Type hints aren't checked at runtime. For data coming from outside your program (API requests, JSON files, environment variables), use a validation library that reads the hints — **Pydantic** is the most popular (and powers FastAPI):

```python
from pydantic import BaseModel, Field

class OrderIn(BaseModel):
    product_id: str
    qty: int = Field(gt=0, le=20)
    coupon: str | None = None

order = OrderIn.model_validate({"product_id": "p1", "qty": "3"})   # "3" is coerced to 3
print(order.qty + 1)                                              # 4
# OrderIn.model_validate({"product_id": "p1", "qty": 0}) raises ValidationError
```

## Try it yourself

Add complete type hints to a small module you've written (functions, a dataclass, a dictionary of settings), run `mypy --strict` on it, and fix every error. Then define a `Repository` protocol with `get(id)` and `save(item)` and write two implementations — in-memory and file-based — that both satisfy it.
