TypeScript's value grows with the size of the code base — but so do build times, type complexity and migration effort. This lesson covers how teams run TypeScript successfully on large projects.

## Migrating a JavaScript code base

A proven incremental path:

1. **Add TypeScript with `allowJs`** so `.js` and `.ts` files coexist. Start with `strict: false` if needed.
2. **Type-check JavaScript** with `checkJs` (or `// @ts-check` per file) and JSDoc types — you get value before renaming anything.
3. **Convert leaf modules first** (utilities, models) — files with few dependencies. Types then flow upward.
4. **Type the boundaries**: API clients, database models, shared DTOs. They give the most leverage.
5. **Turn on strict options one by one**: `noImplicitAny`, then `strictNullChecks` (usually the biggest), then the rest.
6. **Ban new `any`** with a lint rule (`@typescript-eslint/no-explicit-any`) and track the count of `// @ts-expect-error` comments down over time.

Prefer `// @ts-expect-error` over `// @ts-ignore`: it fails when the error disappears, so stale suppressions get cleaned up.

## Keeping the compiler fast

- **`skipLibCheck: true`** — don't re-check `node_modules` declaration files.
- **`incremental: true`** — cache results between runs (`.tsbuildinfo`).
- **Project references** — split a monorepo into packages with `"composite": true`; `tsc -b` rebuilds only what changed and checks packages in parallel-friendly order.
- **Separate type-checking from building** — let esbuild/SWC/Vite transpile (fast, per file) and run `tsc --noEmit` in parallel or in CI.
- **Avoid giant unions and deeply recursive types** in hot paths; they're the usual cause of slow editor performance.
- **Annotate exported function return types** — the compiler doesn't have to infer them in every consumer, and declaration emit is faster.
- Diagnose with `tsc --extendedDiagnostics` and `tsc --generateTrace trace-dir` (open in the Perfetto viewer).

## Monorepo structure

```text
packages/
  shared/          # types, zod schemas, utilities (composite: true)
  api/             # Node service — references shared
  web/             # React or Angular app — references shared
tsconfig.base.json # common compiler options
```

Shared packages give the front end and back end one definition of every DTO. Tools like Nx, Turborepo and pnpm workspaces manage builds and caching across packages.

## Types for APIs

Don't hand-write types for API responses that can drift. Options:

- **Shared schemas** (Zod) used by both client and server.
- **Generated clients** from OpenAPI (`openapi-typescript`), GraphQL (GraphQL Code Generator) or protobuf.
- **End-to-end typed RPC** (tRPC) when both ends are TypeScript.

## Linting with type information

`typescript-eslint` with type-aware rules catches bugs the compiler allows:

- `no-floating-promises` — a promise that is neither awaited nor handled.
- `no-misused-promises` — passing an async function where a sync callback is expected.
- `switch-exhaustiveness-check`, `no-unnecessary-condition`, `strict-boolean-expressions`.

Type-aware linting is slower; run it in CI and pre-push rather than on every keystroke if needed.

## Designing types for a team

- **Model the domain explicitly** — named types for concepts (`Order`, `Money`, `OrderStatus`) rather than inline object literals everywhere.
- **Prefer simple, readable types** in application code; keep type-level wizardry in a few well-tested utilities.
- **Test complex types** with `expectTypeOf` (Vitest) or `tsd`.
- **Document public types** with TSDoc comments — they show up in editor tooltips.
- **Version shared types carefully** — changing a shared DTO is a breaking change for every consumer.

## Runtime and build choices in 2026

- Node.js can run TypeScript directly by stripping types — keep code to **erasable syntax** (`erasableSyntaxOnly`: no enums, namespaces or parameter properties) if you rely on that.
- Bundlers (Vite, esbuild, Rspack) transpile TypeScript without type checking — always keep a `tsc` check in CI.
- The TypeScript team's native (Go-based) compiler dramatically speeds up type checking of large projects; check the current release notes for its status and compatibility when planning upgrades.

## Try it yourself

1. Take a small JavaScript project and migrate it using the steps above, tracking the number of type errors after each strict option.
2. Run `tsc --extendedDiagnostics` on a real project and find the check time and number of types.
3. Enable `@typescript-eslint/no-floating-promises` and fix what it finds.
