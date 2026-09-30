Now let's persist data. **Mongoose** is the most popular MongoDB library for Node.js: it adds schemas, validation, middleware (hooks), relationships and a convenient query API on top of the official driver.

## Setup

```bash
npm install mongoose
```

Run MongoDB locally with Docker, or create a free cluster on MongoDB Atlas:

```bash
docker run -d --name mongo -p 27017:27017 mongo:8
```

```text
# .env
MONGODB_URI=mongodb://localhost:27017/shop
```

## Connecting

```js
// src/db.js
import mongoose from 'mongoose'

export async function connectDb(uri) {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 })
  console.log('MongoDB connected')
}

export const disconnectDb = () => mongoose.disconnect()
```

```js
// src/server.js
await connectDb(process.env.MONGODB_URI)
createApp().listen(3000)
```

Connect **once** at startup; Mongoose maintains a connection pool shared by all requests.

## Defining a schema and model

```js
// src/products/product.model.js
import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: ['stationery', 'books', 'electronics'], index: true },
    tags: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }, // adds createdAt and updatedAt
)

productSchema.index({ category: 1, price: 1 })

export const Product = mongoose.model('Product', productSchema)
```

## CRUD with Mongoose

```js
// Create
const product = await Product.create({ name: 'Notebook', slug: 'notebook', price: 120, category: 'stationery', seller: userId })

// Read
const one = await Product.findById(id)                          // null if not found
const list = await Product.find({ category: 'books', price: { $lte: 500 } })
  .sort({ price: 1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .select('name price category')                                 // only these fields
  .lean()                                                        // plain objects, faster

const total = await Product.countDocuments({ category: 'books' })

// Update
const updated = await Product.findByIdAndUpdate(id, { $set: { price: 99 } }, { new: true, runValidators: true })
await Product.updateMany({ stock: 0 }, { $set: { tags: ['sold-out'] } })

// Delete
await Product.findByIdAndDelete(id)
```

Notes:

- `{ new: true }` returns the **updated** document (default returns the old one).
- `runValidators: true` applies schema validation to updates — it's off by default.
- `.lean()` skips building full Mongoose documents; use it for read-only responses.

## Wiring into the service

```js
// src/products/products.service.js
import { Product } from './product.model.js'
import { NotFoundError } from '../errors.js'

export async function listProducts({ category, sort, page, limit }) {
  const filter = category ? { category } : {}
  const [data, total] = await Promise.all([
    Product.find(filter).sort({ [sort]: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ])
  return { data, meta: { page, limit, total } }
}

export async function getProduct(id) {
  const product = await Product.findById(id).lean()
  if (!product) throw new NotFoundError('Product')
  return product
}
```

Because Express 5 forwards rejected promises, route handlers can simply `await` these functions.

## Relationships with `populate`

```js
const product = await Product.findById(id).populate('seller', 'name email').lean()
// product.seller is now { _id, name, email } instead of an ObjectId
```

`populate` runs an extra query. For lists, prefer populating only needed fields, or design documents to embed frequently read data (see the MongoDB course's data modelling lesson).

## Middleware (hooks)

```js
productSchema.pre('validate', function () {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }
})
```

Use hooks sparingly — hidden side effects are hard to follow.

## Validating ObjectIds

An invalid id string makes Mongoose throw a `CastError`. Validate first:

```js
import { isValidObjectId } from 'mongoose'
const objectIdParams = z.object({ id: z.string().refine(isValidObjectId, 'Invalid id') })
```

## Transactions

For operations that must succeed or fail together (placing an order and decrementing stock), use a transaction (requires a replica set — Atlas clusters are replica sets):

```js
const session = await mongoose.startSession()
await session.withTransaction(async () => {
  const product = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true, session },
  )
  if (!product) throw new ConflictError('Not enough stock')
  await Order.create([{ user: userId, items: [{ product: productId, qty }] }], { session })
})
await session.endSession()
```

## Try it yourself

Replace the in-memory store from earlier lessons with Mongoose: add the `Product` model, update the service, handle `CastError` and duplicate `slug` errors (code 11000) in the error handler, and add pagination metadata to `GET /api/products`.
