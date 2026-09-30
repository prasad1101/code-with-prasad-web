## What is Angular and how does it differ from AngularJS and React?
Level: Beginner | Tags: basics

**Angular** (v2+) is a TypeScript-based, full-featured framework: components, routing, forms, HTTP, dependency injection, testing and a CLI, all integrated.

- **vs. AngularJS (1.x)** — a complete rewrite: component-based instead of controllers/`$scope`, TypeScript, AOT compilation, far better performance and tooling. AngularJS reached end of life in 2022.
- **vs. React** — React is a UI library; routing, forms, data fetching and state come from third-party choices. Angular is opinionated and batteries-included, which gives consistency across large teams at the cost of a steeper learning curve.

## What are standalone components?
Level: Beginner | Tags: components

Components (and directives/pipes) that declare their own dependencies in an `imports` array instead of belonging to an `NgModule`:

```ts
@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  template: `…`,
})
export class ProductCard {}
```

They're the default in modern Angular. Benefits: less boilerplate, clearer dependencies per component, easier lazy loading (`loadComponent`) and better tree-shaking. NgModules still work for existing code, and the CLI can migrate projects to standalone.

## Explain the different types of data binding.
Level: Beginner | Tags: templates

- **Interpolation** `{{ value }}` — component → view, as text.
- **Property binding** `[prop]="expr"` — component → DOM property or component input.
- **Event binding** `(event)="handler($event)"` — view → component.
- **Two-way binding** `[(ngModel)]="value"` or `[(value)]` with `model()` — both directions (a property binding plus an event binding).

Also attribute (`[attr.aria-label]`), class (`[class.active]`) and style (`[style.width.px]`) bindings.

## What are lifecycle hooks? Name the important ones.
Level: Beginner | Tags: components, lifecycle

Methods Angular calls at specific moments:

- `ngOnChanges` — when inputs change (receives a `SimpleChanges` map).
- `ngOnInit` — once, after the first input values are set; good for initialisation.
- `ngDoCheck` — on every change detection run (rarely needed).
- `ngAfterContentInit` / `ngAfterContentChecked` — after projected content is initialised/checked.
- `ngAfterViewInit` / `ngAfterViewChecked` — after the component's view and child views.
- `ngOnDestroy` — before removal; clean up.

Modern alternatives: signal inputs with `computed`/`effect` instead of `ngOnChanges`, `DestroyRef.onDestroy` / `takeUntilDestroyed` for cleanup, and `afterNextRender`/`afterRenderEffect` for DOM work.

## What are signals in Angular?
Level: Intermediate | Tags: signals, reactivity

Signals are reactive values that notify consumers when they change:

- `signal(initial)` — writable (`set`, `update`).
- `computed(() => …)` — derived, lazy and memoised.
- `effect(() => …)` — side effects when dependencies change.
- `linkedSignal` — writable state derived from other signals; `resource`/`httpResource` — async data as signals.

Templates that read signals are updated precisely when those signals change, enabling efficient `OnPush` and zoneless change detection. Signals suit synchronous state; RxJS remains better for complex event streams, and the two interoperate via `toSignal`/`toObservable`.

## What is the difference between `computed` and `effect`?
Level: Intermediate | Tags: signals

- `computed` **derives a value** from other signals. It's pure, lazy (runs only when read), memoised, and read-only.
- `effect` **performs side effects** (logging, `localStorage`, syncing with non-Angular code, manual DOM work) when signals it reads change. It returns nothing useful.

A common anti-pattern is using an `effect` to set another signal; use `computed` (or `linkedSignal` when it must also be writable) instead.

## Explain Angular's change detection. What does OnPush do?
Level: Intermediate | Tags: change-detection, performance

Change detection syncs the DOM with component state. Traditionally, Zone.js notified Angular after any async event, and Angular checked the whole component tree top-down, comparing template binding values.

