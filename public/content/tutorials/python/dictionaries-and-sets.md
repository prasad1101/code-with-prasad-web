**Dictionaries** map keys to values, like a real dictionary maps words to definitions. **Sets** hold unique values with no duplicates. Both offer very fast lookups.

## Creating dictionaries

```python
user = {
    "name": "Asha",
    "age": 28,
    "skills": ["Python", "SQL"],
}
```

Keys are usually strings, but any immutable value (numbers, tuples) can be a key.

## Reading values

```python
print(user["name"])              # Asha
print(user.get("city"))          # None — no error if the key is missing
print(user.get("city", "Pune"))  # Pune — a default value
print(user["city"])              # KeyError: 'city'
```

Use `.get()` when a key might be missing.

## Adding, updating and removing

```python
user["city"] = "Pune"          # add
user["age"] = 29               # update
user.update({"age": 30, "role": "dev"})
removed = user.pop("role")     # remove and return the value
del user["city"]               # remove
```

## Looping over dictionaries

```python
prices = {"tea": 20, "coffee": 35, "juice": 50}

for item in prices:                   # keys
    print(item)

for price in prices.values():         # values
    print(price)

for item, price in prices.items():    # both
    print(f"{item}: ₹{price}")
```

Dictionaries remember the order in which keys were inserted.

## Checking for keys

```python
if "tea" in prices:
    print("We have tea")
```

## Dictionary comprehensions

```python
names = ["asha", "ravi", "meera"]
lengths = {name: len(name) for name in names}
# {'asha': 4, 'ravi': 4, 'meera': 5}

discounted = {item: price * 0.9 for item, price in prices.items()}
```

## Counting things

Counting occurrences is a classic dictionary task:

```python
words = "the cat and the hat".split()
counts = {}

for word in words:
    counts[word] = counts.get(word, 0) + 1

print(counts)   # {'the': 2, 'cat': 1, 'and': 1, 'hat': 1}
```

The standard library's `collections.Counter` does this in one line: `Counter(words)`.

## Nested data

Real data — like JSON from an API — is often dictionaries inside lists inside dictionaries:

```python
order = {
    "id": 101,
    "items": [
        {"name": "Keyboard", "price": 1500},
        {"name": "Mouse", "price": 700},
    ],
}

total = sum(item["price"] for item in order["items"])
print(total)   # 2200
```

## Sets

A set is an unordered collection of **unique** items:

```python
tags = {"python", "web", "python"}
print(tags)              # {'python', 'web'} — duplicates removed

tags.add("api")
tags.discard("web")      # remove if present (no error if missing)
print("api" in tags)     # True — very fast membership test
```

Remove duplicates from a list:

```python
emails = ["a@x.com", "b@x.com", "a@x.com"]
unique = list(set(emails))    # order is not preserved
```

Create an empty set with `set()` — `{}` creates an empty dictionary.

## Set operations

```python
backend = {"python", "go", "sql"}
frontend = {"javascript", "css", "sql"}

backend | frontend    # union: all skills
backend & frontend    # intersection: {'sql'}
backend - frontend    # difference: {'python', 'go'}
```

## Try it yourself

1. Write a program that counts how many times each letter appears in a word the user enters.
2. Given two lists of student names for two courses, print the students enrolled in **both** courses and those enrolled in only one.
