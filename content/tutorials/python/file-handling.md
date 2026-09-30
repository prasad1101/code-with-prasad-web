Programs constantly read and write files: configuration, logs, CSV exports, JSON data. Python makes this straightforward with `open()`, the `pathlib` module and the `csv` and `json` modules.

## Paths with `pathlib`

`pathlib.Path` represents file-system paths and works the same on Windows, macOS and Linux:

```python
from pathlib import Path

data_dir = Path("data")
report = data_dir / "reports" / "2026-09.csv"   # join with /

print(report.name)       # 2026-09.csv
print(report.stem)       # 2026-09
print(report.suffix)     # .csv
print(report.parent)     # data/reports

report.parent.mkdir(parents=True, exist_ok=True)  # create folders if needed
print(report.exists())
```

## Reading and writing text

The simplest way for small files:

```python
from pathlib import Path

path = Path("notes.txt")
path.write_text("First line\nSecond line\n", encoding="utf-8")
content = path.read_text(encoding="utf-8")
print(content.splitlines())   # ['First line', 'Second line']
```

Always pass `encoding="utf-8"` — the default encoding differs between operating systems.

## `open()` and the `with` statement

For more control (appending, reading line by line, large files), use `open()` inside a `with` block, which closes the file automatically — even if an error occurs:

```python
with open("app.log", "a", encoding="utf-8") as f:   # "a" = append
    f.write("Server started\n")

with open("app.log", encoding="utf-8") as f:        # default mode "r" = read
    for line in f:                                   # reads one line at a time — memory-efficient
        print(line.rstrip())
```

| Mode | Meaning |
| --- | --- |
| `"r"` | Read (default); error if missing |
| `"w"` | Write; **truncates** existing content |
| `"a"` | Append |
| `"x"` | Create; error if the file exists |
| `"b"` | Binary (combine: `"rb"`, `"wb"`) |

## JSON

```python
import json
from pathlib import Path

settings = {"theme": "dark", "notifications": True, "languages": ["en", "hi"]}

Path("settings.json").write_text(json.dumps(settings, indent=2), encoding="utf-8")

loaded = json.loads(Path("settings.json").read_text(encoding="utf-8"))
print(loaded["languages"])   # ['en', 'hi']
```

`json.dump(obj, f)` / `json.load(f)` work directly with open file objects.

## CSV

```python
import csv

rows = [
    {"name": "Asha", "city": "Pune", "orders": 5},
    {"name": "Ravi", "city": "Mumbai", "orders": 2},
]

with open("customers.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "city", "orders"])
    writer.writeheader()
    writer.writerows(rows)

with open("customers.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        print(row["name"], int(row["orders"]))   # CSV values are always strings
```

Pass `newline=""` when opening CSV files so the `csv` module handles line endings correctly. For heavy data analysis, pandas (see the Data Analytics course) reads CSV into tables in one line.

## Listing and finding files

```python
from pathlib import Path

for path in Path(".").glob("*.csv"):          # this folder
    print(path, path.stat().st_size, "bytes")

for path in Path(".").rglob("*.py"):          # recursively
    print(path)
```

## Handling errors

```python
from pathlib import Path

try:
    config = Path("config.json").read_text(encoding="utf-8")
except FileNotFoundError:
    config = "{}"
except PermissionError:
    raise SystemExit("No permission to read config.json")
```

## Binary files

```python
from pathlib import Path

data = Path("logo.png").read_bytes()
print(data[:8])   # b'\x89PNG\r\n\x1a\n' for PNG files
```

## Try it yourself

Write a script that reads a CSV of expenses (`date,category,amount`), totals the amount per category, and writes the result both to `summary.json` and to `summary.csv`. Skip rows with invalid amounts and print how many were skipped.
