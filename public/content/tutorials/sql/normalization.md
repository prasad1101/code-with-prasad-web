**Normalisation** is the process of organising tables to avoid redundant data and the inconsistencies it causes. Understanding it helps you design schemas that stay correct as the data grows — and know when to deliberately break the rules.

## The problem: anomalies

Imagine one wide table for orders:

| order_id | customer_name | customer_email | customer_city | product | price | qty |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Asha Patil | asha@example.com | Pune | Wireless Mouse | 799 | 1 |
| 1 | Asha Patil | asha@example.com | Pune | Notebook A5 | 120 | 3 |
| 2 | Asha Patil | asha@example.com | Pune | DDIA | 1599 | 1 |

Problems:

- **Update anomaly** — Asha moves city; you must update every row, and missing one leaves contradictory data.
- **Insert anomaly** — you can't record a new customer until they order something.
- **Delete anomaly** — deleting her only order deletes everything you knew about her.

## First Normal Form (1NF)

- Each column holds a single, atomic value (no comma-separated lists).
- No repeating groups (`product1`, `product2`, `product3` columns).
- Each row is uniquely identifiable (a primary key).

```text
✗ orders(id, products = 'mouse,notebook')
✓ order_items(order_id, product_id, qty)
```

## Second Normal Form (2NF)

1NF, plus: every non-key column depends on the **whole** primary key (relevant for composite keys).

In `order_items(order_id, product_id, qty, product_name)`, `product_name` depends only on `product_id`, not on the whole key — move it to `products`.

## Third Normal Form (3NF)

2NF, plus: non-key columns depend **only** on the key, not on other non-key columns (no transitive dependencies).

In `customers(id, name, pincode, city)`, `city` depends on `pincode`. Strictly, you'd move pincode → city into its own table. (In practice, many schemas accept this particular duplication.)

A memorable summary: every non-key attribute must depend on **the key, the whole key, and nothing but the key**.

## The normalised result

This is exactly the sample `shop` schema:

```text
customers(id, name, email, city, signed_up)
products(id, name, category, price, stock)
orders(id, customer_id → customers, status, ordered_at)
order_items(order_id → orders, product_id → products, qty, unit_price)
```

Each fact lives in one place, and relationships are expressed with foreign keys.

## Why `order_items.unit_price` is *not* a normalisation mistake

It looks like duplication of `products.price`, but it records a different fact: the price **at the time of the order**. When the product price changes, historical orders must not change. Capturing point-in-time values is correct design.

## Relationship patterns

- **One-to-many** — foreign key on the "many" side (`orders.customer_id`).
- **Many-to-many** — a junction table with two foreign keys (`order_items`, `student_courses`), often with its own attributes (qty, enrolled_at).
- **One-to-one** — a foreign key with a `UNIQUE` constraint (e.g. `customer_profiles.customer_id UNIQUE`), used to split rarely used or sensitive columns.

## Higher normal forms

BCNF, 4NF and 5NF address rarer anomalies involving overlapping candidate keys and multi-valued dependencies. For most application schemas, reaching 3NF (or BCNF) is the practical goal.

## When to denormalise

Normalised schemas are ideal for **transactional (OLTP)** systems where writes must be consistent. Deliberate denormalisation is common when reads dominate:

- Caching a computed value (`orders.total`, `products.review_count`) to avoid aggregating on every read.
- **Analytical (OLAP) data warehouses** use **star schemas**: a central fact table (sales) surrounded by denormalised dimension tables (customer, product, date). The data engineering course covers these.
- Read models / materialised views for dashboards.

When you denormalise, decide how the copies stay in sync (triggers, application code, scheduled refresh) and accept the trade-off consciously.

## Naming conventions

- Plural or singular table names — pick one and be consistent (`orders` or `order`).
- `snake_case` for tables and columns.
- `id` for primary keys, `<table>_id` for foreign keys.
- Timestamps as `created_at` / `updated_at` in `TIMESTAMPTZ`.

## Try it yourself

Normalise this spreadsheet of course enrolments into 3NF: `student_name, student_email, course_code, course_title, instructor_name, instructor_email, enrolled_on, grade`. Write the `CREATE TABLE` statements with keys and constraints.
