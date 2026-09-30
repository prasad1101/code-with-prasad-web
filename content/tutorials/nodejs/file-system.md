The `node:fs` module reads and writes files and directories; `node:path` builds file paths that work on every operating system.

## Three API styles

```js
import { readFileSync } from 'node:fs'           // synchronous — blocks the event loop
import { readFile } from 'node:fs'               // callback-based
import { readFile as read } from 'node:fs/promises' // promise-based (recommended)
```

Use the **promise API** in servers. Synchronous calls are fine in startup code and CLI scripts, but never in request handlers — they block every other request.

## Reading and writing files

```js
import { readFile, writeFile, appendFile } from 'node:fs/promises'

const text = await readFile('notes.txt', 'utf8')           // string (without 'utf8' you get a Buffer)
await writeFile('output.txt', 'Hello\n')                   // create or overwrite
await appendFile('app.log', `${new Date().toISOString()} started\n`)

// JSON
const config = JSON.parse(await readFile('config.json', 'utf8'))
await writeFile('config.json', JSON.stringify(config, null, 2))
```

## Handling errors

```js
try {
  const data = await readFile('missing.txt', 'utf8')
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('File does not exist')
  } else {
    throw error
  }
}
```

Common error codes: `ENOENT` (not found), `EACCES` (permission denied), `EEXIST` (already exists), `EISDIR` (is a directory).

Checking whether a file exists before opening it is a race condition — another process could delete it in between. Just try the operation and handle the error.

## Directories

```js
import { mkdir, readdir, rm, stat } from 'node:fs/promises'

await mkdir('data/exports', { recursive: true })   // creates parents; no error if it exists

const entries = await readdir('data', { withFileTypes: true })
for (const entry of entries) {
  console.log(entry.name, entry.isDirectory() ? 'dir' : 'file')
}

const info = await stat('data/report.csv')
console.log(info.size, info.mtime)

await rm('tmp', { recursive: true, force: true })   // like rm -rf
```

List every file in a tree:

```js
const files = await readdir('src', { recursive: true })
```

Or match patterns with the built-in glob (Node 22+):

```js
import { glob } from 'node:fs/promises'
for await (const file of glob('src/**/*.test.js')) console.log(file)
```

## Paths

Never build paths with string concatenation — separators differ between Windows (`\`) and POSIX (`/`):

```js
import path from 'node:path'

path.join('data', 'exports', 'report.csv')   // data/exports/report.csv
path.resolve('data')                         // absolute path from the current directory
path.basename('/a/b/report.csv')             // 'report.csv'
path.extname('report.csv')                   // '.csv'
path.dirname('/a/b/report.csv')              // '/a/b'
path.parse('/a/b/report.csv')                // { root, dir, base, name, ext }
```

### Paths relative to the current file

Relative paths in `fs` calls resolve against the **current working directory** (where you ran `node`), not the file's location. To reference files next to your module:

```js
// ES modules
const templatePath = path.join(import.meta.dirname, 'templates', 'email.html')

// CommonJS
const templatePath2 = path.join(__dirname, 'templates', 'email.html')
```

## Watching files

```js
import { watch } from 'node:fs/promises'

for await (const event of watch('config', { recursive: true })) {
  console.log(event.eventType, event.filename)
}
```

## Large files: use streams

`readFile` loads the whole file into memory. For large files (logs, CSV exports, uploads), process them as streams — covered in the Streams lesson:

```js
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

let errors = 0
for await (const line of createInterface({ input: createReadStream('huge.log') })) {
  if (line.includes('ERROR')) errors++
}
console.log(errors)
```

## Security: path traversal

Never pass user input directly into file paths. A request for `../../etc/passwd` could escape your folder:

```js
const base = path.resolve('uploads')
const target = path.resolve(base, userSuppliedName)
if (!target.startsWith(base + path.sep)) throw new Error('Invalid path')
```

## Try it yourself

Write a script that scans a folder recursively, groups files by extension, and writes a `report.json` with the count and total size of each extension.
