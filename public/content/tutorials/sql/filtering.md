`WHERE` supports much more than equality. This lesson covers comparison and logical operators, ranges, lists, patterns — and the special rules for `NULL`.

## Comparison operators

```sql
SELECT name, price FROM products WHERE price > 1000;
SELECT name, price FROM products WHERE price <= 199;
SELECT name FROM products WHERE category <> 'books';    -- not equal (!= also works)
```

## Combining conditions

```sql
SELECT name, price, stock
FROM products
WHERE category = 'electronics' AND price < 2000;

SELECT name FROM products WHERE stock = 0 OR price > 3000;

SELECT name FROM products WHERE NOT (category = 'books');
```

`AND` binds more tightly than `OR`. Use parentheses to make intent explicit:

```sql
-- Electronics or books, but only if in stock
SELECT name FROM products
WHERE (category = 'electronics' OR category = 'books') AND stock > 0;
```

## Ranges and lists

```sql
SELECT name, price FROM products WHERE price BETWEEN 500 AND 1500;   -- inclusive on both ends
SELECT name FROM products WHERE category IN ('books', 'home');
SELECT name FROM products WHERE category NOT IN ('books', 'home');
```

For timestamps, prefer half-open ranges over `BETWEEN` so you don't miss or double-count boundaries:

```sql
SELECT id, ordered_at FROM orders
WHERE ordered_at >= '2026-09-01' AND ordered_at < '2026-10-01';
```

## Pattern matching with `LIKE`

```sql
SELECT name FROM products WHERE name LIKE 'Desk%';      -- starts with "Desk"
SELECT name FROM products WHERE name LIKE '%Pen%';      -- contains "Pen" (case-sensitive)
SELECT name FROM products WHERE name ILIKE '%usb%';     -- case-insensitive (PostgreSQL)
SELECT email FROM customers WHERE email LIKE '_a%';     -- second character is "a"
```

`%` matches any sequence, `_` exactly one character. A leading `%` prevents normal index use; for real text search use PostgreSQL full-text search (`to_tsvector`) or trigram indexes.

## `NULL`: the absence of a value

`NULL` means "unknown" or "missing". It's not zero and not an empty string, and **comparisons with `NULL` are never true**:

```sql
SELECT name FROM customers WHERE city = NULL;    -- returns nothing!
SELECT name, city FROM customers WHERE city IS NULL;
```

```text
    name    | city
------------+------
 Vikram Rao |
```

```sql
SELECT name FROM customers WHERE city IS NOT NULL;
```

SQL uses **three-valued logic**: conditions can be true, false or unknown. `WHERE` keeps only rows where the condition is **true**. A trap:

```sql
-- Customers not in Pune — excludes Vikram, whose city is NULL
SELECT name FROM customers WHERE city <> 'Pune';

-- Include unknown cities explicitly
SELECT name FROM customers WHERE city <> 'Pune' OR city IS NULL;
-- or, in PostgreSQL: WHERE city IS DISTINCT FROM 'Pune'
```

`NOT IN` with a list containing `NULL` returns no rows at all — another reason to be careful with nullable columns.

### Replacing NULLs

```sql
SELECT name, COALESCE(city, 'Unknown') AS city FROM customers;
```

`COALESCE` returns its first non-null argument. `NULLIF(a, b)` returns `NULL` if `a = b` — handy to avoid division by zero: `total / NULLIF(count, 0)`.

## Filtering dates

```sql
SELECT name, signed_up FROM customers WHERE signed_up >= DATE '2025-06-01';
SELECT id FROM orders WHERE ordered_at >= NOW() - INTERVAL '30 days';
SELECT id FROM orders WHERE EXTRACT(MONTH FROM ordered_at) = 9;   -- can't use a plain index on ordered_at
```

## Try it yourself

1. Products priced between ₹500 and ₹2,000 that are in stock.
2. Customers whose email ends in `@example.com` and who signed up in 2025.
3. Orders that are neither `cancelled` nor `pending`.
4. All customers with their city, showing `'Not provided'` when it's missing.
5. Explain why `WHERE city NOT IN ('Pune', NULL)` returns no rows.
