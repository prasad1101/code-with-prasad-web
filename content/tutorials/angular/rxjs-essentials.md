**RxJS** (Reactive Extensions for JavaScript) models asynchronous events as **Observables** — streams of values over time — and provides operators to transform and combine them. Angular's `HttpClient`, router events and reactive forms all use RxJS. Signals now handle most component state, but RxJS remains the best tool for complex async flows: type-ahead search, polling, websockets and coordinating concurrent requests.

## Observables, observers and subscriptions

```ts
import { Observable } from 'rxjs'

const ticks$ = new Observable<number>((subscriber) => {
  let n = 0
  const id = setInterval(() => subscriber.next(n++), 1000)
  return () => clearInterval(id) // teardown when unsubscribed
})

const sub = ticks$.subscribe({
  next: (value) => console.log(value),
  error: (err) => console.error(err),
  complete: () => console.log('done'),
})

sub.unsubscribe()
```

- Observables are **lazy**: nothing happens until you subscribe.
- By convention, observable variables end with `$`.
- An observable can emit many values, then **complete** or **error**.

## Creating observables

```ts
import { from, fromEvent, interval, of, timer } from 'rxjs'

of(1, 2, 3)                          // emits values synchronously, then completes
from([1, 2, 3])                      // from an array, promise or iterable
interval(1000)                       // 0, 1, 2… every second
timer(500)                           // one value after 500 ms
fromEvent<MouseEvent>(document, 'click')
```

## Essential operators

Operators are applied with `pipe`:

```ts
import { debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs'

this.searchControl.valueChanges.pipe(
  map((q) => q.trim()),
  filter((q) => q.length >= 2),
  debounceTime(300),              // wait for typing to pause
  distinctUntilChanged(),         // skip if unchanged
  tap((q) => console.log('Searching', q)),
)
```

| Operator | Purpose |
| --- | --- |
| `map`, `filter`, `tap` | Transform, filter, side effects |
| `debounceTime`, `throttleTime` | Rate-limit bursts |
| `distinctUntilChanged` | Ignore repeated values |
| `startWith`, `scan` | Initial value, running accumulation |
| `take`, `takeUntil`, `first` | Complete after a condition |
| `catchError`, `retry` | Error handling |
| `shareReplay` | Share one execution between subscribers and cache the latest value |

## Flattening operators: the most important decision

When each value triggers another async operation (usually an HTTP request), you need a flattening operator. They differ in what happens when a new value arrives while the previous request is still running:

| Operator | Behaviour | Use for |
| --- | --- | --- |
| `switchMap` | **Cancel** the previous inner request | Search-as-you-type, route parameter changes |
| `mergeMap` | Run all in **parallel** | Independent requests (e.g. deleting several items) |
| `concatMap` | Queue — run **one after another**, in order | Saving edits that must apply in order |
| `exhaustMap` | **Ignore** new values until the current one finishes | Submit/login buttons (prevent double submit) |

### Type-ahead search

```ts
import { Component, inject } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { toSignal } from '@angular/core/rxjs-interop'
import { catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs'

@Component({
  selector: 'app-product-search',
  imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="query" placeholder="Search products" />
    @for (p of results(); track p.id) {
      <p>{{ p.name }}</p>
    }
  `,
})
export class ProductSearch {
  private api = inject(ProductApi)
  query = new FormControl('', { nonNullable: true })

  results = toSignal(
    this.query.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => (q.length < 2 ? of([]) : this.api.search(q).pipe(catchError(() => of([]))))),
    ),
    { initialValue: [] },
  )
}
```

Put `catchError` **inside** the `switchMap`: an error in the outer stream would complete it and the search would stop working.

## Combining streams

```ts
import { combineLatest, forkJoin } from 'rxjs'

// Wait for several requests, then use all results (like Promise.all)
forkJoin({ user: this.api.user(), orders: this.api.orders(), prefs: this.api.prefs() })
  .subscribe(({ user, orders, prefs }) => { /* … */ })

// Recompute whenever any source emits
combineLatest([this.filters$, this.sort$, this.page$]).pipe(
  switchMap(([filters, sort, page]) => this.api.list({ ...filters, sort, page })),
)
```

## Subjects

A `Subject` is both an observable and an observer — you can push values into it:

```ts
import { BehaviorSubject, Subject } from 'rxjs'

const refresh$ = new Subject<void>()
refresh$.next()

const user$ = new BehaviorSubject<User | null>(null) // has a current value, replays it to new subscribers
user$.next(currentUser)
user$.value
```

Before signals, `BehaviorSubject` in services was the standard way to hold shared state. In new code, prefer signals for state and Subjects for event streams.

## Avoiding memory leaks

Subscriptions that never end keep running after the component is destroyed. Options:

```ts
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'

// 1. Let Angular manage the subscription
results = toSignal(results$)          // or the async pipe in the template

// 2. Auto-unsubscribe on destroy (in an injection context)
constructor() {
  interval(5000).pipe(takeUntilDestroyed()).subscribe(() => this.poll())
}
```

HTTP observables complete after one response, so they don't leak — but long-lived streams (`interval`, `valueChanges`, router events, websockets) do.

## Signals ↔ Observables

```ts
import { toObservable, toSignal } from '@angular/core/rxjs-interop'

const count = signal(0)
const count$ = toObservable(count)             // emits when the signal changes
const width = toSignal(fromEvent(window, 'resize').pipe(map(() => window.innerWidth)), {
  initialValue: window.innerWidth,
})
```

A good rule of thumb: **signals for state, RxJS for events and async coordination**, converting at the boundary.

## Try it yourself

1. Build type-ahead search with `debounceTime`, `distinctUntilChanged`, `switchMap` and error handling.
2. Add a "Save" button using `exhaustMap` so double-clicks don't send two requests.
3. Poll an order-status endpoint every 10 seconds until the status is `delivered`, using `timer`, `switchMap` and `takeWhile`, and make sure polling stops when the component is destroyed.
