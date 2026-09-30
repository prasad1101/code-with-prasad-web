**React** is a JavaScript library for building user interfaces from **components** — small, reusable pieces that each describe part of the UI. It's the "R" in the MERN stack and the most widely used front-end library in the world, powering apps from Facebook and Instagram to Netflix and Airbnb.

## What makes React different

- **Declarative UI** — you describe what the UI should look like for the current state; React updates the DOM to match. No manual DOM manipulation.
- **Components** — UI is composed from functions that take data (props) and return markup.
- **One-way data flow** — data flows down from parent to child; changes flow up through callbacks. This makes behaviour easy to follow.
- **Just JavaScript** — markup is written with JSX, and logic uses normal JavaScript (`map`, `if`, functions) rather than a template language.
- **A huge ecosystem** — routing, data fetching, state management, forms and UI kits from the community; full-stack frameworks like Next.js and React Router framework mode.

React focuses on the view layer; you pick libraries for the rest. That flexibility is a strength — and why this tutorial also teaches the most common companions (React Router, TanStack Query, Zustand, Redux Toolkit).

## Creating a project with Vite

```bash
npm create vite@latest shop-react -- --template react-ts
cd shop-react
npm install
npm run dev
```

Vite starts a dev server at `http://localhost:5173` with instant hot reloading. (For full-stack apps with server rendering, frameworks like Next.js or React Router framework mode are recommended — covered in the expert chapter.)

## Project structure

```text
shop-react/
  index.html          # the single HTML page with <div id="root">
  src/
    main.tsx          # mounts the React app
    App.tsx           # the root component
    index.css
  package.json
  vite.config.ts
```

`main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`StrictMode` runs extra development-only checks (for example, running effects twice) to surface bugs early.

## Your first component

```tsx
// App.tsx
import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <h1>Welcome to the shop</h1>
      <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
    </main>
  )
}
```

- A component is a **function that returns JSX**. Its name starts with a capital letter.
- `useState` gives the component **state** — when you call `setCount`, React re-renders the component with the new value.
- `onClick` attaches an event handler.

## How React updates the screen

1. Something changes state (`setCount(1)`).
2. React calls your component function again to get the new JSX (**render**).
3. React compares it with the previous result and applies the minimal DOM changes (**commit**).

Rendering is just calling functions — which is why components must be **pure**: given the same props and state, return the same JSX, without side effects during rendering.

## Developer tools

Install **React Developer Tools** for Chrome or Firefox to inspect the component tree, props, state and hooks, and to profile rendering performance.

## What you'll learn

1. JSX, components, props, state and events
2. Conditional rendering, lists and forms (including React 19 actions)
3. Effects, refs, context, reducers and custom hooks
4. Routing with React Router and data fetching with TanStack Query
5. Performance and the React Compiler, Suspense and code splitting
6. State management, testing and TypeScript with React
7. Server Components, SSR, concurrent rendering and architecture

## Try it yourself

Create a Vite React project and build a "like" button that shows a heart and a counter, toggling between liked and not-liked states and changing colour when liked.
