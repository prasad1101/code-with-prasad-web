Schema design is the most important decision in a MongoDB application. The golden rule: **model your data around how your application reads and writes it** — not around normalised tables.

## Embedding vs. referencing

### Embedding: store related data inside the document

```js
// orders collection
{
  _id: ObjectId('…'),
  orderNumber: 'SO-10231',
  customer: { id: ObjectId('…'), name: 'Asha Patil', email: 'asha@example.com' },
  shippingAddress: { line1: '12 MG Road', city: 'Pune', pincode: '411001' },
  items: [
    { productId: ObjectId('…'), name: 'Wireless Mouse', price: 799, qty: 1 },
    { productId: ObjectId('…'), name: 'USB-C Hub', price: 1899, qty: 1 },
  ],
  total: 2698,
  status: 'paid',
}
```

One read returns everything needed to display the order, and updating the order is a single atomic operation.

### Referencing: store an id and look it up

```js
// reviews collection
{ _id: ObjectId('…'), productId: ObjectId('…'), userId: ObjectId('…'), rating: 5, text: '…' }
```

## How to decide

| Question | Embed | Reference |
| --- | --- | --- |
| Is the data read together? | Usually yes | Often separately |
| Relationship | One-to-one, one-to-few | One-to-many (large), many-to-many |
| Can it grow without bound? | No | Yes (comments, logs, events) |
| Does it change independently and often? | Rarely | Frequently |
| Is it shared by many parents? | No | Yes |

Examples:

- **Address in a user profile** → embed.
- **Order line items** → embed (bounded, read with the order). Copy product name and price into the item — they're a **snapshot** at purchase time, and must not change if the product's price changes later.
- **Product reviews** → reference (unbounded; paginated separately). Optionally embed the latest few in the product for fast display.
- **Users ↔ groups (many-to-many)** → arrays of ids on one or both sides, or a separate membership collection if both sides are large.

## Avoid unbounded arrays

A document can't exceed 16 MB, and huge arrays make updates and indexes slow. If an array can grow indefinitely (comments on a viral post, IoT readings, chat messages), put the items in their own collection with a reference back to the parent.

## Denormalisation is normal

Duplicating some data is expected in MongoDB when it saves reads:

```js
// Each post stores the author's name to avoid a lookup on every page view
{ title: '…', author: { id: ObjectId('…'), name: 'Asha Patil' } }
```

Trade-off: if the author changes their name, you must update the copies (e.g. with `updateMany` in a background job). Duplicate fields that are **read often and change rarely**.

## One-to-many with references: which side?

```js
// Parent references (child stores parent id) — best for large "many" sides
{ _id: …, postId: ObjectId('p1'), text: 'Great post!' }        // comments

// Child references (parent stores array of ids) — for small, bounded sets
{ _id: 'team-1', name: 'Platform', memberIds: [ObjectId('u1'), ObjectId('u2')] }
```

## Joining when you need to

```js
db.reviews.aggregate([
  { $match: { productId: ObjectId('…') } },
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $project: { rating: 1, text: 1, 'user.name': 1 } },
])
```

`$lookup` works, but if every request needs it, reconsider the design.

## A worked example: an e-commerce model

| Collection | Contains | Notes |
| --- | --- | --- |
| `users` | profile, embedded addresses, preferences | small, bounded arrays |
| `products` | details, specs, variants, stock, rating summary | rating summary updated when reviews change |
| `reviews` | productId, userId, rating, text | referenced, paginated |
| `carts` | userId, embedded items | one document per user |
| `orders` | embedded customer snapshot, address, items with price snapshot | immutable history |

## Schema evolution

Documents in a collection can have different shapes during a migration. Add a `schemaVersion` field and handle old versions in code, migrate lazily (update when a document is next written) or in a background job. Use **schema validation** (later lesson) to enforce the current shape for new writes.

## Try it yourself

Design collections for a course platform: courses with modules and lessons, students enrolling in many courses, lesson progress per student, and course reviews. For each relationship, decide embed or reference and write one sample document per collection.
