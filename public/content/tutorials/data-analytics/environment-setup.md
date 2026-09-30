A good environment lets you explore data interactively, keep analyses reproducible, and share results. This lesson sets up Python, the core data libraries and Jupyter notebooks.

## Install Python and create a project

Install a current Python 3 release (see the Python course), then create a project folder with its own virtual environment:

```bash
mkdir sales-analysis && cd sales-analysis
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
python -m pip install pandas numpy matplotlib seaborn scipy jupyterlab openpyxl duckdb
```

Or with **uv**, which is much faster:

```bash
uv init sales-analysis && cd sales-analysis
uv add pandas numpy matplotlib seaborn scipy jupyterlab openpyxl duckdb
```

| Library | Purpose |
| --- | --- |
| **NumPy** | Fast numerical arrays — the foundation of the data stack |
| **pandas** | Tables (DataFrames): loading, cleaning, transforming, aggregating |
| **Matplotlib** / **seaborn** | Static charts |
| **SciPy** | Statistical tests and scientific functions |
| **JupyterLab** | Interactive notebooks |
| **openpyxl** | Reading and writing Excel files |
| **DuckDB** | Fast SQL directly on files and DataFrames |

## Jupyter notebooks

```bash
jupyter lab
```

A notebook mixes **code cells**, their **output** (tables, charts) and **Markdown** notes in one document — ideal for exploration and for explaining an analysis step by step. VS Code also runs notebooks natively (install the Python and Jupyter extensions).

Useful shortcuts:

| Shortcut | Action |
| --- | --- |
| `Shift + Enter` | Run cell and move to the next |
| `A` / `B` | Insert cell above / below (command mode) |
| `M` / `Y` | Change cell to Markdown / code |
| `D D` | Delete cell |

## Keeping notebooks reproducible

Notebooks make it easy to run cells out of order and end up with results you can't reproduce. Good habits:

- **Restart the kernel and run all cells** before sharing results.
- Put imports and configuration in the first cell.
- Load data from a file path or query — never from state created in a deleted cell.
- Move reusable logic into `.py` modules and import it.
- Record library versions (`pip freeze > requirements.txt` or a `uv.lock`).

## A standard first cell

```python
import numpy as np
import pandas as pd

pd.set_option("display.max_columns", 50)
pd.set_option("display.float_format", "{:,.2f}".format)

print("pandas", pd.__version__, "| numpy", np.__version__)
```

```text
pandas 3.0.6 | numpy 2.5.3
```

## Project structure

```text
sales-analysis/
  data/
    raw/            # original files, never modified
    processed/      # cleaned outputs
  notebooks/
    01-exploration.ipynb
    02-cohort-analysis.ipynb
  src/
    cleaning.py     # reusable functions
  reports/          # exported charts and summaries
  pyproject.toml
```

Keep **raw data read-only** so any result can be recreated from the original inputs.

## Alternatives

- **Google Colab** — free hosted notebooks in the browser, no installation.
- **Anaconda** — a distribution bundling Python, Jupyter and hundreds of data packages.

## Try it yourself

Set up the environment, launch JupyterLab, create a notebook with the standard first cell, and write a Markdown cell describing a question you want to answer with data.
