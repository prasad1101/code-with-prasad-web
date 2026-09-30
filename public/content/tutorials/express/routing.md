**Routing** decides which code runs for a given HTTP method and URL path.

## Route methods

```js
app.get('/products', listProducts)
app.post('/products', createProduct)
app.put('/products/:id', replaceProduct)
app.patch('/products/:id', updateProduct)
app.delete('/products/:id', deleteProduct)

app.all('/admin', requireAdmin) // any method
```

Routes are matched **in the order they're registered**; the first matching handler that sends a response ends the request.

## Route parameters

Named segments starting with `:` are captured into `req.params`:

```js
app.get('/users/:userId/orders/:orderId', (req, res) => {
  const { userId, orderId } = req.params   // always strings
  res.json({ userId, orderId })
})
```

Convert and validate them yourself — `req.params.id` is `'42'`, not `42`.

### Optional segments and wildcards (Express 5 syntax)

```js
app.get('/docs{/:page}', (req, res) => {            // matches /docs and /docs/intro
  res.send(req.params.page ?? 'index')
})

app.get('/files/*filepath', (req, res) => {         // /files/a/b/c.txt
  res.send(req.params.filepath.join('/'))           // ['a', 'b', 'c.txt']
})
```

## Query strings

```js
// GET /products?category=books&sort=price&page=2
app.get('/products', (req, res) => {
  const { category, sort = 'createdAt', page = '1' } = req.query
  res.json({ category, sort, page: Number(page) })
})
```

Query values are strings (or arrays when a key repeats: `?tag=a&tag=b`). Validate and convert them.

## `express.Router`: modular routes

Group related routes in their own module and mount them under a prefix:

```js
// src/routes/products.js
import { Router } from 'express'

export const productsRouter = Router()

productsRouter.get('/', (req, res) => res.json([]))
productsRouter.get('/:id', (req, res) => res.json({ id: req.params.id }))
productsRouter.post('/', (req, res) => res.status(201).json(req.body))
```

```js
// src/index.js
import { productsRouter } from './routes/products.js'
app.use('/api/products', productsRouter)
```

Now `GET /api/products/42` is handled by the router's `/:id` route. Routers can have their own middleware:

```js
adminRouter.use(requireAdmin)   // applies to every route in this router
```

### Chaining with `route()`

```js
productsRouter.route('/:id')
  .get(getProduct)
  .patch(updateProduct)
  .delete(deleteProduct)
```

## Handling parameters once

`router.param` runs logic whenever a route contains a given parameter — useful for loading a resource:

```js
productsRouter.param('id', async (req, res, next, id) => {
  const product = await Products.findById(id)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  req.product = product
  next()
})

productsRouter.get('/:id', (req, res) => res.json(req.product))
```

## Route order matters

```js
app.get('/users/:id', getUser)
app.get('/users/me', getCurrentUser) // never reached — '/users/:id' matches 'me' first
```

Register specific routes before parameterised ones.

## 404 handling

Add a catch-all **after** all routes:

```js
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` })
})
```

## RESTful URL design

| Action | Method & path |
| --- | --- |
| List products | `GET /api/products` |
| Get one | `GET /api/products/:id` |
| Create | `POST /api/products` |
| Replace | `PUT /api/products/:id` |
| Partially update | `PATCH /api/products/:id` |
| Delete | `DELETE /api/products/:id` |
| Nested resource | `GET /api/users/:id/orders` |

Use plural nouns, not verbs (`/createProduct` ✗). Filtering, sorting and pagination go in the query string.

## Try it yourself

Create a `booksRouter` with an in-memory array and full CRUD routes. Support `?author=` filtering and `?sort=title`. Mount it at `/api/books` and add a JSON 404 handler.
