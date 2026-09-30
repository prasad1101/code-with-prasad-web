# Code with Prasad — Goals & Progress

Living tracker for the portfolio + blog + tutorials site. Update the checkboxes as work lands.

## Goals

1. Showcase Prasad (MEAN/MERN, 8+ yrs) professionally to recruiters and clients.
2. Host blog posts on programming languages and technical topics.
3. Host step-by-step tutorials, **beginner → expert**, for the whole stack: JavaScript, TypeScript, Python, Angular, React, Node.js, Express, SQL, MongoDB, data analytics and data engineering — "Tutorials Point" style (course → chapters → lessons, sidebar, prev/next, progress tracking, learning paths).
4. Static hosting on GitHub Pages; all content versioned in this repo as JSON + Markdown.
5. Separate **Interview Prep** section: question banks with detailed answers for every topic, level filters, practised tracking and a flashcard practice mode — a one-stop shop to learn and prepare for interviews.
6. **Developer tools** section: free in-browser utilities for everyday dev work plus a curated directory of external tools.

## Decisions

| Topic | Decision |
| --- | --- |
| Stack | React 18 + Vite + TypeScript, Tailwind CSS 4, Framer Motion (LazyMotion) |
| Routing | Clean URLs (BrowserRouter) + a static `index.html` per route written at build time (was HashRouter until 2026-09-30; old `#/` links redirect) |
| Base path | `/` on the custom domain codewithprasad.in (was `/code-with-prasad-web/`), defined once in `src/config/site.ts` |
| Content | Static files in the repo: `public/data/*.json` (indexes) + `public/content/**/*.md` (bodies). JSONBlob was dropped (2026-09-30) — blobs are publicly writable and expire ~3 days after the last write. |
| Markdown | `marked` + `highlight.js` (selected languages) + `DOMPurify` |
| Validation | zod, lenient (invalid list items dropped); `TODO:` strings treated as empty |
| Fonts | Self-hosted via Fontsource (Space Grotesk, Inter, JetBrains Mono) |
| Deploy | `npm run deploy` → `gh-pages` branch (GitHub Actions unavailable on the account) |
| Tools | Everything runs client-side; each tool is a lazy chunk so heavy libraries load only when opened |

## Progress

- [x] Repo cloned into `code-with-prasad-web/` (was empty)
- [x] Scaffold: Vite, TS, Tailwind, ESLint, Prettier
- [x] Data layer: schemas, loaders, in-memory cache, skeletons, error states
- [x] Seed content: site.json, 3 blog posts, JavaScript tutorial (11 lessons), Python tutorial (12 lessons)
- [x] Layout: glass navbar with scroll-spy, mobile menu, dark/light toggle, footer, scroll-to-top
- [x] Home: hero (typing, CTAs, code card), stats, about (photo), skills, experience timeline, work, latest posts, tutorials, testimonials, contact
- [x] Blog list (search, category, tags, featured, pagination) + post page (TOC, progress bar, copy buttons, anchors, share, prev/next, related)
- [x] Tutorials: index, overview with curriculum + progress, lesson reader with sidebar/drawer, TOC, mark-complete
- [x] Projects page with tech filter + 404 page
- [x] SEO: per-page title/description/OG, favicon, icons, manifest, robots.txt
- [x] Deploy workflow
- [x] README
- [x] Verified in headless Chrome at 360 / 768 / 1280, both themes: no console errors, no horizontal overflow, interaction tests pass
- [x] Lighthouse (production build): Accessibility / Best practices / SEO 100; Performance 99 desktop, ~82–86 mobile (simulated slow 4G)
- [x] Deployed via `npm run deploy` → `gh-pages` branch (Actions unavailable on the account)
- [x] Profile, experience, skills and education filled from LinkedIn PDF export
- [x] Interview Prep section (separate from tutorials): 11 banks, level filters, search, deep links, practised tracking, practice mode
- [x] Full-site verification: every lesson served, every bank renders, no console errors, no overflow at 360px
- [x] Deploy latest content with `npm run deploy`
- [x] Developer Tools section (`/#/tools`): 18 in-browser tools + toolkit directory of 61 curated external tools (search, free-only filter); home teaser, nav + footer links
- [x] SEO: clean URLs, 276 pre-generated route pages with per-page title/description/canonical/OG/JSON-LD, sitemap.xml, robots.txt, real 404s, OG images, FAQ content on tool pages — 2,571 automated checks pass
- [x] Google Analytics 4 wiring with Consent Mode v2 + consent banner + privacy page (inactive until a measurement ID is set)
- [x] Tools verified in headless Chrome: 118 interaction checks (valid + invalid input for every tool), no console errors, no overflow at 375px; tool logic unit-tested in Node
- [ ] Mobile performance 90+: would need build-time pre-rendering of pages (optional follow-up)

## Content (all Beginner → Expert)

| Topic | Tutorial lessons | Interview questions | Verification |
| --- | --- | --- | --- |
| JavaScript | 31 | 35 | Examples reviewed; ASI/TDZ pitfalls fixed |
| TypeScript | 19 | 30 | Type-level examples compiled with `tsc --strict` |
| Python | 26 | 33 | Every code block executed (Python 3.14); pytest suite run |
| Angular | 21 | 36 | Compiled with Angular 22 `ngc` (strictTemplates) |
| React | 21 | 34 | Type-checked (React 19.3, Router 8, TanStack Query 5); Vitest + RTL tests run |
| Node.js | 18 | 30 | CLI and crypto examples executed |
| Express | 15 | 25 | Express 5 routing/async-error behaviour verified with Supertest |
| SQL | 20 | 32 | Queries run on PostgreSQL 17; outputs are real |
| MongoDB | 18 | 28 | Reviewed against MongoDB 8 behaviour |
| Data Analytics | 19 | 27 | Outputs generated by executing code (pandas 3, SciPy, statsmodels, DuckDB, Polars) |
| Data Engineering | 18 | 30 | PySpark 4.2, Delta Lake, Airflow 3 (DagBag), dbt (dbt-duckdb build) executed |
| **Total** | **226** | **340** | |

Learning paths: MEAN, MERN, Data analyst, Data engineer.

## Open TODOs for Prasad

- `site.json` placeholders: `profile.resumeUrl`, `meta.ogImage`, `contact.formEndpoint`
- [x] Custom domain `codewithprasad.in` live (Hostinger DNS → GitHub Pages; `public/CNAME`, `BASE_PATH = '/'`)
- [ ] Tick "Enforce HTTPS" in Settings → Pages (certificate is now issued)
- [ ] Create a GA4 property and put its measurement ID in `GA_MEASUREMENT_ID` (`src/config/site.ts`)
- [ ] Verify the domain in Google Search Console (DNS TXT in Hostinger) and submit `/sitemap.xml`
- [ ] Also submit the sitemap to Bing Webmaster Tools (can import from Search Console)
- `testimonials` (empty → section hidden)
- More projects in `projects`
