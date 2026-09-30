Almost every Angular app talks to a back end. Angular's `HttpClient` provides typed requests, interceptors for cross-cutting concerns, testing utilities and — with `httpResource` — signal-based data loading.

## Setup

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { authInterceptor } from './core/auth.interceptor'

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withFetch(), withInterceptors([authInterceptor]))],
}
```

`withFetch()` uses the browser's `fetch` API (recommended, and required for good server-side rendering support).

## Making requests

```ts
import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'

export interface Product { id: string; name: string; price: number }
export interface Page<T> { items: T[]; total: number }

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private http = inject(HttpClient)
  private base = '/api/products'

  list(page = 1, category?: string) {
    let params = new HttpParams().set('page', page).set('limit', 20)
    if (category) params = params.set('category', category)
    return this.http.get<Page<Product>>(this.base, { params })
  }

  get(id: string) {
    return this.http.get<Product>(`${this.base}/${id}`)
  }

  create(body: Omit<Product, 'id'>) {
    return this.http.post<Product>(this.base, body)
  }

  update(id: string, changes: Partial<Product>) {
    return this.http.patch<Product>(`${this.base}/${id}`, changes)
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`)
  }
}
```

HTTP methods return **cold Observables**: nothing is sent until something subscribes, and each subscription sends a new request. The generic type (`get<Product>`) is an assertion — it doesn't validate the response (validate untrusted APIs at runtime; see the TypeScript course).

## Consuming data in components

### With `httpResource` (signals)

```ts
import { Component, input } from '@angular/core'
import { httpResource } from '@angular/common/http'

@Component({
  selector: 'app-product-detail',
  template: `
    @if (product.isLoading()) {
      <app-spinner />
    } @else if (product.error()) {
      <p role="alert">Could not load the product.</p>
    } @else if (product.hasValue()) {
      <h1>{{ product.value().name }}</h1>
    }
  `,
})
export class ProductDetail {
  id = input.required<string>()
  product = httpResource<Product>(() => `/api/products/${this.id()}`)
}
```

The request re-runs automatically whenever `id()` changes, and the previous request is cancelled. `httpResource` still goes through `HttpClient`, so interceptors apply.

### With Observables

```ts
products = toSignal(this.api.list(), { initialValue: { items: [], total: 0 } })

// or in the template with the async pipe
products$ = this.api.list()
```

Use `httpResource` for reading data into components; use `HttpClient` methods directly for mutations (POST/PATCH/DELETE) triggered by user actions:

```ts
async save(changes: Partial<Product>) {
  this.saving.set(true)
  try {
    await firstValueFrom(this.api.update(this.id(), changes))
    this.product.reload()
  } finally {
    this.saving.set(false)
  }
}
```

## Error handling

```ts
import { HttpErrorResponse } from '@angular/common/http'
import { catchError, retry, throwError, timer } from 'rxjs'

this.http.get<Product[]>('/api/products').pipe(
  retry({ count: 2, delay: (_, attempt) => timer(attempt * 500) }), // retry transient failures
  catchError((err: HttpErrorResponse) => {
    if (err.status === 0) return throwError(() => new Error('Network error — check your connection'))
    if (err.status === 404) return throwError(() => new Error('Not found'))
    return throwError(() => new Error(err.error?.error?.message ?? 'Something went wrong'))
  }),
)
```

`status === 0` means the request never reached the server (offline, CORS, DNS).

## Interceptors

Interceptors run for every request — the place for auth headers, logging, error handling and loading indicators:

```ts
// core/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthService } from './auth.service'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).accessToken()
  if (!token || !req.url.startsWith('/api')) return next(req)
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
}
```

Requests are immutable — use `clone` to modify them. Only attach tokens to **your own** API URLs.

A global error interceptor:

```ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router)
  const toasts = inject(NotificationService)
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) router.navigate(['/login'])
      else if (err.status >= 500) toasts.error('Server error — please try again')
      return throwError(() => err)
    }),
  )
}
```

Interceptors run in the order they're listed in `withInterceptors([...])`.

## Cancelling requests

Unsubscribing cancels an in-flight request. That's why `switchMap` is perfect for search boxes — each new query cancels the previous request (see the RxJS lesson). `httpResource` cancels automatically when its URL changes.

## Environment-specific URLs

Keep the API base URL in configuration (an `InjectionToken` or environment file) rather than hard-coding hosts; during development, use the CLI's proxy (`proxy.conf.json`) to forward `/api` to your local back end and avoid CORS issues.

## Testing HTTP code

```ts
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'

it('loads a product', () => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
  const api = TestBed.inject(ProductApi)
  const http = TestBed.inject(HttpTestingController)

  let result: Product | undefined
  api.get('p1').subscribe((p) => (result = p))

  http.expectOne('/api/products/p1').flush({ id: 'p1', name: 'Mouse', price: 799 })
  expect(result?.name).toBe('Mouse')
  http.verify()
})
```

## Try it yourself

Build a product admin page: a paginated list loaded with `httpResource` driven by `page` and `category` signals, a create/edit form that calls `POST`/`PATCH` and reloads the list, an auth interceptor, and an error interceptor that shows toast notifications.
