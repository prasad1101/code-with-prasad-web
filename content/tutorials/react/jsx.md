**JSX** lets you write HTML-like markup inside JavaScript. It's the syntax React components use to describe UI. JSX isn't HTML — it compiles to JavaScript function calls — so it follows a few JavaScript-flavoured rules.

## JSX compiles to function calls

```tsx
const heading = <h1 className="title">Hello, Asha</h1>
```

becomes roughly:

```js
import { jsx } from 'react/jsx-runtime'
const heading = jsx('h1', { className: 'title', children: 'Hello, Asha' })
```

The result is a plain object describing what to render. React turns these descriptions into DOM elements.

## Embedding JavaScript with `{ }`

Curly braces switch from markup back to JavaScript. Any **expression** works:

```tsx
const user = { name: 'Asha', avatarUrl: '/avatars/asha.png', points: 1240 }

function Profile() {
  return (
    <section>
      <img src={user.avatarUrl} alt={`${user.name}'s avatar`} />
      <h2>{user.name.toUpperCase()}</h2>
      <p>{user.points.toLocaleString('en-IN')} points</p>
      <p>Member since {new Date(2024, 0, 15).getFullYear()}</p>
    </section>
  )
}
```

Statements (`if`, `for`) aren't expressions, so they can't go inside `{ }` directly — use ternaries, `&&` and `map` instead (next lessons), or compute values before the `return`.

## Rules of JSX

### 1. Return a single root element

```tsx
// ✗ two siblings at the top level
return (
  <h1>Title</h1>
  <p>Text</p>
)

// ✓ wrap them — a Fragment adds no extra DOM node
return (
  <>
    <h1>Title</h1>
    <p>Text</p>
  </>
)
```

### 2. Close every tag

```tsx
<img src={src} alt="" />
<input type="email" />
<br />
```

### 3. camelCase attributes

JSX attributes map to DOM properties:

| HTML | JSX |
| --- | --- |
| `class` | `className` |
| `for` | `htmlFor` |
| `onclick` | `onClick` |
| `tabindex` | `tabIndex` |
| `stroke-width` (SVG) | `strokeWidth` |

`aria-*` and `data-*` attributes keep their hyphens: `aria-label`, `data-testid`.

### 4. Styles are objects

```tsx
<div style={{ backgroundColor: '#f5f3ff', padding: 16, borderRadius: '12px' }}>…</div>
```

The outer braces enter JavaScript; the inner braces are the object. Numbers get `px` automatically for most properties. Prefer CSS classes for anything beyond dynamic values.

## Comments

```tsx
return (
  <div>
    {/* This is a JSX comment */}
    <p>Content</p>
  </div>
)
```

## JSX is safe by default

Text inserted with `{ }` is **escaped**, so user input can't inject HTML or scripts:

```tsx
const comment = '<img src=x onerror="alert(1)">'
return <p>{comment}</p>   // rendered as harmless text
```

The escape hatch `dangerouslySetInnerHTML={{ __html: html }}` does render raw HTML — only use it with content sanitised by a library like DOMPurify.

## Rendering values

- Strings and numbers render as text.
- `true`, `false`, `null` and `undefined` render **nothing** — useful for conditional rendering.
- Arrays of elements render each element (with `key`s — see the lists lesson).
- Plain objects can't be rendered directly: `{user}` throws; render `{user.name}` or `JSON.stringify(user)`.

Watch out for `0`: `{items.length && <List />}` renders `0` when the list is empty. Use `{items.length > 0 && <List />}`.

## Try it yourself

Write a `ProductCard` component that renders an image with alt text, the name, the price formatted as rupees with `toLocaleString('en-IN', { style: 'currency', currency: 'INR' })`, a discount badge styled with an inline background colour, and a JSX comment explaining the layout.
