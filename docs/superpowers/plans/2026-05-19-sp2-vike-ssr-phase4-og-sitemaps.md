# SP2 Vike SSR — Phase 4: Deploy Config, OG Images, Sitemaps, Crawlability

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Vike SP2 build deploy correctly on Vercel, generate complete multi-sitemap coverage (static + blog + jobs + hubs), serve per-job Open Graph images, refresh the crawlability files, and clear two small recommended cleanups.

**Architecture:** Switch the frontend build to the `vite-plugin-vercel` adapter so Vike SSR routes deploy as serverless functions. Sitemaps are generated at build time by a script that fetches live job/blog data and derives the indexable hub set — written as static files into the build output (current as of each deploy; no serverless routing). Per-job OG images are a `@vercel/og` Vercel function. `robots.txt`/`llms.txt` are refreshed by hand.

**Tech Stack:** Vike + `vite-plugin-vercel`, `@vercel/og`, Node build scripts, Vitest; FastAPI backend (cleanup only).

---

## Background & Decisions

- Spec: `docs/superpowers/specs/2026-05-16-sp2-ssr-seo-design.md` §4 (OG images), §5 (sitemaps), §6 (crawlability). This is **Phase 4** of SP2. Phases 1–3 (Vike skeleton, marketing SSG, job-detail + hub SSR) are merged.
- **Critical fix:** `frontend/vercel.json` still carries the pre-Vike SPA config (`outputDirectory: dist`, `rewrites: /(.*) → /index.html`). Vike emits `dist/client/` + `dist/server/` and SSR functions; the SPA rewrite is wrong and breaks deployment. Task 1 fixes this with `vite-plugin-vercel`, Vike's documented Vercel adapter (https://vike.dev/vercel).
- **Sitemaps are build-time, not live SSR.** The SP2 spec described live SSR sitemap routes; this plan generates them as static files at build time instead. Rationale: build-time generation is fully verifiable in this environment, needs no serverless functions or route rewrites, and is current as of each deploy. The to-the-minute freshness the spec wanted is a deferred nice-to-have. A closed job lingers in the sitemap only until the next deploy.
- **Verification ceiling (honest):** Tasks 1 and 5 touch Vercel deployment behavior that **cannot be fully verified in this environment** — `npm run build` succeeding is necessary but not sufficient. Those tasks' final step is "confirm on a Vercel preview deploy", which the human runs. Tasks 2, 3, 4, 6 are fully verifiable locally.
- Frontend at `frontend/`; backend at `backend/`. The Bash working directory resets between turns — use absolute paths. Repo root: `c:\Users\sreek\myprojects\jobshunter\hireflow`.
- Backend `GET /api/jobs` returns active jobs as `JobResponse[]` (`id`, `title`, `required_skills`, `nice_skills`, `remote`, `location`, `created_at`, `status`, …). `GET /api/blog` returns published posts; each has a `slug`.

---

## Task 1: Switch to the `vite-plugin-vercel` deploy adapter

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.js`
- Delete: `frontend/vercel.json`

- [ ] **Step 1: Install the adapter**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm install vite-plugin-vercel`
Expected: `vite-plugin-vercel` added to `dependencies`. (It auto-loads `@vite-plugin-vercel/vike` for Vike integration — do not add that separately.)

- [ ] **Step 2: Add the `vercel()` plugin to `frontend/vite.config.js`**

The file currently is:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';

export default defineConfig({
  plugins: [react(), vike()],
  server: { /* ... */ },
  build: { /* ... */ },
  define: { /* ... */ },
});
```

Add the import and the plugin. Replace the import lines and the `plugins` array:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { vercel } from 'vite-plugin-vercel/vite';
```

```js
  plugins: [react(), vike(), vercel()],
```

Leave `server`, `build`, and `define` exactly as they are.

- [ ] **Step 3: Delete the stale `vercel.json`**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow && git rm frontend/vercel.json`
Expected: removed. `vite-plugin-vercel` emits `.vercel/output/` (Vercel Build Output API v3); the old SPA `rewrites`/`outputDirectory` no longer apply. The asset cache headers it also carried are reproduced by Vike's own hashed-asset output.

- [ ] **Step 4: Build and verify the Vercel output is produced**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm run build`
Expected: build succeeds AND a `frontend/.vercel/output/` directory now exists containing `config.json` and `functions/` (the SSR serverless function) and `static/`. Run `ls .vercel/output` to confirm.

If the build fails or `.vercel/output` is absent, the `vite-plugin-vercel` API may differ for the installed version — consult its README (`frontend/node_modules/vite-plugin-vercel/readme.md`) and adjust the plugin setup; report what changed.

