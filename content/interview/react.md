## What is React and what problems does it solve?
Level: Beginner | Tags: basics

React is a JavaScript library for building user interfaces from components. It solves:

- **Keeping the UI in sync with data** — you declare what the UI looks like for a given state; React updates the DOM efficiently when state changes.
- **Reusability** — UI is composed from self-contained components.
- **Predictability** — one-way data flow and pure rendering make behaviour easier to reason about.

It focuses on the view layer; routing, data fetching and state management come from libraries or frameworks (Next.js, React Router).

## What is JSX?
Level: Beginner | Tags: jsx

JSX is a syntax extension that lets you write HTML-like markup in JavaScript. It compiles to function calls (`jsx('div', props)`) that create objects describing the UI. Rules: one root element (or Fragment), close all tags, camelCase attributes (`className`, `htmlFor`, `onClick`), and `{ }` for JavaScript expressions. Values in `{ }` are escaped, which protects against XSS.

## What is the virtual DOM and how does reconciliation work?
Level: Intermediate | Tags: rendering, internals

When state changes, React re-runs components to produce a new tree of elements (the "virtual DOM"), compares it with the previous tree (**reconciliation/diffing**), and applies only the necessary changes to the real DOM (**commit**).

Heuristics that make diffing fast:

- Elements of different types produce different trees (the old subtree is replaced).
- Elements of the same type are updated in place (props changed).
- Children in lists are matched by `key`.

React's Fiber architecture lets this work be split, prioritised and interrupted (concurrent rendering).

## Why are keys important in lists? Why not use the index?
Level: Beginner | Tags: lists, rendering

Keys identify list items between renders so React can match, move, insert and remove the right elements and keep each item's state (inputs, focus, component state) attached to it.

Using the array **index** breaks when items are inserted, removed or reordered: indexes shift, so state ends up attached to the wrong item and more DOM is re-rendered. Use stable unique ids from the data. Random keys are worse — they remount every item on every render.

## What is the difference between props and state?
Level: Beginner | Tags: props, state

- **Props** are inputs passed from a parent; read-only in the child.
- **State** is data owned by a component that changes over time; updating it re-renders the component.

Data flows down via props; changes flow up via callback props. If two components need the same state, lift it to their common parent.

## Explain the rules of hooks.
Level: Beginner | Tags: hooks

1. Call hooks only at the **top level** of a component or custom hook — not in conditions, loops or nested functions.
2. Call hooks only from **React function components or custom hooks**.

React identifies each hook by its call order; conditional calls would shift the order between renders and mix up state. The `eslint-plugin-react-hooks` rules enforce this. (The `use` API is the exception: it can be called conditionally.)

## Why doesn't state update immediately after calling the setter?
Level: Intermediate | Tags: state

State setters **schedule** a re-render; the variable in the current render is a snapshot and keeps its value. React also **batches** multiple updates within the same event into one render.

```tsx
setCount(count + 1)
setCount(count + 1) // count still 1 after both
```

When the new value depends on the old one, use an updater function: `setCount(c => c + 1)`. To react to the new value, compute it during render or use it in the next render.

## What does `useEffect` do and what is the dependency array?
Level: Intermediate | Tags: effects, hooks

`useEffect` synchronises a component with an external system (subscriptions, timers, DOM APIs, network) after render. It can return a **cleanup** function that runs before the next effect and on unmount.

The dependency array controls re-runs: omitted → every render; `[]` → once after mount; `[a, b]` → when `a` or `b` change. All reactive values used inside must be listed (the lint rule enforces this). In development, StrictMode runs effects twice to expose missing cleanup.

## When should you NOT use `useEffect`?
Level: Intermediate | Tags: effects, best-practices

- **Deriving data** from props/state — compute during render (or `useMemo`).
- **Handling user events** — do it in the event handler.
- **Resetting state when a prop changes** — use a `key`.
- **Chains of effects updating state** — combine into one event handler or reducer.
- **Fetching data** in complex apps — use TanStack Query or framework loaders (effects work but need race-condition handling and lack caching).