With `ChangeDetectionStrategy.OnPush`, a component is only checked when an input reference changes, an event handler in its template fires, a signal it reads changes, an `async` pipe emits, or it's marked with `markForCheck()`. This skips entire subtrees. It requires immutable data patterns — mutating an object in place won't trigger an `OnPush` child.

## What is zoneless Angular?
Level: Advanced | Tags: change-detection, zoneless

Running Angular without Zone.js. Change detection is scheduled by explicit notifications: signal changes read by templates, template event handlers, `async` pipe, `markForCheck`, input changes. New apps in current Angular versions are zoneless by default; existing apps opt in with `provideZonelessChangeDetection()` and remove the Zone.js polyfill.

Benefits: smaller bundles, faster runtime, better debugging, native async/await. Migration requires that UI state updated from timers, promises or third-party callbacks lives in signals (or calls `markForCheck`).

## What is dependency injection and how does the injector hierarchy work?
Level: Intermediate | Tags: dependency-injection

DI supplies a class's dependencies from **providers** instead of the class creating them. Consumers use `inject(Token)` or constructor parameters.

Angular resolves a token by walking up the injector tree: the element injectors of the component and its ancestors (component `providers`), then the environment injectors (route `providers`, lazy-loaded boundaries), up to the root injector (`providedIn: 'root'`, app config). The first provider found wins.

This allows singletons (`root`), feature-scoped instances (route providers) and per-component instances (component providers), and makes testing easy by swapping providers.

## What is the difference between `providedIn: 'root'` and component-level providers?
Level: Intermediate | Tags: dependency-injection

- `providedIn: 'root'` — one application-wide singleton, created lazily on first injection and **tree-shakable** if unused.
- `providers: [X]` in a component — a new instance **per component instance**, shared with its children and destroyed with the component. Useful for widget-local state (a wizard, an editor).
- Route `providers` — one instance for that route subtree.

## What are the useClass, useValue, useFactory and useExisting providers?
Level: Intermediate | Tags: dependency-injection

- `useClass` — provide an implementation class for a token (swap implementations, e.g. a mock in tests).
- `useValue` — provide a fixed value (config objects via an `InjectionToken`).
- `useFactory` — compute the value at runtime, optionally using other injected dependencies.
- `useExisting` — alias one token to another existing provider.

`InjectionToken<T>` is used for non-class dependencies such as configuration or functions.

## How does routing work? What are guards and resolvers?
Level: Intermediate | Tags: routing

Routes map URL paths to components (`component`, lazily with `loadComponent`/`loadChildren`) and render into `<router-outlet>`. Parameters, query params and data can bind directly to component inputs with `withComponentInputBinding()`.

- **Guards** (`canActivate`, `canActivateChild`, `canMatch`, `canDeactivate`) — functions deciding whether navigation proceeds; they can return `true`/`false` or a `UrlTree` redirect. `canMatch` also prevents downloading lazy code.
- **Resolvers** — fetch data before activation.

Guards are UX; authorisation must be enforced by the API.

## How do you implement lazy loading?
Level: Intermediate | Tags: performance, routing

- Routes: `loadComponent: () => import('./x').then(m => m.X)` or `loadChildren` for a routes file — each becomes a separate chunk.
- Templates: `@defer` blocks with triggers (`on viewport`, `on interaction`, `on idle`, `when cond`) and `prefetch`.
- Preloading strategies (`withPreloading`) to fetch lazy chunks in the background.
- `canMatch` guards to avoid loading restricted features.

## Compare template-driven, reactive and signal forms.
Level: Intermediate | Tags: forms

- **Template-driven** (`ngModel`) — form model inferred from the template; quick for simple forms; harder to test and scale.
- **Reactive forms** (`FormGroup`, `FormControl`, `FormArray`, `FormBuilder`) — explicit, typed model in the class; synchronous access to state; custom/async/cross-field validators; `valueChanges` streams. The enterprise standard.
- **Signal forms** (`@angular/forms/signals`) — the model is a signal, validation rules declared in a schema function, field state exposed as signals, bound with `[formField]`. A natural fit for signal-based components.

## How do you write a custom validator and an async validator?
Level: Intermediate | Tags: forms, validation

