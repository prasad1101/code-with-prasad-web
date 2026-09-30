# Engineering practices — Code with Prasad

The standards this site is built to, and the reasons behind them. Use it as a checklist when adding pages, tools or content, and as a reference when something needs changing. The [README](README.md) covers *how* to do specific tasks (add a post, a tutorial, a tool); this document covers *what good looks like*.

---

## Contents

1. [Architecture](#1-architecture)
2. [Content](#2-content)
3. [SEO](#3-seo)
4. [Analytics and privacy](#4-analytics-and-privacy)
5. [Performance](#5-performance)
6. [Accessibility](#6-accessibility)
7. [Security](#7-security)
8. [UI and design consistency](#8-ui-and-design-consistency)
9. [Code quality](#9-code-quality)
10. [Testing and verification](#10-testing-and-verification)
11. [Deployment and hosting](#11-deployment-and-hosting)
12. [Checklists](#12-checklists)

---

## 1. Architecture

| Decision | Why |
| --- | --- |
| **Static site** (React 18 + Vite + TypeScript) on GitHub Pages | Free hosting, nothing to run or patch, fast from a CDN. |
| **All content in the repo** as JSON (`public/data/`) + Markdown (`public/content/`) | Versioned, reviewable in pull requests, no database or CMS to maintain. Third-party JSON stores were rejected: publicly writable and they expire. |
| **Clean URLs** (`/tools/jwt-decoder/`) with a pre-generated `index.html` per route | Search engines ignore everything after `#`, so hash routing would make the whole site one page to Google. |
| **One place for each setting** | Base path, origin and GA id live only in `src/config/site.ts`; titles/descriptions only in `src/lib/seo.ts`; tool metadata only in `src/tools/meta.ts`. Duplicated config drifts. |
| **Pure logic separated from UI** | `src/tools/logic.ts` has no React or imports, so it can be unit-tested directly in Node. |
| **Lazy loading by route and by tool** | Visitors download only what the page they opened needs. |

## 2. Content

- **Accuracy over volume.** Every code example in tutorials and interview answers is run or compiled before publishing (Python executed, SQL run on PostgreSQL, TypeScript/Angular compiled in strict mode, React type-checked, Spark/Airflow/dbt executed). Output blocks show real output, never invented output.
- **Levels are explicit**: Beginner → Intermediate → Advanced → Expert, on chapters and interview questions.
- **Validation is forgiving.** Zod schemas (`src/lib/schemas.ts`) drop a single bad list item instead of breaking the page; only essential fields are strict.
- **`TODO:` placeholders never render** — any string starting with `TODO` is treated as empty, so unfinished profile fields stay hidden.
- **Stable slugs.** Lesson, post, topic and tool slugs are URLs that Google has indexed and people have shared — don't rename them. Interview question anchors come from the question text, so avoid rewording published questions.
- **Dummy data is clearly fake**: example emails use the reserved `example.com/.org/.net` domains.

## 3. SEO

### Every page has its own static HTML
`scripts/seo-pages.ts` (a Vite plugin) runs after every build and writes `dist/<route>/index.html` for each route. Crawlers and link-preview bots that don't run JavaScript (LinkedIn, WhatsApp, Slack …) see the right tags without executing the app. New content is picked up automatically — no manual step.

### Required on every indexable page
- **Unique `<title>`** — phrased the way people search ("JWT Decoder Online — Decode JSON Web Token…"), under ~60–70 characters before the site name where possible.
- **Unique meta description** — 50–160 characters, written for humans; lesson pages use the lesson's first paragraph.
- **Canonical URL** — absolute, `https://codewithprasad.in/...`, **with a trailing slash** (GitHub Pages serves `<route>/index.html` at the slash URL and 301-redirects the slash-less one).
- **Open Graph + Twitter tags** — title, description, URL and a 1200×630 image (`public/images/og/`).
- **Exactly one `<h1>`**, followed by a logical heading order (h2 → h3).
- **Structured data (JSON-LD)**: `WebSite` + `Person` (home), `BlogPosting`, `Course`, `TechArticle` (lessons), `WebApplication` + `FAQPage` (tools), `ItemList` (hubs) and `BreadcrumbList` on every nested page.

### One source of truth
Titles and descriptions come from `src/lib/seo.ts`, used by **both** the build plugin and the `<Seo>` component. Static tags carry `data-rh="true"` so react-helmet-async replaces them — never duplicates them — on client-side navigation.

### Site-level
- `sitemap.xml` lists every indexable URL with `lastmod` from the last git commit that touched its content.
- `robots.txt` allows everything and links the sitemap.
- Unknown URLs return a **real 404 status** with `noindex` (via `404.html`), not a soft 404.
- Old `/#/…` links are rewritten to clean URLs, both on load and on in-page hash changes.
- Internal links are real `<a href>` links (crawlable); Markdown links to `/…` are routed client-side without a full reload.
- Tool pages include written help (FAQs) — pages with useful text rank far better than bare widgets.

### After deploying
Google Search Console (Domain property, verified by DNS TXT in Hostinger) has the sitemap submitted. Use **URL Inspection → Request indexing** for important new pages (≈10/day). Indexing a new site takes days to weeks.

## 4. Analytics and privacy

- **Google Analytics 4** loads only when `GA_MEASUREMENT_ID` is set, on the production build, and not on localhost.
- **Consent Mode v2, denied by default.** No analytics cookies until the visitor clicks *Allow analytics*; declining sends only anonymous cookieless pings. Ad storage and personalisation are always denied.
- The choice is remembered in `localStorage` and can be changed any time on `/privacy`.
- `page_view` is sent manually on each route change (after the title updates), because it's a single-page app.
- **Nothing typed into the tools is ever tracked or sent anywhere.** Custom events (`trackEvent`) must never include user input.
- A **privacy policy** (`/privacy`) is required by Google Analytics' terms and explains analytics, local storage and hosting. Update its date when behaviour changes.

## 5. Performance

- **Code splitting**: each page and each tool is a lazy chunk; heavy libraries (sql-formatter, yaml, diff, papaparse, cronstrue, highlight.js) load only on the pages that use them.
- **Watch the entry bundle.** Compare the gzip size of the home page's initial load before and after a change (it was ~202 kB gzip including fonts' CSS and React). Below-the-fold home sections that pull in large modules are lazy-loaded (e.g. the tools teaser).
- **Self-hosted fonts** (Fontsource) — no render-blocking third-party requests.
- **Theme applied before first paint** (inline script in `index.html`) — no light/dark flash.
- `site.json` is preloaded; content JSON is cached in memory so navigating never refetches.
- Heavy recomputation is deferred (`useDeferredValue`) so typing stays responsive in the Markdown preview and regex tester.
- Framer Motion uses `LazyMotion` with features loaded after first paint; animations respect `prefers-reduced-motion`.
- Images: `loading="lazy"` and `decoding="async"` in articles.
- Baseline Lighthouse (production): Accessibility, Best practices and SEO 100; Performance 99 desktop.

## 6. Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `footer`) and a **Skip to content** link.
- Every form control has a visible `<label>` (shared components in `src/tools/ui.tsx` enforce this).
- Toggle groups use `role="radiogroup"`/`radio` with `aria-checked`; tabs use `role="tab"`/`tabpanel`; toggles use `aria-pressed`.
- Status and error messages use `aria-live` / `role="alert"`; invalid inputs set `aria-invalid`.
- External links announce "(opens in a new tab)" to screen readers.
- Visible focus rings (`:focus-visible`), keyboard support everywhere (Escape closes menus).
- Colour contrast meets WCAG AA in both themes; information is never conveyed by colour alone (diffs use + / − as well as colour).
- Code fonts have ligatures disabled in tools so `<=` is never shown as `≤`.

## 7. Security

- **All Markdown is sanitised** with DOMPurify before reaching the DOM (`src/lib/markdown/sanitize.ts`); `style` and `form` tags are forbidden.
- External links get `rel="noopener noreferrer"`.
- JSON-LD is serialised with `<` escaped so content can never close the script tag; all static HTML attributes are escaped.
- Tools run entirely client-side; cryptography uses the Web Crypto API and `crypto.getRandomValues` (never `Math.random`) with unbiased sampling.
- Tools state their limits honestly: the JWT decoder says it does not verify signatures, the hash tool explains why MD5 isn't offered and that SHA is not for password storage, Base64 notes it is not encryption.
- No secrets in the repo; `docs/` (private source material) is git-ignored.
- HTTPS is enforced in GitHub Pages settings.

## 8. UI and design consistency

- Design tokens (colours, fonts) are CSS variables in `src/index.css`, defined for light and dark themes. Use the Tailwind token classes (`bg-surface`, `text-muted`, `border-line`, `text-accent` …), not raw colours.
- Reuse shared primitives: `Button`, `Chip`, `PageHeader`, `Section`, `Seo`, `ErrorState`, skeletons, and for tools `TextArea`, `Input`, `Select`, `Segmented`, `Checkbox`, `ResultRow`, `CopyButton`, `Note`.
- Every data-driven view handles **loading** (skeleton), **error** (ErrorState with retry) and **empty** states.
- A tool crashing never blanks the page — each tool renders inside an error boundary.
- Layouts must work from **360 px** wide with no horizontal scrolling.
- British English in UI copy ("colour", "practise" as a verb).

## 9. Code quality

- TypeScript strict mode; `npm run lint` (ESLint with React Hooks and React Refresh rules) and Prettier must pass.
- Match the surrounding code: naming, comment density and idioms. Comments explain *why*, not *what*.
- React: no state updates inside effects when a value can be derived; regenerate random values with a "seed" counter in `useMemo` rather than effect-driven state.
- Files that export components export only components (React Refresh); helpers go in separate modules.
- Keep build-time modules (`src/lib/seo.ts`, `src/tools/meta.ts`, `src/config/site.ts`) free of React and browser APIs — Node imports them during the build.

## 10. Testing and verification

Before deploying a significant change:

1. `npx tsc -b && npm run lint && npm run build` — all clean.
2. **Unit-test pure logic** in Node (Node runs `.ts` directly), including invalid input and edge cases (leap years, DST, huge numbers, Unicode).
3. **Browser-test in headless Chrome** (Puppeteer) against the production build served the way GitHub Pages serves it (directory → 301, unknown → 404.html with 404 status):
   - every tool with valid **and** invalid input;
   - every page renders with no console errors;
   - no horizontal overflow at 375 px;
   - head tags after render match the static HTML (exactly one title, description, canonical, og:image).
4. **SEO checks** over every sitemap URL: 200 status, unique titles, description length, canonical correct, JSON-LD parses, OG images exist.
5. After deploying, re-run the checks against `https://codewithprasad.in`.

Tests caught real bugs every time (e.g. `$&` in FAQ text corrupting a page head via `String.replace`, the "Free only" filter matching "Freemium") — don't skip them.

## 11. Deployment and hosting

- `npm run deploy` builds locally and force-pushes `dist/` to the `gh-pages` branch (GitHub Actions is unavailable on the account). `public/.nojekyll` disables Jekyll.
- Custom domain `codewithprasad.in`: `public/CNAME`, DNS in Hostinger (4 × A, 4 × AAAA for `@`, CNAME `www` → `prasad1101.github.io`). Details in the README.
- **Commit to `main` as well as deploying** — the deploy builds from your working copy, so undeployed commits and uncommitted deploys both drift.
- After a deploy, give GitHub Pages ~1 minute, then verify the live site.

## 12. Checklists

### Adding a page or route
- [ ] Route in `src/App.tsx`, link from nav/footer or a hub page
- [ ] `<Seo>` with title, description, path (add fixed pages to `PAGE_META` in `src/lib/seo.ts`)
- [ ] Route added to `collectRoutes()` in `scripts/seo-pages.ts` (with JSON-LD and breadcrumbs)
- [ ] Loading / error / empty states; works at 360 px; one `<h1>`

### Adding a tool
- [ ] Metadata in `src/tools/meta.ts`: slug, title, **search-friendly `seoTitle`**, summary, description (≤160 chars ideally), keywords, 3 accurate FAQs
- [ ] Component in `src/tools/tools/`, registered with icon in `src/tools/registry.ts`
- [ ] Pure logic in `logic.ts` with Node tests; runs fully client-side
- [ ] OG image in `public/images/og/tools/<slug>.png` (1200×630)
- [ ] Browser test with valid and invalid input

### Adding a tutorial, lesson, post or interview topic
- [ ] Entry in the relevant JSON file + Markdown body
- [ ] Code examples run/compiled; outputs are real
- [ ] First paragraph works as a meta description (it becomes one)
- [ ] Slug is final before publishing

### Before every deploy
- [ ] Type-check, lint, build clean
- [ ] Browser + SEO checks pass
- [ ] Commit to `main`, then `npm run deploy`, then verify live