- [ ] **Step 5: Add `.vercel` to gitignore**

Confirm the repo-root `.gitignore` ignores `.vercel/` (it currently has a `.vercel` entry — verify it covers `frontend/.vercel/`; if not, add `frontend/.vercel/`).

- [ ] **Step 6: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js .gitignore
git commit -m "$(cat <<'EOF'
build: deploy Vike via vite-plugin-vercel adapter (SP2 phase 4)

Replaces the stale pre-Vike SPA vercel.json (rewrote everything to a
nonexistent /index.html) with Vike's documented Vercel adapter, which
emits the Build Output API artifacts and SSR serverless functions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: VERCEL-PREVIEW VERIFICATION (human-run, flag this).** A local build cannot prove the deploy works. Report to the controller: a Vercel preview deploy must confirm that `/` (SSG), `/features` (SSG), a job-detail URL (SSR), and a hub URL like `/jobs/react` (SSR) all return 200 with rendered HTML. Mark this task DONE_WITH_CONCERNS noting the preview-deploy step is outstanding.

---

## Task 2: Sitemap XML builder (pure functions)

**Files:**
- Create: `frontend/src/lib/sitemap.js`
- Test: `frontend/src/lib/sitemap.test.js`

- [ ] **Step 1: Write the failing test** — `frontend/src/lib/sitemap.test.js`

```js
import { describe, it, expect } from 'vitest';
import { urlsetXml, sitemapIndexXml, deriveHubEntries } from './sitemap';

describe('urlsetXml', () => {
  it('builds a urlset with loc entries', () => {
    const xml = urlsetXml([
      { loc: 'https://jobssearch.work/' },
      { loc: 'https://jobssearch.work/features' },
    ]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://jobssearch.work/</loc>');
    expect(xml).toContain('<loc>https://jobssearch.work/features</loc>');
    expect(xml.trim().endsWith('</urlset>')).toBe(true);
  });
  it('escapes ampersands in loc URLs', () => {
    const xml = urlsetXml([{ loc: 'https://jobssearch.work/jobs?a=1&b=2' }]);
    expect(xml).toContain('a=1&amp;b=2');
    expect(xml).not.toContain('a=1&b=2');
  });
});

describe('sitemapIndexXml', () => {
  it('builds a sitemap index referencing child sitemaps', () => {
    const xml = sitemapIndexXml([
      'https://jobssearch.work/sitemap-static.xml',
      'https://jobssearch.work/sitemap-jobs.xml',
    ]);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://jobssearch.work/sitemap-static.xml</loc>');
    expect(xml.trim().endsWith('</sitemapindex>')).toBe(true);
  });
});

describe('deriveHubEntries', () => {
  const jobs = (n, props) => Array.from({ length: n }, (_, i) => ({
    id: `job_${i}`, title: 't', required_skills: [], nice_skills: [], remote: false, location: '', ...props,
  }));
  it('emits a hub only when >=5 active jobs match', () => {
    const data = [
      ...jobs(5, { required_skills: ['React'] }),
      ...jobs(3, { required_skills: ['Vue'] }),
    ];
    const paths = deriveHubEntries(data);
    expect(paths).toContain('/jobs/react');
    expect(paths).not.toContain('/jobs/vue');
  });
  it('emits the remote hub when >=5 remote jobs exist', () => {
    const paths = deriveHubEntries(jobs(6, { remote: true }));
    expect(paths).toContain('/jobs/remote');
  });
  it('emits a location hub when >=5 jobs share a city', () => {
    const paths = deriveHubEntries(jobs(5, { location: 'Austin, TX' }));
    expect(paths).toContain('/jobs/location/austin-tx');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm test -- src/lib/sitemap.test.js`
Expected: FAIL — `Cannot find module './sitemap'`.

- [ ] **Step 3: Implement `frontend/src/lib/sitemap.js`**