Effects are for synchronising with things outside React.

## What is the difference between `useMemo`, `useCallback` and `memo`?
Level: Intermediate | Tags: performance

- `useMemo(fn, deps)` caches a **computed value** between renders.
- `useCallback(fn, deps)` caches a **function reference** (equivalent to `useMemo(() => fn, deps)`).
- `memo(Component)` skips re-rendering a component when its props are shallowly equal.

They work together: `memo` only helps if props are stable, which often requires `useCallback`/`useMemo`. Use them for measured problems; the **React Compiler** applies this memoisation automatically.

## What is the React Compiler?
Level: Advanced | Tags: performance, compiler

A build-time compiler that automatically memoises components and values, so components re-render and recompute only when their inputs change — removing most manual `memo`, `useMemo` and `useCallback`. It relies on code following the Rules of React (purity, immutability, hook rules); the React hooks ESLint rules flag code it can't optimise. It's enabled through a Babel plugin or framework configuration.

## What is context and when should you use it?
Level: Intermediate | Tags: context

Context passes a value to an entire subtree without prop drilling: `createContext`, a provider (`<Ctx value={…}>`), and consumers reading with `use(Ctx)`/`useContext(Ctx)`.

Good for low-frequency global values: theme, locale, auth user, feature flags, dependency injection, compound components. Caveat: every consumer re-renders when the value changes — memoise the value and split contexts by update frequency. For frequently changing shared state, use a store with selectors (Zustand, Redux).

## What is `useReducer` and when is it preferable to `useState`?
Level: Intermediate | Tags: state, reducers

`useReducer(reducer, initialState)` manages state through a pure function `(state, action) => newState` and a `dispatch` function. Prefer it when state has several related fields, many update events, or complex transitions — it centralises logic, is easy to unit test, and `dispatch` has a stable identity.

## What are custom hooks?
Level: Intermediate | Tags: hooks

Functions starting with `use` that call other hooks to encapsulate reusable stateful logic: `useLocalStorage`, `useDebouncedValue`, `useMediaQuery`, `useOnlineStatus`. Each component using a custom hook gets its own state — hooks share logic, not state. They're the main unit of code reuse in React (libraries expose features as hooks).

## What are controlled and uncontrolled components?
Level: Beginner | Tags: forms

- **Controlled** — the input's value is driven by React state (`value` + `onChange`). Good for live validation, formatting and dependent fields.
- **Uncontrolled** — the DOM keeps the value; you read it via `FormData` on submit or a ref (`defaultValue` sets the initial value). Simpler for basic forms.

React 19 form `action`s with `FormData` make uncontrolled forms more convenient.

## What are React 19 Actions (`useActionState`, `useFormStatus`, `useOptimistic`)?
Level: Advanced | Tags: forms, react19

- A form's `action` prop can be a (possibly async) function receiving `FormData`; React handles pending state and resets the form on success.
- `useActionState(action, initial)` returns `[state, wrappedAction, isPending]`, keeping the last result (errors, success).
- `useFormStatus()` (from `react-dom`) lets child components read the parent form's pending status.
- `useOptimistic(state, updateFn)` shows an optimistic value while an async action runs, reverting automatically when it settles.

They're built on async transitions and work with Server Functions.

## What are refs used for?
Level: Intermediate | Tags: refs

`useRef` holds a mutable value that persists across renders without causing re-renders, and gives access to DOM nodes via the `ref` attribute. Uses: focus/scroll/measure, media control, storing timer ids or previous values, integrating non-React libraries. In React 19, `ref` is a normal prop for function components (no `forwardRef` needed), and callback refs can return cleanup functions. Don't read or write refs during render.

## How do you optimise a slow React application?
Level: Advanced | Tags: performance

