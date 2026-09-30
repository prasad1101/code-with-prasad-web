Node.js is excellent for command-line tools: build scripts, code generators, data migrations, deployment helpers. This lesson builds a small but polished CLI using only built-in modules.

## What we'll build

`todo` — a to-do list stored in a JSON file:

```bash
todo add "Write the report"
todo list
todo done 1
todo list --all
```

## Project setup

```json
{
  "name": "todo-cli",
  "version": "1.0.0",
  "type": "module",
  "bin": { "todo": "./bin/todo.js" }
}
```

The `bin` field tells npm which command to create when the package is installed globally (or linked with `npm link` during development).

## The entry point

```js
#!/usr/bin/env node
// bin/todo.js
import { parseArgs } from 'node:util'
import { addTodo, completeTodo, listTodos } from '../src/store.js'

// Declared before use: classes aren't usable before their declaration line (TDZ)
class UsageError extends Error {}

const { values, positionals } = parseArgs({
  options: {
    all: { type: 'boolean', short: 'a' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
})

const [command, ...args] = positionals

const usage = `Usage:
  todo add <text>     Add a task
  todo list [--all]   List open tasks (or all)
  todo done <id>      Mark a task done`

try {
  switch (command) {
    case 'add': {
      const text = args.join(' ').trim()
      if (!text) throw new UsageError('Task text is required')
      const todo = await addTodo(text)
      console.log(`Added #${todo.id}: ${todo.text}`)
      break
    }
    case 'list': {
      const todos = await listTodos({ includeDone: values.all })
      if (!todos.length) console.log('Nothing to do 🎉')
      for (const t of todos) console.log(`${t.done ? '✔' : '○'} #${t.id} ${t.text}`)
      break
    }
    case 'done': {
      const id = Number(args[0])
      if (!Number.isInteger(id)) throw new UsageError('A numeric task id is required')
      await completeTodo(id)
      console.log(`Completed #${id}`)
      break
    }
    default:
      console.log(usage)
      process.exitCode = values.help ? 0 : 1
  }
} catch (err) {
  console.error(`Error: ${err.message}`)
  if (err instanceof UsageError) console.error(`\n${usage}`)
  process.exitCode = err instanceof UsageError ? 2 : 1
}
```

The shebang (`#!/usr/bin/env node`) lets the file run as an executable on macOS/Linux. Make it executable with `chmod +x bin/todo.js`.

## The storage module

```js
// src/store.js
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const dir = path.join(os.homedir(), '.todo-cli')
const file = path.join(dir, 'todos.json')

async function load() {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return { nextId: 1, todos: [] }
    throw err
  }
}

async function save(data) {
  await mkdir(dir, { recursive: true })
  const tmp = `${file}.tmp`
  await writeFile(tmp, JSON.stringify(data, null, 2))
  await rename(tmp, file) // atomic replace: never leaves a half-written file
}

export async function addTodo(text) {
  const data = await load()
  const todo = { id: data.nextId++, text, done: false, createdAt: new Date().toISOString() }
  data.todos.push(todo)
  await save(data)
  return todo
}

export async function listTodos({ includeDone = false } = {}) {
  const { todos } = await load()
  return includeDone ? todos : todos.filter((t) => !t.done)
}

export async function completeTodo(id) {
  const data = await load()
  const todo = data.todos.find((t) => t.id === id)
  if (!todo) throw new Error(`No task with id ${id}`)
  todo.done = true
  await save(data)
}
```

Writing to a temporary file and renaming it is a standard trick to avoid corrupting data if the process is killed mid-write.

## Try it locally

```bash
npm link            # creates a global `todo` command pointing at this folder
todo add "Learn streams"
todo list
```

## CLI best practices

- **Exit codes**: 0 for success, non-zero for failure (scripts and CI depend on this).
- **stdout for data, stderr for messages**, so output can be piped: `todo list | grep report`.
- **`--help`** and helpful error messages with usage.
- **Respect `NO_COLOR`** and non-TTY output: only colourise when `process.stdout.isTTY`.
- **Be fast to start** — lazy-load heavy modules with dynamic `import()`.
- **Confirm destructive actions**, or require a `--force` flag.

Colours without dependencies:

```js
import { styleText } from 'node:util'
console.log(styleText('green', '✔ Done'))
```

For larger CLIs, libraries like Commander, yargs or oclif add sub-command parsing, auto-generated help and plugins.

## Try it yourself

Extend the CLI with `todo remove <id>`, `todo clear --done` (with a confirmation prompt using `node:readline/promises`), and a `--json` flag on `list` that prints machine-readable output.
