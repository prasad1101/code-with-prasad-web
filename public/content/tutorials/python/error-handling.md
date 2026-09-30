Things go wrong: files are missing, users type letters where numbers are expected, networks drop. Python signals these problems with **exceptions**. Handling them well is the difference between a program that crashes and one that recovers gracefully.

## What an exception looks like

```python
number = int("abc")
```

```text
Traceback (most recent call last):
  File "main.py", line 1, in <module>
    number = int("abc")
ValueError: invalid literal for int() with base 10: 'abc'
```

Read tracebacks from the **bottom up**: the last line tells you the exception type and message, and the lines above show where it happened.

## Common exceptions

| Exception | Typical cause |
| --- | --- |
| `ValueError` | Right type, wrong value — `int("abc")` |
| `TypeError` | Wrong type — `"age: " + 5` |
| `KeyError` | Missing dictionary key |
| `IndexError` | List index out of range |
| `FileNotFoundError` | Opening a file that doesn't exist |
| `ZeroDivisionError` | Dividing by zero |
| `AttributeError` | Using a method or attribute that doesn't exist |

## `try` / `except`

```python
try:
    age = int(input("Your age: "))
    print(f"Next year you'll be {age + 1}")
except ValueError:
    print("Please enter a whole number.")
```

If the code in `try` raises a `ValueError`, Python jumps to the matching `except` block instead of crashing.

## Handling several exceptions

```python
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("Can't divide by zero")
    except TypeError as err:
        print(f"Bad input: {err}")
    return None
```

`as err` gives you the exception object, which is useful for logging.

> Catch **specific** exceptions. A bare `except:` or `except Exception:` hides real bugs, such as typos in your own code.

## `else` and `finally`

```python
try:
    f = open("data.txt")
except FileNotFoundError:
    print("No data file yet")
else:
    print(f.read())       # runs only if no exception occurred
    f.close()
finally:
    print("Done")         # always runs, error or not
```

## `with`: automatic clean-up

For files and other resources, `with` guarantees clean-up even if an exception happens — usually better than `finally`:

```python
try:
    with open("data.txt", encoding="utf-8") as f:
        for line in f:
            print(line.strip())
except FileNotFoundError:
    print("File not found")
```

## Raising exceptions

Raise an exception when your function receives input it can't work with:

```python
def withdraw(balance: float, amount: float) -> float:
    if amount <= 0:
        raise ValueError("Amount must be positive")
    if amount > balance:
        raise ValueError(f"Insufficient funds: balance is {balance}")
    return balance - amount
```

The caller decides how to handle it.

## Custom exceptions

For your own error categories, subclass `Exception`:

```python
class PaymentError(Exception):
    """Raised when a payment can't be processed."""

def charge(card_valid: bool):
    if not card_valid:
        raise PaymentError("Card was declined")

try:
    charge(False)
except PaymentError as err:
    print(f"Payment failed: {err}")
```

## Try it yourself

Write a program that keeps asking the user for a number until they enter a valid integer between 1 and 10, printing a helpful message for each kind of mistake. Then print that number's multiplication table.
