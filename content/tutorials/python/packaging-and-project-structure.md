Scripts become projects; projects become packages other people install. This lesson covers how professional Python projects are structured, how dependencies are managed, and how to publish a package.

## Recommended project layout

```text
invoice-tool/
  pyproject.toml          # project metadata, dependencies, tool configuration
  README.md
  src/
    invoice_tool/
      __init__.py
      __main__.py         # enables `python -m invoice_tool`
      cli.py
      models.py
      pdf.py
  tests/
    test_models.py
  .gitignore
```

The **`src/` layout** ensures tests run against the *installed* package rather than files that happen to be importable from the working directory — catching packaging mistakes early.

## `pyproject.toml`

The single, standard configuration file for Python projects:

```toml
[project]
name = "invoice-tool"
version = "0.1.0"
description = "Generate GST invoices from CSV files"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
  "pydantic>=2.7",
  "jinja2>=3.1",
]

[project.optional-dependencies]
dev = ["pytest>=8", "mypy>=1.10", "ruff>=0.6"]

[project.scripts]
invoice-tool = "invoice_tool.cli:main"     # installs an `invoice-tool` command

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
testpaths = ["tests"]

[tool.ruff]
line-length = 100
```

## Virtual environments

Every project should have its own environment, so dependencies don't clash between projects:

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python -m pip install -e ".[dev]"  # editable install of your project + dev tools
```

An **editable install** (`-e`) means code changes take effect without reinstalling.

## Modern tooling: uv

**uv** is a very fast tool that manages Python versions, virtual environments, dependencies and lockfiles in one:

```bash
uv init invoice-tool
cd invoice-tool
uv add pydantic jinja2          # adds to pyproject.toml and updates uv.lock
uv add --dev pytest ruff mypy
uv run pytest                   # runs inside the project's environment
uv run invoice-tool --help
```

The **lockfile** (`uv.lock`) pins exact versions of every dependency, so every machine and CI run installs the same thing. (Poetry and PDM offer similar workflows.)

### Pinning strategy

- **Applications**: commit the lockfile for reproducible deployments.
- **Libraries**: declare compatible version *ranges* in `pyproject.toml` (don't pin exact versions), so your library works alongside others.

## Code quality tools

```bash
ruff check .          # fast linter (replaces flake8, isort and many plugins)
ruff format .         # formatter (Black-compatible)
mypy src/             # static type checking
pytest                # tests
```

Run them automatically with **pre-commit** hooks and in CI on every pull request.

## Configuration and secrets

- Read configuration from environment variables (optionally a `.env` file in development); validate it at startup (e.g. `pydantic-settings`).
- Never commit secrets; keep `.env` in `.gitignore`.

## Logging instead of print

```python
import logging

logger = logging.getLogger(__name__)

def generate_invoice(order_id: str) -> None:
    logger.info("Generating invoice for %s", order_id)
    try:
        ...
    except Exception:
        logger.exception("Invoice generation failed for %s", order_id)
        raise

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    generate_invoice("SO-1")
```

Libraries should only create loggers; applications configure handlers and levels.

## Command-line interfaces

`argparse` (standard library) or libraries like **Typer**/**Click** turn functions into CLIs:

```python
import argparse

def main() -> None:
    parser = argparse.ArgumentParser(description="Generate invoices")
    parser.add_argument("csv_file")
    parser.add_argument("--output", default="invoices/")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(args.csv_file, args.output, args.dry_run)

if __name__ == "__main__":
    main()
```

## Building and publishing

```bash
uv build                        # or: python -m build → dist/*.whl and dist/*.tar.gz
uv publish                      # or: twine upload dist/*   (to PyPI)
```

Test the process on **TestPyPI** first. Use semantic versioning and keep a changelog.

## Deploying applications

- **Docker**: a slim Python base image, install from the lockfile, run as a non-root user.
- **Serverless** (AWS Lambda, Cloud Run functions): package dependencies with the function.
- Keep the same Python version in development, CI and production.

## Try it yourself

Turn a script you've written into a package with the `src/` layout: a `pyproject.toml` with dependencies and a console script entry point, tests with pytest, ruff and mypy configured, and a GitHub Actions workflow that runs all of them. Build a wheel and install it in a fresh virtual environment to verify the command works.
