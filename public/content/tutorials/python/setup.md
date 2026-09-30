In this lesson you'll install Python, run code interactively, and write and run your first script.

## Installing Python

**Windows**

1. Download the latest Python 3 installer from [python.org/downloads](https://www.python.org/downloads/).
2. Run it and **tick "Add python.exe to PATH"** on the first screen.
3. Open a new Command Prompt and check:

```bash
python --version
```

**macOS**

macOS may include an older system Python. Install a current version from python.org, or with Homebrew:

```bash
brew install python
python3 --version
```

**Linux**

Most distributions include Python 3. If not, use your package manager, for example:

```bash
sudo apt install python3 python3-venv
python3 --version
```

> On macOS and Linux the command is usually `python3`; on Windows it's usually `python` (or `py`). This tutorial writes `python` — use whichever works on your system.

## The interactive shell (REPL)

Type `python` (or `python3`) with no arguments to start the interactive shell:

```text
>>> 2 + 3
5
>>> "hello".upper()
'HELLO'
>>> exit()
```

The `>>>` prompt means Python is waiting for input. The shell is perfect for trying out small snippets.

## Your first script

Create a file called `hello.py`:

```python
name = input("What's your name? ")
print(f"Nice to meet you, {name}!")
```

Run it from a terminal in the same folder:

```bash
python hello.py
```

- `input()` shows a prompt and waits for the user to type something.
- `print()` writes output to the terminal.

## Choosing an editor

**Visual Studio Code** with the official Python extension is a great free choice. It gives you autocompletion, error highlighting and a Run button. PyCharm Community Edition is another popular option.

## Comments

```python
# This is a comment — Python ignores it.

print("Comments explain *why* code does something")  # comments can go at the end of a line
```

## Indentation matters

Python uses indentation to define blocks of code. The standard is **4 spaces**:

```python
if 5 > 2:
    print("Five is greater than two")   # indented: inside the if
print("This always runs")               # not indented: outside
```

Inconsistent indentation causes an `IndentationError`. Your editor can insert 4 spaces whenever you press Tab.

## Try it yourself

Write a script that asks for the user's name and birth year, then prints how old they'll be at the end of this year.
