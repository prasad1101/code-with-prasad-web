Tests let a team change a large Angular codebase with confidence. Angular has first-class testing support: the CLI generates spec files, and `TestBed` creates components and services with dependency injection just like the real app.

## Test runners

`ng test` runs unit tests. Recent Angular versions use **Vitest** as the default test runner for new projects (older projects use Karma + Jasmine; Jest is also common). The Angular testing APIs — `TestBed`, `ComponentFixture`, HTTP testing — are the same regardless of the runner. Examples below use Vitest/Jasmine-compatible syntax (`describe`, `it`, `expect`).

## Testing pure logic and services

Pure functions and services without dependencies need no Angular setup at all:

```ts
import { describe, expect, it } from 'vitest'
import { calculateShipping } from './shipping'

describe('calculateShipping', () => {
  it('is free above ₹999', () => expect(calculateShipping(1200)).toBe(0))
  it('charges ₹49 otherwise', () => expect(calculateShipping(500)).toBe(49))
})
```

Services with dependencies use `TestBed`:

```ts
import { TestBed } from '@angular/core/testing'
import { CartStore } from './cart.store'

describe('CartStore', () => {
  let store: CartStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(CartStore)
  })

  it('increments quantity when adding the same product twice', () => {
    const mouse = { id: 'p1', name: 'Mouse', price: 799 }
    store.add(mouse)
    store.add(mouse)
    expect(store.count()).toBe(2)
    expect(store.total()).toBe(1598)
  })
})
```

## Testing components

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ProductCard } from './product-card'

describe('ProductCard', () => {
  let fixture: ComponentFixture<ProductCard>

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProductCard] }).compileComponents()
    fixture = TestBed.createComponent(ProductCard)
    fixture.componentRef.setInput('product', { id: 'p1', name: 'Mouse', price: 799, stock: 3 })
    await fixture.whenStable()
  })

  it('shows the product name', () => {
    const el: HTMLElement = fixture.nativeElement
    expect(el.querySelector('h3')?.textContent).toContain('Mouse')
  })

  it('warns when stock is low', () => {
    expect(fixture.nativeElement.textContent).toContain('Only 3 left')
  })

  it('emits addToCart when the button is clicked', () => {
    let emitted: unknown
    fixture.componentInstance.addToCart.subscribe((p) => (emitted = p))
    fixture.nativeElement.querySelector('button').click()
    expect(emitted).toEqual(expect.objectContaining({ id: 'p1' }))
  })
})
```

Key APIs:

- `fixture.componentRef.setInput(name, value)` — set inputs (works with signal inputs).
- `await fixture.whenStable()` / `fixture.detectChanges()` — let Angular update the view.
- Query the **rendered DOM**, and interact like a user (click, type) rather than calling private methods.

## Replacing dependencies

Provide fakes for services a component depends on:

```ts
await TestBed.configureTestingModule({
  imports: [CheckoutPage],
  providers: [
    { provide: CartStore, useValue: { items: signal([]), total: signal(0), checkout: vi.fn() } },
    provideRouter([]),
  ],
}).compileComponents()
```

## Testing HTTP

```ts
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
})

it('loads products', () => {
  const api = TestBed.inject(ProductApi)
  const http = TestBed.inject(HttpTestingController)

  let count = 0
  api.list().subscribe((page) => (count = page.items.length))

  const req = http.expectOne((r) => r.url === '/api/products')
  expect(req.request.params.get('page')).toBe('1')
  req.flush({ items: [{ id: 'p1', name: 'Mouse', price: 799 }], total: 1 })

  expect(count).toBe(1)
  http.verify() // no unexpected requests
})
```

## Testing with the router

```ts
import { RouterTestingHarness } from '@angular/router/testing'

it('shows the product page for /products/:id', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter(routes), /* fakes */] })
  const harness = await RouterTestingHarness.create()
  await harness.navigateByUrl('/products/p1')
  expect(harness.routeNativeElement?.textContent).toContain('Mouse')
})
```

## Component harnesses

Angular CDK **component harnesses** give tests a stable API for interacting with components (including Angular Material's), independent of their internal DOM structure — tests don't break when markup changes.

```ts
const loader = TestbedHarnessEnvironment.loader(fixture)
const button = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))
await button.click()
```

## End-to-end tests

Unit and component tests don't prove the whole app works in a real browser against a real (or realistic) back end. Use **Playwright** or **Cypress** for a small set of critical journeys: login, search, add to cart, checkout.

## What to test

- Business logic in services and stores (fast, many tests).
- Components' rendered output, inputs, outputs and user interactions.
- Guards, interceptors, pipes and validators.
- Error and empty states — not just the happy path.
- A few E2E flows for the most important user journeys.

## Try it yourself

Write tests for: the `CartStore` (add, remove, totals), a `ProductCard` (renders data, low-stock warning, emits `addToCart`), an auth guard (redirects anonymous users to `/login` with a `returnUrl`), and a `ProductApi.list()` call using `HttpTestingController`.
