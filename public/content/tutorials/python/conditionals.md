Conditionals let your program choose what to do based on data. Python uses `if`, `elif` and `else` — and indentation shows which code belongs to each branch.

## `if`

```python
temperature = 32

if temperature > 30:
    print("It's hot — drink water!")
```

Note the colon `:` at the end of the `if` line and the 4-space indent for the body.

## `if … else`

```python
age = 16

if age >= 18:
    print("You can vote.")
else:
    print(f"You can vote in {18 - age} years.")
```

## `elif` for several cases

```python
score = 72

if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "F"

print(f"Grade: {grade}")   # Grade: C
```

Conditions are checked from top to bottom, and only the first matching branch runs.

## Combining conditions

Python uses the words `and`, `or` and `not`:

```python
is_weekend = True
is_raining = False

if is_weekend and not is_raining:
    print("Go for a hike!")
```

Chained comparisons read naturally:

```python
hour = 14
if 12 <= hour < 17:
    print("Good afternoon")
```

## Truthiness

Any value can be used as a condition. These are **falsy**: `False`, `None`, `0`, `0.0`, `""`, `[]`, `{}`, `set()`. Everything else is truthy.

```python
cart = []

if not cart:
    print("Your cart is empty")
```

This is more idiomatic than `if len(cart) == 0:`.

## Conditional expressions

A one-line if/else that produces a value:

```python
age = 20
status = "adult" if age >= 18 else "minor"
```

## Membership tests with `in`

```python
role = "editor"

if role in ("admin", "editor"):
    print("You can edit posts")
```

## `match` (Python 3.10+)

`match` compares a value against patterns — cleaner than a long `elif` chain for many fixed values:

```python
command = "stop"

match command:
    case "start":
        print("Starting…")
    case "stop" | "quit":
        print("Stopping.")
    case _:
        print(f"Unknown command: {command}")
```

`case _` matches anything, like `else`.

## Try it yourself

Ask the user for a year and print whether it's a leap year. A year is a leap year if it's divisible by 4, **except** years divisible by 100, **unless** they're also divisible by 400. (2000 and 2024 are leap years; 1900 is not.)