1. Profile with React DevTools (which components render, why, how long).
2. Move state down / pass components as `children` to limit re-render scope.
3. Enable the React Compiler or memoise (`memo`, `useMemo`, `useCallback`) hot paths.
4. Narrow and memoise context values; use stores with selectors for frequent updates.
5. Virtualise long lists; use stable keys.
6. `useTransition`/`useDeferredValue` to keep input responsive.
7. Code-split routes and heavy components; analyse bundles; optimise images.
8. SSR/SSG for content pages.

## What is Suspense?
Level: Intermediate | Tags: suspense

`<Suspense fallback={…}>` shows a fallback while components inside are waiting — for lazily loaded code (`lazy`) or data (`use(promise)`, `useSuspenseQuery`, framework loaders, Server Components). Nested boundaries let independent sections load and stream separately. Pair them with error boundaries to handle failures, and use transitions to avoid hiding already-visible content.

## What are error boundaries?
Level: Intermediate | Tags: errors

Components that catch errors thrown during rendering of their subtree and render a fallback UI instead of crashing the whole app. They're class components (`getDerivedStateFromError`, `componentDidCatch`) or created with `react-error-boundary`. They don't catch errors in event handlers, async code outside rendering, or the boundary itself — use `try/catch` there. Place them around routes and independent widgets, with retry actions.

## Explain `useTransition` and `useDeferredValue`.
Level: Advanced | Tags: concurrency

Both use concurrent rendering to prioritise urgent updates (typing, clicking) over expensive ones.

- `useTransition` → `[isPending, startTransition]`; updates inside `startTransition` are non-urgent and interruptible. Also keeps visible content on screen instead of showing Suspense fallbacks. Async transitions power Actions.
- `useDeferredValue(value)` returns a lagging copy of a value; components using it (memoised) re-render in the background.

Use `useTransition` when you control the state update, `useDeferredValue` when you receive the value.

## What are React Server Components?
Level: Expert | Tags: rsc, ssr

Components that run only on the server (in frameworks like Next.js App Router). They can be `async`, access databases/secrets directly, and ship no JavaScript to the client — only their rendered output. Interactive parts are Client Components marked with `'use client'`, which are pre-rendered and hydrated. Props across the boundary must be serialisable; Client Components can receive Server Components as `children`. Server Functions (`'use server'`) let clients call server code, typically as form actions — they must be authenticated and validated like any endpoint.

## What is the difference between SSR, SSG and CSR?
Level: Intermediate | Tags: ssr, rendering

- **CSR** — the browser downloads JS and renders; simple hosting, slower first paint, weaker SEO.
- **SSR** — HTML rendered per request on the server, then hydrated; fast first paint, personalised content, needs a server.
- **SSG** — HTML generated at build time; fastest and cacheable on a CDN, for content that changes rarely (with revalidation for periodic refresh).

Frameworks mix these per route; streaming SSR sends HTML progressively with Suspense.

## What is hydration and what causes hydration errors?
Level: Advanced | Tags: ssr, hydration

Hydration attaches React's event handlers and state to server-rendered HTML instead of recreating the DOM. It requires the client's first render to match the server HTML.

Mismatches come from rendering different content on server and client: `Date.now()`/random values, reading `window`/`localStorage` during render, locale/timezone differences, invalid HTML nesting, or browser extensions modifying the DOM. Fix by moving browser-only logic into effects, passing consistent data from the server, or (sparingly) `suppressHydrationWarning` for known differences like timestamps.

## How do you manage state in a large React application?
Level: Advanced | Tags: state-management

Categorise it:

- Local UI state → `useState`/`useReducer`.
- Shared nearby → lift state up.
- Low-frequency global → context.
- **Server state → TanStack Query / framework loaders** (caching, invalidation) — not copied into client stores.
- URL state (filters, pagination) → router search params.
- Frequently changing global client state → Zustand or Redux Toolkit with selectors.

Derive rather than duplicate, keep updates immutable, and colocate feature state.

