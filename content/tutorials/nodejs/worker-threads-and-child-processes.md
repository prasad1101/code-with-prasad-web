The main thread should stay free to handle I/O. For CPU-heavy work or running other programs, Node offers **worker threads** and **child processes**.

## Worker threads

Worker threads run JavaScript in parallel, each with its own V8 instance and event loop, inside the same process. They're ideal for CPU-bound tasks: image processing, parsing big files, compression, hashing, report generation.

```js
// main.js
import { Worker } from 'node:worker_threads'

export function runReport(params) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./report-worker.js', import.meta.url), {
      workerData: params,
    })
    worker.once('message', resolve)
    worker.once('error', reject)
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`))
    })
  })
}
```

```js
// report-worker.js
import { parentPort, workerData } from 'node:worker_threads'

function buildReport({ rows }) {
  // heavy CPU work here
  return rows.reduce((acc, r) => acc + r.amount, 0)
}

parentPort.postMessage(buildReport(workerData))
```

### Communicating with workers

- `postMessage` copies data using the **structured clone** algorithm (objects, arrays, `Map`, `Date`, typed arrays…).
- Large binary data can be **transferred** instead of copied: `postMessage(buffer, [buffer])` moves ownership to the other thread at zero cost.
- `SharedArrayBuffer` + `Atomics` allow genuinely shared memory for advanced cases.

### Use a pool

Creating a worker takes tens of milliseconds and some memory. For repeated tasks, keep a **pool** of long-lived workers and send them jobs — libraries like **Piscina** implement this:

```js
import Piscina from 'piscina'

const pool = new Piscina({ filename: new URL('./resize-worker.js', import.meta.url).href })
const thumbnail = await pool.run({ path: 'photo.jpg', width: 300 })
```

Size the pool to the number of CPU cores (`os.availableParallelism()`), minus one for the main thread.

## Child processes

`node:child_process` runs **other programs** — shell commands, Python scripts, ffmpeg, git — as separate OS processes.

```js
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// Short commands with small output
const { stdout } = await execFileAsync('git', ['rev-parse', '--short', 'HEAD'])
console.log(`Build ${stdout.trim()}`)

// Long-running processes or large output: stream it
const ffmpeg = spawn('ffmpeg', ['-i', 'input.mp4', '-vf', 'scale=640:-1', 'output.mp4'])
ffmpeg.stderr.on('data', (chunk) => process.stdout.write(chunk))
ffmpeg.on('close', (code) => console.log(`ffmpeg exited with ${code}`))
```

| Function | Use for |
| --- | --- |
| `execFile` | Run a program with arguments, buffer the output |
| `spawn` | Stream stdin/stdout/stderr; long-running processes |
| `exec` | Run a **shell** command string (pipes, globs) |
| `fork` | Spawn another Node.js script with an IPC channel (`process.send`) |

### Security: avoid the shell with user input

```js
// Dangerous — a filename like "a.txt; rm -rf ~" runs a second command
exec(`convert ${userFile} out.png`)

// Safe — arguments are passed directly, never parsed by a shell
execFile('convert', [userFile, 'out.png'])
```

Prefer `execFile`/`spawn` with argument arrays whenever any part comes from users.

## Choosing between them

| Need | Use |
| --- | --- |
| CPU-heavy JavaScript | Worker threads (pool) |
| Run a non-JavaScript program | Child process |
| Isolate untrusted or crash-prone code | Child process (a crash doesn't take down your server) |
| Use all CPU cores for an HTTP server | Multiple processes (cluster/containers — next lesson) |
| Very heavy or long jobs | A job queue (BullMQ, RabbitMQ) processed by separate worker services |

## Try it yourself

1. Write a function that computes the SHA-256 hash of 100,000 random strings, first on the main thread (measure event loop delay while it runs) and then in a worker thread.
2. Use `execFile` to get the current git branch and commit, and print a build banner.
