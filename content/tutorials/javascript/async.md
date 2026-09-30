Some operations take time: fetching data from a server, reading a file, waiting for a timer. JavaScript doesn't stop and wait for them — it starts the operation, carries on, and handles the result when it arrives. This is **asynchronous** programming.

## Seeing asynchronous code in action

```js
console.log('1. Start')

setTimeout(() => {
  console.log('2. Timer finished')
}, 1000)

console.log('3. End')
```

Output:

```text
1. Start
3. End
2. Timer finished
```

`setTimeout` schedules the function to run later. Meanwhile, the rest of the program keeps going.

## Callbacks

The oldest pattern: pass a function to be called when the work is done.

```js
function loadUser(id, callback) {
  setTimeout(() => {
    callback({ id, name: 'Asha' })
  }, 500)
}

loadUser(1, (user) => {
  console.log(user.name)
})
```

Callbacks become hard to read when steps depend on each other — each step nests inside the previous one ("callback hell").

## Promises

A **promise** is an object representing a value that will be available later. It's either *pending*, *fulfilled* (with a value) or *rejected* (with an error).

```js
function loadUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id <= 0) reject(new Error('Invalid id'))
      else resolve({ id, name: 'Asha' })
    }, 500)
  })
}

loadUser(1)
  .then((user) => console.log(user.name))
  .catch((err) => console.error(err.message))
  .finally(() => console.log('Done'))
```

`.then` handlers can return values or new promises, so steps chain in a flat sequence instead of nesting.

## `async` and `await`

`async`/`await` lets you write promise-based code that reads like normal, top-to-bottom code:

```js
async function showUser() {
  try {
    const user = await loadUser(1)
    console.log(user.name)
  } catch (err) {
    console.error('Failed:', err.message)
  }
}

showUser()
```

- `async` before a function makes it return a promise.
- `await` pauses *that function* until the promise settles, then gives you its value. The rest of the program keeps running.
- Errors from rejected promises are handled with ordinary `try`/`catch`.

## Fetching data from an API

`fetch` is built into browsers and Node.js 18+:

```js
async function getTodo() {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos/1')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const todo = await res.json()
  console.log(todo.title)
}

getTodo().catch((err) => console.error(err))
```

Note that `fetch` only rejects on network failures; for HTTP errors like 404 you must check `res.ok` yourself.

## Running tasks in parallel

`await` in sequence waits for each step before starting the next. When tasks don't depend on each other, start them together with `Promise.all`:

```js
async function loadDashboard() {
  const [user, posts] = await Promise.all([
    fetch('/api/user').then((r) => r.json()),
    fetch('/api/posts').then((r) => r.json()),
  ])
  return { user, posts }
}
```

`Promise.all` rejects as soon as any promise rejects. Use `Promise.allSettled` when you want every result, successful or not.

## Try it yourself

1. Write `wait(ms)` that returns a promise resolving after `ms` milliseconds.
2. Use it in an `async` function to print "Ready…", "Set…", "Go!" one second apart.
3. Fetch `https://jsonplaceholder.typicode.com/users` and print each user's name.

**Congratulations** — you've completed the JavaScript fundamentals! From here, good next steps are the DOM (making pages interactive), Node.js for back-end development, or a framework such as React.
