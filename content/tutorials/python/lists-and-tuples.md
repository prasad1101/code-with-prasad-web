Lists and tuples store **ordered collections** of items. Lists can change after they're created; tuples can't.

## Lists

```python
languages = ["Python", "JavaScript", "Go"]

print(languages[0])     # Python
print(languages[-1])    # Go
print(len(languages))   # 3
print(languages[1:])    # ['JavaScript', 'Go'] — slicing works like strings
```

A list can hold any types, even other lists:

```python
mixed = [1, "two", 3.0, [4, 5]]
```

## Changing lists

```python
nums = [3, 1, 4]

nums.append(1)        # add to the end        → [3, 1, 4, 1]
nums.insert(0, 9)     # insert at index 0     → [9, 3, 1, 4, 1]
nums.extend([5, 9])   # add several           → [9, 3, 1, 4, 1, 5, 9]
nums.remove(1)        # remove first 1        → [9, 3, 4, 1, 5, 9]
last = nums.pop()     # remove and return last → 9
nums[0] = 2           # replace by index      → [2, 3, 4, 1, 5]
del nums[1]           # delete by index       → [2, 4, 1, 5]
```

## Searching and counting

```python
colors = ["red", "green", "blue", "green"]

"blue" in colors        # True
colors.index("green")   # 1 — first match (ValueError if missing)
colors.count("green")   # 2
```

## Sorting

```python
scores = [72, 45, 90, 38]

scores.sort()                   # sorts in place → [38, 45, 72, 90]
scores.sort(reverse=True)       # → [90, 72, 45, 38]

names = ["ravi", "Asha", "meera"]
print(sorted(names))                    # ['Asha', 'meera', 'ravi'] — new list
print(sorted(names, key=str.lower))     # ['Asha', 'meera', 'ravi']
print(sorted(names, key=len))           # ['ravi', 'Asha', 'meera']
```

`list.sort()` changes the list; `sorted()` returns a new one.

## Useful built-ins

```python
marks = [72, 45, 90, 38, 66]

sum(marks)                  # 311
max(marks)                  # 90
min(marks)                  # 38
sum(marks) / len(marks)     # 62.2
```

## Copying lists

Assignment doesn't copy — both names refer to the same list:

```python
a = [1, 2, 3]
b = a
b.append(4)
print(a)        # [1, 2, 3, 4]

c = a.copy()    # or a[:] or list(a)
c.append(5)
print(a)        # [1, 2, 3, 4] — unchanged
```

## Tuples

A tuple is like a list that **can't be changed**. Use tuples for fixed groups of values:

```python
point = (10, 20)
rgb = (255, 128, 0)

print(point[0])    # 10
point[0] = 5       # TypeError: 'tuple' object does not support item assignment
```

A one-item tuple needs a trailing comma: `(42,)`.

## Unpacking

Unpacking assigns the items of a list or tuple to separate variables:

```python
x, y = point
first, *rest = [1, 2, 3, 4]   # first = 1, rest = [2, 3, 4]

def min_max(values):
    return min(values), max(values)   # returns a tuple

low, high = min_max([4, 9, 1])
```

## Lists or tuples?

- Use a **list** for a collection of similar items that may grow or change (a list of users).
- Use a **tuple** for a fixed record whose positions have meaning (a coordinate, an RGB colour, a function returning two values).

## Try it yourself

Given `marks = [72, 45, 90, 38, 66, 81]`:

1. Create a new list of passing marks (≥ 40) with a list comprehension.
2. Print the average, rounded to one decimal place.
3. Print the top three marks in descending order.
