The **DOM** (Document Object Model) is the browser's live, in-memory tree of the page. Every HTML element becomes a JavaScript object you can read and change — this is how JavaScript makes pages interactive.

## Selecting elements

```js
const title = document.getElementById('title')          // one element by id
const button = document.querySelector('.btn-primary')   // first match of any CSS selector
const items = document.querySelectorAll('ul.todo > li') // all matches (a static NodeList)

items.forEach((li) => console.log(li.textContent))
```

`querySelector`/`querySelectorAll` accept any CSS selector, so they're all you need in modern code. Both return `null` / an empty list when nothing matches — check before using the result.

## Reading and changing content

```js
const heading = document.querySelector('h1')

heading.textContent = 'Welcome back!'   // plain text — safe
heading.innerHTML = '<em>Welcome</em>'  // parses HTML — never use with user input
```

`textContent` treats everything as text. `innerHTML` parses HTML, which means inserting user-supplied data with it opens the door to **cross-site scripting (XSS)**. Prefer `textContent` and build elements explicitly.

## Attributes, classes and styles

```js
const link = document.querySelector('a')
link.href = 'https://developer.mozilla.org'
link.setAttribute('target', '_blank')
link.dataset.trackId = 'nav-mdn'        // sets data-track-id="nav-mdn"

const card = document.querySelector('.card')
card.classList.add('is-active')
card.classList.remove('is-hidden')
card.classList.toggle('is-open')        // add if missing, remove if present
card.classList.contains('is-active')    // true

card.style.setProperty('--accent', 'tomato')
```

Prefer toggling **classes** over setting inline styles — it keeps styling in CSS where it belongs.

## Creating and removing elements

```js
const list = document.querySelector('#todo')

function addTodo(text) {
  const li = document.createElement('li')
  li.textContent = text
  li.className = 'todo-item'
  list.append(li)
}

addTodo('Learn the DOM')
list.firstElementChild?.remove()
```

Other useful insertion methods: `prepend`, `before`, `after` and `replaceWith`.

### Batch inserts with a fragment

Every DOM change can trigger layout work. When adding many elements, build them in a `DocumentFragment` and insert once:

```js
const fragment = document.createDocumentFragment()
for (const name of ['Asha', 'Ravi', 'Meera']) {
  const li = document.createElement('li')
  li.textContent = name
  fragment.append(li)
}
list.append(fragment) // one insertion
```

## Traversing the tree

```js
const item = document.querySelector('.todo-item')

item.parentElement
item.children              // child elements
item.nextElementSibling
item.closest('.card')      // nearest ancestor (or itself) matching a selector
```

`closest` is especially handy in event handlers (next lesson).

## Waiting for the DOM

A script can only touch elements that already exist. Either place `<script>` at the end of `<body>`, or use `defer`, which runs the script after the HTML has been parsed:

```html
<script src="app.js" defer></script>
```

ES modules (`<script type="module">`) are deferred automatically.

## Try it yourself

Build a small page with an input, an "Add" button and an empty `<ul>`. When the button is clicked, add the input's text as a new list item (using `textContent`), then clear the input. Add a "Clear all" button that removes every item.
