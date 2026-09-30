Beyond grouping, pipelines can join collections, compute multiple facets at once, bucket data, calculate running totals and even write results to another collection.

## `$lookup`: joining collections

```js
db.orders.aggregate([
  { $match: { status: 'paid' } },
  { $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'customer',
  } },
  { $unwind: '$customer' },                     // turn the one-element array into an object
  { $project: { total: 1, 'customer.name': 1, 'customer.email': 1 } },
])
```

### Pipeline `$lookup` with conditions

```js
db.products.aggregate([
  { $lookup: {
      from: 'reviews',
      let: { pid: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$productId', '$$pid'] }, rating: { $gte: 4 } } },
        { $sort: { createdAt: -1 } },
        { $limit: 3 },
        { $project: { _id: 0, rating: 1, text: 1 } },
      ],
      as: 'topReviews',
  } },
])
```

Index the foreign field (`reviews.productId`) — otherwise each lookup scans the whole collection.

## `$facet`: several aggregations in one query

Perfect for search pages that need results **and** filter counts:

```js
db.products.aggregate([
  { $match: { $text: { $search: 'wireless' } } },
  { $facet: {
      results: [{ $sort: { rating: -1 } }, { $skip: 0 }, { $limit: 20 }],
      byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
      priceRanges: [{ $bucket: {
          groupBy: '$price',
          boundaries: [0, 500, 1000, 2500, 10000],
          default: '10000+',
          output: { count: { $sum: 1 } },
      } }],
      total: [{ $count: 'value' }],
  } },
])
```

## Bucketing

```js
// Fixed boundaries
{ $bucket: { groupBy: '$age', boundaries: [18, 25, 35, 50, 120], default: 'other', output: { users: { $sum: 1 } } } }

// Automatic, evenly distributed buckets
{ $bucketAuto: { groupBy: '$price', buckets: 5 } }
```

## Window functions: `$setWindowFields`

Running totals, moving averages and rankings without collapsing documents:

```js
db.dailySales.aggregate([
  { $setWindowFields: {
      partitionBy: '$storeId',
      sortBy: { date: 1 },
      output: {
        runningTotal: { $sum: '$revenue', window: { documents: ['unbounded', 'current'] } },
        movingAvg7d: { $avg: '$revenue', window: { range: [-6, 0], unit: 'day' } },
        rank: { $rank: {} },
      },
  } },
])
```

(`$rank` ranks by the `sortBy` field within each partition.)

## Array transformations

```js
db.orders.aggregate([
  { $set: {
      expensiveItems: { $filter: { input: '$items', as: 'i', cond: { $gte: ['$$i.price', 1000] } } },
      itemNames: { $map: { input: '$items', as: 'i', in: '$$i.name' } },
      computedTotal: { $reduce: {
          input: '$items',
          initialValue: 0,
          in: { $add: ['$$value', { $multiply: ['$$this.price', '$$this.qty'] }] },
      } },
  } },
])
```

Processing arrays in place is often faster than `$unwind` + `$group`.

## Reshaping with `$replaceRoot` and `$mergeObjects`

```js
db.orders.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
  { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$u', 0] }, { orderTotal: '$total' }] } } },
])
```

## `$unionWith`: combining collections

```js
db.orders2025.aggregate([
  { $unionWith: 'orders2026' },
  { $group: { _id: { $year: '$createdAt' }, revenue: { $sum: '$total' } } },
])
```

## Writing results: `$out` and `$merge`

Materialise expensive aggregations for fast dashboards:

```js
db.orders.aggregate([
  { $match: { status: 'paid' } },
  { $group: { _id: { day: { $dateTrunc: { date: '$createdAt', unit: 'day' } } }, revenue: { $sum: '$total' } } },
  { $merge: { into: 'dailyRevenue', on: '_id', whenMatched: 'replace', whenNotMatched: 'insert' } },
])
```

`$merge` updates an existing collection incrementally (ideal for scheduled jobs); `$out` replaces the target collection entirely.

## Graph lookups

Traverse hierarchies — categories, org charts, referral chains:

```js
db.employees.aggregate([
  { $match: { name: 'Asha' } },
  { $graphLookup: {
      from: 'employees',
      startWith: '$managerId',
      connectFromField: 'managerId',
      connectToField: '_id',
      as: 'managementChain',
      depthField: 'level',
  } },
])
```

## Try it yourself

1. For each product, include its average rating and review count via `$lookup` (with an inner `$group`).
2. Build a product search facet: paginated results, counts per category, price buckets and total count.
3. Compute each user's running total spend over time with `$setWindowFields`.
4. Materialise monthly revenue per category into a `reports.monthlyRevenue` collection with `$merge`.