A validator is a function returning `null` when valid, or an errors object:

```ts
export const noWhitespace: ValidatorFn = (c) =>
  (c.value ?? '').trim() ? null : { whitespace: true }
```

Cross-field validators are attached to the `FormGroup`. Async validators return an Observable/Promise of errors — debounce them, and handle API errors — and put the control in `PENDING` status while running:

```ts
export const usernameAvailable = (api: UserApi): AsyncValidatorFn => (c) =>
  timer(400).pipe(switchMap(() => api.isAvailable(c.value)), map((ok) => (ok ? null : { taken: true })))
```

## Explain `switchMap`, `mergeMap`, `concatMap` and `exhaustMap`.
Level: Intermediate | Tags: rxjs

All map each source value to an inner Observable and flatten it; they differ when a new value arrives while an inner Observable is active:

- `switchMap` — cancels the previous inner (search-as-you-type, route params).
- `mergeMap` — runs all concurrently (independent parallel requests).
- `concatMap` — queues, running one at a time in order (ordered saves).
- `exhaustMap` — ignores new values until the current finishes (login/submit buttons).

## What is the difference between an Observable, a Promise and a Signal?
Level: Intermediate | Tags: rxjs, signals

- **Promise** — a single future value, eager, not cancellable.
- **Observable** — zero to many values over time, lazy (runs on subscribe), cancellable (unsubscribe), composable with operators.
- **Signal** — a synchronous current value with automatic dependency tracking; no concept of completion or time.

In Angular: signals for state, Observables for event streams and complex async coordination (HttpClient returns Observables), promises for simple one-off async work.

## How do you prevent memory leaks from subscriptions?
Level: Intermediate | Tags: rxjs, memory

- Use the `async` pipe or `toSignal` so Angular manages subscriptions.
- Use `takeUntilDestroyed()` (in an injection context, or pass a `DestroyRef`).
- Clean up in `DestroyRef.onDestroy`/`ngOnDestroy` (timers, listeners, third-party widgets).
- Prefer operators that complete (`take(1)`, `first`) when you only need one value.

HTTP observables complete after the response; long-lived ones (`interval`, `valueChanges`, router events, websockets) leak if not unsubscribed.

## What are Subjects? When would you use a BehaviorSubject?
Level: Intermediate | Tags: rxjs

A `Subject` is both an Observable and an Observer — you can push values with `next()` to all subscribers (multicasting).

- `Subject` — no initial value; late subscribers miss earlier values. Good for events.
- `BehaviorSubject` — holds a current value, emits it to new subscribers; accessible via `.value`. Historically used for state in services.
- `ReplaySubject(n)` — replays the last `n` values.
- `AsyncSubject` — emits only the last value on completion.

In modern Angular, signals usually replace `BehaviorSubject`-based state.

## What are directives? Explain attribute vs. structural directives.
Level: Intermediate | Tags: directives

Directives add behaviour to elements. Components are directives with templates.

- **Attribute directives** change appearance/behaviour of the host element (`appHighlight`, `ngClass`), typically via `host` bindings.
- **Structural directives** add/remove DOM by creating views from a `TemplateRef` with a `ViewContainerRef` (`*appHasRole`, legacy `*ngIf`/`*ngFor`). The `*` desugars to an `<ng-template>`.

Built-in control flow (`@if`, `@for`, `@switch`) now replaces the common structural directives.

## What is content projection? Explain `ng-content`, `ng-template` and `ng-container`.
Level: Intermediate | Tags: components

- `<ng-content select="…">` — projects markup passed by the parent into slots of a component (cards, dialogs, layouts).
- `<ng-template>` — a template fragment that isn't rendered until instantiated (by a structural directive, `ngTemplateOutlet` or `@defer`); used to let consumers customise rendering.
- `<ng-container>` — a grouping element that doesn't create a DOM node; useful for applying directives or outlets without extra wrappers.

## Why is `track` required in `@for`?
Level: Beginner | Tags: performance, templates

