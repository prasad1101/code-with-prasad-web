Equality filters only go so far. **Query operators** — keys starting with `$` — express ranges, alternatives, existence checks, array conditions and more.

## Comparison operators

| Operator | Meaning |
| --- | --- |
| `$eq`, `$ne` | Equal, not equal |
| `$gt`, `$gte` | Greater than (or equal) |
| `$lt`, `$lte` | Less than (or equal) |
| `$in`, `$nin` | In / not in a list |

```js
db.products.find({ price: { $gte: 500, $lte: 2000 } })          // range
db.products.find({ category: { $in: ['books', 'stationery'] } })
db.products.find({ stock: { $ne: 0 } })
db.orders.find({ createdAt: { $gte: ISODate('2026-09-01'), $lt: ISODate('2026-10-01') } })
```

`$ne` and `$nin` also match documents where the field is **missing**.

## Logical operators

```js
// Implicit AND
db.products.find({ category: 'electronics', price: { $lt: 1000 } })

// $or
db.products.find({ $or: [{ stock: 0 }, { rating: { $lt: 4 } }] })

// $and — needed when combining two conditions on the same operator
db.products.find({
  $and: [
    { $or: [{ category: 'books' }, { category: 'stationery' }] },
    { $or: [{ stock: 0 }, { price: { $gt: 500 } }] },
  ],
})

// $nor and $not
db.products.find({ $nor: [{ category: 'books' }, { stock: 0 }] })
db.products.find({ price: { $not: { $gt: 1000 } } })
```

## Element operators

```js
db.products.find({ discount: { $exists: true } })     // field is present
db.products.find({ price: { $type: 'string' } })      // find data-quality problems
db.products.find({ deletedAt: null })                 // null OR missing
```

## Array operators

```js
// Contains an element
db.products.find({ tags: 'usb-c' })

// Contains ALL of these (any order)
db.products.find({ tags: { $all: ['usb-c', 'rgb'] } })

// Array length
db.products.find({ tags: { $size: 2 } })

// Match on array of sub-documents: one element must satisfy ALL conditions
db.orders.find({
  items: { $elemMatch: { productId: 'p1', qty: { $gte: 2 } } },
})
```

Why `$elemMatch` matters:

```js
// Without $elemMatch: one item may have productId 'p1' and a DIFFERENT item qty >= 2
db.orders.find({ 'items.productId': 'p1', 'items.qty': { $gte: 2 } })
```

## Text patterns

```js
db.products.find({ name: { $regex: '^usb', $options: 'i' } }) // case-insensitive prefix
```

Anchored, case-sensitive prefix regexes (`/^USB/`) can use an index; unanchored or case-insensitive ones scan every value. For real search, use a **text index** (`$text`) or **Atlas Search**.

Never build a regex directly from user input without escaping it — special characters can cause errors or extremely slow patterns.

## Expressions in queries: `$expr`

Compare two fields of the same document, or use aggregation expressions:

```js
db.products.find({ $expr: { $lt: ['$stock', '$reorderLevel'] } })
db.orders.find({ $expr: { $gt: [{ $size: '$items' }, 5] } })
```

## Querying nested documents

```js
// Dot notation matches a nested field (recommended)
db.users.find({ 'address.city': 'Pune' })

// A whole-document match requires the EXACT same sub-document (same fields, same order)
db.users.find({ address: { city: 'Pune', pincode: '411001' } })
```

Prefer dot notation — exact sub-document matches break when a field is added.

## Geospatial queries (preview)

With a `2dsphere` index on a GeoJSON field:

```js
db.stores.find({
  location: {
    $near: {
      $geometry: { type: 'Point', coordinates: [73.8567, 18.5204] }, // [lng, lat]
      $maxDistance: 5000, // metres
    },
  },
})
```

## Try it yourself

Using the `products` collection:

1. Electronics under ₹2,000 with a rating of at least 4.
2. Products that are out of stock **or** have no tags.
3. Products tagged with both `usb-c` and `wireless`.
4. Products whose `price` field has the wrong type (not a number).
5. For an `orders` collection, orders containing at least one item with `qty > 3` and `price > 1000` in the **same** item.
