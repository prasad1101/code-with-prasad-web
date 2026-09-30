# Code with Prasad

Personal portfolio, technical blog, step-by-step programming tutorials (beginner → expert), interview preparation and free developer tools for **Prasad Pawar** — a static React site hosted on GitHub Pages.

**Live:** https://codewithprasad.in

All content — profile, projects, blog posts, tutorials, interview banks and the tool directory — lives in this repo as JSON and Markdown under `public/`. Edit a file, then run `npm run deploy` (see [Deployment](#deployment)).

> **Standards and practices** (SEO, performance, accessibility, security, testing …) are documented in [PRACTICES.md](PRACTICES.md).

---

## Contents

- [Running locally](#running-locally)
- [Where content lives](#where-content-lives)
- [Editing your profile (`site.json`)](#editing-your-profile-sitejson)
- [Adding a blog post](#adding-a-blog-post)
- [Adding a tutorial or lesson](#adding-a-tutorial-or-lesson)
- [Adding interview questions](#adding-interview-questions)
- [Developer tools](#developer-tools)
- [Schemas](#schemas)
- [SEO and analytics](#seo-and-analytics)
- [Deployment](#deployment)
- [Custom domain](#custom-domain)
- [Project structure](#project-structure)

---

## Running locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173/code-with-prasad-web/
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run deploy` | Build and push `dist/` to the `gh-pages` branch (deploy without Actions) |

## Where content lives

| What | File |
| --- | --- |
| Profile, skills, experience, education, projects, socials, contact | `public/data/site.json` |
| Blog index (titles, dates, tags …) | `public/data/blogs.json` |
| Blog post bodies | `public/content/posts/<slug>.md` |
| Tutorial index (tutorials → chapters → lessons) | `public/data/tutorials.json` |
| Lesson bodies | `public/content/tutorials/<tutorial-slug>/<lesson-slug>.md` |
| Interview topics / question banks | `public/data/interview.json`, `public/content/interview/<slug>.md` |
| Toolkit directory (external tools) | `public/data/tools.json` |
| Images (photo, covers …) | `public/images/` |

The app fetches these files at runtime, validates them (see `src/lib/schemas.ts`) and renders them.

- **Validation is forgiving.** A malformed item (e.g. a project missing its `title`) is skipped rather than breaking the page. If a whole file is unreadable, the page shows an error with a retry button. In development, the browser console lists exactly which fields failed validation.
- **`TODO:` placeholders are hidden.** Any string that starts with `TODO` is treated as empty, so unfinished fields simply don't render — e.g. no "Download resume" button until `resumeUrl` is set.
- **Markdown is sanitised.** All Markdown is rendered with `marked` and sanitised with DOMPurify before it reaches the page.

## Editing your profile (`site.json`)

Open `public/data/site.json`, edit, commit, push. A few notes:

- `profile.avatarUrl` — a path under `public/` (e.g. `images/prasad-photo.jpg`) or a full `https://` URL. Keep images small (the current photo is a 640×640 JPEG, ~60 KB).
- `profile.summary` — Markdown. Separate paragraphs with a blank line (`\n\n` inside the JSON string).
- `profile.typingPhrases` — the rotating words in the hero ("I build with …").
- `stats` — shown in the strip under the hero. Blog post and tutorial lesson counts are added automatically.
- `skills[].items[].level` — optional 0–100. Leave it out to show the skill without a bar.
- `skills[].items[].icon` — an icon key (see [icon keys](#icon-keys)). If omitted, the skill name is tried (`"Node.js"` → `nodejs`).
- `experience[].start` / `end` — `"YYYY-MM"`; use `"present"` for a current role. Durations are calculated.
- `projects[].featured` — featured projects appear on the home page (up to 3); all projects appear on `/#/projects`.
- `contact.formEndpoint` — a [Formspree](https://formspree.io)-style `https://` endpoint. Leave empty to hide the form.
- Empty lists (`experience`, `education`, `testimonials`, `certifications`) hide their section.

## Adding a blog post

1. **Write the post** as Markdown in `public/content/posts/<slug>.md`. The slug must be lowercase letters, numbers and hyphens, e.g. `angular-signals-explained`. Don't repeat the title as an `# H1` — the page renders the title for you. Use `##` and `###` headings; they build the table of contents.

   ````markdown
   Signals are Angular's new reactive primitive…

   ## Creating a signal

   ```ts
   const count = signal(0)
   ```
   ````

   Supported code languages for highlighting: `js`, `ts`, `jsx`/`tsx`, `python`, `bash`/`sh`, `json`, `html`, `css`, `sql`, `yaml`, `text`.

2. **Register it** in `public/data/blogs.json` by adding an entry to `posts` (order doesn't matter — posts are sorted by date):

   ```json
   {
     "slug": "angular-signals-explained",
     "title": "Angular Signals, Explained",
     "excerpt": "What signals are, how they differ from RxJS, and when to use each.",
     "coverImage": "",
     "tags": ["angular", "typescript"],
     "category": "Angular",
     "publishedAt": "2026-10-05",
     "updatedAt": "",
     "featured": false,
     "draft": false
   }
   ```

3. **Preview** with `npm run dev` and open `/#/blog/angular-signals-explained`.
4. **Publish**: commit and push to `main`.

Tips:

- `"draft": true` hides a post from the site while you work on it.
- `"featured": true` shows the post as the large hero card on the blog page (the first featured post is used).
- `coverImage` is optional — without it a generated gradient cover (using the first tag's icon) is shown. Covers work best at 1600×800.
- Reading time is calculated from the Markdown; don't store it.
- Short posts can put the Markdown straight into the JSON as a `"content"` field instead of a separate `.md` file.
- Link to other pages with root-relative links, e.g. `[the event loop](/blog/nodejs-event-loop)` — they're rewritten for the hash router automatically.

## Adding a tutorial or lesson

Tutorials are organised as **tutorial → chapters → lessons**, like Tutorials Point. Lessons are read in the order they appear in `tutorials.json`, and prev/next links follow that order.

**Add a lesson to an existing tutorial**

1. Write `public/content/tutorials/<tutorial-slug>/<lesson-slug>.md` (same Markdown rules as blog posts).
2. Add `{ "slug": "<lesson-slug>", "title": "Lesson title" }` to the right chapter's `lessons` array in `public/data/tutorials.json`.

**Add a new tutorial** (e.g. TypeScript)

1. Create `public/content/tutorials/typescript/` with one `.md` file per lesson.
2. Add an entry to `tutorials` in `tutorials.json`:

   ```json
   {
     "slug": "typescript",
     "title": "TypeScript Tutorial",
     "language": "TypeScript",
     "icon": "typescript",
     "level": "Intermediate",
     "description": "Add static types to JavaScript…",
     "updatedAt": "2026-10-10",
     "draft": false,
     "chapters": [
       {
         "title": "Getting Started",
         "lessons": [
           { "slug": "introduction", "title": "Introduction to TypeScript" },
           { "slug": "setup", "title": "Setting Up TypeScript" }
         ]
       }
     ]
   }
   ```

Readers can mark lessons complete; progress is kept in their browser's `localStorage`.

## Adding interview questions

Interview prep lives in its own section (`/#/interview`), separate from tutorials.

1. Each topic is registered in `public/data/interview.json`:

   ```json
   { "slug": "python", "title": "Python", "icon": "python", "category": "Languages", "description": "…", "draft": false }
   ```

2. Its questions live in `public/content/interview/<slug>.md`. Every `## ` heading starts a new question; the optional line below it sets the level and tags; everything after is the Markdown answer (use `###` for sub-headings inside answers):

   ````markdown
   ## What is a closure?
   Level: Intermediate | Tags: functions, scope

   A closure is a function together with the variables from the scope where it was defined…

   ```js
   const counter = createCounter()
   ```
   ````

   Levels: `Beginner`, `Intermediate`, `Advanced`, `Expert`. Question ids (used in deep links) are generated from the question text, so avoid renaming published questions.

## Developer tools

The Tools section (`/#/tools`) has two tabs.

**Online tools** are 18 React components in `src/tools/tools/`, all running entirely in the browser (nothing is uploaded). Each is registered in `src/tools/registry.ts` with its slug, title, category, icon, search keywords and a lazy `import()`, so each tool — and heavy libraries such as `sql-formatter`, `yaml`, `diff`, `papaparse` and `cronstrue` — loads only when opened. Pure logic lives in `src/tools/logic.ts` (no React, easy to unit-test) and shared inputs/outputs in `src/tools/ui.tsx`.

To add a tool: create `src/tools/tools/MyTool.tsx` with a default-exported component, then add an entry to `TOOLS` in the registry. It appears on the Tools page, gets its own URL (`/#/tools/<slug>`) and shows up in search.

**Toolkit directory** is `public/data/tools.json` — a curated list of external apps and services:

```json
{
  "name": "DBeaver",
  "url": "https://dbeaver.io/",
  "category": "Databases",
  "pricing": "Free & open source",
  "description": "A universal database client for …",
  "tags": ["sql", "client"],
  "featured": true
}
```

`pricing` is one of `Free`, `Free & open source`, `Freemium`, `Paid` (the "Free only" filter keeps the first two). `featured` adds an "Essential" badge. `category` must match a name in `categories`, whose order sets the section order; each category's `icon` is one of `code`, `ai`, `api`, `database`, `git`, `docker`, `terminal`, `package`, `browser`, `chart`, `design`, `cloud`, `book`, `zap`.

## Tutorial levels, categories and learning paths

- `tutorials[].category` groups courses on the Tutorials page (e.g. `Languages`, `Frontend`, `Backend`, `Databases`, `Data`).
- `chapters[].level` (`Beginner` → `Expert`) shows a badge on each chapter and lesson, and the course card shows the range.
- `paths` in `tutorials.json` defines learning paths shown at the top of the Tutorials page:

  ```json
  { "slug": "mern", "title": "MERN stack developer", "description": "…", "tutorials": ["javascript", "typescript", "nodejs", "express", "mongodb", "react"] }
  ```

## Schemas

The authoritative definitions are the zod schemas in `src/lib/schemas.ts`. Summary (`?` = optional):

### `site.json`

```jsonc
{
  "meta": { "siteTitle": "", "tagline": "", "description": "", "ogImage": "", "themeDefault": "dark" },
  "profile": {
    "name": "Prasad Pawar",            // required
    "role": "", "yearsOfExperience": 8, "location": "",
    "avatarUrl": "", "resumeUrl": "", "availableForWork": true,
    "typingPhrases": [""], "summary": "markdown"
  },
  "socials": [{ "platform": "linkedin | github | x | youtube | medium | dev | website", "url": "" }],
  "stats": [{ "label": "Years experience", "value": "8+" }],
  "skills": [{ "category": "Frontend", "items": [{ "name": "React", "level?": 90, "icon?": "react" }] }],
  "experience": [{ "company": "", "role": "", "start": "YYYY-MM", "end": "YYYY-MM | present", "location?": "", "highlights": [""], "tech": [""] }],
  "education": [{ "school": "", "degree?": "", "field?": "", "start?": "", "end?": "" }],
  "projects": [{ "slug": "", "title": "", "summary": "", "image?": "", "tech": [""], "liveUrl?": "", "repoUrl?": "", "featured": true }],
  "testimonials": [{ "name": "", "role?": "", "quote": "", "avatar?": "" }],
  "certifications": [{ "name": "", "issuer?": "", "year?": 2024, "url?": "" }],
  "contact": { "email": "", "formEndpoint": "" }
}
```

`themeDefault` is used only when a visitor has no saved choice and their OS reports no light/dark preference.

### `blogs.json`

```jsonc
{
  "categories": ["JavaScript", "Node.js", "React", "Angular", "MongoDB", "DevOps", "System Design"],
  "posts": [{
    "slug": "kebab-case",               // required; body at public/content/posts/<slug>.md
    "title": "",                        // required
    "excerpt": "", "coverImage?": "", "tags": [""], "category": "",
    "publishedAt": "YYYY-MM-DD",        // required
    "updatedAt?": "YYYY-MM-DD",
    "featured": false, "draft": false,
    "content?": "inline markdown (instead of the .md file)"
  }]
}
```

### `tutorials.json`

```jsonc
{
  "tutorials": [{
    "slug": "javascript", "title": "JavaScript Tutorial", "language": "JavaScript",
    "icon?": "javascript", "level?": "Beginner", "description": "", "updatedAt?": "", "draft": false,
    "chapters": [{
      "title": "Getting Started",
      "lessons": [{ "slug": "introduction", "title": "Introduction", "content?": "inline markdown" }]
    }]
  }]
}
```

### Icon keys

`react`, `angular`, `nodejs`, `express`, `mongodb`, `mongoose`, `javascript`, `typescript`, `python`, `html`, `css`, `tailwind`, `bootstrap`, `sass`, `git`, `docker`, `kubernetes`, `aws`, `gcp`, `firebase`, `mysql`, `postgresql`, `redis`, `nextjs`, `nestjs`, `redux`, `rxjs`, `jest`, `linux`, `graphql`, `ionic`, `jquery`, `postman`, `jira`, `jenkins`, `githubactions`, `nginx`, `npm`, `vite`, `webpack`, `socketio`, `django`, `flask`, `fastapi`, `electron`, `flutter`, `vercel`, `netlify`. Anything else falls back to a generic code icon. Add more in `src/lib/techIcons.ts`.

## SEO and analytics

**Static page per route.** After `vite build`, `scripts/seo-pages.ts` (a Vite plugin) writes `dist/<route>/index.html` for every page — home, blog posts, tutorials, every lesson, interview topics, every tool, projects and privacy (276 pages today). Each carries its own `<title>`, meta description, canonical URL, Open Graph / Twitter tags (so LinkedIn and WhatsApp previews are page-specific) and JSON-LD structured data: `WebSite` + `Person`, `BlogPosting`, `Course`, `TechArticle`, `WebApplication` + `FAQPage` for tools, and `BreadcrumbList` everywhere. It also writes `sitemap.xml` (with git-based `lastmod`), `robots.txt` and `404.html`. New content is picked up automatically on the next build.

**One source of truth.** Titles and descriptions come from `src/lib/seo.ts`, used by both the build step and the `<Seo>` component, so the static tags match what the app renders. Canonical URLs end in `/` because GitHub Pages serves `<route>/index.html` there (the slash-less URL 301-redirects).

**Social images** are 1200×630 PNGs in `public/images/og/` (site sections plus one per tool).

**Google Analytics 4.** Set `GA_MEASUREMENT_ID` in `src/config/site.ts` (e.g. `'G-AB12CD34EF'`) and redeploy. Analytics only loads on the production domain, uses Consent Mode v2 (no cookies until the visitor clicks *Allow analytics* in the banner; the choice can be changed on `/privacy`), and sends a `page_view` on every route change. `trackEvent(name, params)` in `src/lib/analytics.ts` sends custom events.

**Google Search Console.** Add a *Domain* property for `codewithprasad.in` and verify it with the TXT record Google gives you (Hostinger → DNS), or put the HTML-tag token in `GOOGLE_SITE_VERIFICATION` in `src/config/site.ts`. Then submit `https://codewithprasad.in/sitemap.xml`.

## Deployment

GitHub Actions is unavailable on this account, so the site is deployed from a branch:

```bash
npm run deploy
```

This builds locally and force-pushes `dist/` to the `gh-pages` branch (**Settings → Pages → Source → Deploy from a branch → `gh-pages` / `(root)`**). `public/.nojekyll` stops GitHub from running Jekyll on the output. `.github/workflows/deploy.yml` is kept for the day Actions is enabled.

The site uses clean URLs (`/tools/jwt-decoder/`). GitHub Pages can't rewrite URLs to a single-page app, so the build writes a real `index.html` for every route (see [SEO](#seo-and-analytics)); unknown URLs get `404.html`, which loads the app's 404 page with a real 404 status. Old hash links (`/#/tools/jwt-decoder`) are rewritten to clean URLs on load.

## Custom domain

The site is served at **codewithprasad.in**:

- `src/config/site.ts` has `BASE_PATH = '/'` and `SITE_ORIGIN = 'https://codewithprasad.in'` (asset paths, canonical URLs and the `404.html` redirect all read from these).
- `public/CNAME` contains `codewithprasad.in`, which tells GitHub Pages the domain on every deploy.
- DNS is managed in Hostinger: four `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, four `AAAA` records → `2606:50c0:8000::153` … `2606:50c0:8003::153`, and a `CNAME` for `www` → `prasad1101.github.io`.
- The old `prasad1101.github.io/code-with-prasad-web/` URL and `www.` redirect to the domain automatically.

## Project structure

```
public/
  data/                 site.json, blogs.json, tutorials.json, interview.json, tools.json
  content/              posts/*.md, tutorials/<tutorial>/*.md, interview/*.md
  CNAME                 custom domain for GitHub Pages
  images/og/            social preview images
  images/               photo and other images
scripts/
  deploy.mjs            build + push dist/ to gh-pages
  seo-pages.ts          build plugin: per-route HTML, sitemap.xml, robots.txt, 404.html
src/
  config/               site.ts (base path, origin, GA id), dataSources.ts (content URLs)
  lib/                  schemas (zod), data fetching, markdown rendering, helpers
  hooks/                content loading, theme, scroll-spy, tutorial progress
  components/
    layout/             navbar, footer, theme toggle, scroll-to-top, reading progress
    home/               hero, stats, about, skills, experience, work, contact …
    blog/               post card, article renderer, table of contents, share buttons
    tutorials/          tutorial card, lesson outline
    interview/          topic card, question item, practice mode
    tools/              tool and directory cards
    ui/                 buttons, chips, cards, skeletons, SEO tags
  tools/                developer tools: registry, shared UI, pure logic, tools/*.tsx (one per tool)
  pages/                Home, BlogList, BlogPost, Tutorials, TutorialOverview, TutorialLesson,
                        Interview, InterviewTopic, Tools, ToolPage, Projects, Privacy, NotFound
docs/                   private source material — git-ignored, never published
```

**Stack:** React 18, TypeScript, Vite, Tailwind CSS 4, Framer Motion, React Router (clean URLs, pre-generated route pages), react-helmet-async, marked + highlight.js + DOMPurify, zod, sql-formatter, yaml, diff, papaparse, cronstrue (tools, lazy-loaded), self-hosted fonts (Space Grotesk, Inter, JetBrains Mono).
