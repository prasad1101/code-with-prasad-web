A **transaction** groups several statements into one all-or-nothing unit. Transactions are what make relational databases trustworthy for money, inventory and anything else that must never end up half-updated.

## BEGIN, COMMIT, ROLLBACK

```sql
BEGIN;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;

COMMIT;   -- both changes become permanent together
```

If anything goes wrong — an error, a failed check, a crash — `ROLLBACK` (or the failure itself) undoes every change since `BEGIN`. In PostgreSQL, after an error inside a transaction, all further statements fail until you roll back.

### Savepoints

```sql
BEGIN;
INSERT INTO orders (customer_id, status) VALUES (1, 'pending');
SAVEPOINT before_items;
INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES (999, 1, 1, 799); -- fails: no order 999
ROLLBACK TO SAVEPOINT before_items;   -- undo only the failed part
COMMIT;
```

## Placing an order safely

```sql
BEGIN;

-- Decrement stock only if enough is available
UPDATE products SET stock = stock - 2 WHERE id = 1 AND stock >= 2;
-- application checks the affected row count; if 0 → ROLLBACK

INSERT INTO orders (customer_id, status) VALUES (3, 'paid') RETURNING id;
INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES (/* new id */ 9, 1, 2, 799);

COMMIT;
```

The conditional `UPDATE … WHERE stock >= 2` is atomic: two concurrent orders can't both take the last item.

## Concurrency problems

When transactions run at the same time, these anomalies can occur:

| Anomaly | What happens |
| --- | --- |
| **Dirty read** | Reading another transaction's uncommitted changes |
| **Non-repeatable read** | Reading the same row twice gives different values |
| **Phantom read** | Re-running a query returns new rows inserted by others |
| **Lost update** | Two transactions read a value, both write — one update is lost |
| **Write skew** | Two transactions each check a condition, then make changes that together break it |

## Isolation levels

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
```

| Level | Prevents | PostgreSQL behaviour |
| --- | --- | --- |
| Read uncommitted | — | Treated as read committed |
| **Read committed** (default) | Dirty reads | Each **statement** sees data committed before it started |
| Repeatable read | + non-repeatable and phantom reads | The whole transaction sees one **snapshot** |
| Serializable | Everything, including write skew | Transactions behave as if run one at a time; conflicting ones fail and must be **retried** |

PostgreSQL implements isolation with **MVCC** (multi-version concurrency control): readers never block writers and writers never block readers, because each transaction sees a consistent version of the data.

## Preventing lost updates

```sql
-- Problem (read committed): both sessions read stock = 5, both write 4

-- 1. Atomic update — best when possible
UPDATE products SET stock = stock - 1 WHERE id = 1 AND stock > 0;

-- 2. Pessimistic locking: lock the row while you decide
BEGIN;
SELECT stock FROM products WHERE id = 1 FOR UPDATE;   -- other writers wait
UPDATE products SET stock = 4 WHERE id = 1;
COMMIT;

-- 3. Optimistic locking: a version column
UPDATE documents SET body = '…', version = version + 1
WHERE id = 7 AND version = 3;   -- 0 rows updated → someone else changed it; reload and retry
```

`SELECT … FOR UPDATE SKIP LOCKED` is a neat way to build a job queue: each worker claims rows no one else has locked.

## Deadlocks

Two transactions each hold a lock the other needs:

```text
T1: locks row A, then wants row B
T2: locks row B, then wants row A
```

PostgreSQL detects this and aborts one transaction with a deadlock error. Prevent deadlocks by always locking rows in a consistent order (e.g. by id), keeping transactions short, and retrying on failure.

## Transactions from application code

```js
// Node.js with node-postgres
const client = await pool.connect()
try {
  await client.query('BEGIN')
  const { rowCount } = await client.query(
    'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1', [qty, productId])
  if (rowCount === 0) throw new Error('Insufficient stock')
  const { rows } = await client.query(
    'INSERT INTO orders (customer_id, status) VALUES ($1, $2) RETURNING id', [customerId, 'paid'])
  await client.query(
    'INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES ($1, $2, $3, $4)',
    [rows[0].id, productId, qty, price])
  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK')
  throw err
} finally {
  client.release()
}
```

All statements must use the **same connection** (`client`), not the pool.

## Best practices

- Keep transactions short — never wait for user input or slow external APIs inside one.
- Prefer atomic single-statement updates where they suffice.
- Use serializable isolation for complex invariants, with automatic retries.
- Monitor long-running transactions: they hold locks and prevent cleanup of old row versions (`VACUUM`).

## Try it yourself

Open two `psql` sessions:

1. In both, `BEGIN;` and `SELECT stock FROM products WHERE id = 1;`. Then update the stock to `stock - 1` using the value you read in both sessions and commit — observe the lost update.
2. Repeat with `SELECT … FOR UPDATE` and see the second session wait.
3. Create a deadlock deliberately by updating two rows in opposite orders.
