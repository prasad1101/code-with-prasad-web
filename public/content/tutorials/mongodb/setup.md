Let's get a MongoDB server running and connect to it with the shell and a GUI.

## Option 1: MongoDB Atlas (cloud)

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free cluster.
2. Create a database user (username + password).
3. Under **Network Access**, allow your IP address.
4. Click **Connect** and copy the connection string:

```text
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Atlas clusters are replica sets, so transactions and change streams work out of the box.

## Option 2: Docker (local)

```bash
docker run -d --name mongo -p 27017:27017 -v mongo-data:/data/db mongo:8
```

Connection string: `mongodb://localhost:27017`. The named volume keeps your data when the container is recreated.

To run a single-node **replica set** locally (needed for transactions and change streams):

```bash
docker run -d --name mongo-rs -p 27017:27017 mongo:8 --replSet rs0
docker exec -it mongo-rs mongosh --eval "rs.initiate()"
```

## Option 3: Native install

Install **MongoDB Community Server** from the MongoDB website or your package manager (e.g. `brew install mongodb-community` on macOS), and start it as a service.

## The MongoDB Shell: `mongosh`

```bash
mongosh "mongodb://localhost:27017"
```

```js
show dbs                  // list databases
use shop                  // switch to (or create on first write) the "shop" database
show collections

db.products.insertOne({ name: 'Notebook', price: 120 })
db.products.find()
db.products.countDocuments()
```

`mongosh` is a full JavaScript environment — you can use variables, loops and functions:

```js
for (let i = 1; i <= 5; i++) {
  db.products.insertOne({ name: `Pen ${i}`, price: 10 * i, category: 'stationery' })
}
```

Databases and collections are created **automatically** the first time you insert data.

## MongoDB Compass

**Compass** is the official GUI: browse collections, build queries visually, analyse schemas, inspect indexes and explain plans, and design aggregation pipelines stage by stage. Paste your connection string to connect.

## Loading sample data

Atlas can load sample datasets with one click (**Load Sample Dataset**). Locally, import JSON with `mongoimport`:

```bash
mongoimport --uri "mongodb://localhost:27017/shop" --collection products --jsonArray --file products.json
```

For the rest of this course, create a small dataset:

```js
use shop
db.products.insertMany([
  { name: 'Wireless Mouse', price: 799, category: 'electronics', tags: ['wireless'], stock: 42, rating: 4.3 },
  { name: 'Mechanical Keyboard', price: 3499, category: 'electronics', tags: ['rgb', 'usb-c'], stock: 12, rating: 4.7 },
  { name: 'Notebook A5', price: 120, category: 'stationery', tags: ['paper'], stock: 300, rating: 4.1 },
  { name: 'Gel Pen Pack', price: 199, category: 'stationery', tags: ['pens'], stock: 0, rating: 3.9 },
  { name: 'Clean Code', price: 899, category: 'books', tags: ['programming'], stock: 25, rating: 4.8 },
  { name: 'USB-C Hub', price: 1899, category: 'electronics', tags: ['usb-c'], stock: 7, rating: 4.0 }
])
```

## Connection strings

A connection string can include credentials, the database, and options:

```text
mongodb://appUser:secret@db1.example.com:27017,db2.example.com:27017/shop?replicaSet=rs0&authSource=admin
```

Keep it in an environment variable (`MONGODB_URI`) — never in source code.

## Try it yourself

1. Start MongoDB (Atlas or Docker) and connect with `mongosh`.
2. Create the `shop` database with the sample products above.
3. Open the collection in Compass and use the **Schema** tab to explore field types.
