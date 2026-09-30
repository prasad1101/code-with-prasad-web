Comprehensions build lists, dictionaries and sets in a single readable expression. Generators produce values **lazily**, one at a time — letting you process huge or even infinite sequences with little memory. Together they're at the heart of idiomatic ("Pythonic") code.

## List comprehensions

```python
numbers = [1, 2, 3, 4, 5, 6]

squares = [n * n for n in numbers]                  # [1, 4, 9, 16, 25, 36]
evens = [n for n in numbers if n % 2 == 0]          # [2, 4, 6]
labels = ["even" if n % 2 == 0 else "odd" for n in numbers]
```

The pattern is `[expression for item in iterable if condition]`. A trailing `if` filters; a conditional expression (`a if cond else b`) at the front transforms.

Nested loops read left to right, like nested `for` statements:

```python
pairs = [(size, colour) for size in ["S", "M"] for colour in ["red", "blue"]]
# [('S', 'red'), ('S', 'blue'), ('M', 'red'), ('M', 'blue')]

matrix = [[1, 2], [3, 4], [5, 6]]
flat = [value for row in matrix for value in row]   # [1, 2, 3, 4, 5, 6]
```

## Dictionary and set comprehensions

```python
prices = {"pen": 20, "notebook": 120, "bag": 899}

with_gst = {item: round(price * 1.18, 2) for item, price in prices.items()}
expensive = {item for item, price in prices.items() if price > 100}   # a set
inverted = {price: item for item, price in prices.items()}
```

## Keep them readable

Comprehensions are great for simple transformations. If you need several conditions, nested logic, or side effects (printing, appending elsewhere), write a normal `for` loop instead.

## Generator expressions

Replace the brackets with parentheses and you get a **generator** — values are produced on demand instead of building a list:

```python
total = sum(n * n for n in range(1_000_000))   # no million-element list in memory
any_negative = any(x < 0 for x in [3, -1, 7])  # stops at the first match
```

## Generator functions and `yield`

A function containing `yield` returns a generator. Each `yield` produces a value and **pauses** the function until the next value is requested:

```python
def countdown(n):
    while n > 0:
        yield n
        n -= 1

for value in countdown(3):
    print(value)      # 3, 2, 1

gen = countdown(2)
print(next(gen))      # 2
print(next(gen))      # 1
# next(gen) now raises StopIteration
```

### Processing large files lazily

```python
def read_errors(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            if "ERROR" in line:
                yield line.rstrip()

def parse(lines):
    for line in lines:
        timestamp, _, message = line.partition(" ERROR ")
        yield {"timestamp": timestamp, "message": message}

# A pipeline: only one line is in memory at a time
for event in parse(read_errors("app.log")):
    print(event)
```

### Infinite sequences

```python
from itertools import islice

def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

print(list(islice(fibonacci(), 10)))   # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## Generators are single-use

```python
squares = (n * n for n in range(3))
print(list(squares))   # [0, 1, 4]
print(list(squares))   # [] — already exhausted
```

Create a new generator (or use a list) if you need to iterate twice.

## `itertools` highlights

```python
from itertools import chain, groupby, islice, pairwise, batched

list(chain([1, 2], [3]))                 # [1, 2, 3]
list(pairwise([1, 2, 3, 4]))             # [(1, 2), (2, 3), (3, 4)]
list(batched(range(7), 3))               # [(0, 1, 2), (3, 4, 5), (6,)]

orders = [("Pune", 250), ("Pune", 90), ("Mumbai", 400)]
for city, group in groupby(orders, key=lambda o: o[0]):    # input must be sorted by key
    print(city, sum(amount for _, amount in group))
```

## Try it yourself

1. Given a list of words, build a dictionary mapping each word to its length, only for words longer than 3 letters.
2. Write a generator `chunks(items, size)` that yields lists of `size` items (then compare with `itertools.batched`).
3. Write a generator pipeline that reads a large CSV line by line, keeps rows where `amount > 1000`, and yields the total so far after each matching row.
