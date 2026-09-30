A **class** is a blueprint for creating objects that bundle **data** (attributes) and **behaviour** (methods) together. Classes are the core of object-oriented programming (OOP) in Python.

## Defining a class

```python
class BankAccount:
    def __init__(self, owner: str, balance: float = 0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("Deposit must be positive")
        self.balance += amount

    def withdraw(self, amount: float) -> None:
        if amount > self.balance:
            raise ValueError("Insufficient funds")
        self.balance -= amount
```

- `__init__` is the **initialiser**. It runs when a new object is created and sets up its attributes.
- `self` is the object itself. Every method receives it as its first parameter.

## Creating objects

```python
account = BankAccount("Asha", 1000)   # an *instance* of BankAccount
account.deposit(500)
account.withdraw(200)

print(account.owner)     # Asha
print(account.balance)   # 1300
```

Each instance has its own data:

```python
a = BankAccount("Ravi")
b = BankAccount("Meera", 50)
print(a.balance, b.balance)   # 0 50
```

## A readable representation: `__repr__`

```python
class BankAccount:
    # ... as above ...

    def __repr__(self) -> str:
        return f"BankAccount(owner={self.owner!r}, balance={self.balance})"

print(BankAccount("Asha", 10))   # BankAccount(owner='Asha', balance=10)
```

Methods with double underscores ("dunder" methods) let your objects work with Python's built-in features, such as printing, comparing, `len()` and `+`.

## Class attributes

Attributes defined on the class itself are shared by all instances:

```python
class BankAccount:
    bank_name = "Code Bank"   # shared by every account

    def __init__(self, owner):
        self.owner = owner    # unique to each account
```

## Inheritance

A class can **inherit** from another class, reusing its code and adding or changing behaviour:

```python
class SavingsAccount(BankAccount):
    def __init__(self, owner: str, balance: float = 0, rate: float = 0.04):
        super().__init__(owner, balance)   # run the parent's initialiser
        self.rate = rate

    def add_interest(self) -> None:
        self.deposit(self.balance * self.rate)

savings = SavingsAccount("Asha", 1000)
savings.add_interest()
print(savings.balance)   # 1040.0
savings.withdraw(40)     # inherited from BankAccount
```

## Properties

Use `@property` to compute values or protect attributes while keeping simple attribute syntax:

```python
class Rectangle:
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    @property
    def area(self) -> float:
        return self.width * self.height

r = Rectangle(3, 4)
print(r.area)   # 12 — no parentheses
```

## Dataclasses

For classes that mainly hold data, `dataclasses` writes `__init__`, `__repr__` and equality for you:

```python
from dataclasses import dataclass

@dataclass
class Product:
    name: str
    price: float
    in_stock: bool = True

mouse = Product("Mouse", 700)
print(mouse)                          # Product(name='Mouse', price=700, in_stock=True)
print(mouse == Product("Mouse", 700)) # True
```

## When to use classes

Use a class when you have data plus operations that belong together and several instances to manage — accounts, users, shapes, game characters. For a single operation, a plain function is often simpler. Python lets you choose whatever fits.

## Try it yourself

1. Create a `Student` class with a name and a list of marks, and methods `add_mark(mark)` and `average()`.
2. Add a `__repr__`.
3. Create a `GraduateStudent` subclass with a `thesis_title` attribute.

**Congratulations** — you've completed the Python fundamentals! Good next steps: working with files and APIs, building a small web app with Flask or FastAPI, or exploring data with pandas.
