MongoDB's flexible schema doesn't mean *no* schema. **Schema validation** lets the database reject documents that don't match rules you define — a safety net even when every application validates its own input.

## `$jsonSchema` validation

```js
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'name', 'role', 'createdAt'],
      additionalProperties: true,
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
          description: 'must be a valid email address',
        },
        name: { bsonType: 'string', minLength: 1, maxLength: 100 },
        role: { enum: ['customer', 'admin'] },
        age: { bsonType: 'int', minimum: 13, maximum: 130 },
        addresses: {
          bsonType: 'array',
          maxItems: 5,
          items: {
            bsonType: 'object',
            required: ['city', 'pincode'],
            properties: {
              city: { bsonType: 'string' },
              pincode: { bsonType: 'string', pattern: '^[0-9]{6}$' },
            },
          },
        },
        createdAt: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'strict',
  validationAction: 'error',
})
```

Now an invalid insert fails with details of which rule was broken:

```js
db.users.insertOne({ email: 'not-an-email', name: 'Asha', role: 'owner', createdAt: new Date() })
// MongoServerError: Document failed validation
// (details include the failing properties: email pattern, role enum)
```

## BSON types

Use `bsonType` for MongoDB-specific types: `'objectId'`, `'date'`, `'int'`, `'long'`, `'double'`, `'decimal'`, `'bool'`, `'array'`, `'object'`, `'string'`. Allow several with an array: `bsonType: ['double', 'int']`.

Note that numbers from JavaScript drivers are usually stored as doubles. If you require `'int'`, the application must send integers explicitly (e.g. `NumberInt` in the shell); allowing `['int', 'long', 'double']` is often more practical.

## Validation level and action

- `validationLevel: 'strict'` (default) — validate all inserts and updates.
- `validationLevel: 'moderate'` — validate inserts and updates to documents that **already** satisfy the rules; existing invalid documents can still be updated. Useful during migrations.
- `validationAction: 'error'` (default) — reject invalid writes.
- `validationAction: 'warn'` — allow the write but log a warning. Good for trialling rules on production data.

## Adding validation to an existing collection

```js
db.runCommand({
  collMod: 'products',
  validator: { $jsonSchema: { bsonType: 'object', required: ['name', 'price'], properties: { price: { bsonType: ['double', 'int', 'decimal'], minimum: 0 } } } },
  validationLevel: 'moderate',
  validationAction: 'warn',
})
```

Find existing documents that would fail:

```js
db.products.find({ $nor: [{ $jsonSchema: db.getCollectionInfos({ name: 'products' })[0].options.validator.$jsonSchema }] })
```

## Query-operator validators

Validators can also use query expressions — handy for cross-field rules:

```js
db.runCommand({
  collMod: 'promotions',
  validator: {
    $and: [
      { $jsonSchema: { required: ['startsAt', 'endsAt'] } },
      { $expr: { $lt: ['$startsAt', '$endsAt'] } },
    ],
  },
})
```

## Application-level vs. database-level validation

| | Application (Zod, Mongoose) | Database (`$jsonSchema`) |
| --- | --- | --- |
| User-friendly error messages | ✅ | Basic |
| Protects against every writer (scripts, other services, manual fixes) | ❌ | ✅ |
| Business rules needing other data | ✅ (in services) | ❌ |

Use both: detailed validation in the application for good API errors, and a database validator as the last line of defence for critical invariants (required fields, types, enums).

## Unique constraints

Validation can't enforce uniqueness across documents — use a **unique index**:

```js
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true, partialFilterExpression: { username: { $type: 'string' } } })
```

## Try it yourself

Add a validator to an `orders` collection: required `userId` (objectId), `items` (non-empty array of objects with `productId`, `qty` ≥ 1 and `price` ≥ 0), `status` enum and `createdAt` date. Start in `warn` mode, find existing invalid documents, fix them, then switch to `error`.