`track` tells Angular how to identify each item. When the collection changes, Angular reuses, moves, inserts or removes only the DOM nodes for changed items instead of re-rendering the whole list — preserving element state (focus, input values, animations) and improving performance. Track by a stable unique id; `$index` only for static lists.

## What are pure and impure pipes?
Level: Intermediate | Tags: pipes, performance

- **Pure** (default) — re-executed only when the input value or arguments change by reference. Cheap and cacheable; mutations of the same object/array won't be detected.
- **Impure** (`pure: false`) — re-executed on every change detection cycle. Use rarely (e.g. the built-in `async` pipe is impure) because it can hurt performance.

Pure pipes and `computed` signals are the right replacements for function calls in templates.

## How do HTTP interceptors work? Give use cases.
Level: Intermediate | Tags: http

Interceptors are functions (`HttpInterceptorFn`) registered with `provideHttpClient(withInterceptors([...]))` that see every request and response, in order. They can clone and modify requests (immutable) and transform or handle responses/errors.

Use cases: adding auth tokens (only to first-party URLs), refreshing expired tokens, global error handling/notifications, loading indicators, logging, retries, caching, adding correlation IDs.

## How would you improve the performance of a large Angular app?
Level: Advanced | Tags: performance

- **Load**: lazy-load routes, `@defer` heavy/below-the-fold UI, trim dependencies, bundle budgets, `NgOptimizedImage`, SSR/prerendering, caching/CDN.
- **Runtime**: signals + `OnPush` + zoneless; no function calls or heavy getters in templates (use `computed`/pure pipes); `track` by id; virtual scrolling for long lists; debounce frequent events; web workers for CPU-heavy work.
- **Data**: server-side pagination/filtering, parallel requests, caching reference data, `switchMap` to cancel stale requests.
- **Memory**: fix subscription/listener leaks.
- Measure with Lighthouse, Angular DevTools profiler and Chrome Performance panel before and after.

## What are SSR and hydration in Angular?
Level: Advanced | Tags: ssr

**SSR** renders pages on the server so users and crawlers get HTML immediately (better LCP and SEO). Angular supports per-route render modes: prerender (build time), server (per request) and client.

**Hydration** reuses the server-rendered DOM on the client instead of re-rendering, attaching listeners and state; **event replay** captures early user interactions. **Incremental hydration** with `@defer (hydrate on …)` delays hydrating sections until needed. Code must avoid browser-only APIs during server rendering (`afterNextRender`, `isPlatformBrowser`), and server/client output must match to avoid hydration mismatches. The HTTP transfer cache prevents refetching data on the client.

## How does Angular protect against XSS, and how can developers break that?
Level: Advanced | Tags: security

Angular treats values as untrusted: interpolation escapes text, and `[innerHTML]`, URLs and styles are sanitised automatically. AOT compilation avoids runtime template injection.

Developers break it by using `DomSanitizer.bypassSecurityTrust*` on user-controlled content, writing to `nativeElement.innerHTML` directly, or compiling templates from user input. Defence in depth: strict CSP with nonces, Trusted Types, and keeping tokens out of `localStorage`.

## How do you manage state in a large Angular application?
Level: Advanced | Tags: state-management

Classify state and place it accordingly:

- Local UI state → component signals.
- Shared client state → signal-based service stores (private writable signal, public `computed` selectors, named methods) or NgRx SignalStore.
- Complex, event-driven, audit-heavy workflows → NgRx Store (actions, reducers, selectors, effects).
- Server state → `httpResource`/data services with caching and invalidation, not duplicated in global stores.
- Shareable UI state (filters, pagination) → URL query parameters.

Use facades so components don't depend on the store implementation.

## What is the difference between `ViewChild` and `ContentChild`?
Level: Intermediate | Tags: components, queries

- `viewChild` / `viewChildren` — query elements, directives or components declared in the component's **own template**.
- `contentChild` / `contentChildren` — query elements **projected** into the component by its parent via `<ng-content>`.

