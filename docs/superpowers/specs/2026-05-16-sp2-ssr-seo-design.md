# SP2 — Vike SSR + SEO/GEO Design

**Status:** Approved design — ready for implementation planning.
**Date:** 2026-05-16
**Sub-project:** SP2 of the JobsSearch (HireFlow) frontend roadmap (SP0 testing ✅ → SP1 decompose `App.jsx` → **SP2** → SP3 → SP4).

## Problem

The deployed site at `https://jobssearch.work` ships an empty shell:

```html
<body>
  <div id="root"></div>
</body>
```

The whole homepage is ~4.9 KB of `<head>` meta tags. `frontend/scripts/prerender.mjs` only templates `<head>` tags per route — it never renders body content. Consequently:

- JS-disabled crawlers (GPTBot, ClaudeBot, PerplexityBot) see zero content.
- Googlebot must defer to a best-effort JS render pass.
- `JobPosting` JSON-LD that exists in `App.jsx` is injected client-side and is invisible to crawlers, so Google for Jobs cannot index any listing.

SP2 makes the HTML response contain real, server-rendered content and bakes in the SEO/GEO requirements from an external review: server-rendered structured data, long-tail hub pages, per-job OG images, expired-job handling, live sitemaps, and the Google Indexing API.

## Goal

Adopt Vike to server-render the public surface of the app so crawlers and AI answer engines receive complete HTML with valid structured data, and the site is positioned for Google for Jobs and long-tail organic traffic.

## Prerequisite

**SP1 must land first.** SP1 decomposes the ~5,700-line `frontend/src/App.jsx` monolith into per-page/per-feature modules. Vike's filesystem routing maps directories to those component modules; SP2 cannot begin until the page modules exist.

## Non-Goals

- No change to the backend `jobs` table schema (no `expires_at` column). `validThrough` is derived.
- No curated role taxonomy or title parsing — hub taxonomy is derived from already-structured data.
- No recruiter-facing UI changes.
- The authenticated app (dashboards, onboarding, chat, auth screens) is **not** server-rendered; it stays a client-only SPA.
- Performance/Core-Web-Vitals tuning beyond what SSR + edge caching deliver is out of scope (later sub-project).

---

## Architecture

### Stack

Adopt **Vike** with the **`vike-react`** integration, layered onto the existing Vite build. Vike replaces `frontend/scripts/prerender.mjs` and `frontend/scripts/generate-sitemap.mjs` entirely.

### Rendering topology — three modes assigned per route

| Route group | Mode | Rationale |
|---|---|---|
| Marketing — `/`, `/features`, `/pricing`, `/about`, `/roadmap`, `/terms`, `/privacy`, `/help`, `/coming-soon` | **SSG** — prerendered at build (`prerender: true`) | Static content; fastest TTFB; no runtime cost |
| Blog — `/blog`, `/blog/{slug}` | **SSR on-request + edge cache** | Content from backend; rides the same SSR machinery |
| Jobs — job detail `/jobs/{title-slug}-{id}`, job list `/jobs`, hub pages (see below) | **SSR on-request + short edge cache** (`Cache-Control: s-maxage=300, stale-while-revalidate=600`) | Live data; expired jobs reflect within minutes; cache protects function load + Core Web Vitals |
| Authenticated app — seeker/recruiter/company dashboards, onboarding, chat, auth screens | **SPA** (`ssr: false`) | Behind auth, zero SEO value; renders client-only, isolated to avoid hydration mismatch |

### Data flow for an SSR page

```
request
  → Vercel serverless function
  → Vike +data hook fetches from backend API (hireflow-api.vercel.app)
  → React renders to HTML (page content + JSON-LD inline in <head>)
  → response with Cache-Control headers
  → browser hydrates
```

### Resilience

When the backend is slow or unavailable at render time, SSR pages degrade gracefully — `stale-while-revalidate` serves the last good response, and a cold miss renders a "temporarily unavailable" shell rather than a 500. Consistent with the existing backend 503 handler.

---

## Components

### 1. Vike app skeleton (`frontend/`)

