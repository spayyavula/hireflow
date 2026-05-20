# Hyrly Rebrand + Domain Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the public brand from "JobsSearch" to "Hyrly", migrate the canonical domain from `jobssearch.work` to `hyrly.ai`, redirect every old URL with a 308, and re-prime Google's index with the new URLs.

**Architecture:** Introduce a `SITE_URL` env var (frontend `VITE_SITE_URL` baked at build, backend `SITE_URL` at runtime) so the canonical site URL is configurable and future domain changes are one env update. Sweep "JobsSearch" → "Hyrly" mechanically across the ~53 files where it appears, sweep remaining `jobssearch.work` literals (the few not under the new env var) → `hyrly.ai`. Rebrand the localStorage token key. Attach `hyrly.ai` to Vercel via CLI, redeploy frontend + backend with the new env, and configure `jobssearch.work` to 308-redirect to `hyrly.ai` (the one Vercel dashboard action you accepted). Migrate Google's index of existing job URLs with a one-shot script that calls the Indexing API.

**Tech Stack:** Vike + React 18 (frontend), FastAPI + Supabase (backend), Expo/React Native (mobile), `vite-plugin-vercel`, `vercel` CLI, Google Indexing API.

---

## Background & Decisions

- **Brand spelling:** `Hyrly` (capital H, lowercase rest). 98 occurrences of `JobsSearch` across 53 files become `Hyrly`. The internal codename `HireFlow` (repo dir, CLAUDE.md) stays — it isn't the public brand.
- **Mobile in scope:** `mobile/src/*` is rebranded in this pass (the app isn't deployed to stores; code-only update).
- **`jobssearch_token` localStorage key:** renamed to `hyrly_token`. Currently-logged-in users will be logged out on next visit (no migration shim by choice).
- **301/308 redirects:** configured via Vercel's Domains UI ("Redirect to" on `jobssearch.work` → `hyrly.ai`). One dashboard click per old-domain alias; accepted by the user as the only unavoidable GUI action.
- **Old domain stays attached** to `hireflow-ui` so the 308s work. Backlink equity preserved.
- **Verification ceiling (honest):** Google Search Console actions (verifying the new property, Change of Address, sitemap submission) are browser-only and yours. The deploy + Indexing API notifications are CLI/code.
- All commands assume Bash unless noted; use absolute paths because the Bash working directory resets between turns. Repo root: `c:\Users\sreek\myprojects\jobshunter\hireflow`.

---

## Task 1: Env-var-ize the site URL

**Files:**
- Modify: `frontend/vite.config.js`, `frontend/src/schema/jsonld.js`, `frontend/src/schema/jsonld.test.js`, `frontend/scripts/build-sitemaps.mjs`, `frontend/src/lib/sitemap.test.js`, `frontend/pages/+Head.jsx`, `frontend/pages/jobs/@jobPath/+Head.jsx`, `frontend/pages/jobs-hub/+Head.jsx`, `frontend/pages/jobs-hub/+Page.jsx`
- Modify: `backend/api/services/indexing.py`, `backend/tests/unit/test_indexing.py`, `backend/api/index.py`

- [ ] **Step 1: Frontend vite-define for `VITE_SITE_URL`**

In `frontend/vite.config.js`, the `define` block currently is:
```js
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
  },
```
Replace it with:
```js
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
    'import.meta.env.VITE_SITE_URL': JSON.stringify(process.env.VITE_SITE_URL || 'https://hyrly.ai'),
  },
```

Do the same in `frontend/vitest.config.js` (so unit tests have `VITE_SITE_URL` defined too).

- [ ] **Step 2: Schema module reads `VITE_SITE_URL`**

In `frontend/src/schema/jsonld.js`, change `const SITE = 'https://jobssearch.work';` to:
```js
const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';
```

- [ ] **Step 3: Schema tests assert `hyrly.ai` (default)**

In `frontend/src/schema/jsonld.test.js`, every assertion that has the literal `https://jobssearch.work` must become `https://hyrly.ai`. The `organization()`/`website()` `@id`s, the breadcrumb test inputs/outputs. Run a `grep -n "jobssearch.work" frontend/src/schema/jsonld.test.js` first to find them all.

- [ ] **Step 4: Build-sitemaps script reads env**

In `frontend/scripts/build-sitemaps.mjs`, change `const SITE = 'https://jobssearch.work';` to:
```js
const SITE = process.env.VITE_SITE_URL || 'https://hyrly.ai';
```

- [ ] **Step 5: Sitemap unit tests assert `hyrly.ai`**

In `frontend/src/lib/sitemap.test.js`, replace every `https://jobssearch.work` literal with `https://hyrly.ai` in test inputs and expected outputs.

- [ ] **Step 6: Vike `+Head.jsx` and `+Page.jsx` files read env**

In `frontend/pages/+Head.jsx`, every `https://jobssearch.work` literal becomes `${SITE}` (and add a `const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';` at the top of the file before the component). The Organization/WebSite JSON-LD `@id`, `url`, `logo`, `SearchAction.target`.

In `frontend/pages/jobs/@jobPath/+Head.jsx`, add the same `SITE` const at top and use it in `canonical = \`${SITE}${jobUrlPath(job)}\`` and in the breadcrumb URLs.

In `frontend/pages/jobs-hub/+Head.jsx`, add the same and use in `canonical`, breadcrumb URLs (`'Home'`, `'Jobs'`).

In `frontend/pages/jobs-hub/+Page.jsx`, no Head JSON-LD but the breadcrumb labels used by sibling links could be inspected; do NOT change `hubUrlPath`/`jobUrlPath` (those return paths, not full URLs).

- [ ] **Step 7: Backend `indexing.py` reads `SITE_URL`**

In `backend/api/services/indexing.py`, change `SITE = "https://jobssearch.work"` to:
```python
import os
SITE = os.environ.get("SITE_URL", "https://hyrly.ai")
```
(`os` is not currently imported in this file — add it at the top.)

- [ ] **Step 8: Backend indexing tests assert `hyrly.ai`**

In `backend/tests/unit/test_indexing.py`, replace every `https://jobssearch.work` literal in expected outputs with `https://hyrly.ai`.

- [ ] **Step 9: Backend CORS allowlist adds hyrly.ai**

In `backend/api/index.py` line 41 (the `ALLOWED_ORIGINS` default), append the new origins so both old and new work during the redirect period. The current default starts with localhost entries and ends with `,https://hireflow-ui.vercel.app,https://jobssearch.work,https://www.jobssearch.work`. Change it to end with:
```
,https://hireflow-ui.vercel.app,https://jobssearch.work,https://www.jobssearch.work,https://hyrly.ai,https://www.hyrly.ai
```

- [ ] **Step 10: Run all tests**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm test`
Expected: PASS (all schema + sitemap tests now expect `hyrly.ai`).
Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && python -m pytest -m "unit or integration"`
Expected: PASS (indexing tests expect `hyrly.ai`).

- [ ] **Step 11: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add frontend/vite.config.js frontend/vitest.config.js frontend/src/schema frontend/scripts/build-sitemaps.mjs frontend/src/lib/sitemap.test.js frontend/pages backend/api/services/indexing.py backend/tests/unit/test_indexing.py backend/api/index.py
git commit -m "$(cat <<'EOF'
refactor: read site URL from env var, default https://hyrly.ai

Prep for the jobssearch.work -> hyrly.ai migration. Frontend reads
VITE_SITE_URL (baked at build via vite define), backend reads SITE_URL
at runtime. Backend CORS allowlist now includes hyrly.ai + www.hyrly.ai
alongside the existing jobssearch.work entries.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Mechanical "JobsSearch" → "Hyrly" replace

98 occurrences across 53 files. This is a one-pass sweep verified by the test suite + a build.

**Files:** ~53 files across `frontend/`, `mobile/`, `backend/api/services/`, `backend/api/routes/`, `backend/tools/`, `frontend/public/llms.txt`, `frontend/public/og-image.svg`, `README.md`, `CLAUDE.md`, `CONTEXT.md`.

- [ ] **Step 1: Confirm the replacement is unambiguous**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow && grep -rn "JobsSearch" --include=\*.py --include=\*.js --include=\*.jsx --include=\*.md --include=\*.json --include=\*.svg --include=\*.xml --include=\*.txt --include=\*.html --include=\*.sql --include=\*.toml 2>/dev/null | grep -vE "node_modules|\.vercel|dist|\.venv|__pycache__|docs/superpowers/plans|docs/adr" | head -5`
Expected: ~98 matches; every match is the brand string (no false positives like a variable name `jobsSearchEngine` that we shouldn't touch). The string `JobsSearch` (with both capitals) is brand-specific.

- [ ] **Step 2: Sweep "JobsSearch" → "Hyrly"**

Excluded paths: `docs/superpowers/plans/` (historical plans), `docs/adr/` (historical decision records), `docs/superpowers/specs/` (historical specs). Those keep their original "JobsSearch" references as accurate snapshots of what was true when they were written.

Run from repo root:
```bash
grep -rl "JobsSearch" --include=\*.py --include=\*.js --include=\*.jsx --include=\*.md --include=\*.json --include=\*.svg --include=\*.xml --include=\*.txt --include=\*.html --include=\*.sql --include=\*.toml 2>/dev/null \
  | grep -vE "node_modules|\.vercel|dist|\.venv|__pycache__|docs/superpowers|docs/adr" \
  | xargs sed -i 's/JobsSearch/Hyrly/g'
```

(On Windows, run from Git Bash so `sed -i` works. If `sed` is unavailable, use Python: `for f in $(grep -rl ...); do python -c "import sys; p=sys.argv[1]; open(p,'w',encoding='utf-8').write(open(p,encoding='utf-8').read().replace('JobsSearch','Hyrly'))" "$f"; done`)

- [ ] **Step 3: Confirm zero remaining occurrences (in non-historical paths)**

Run: `grep -rn "JobsSearch" --include=\*.py --include=\*.js --include=\*.jsx --include=\*.md --include=\*.json --include=\*.svg --include=\*.xml --include=\*.txt --include=\*.html --include=\*.sql --include=\*.toml 2>/dev/null | grep -vE "node_modules|\.vercel|dist|\.venv|__pycache__|docs/superpowers|docs/adr" | wc -l`
Expected: `0`.

If non-zero, inspect what's left — likely a pluralization or case variant the sweep missed (e.g. `JOBSSEARCH`). Decide per-occurrence: rebrand or leave (e.g. a URL fragment).

- [ ] **Step 4: Run all tests**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm test`
Expected: PASS. Any test asserting a specific brand string in body copy / titles will need its expected value updated to `Hyrly` — fix and re-run.

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && python -m pytest -m "unit or integration"`
Expected: PASS.

- [ ] **Step 5: Build to confirm the frontend still compiles**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod`
Expected: build succeeds; "Sitemaps written" reports non-zero jobs/blog/hubs (the live backend is reachable); `.vercel/output/` present.

Spot-check: `grep -c "Hyrly" dist/client/index.html` — expect > 0 (the page title, etc.).

- [ ] **Step 6: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add -A
git commit -m "$(cat <<'EOF'
chore: rebrand JobsSearch -> Hyrly across code, copy, and assets

Mechanical sweep across ~53 files. Historical plans, ADRs, and SP2
specs are deliberately not touched (they remain accurate snapshots).
The internal codename "HireFlow" (repo, CLAUDE.md) is unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Rename `jobssearch_token` localStorage key

**Files:**
- Modify: `frontend/src/api.js`, `mobile/src/services/api.js`

Currently-logged-in users will be logged out on next visit (the new code reads `hyrly_token`; their old token sits unused under `jobssearch_token` and is eventually cleared).

- [ ] **Step 1: Frontend**

In `frontend/src/api.js`, replace the literal `'jobssearch_token'` everywhere it appears (constructor `safeStorage.get`, `register`/`login` `safeStorage.set`, `logout` `safeStorage.remove`) with `'hyrly_token'`. There are 4 occurrences.

- [ ] **Step 2: Mobile**

In `mobile/src/services/api.js`, do the same — replace every `'jobssearch_token'` literal with `'hyrly_token'`. The mobile API client mirrors the web one; same 4-ish occurrences.

- [ ] **Step 3: Verify no remaining `jobssearch_token` references**

Run: `grep -rn "jobssearch_token" --include=\*.js --include=\*.jsx --include=\*.py 2>/dev/null | grep -vE "node_modules|\.vercel|dist"`
Expected: zero matches.

- [ ] **Step 4: Run tests**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm test`
Expected: PASS. (No unit tests reference the literal, so the rename should be silent. e2e tests use the API mocks rather than localStorage directly.)

- [ ] **Step 5: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add frontend/src/api.js mobile/src/services/api.js
git commit -m "$(cat <<'EOF'
chore: rename localStorage token key jobssearch_token -> hyrly_token

Currently-logged-in users will be logged out on next visit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Remaining `jobssearch.work` literals + OG image

Task 1 env-var-ed the structural URLs. This task cleans up the remaining literal `jobssearch.work` references (test fixtures, static files, doc strings, mobile config, OG image SVG).

**Files:**
- Modify: `frontend/public/robots.txt`, `frontend/public/llms.txt`, `frontend/public/og-image.svg`
- Modify: `mobile/src/constants/config.js`, `mobile/src/screens/BlogPostScreen.js`, `mobile/src/services/api.js` (if any literals remain there)
- Modify: `backend/tools/pressroom.py`
- Modify: `README.md`, `CONTEXT.md`, `CLAUDE.md` (if any literals remain)
- Modify: `frontend/src/pages/blog/BlogPostPage.jsx` (if any literals remain)

- [ ] **Step 1: Sweep remaining `jobssearch.work` literals → `hyrly.ai`**

Run from repo root:
```bash
grep -rl "jobssearch.work" --include=\*.py --include=\*.js --include=\*.jsx --include=\*.md --include=\*.json --include=\*.svg --include=\*.xml --include=\*.txt --include=\*.html --include=\*.sql --include=\*.toml 2>/dev/null \
  | grep -vE "node_modules|\.vercel|dist|\.venv|__pycache__|docs/superpowers|docs/adr" \
  | xargs sed -i 's/jobssearch\.work/hyrly.ai/g'
```

This catches everywhere — `robots.txt`'s `Sitemap:` URL, `llms.txt`'s key page URLs, `og-image.svg`'s URL footer (if any), the mobile config file, etc. The historical plan/ADR/spec docs are deliberately excluded again.

- [ ] **Step 2: Confirm zero remaining literals (in non-historical paths)**

Run: `grep -rn "jobssearch.work" --include=\*.py --include=\*.js --include=\*.jsx --include=\*.md --include=\*.json --include=\*.svg --include=\*.xml --include=\*.txt --include=\*.html --include=\*.sql --include=\*.toml 2>/dev/null | grep -vE "node_modules|\.vercel|dist|\.venv|__pycache__|docs/superpowers|docs/adr" | wc -l`
Expected: `0`.

- [ ] **Step 3: Inspect and update the OG image SVG visually**

Open `frontend/public/og-image.svg` and confirm:
- Any embedded `<text>` element that displayed the wordmark "JobsSearch" was rewritten to "Hyrly" by Task 2's brand sweep.
- Any URL displayed in the image footer was rewritten to "hyrly.ai" by Step 1 of this task.
- If the wordmark uses a different font size that no longer balances after the text change, adjust the `font-size` or `x`/`y` coordinates so it still fits the 1200×630 OG box.

Open the SVG in a browser to visually confirm. If you want a real preview, run a local `http-server` or `python -m http.server` from `frontend/public/` and load `og-image.svg`.

- [ ] **Step 4: Run tests + build**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend && npm test && VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod`
Expected: tests pass; build produces `.vercel/output/`; "Sitemaps written" reports non-zero counts.

Spot-check: `grep -c "hyrly.ai" dist/client/sitemap-static.xml` — expect 9 (one per static route).
Spot-check: `grep -c "hyrly.ai" dist/client/sitemap-jobs.xml` — expect 8 (one per current active job).

- [ ] **Step 5: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add -A
git commit -m "$(cat <<'EOF'
chore: sweep remaining jobssearch.work literals to hyrly.ai + OG image

Covers static files (robots.txt, llms.txt, og-image.svg), the mobile
constants/screens, backend pressroom tool, and any remaining README
references. Historical specs/plans/ADRs unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Push, then deploy the backend with `SITE_URL`

The Indexing API notifier needs `SITE_URL=https://hyrly.ai` set in `hireflow-api`'s production env so future job-create/close notifications target the new domain.

- [ ] **Step 1: Push everything so far**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow && git push origin main
```

- [ ] **Step 2: Add `SITE_URL` to the `hireflow-api` Vercel project**

The backend is linked at `backend/.vercel/project.json` (project `hireflow-api`). `SITE_URL`'s value is a short single-line string so the interactive prompt works fine.

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend
echo "https://hyrly.ai" | vercel env add SITE_URL production
```

(If the echo+pipe doesn't satisfy `vercel env add`'s prompt: run `vercel env add SITE_URL production` interactively and type `https://hyrly.ai` when prompted.)

Verify: `vercel env ls production | grep -i SITE_URL` — expect a row listing `SITE_URL` as `Encrypted`, scope `Production`.

- [ ] **Step 3: Redeploy backend**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && vercel --prod --yes
```
Wait for `readyState: READY` in the output.

- [ ] **Step 4: Verify backend is healthy and CORS allowlist is correct**

```bash
node -e "fetch('https://hireflow-api.vercel.app/api/health').then(r=>r.text()).then(t=>console.log(t))"
```
Expected: `{"status":"ok","database":"supabase","users":N,"jobs":M,...}`.

CORS preflight from the new origin:
```bash
node -e "fetch('https://hireflow-api.vercel.app/api/jobs?limit=1',{headers:{Origin:'https://hyrly.ai'}}).then(r=>console.log('status',r.status,'allow-origin',r.headers.get('access-control-allow-origin')))"
```
Expected: status 200, `access-control-allow-origin: https://hyrly.ai`.

---

## Task 6: Attach `hyrly.ai` and deploy the frontend

- [ ] **Step 1: Add `VITE_SITE_URL` to the `hireflow-ui` Vercel project**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend
echo "https://hyrly.ai" | vercel env add VITE_SITE_URL production
```

Verify: `vercel env ls production | grep -i SITE_URL` shows it.

- [ ] **Step 2: Attach `hyrly.ai` and `www.hyrly.ai` to `hireflow-ui`**

```bash
vercel domains add hyrly.ai hireflow-ui
vercel domains add www.hyrly.ai hireflow-ui
```

The CLI will print the DNS records you need to set at your DNS provider (typically an `A` record `76.76.21.21` for the apex and a `CNAME` for `www`). **Set those records at your DNS provider.** Vercel auto-provisions SSL once DNS resolves (usually a few minutes).

Wait until `vercel domains inspect hyrly.ai` shows `verified: true` before moving on.

- [ ] **Step 3: Rebuild and deploy the frontend prebuilt**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow\frontend
rm -rf .vercel/output
VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod
vercel deploy --prebuilt --prod --yes
```

The build log should print `Sitemaps written: N jobs, M blog posts, K hubs` with positive numbers. Note the deployment URL.

- [ ] **Step 4: Verify the new domain serves the SP2 build**

```bash
node -e "fetch('https://hyrly.ai/').then(r=>r.text()).then(t=>{console.log('bytes',t.length);console.log('has-career-partner',t.includes('career partner'));console.log('has-hyrly',t.includes('Hyrly'));})"
node -e "fetch('https://hyrly.ai/sitemap.xml').then(r=>console.log('sitemap status',r.status))"
node -e "fetch('https://hyrly.ai/api/og/job/job_1').then(r=>console.log('og status',r.status,'type',r.headers.get('content-type')))"
```
Expected: homepage ~43KB with `career partner` AND `Hyrly` true; sitemap status 200; og status 200, content-type `image/png`.

---

## Task 7: 301-redirect `jobssearch.work` to `hyrly.ai`

This is the one Vercel dashboard action you accepted. It can't be set via the `vercel` CLI today.

- [ ] **Step 1: Configure the redirect in Vercel Domains**

In the Vercel dashboard:
1. Go to the `hireflow-ui` project → Settings → Domains.
2. Find `jobssearch.work` in the list → click the three-dot menu → "Edit" (or click the domain to open its detail panel).
3. Under "Redirect to" select `hyrly.ai`, status code `308` (or `301` — 308 is the modern default and preserves the HTTP method).
4. Save.
5. Repeat for `www.jobssearch.work` → "Redirect to" `hyrly.ai`.

- [ ] **Step 2: Verify the redirects from the CLI**

```bash
node -e "fetch('https://jobssearch.work/jobs/senior-react-developer-job_1',{redirect:'manual'}).then(r=>console.log('status',r.status,'location',r.headers.get('location')))"
node -e "fetch('https://www.jobssearch.work/',{redirect:'manual'}).then(r=>console.log('status',r.status,'location',r.headers.get('location')))"
```
Expected: status 308 (or 301), `location: https://hyrly.ai/jobs/senior-react-developer-job_1` (path preserved) and `https://hyrly.ai/` respectively.

- [ ] **Step 3: Follow the redirect end-to-end**

```bash
node -e "fetch('https://jobssearch.work/').then(r=>{console.log('final url',r.url,'status',r.status); return r.text();}).then(t=>console.log('has-hyrly',t.includes('Hyrly')))"
```
Expected: `final url: https://hyrly.ai/` (default `redirect: follow` resolves the chain), status 200, body contains `Hyrly`.

---

## Task 8: Notify the Indexing API for every old/new job URL

A one-shot Python script that calls `notify_url` twice per active job — once with the old `jobssearch.work` URL + `URL_DELETED` (so Google removes it), once with the new `hyrly.ai` URL + `URL_UPDATED` (so Google indexes it). The notifier already handles the unconfigured-credential case and never raises.

**Files:**
- Create: `backend/tools/migrate_indexing.py`

- [ ] **Step 1: Write the migration script**

Create `backend/tools/migrate_indexing.py`:

```python
"""
One-shot migration script: notify the Google Indexing API to drop every
jobssearch.work job URL and re-index its hyrly.ai equivalent. Run once
after the domain cutover.

Reads GOOGLE_INDEXING_CREDENTIALS + SITE_URL from the same env the
backend uses. Requires a working backend reachable at HIREFLOW_API
(default https://hireflow-api.vercel.app).
"""

from __future__ import annotations

import os
import sys
import urllib.request
import urllib.error
import json

# Make the api package importable when running from backend/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.services.indexing import notify_url, job_public_url, _slug

OLD_SITE = "https://jobssearch.work"
API_BASE = os.environ.get("HIREFLOW_API", "https://hireflow-api.vercel.app").rstrip("/")


def fetch_jobs() -> list[dict]:
    req = urllib.request.Request(f"{API_BASE}/api/jobs?limit=100")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except (urllib.error.URLError, urllib.error.HTTPError) as exc:
        print(f"Failed to fetch jobs from {API_BASE}: {exc}", file=sys.stderr)
        return []


def old_url(job: dict) -> str:
    return f"{OLD_SITE}/jobs/{_slug(job.get('title', ''))}-{job.get('id', '')}"


def main() -> int:
    jobs = fetch_jobs()
    if not jobs:
        print("No jobs returned from backend; nothing to migrate.")
        return 1

    deleted_ok = updated_ok = deleted_fail = updated_fail = 0
    for job in jobs:
        old = old_url(job)
        new = job_public_url(job)
        if notify_url(old, "URL_DELETED"):
            deleted_ok += 1
        else:
            deleted_fail += 1
        if notify_url(new, "URL_UPDATED"):
            updated_ok += 1
        else:
            updated_fail += 1

    print(f"Indexing migration complete: {len(jobs)} jobs processed.")
    print(f"  URL_DELETED on {OLD_SITE}/jobs/*: {deleted_ok} ok, {deleted_fail} failed")
    print(f"  URL_UPDATED on new domain:        {updated_ok} ok, {updated_fail} failed")
    return 0 if (deleted_fail == 0 and updated_fail == 0) else 2


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Run it with the credential in the env**

The credential is already in Vercel; for a local one-shot run you need it in your shell. Two options:

(a) Download it from the file you already have:
```bash
export GOOGLE_INDEXING_CREDENTIALS="$(cat /c/Users/sreek/OneDrive/Desktop/GCP-Keys/steam-snowfall-496822-g7-984fb3aea8f2.json)"
export SITE_URL=https://hyrly.ai
cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend
python tools/migrate_indexing.py
```

(b) Or pull it from Vercel and run on the server. Either way the script is idempotent — re-running it is safe (Google just gets a duplicate notification, which it deduplicates).

Expected output:
```
Indexing migration complete: 8 jobs processed.
  URL_DELETED on https://jobssearch.work/jobs/*: 8 ok, 0 failed
  URL_UPDATED on new domain:                     8 ok, 0 failed
```

If any failures, inspect the backend logs / re-run; the script prints what failed.

- [ ] **Step 3: Commit the script**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add backend/tools/migrate_indexing.py
git commit -m "$(cat <<'EOF'
feat: one-shot Indexing API migration for domain rebrand

Notifies Google of URL_DELETED for every jobssearch.work job URL and
URL_UPDATED for every hyrly.ai equivalent. Run once after cutover.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
cd c:\Users\sreek\myprojects\jobshunter\hireflow && git push origin main
```

---

## Task 9: Search Console + final verification (your actions)

These can't be done from the CLI — they're browser-only Search Console operations on your Google account. After this, the migration is complete and Google starts crawling/indexing the new domain.

- [ ] **Step 1: Add hyrly.ai as a Search Console property**

https://search.google.com/search-console → Add property → Domain → `hyrly.ai` → verify via the TXT record Google gives you at your DNS provider.

- [ ] **Step 2: Re-add the service account as Owner on the new property**

In the new `hyrly.ai` property: Settings → Users and permissions → Add user → paste the service account email (the same one already added to `jobssearch.work`) → role: **Owner**. (Indexing API permission is per-property; the service account must have Owner on both during the transition, then only the new one after the old property is closed.)

- [ ] **Step 3: Submit the sitemap on hyrly.ai**

In the `hyrly.ai` property: Sitemaps → Add a new sitemap → `sitemap.xml` → Submit. Within a day Google's "Discovered URLs" count should show the static, blog, jobs, and hubs URLs.

- [ ] **Step 4: Use Change of Address on the old property**

On the old `jobssearch.work` property in Search Console: Settings → Change of address → select `hyrly.ai` as the destination → Validate (Google confirms the 308 redirects + that you own both) → Confirm. Google transfers ranking signals from old to new.

- [ ] **Step 5: Spot-check rich results on a job URL**

https://search.google.com/test/rich-results → paste `https://hyrly.ai/jobs/senior-react-developer-job_1` → confirm `JobPosting`, `BreadcrumbList`, and any `Organization`/`WebSite` schemas validate and are eligible.

- [ ] **Step 6: Final CLI verification**

```bash
node -e "Promise.all(['https://hyrly.ai/','https://hyrly.ai/features','https://hyrly.ai/jobs/senior-react-developer-job_1','https://hyrly.ai/jobs/react','https://hyrly.ai/sitemap.xml','https://hyrly.ai/api/og/job/job_1','https://jobssearch.work/'].map(u=>fetch(u,{redirect:'manual'}).then(r=>console.log(r.status,r.headers.get('location')||'',u)))).then(()=>{})"
```
Expected: every `hyrly.ai/*` URL returns 200; `jobssearch.work/` returns 308 with `location: https://hyrly.ai/`.

---

## Self-Review Notes

**Decisions coverage:** brand → `Hyrly` (Task 2); mobile rebrand (Task 2 sweeps `mobile/`); `jobssearch_token` → `hyrly_token` (Task 3); 308 redirect via Vercel Domains (Task 7). All four.

**Spec coverage:** the four file-categories from the surface map all hit — structural URL references (Task 1 env-var), brand copy (Task 2), token key (Task 3), remaining literals + OG image (Task 4). Backend env + redeploy (Task 5). New domain attached + frontend redeploy (Task 6). Old domain redirects (Task 7). Google index re-prime (Task 8). User SEO actions (Task 9).

**Deliberately not touched:** `docs/superpowers/plans/`, `docs/adr/`, `docs/superpowers/specs/` — these are historical records that should remain accurate as-of-when-written. Future readers benefit from knowing what the brand was when those were drafted. CLAUDE.md's "HireFlow" repo name stays — that's the internal codename, not the public brand.

**Verification ceiling:** Google's actual indexing of the new domain, the Change of Address completion, and Rich Results acceptance happen on Google's side over hours/days — none of those are gated locally.

**Order matters:** Task 5 (backend env + redeploy) can run in parallel with Task 6 (frontend env + redeploy) — they target different Vercel projects. Task 7 must wait for Task 6 (the new domain must be attached before redirects are configured). Task 8 must wait for Task 5 (backend `SITE_URL` set) and Task 6 (frontend at hyrly.ai so the new URLs actually serve). Task 9 must wait for Task 7 + Task 8.
