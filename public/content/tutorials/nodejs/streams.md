**Streams** process data piece by piece instead of loading it all into memory. They let a Node.js server handle a 10 GB file or thousands of concurrent downloads with flat, predictable memory use. HTTP requests and responses, files, sockets, compression and crypto are all streams.

## The four stream types

| Type | Example |
| --- | --- |
| **Readable** — a source | `fs.createReadStream`, an incoming HTTP request |
| **Writable** — a destination | `fs.createWriteStream`, an HTTP response |
| **Duplex** — both | a TCP socket |
| **Transform** — modifies data passing through | `zlib.createGzip()`, encryption |

## Why streams matter

```js
// Loads the whole file into memory before sending — bad for large files
app.get('/video', async (req, res) => {
  res.end(await readFile('movie.mp4'))
})

// Streams chunks as they're read — constant memory
app.get('/video', (req, res) => {
  createReadStream('movie.mp4').pipe(res)
})
```

## `pipeline`: connecting streams safely

`pipeline` connects streams, propagates errors from any stage, and cleans everything up. Prefer it over `.pipe()`, which doesn't forward errors:

```js
import { createReadStream, createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'

await pipeline(
  createReadStream('access.log'),
  createGzip(),
  createWriteStream('access.log.gz'),
)
console.log('Compressed')
```

## Backpressure

If a readable produces data faster than a writable can consume it (fast disk → slow network), buffered data grows without limit. **Backpressure** is the mechanism that pauses the source when the destination's buffer is full: `write()` returns `false`, and the writable emits `'drain'` when it's ready for more.

`pipeline` and `.pipe()` handle backpressure automatically. If you write manually, respect it:

```js
import { once } from 'node:events'

for (const row of rows) {
  if (!out.write(`${row}\n`)) await once(out, 'drain')
}
out.end()
```

## Readable streams are async iterables

The simplest way to consume a readable:

```js
let bytes = 0
for await (const chunk of createReadStream('big.bin')) {
  bytes += chunk.length
}
```

## Writing a Transform stream

```js
import { Transform } from 'node:stream'

const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase())
  },
})

await pipeline(process.stdin, upperCase, process.stdout)
```

### Transforming line by line

Chunks don't align with lines — a chunk can end in the middle of a line. Use `readline` or a line-splitting transform:

```js
import { createInterface } from 'node:readline'

async function countStatus(file) {
  const counts = {}
  const lines = createInterface({ input: createReadStream(file), crlfDelay: Infinity })
  for await (const line of lines) {
    const status = line.split(' ')[8] // e.g. access-log status code column
    counts[status] = (counts[status] ?? 0) + 1
  }
  return counts
}
```

### Generators as transforms

`pipeline` accepts async generator functions as transform stages:

```js
await pipeline(
  createReadStream('users.ndjson'),
  async function* (source) {
    let buffer = ''
    for await (const chunk of source) {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line) continue
        const user = JSON.parse(line)
        if (user.active) yield JSON.stringify({ id: user.id, email: user.email }) + '\n'
      }
    }
  },
  createWriteStream('active-users.ndjson'),
)
```

## Object mode

Streams normally carry `Buffer`s or strings. With `objectMode: true` they carry JavaScript objects — useful for processing database cursors or parsed records:

```js
import { Readable } from 'node:stream'

const source = Readable.from([{ id: 1 }, { id: 2 }, { id: 3 }]) // objectMode by default
for await (const item of source) console.log(item.id)
```

MongoDB and PostgreSQL drivers can return query results as streams, so you can export millions of rows without loading them all.

## Streaming HTTP responses

```js
import { createServer } from 'node:http'
import { createGzip } from 'node:zlib'

createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Encoding': 'gzip' })
  try {
    await pipeline(exportOrdersAsCsv(), createGzip(), res) // exportOrdersAsCsv returns a Readable
  } catch (err) {
    console.error('Export failed', err) // client disconnected or source failed
  }
}).listen(3000)
```

## Web Streams

Node also implements the browser's **Web Streams** API (`ReadableStream`, used by `fetch`). Convert between them with `Readable.fromWeb()` and `Readable.toWeb()`:

```js
const res = await fetch('https://example.com/large.json')
await pipeline(Readable.fromWeb(res.body), createWriteStream('large.json'))
```

## Try it yourself

1. Write a script that streams a large CSV, keeps only rows where the `country` column is `IN`, and writes them to a new file — with memory usage staying flat regardless of file size.
2. Add gzip compression to the output and measure how long it takes for a 100 MB file.