```js
import { toSlug } from './slug';

const HUB_THRESHOLD = 5;

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function urlsetXml(entries) {
  const body = entries
    .map((e) => `  <url><loc>${escapeXml(e.loc)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function sitemapIndexXml(sitemapUrls) {
  const body = sitemapUrls
    .map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc></sitemap>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

// Derives the indexable hub URL paths from a list of active jobs:
// any skill / city / remote dimension with >= HUB_THRESHOLD matching jobs.
export function deriveHubEntries(jobs) {
  const skillCounts = new Map();
  const cityCounts = new Map();
  let remoteCount = 0;

  for (const job of jobs) {
    const skills = new Set(
      [...(job.required_skills || []), ...(job.nice_skills || [])].map((s) => toSlug(String(s))),
    );
    for (const s of skills) {
      if (s) skillCounts.set(s, (skillCounts.get(s) || 0) + 1);
    }
    const city = toSlug(job.location || '');
    if (city) cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    if (job.remote) remoteCount += 1;
  }

  const paths = [];
  if (remoteCount >= HUB_THRESHOLD) paths.push('/jobs/remote');
  for (const [skill, n] of skillCounts) {
    if (n >= HUB_THRESHOLD) paths.push(`/jobs/${skill}`);
  }
  for (const [city, n] of cityCounts) {
    if (n >= HUB_THRESHOLD) paths.push(`/jobs/location/${city}`);
  }
  return paths;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm test -- src/lib/sitemap.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add frontend/src/lib/sitemap.js frontend/src/lib/sitemap.test.js
git commit -m "$(cat <<'EOF'
feat: add sitemap XML builders and hub-derivation helper (SP2 phase 4)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Build-time sitemap generation

**Files:**
- Create: `frontend/scripts/build-sitemaps.mjs`
- Modify: `frontend/package.json` (the `build` script)

- [ ] **Step 1: Create `frontend/scripts/build-sitemaps.mjs`**

```js
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { urlsetXml, sitemapIndexXml, deriveHubEntries } from '../src/lib/sitemap.js';

const SITE = 'https://jobssearch.work';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'dist', 'client');
const apiBase = (process.env.VITE_API_URL || '').replace(/\/$/, '');

const STATIC_ROUTES = [
  '/', '/features', '/pricing', '/about', '/roadmap',
  '/terms', '/privacy', '/help', '/blog',
];

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function jobUrl(job) {
  const slug = String(job.title || '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `/jobs/${slug}-${job.id}`;
}

async function main() {
  const jobs = apiBase ? await fetchJson(`${apiBase}/api/jobs?limit=1000`) : [];
  const posts = apiBase ? await fetchJson(`${apiBase}/api/blog`) : [];

  const files = {
    'sitemap-static.xml': urlsetXml(STATIC_ROUTES.map((r) => ({ loc: `${SITE}${r}` }))),
    'sitemap-blog.xml': urlsetXml(
      posts.filter((p) => p.slug).map((p) => ({ loc: `${SITE}/blog/${p.slug}` })),
    ),
    'sitemap-jobs.xml': urlsetXml(jobs.map((j) => ({ loc: `${SITE}${jobUrl(j)}` }))),
    'sitemap-hubs.xml': urlsetXml(
      deriveHubEntries(jobs).map((p) => ({ loc: `${SITE}${p}` })),
    ),
  };
  files['sitemap.xml'] = sitemapIndexXml(
    Object.keys(files).map((name) => `${SITE}/${name}`),
  );

  for (const [name, xml] of Object.entries(files)) {
    await writeFile(path.join(outDir, name), xml, 'utf8');
  }
  console.log(
    `Sitemaps written: ${jobs.length} jobs, ${posts.length} blog posts, ` +
    `${deriveHubEntries(jobs).length} hubs.`,
  );
}

main().catch((err) => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Wire it into the build** — in `frontend/package.json`, change the `build` script from `"build": "vite build"` to:

```json
    "build": "vite build && node scripts/build-sitemaps.mjs",
```

- [ ] **Step 3: Remove the stale static sitemap**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow && git rm frontend/public/sitemap.xml`
Expected: removed — it is now generated into `dist/client/` at build time, not served from `public/`.

- [ ] **Step 4: Build and verify the sitemaps are generated**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm run build`
Expected: build succeeds; the script logs a "Sitemaps written" line. Confirm with `ls dist/client/sitemap*.xml` — five files: `sitemap.xml`, `sitemap-static.xml`, `sitemap-blog.xml`, `sitemap-jobs.xml`, `sitemap-hubs.xml`. Open `dist/client/sitemap.xml` and confirm it is a `<sitemapindex>` referencing the other four.

> Note: with no `VITE_API_URL` set locally, jobs/blog sitemaps are generated empty (the script degrades gracefully) — that is expected; the static sitemap and the index still populate. The CI/Vercel build sets `VITE_API_URL`.

- [ ] **Step 5: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add frontend/scripts/build-sitemaps.mjs frontend/package.json
git commit -m "$(cat <<'EOF'
feat: generate static + blog + jobs + hubs sitemaps at build time (SP2 phase 4)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Refresh `robots.txt` and `llms.txt`

**Files:**
- Modify: `frontend/public/robots.txt`
- Modify: `frontend/public/llms.txt`

- [ ] **Step 1: Add a `Google-Extended` block to `robots.txt`**

In `frontend/public/robots.txt`, add this block immediately after the `Applebot-Extended` block and before the `Sitemap:` line:

```
User-agent: Google-Extended
Allow: /
```

(`Sitemap: https://jobssearch.work/sitemap.xml` already points at the index — leave it.)

- [ ] **Step 2: Fix the broken link and add Jobs/Hubs sections to `llms.txt`**

In `frontend/public/llms.txt`:

(a) In the `## Key Pages` section, change the Roadmap line from `- Roadmap: https://jobssearch.work/ideas` to:
```
- Roadmap: https://jobssearch.work/roadmap
```

(b) Immediately after the `## Key Pages` section (before `## Preferred Citation`), insert:

```
## Jobs
JobsSearch aggregates job listings from multiple providers. Individual roles are at:
- https://jobssearch.work/jobs/{role-slug}-{id}

## Hub Pages
Long-tail job-category landing pages, derived from live listings:
- By skill: https://jobssearch.work/jobs/{skill}
- Remote roles: https://jobssearch.work/jobs/remote
- By location: https://jobssearch.work/jobs/location/{city}
- Combined: https://jobssearch.work/jobs/{skill}/remote and /jobs/{skill}/location/{city}
```

- [ ] **Step 3: Verify**

Read both files back and confirm: `robots.txt` has the `Google-Extended` block and still ends with the `Sitemap:` line; `llms.txt` has `/roadmap` (no remaining `/ideas`) and the two new sections. Run `grep -c "/ideas" frontend/public/llms.txt` — expect `0`.

- [ ] **Step 4: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add frontend/public/robots.txt frontend/public/llms.txt
git commit -m "$(cat <<'EOF'
chore: add Google-Extended to robots.txt; fix and extend llms.txt (SP2 phase 4)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Per-job Open Graph images

**Files:**
- Create: `frontend/api/og/job/[id].js`
- Modify: `frontend/pages/jobs/@jobPath/+Head.jsx`

- [ ] **Step 1: Install `@vercel/og`**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm install @vercel/og`
Expected: added to `dependencies`.

- [ ] **Step 2: Create the OG image function** — `frontend/api/og/job/[id].js`

```js
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const API_BASE = (process.env.VITE_API_URL || '').replace(/\/$/, '');

// Renders a 1200x630 card image for a job posting.
export default async function handler(request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  let job = null;
  try {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`);
    if (res.ok) job = await res.json();
  } catch {
    job = null;
  }

  const title = job ? job.title : 'JobsSearch';
  const subtitle = job
    ? `${job.company_name || ''}${job.location ? ' · ' + job.location : ''}`
    : 'AI-powered job search and hiring';

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '80px', background: '#faf8f5',
        },
        children: [
          { type: 'div', props: { style: { fontSize: 60, fontWeight: 700, color: '#0d0d0f', lineHeight: 1.1 }, children: title } },
          { type: 'div', props: { style: { fontSize: 32, color: '#5a5a66', marginTop: 24 }, children: subtitle } },
          { type: 'div', props: { style: { fontSize: 28, color: '#ff6b5b', fontWeight: 700, marginTop: 'auto' }, children: 'JobsSearch' } },
        ],
      },
    },
    { width: 1200, height: 630 },
  );
}
```

> Note: the route path is `/api/og/job/{id}` (Vercel's `api/` convention with the `[id]` dynamic segment). No rewrite is added — the job page references this path directly.

- [ ] **Step 3: Reference the OG image from the job page** — in `frontend/pages/jobs/@jobPath/+Head.jsx`, inside the `if (!job)` early-return keep as-is; in the main return (where `job` exists), add an `og:image` meta. The current main return contains `<meta property="og:title" .../>` and `<meta property="og:url" .../>`. Add directly after the `og:url` line:

```jsx
      <meta property="og:image" content={`https://jobssearch.work/api/og/job/${job.id}`} />
      <meta name="twitter:image" content={`https://jobssearch.work/api/og/job/${job.id}`} />
```

(Marketing and hub pages keep the site-wide static `og-image.svg` already set in `frontend/pages/+Head.jsx` — no change there.)

- [ ] **Step 4: Build to verify nothing breaks**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm run build`
Expected: build succeeds. The `api/og/job/[id].js` function is picked up by `vite-plugin-vercel` into `.vercel/output/functions/`. Confirm with `ls .vercel/output/functions`.

- [ ] **Step 5: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add frontend/api frontend/package.json frontend/package-lock.json frontend/pages/jobs/@jobPath/+Head.jsx
git commit -m "$(cat <<'EOF'
feat: per-job Open Graph card images via @vercel/og (SP2 phase 4)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: VERCEL-PREVIEW VERIFICATION (human-run, flag this).** Image generation cannot be verified locally. Report: a preview deploy must confirm `GET /api/og/job/<real-id>` returns a 1200x630 PNG, and that a job page's `og:image` resolves. Mark DONE_WITH_CONCERNS noting the preview-deploy step is outstanding.

---

## Task 6: Recommended cleanups

**Files:**
- Modify: `tools/verify.ps1`
- Modify: `backend/api/routes/jobs.py`

- [ ] **Step 1: Fix the `verify.ps1` drift** — in `tools/verify.ps1`, the backend test step runs bare `pytest`, while `tools/verify.mjs` runs `python -m pytest`. Make them identical. Change the line `pytest -m "unit or integration"` to:

```
python -m pytest -m "unit or integration"
```

- [ ] **Step 2: Fix the `search_external_jobs` docstring drift** — in `backend/api/routes/jobs.py`, the `search_external_jobs` handler docstring says "JSearch + Jobs API" while `services/jobs_api.py` aggregates 5 providers. Change the docstring line:

```python
    """Search real job postings from JSearch + Jobs API and optionally match against user profile."""
```

to:

```python
    """Search real job postings from external providers and optionally match against user profile."""
```

- [ ] **Step 3: Verify**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && python -c "import ast; ast.parse(open('api/routes/jobs.py').read()); print('jobs.py parses OK')"`
Expected: `jobs.py parses OK`. The `verify.ps1` change is a one-token edit — confirm by reading the line back.

- [ ] **Step 4: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add tools/verify.ps1 backend/api/routes/jobs.py
git commit -m "$(cat <<'EOF'
chore: fix verify.ps1 pytest drift and stale external-jobs docstring

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Final verification

- [ ] **Step 1: Frontend unit + e2e suites**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm test && npm run test:e2e`
Expected: all Vitest unit tests pass (including the new `sitemap.test.js`); all Playwright e2e specs pass. The OG-image `og:image` meta and the build pipeline change must not regress the existing SSR/e2e suite.

- [ ] **Step 2: Backend fast gate**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow && node tools/verify.mjs --skip-frontend`
Expected: API parity, backend dependency consistency, and backend unit+integration tests all pass.

- [ ] **Step 3: Production-build smoke**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm run build`
Expected: build succeeds; `.vercel/output/` exists; `dist/client/sitemap*.xml` (5 files) exist; `sitemap.xml` is a valid `<sitemapindex>`.

- [ ] **Step 4: Report the outstanding Vercel-preview checks**

Summarize for the controller the human-run verification still owed (from Tasks 1 and 5): a Vercel preview deploy confirming SSG/SSR routes serve correctly under `vite-plugin-vercel`, the five `/sitemap*.xml` files are reachable, and `/api/og/job/{id}` returns a PNG.

- [ ] **Step 5: Commit (if Step 1–3 required any fixes; otherwise skip)**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add -A
git commit -m "$(cat <<'EOF'
test: final verification fixes for SP2 phase 4

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

**Spec coverage:** §4 OG images — Task 5 (per-job `@vercel/og` function; marketing/hub keep the static fallback). §5 sitemaps — Tasks 2+3 (index + static + blog + jobs + hubs; jobs sitemap contains only active jobs since `/api/jobs` returns active only; hubs sitemap contains only ≥5-job hubs). §6 crawlability — Task 4 (`Google-Extended` block; `llms.txt` `/ideas`→`/roadmap` fix + Jobs/Hubs sections). Plus the deploy-config fix (Task 1) and recommended cleanups (Task 6).

**Deliberate deviation from spec:** sitemaps are build-time static files, not live SSR routes (see Background). Expired jobs drop out at the next deploy rather than within minutes.

**Verification ceiling:** Tasks 1 and 5 are build-verifiable only; their deploy behavior needs a Vercel preview. This is called out in-task and surfaced again in Task 7 Step 4. Everything in Tasks 2, 3, 4, 6 is fully verified locally.

**Verify during execution:** `vite-plugin-vercel`'s exact plugin export (`vercel` from `vite-plugin-vercel/vite`) and whether it picks up `frontend/api/` functions — confirm against the installed package's README; the OG task depends on `api/` discovery working.
