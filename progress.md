# Code with Prasad — Goals & Progress

Living tracker for the portfolio + blog + tutorials site. Update the checkboxes as work lands.

## Goals

1. Showcase Prasad (MEAN/MERN, 8+ yrs) professionally to recruiters and clients.
2. Host blog posts on programming languages and technical topics.
3. Host step-by-step tutorials (JavaScript, Python, …) in a "Tutorials Point" style: course index → chapters → lessons with sidebar navigation, prev/next and progress tracking.
4. Static hosting on GitHub Pages; all content versioned in this repo as JSON + Markdown.

## Decisions

| Topic | Decision |
| --- | --- |
| Stack | React 18 + Vite + TypeScript, Tailwind CSS 4, Framer Motion (LazyMotion) |
| Routing | HashRouter (`/#/…`) + generated `404.html` redirect |
| Base path | `/code-with-prasad-web/`, defined once in `src/config/site.ts` |
| Content | Static files in the repo: `public/data/*.json` (indexes) + `public/content/**/*.md` (bodies). JSONBlob was dropped (2026-09-30) — blobs are publicly writable and expire ~3 days after the last write. |
| Markdown | `marked` + `highlight.js` (selected languages) + `DOMPurify` |
| Validation | zod, lenient (invalid list items dropped); `TODO:` strings treated as empty |
| Fonts | Self-hosted via Fontsource (Space Grotesk, Inter, JetBrains Mono) |
| Deploy | GitHub Actions → Pages on push to `main` |

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
- [ ] Enable GitHub Pages (Settings → Pages → Source: GitHub Actions) and push
- [ ] Fill profile from LinkedIn PDF — **blocked: `docs/linkedin-profile.pdf` not present**
- [ ] Mobile performance 90+: would need build-time pre-rendering of pages (optional follow-up)

## Open TODOs for Prasad

- Place LinkedIn PDF at `docs/linkedin-profile.pdf` → then fill `experience`, `education`, `certifications`, `skills`, `location`, summary
- `site.json` placeholders: `profile.location`, `profile.resumeUrl`, `meta.ogImage`, `contact.email`, `contact.formEndpoint`
- `testimonials` (empty → section hidden)
- More projects in `projects`
