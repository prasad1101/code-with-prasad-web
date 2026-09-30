**Express** is the most widely used web framework for Node.js — the "E" in MEAN and MERN. It's minimal and unopinionated: a thin layer over Node's `http` module that adds **routing**, **middleware** and helpful request/response methods. This course uses **Express 5**.

## Why Express?

With the raw `http` module you parse URLs, bodies and headers by hand. Express handles that plumbing so you can focus on your API:

```js
// Raw Node.js
createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/hello') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Hi' }))
  }
})

// Express
app.get('/hello', (req, res) => res.json({ message: 'Hi' }))
```

## Setting up a project

```bash
mkdir express-api && cd express-api
npm init -y
npm pkg set type=module
npm install express
```

## Hello, Express

```js
// src/index.js
import express from 'express'

const app = express()
const port = process.env.PORT ?? 3000

app.get('/', (req, res) => {
  res.send('Hello from Express!')
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
```

```bash
node --watch src/index.js
```

Open `http://localhost:3000/api/health` — you'll get JSON back.

## How Express works

An Express app is a **pipeline of functions**. Each incoming request flows through the middleware and route handlers you register, in order, until one of them sends a response:

```text
request → logger → json parser → auth → route handler → response
                                   ↘ error handler (if something fails)
```

Every handler receives:

- `req` — the request (URL, params, query, headers, body).
- `res` — the response (status, headers, body).
- `next` — a function that passes control to the next handler.

You'll learn each piece in the coming lessons.

## Express 5 in brief

Express 5 is the current major version. Compared with Express 4, the most important changes are:

- **Async errors are handled automatically**: if an `async` handler throws or returns a rejected promise, Express passes the error to your error handler. (In Express 4 you needed `try/catch` + `next(err)` or a wrapper.)
- **Stricter path syntax**: wildcards must be named (`/files/*path`), and optional segments use braces (`/users{/:id}`).
- Some deprecated methods were removed (`app.del`, `res.sendfile`, …).

If you maintain an Express 4 app, the official migration guide lists every change.

## What you'll build in this course

A complete REST API for a small online store — products, users, authentication with JWTs, validation, MongoDB persistence, file uploads, tests, security hardening and production readiness.

## Try it yourself

Create the project above and add a `GET /api/time` route that returns the current ISO timestamp and the server's timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
