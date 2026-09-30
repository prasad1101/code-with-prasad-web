Automated tests let you change code without fear. **pytest** is Python's most popular testing framework: tests are plain functions with plain `assert` statements, and it has powerful features for setup (fixtures), data-driven tests and plugins.

## Installing and running

```bash
python -m pip install pytest
pytest              # finds test_*.py files and test_* functions
pytest -q           # quieter output
pytest -k discount  # only tests whose name contains "discount"
pytest -x           # stop at the first failure
```

## Your first tests

```python
# pricing.py
def apply_discount(price: float, percent: float) -> float:
    if not 0 <= percent <= 100:
        raise ValueError("percent must be between 0 and 100")
    return round(price * (1 - percent / 100), 2)
```

```python
# test_pricing.py
import pytest
from pricing import apply_discount

def test_applies_percentage_discount():
    assert apply_discount(1000, 10) == 900

def test_zero_discount_returns_same_price():
    assert apply_discount(499.99, 0) == 499.99

def test_rejects_invalid_percent():
    with pytest.raises(ValueError, match="between 0 and 100"):
        apply_discount(100, 150)
```

When an `assert` fails, pytest shows the values on both sides — no special assertion methods needed.

## Parametrised tests

Run the same test with many inputs:

```python
import pytest
from pricing import apply_discount

@pytest.mark.parametrize(
    ("price", "percent", "expected"),
    [
        (1000, 10, 900),
        (199.99, 50, 100.0),
        (100, 100, 0),
    ],
)
def test_discount_cases(price, percent, expected):
    assert apply_discount(price, percent) == expected
```

## Fixtures: reusable setup

Fixtures provide test data or resources; tests request them by naming them as parameters:

```python
import pytest

class Cart:
    def __init__(self):
        self.items = {}

    def add(self, sku, qty=1):
        self.items[sku] = self.items.get(sku, 0) + qty

    @property
    def count(self):
        return sum(self.items.values())

@pytest.fixture
def cart():
    return Cart()                   # a fresh cart for every test

def test_add_increments_quantity(cart):
    cart.add("pen")
    cart.add("pen", 2)
    assert cart.items["pen"] == 3

def test_empty_cart_has_no_items(cart):
    assert cart.count == 0
```

Fixtures can `yield` to run cleanup code after the test, can depend on other fixtures, and can be shared across files by putting them in `conftest.py`.

### Built-in fixtures

```python
def test_writes_report(tmp_path):                # a fresh temporary directory
    report = tmp_path / "report.txt"
    report.write_text("total=42")
    assert report.read_text() == "total=42"

def test_prints_greeting(capsys):                # captured stdout/stderr
    print("hello")
    assert capsys.readouterr().out == "hello\n"

def test_reads_env(monkeypatch):                 # temporarily patch env vars/attributes
    monkeypatch.setenv("APP_ENV", "test")
    import os
    assert os.environ["APP_ENV"] == "test"
```

## Mocking

Replace slow or unpredictable dependencies (network, time, payment gateways):

```python
from unittest.mock import Mock

def checkout(cart_total, gateway):
    charge_id = gateway.charge(cart_total)
    return {"status": "paid", "charge_id": charge_id}

def test_checkout_charges_the_gateway():
    gateway = Mock()
    gateway.charge.return_value = "ch_123"

    result = checkout(499, gateway)

    gateway.charge.assert_called_once_with(499)
    assert result == {"status": "paid", "charge_id": "ch_123"}
```

Passing dependencies in as arguments (as `gateway` above) makes mocking trivial. For code that imports dependencies directly, `monkeypatch.setattr` or `unittest.mock.patch` can replace them.

## Coverage

```bash
python -m pip install pytest-cov
pytest --cov=src --cov-report=term-missing
```

Coverage shows untested lines. Use it to find gaps, not as a target to game.

## Organising tests

```text
project/
  src/shop/pricing.py
  tests/
    conftest.py           # shared fixtures
    test_pricing.py
    test_cart.py
  pyproject.toml          # pytest configuration
```

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-ra"
```

## What makes a good test

- Tests one behaviour, with a descriptive name.
- Arrange → Act → Assert structure.
- Fast and independent (no shared state, no real network).
- Covers edge cases and error paths, not just the happy path.

## Try it yourself

Write a `password_strength(password)` function returning `"weak"`, `"medium"` or `"strong"`, then test it with a parametrised test covering at least eight passwords, a fixture providing a list of commonly used passwords that must always be "weak", and a test using `pytest.raises` for non-string input.