## Compare Redux Toolkit and Zustand.
Level: Advanced | Tags: state-management

- **Zustand** — minimal API, a store is a hook, selector subscriptions, no provider, middleware for persistence/devtools. Great for small–medium apps and focused stores.
- **Redux Toolkit** — the official modern Redux: slices, Immer-powered reducers, excellent DevTools/time-travel, listener middleware, RTK Query for data fetching; more structure and conventions, suited to large teams and complex event flows.

Both use selectors to limit re-renders; most server data belongs in a server-state library either way.

## How do you fetch data in React properly?
Level: Intermediate | Tags: data-fetching

- Simple cases: `useEffect` with an `AbortController` cleanup to avoid race conditions, plus loading/error state.
- Real apps: **TanStack Query** (`useQuery`, `useMutation`) for caching, deduplication, retries, background refetch, pagination and invalidation; or framework loaders/Server Components.
- Avoid waterfalls (fetch in parallel, hoist fetching to routes), validate responses, and keep query keys consistent.

## How do you test React components?
Level: Intermediate | Tags: testing

Use Vitest/Jest with **React Testing Library**: render components, query by role/label/text like a user, interact with `user-event`, and assert on visible output. Mock the network with MSW rather than internal modules; wrap components with needed providers (router, query client with `retry: false`). Test hooks with `renderHook`, reducers/stores as plain functions, and cover a few critical journeys with Playwright E2E tests.

## What is StrictMode?
Level: Beginner | Tags: basics

A development-only wrapper that helps find bugs: it double-invokes component functions, initialisers and reducers (to reveal impure rendering) and mounts/unmounts/remounts components (to reveal missing effect cleanup), and warns about deprecated APIs. It has no effect in production builds.

## How does React prevent XSS, and where can XSS still happen?
Level: Intermediate | Tags: security

JSX escapes values rendered with `{ }`, so strings can't inject HTML. XSS can still happen via:

- `dangerouslySetInnerHTML` with unsanitised content (sanitise with DOMPurify),
- `javascript:` URLs in `href`/`src` from user input (validate protocols),
- direct DOM manipulation through refs,
- server-rendered data embedded unsafely into HTML,
- vulnerable third-party components.

Add a Content Security Policy as defence in depth.

## What are higher-order components and render props? Are they still used?
Level: Intermediate | Tags: patterns

- **HOC** — a function taking a component and returning an enhanced component (`withAuth(Page)`).
- **Render props** — a component that takes a function prop to render (`<DataFetcher render={data => …} />`).

Both share logic between components. **Custom hooks** replaced most uses because they're simpler and avoid wrapper nesting. You still meet them in older code and some libraries (e.g. render props for virtualisation or animation libraries).

## What is prop drilling and how do you avoid it?
Level: Beginner | Tags: props, context

Passing props through intermediate components that don't use them just to reach a deep child. Solutions: component composition (pass elements as `children`/slots so intermediaries don't need the data), context for global-ish values, or a state store. A little drilling (2–3 levels) is fine and keeps data flow explicit.

## What are portals?
Level: Intermediate | Tags: dom

`createPortal(children, domNode)` renders children into a different DOM node (e.g. `document.body`) while keeping them in the same React tree (context and event bubbling still work). Used for modals, tooltips, dropdowns and toasts that must escape parent `overflow: hidden` or stacking contexts. Remember focus management and accessibility for dialogs (or use the native `<dialog>` element).

## How would you structure a large React codebase?
Level: Expert | Tags: architecture

Feature-based folders (`features/<name>/{api,components,hooks,routes}` with a public `index.ts`), a `shared/ui` design system, and an `app/` shell for providers and routing. Separate data access (query options), logic (hooks) and presentation (props-in/events-out components). Enforce import boundaries with lint rules, keep server state in a query cache, use error boundaries per route/widget, TypeScript strict, and quality gates (tests, lint, bundle budgets) in CI. Consider micro frontends only when independent deployment across teams is essential.
