A **function** is a named, reusable block of code. Functions let you break a program into small pieces, each doing one job, and avoid repeating yourself.

## Defining and calling functions

```python
def greet(name):
    return f"Hello, {name}!"

print(greet("Asha"))   # Hello, Asha!
```

- `def` starts a function definition.
- `name` is a **parameter**; `"Asha"` is the **argument** passed in.
- `return` sends a value back. A function without `return` returns `None`.

## Default arguments

```python
def greet(name="friend", greeting="Hello"):
    return f"{greeting}, {name}!"

greet()                        # Hello, friend!
greet("Ravi")                  # Hello, Ravi!
greet("Meera", greeting="Hi")  # Hi, Meera!
```

Arguments passed as `name=value` are **keyword arguments**. They make calls easier to read and let you skip optional parameters.

> Don't use a mutable value like `[]` as a default: it's created once and shared between calls. Use `None` and create the list inside the function instead.

## Returning several values

```python
def stats(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)

low, high, average = stats([4, 8, 15, 16, 23, 42])
```

## `*args` and `**kwargs`

Accept any number of positional or keyword arguments:

```python
def total(*prices):
    return sum(prices)

total(10, 20, 30)   # 60

def describe(**details):
    for key, value in details.items():
        print(f"{key}: {value}")

describe(name="Asha", role="developer")
```

## Scope

Variables created inside a function exist only inside that function:

```python
def calculate():
    tax = 0.18
    return 100 * (1 + tax)

print(calculate())   # 118.0
print(tax)           # NameError: name 'tax' is not defined
```

Functions can *read* variables from outside, but it's better to pass everything a function needs as parameters. That makes it predictable and easy to test.

## Docstrings and type hints

Document what a function does with a **docstring**, and describe its inputs and outputs with **type hints**:

```python
def bmi(weight_kg: float, height_m: float) -> float:
    """Return the body-mass index, rounded to one decimal place."""
    return round(weight_kg / height_m ** 2, 1)

print(bmi(68, 1.75))   # 22.2
help(bmi)              # shows the docstring
```

Type hints aren't enforced when the code runs, but editors and tools like `mypy` use them to catch mistakes.

## Functions are objects

You can pass functions to other functions:

```python
names = ["ravi", "Asha", "meera"]
print(sorted(names, key=str.lower))

def shout(text):
    return text.upper() + "!"

def apply(func, value):
    return func(value)

print(apply(shout, "hello"))   # HELLO!
```

## Lambda functions

A `lambda` is a small anonymous function, handy as a `key` for sorting:

```python
products = [("Mouse", 700), ("Keyboard", 1500), ("Cable", 200)]
products.sort(key=lambda p: p[1])
# [('Cable', 200), ('Mouse', 700), ('Keyboard', 1500)]
```

Use `def` for anything longer than a simple expression.

## Try it yourself

1. Write `is_prime(n)` that returns `True` if `n` is prime.
2. Use it to print all primes below 50.
3. Write `word_count(text)` that returns a dictionary of word frequencies, ignoring case.
