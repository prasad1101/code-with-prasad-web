**MongoDB** is a document database — the "M" in MEAN and MERN. Instead of rows in tables, it stores **documents**: JSON-like objects that can contain nested objects and arrays. It's used for product catalogues, user profiles, content management, IoT data, real-time analytics and much more.

## Documents, collections and databases

```js
// A document in the "products" collection
{
  _id: ObjectId('66f1c2a8e4b0a1b2c3d4e5f6'),
  name: 'Wireless Mouse',
  price: 799,
  category: 'electronics',
  tags: ['wireless', 'usb-c'],
  specs: { dpi: 1600, battery: 'AA' },
  stock: 42,
  createdAt: ISODate('2026-09-20T10:00:00Z')
}
```

| Relational (SQL) | MongoDB |
| --- | --- |
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |
| Primary key | `_id` field |
| JOIN | Embedded documents or `$lookup` |

Documents are stored as **BSON** (binary JSON), which adds types JSON lacks: `ObjectId`, `Date`, `Decimal128`, 64-bit integers and binary data. Each document can be up to 16 MB.

## Why developers like MongoDB

- **Natural fit for application objects** — a document maps directly to a JavaScript object; no ORM mapping of one object across many tables.
- **Flexible schema** — documents in a collection can differ; you can evolve structure without migrations for every change (while still enforcing rules with schema validation).
- **Rich queries** — filters on nested fields and arrays, secondary indexes, full aggregation pipelines, text and geospatial search.
- **Built for scale and availability** — replica sets for automatic failover; sharding for horizontal scaling.

## When MongoDB fits — and when it doesn't

Great fits:

- Data that is naturally hierarchical or varies per record (product attributes, CMS content, user settings).
- Read-heavy apps where related data is usually read together (embed it in one document).
- High write throughput and large, growing datasets.

Consider a relational database when:

- The data is highly relational with many-to-many relationships queried from every angle.
- You need complex multi-table transactions everywhere (MongoDB supports multi-document ACID transactions, but a design that needs them constantly may fit SQL better).
- Reporting relies heavily on ad-hoc joins across many entities.

Many systems use both: MongoDB for the operational app data, a SQL warehouse for analytics.

## The `_id` field

Every document has a unique `_id`. If you don't provide one, MongoDB generates an **ObjectId** — a 12-byte value that includes a timestamp, so ObjectIds sort roughly by creation time:

```js
ObjectId('66f1c2a8e4b0a1b2c3d4e5f6').getTimestamp()
```

## What you'll learn

1. Installing MongoDB and using `mongosh` and Compass
2. CRUD operations and query operators
3. Update operators, projections, sorting and pagination
4. Data modelling: embedding vs. referencing, and schema design patterns
5. Schema validation and indexes
6. The aggregation framework
7. Using MongoDB from Node.js
8. Transactions, replication, sharding, performance tuning, change streams, security and operations

## Try it yourself

Sketch how you'd store a blog post with its author, tags and comments as a MongoDB document. Which parts would you embed, and which might grow without bound? (You'll revisit this in the data-modelling lesson.)
