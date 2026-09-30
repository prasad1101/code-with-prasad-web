A **variable** is a name that refers to a value. In Python you create a variable simply by assigning to it — there's no keyword and no type declaration.

## Creating variables

```python
name = "Asha"
age = 28
height = 1.62
is_student = False
```

Python works out the type from the value. A variable can later refer to a value of a different type, but doing that usually makes code harder to follow.

## Naming rules and style

- Names can contain letters, digits and underscores, but can't start with a digit.
- Names are case-sensitive: `total` and `Total` are different.
- Python style (PEP 8) uses **snake_case**: `first_name`, `total_price`.
- By convention, constants use UPPER_CASE: `MAX_RETRIES = 3`.

## Core data types

| Type | Example | Description |
| --- | --- | --- |
| `int` | `42`, `-7`, `1_000_000` | Whole numbers of any size |
| `float` | `3.14`, `2.5e3` | Decimal numbers |
| `str` | `"hello"`, `'hi'` | Text |
| `bool` | `True`, `False` | Yes/no values |
| `NoneType` | `None` | "No value" |
| `list`, `tuple`, `dict`, `set` | `[1, 2]`, `(1, 2)`, `{"a": 1}`, `{1, 2}` | Collections (covered later) |

Check a value's type with `type()`:

```python
print(type(42))       # <class 'int'>
print(type(3.14))     # <class 'float'>
print(type("hi"))     # <class 'str'>
print(type(None))     # <class 'NoneType'>
```

## Numbers and arithmetic

```python
print(7 + 2)    # 9
print(7 - 2)    # 5
print(7 * 2)    # 14
print(7 / 2)    # 3.5   — true division always gives a float
print(7 // 2)   # 3     — floor division
print(7 % 2)    # 1     — remainder
print(7 ** 2)   # 49    — power
```

Python integers never overflow — `2 ** 100` just works.

## Booleans and comparisons

```python
print(5 > 3)          # True
print(5 == 5)         # True
print(5 != 3)         # True
print(3 < 5 < 10)     # True — comparisons can be chained

print(True and False) # False
print(True or False)  # True
print(not True)       # False
```

## Converting between types

```python
age = int("28")       # str → int
price = float("9.99") # str → float
label = str(42)       # int → str

print(int(3.99))      # 3 — truncates toward zero
print(bool(0))        # False
print(bool("text"))   # True
```

`input()` always returns a string, so convert it before doing maths:

```python
years = int(input("Years of experience: "))
print(f"In five years you'll have {years + 5} years of experience.")
```

## Multiple assignment

```python
x, y = 10, 20
x, y = y, x       # swap in one line
print(x, y)       # 20 10
```

## `None`

`None` represents the absence of a value. Check for it with `is`:

```python
middle_name = None
if middle_name is None:
    print("No middle name")
```

## Try it yourself

Ask the user for the length and width of a room in metres, convert both to `float`, and print the area rounded to two decimal places using `round(area, 2)`.
