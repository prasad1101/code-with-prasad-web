Let's install PostgreSQL, connect to it, and create the sample **shop** database used throughout this tutorial.

## Option 1: Docker (recommended)

```bash
docker run -d --name pg \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:17
```

Connect with the `psql` command-line client inside the container:

```bash
docker exec -it pg psql -U postgres
```

## Option 2: Native install

- **macOS**: `brew install postgresql@17 && brew services start postgresql@17`
- **Windows**: the installer from postgresql.org (includes pgAdmin)
- **Linux**: `sudo apt install postgresql`

## Option 3: In the browser

Online playgrounds (e.g. DB Fiddle, OneCompiler) let you run PostgreSQL queries without installing anything — handy for quick practice.

## GUI tools

`psql` is powerful, but a GUI helps when exploring: **pgAdmin**, **DBeaver** (works with every database), **DataGrip**, **TablePlus**, or the VS Code PostgreSQL extensions.

## Essential `psql` commands

```text
\l             list databases
\c shop        connect to the "shop" database
\dt            list tables
\d products    describe a table (columns, indexes, constraints)
\x             toggle expanded output (one column per line)
\timing        show how long each query takes
\i file.sql    run a SQL file
\q             quit
```

SQL statements end with a semicolon; `psql` waits for it before running.

## Create the sample database

```sql
CREATE DATABASE shop;
```

Connect to it (`\c shop`) and run the following script. It creates five tables and fills them with sample data.

```sql
CREATE TABLE customers (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  city       TEXT,
  signed_up  DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE products (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL,
  category  TEXT NOT NULL,
  price     NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock     INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

CREATE TABLE orders (
  id           SERIAL PRIMARY KEY,
  customer_id  INTEGER NOT NULL REFERENCES customers(id),
  status       TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
  ordered_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  qty         INTEGER NOT NULL CHECK (qty > 0),
  unit_price  NUMERIC(10, 2) NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE employees (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  department  TEXT NOT NULL,
  salary      NUMERIC(10, 2) NOT NULL,
  manager_id  INTEGER REFERENCES employees(id)
);

INSERT INTO customers (name, email, city, signed_up) VALUES
  ('Asha Patil',   'asha@example.com',   'Pune',      '2025-01-15'),
  ('Ravi Kumar',   'ravi@example.com',   'Mumbai',    '2025-02-03'),
  ('Meera Iyer',   'meera@example.com',  'Bengaluru', '2025-03-22'),
  ('Kabir Shah',   'kabir@example.com',  'Pune',      '2025-05-10'),
  ('Sara Khan',    'sara@example.com',   'Delhi',     '2025-07-01'),
  ('Vikram Rao',   'vikram@example.com', NULL,        '2025-08-19');

INSERT INTO products (name, category, price, stock) VALUES
  ('Wireless Mouse',      'electronics', 799.00,  42),
  ('Mechanical Keyboard', 'electronics', 3499.00, 12),
  ('USB-C Hub',           'electronics', 1899.00, 7),
  ('Notebook A5',         'stationery',  120.00,  300),
  ('Gel Pen Pack',        'stationery',  199.00,  0),
  ('Clean Code',          'books',       899.00,  25),
  ('Designing Data-Intensive Applications', 'books', 1599.00, 10),
  ('Desk Lamp',           'home',        1299.00, 15);

INSERT INTO orders (customer_id, status, ordered_at) VALUES
  (1, 'shipped',   '2026-06-02 10:15+05:30'),
  (1, 'paid',      '2026-08-14 18:40+05:30'),
  (2, 'paid',      '2026-06-20 09:05+05:30'),
  (3, 'cancelled', '2026-07-01 12:00+05:30'),
  (3, 'shipped',   '2026-07-18 16:30+05:30'),
  (4, 'pending',   '2026-09-25 11:45+05:30'),
  (2, 'shipped',   '2026-09-02 20:10+05:30'),
  (5, 'paid',      '2026-09-12 14:25+05:30');

INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES
  (1, 1, 1, 799.00), (1, 4, 3, 120.00),
  (2, 7, 1, 1599.00),
  (3, 2, 1, 3499.00), (3, 1, 2, 799.00),
  (4, 6, 1, 899.00),
  (5, 3, 1, 1899.00), (5, 4, 5, 120.00),
  (6, 8, 1, 1299.00),
  (7, 6, 2, 899.00), (7, 5, 1, 199.00),
  (8, 2, 1, 3499.00), (8, 7, 1, 1599.00);

INSERT INTO employees (name, department, salary, manager_id) VALUES
  ('Nisha Verma',  'Engineering', 250000, NULL),
  ('Arjun Mehta',  'Engineering', 180000, 1),
  ('Priya Nair',   'Engineering', 150000, 2),
  ('Rohan Das',    'Engineering', 150000, 2),
  ('Anita Joshi',  'Sales',       160000, 1),
  ('Imran Sheikh', 'Sales',       90000,  5),
  ('Deepa Menon',  'Sales',       95000,  5);
```

Save it as `shop.sql` and run `\i shop.sql`, or paste it into your GUI tool.

## The schema at a glance

```text
customers 1───* orders 1───* order_items *───1 products
employees (manager_id → employees.id)
```

- A customer places many orders.
- An order has many items; each item references a product and records the `unit_price` at the time of purchase.
- Each employee may have a manager, who is also an employee.

## Check that it worked

```sql
SELECT COUNT(*) FROM order_items;
```

```text
 count
-------
    13
```

## A note on case and style

SQL keywords are case-insensitive (`select` = `SELECT`). This tutorial writes keywords in UPPER CASE and names in lower_snake_case — a common convention. Unquoted identifiers are folded to lower case in PostgreSQL, so avoid mixed-case table names.

## Try it yourself

1. Run `\d orders` and identify the primary key, foreign key and check constraint.
2. Run `SELECT * FROM products;` and `SELECT * FROM employees;` to get familiar with the data.