- `frontend/pages/` — filesystem-routed page directories, each with `+Page.jsx`, `+config.js` (render mode), and where needed `+data.js` (server data fetch).
- `frontend/renderer/` — `vike-react` server/client entry, the shared HTML document shell (`<head>` slot for per-page meta + JSON-LD).
- `frontend/vite.config.js` — add the Vike plugin; keep the existing Vitest `test` block and `VITE_API_URL` define.
- Build command changes: Vike handles SSG prerender; `prerender.mjs` and `generate-sitemap.mjs` are deleted.

### 2. Structured-data module (`frontend/src/schema/`)

Pure functions, no React, unit-tested. Each returns a plain JSON-LD object; the renderer serializes them into `<script type="application/ld+json">` server-side.

- `jobPosting(job)` — `JobPosting` from a `JobResponse`.
- `organization()`, `website()` — site-wide; `website()` includes a `SearchAction` targeting `/jobs?search={query}`.
- `breadcrumbList(trail)` — for job, hub, and blog pages.
- `itemList(jobs)` — `ItemList` of `JobPosting`s for job-list and hub pages.
- `faqPage(qa)` — `FAQPage` for hub pages.

**`JobPosting` field mapping** from `JobResponse`:

| JSON-LD field | Source |
|---|---|
| `title` | `title` |
| `description` | `description` (HTML) |
| `datePosted` | `created_at` |
| `validThrough` | **derived**: `created_at + 60 days` |
| `employmentType` | `type` → `FULL_TIME` / `PART_TIME` / `CONTRACTOR` / `INTERN` |
| `hiringOrganization` | `Organization` from `company_name` |
| `jobLocation` | **best-effort**: free-text `location` → `PostalAddress.addressLocality`; country from a config default |
| `jobLocationType` | `"TELECOMMUTE"` when `remote === true` |
| `baseSalary` | `MonetaryAmount` from `salary_min` / `salary_max`; `currency` from a config default; omitted when both absent |
| `directApply` | `true` |

Two accepted approximations, both validated against Google's Rich Results Test: `jobLocation` (free-text location, no structured city/region/postcode) and `baseSalary.currency` (backend stores no currency). Adding backend fields for these is explicitly out of scope.

### 3. Hub pages

Long-tail SEO landing pages, taxonomy **derived at request time** from live job data — no curated lists, no title parsing.

- **Routes:** `/jobs/{skill}` (from `required_skills`), `/jobs/remote` (from `remote === true`), `/jobs/location/{city}` (slugified `location`), and combinations `/jobs/{skill}/remote`, `/jobs/{skill}/location/{city}`.
- **Indexability threshold:** a hub renders fully and is indexable only when **≥ 5 active jobs** match. Below threshold the page still renders but emits `noindex,follow` (avoids thin/duplicate pages).
- **Page content:** AI-generated intro copy, the live matching job listings (`ItemList` JSON-LD), an FAQ block (`FAQPage` JSON-LD), and internal links to sibling hubs (same skill in other cities; same city for other skills).
- **Hub copy** comes from the backend (see Backend Changes).

### 4. OG images

- A `@vercel/og` edge route `/og/job/{id}` renders a per-job card image (title, company, location, salary).
- Each job page references it via `og:image` / `twitter:image`.
- Marketing and hub pages use a static fallback OG image.

### 5. Sitemaps — live SSR routes

Replaces the single build-time `sitemap.xml` with a live, always-current sitemap index (edge-cached ~1 hour):

- `/sitemap.xml` — index referencing the four below.
- `/sitemap-static.xml` — marketing routes.
- `/sitemap-blog.xml` — blog posts.
- `/sitemap-jobs.xml` — **active jobs only**; closed/expired jobs drop out automatically.
- `/sitemap-hubs.xml` — **above-threshold hubs only**.

### 6. Crawlability files

- `frontend/public/robots.txt` — add a `Google-Extended` user-agent block; point `Sitemap:` at `/sitemap.xml` (the index).
- `frontend/public/llms.txt` — fix the broken `/ideas` link (route is `/roadmap`); add job and hub sections.

### 7. Expired-job handling

A closed/expired job URL returns **HTTP 200**, never 404:

