Tests let you refactor React code and upgrade dependencies with confidence. The modern React testing stack is **Vitest** (a fast, Vite-native test runner) plus **React Testing Library** (RTL), which encourages testing components the way users use them — by what they see and do, not by internal implementation.

## Setup

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'
```

> **Troubleshooting on newer Node.js versions:** Node 25 ships a built-in `localStorage` global that shadows jsdom's. Code that uses storage in tests (for example Zustand's `persist` middleware) then fails with `storage.setItem is not a function`. Disable Node's version for tests: `"test": "NODE_OPTIONS=--no-experimental-webstorage vitest"`.

## A first component test

```tsx
// Counter.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Counter from './Counter'

test('increments when the button is clicked', async () => {
  const user = userEvent.setup()
  render(<Counter />)

  const button = screen.getByRole('button', { name: /clicked 0 times/i })
  await user.click(button)

  expect(screen.getByRole('button', { name: /clicked 1 times/i })).toBeInTheDocument()
})
```

## Querying like a user

Prefer queries that reflect how users (and assistive technologies) find elements:

1. `getByRole('button', { name: 'Save' })` — the best default; also checks accessibility.
2. `getByLabelText('Email')` — form fields.
3. `getByPlaceholderText`, `getByText`, `getByDisplayValue`.
4. `getByTestId` — last resort.

Query variants:

| Variant | When nothing matches | Use for |
| --- | --- | --- |
| `getBy…` | Throws | Elements that must be present |
| `queryBy…` | Returns `null` | Asserting absence: `expect(queryByText('Error')).not.toBeInTheDocument()` |
| `findBy…` | Waits (async), then throws | Elements that appear later (after fetches) |

If an element is hard to query by role or label, that's often an accessibility bug in the component.

## Interacting with `user-event`

```tsx
const user = userEvent.setup()
await user.type(screen.getByLabelText('Email'), 'asha@example.com')
await user.selectOptions(screen.getByLabelText('Country'), 'IN')
await user.click(screen.getByRole('checkbox', { name: /accept terms/i }))
await user.keyboard('{Enter}')
```

`user-event` simulates full interactions (focus, key events, input events) more realistically than firing single events.

## Testing a form end to end

```tsx
test('shows a validation error and submits valid data', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<SignupForm onSubmit={onSubmit} />)

  await user.click(screen.getByRole('button', { name: /create account/i }))
  expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()

  await user.type(screen.getByLabelText(/email/i), 'asha@example.com')
  await user.type(screen.getByLabelText(/password/i), 'a-very-long-password')
  await user.click(screen.getByRole('button', { name: /create account/i }))

  expect(onSubmit).toHaveBeenCalledWith({ email: 'asha@example.com', password: 'a-very-long-password' })
})
```

## Mocking network requests

Mock at the network level with **MSW** (Mock Service Worker), so components use their real fetching code:

```ts
// src/test/server.ts
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const server = setupServer(
  http.get('/api/products', () => HttpResponse.json([{ id: 'p1', name: 'Mouse', price: 799 }])),
)
// setup.ts: beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
```

```tsx
test('renders products from the API', async () => {
  renderWithProviders(<ProductList category="all" />)
  expect(await screen.findByText('Mouse')).toBeInTheDocument()
})

test('shows an error when the API fails', async () => {
  server.use(http.get('/api/products', () => new HttpResponse(null, { status: 500 })))
  renderWithProviders(<ProductList category="all" />)
  expect(await screen.findByRole('alert')).toHaveTextContent(/error/i)
})
```

## Rendering with providers

Components that need a router, query client or store should be rendered with them. Create a helper:

```tsx
export function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}
```

A fresh `QueryClient` per test prevents cached data leaking between tests; `retry: false` makes error tests fast.

## Testing hooks and logic

- Pure functions and reducers: plain unit tests (fastest).
- Custom hooks: `renderHook` (see the custom hooks lesson).
- Stores (Zustand/Redux): test actions and selectors directly.

## Snapshot tests

Snapshots (`toMatchSnapshot`) catch unintended markup changes but tend to be approved without review. Prefer explicit assertions about behaviour; use small inline snapshots sparingly.

## End-to-end tests

Use **Playwright** (or Cypress) for a handful of critical user journeys in a real browser against a running app: sign up, search, add to cart, checkout. Component tests catch most bugs faster; E2E tests prove the pieces work together.

## What good tests look like

- Test **behaviour users care about**, not implementation (no testing of internal state or private functions).
- One clear reason to fail per test; descriptive names.
- Cover loading, empty, error and success states.
- Fast and deterministic: mock the network, not your own modules.

## Try it yourself

Write tests for a product search page: typing filters results (MSW-mocked API), an empty state appears for no matches, an error message appears when the API fails, and clicking "Add to cart" updates a cart badge (Zustand store). Then add one Playwright test for the whole flow.
