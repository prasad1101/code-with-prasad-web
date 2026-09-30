JavaScript runs your code on **a single thread**, yet it handles timers, network requests and user input without freezing. The **event loop** is what coordinates all of this. Knowing how it works explains the order your code runs in — and a whole category of interview questions.

## The pieces

- **Call stack** — where synchronous code runs, one function at a time.
- **Web APIs / runtime APIs** — timers, network, file system; they work outside the JS thread.
- **Task queue** (macrotask queue) — callbacks from timers, I/O, UI events.
- **Microtask queue** — promise callbacks (`.then`, `await` continuations) and `queueMicrotask`.

## The loop

1. Run the current task (initially, the whole script) until the call stack is empty.
2. Run **all** microtasks — including any new microtasks queued while doing so.
3. (Browser) Render if needed: run `requestAnimationFrame` callbacks, recalculate styles and layout, paint.
4. Take the next task from the task queue and go back to step 1.

The key rule: **microtasks always run before the next task**.

```js
console.log('1 sync')

setTimeout(() => console.log('4 timeout (task)'), 0)

Promise.resolve()
  .then(() => console.log('3 promise (microtask)'))

queueMicrotask(() => console.log('3b microtask'))

console.log('2 sync')
```

Output:

```text
1 sync
2 sync
3 promise (microtask)
3b microtask
4 timeout (task)
```

## `async`/`await` and the event loop

`await` pauses the async function and schedules the rest of it as a microtask once the awaited promise settles:

```js
async function run() {
  console.log('A')
  await null
  console.log('C') // continues in a microtask
}

run()
console.log('B')
// A, B, C
```

## Why the page freezes

While the call stack is busy, **nothing else can happen** — no clicks, no rendering, no timers. A long synchronous loop blocks everything:

```js
button.addEventListener('click', () => {
  const end = Date.now() + 3000
  while (Date.now() < end) {} // page is frozen for 3 seconds
})
```

Likewise, a microtask that keeps scheduling microtasks starves rendering, because the loop never gets past step 2.

### Keeping the page responsive

Break long work into chunks and yield back to the event loop between them:

```js
async function processAll(items) {
  for (let i = 0; i < items.length; i++) {
    process(items[i])
    if (i % 500 === 0) {
      await new Promise((r) => setTimeout(r, 0)) // let the browser handle input and paint
    }
  }
}
```

For genuinely heavy computation, move it to a **Web Worker** (browser) or **worker thread** (Node.js), which runs on another thread.

## `setTimeout` is a minimum, not a guarantee

`setTimeout(fn, 100)` means "queue `fn` after at least 100 ms". If the stack is busy, it runs later. Browsers also clamp nested timers to at least 4 ms, and throttle timers in background tabs.

## `requestAnimationFrame`

For visual updates, use `requestAnimationFrame`: its callback runs right before the next paint, in sync with the display's refresh rate:

```js
function animate(timestamp) {
  box.style.transform = `translateX(${(timestamp / 10) % 300}px)`
  requestAnimationFrame(animate)
}
requestAnimationFrame(animate)
```

## Node.js

Node's event loop (powered by libuv) has additional phases — timers, poll, check (`setImmediate`) and more — plus `process.nextTick`, which runs even before promise microtasks. The blog post [Understanding the Node.js Event Loop](/blog/nodejs-event-loop) covers these in depth.

## Try it yourself

Predict the output:

```js
console.log(1)
setTimeout(() => console.log(2))
Promise.resolve().then(() => {
  console.log(3)
  setTimeout(() => console.log(4))
  Promise.resolve().then(() => console.log(5))
})
console.log(6)
```

(Answer: 1, 6, 3, 5, 2, 4.)
