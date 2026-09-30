So far we've queried existing tables. Now let's design them: choosing data types, keys and constraints that keep data correct.

## `CREATE TABLE`

```sql
CREATE TABLE suppliers (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE,
  country     CHAR(2) NOT NULL DEFAULT 'IN',
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`GENERATED … AS IDENTITY` is the modern, standard way to auto-number rows (older PostgreSQL code uses `SERIAL`; MySQL uses `AUTO_INCREMENT`).

## Choosing data types

| Data | PostgreSQL type | Notes |
| --- | --- | --- |
| Whole numbers | `INTEGER`, `BIGINT`, `SMALLINT` | Use `BIGINT` for ids that may grow large |
| Money, exact decimals | `NUMERIC(12, 2)` | Never `FLOAT` for money — it's approximate |
| Measurements | `DOUBLE PRECISION` | Approximate, fast |
| Text | `TEXT`, `VARCHAR(n)` | In PostgreSQL `TEXT` is as fast as `VARCHAR` |
| True/false | `BOOLEAN` | |
| Dates and times | `DATE`, `TIMESTAMPTZ` | Store timestamps **with time zone** (UTC internally) |
| Unique identifiers | `UUID` | `gen_random_uuid()` |
| Semi-structured | `JSONB` | See the JSON lesson |
| Lists | `TEXT[]` | PostgreSQL arrays |

## Constraints: letting the database enforce rules

```sql
CREATE TABLE product_reviews (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, customer_id)          -- one review per customer per product
);
```

| Constraint | Guarantees |
| --- | --- |
| `PRIMARY KEY` | Unique, not null row identifier |
| `NOT NULL` | Value must be present |
| `UNIQUE` | No duplicates (NULLs are allowed and considered distinct unless `NULLS NOT DISTINCT`) |
| `CHECK` | A condition must hold |
| `FOREIGN KEY … REFERENCES` | The referenced row must exist |
| `DEFAULT` | Value used when none is provided |

Constraints protect data from **every** client — application bugs, scripts and manual fixes alike.

## Foreign key actions

What happens to child rows when the parent is deleted or its key changes:

- `ON DELETE RESTRICT` / `NO ACTION` (default) — prevent deleting a parent that has children.
- `ON DELETE CASCADE` — delete the children too (order items when an order is deleted).
- `ON DELETE SET NULL` — keep children, clear the reference.

Choose deliberately: cascading deletes are convenient but can remove more data than expected.

## Changing tables: `ALTER TABLE`

```sql
ALTER TABLE products ADD COLUMN sku TEXT;
ALTER TABLE products ADD CONSTRAINT products_sku_key UNIQUE (sku);
ALTER TABLE products ALTER COLUMN stock SET DEFAULT 0;
ALTER TABLE products RENAME COLUMN name TO title;
ALTER TABLE products DROP COLUMN sku;
```

On large production tables, some `ALTER` operations lock the table or rewrite it. Adding a nullable column is instant; adding a `NOT NULL` column with a volatile default, changing a column type, or adding a constraint that validates every row can be slow — plan such migrations carefully (e.g. `ADD CONSTRAINT … NOT VALID` then `VALIDATE CONSTRAINT`).

## Dropping and truncating

```sql
DROP TABLE IF EXISTS suppliers;     -- removes the table and its data
TRUNCATE TABLE audit_log;           -- removes all rows, keeps the table (fast)
```

## Generated columns

```sql
ALTER TABLE order_items
  ADD COLUMN line_total NUMERIC(12, 2) GENERATED ALWAYS AS (qty * unit_price) STORED;
```

## Enumerated values

Either a `CHECK (status IN (...))` constraint (easy to change) or a PostgreSQL `ENUM` type:

```sql
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'cancelled');
```

Enums are compact but adding/removing values requires `ALTER TYPE`; many teams prefer a `CHECK` constraint or a lookup table.

## Schema migrations

In real projects, never change production schemas by hand. Use a migration tool (Flyway, Liquibase, Prisma Migrate, Knex, Alembic) so every change is versioned, reviewed and applied consistently across environments.

## Try it yourself

1. Create a `coupons` table: unique uppercase code, discount type (`percent` or `flat`), value (positive), valid from/to dates with a check that `valid_from < valid_to`, and a usage limit.
2. Create a `coupon_redemptions` table referencing coupons, orders and customers, preventing the same coupon being used twice on one order.
3. Add a `sku` column to `products`, backfill it, then make it `NOT NULL` and `UNIQUE`.
