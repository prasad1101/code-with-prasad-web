Passing props through many layers of components that don't use them ("prop drilling") gets tedious. **Context** lets a parent make a value available to its entire subtree, so any descendant can read it directly.

## Creating and using context

```tsx
import { createContext, use, useState } from 'react'

type Theme = 'light' | 'dark'
type ThemeContextValue = { theme: Theme; toggle: () => void }

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>
}

export function useTheme() {
  const ctx = use(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
```

```tsx
function App() {
  return (
    <ThemeProvider>
      <Header />
      <Main />
    </ThemeProvider>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return <button onClick={toggle}>{theme === 'light' ? '🌙' : '☀️'}</button>
}
```

Notes:

- In React 19, `<ThemeContext value={…}>` renders the provider directly (older code uses `<ThemeContext.Provider value={…}>`).
- `use(Context)` reads the value; `useContext(Context)` does the same (and is what you'll see in older code). Unlike other hooks, `use` can be called inside conditions.
- Exporting a custom hook (`useTheme`) hides the context object and gives a clear error when the provider is missing.

## Good uses for context

- Theme, locale and user preferences
- The authenticated user and permissions
- Feature flags and configuration
- Dependencies for a subtree (an API client, an analytics tracker)
- Compound components sharing state (tabs, accordions, forms)

## Context and re-renders

When the provider's `value` changes, **every component that reads that context re-renders**. Two things to watch:

**1. Don't create a new value object on every render unnecessarily.** In the example above, `{ theme, toggle }` is recreated on every `ThemeProvider` render, re-rendering all consumers even when `theme` didn't change. Memoise it (or let the React Compiler do it):

```tsx
const value = useMemo(() => ({ theme, toggle }), [theme])
```

**2. Split contexts by how often they change.** Putting fast-changing state (like mouse position or a text input) in the same context as slow-changing state re-renders everything:

```tsx
<AuthContext value={auth}>              {/* changes rarely */}
  <CartContext value={cart}>            {/* changes often */}
    {children}
  </CartContext>
</AuthContext>
```

Context is great for **low-frequency** global values. For frequently updated shared state, a state-management library with selective subscriptions (Zustand, Redux) avoids unnecessary renders.

## Combining context with a reducer

A common pattern for feature-level state:

```tsx
const CartContext = createContext<{ state: CartState; dispatch: React.Dispatch<CartAction> } | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  return <CartContext value={{ state, dispatch }}>{children}</CartContext>
}
```

(The reducers lesson covers `useReducer`.)

## Compound components

Context lets related components share implicit state, producing expressive APIs:

```tsx
const TabsContext = createContext<{ active: string; setActive: (id: string) => void } | null>(null)

function Tabs({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) {
  const [active, setActive] = useState(defaultTab)
  return <TabsContext value={{ active, setActive }}><div className="tabs">{children}</div></TabsContext>
}

function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = use(TabsContext)!
  return (
    <button role="tab" aria-selected={ctx.active === id} onClick={() => ctx.setActive(id)}>
      {children}
    </button>
  )
}

function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = use(TabsContext)!
  return ctx.active === id ? <div role="tabpanel">{children}</div> : null
}

<Tabs defaultTab="details">
  <Tab id="details">Details</Tab>
  <Tab id="reviews">Reviews</Tab>
  <TabPanel id="details">…</TabPanel>
  <TabPanel id="reviews">…</TabPanel>
</Tabs>
```

## Before reaching for context

- Is prop drilling only two or three levels deep? Passing props is simpler and more explicit.
- Can you restructure with **composition** — passing components as `children` — so intermediate components don't need the data at all?

```tsx
// Instead of drilling `user` through Layout → Sidebar → UserMenu:
<Layout sidebar={<UserMenu user={user} />} />
```

## Try it yourself

Create an `AuthProvider` exposing `user`, `login(email)` and `logout()` with a `useAuth` hook, a `RequireAuth` component that shows a login prompt when no user is present, and a `LocaleProvider` that formats prices differently for `en-IN` and `en-US`. Make sure the auth value is memoised.
