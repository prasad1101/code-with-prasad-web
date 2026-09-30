Python is a general-purpose programming language known for being **easy to read and quick to write**. It's one of the most popular languages in the world, and a great first language — and a powerful tool you'll keep using long after.

## Where Python is used

- **Automation and scripting** — renaming files, processing spreadsheets, scraping websites.
- **Web back ends** — frameworks such as Django, Flask and FastAPI.
- **Data analysis** — pandas, NumPy and Jupyter notebooks.
- **Machine learning and AI** — PyTorch, scikit-learn and much of the modern AI ecosystem.
- **DevOps and tooling** — many infrastructure tools are written in or scripted with Python.

## Why Python is beginner-friendly

Python code looks close to plain English, and it uses **indentation** instead of braces to group code. Compare the same logic in two languages:

```python
# Python
for name in ["Asha", "Ravi"]:
    if len(name) > 3:
        print(f"Hello, {name}!")
```

```js
// JavaScript
for (const name of ['Asha', 'Ravi']) {
  if (name.length > 3) {
    console.log(`Hello, ${name}!`)
  }
}
```

Less punctuation means fewer things to get wrong while you're learning.

## Python is interpreted

You don't compile Python code before running it. The Python **interpreter** reads your program and runs it directly, which makes the write → run → fix cycle very fast. You can even type code interactively and see results immediately.

## Python 2 vs. Python 3

Python 2 reached end-of-life in 2020. Everything in this tutorial uses **Python 3**, and you should use a current Python 3 release for anything new.

## A first taste

```python
name = "World"
print(f"Hello, {name}!")   # Hello, World!

numbers = [3, 1, 4, 1, 5]
print(sum(numbers))        # 14
print(sorted(numbers))     # [1, 1, 3, 4, 5]
```

## What you'll learn in this tutorial

1. Installing Python and running programs
2. Variables, data types and strings
3. Conditionals and loops
4. Lists, tuples, dictionaries and sets
5. Functions, modules and packages
6. Handling errors and writing classes

Type every example yourself and experiment with it. Changing an example and predicting what will happen is the fastest way to learn.
