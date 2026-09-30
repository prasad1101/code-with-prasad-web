Components should focus on presentation. Data access, business logic and shared state belong in **services**, which Angular creates and hands to whoever needs them through **dependency injection (DI)**. DI is one of Angular's defining features — it's what makes large Angular applications modular and easy to test.

## Creating a service

```bash
ng generate service products/product
```

```ts
// products/product.service.ts
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

export interface Product {
  id: string
  name: string
  price: number
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient)

  list(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products')
  }

  get(id: string): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`)
  }
}
```

`providedIn: 'root'` registers a single, app-wide instance (a singleton) that's **tree-shakable**: if nothing injects it, it's removed from the bundle.

## Injecting a service

```ts
import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ProductService } from './product.service'

@Component({
  selector: 'app-product-list',
  template: `
    @for (p of products(); track p.id) {
      <p>{{ p.name }}</p>
    }
  `,
})
export class ProductList {
  private productService = inject(ProductService)
  products = toSignal(this.productService.list(), { initialValue: [] })
}
```

The older constructor style is equivalent:

```ts
constructor(private productService: ProductService) {}
```

`inject()` works in field initialisers, constructors, factory functions, functional guards and interceptors — anywhere in an **injection context**.

## How DI works

1. A class asks for a dependency (by its class or an `InjectionToken`).
2. Angular looks for a **provider** in the current injector, then walks up the injector tree (component → parent components → environment/root injector).
3. The first provider found supplies the instance.

This hierarchy lets you control lifetime and scope.

## Provider scopes

```ts
// App-wide singleton
@Injectable({ providedIn: 'root' })
export class AuthService {}

// Registered in application config
export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(), provideRouter(routes), CartStore],
}

// Scoped to a route (and its children) — a fresh instance for that feature
export const routes: Routes = [
  { path: 'checkout', providers: [CheckoutState], loadComponent: () => import('./checkout/checkout') },
]

// Scoped to a component: each component instance gets its own service instance
@Component({ selector: 'app-wizard', providers: [WizardState], template: `…` })
export class Wizard {}
```

Component-level providers are ideal for state that belongs to one widget instance (a wizard, an editor), destroyed with the component.

## Injection tokens for non-class values

```ts
import { InjectionToken, inject } from '@angular/core'

export interface AppConfig {
  apiUrl: string
  featureFlags: Record<string, boolean>
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG')

// app.config.ts
providers: [{ provide: APP_CONFIG, useValue: { apiUrl: '/api', featureFlags: { newCheckout: true } } }]

// anywhere
const config = inject(APP_CONFIG)
```

## Provider recipes

```ts
{ provide: Logger, useClass: ConsoleLogger }               // swap implementations
{ provide: Logger, useClass: environment.production ? RemoteLogger : ConsoleLogger }
{ provide: API_URL, useValue: 'https://api.example.com' }  // a value
{ provide: Storage, useFactory: () => window.localStorage } // computed at runtime
{ provide: OldService, useExisting: NewService }           // alias
```

`useClass` swapping is exactly what makes testing easy: tests provide a fake implementation.

## Optional and self-scoped injection

```ts
const analytics = inject(Analytics, { optional: true })   // null if not provided
const local = inject(FormState, { self: true })            // only this component's injector
const parent = inject(TabGroup, { skipSelf: true })        // start from the parent
```

## Cleanup with `DestroyRef`

Services and components can register cleanup logic:

```ts
import { DestroyRef, inject } from '@angular/core'

export class LiveTicker {
  constructor() {
    const id = setInterval(() => this.refresh(), 5000)
    inject(DestroyRef).onDestroy(() => clearInterval(id))
  }
}
```

## Designing services

- **One responsibility per service**: `ProductApi` (HTTP), `CartStore` (state), `PriceCalculator` (pure logic).
- Keep HTTP details in API services; components shouldn't know URLs.
- Expose state as read-only signals or observables, with methods to change it.
- Avoid services that know about specific components or the DOM.

## Try it yourself

1. Create a `NotificationService` with a signal list of messages and `success()`, `error()` and `dismiss()` methods; render the messages in a `Toasts` component.
2. Provide an `APP_CONFIG` token and use it to build API URLs in a `ProductApi` service.
3. Give a `Stepper` component its own `StepperState` via component-level `providers` and verify two steppers on the page don't share state.
