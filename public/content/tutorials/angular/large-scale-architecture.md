Enterprise Angular applications are built by many developers — sometimes many teams — over years. The architecture must keep the codebase understandable, builds fast, and teams independent. This lesson covers the patterns used in large Angular codebases.

## Principles

1. **Organise by domain, not by technical type.** `features/orders/` beats `components/`, `services/`, `models/` at the top level.
2. **Explicit boundaries and dependency rules.** Features don't reach into each other's internals.
3. **Layers within features.** UI components, feature logic (state/facades), data access.
4. **Shared code is deliberate.** A design system and utilities live in their own libraries with a clear owner.
5. **Automate the rules** — lint rules and CI checks, not wiki pages.

## Monorepo with libraries

Tools like **Nx** (or Angular CLI workspaces with multiple projects) split a large app into libraries:

```text
apps/
  shop/                      # the deployable application (thin shell)
  admin/
libs/
  shared/
    ui/                      # design system: buttons, dialogs, tables
    util/                    # pure helpers, pipes, date formatting
    data-access-auth/        # auth service, interceptors, guards
  orders/
    feature-order-list/      # routed, smart components
    feature-order-detail/
    ui/                      # order-specific presentational components
    data-access/             # API services, stores
    domain/                  # models, validation, business rules
```

Library **types** constrain what may depend on what:

| Type | May depend on |
| --- | --- |
| `feature` | `ui`, `data-access`, `domain`, `util` |
| `ui` | `ui`, `util` (no services, no data access) |
| `data-access` | `data-access`, `domain`, `util` |
| `domain` / `util` | `util` only |

Nx's `enforce-module-boundaries` lint rule fails the build when someone imports across forbidden boundaries — e.g. the `orders` domain importing from `checkout` internals.

Benefits:

- **Affected builds and tests** — CI only rebuilds and tests what changed (`nx affected`), with remote caching.
- Clear ownership (CODEOWNERS per library).
- Public APIs per library (`index.ts`) hide internals.

## Facades between UI and state

A **facade** gives components a small, stable API over state and data access:

```ts
@Injectable({ providedIn: 'root' })
export class OrdersFacade {
  private store = inject(OrdersStore)
  private api = inject(OrdersApi)

  readonly orders = this.store.orders
  readonly loading = this.store.loading

  load(filters: OrderFilters) { this.store.load(filters) }
  cancel(id: string) { return this.api.cancel(id).pipe(tap(() => this.store.markCancelled(id))) }
}
```

Components depend on the facade, so the state implementation (signals, SignalStore, NgRx) can change without touching every component.

## A design system as a product

Consistency across dozens of screens comes from a shared component library:

- Built on **Angular CDK** primitives (overlays, a11y, drag-drop, virtual scroll) or a base like Angular Material.
- Themed with CSS custom properties / design tokens.
- Documented in Storybook with usage guidelines and accessibility notes.
- Versioned and changelogged if consumed by several apps.
- Owned by a team (or rotating owners), with contribution guidelines.

Reusable component libraries like this commonly speed up delivery across teams significantly.

## Micro frontends — when (not) to use them

Micro frontends split the UI into independently built and deployed applications, composed at runtime (e.g. with **Module Federation** or **Native Federation**).

Use them when:

- Several teams need **independent release cycles** for parts of one product.
- Parts of the app use different Angular versions or frameworks during a migration.

Costs: shared dependency versioning, runtime integration complexity, consistent UX across remotes, cross-app routing and state, harder performance tuning and testing. A well-structured **monorepo** gives most of the team-independence benefits with far less complexity — prefer it unless independent deployment is a hard requirement.

## Cross-cutting concerns

Centralise in `core`/shared libraries:

- Authentication, interceptors, guards
- Error handling (`ErrorHandler` implementation reporting to monitoring) and user notifications
- Logging and analytics
- Feature flags (runtime configuration, not rebuilds)
- Internationalisation (Angular's built-in i18n or a runtime library)
- Configuration via `InjectionToken`s loaded at startup (`provideAppInitializer`)

## Keeping a large codebase healthy

- **Upgrade regularly** with `ng update` — skipping several versions turns routine upgrades into projects.
- **Automated migrations** — use the Angular schematics for standalone components, control flow, signal inputs and inject().
- **Strict TypeScript and strict templates.**
- **Lint and format in CI**; forbid `any` in new code.
- **Test pyramid** — many unit tests, component tests for UI libraries, a few E2E journeys.
- **Performance budgets** and Lighthouse CI.
- **Architecture decision records** and a short architecture guide for newcomers.
- **Code reviews** focused on boundaries, naming and consistency, backed by coding standards.

## Leading an Angular team

Technical leads on large Angular projects typically:

- Define and document the architecture, folder conventions and coding standards.
- Build or curate the shared component library.
- Establish state-management, error-handling and API-layer patterns so every feature looks the same.
- Mentor developers through reviews and pairing, and own the upgrade roadmap.
- Balance feature delivery with technical-debt reduction, measured by build times, bundle sizes and defect rates.

## Try it yourself

Sketch the library structure for an enterprise banking portal with accounts, payments, cards and admin features. Define library types, dependency rules, which libraries each team owns, where auth and the design system live, and whether micro frontends are justified — with reasons.