- The SSR page renders a "This role has closed" state.
- `JobPosting` JSON-LD is still emitted, with `validThrough` in the past.
- The page surfaces similar live roles.

This follows Google's JobPosting guidance and preserves accumulated link equity.

### 8. Thin/duplicate protection

- Job-list filter permutations and sub-threshold hubs emit `noindex,follow`.
- Every page emits a self-referential `<link rel="canonical">`.

---

## Backend Changes

SP2 touches the backend in exactly two deliberately-small places. Everything else is frontend.

### A. Hub copy — `hub_content` table + `GET /api/seo/hub/{slug}`

- New table `hub_content`: `slug` (PK), `copy` (text, 200–400 words), `faq_json` (JSONB), `generated_at` (timestamp).
- New public route `GET /api/seo/hub/{slug}`:
  - Cache hit → return stored copy + FAQ.
  - Cache miss → generate via the existing AI service (`api/services/ai.py`), store, return.
- The Vike hub-page `+data` hook fetches this endpoint server-side.

### B. Google Indexing API notifier

- A new backend service module wrapping the Google Indexing API, authenticated with a **service-account JSON credential** stored as a backend env secret.
- Called from the existing job lifecycle handlers in `backend/api/routes/jobs.py`:
  - job `create` → `URL_UPDATED` for the new job URL.
  - job `close` / `delete` → `URL_DELETED`.
- Failures are logged and **non-fatal** — they never block the job operation.

---

## Testing

The **SP0 e2e suite is the regression net** and must stay green through every phase of SP2.

New tests SP2 adds:

- **SSR assertion tests (Playwright):** `request.get()` fetches raw HTML with no JS execution and asserts that job pages contain real body content and a valid `JobPosting` JSON-LD blob. This codifies the `curl` check that exposed the empty shell.
- **Schema unit tests (Vitest):** every JSON-LD builder in `frontend/src/schema/` tested as a pure function.
- **Manual gate:** Google Rich Results Test run against a sample of job and hub pages before production cutover.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| SP1 not yet complete | SP2 is gated on SP1; do not start SP2 until the page modules exist. |
| Hydration mismatch between SSR and client | The logged-in SPA app is isolated behind `ssr: false`; SSR pages are pure/deterministic. |
| Backend unavailable at render time | `stale-while-revalidate` + graceful "temporarily unavailable" shell; never 500. |
| AI hub-copy cost / quality | Bounded by the ≥5-job indexability threshold (fewer hubs) and one-time generation per slug, cached in `hub_content`. |
| Cold-start latency on SSR functions | Short edge cache absorbs repeat traffic; marketing pages stay fully static. |
| SP0 e2e selectors drift under Vike routing | Vike makes nav real `<a>` links; update e2e selectors as needed and re-verify each phase. |

---

## Implementation Sequencing

The implementation plan (produced next via the `writing-plans` skill) will phase SP2 into ~6 incrementally-shippable chunks, each keeping the e2e suite green:

1. Vike skeleton + marketing pages as SSG.
2. Job-detail SSR + `JobPosting` / `Organization` / `WebSite` / `BreadcrumbList` schema.
3. Hub pages + the backend `hub_content` table and `/api/seo/hub/{slug}` endpoint.
4. OG images + live sitemap routes + `robots.txt` / `llms.txt` updates.
5. Google Indexing API notifier in the backend job handlers.
6. SSR e2e assertion tests + production cutover.

## Success Criteria

- `curl https://jobssearch.work/` and a sample job URL return full body content — headings, copy, listings — with no JS execution.
- Every job-detail page emits a `JobPosting` JSON-LD blob that passes Google's Rich Results Test.
- `Organization`, `WebSite` (+`SearchAction`), and `BreadcrumbList` schemas are present site-wide.
- `/sitemap.xml` is a live index; `/sitemap-jobs.xml` contains only active jobs.
- Hub pages exist for skill / location / remote intersections with ≥5 active jobs and carry unique AI copy + FAQ schema.
- Closed jobs return 200 with a "role closed" page, not 404.
- The backend notifies the Google Indexing API on job publish and close.
- The SP0 e2e suite remains green; new SSR-assertion and schema unit tests pass.
