**Events** are how the browser tells your code that something happened: a click, a key press, a form submission, the page finishing loading. You respond by registering **event listeners**.

## Listening for events

```js
const button = document.querySelector('#save')

button.addEventListener('click', (event) => {
  console.log('Saved!', event.type)  // 'click'
})
```

The listener receives an **event object** with details about what happened: `event.target` (the element that triggered it), mouse coordinates, the key pressed, and so on.

Common events:

| Event | Fires when |
| --- | --- |
| `click` | An element is clicked (or activated with Enter/Space on a button) |
| `input` | The value of an input changes (every keystroke) |
| `change` | An input's value is committed (e.g. on blur, or when a checkbox toggles) |
| `submit` | A form is submitted |
| `keydown` / `keyup` | A key is pressed / released |
| `focus` / `blur` | An element gains / loses focus |
| `DOMContentLoaded` | The HTML is fully parsed |

## Preventing default behaviour

Some events have a built-in action — submitting a form reloads the page, clicking a link navigates. Call `preventDefault()` to handle it yourself:

```js
const form = document.querySelector('#signup')

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const data = new FormData(form)
  console.log(Object.fromEntries(data)) // { email: '…', password: '…' }
})
```

## Bubbling and event delegation

Most events **bubble**: after firing on the target, they travel up through each ancestor to `document`. That lets one listener on a parent handle events for all its children — **event delegation**:

```js
const list = document.querySelector('#todo')

list.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('button.delete')
  if (!deleteButton) return
  deleteButton.closest('li').remove()
})
```

Delegation means:

- One listener instead of hundreds.
- Items added later work automatically — no need to attach listeners to each new element.

`event.stopPropagation()` stops bubbling, but use it sparingly: it can break delegated listeners elsewhere on the page.

## Removing listeners

To remove a listener, pass the **same function reference**:

```js
function onResize() {
  console.log(window.innerWidth)
}
window.addEventListener('resize', onResize)
window.removeEventListener('resize', onResize)
```

Or use an `AbortController` to remove several listeners at once:

```js
const controller = new AbortController()
window.addEventListener('resize', onResize, { signal: controller.signal })
window.addEventListener('scroll', onScroll, { signal: controller.signal })

controller.abort() // removes both
```

## Useful listener options

```js
element.addEventListener('click', handler, { once: true })     // auto-removed after first call
window.addEventListener('scroll', handler, { passive: true })  // promises not to call preventDefault → smoother scrolling
```

## Keyboard events and accessibility

```js
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDialog()
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    openSearch()
  }
})
```

Attach click handlers to real `<button>` elements rather than `<div>`s: buttons are focusable and respond to Enter and Space automatically, so keyboard and screen-reader users can use them.

## Custom events

Components can announce their own events:

```js
const cart = document.querySelector('#cart')
cart.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: 3 }, bubbles: true }))

document.addEventListener('cart:updated', (e) => console.log(e.detail.count))
```

## Try it yourself

Create a list of five "like" buttons, each with a counter. Use **one** delegated listener on the list to increment the right counter. Then add a keyboard shortcut: pressing `r` resets all counters.
