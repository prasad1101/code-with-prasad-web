**SQL** (Structured Query Language) is the standard language for working with **relational databases** — PostgreSQL, MySQL, SQL Server, Oracle, SQLite, and cloud warehouses like BigQuery, Snowflake and Redshift. It's one of the most valuable skills in tech: developers, data analysts and data engineers all use it daily.

## The relational model

A relational database stores data in **tables**. Each table has **columns** (with a type) and **rows** (records):

**customers**

| id | name | email | city |
| --- | --- | --- | --- |
| 1 | Asha Patil | asha@example.com | Pune |
| 2 | Ravi Kumar | ravi@example.com | Mumbai |

**orders**

| id | customer_id | status | ordered_at |
| --- | --- | --- | --- |
| 1 | 1 | shipped | 2026-06-02 |
| 3 | 2 | paid | 2026-06-20 |

- A **primary key** (`id`) uniquely identifies each row.
- A **foreign key** (`orders.customer_id`) references a row in another table — this is the *relation* in "relational".
- Tables are combined with **joins** at query time.

## What SQL looks like

SQL is **declarative**: you describe *what* you want, and the database figures out *how* to get it efficiently.

```sql
SELECT c.name, COUNT(o.id) AS orders
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status <> 'cancelled'
GROUP BY c.name
ORDER BY orders DESC;
```

"For each customer, count their non-cancelled orders, most orders first."

## Parts of SQL

| Category | Statements | Purpose |
| --- | --- | --- |
| Query (DQL) | `SELECT` | Read data |
| Manipulation (DML) | `INSERT`, `UPDATE`, `DELETE`, `MERGE` | Change data |
| Definition (DDL) | `CREATE`, `ALTER`, `DROP` | Define tables, indexes, views |
| Control (DCL) | `GRANT`, `REVOKE` | Permissions |
| Transactions (TCL) | `BEGIN`, `COMMIT`, `ROLLBACK` | Group changes atomically |

## Dialects

The core of SQL is standardised, but each database adds its own features and syntax differences (e.g. `LIMIT` vs. `TOP`, string functions, JSON support). This tutorial uses **PostgreSQL** — free, standards-compliant, and hugely popular — and points out important differences with MySQL and SQL Server where relevant. What you learn transfers directly to other databases.

## ACID

Relational databases guarantee **ACID** transactions:

- **Atomicity** — a transaction happens completely or not at all.
- **Consistency** — constraints (keys, checks) are always respected.
- **Isolation** — concurrent transactions don't see each other's partial work.
- **Durability** — once committed, data survives crashes.

## SQL vs. NoSQL

Relational databases excel at structured, related data with strong consistency and ad-hoc querying across entities. Document databases like MongoDB excel at flexible, hierarchical data read as a unit. Many systems use both — see the MongoDB course for the other side.

## What you'll learn

1. Setting up PostgreSQL and a sample shop database
2. `SELECT`, filtering, sorting and aggregation
3. Joins, subqueries, set operations and `CASE`
4. Creating tables, constraints and modifying data
5. Normalisation and indexes
6. CTEs, recursive queries and window functions
7. Transactions and isolation, views and functions, JSON
8. Query optimisation, analytics patterns and database design at scale

## Try it yourself

Think about an app you use (e.g. a food-delivery app). List three tables it probably has, their key columns, and which foreign keys connect them.
