Real queries rarely need every field of every matching document. Projections, sorting and limits shape the result — and have a big impact on performance.

## Projection: choosing fields

The second argument to `find` selects fields:

```js
// Include only name and price (_id is included by default)
db.products.find({ category: 'electronics' }, { name: 1, price: 1 })

// Exclude _id too
db.products.find({}, { name: 1, price: 1, _id: 0 })

// Exclude specific fields, keep the rest
db.users.find({}, { passwordHash: 0, loginHistory: 0 })
```

You can't mix inclusion and exclusion (except for `_id`).

### Array projections

```js
db.posts.find({}, { title: 1, comments: { $slice: -3 } })   // last 3 comments

db.orders.find(
  { 'items.productId': 'p1' },
  { 'items.$': 1 },                                          // only the first matching item
)
```

Projections reduce network transfer and memory — especially important for documents with large arrays or text fields.

## Sorting

```js
db.products.find().sort({ price: 1 })                  // ascending
db.products.find().sort({ rating: -1, price: 1 })      // rating desc, then price asc
```

Sorting without a supporting index happens in memory, and MongoDB limits how much memory an in-memory sort may use (larger sorts spill to disk or fail). Create indexes that match your common sorts (see the indexes lesson).

For a stable order, include a unique tie-breaker such as `_id`:

```js
.sort({ createdAt: -1, _id: -1 })
```

## Limit and skip

```js
db.products.find().sort({ price: -1 }).limit(5)            // top 5 most expensive

// Offset pagination
const page = 3, pageSize = 20
db.products.find().sort({ _id: 1 }).skip((page - 1) * pageSize).limit(pageSize)
```

Cursor methods are applied in the logical order sort → skip → limit, regardless of how you chain them.

## The problem with deep `skip`

`skip(100000)` still makes the server walk past 100,000 index entries or documents. Deep pages get progressively slower, and inserts between requests can cause items to be skipped or repeated.

## Range-based (cursor) pagination

Remember where the last page ended and continue from there:

```js
// First page
const first = db.products.find({ category: 'electronics' })
  .sort({ price: 1, _id: 1 })
  .limit(20)
  .toArray()

// Next page: everything after the last item (tie-break on _id)
const last = first[first.length - 1]
db.products.find({
  category: 'electronics',
  $or: [
    { price: { $gt: last.price } },
    { price: last.price, _id: { $gt: last._id } },
  ],
}).sort({ price: 1, _id: 1 }).limit(20)
```

With an index on `{ category: 1, price: 1, _id: 1 }`, every page is equally fast. APIs usually return an opaque `nextCursor` (e.g. base64 of `{ price, _id }`) instead of page numbers.

## Counting efficiently

```js
db.products.countDocuments({ category: 'electronics' })   // accurate, uses the filter
db.products.estimatedDocumentCount()                      // fast total from metadata, no filter
```

Counting a large filtered set on every page request is expensive. Consider showing "20+ results" or caching totals.

## Distinct values

```js
db.products.distinct('category')                        // ['books', 'electronics', 'stationery']
db.products.distinct('tags', { category: 'electronics' })
```

## Collation: language-aware sorting and matching

```js
db.users.find().sort({ name: 1 }).collation({ locale: 'en', strength: 2 }) // case-insensitive sort
```

A case-insensitive index with the same collation lets these queries use an index.

## Try it yourself

1. List product names and prices only, most expensive first.
2. Implement page 2 of electronics (5 per page) with `skip`, then again with range-based pagination.
3. Find the distinct tags used by products in stock.
4. Return each order with only its first two items.
