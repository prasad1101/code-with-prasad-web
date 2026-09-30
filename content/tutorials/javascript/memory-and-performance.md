Fast JavaScript is mostly about **doing less work**: less work on the main thread, fewer DOM updates, fewer allocations, and no memory that grows forever. This lesson covers how memory is managed and the techniques that matter most in real applications.

## How memory is managed

JavaScript is **garbage collected**. The engine periodically finds objects that are no longer **reachable** from the "roots" (globals, the current call stack, active closures) and frees them. Modern engines use a generational collector: most objects die young, so short-lived allocations are cheap — but not free.

A **memory leak** in JavaScript means keeping references to objects you no longer need, so they can never be collected.

## Common leaks

**1. Forgotten listeners and timers**

```js
function mountWidget(el) {
  const bigData = new Array(1e6).fill('x')
  const onResize = () => el.textContent = bigData.length
  window.addEventListener('resize', onResize)
  const id = setInterval(() => poll(el), 1000)

  // Return a cleanup function — and make sure callers use it
  return () => {
    window.removeEventListener('resize', onResize)
    clearInterval(id)
  }
}
```

As long as the listener is registered, its closure keeps `bigData` and `el` alive — even after the element is removed from the page.

**2. Unbounded caches**

```js
const cache = new Map()
function getUser(id) {
  if (!cache.has(id)) cache.set(id, fetchUser(id)) // grows forever
  return cache.get(id)
}
```

Bound it (LRU with a maximum size), expire entries, or use a `WeakMap` when keys are objects.

**3. Detached DOM nodes** — elements removed from the document but still referenced from JavaScript arrays or variables.

**4. Accidental globals** — assigning to an undeclared variable in sloppy mode creates a global that lives forever. Use modules/strict mode.

### Finding leaks

In Chrome DevTools → **Memory**: take a heap snapshot, perform the action several times (open/close a dialog), take another snapshot, and compare. Objects whose count keeps growing — especially "Detached" DOM nodes — are your leak. The **Performance monitor** panel shows JS heap size and listener counts live.

## Debounce and throttle

Events like `input`, `scroll` and `resize` fire many times per second. Limit how often expensive handlers run:

```js
function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

function throttle(fn, ms) {
  let last = 0
  return (...args) => {
    const now = Date.now()
    if (now - last >= ms) {
      last = now
      fn(...args)
    }
  }
}

searchInput.addEventListener('input', debounce((e) => search(e.target.value), 300))
window.addEventListener('scroll', throttle(updateProgressBar, 100), { passive: true })
```

- **Debounce**: run once the events *stop* (search-as-you-type, autosave).
- **Throttle**: run at most once per interval *during* the events (scroll position, drag).

## Avoiding layout thrashing

Reading layout (`offsetHeight`, `getBoundingClientRect`) after writing styles forces the browser to recalculate layout synchronously. Doing it in a loop is very slow:

```js
// Bad: read → write → read → write… forces layout every iteration
for (const box of boxes) {
  box.style.width = box.parentElement.offsetWidth / 2 + 'px'
}

// Good: batch all reads, then all writes
const widths = boxes.map((box) => box.parentElement.offsetWidth)
boxes.forEach((box, i) => (box.style.width = widths[i] / 2 + 'px'))
```

Animate with `transform` and `opacity` — they can be handled by the compositor without layout or paint.

## Keep the main thread free

- **Split long tasks** (anything over ~50 ms) and yield between chunks — see the Event Loop lesson.
- **Move heavy computation to a Web Worker**:

```js
// main.js
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
worker.postMessage(largeDataset)
worker.onmessage = (e) => renderChart(e.data)

// worker.js
self.onmessage = (e) => self.postMessage(expensiveAggregation(e.data))
```

## Load less JavaScript

The fastest code is code that never downloads:

- **Code-split** with dynamic `import()` so each page loads only what it needs.
- **Tree-shake**: import named functions from ES-module libraries, not whole namespaces.
- Audit bundles (e.g. `source-map-explorer`) and replace heavy dependencies.
- Use `defer`/`type="module"` for scripts so they don't block HTML parsing.

## Measure, don't guess

```js
performance.mark('filter-start')
const result = hugeList.filter(predicate)
performance.mark('filter-end')
performance.measure('filter', 'filter-start', 'filter-end')
console.log(performance.getEntriesByName('filter')[0].duration)
```

Use the DevTools **Performance** panel to record real interactions, and Lighthouse / Core Web Vitals (LCP, INP, CLS) to track what users experience. Optimise the slowest thing first, then measure again.

## Try it yourself

1. Build a search box over 10,000 generated items. Measure how long filtering takes per keystroke, then add debouncing.
2. Create a component that leaks an interval when removed, confirm the leak with a heap snapshot, then fix it with a cleanup function.
