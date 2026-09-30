CRUD — Create, Read, Update, Delete — covers most day-to-day database work. All examples use the `shop.products` collection from the setup lesson.

## Create

```js
db.products.insertOne({
  name: 'Desk Lamp',
  price: 1299,
  category: 'home',
  stock: 15,
  createdAt: new Date(),
})
// { acknowledged: true, insertedId: ObjectId('…') }

db.products.insertMany([
  { name: 'Sticky Notes', price: 60, category: 'stationery', stock: 500 },
  { name: 'Highlighter Set', price: 150, category: 'stationery', stock: 80 },
])
```

`insertMany` is ordered by default: if one insert fails (e.g. a duplicate key), the rest are skipped. Pass `{ ordered: false }` to continue past errors.

## Read

```js
db.products.find()                                   // all documents (the shell shows 20 at a time)
db.products.find({ category: 'stationery' })         // equality filter
db.products.findOne({ name: 'Clean Code' })          // first match or null
db.products.find({ 'specs.dpi': 1600 })              // nested field with dot notation
db.products.find({ tags: 'usb-c' })                  // matches if the array CONTAINS 'usb-c'
db.products.countDocuments({ category: 'electronics' })
```

Filters are documents: `{ field: value }` means "field equals value". Multiple fields are combined with AND:

```js
db.products.find({ category: 'electronics', stock: 0 })
```

## Update

```js
// Change fields with $set — other fields are untouched
db.products.updateOne(
  { name: 'Wireless Mouse' },
  { $set: { price: 749, updatedAt: new Date() } },
)

// Increment a number
db.products.updateOne({ name: 'Notebook A5' }, { $inc: { stock: -1 } })

// Update every match
db.products.updateMany({ stock: 0 }, { $set: { status: 'out-of-stock' } })
```

The result tells you what happened:

```js
{ acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedId: null }
```

**Always use update operators** like `$set`. Passing a plain document to `replaceOne` replaces the whole document:

```js
db.products.replaceOne({ name: 'Desk Lamp' }, { name: 'Desk Lamp', price: 999 })
// every other field (category, stock, createdAt) is now gone
```

### Upserts

Insert if no document matches, update otherwise:

```js
db.inventory.updateOne(
  { sku: 'LAMP-001' },
  { $set: { qty: 20 }, $setOnInsert: { createdAt: new Date() } },
  { upsert: true },
)
```

### Find and modify atomically

Return the document as it is after the update — useful for counters and claiming jobs:

```js
db.counters.findOneAndUpdate(
  { _id: 'orderNumber' },
  { $inc: { seq: 1 } },
  { upsert: true, returnDocument: 'after' },
)
```

## Delete

```js
db.products.deleteOne({ name: 'Sticky Notes' })
db.products.deleteMany({ category: 'discontinued' })
db.products.deleteMany({})     // deletes EVERY document — careful!
db.products.drop()             // removes the collection and its indexes
```

Many applications use **soft deletes** instead: `$set: { deletedAt: new Date() }` and filter out deleted documents in queries.

## Atomicity

Operations on a **single document** are atomic, even when they modify many fields or nested arrays. This is why good MongoDB designs keep data that changes together in one document. Multi-document atomicity requires transactions (covered later).

## Bulk writes

Send many different operations in one round trip:

```js
db.products.bulkWrite([
  { insertOne: { document: { name: 'Stapler', price: 250, category: 'stationery' } } },
  { updateOne: { filter: { name: 'Gel Pen Pack' }, update: { $inc: { stock: 100 } } } },
  { deleteOne: { filter: { name: 'Highlighter Set' } } },
])
```

## Try it yourself

1. Insert three books with `title`, `author`, `price` and `publishedYear`.
2. Find all books by one author.
3. Increase the price of every book published before 2015 by 10% (hint: `$mul`).
4. Upsert a book by `isbn`, setting `createdAt` only on insert.
5. Delete books with zero stock.
