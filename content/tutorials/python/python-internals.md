Understanding how Python works under the hood explains surprising behaviour, helps you debug tricky bugs, and is a staple of senior-level interviews. This lesson covers the object model, mutability and references, scoping, memory management, descriptors and metaclasses.

## Everything is an object; names are references

Variables are **names bound to objects**, not boxes holding values:

```python
a = [1, 2, 3]
b = a                 # b refers to the SAME list
b.append(4)
print(a)              # [1, 2, 3, 4]
print(a is b)         # True — same object
print(id(a) == id(b)) # True
```

- `is` compares identity (same object); `==` compares values.
- Use `is` only with singletons: `x is None`.

## Mutable vs. immutable

| Immutable | Mutable |
| --- | --- |
| `int`, `float`, `str`, `tuple`, `frozenset`, `bytes` | `list`, `dict`, `set`, most custom objects |

"Changing" an immutable object creates a new one:

```python
s = "hello"
t = s
s += " world"          # a new string; t is unchanged
print(t)               # hello
```

### Function arguments: "pass by object reference"

```python
def add_item(cart: list, item: str) -> None:
    cart.append(item)          # mutates the caller's list

def reset(cart: list) -> None:
    cart = []                  # rebinds the local name only

my_cart = ["pen"]
add_item(my_cart, "book")
reset(my_cart)
print(my_cart)                 # ['pen', 'book']
```

### The mutable default argument trap

```python
def add_tag(tag, tags=[]):           # the default list is created ONCE, at definition time
    tags.append(tag)
    return tags

print(add_tag("a"))   # ['a']
print(add_tag("b"))   # ['a', 'b']  ← surprise!

def add_tag_fixed(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags
```

### Shallow vs. deep copies

```python
import copy

original = {"items": [1, 2], "meta": {"owner": "asha"}}
shallow = copy.copy(original)          # new dict, same nested objects
deep = copy.deepcopy(original)         # everything copied
original["items"].append(3)
print(shallow["items"], deep["items"]) # [1, 2, 3] [1, 2]
```

## Scope: LEGB

Names are resolved in order: **L**ocal → **E**nclosing function → **G**lobal (module) → **B**uilt-in.

```python
count = 0

def make_counter():
    count = 0                      # enclosing scope
    def increment():
        nonlocal count             # rebind the enclosing variable
        count += 1
        return count
    return increment

counter = make_counter()
counter()
print(counter(), count)            # 2 0 — the global is untouched
```

`global` and `nonlocal` are needed only to **rebind** outer names, not to read or mutate them.

## Memory management

CPython uses **reference counting**: each object tracks how many references point to it and is freed immediately when the count drops to zero. A **cyclic garbage collector** (`gc` module) periodically frees groups of objects that reference each other but are otherwise unreachable.

```python
import sys

data = []
print(sys.getrefcount(data))   # at least 2 (the name + the function argument)
```

Small integers (−5 to 256) and many short strings are cached and shared, which is why `is` comparisons on them sometimes "work" — never rely on it.

## Iteration protocol

`for x in obj` calls `iter(obj)` to get an iterator, then `next()` until `StopIteration`. Implementing `__iter__` (or writing a generator) makes any object iterable — see the comprehensions and generators lesson.

## Descriptors

A **descriptor** is an object with `__get__`/`__set__` methods, stored on a class, that controls attribute access. `property`, `classmethod`, `staticmethod` and methods themselves are descriptors.

```python
class Positive:
    def __set_name__(self, owner, name):
        self.private = f"_{name}"

    def __get__(self, obj, objtype=None):
        return getattr(obj, self.private)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.private[1:]} must be positive")
        setattr(obj, self.private, value)

class Product:
    price = Positive()
    stock = Positive()

    def __init__(self, price, stock):
        self.price = price
        self.stock = stock

p = Product(799, 10)
print(p.price)            # 799
# Product(-1, 10) raises ValueError: price must be positive
```

Frameworks (Django fields, SQLAlchemy columns, Pydantic) use descriptors to create declarative models.

## Metaclasses (briefly)

Classes are objects too; their type is a **metaclass** (by default `type`). A metaclass can customise class creation — used by frameworks for registration and validation. In application code, simpler tools usually suffice: class decorators or `__init_subclass__`:

```python
class Plugin:
    registry: dict[str, type] = {}

    def __init_subclass__(cls, name: str, **kwargs):
        super().__init_subclass__(**kwargs)
        Plugin.registry[name] = cls

class CsvExporter(Plugin, name="csv"): ...
class PdfExporter(Plugin, name="pdf"): ...

print(Plugin.registry)   # {'csv': <class …CsvExporter>, 'pdf': <class …PdfExporter>}
```

## Bytecode

Python compiles source to bytecode executed by the interpreter's virtual machine. The `dis` module shows it — useful for understanding performance and atomicity:

```python
import dis

def add(a, b):
    return a + b

dis.dis(add)
```

## Try it yourself

1. Predict the output, then run: `x = [[0] * 3] * 3; x[0][0] = 1; print(x)` — explain it, and fix it with a comprehension.
2. Write a `Typed` descriptor that enforces a type on assignment and use it in a class.
3. Use `__init_subclass__` to build a registry of payment providers keyed by name.
