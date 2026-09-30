**Angular** is a complete, batteries-included framework from Google for building web applications — the "A" in the MEAN stack. Where libraries like React focus on the view layer, Angular ships everything a large application needs: components, routing, forms, HTTP, dependency injection, testing tools and a powerful CLI, all designed to work together. It's especially popular for enterprise applications, where consistency across big teams matters.

## What makes Angular different

- **TypeScript first** — every Angular app is written in TypeScript, so large code bases stay safe to change.
- **Opinionated structure** — one recommended way to do routing, forms, HTTP and DI means any Angular developer can find their way around any Angular project.
- **Dependency injection** — services are provided and injected by the framework, making code modular and testable.
- **Signals-based reactivity** — modern Angular uses signals for fine-grained, predictable change detection.
- **Excellent tooling** — the Angular CLI generates code, runs the dev server, builds optimised bundles, runs tests and applies automated migrations when you upgrade.
- **Predictable releases** — a new major version roughly every six months, with long-term support and `ng update` migrations.

## Modern Angular in a nutshell

Angular has evolved a lot. If you've seen older tutorials with `NgModule`s, `*ngIf` and Zone.js everywhere, modern Angular looks noticeably simpler:

| Older style | Modern Angular |
| --- | --- |
| `NgModule` declarations | **Standalone components** (the default) |
| `*ngIf`, `*ngFor` | Built-in control flow: `@if`, `@for`, `@switch` |
| `@Input()` / `@Output()` decorators | `input()`, `output()`, `model()` functions |
| Constructor injection | `inject()` function (both still work) |
| Zone.js-driven change detection | **Signals** and zoneless change detection |

This tutorial teaches the modern style and points out the older equivalents you'll meet in existing projects.

## Installing the Angular CLI

You need Node.js (an active LTS version). Then:

```bash
npm install -g @angular/cli
ng version
```

## Creating a project

```bash
ng new shop-app
cd shop-app
ng serve --open
```

The CLI asks a few questions (stylesheet format, server-side rendering) and creates a working app at `http://localhost:4200` that reloads as you edit.

## Project structure

```text
shop-app/
  src/
    main.ts              # bootstraps the application
    index.html           # the single HTML page
    styles.scss          # global styles
    app/
      app.ts             # the root component
      app.html           # its template
      app.scss           # its styles
      app.config.ts      # application-wide providers (router, HTTP, …)
      app.routes.ts      # route definitions
  angular.json           # CLI workspace configuration
  package.json
  tsconfig.json
```

`main.ts` starts everything:

```ts
import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { App } from './app/app'

bootstrapApplication(App, appConfig).catch((err) => console.error(err))
```

## Your first component

```ts
// src/app/app.ts
import { Component, signal } from '@angular/core'

@Component({
  selector: 'app-root',
  template: `
    <h1>Welcome to {{ title() }}!</h1>
    <button (click)="count.update((c) => c + 1)">Clicked {{ count() }} times</button>
  `,
})
export class App {
  title = signal('Shop App')
  count = signal(0)
}
```

- `@Component` marks the class as a component with a `selector` (its HTML tag) and a `template`.
- `signal(…)` creates reactive state; reading it in the template (`count()`) makes Angular update the view whenever it changes.
- `(click)` binds an event handler.

## Useful CLI commands

```bash
ng generate component product-card     # or: ng g c product-card
ng generate service cart               # ng g s cart
ng build                               # production build into dist/
ng test                                # unit tests
ng update                              # upgrade Angular with automated migrations
ng add @angular/material               # add a library with its setup
```

## What you'll learn

1. Components, templates, data binding, control flow and pipes
2. Inputs, outputs and component communication
3. Signals, services and dependency injection
4. Routing, reactive forms and HTTP
5. RxJS essentials and custom directives
6. Change detection, component architecture, state management and lazy loading
7. Testing, performance, security, SSR and large-scale architecture

## Try it yourself

Create a new project with `ng new`, run it, and replace the root component's template with a heading and a button that toggles a message on and off using a `signal(false)`.
