The **aggregation framework** transforms and analyses data inside the database. A pipeline is an array of **stages**; documents flow through each stage in order, like a Unix pipe. It's MongoDB's answer to SQL's `GROUP BY`, `JOIN` and much more.

## A first pipeline

Revenue per category for paid orders, highest first:

```js
db.orders.aggregate([
  { $match: { status: 'paid' } },                    // filter (like WHERE)
  { $unwind: '$items' },                             // one document per item
  { $group: {                                        // like GROUP BY
      _id: '$items.category',
      revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
      unitsSold: { $sum: '$items.qty' },
      orders: { $addToSet: '$_id' },
  } },
  { $project: {                                      // shape the output
      _id: 0,
      category: '$_id',
      revenue: 1,
      unitsSold: 1,
      orderCount: { $size: '$orders' },
  } },
  { $sort: { revenue: -1 } },
])
```

Field paths in expressions start with `$` (`'$items.price'`).

## Core stages

| Stage | Purpose |
| --- | --- |
| `$match` | Filter documents (same syntax as `find`) |
| `$project` / `$set` (`$addFields`) / `$unset` | Reshape, compute or remove fields |
| `$group` | Group by a key and compute accumulators |
| `$sort`, `$limit`, `$skip` | Order and paginate |
| `$unwind` | Deconstruct an array into one document per element |
| `$count` | Count the documents reaching this stage |

## `$group` accumulators

```js
db.products.aggregate([
  { $group: {
      _id: '$category',
      count: { $sum: 1 },
      avgPrice: { $avg: '$price' },
      minPrice: { $min: '$price' },
      maxPrice: { $max: '$price' },
      totalStock: { $sum: '$stock' },
      names: { $push: '$name' },
      firstAdded: { $first: '$name' },   // depends on the sort before $group
  } },
])
```

Group everything into one result with `_id: null`. Group by several fields with an object: `_id: { category: '$category', year: { $year: '$createdAt' } }`.

## Computing fields

```js
db.orders.aggregate([
  { $set: {
      itemCount: { $size: '$items' },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
      isLarge: { $gte: ['$total', 5000] },
      discountPct: { $round: [{ $multiply: [{ $divide: ['$discount', '$total'] }, 100] }, 1] },
  } },
])
```

Useful expression operators: arithmetic (`$add`, `$subtract`, `$multiply`, `$divide`, `$round`), conditionals (`$cond`, `$ifNull`, `$switch`), strings (`$concat`, `$toLower`, `$substrCP`, `$split`), dates (`$year`, `$month`, `$dateTrunc`, `$dateDiff`), arrays (`$size`, `$filter`, `$map`, `$reduce`, `$in`).

## Monthly sales report

```js
db.orders.aggregate([
  { $match: { status: 'paid', createdAt: { $gte: ISODate('2026-01-01') } } },
  { $group: {
      _id: { $dateTrunc: { date: '$createdAt', unit: 'month' } },
      revenue: { $sum: '$total' },
      orders: { $sum: 1 },
      avgOrderValue: { $avg: '$total' },
  } },
  { $sort: { _id: 1 } },
])
```

## Performance rules

1. **Put `$match` (and `$sort` + `$limit`) as early as possible** — early stages can use indexes; later stages can't.
2. **Project away large fields early** to reduce the data flowing through the pipeline.
3. Each stage has a memory limit (100 MB); large `$group`/`$sort` stages spill to disk automatically in modern versions, but that's slower — filter first.
4. Check with `db.orders.explain('executionStats').aggregate([...])`.

## Aggregation vs. application code

Doing the computation in MongoDB sends only the result over the network, instead of every raw document. For reports and dashboards, aggregation pipelines are usually far more efficient than fetching documents and looping in Node.js.

## Try it yourself

With an `orders` collection (`userId`, `items[{ productId, category, price, qty }]`, `total`, `status`, `createdAt`):

1. Total revenue and order count per status.
2. Top 5 customers by total spend, with their order count.
3. Average number of items per order, per month.
4. The best-selling product (by units) in each category.
