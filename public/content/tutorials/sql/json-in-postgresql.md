PostgreSQL combines relational tables with powerful **JSON** support. The `JSONB` type stores JSON in a binary, indexable format — letting you keep flexible attributes alongside strictly typed columns, and query both with SQL.

## `JSON` vs. `JSONB`

- `JSON` stores the exact text (keeps whitespace, key order, duplicate keys). Rarely what you want.
- `JSONB` stores a parsed binary representation: faster to query, supports indexing, removes duplicates. **Use `JSONB`.**

## Storing JSON

```sql
ALTER TABLE products ADD COLUMN attributes JSONB NOT NULL DEFAULT '{}';

UPDATE products SET attributes = '{"brand": "Logi", "wireless": true, "dpi": 1600, "colors": ["black", "white"]}'
WHERE name = 'Wireless Mouse';

UPDATE products SET attributes = '{"switches": "brown", "layout": "US", "backlight": {"type": "RGB", "zones": 3}}'
WHERE name = 'Mechanical Keyboard';
```

## Reading values

```sql
SELECT
  name,
  attributes -> 'brand'                AS brand_json,   -- returns JSONB: "Logi"
  attributes ->> 'brand'               AS brand,        -- returns TEXT: Logi
  (attributes ->> 'dpi')::int          AS dpi,
  attributes -> 'backlight' ->> 'type' AS backlight,
  attributes #>> '{backlight,zones}'   AS zones,        -- path access
  attributes -> 'colors' -> 0          AS first_color
FROM products
WHERE category = 'electronics';
```

- `->` returns JSON (for chaining), `->>` returns text.
- PostgreSQL 14+ also supports subscripting: `attributes['brand']`.

## Filtering

```sql
-- Containment: attributes include these key/values
SELECT name FROM products WHERE attributes @> '{"wireless": true}';

-- Key exists
SELECT name FROM products WHERE attributes ? 'backlight';

-- Any of these keys exist
SELECT name FROM products WHERE attributes ?| ARRAY['dpi', 'switches'];

-- Compare a value
SELECT name FROM products WHERE (attributes ->> 'dpi')::int >= 1600;

-- SQL/JSON path
SELECT name FROM products WHERE attributes @? '$.colors[*] ? (@ == "white")';
```

## Indexing JSONB

```sql
-- GIN index: supports @>, ?, ?|, ?& on any key
CREATE INDEX idx_products_attributes ON products USING gin (attributes);

-- Smaller, faster for containment only
CREATE INDEX idx_products_attributes_path ON products USING gin (attributes jsonb_path_ops);

-- Expression index for one frequently filtered key
CREATE INDEX idx_products_brand ON products ((attributes ->> 'brand'));
```

## Modifying JSON

```sql
-- Set or replace a nested value
UPDATE products SET attributes = jsonb_set(attributes, '{dpi}', '3200') WHERE name = 'Wireless Mouse';

-- Merge objects (right side wins)
UPDATE products SET attributes = attributes || '{"warranty_years": 2}' WHERE category = 'electronics';

-- Remove a key
UPDATE products SET attributes = attributes - 'warranty_years';
```

## Turning JSON into rows

```sql
-- Expand an array into rows
SELECT p.name, color
FROM products p, jsonb_array_elements_text(p.attributes -> 'colors') AS color;

-- Expand an object into key/value rows
SELECT p.name, kv.key, kv.value
FROM products p, jsonb_each_text(p.attributes) AS kv
WHERE p.name = 'Wireless Mouse';
```

## Building JSON from rows

Return nested JSON directly from SQL — handy for APIs:

```sql
SELECT jsonb_build_object(
  'id', o.id,
  'customer', c.name,
  'status', o.status,
  'items', jsonb_agg(jsonb_build_object('product', p.name, 'qty', oi.qty, 'price', oi.unit_price))
) AS order_json
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.id = 3
GROUP BY o.id, c.name;
```

## When to use JSONB — and when not to

Good uses:

- Attributes that vary by product type or tenant.
- Storing raw payloads from third-party APIs or webhooks.
- User preferences and settings.
- Semi-structured data you query occasionally.

Prefer regular columns when:

- The field is present on most rows and queried often (typed columns are smaller, faster and constraint-checked).
- You need foreign keys or strict constraints on it.
- You're effectively building tables inside JSON — that's a sign to normalise.

You can still add constraints on JSON: `CHECK (jsonb_typeof(attributes -> 'dpi') IN ('number', 'null'))`.

## Try it yourself

1. Add `attributes` to a few products and find all wireless products with a GIN index in place (check the plan with `EXPLAIN`).
2. List every distinct attribute key used across products with its count.
3. Produce the JSON for a customer with an array of their orders, each containing its items.
