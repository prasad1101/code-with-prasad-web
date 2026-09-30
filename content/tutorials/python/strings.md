Strings hold text. They're one of the types you'll use most, so Python gives them a rich set of tools.

## Creating strings

```python
single = 'single quotes'
double = "double quotes"
quote = "It's easy"             # mix quote styles to avoid escaping
multi = """This string
spans several lines."""
```

## f-strings: inserting values

**f-strings** (formatted string literals) are the modern way to build strings:

```python
name = "Asha"
score = 91.456

print(f"{name} scored {score:.1f}%")    # Asha scored 91.5%
print(f"{name!r} has {len(name)} letters")  # 'Asha' has 4 letters
print(f"{1234567:,}")                   # 1,234,567
```

Anything inside `{ }` is evaluated as a Python expression, and the part after `:` controls formatting.

## Indexing and slicing

Strings are sequences of characters. Indexes start at 0, and negative indexes count from the end.

```python
word = "Python"

print(word[0])     # P
print(word[-1])    # n
print(word[0:3])   # Pyt   — from index 0 up to (not including) 3
print(word[2:])    # thon
print(word[:2])    # Py
print(word[::-1])  # nohtyP — reversed
```

Strings are **immutable**: you can't change a character in place. Operations always create a new string.

## Common string methods

```python
text = "  Hello, World!  "

text.strip()                 # 'Hello, World!'
text.lower()                 # '  hello, world!  '
text.upper()                 # '  HELLO, WORLD!  '
text.strip().replace("World", "Python")  # 'Hello, Python!'
"hello world".title()        # 'Hello World'
"a,b,c".split(",")           # ['a', 'b', 'c']
"-".join(["2026", "09", "30"])  # '2026-09-30'
"report.pdf".endswith(".pdf")   # True
"banana".count("a")          # 3
"banana".find("n")           # 2 (-1 if not found)
```

## Checking content

```python
"py" in "python"       # True
"42".isdigit()         # True
"hello".isalpha()      # True
not "   ".strip()      # True — an empty string is falsy
```

## Concatenation and repetition

```python
greeting = "Hello" + ", " + "Ravi"
line = "-" * 20
print(greeting)
print(line)            # --------------------
```

Prefer f-strings over `+` when mixing text with numbers — `"Age: " + 28` raises a `TypeError`, while `f"Age: {28}"` just works.

## Escape characters

```python
print("Line one\nLine two")   # \n = new line
print("Tab\tseparated")       # \t = tab
print("A backslash: \\")
print(r"C:\new\folder")       # raw string: backslashes kept as-is
```

## Try it yourself

1. Ask the user for their full name and print it in title case, along with the number of characters (excluding spaces).
2. Check whether a word is a palindrome (reads the same backwards), ignoring case. `"Level"` should return `True`.