The signal-based versions (`viewChild()`, `contentChildren()`) update automatically; view queries are available after the view initialises.

## How do you share data between components?
Level: Beginner | Tags: components

- Parent → child: inputs.
- Child → parent: outputs (`output()`), or `model()` for two-way.
- Siblings/distant components: a shared service/store with signals.
- Parent accessing a child's API: `viewChild` or a template reference variable.
- Route-level/shareable state: URL parameters.
- Avoid deep "input drilling" through many layers — use a scoped service instead.

## What is AOT compilation?
Level: Intermediate | Tags: compiler

Ahead-of-time compilation converts templates and decorators into efficient JavaScript at build time (the default for development and production). Benefits: faster startup (no compiler shipped to the browser), smaller bundles, template type-checking and errors at build time (`strictTemplates`), and better security (no runtime template compilation). JIT compilation compiled templates in the browser and is now only used in special cases.

## How would you structure an enterprise Angular codebase for multiple teams?
Level: Expert | Tags: architecture, leadership

- **Domain-oriented structure** in a monorepo (Nx or CLI workspace): per-domain libraries by type (`feature`, `ui`, `data-access`, `domain`, `util`) with public APIs.
- **Enforced boundaries** via lint rules (e.g. Nx module boundaries) and CODEOWNERS.
- **Shared design system** built on Angular CDK, documented in Storybook.
- **Facades** over state; consistent API-layer, error-handling and state patterns.
- **CI with affected builds/tests** and caching; bundle budgets; Lighthouse CI.
- Regular `ng update` cadence and automated migrations.
- Consider micro frontends (Module/Native Federation) only when independent deployment is truly required.

## How did you (or would you) improve performance of an enterprise Angular app by a large margin?
Level: Expert | Tags: performance, leadership

A strong answer is structured and measurable:

1. **Baseline** — Lighthouse/Core Web Vitals, bundle analysis, DevTools profiles of key flows.
2. **Load** — lazy-load feature routes, `@defer` heavy widgets, remove or replace heavy dependencies, image optimisation, budgets in CI.
3. **Runtime** — migrate hot components to signals + `OnPush`, remove template function calls, `track` in lists, virtual scrolling for large tables, fix RxJS subscription leaks.
4. **Data** — server-side pagination, parallel requests, caching, cancellation with `switchMap`.
5. **Prevent regressions** — budgets, performance tests in CI, coding standards and reviews.
6. **Report results** — e.g. initial bundle size, LCP and interaction latency before vs. after.

Interviewers look for the method (measure → fix → verify → guard), not just a list of techniques.

## What is the `inject()` function and why is it preferred?
Level: Intermediate | Tags: dependency-injection

`inject(Token)` retrieves a dependency from the current injection context (field initialisers, constructors, factory functions, functional guards/interceptors/resolvers). Advantages over constructor injection: works in functions (not just classes), avoids long constructors and `super(...)` parameter passing in inheritance, works well with `useDefineForClassFields`, and enables composable helper functions (`injectUser()`). It must be called in an injection context, otherwise it throws.

## What is `NgZone.runOutsideAngular` and when would you use it?
Level: Advanced | Tags: change-detection, performance

In Zone.js-based apps, every event and timer triggers change detection. `runOutsideAngular` executes code (high-frequency listeners like `mousemove`/`scroll`, animation loops, third-party libraries polling) outside Angular's zone so it doesn't trigger change detection on every tick; you re-enter with `zone.run()` only when the UI must update. In zoneless apps it's not needed — updates are triggered explicitly through signals.

## How do you handle errors globally in Angular?
Level: Intermediate | Tags: errors

- An HTTP **error interceptor** for API failures (auth redirects, toasts, retries).
- A custom **`ErrorHandler`** provider to catch uncaught errors and report them to monitoring (Sentry, Application Insights), plus `provideBrowserGlobalErrorListeners()` to capture uncaught errors and rejections.
- Error states in components (`resource.error()`, `@defer` `@error` blocks).
- User-friendly messages; technical details only in logs.
