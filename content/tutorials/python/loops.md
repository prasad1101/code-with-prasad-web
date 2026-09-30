Loops repeat code. Python has two loops — `for` and `while` — and `for` is by far the more common.

## `for` loops over sequences

A `for` loop goes through each item in a collection:

```python
fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print(fruit)
```

It works with any **iterable** — strings, lists, dictionaries, files and more:

```python
for char in "hey":
    print(char)
```

## `range()`

`range` generates a sequence of numbers:

```python
for i in range(5):          # 0, 1, 2, 3, 4
    print(i)

for i in range(1, 6):       # 1 to 5
    print(i)

for i in range(0, 20, 5):   # 0, 5, 10, 15 — step of 5
    print(i)
```

The end value is **not** included.

## `enumerate()` — index and value together

```python
tasks = ["write", "test", "deploy"]

for number, task in enumerate(tasks, start=1):
    print(f"{number}. {task}")
```

## `zip()` — loop over several lists at once

```python
names = ["Asha", "Ravi", "Meera"]
scores = [91, 78, 85]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
```

## `while` loops

Use `while` when you loop until a condition changes rather than over a known collection:

```python
balance = 1000
years = 0

while balance < 2000:
    balance *= 1.07
    years += 1

print(f"Doubled after {years} years")   # Doubled after 11 years
```

## `break` and `continue`

```python
numbers = [3, 8, -1, 5, 12]

for n in numbers:
    if n < 0:
        print("Negative found — stopping.")
        break
    if n % 2:
        continue          # skip odd numbers
    print(f"Even: {n}")
```

## `else` on loops

A loop's `else` block runs only if the loop finished **without** hitting `break` — handy for searches:

```python
users = ["asha", "ravi"]

for user in users:
    if user == "meera":
        print("Found Meera")
        break
else:
    print("Meera not found")
```

## List comprehensions

A compact way to build a list from a loop:

```python
squares = [n * n for n in range(1, 6)]
# [1, 4, 9, 16, 25]

evens = [n for n in range(20) if n % 2 == 0]
```

Use them for simple transformations. If a comprehension gets hard to read, write a normal loop instead.

## Try it yourself

1. Print the multiplication table for 7.
2. Use a list comprehension to create a list of the words longer than 4 characters from `["sky", "python", "loop", "function"]`.
3. Write a number-guessing game: pick a secret number, and keep asking the user to guess (with "higher"/"lower" hints) until they get it right.
