The Angular **Router** maps URLs to components, turning your app into a multi-page experience without full page reloads. It supports parameters, nested layouts, lazy loading, guards and data resolution.

## Defining routes

```ts
// app.routes.ts
import { Routes } from '@angular/router'
import { Home } from './home/home'
import { NotFound } from './not-found/not-found'

export const routes: Routes = [
  { path: '', component: Home, title: 'Home' },
  { path: 'products', loadComponent: () => import('./products/product-list').then((m) => m.ProductList), title: 'Products' },
  { path: 'products/:id', loadComponent: () => import('./products/product-detail').then((m) => m.ProductDetail) },
  { path: 'old-shop', redirectTo: 'products', pathMatch: 'full' },
  { path: '**', component: NotFound, title: 'Page not found' },
]
```

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withComponentInputBinding())],
}
```

- Routes are matched **in order**; the wildcard `**` must be last.
- `loadComponent` **lazy-loads** a component — its code is downloaded only when the route is visited.
- `title` sets the browser tab title.

## The outlet and links

```ts
import { Component } from '@angular/core'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
      <a routerLink="/products" routerLinkActive="active">Products</a>
    </nav>
    <main><router-outlet /></main>
  `,
})
export class App {}
```

Always use `routerLink` rather than `href` for internal links — `href` reloads the whole app.

## Route parameters

With `withComponentInputBinding()`, route parameters, query parameters and route data are bound directly to component **inputs** with the same name:

```ts
import { Component, input } from '@angular/core'

@Component({ selector: 'app-product-detail', template: `<h1>Product {{ id() }}</h1>` })
export class ProductDetail {
  id = input.required<string>()       // from /products/:id
  tab = input<string>()               // from ?tab=reviews
}
```

The older way uses `ActivatedRoute`:

```ts
private route = inject(ActivatedRoute)
id$ = this.route.paramMap.pipe(map((p) => p.get('id')!))
```

Note that when navigating from `/products/1` to `/products/2`, Angular **reuses** the component — so react to parameter changes (signals and observables do this naturally; reading the snapshot once in `ngOnInit` does not).

## Navigating from code

```ts
private router = inject(Router)

goToProduct(id: string) {
  this.router.navigate(['/products', id], { queryParams: { tab: 'reviews' } })
}
```

## Child routes and layouts

```ts
export const routes: Routes = [
  {
    path: 'account',
    loadComponent: () => import('./account/account-layout').then((m) => m.AccountLayout),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', loadComponent: () => import('./account/profile').then((m) => m.Profile) },
      { path: 'orders', loadComponent: () => import('./account/orders').then((m) => m.Orders) },
    ],
  },
]
```

`AccountLayout` contains its own `<router-outlet />` where the child routes render.

## Lazy-loading groups of routes

```ts
{ path: 'admin', loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES) }
```

Each feature area ships as its own bundle, keeping the initial download small.

## Guards

Functional guards decide whether navigation may proceed:

```ts
// auth.guard.ts
import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from './auth.service'

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService)
  const router = inject(Router)
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
}

export const adminGuard: CanActivateFn = () => inject(AuthService).hasRole('admin')
```

```ts
{ path: 'account', canActivate: [authGuard], loadChildren: … }
{ path: 'admin', canMatch: [adminGuard], loadChildren: … }
```

- `canActivate` — may this route be activated?
- `canMatch` — should this route even match? (Prevents downloading lazy code for users who can't access it.)
- `canDeactivate` — may the user leave? (Unsaved changes prompts.)

Guards are a UX convenience — the **server** must still enforce authorisation.

## Resolvers

Load data before a route activates:

```ts
export const productResolver: ResolveFn<Product> = (route) =>
  inject(ProductService).get(route.paramMap.get('id')!)

{ path: 'products/:id', resolve: { product: productResolver }, loadComponent: … }
```

With component input binding, the resolved value arrives as the `product` input. Resolvers delay navigation until data arrives; many apps prefer navigating immediately and showing a loading state instead.

## Try it yourself

Build a small shop: `/products` (list), `/products/:id` (detail with a `tab` query parameter), `/account` with child routes guarded by an `authGuard`, a lazy-loaded `/admin` area protected with `canMatch`, and a 404 page. Verify in the browser's network panel that admin code is only downloaded for admins.
