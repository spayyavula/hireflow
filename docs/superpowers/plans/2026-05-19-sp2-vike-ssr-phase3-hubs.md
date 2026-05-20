# SP2 Vike SSR — Phase 3: Hub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add long-tail SEO hub pages (`/jobs/{skill}`, `/jobs/remote`, `/jobs/location/{city}`, and skill+location/skill+remote combinations) that server-render live matching jobs with AI-generated intro copy, FAQ, and `ItemList`/`FAQPage` JSON-LD.

**Architecture:** Hub taxonomy is derived at request time from live job data — no curated lists. A new backend `hub_content` table caches AI-generated copy+FAQ per hub slug, served by `GET /api/seo/hub/{slug}`. A single Vike SSR page matches all hub URL shapes via a route function; its `+data` hook fetches matching jobs and (only when ≥5 jobs match, to bound AI cost) the cached hub copy. Sub-threshold hubs still render but emit `noindex,follow`.

**Tech Stack:** FastAPI + Supabase (backend); Vike + `vike-react` + React 18 (frontend); pytest, Vitest, Playwright.

---

## Background & Decisions

- Spec: `docs/superpowers/specs/2026-05-16-sp2-ssr-seo-design.md` §3 (hub pages), §A (backend `hub_content`). This plan is **Phase 3** of SP2. Phases 1–2 (Vike skeleton, marketing SSG, job-detail SSR, schema module) are merged. Phases 4–6 (OG images, sitemaps, Indexing API, cutover) are later plans.
- **Routing disambiguation:** `/jobs/<x>` is a *job detail* when `<x>` ends in a `job_<id>` token, otherwise a *hub*. The Phase 2 job page (`pages/jobs/@jobPath/+route.js`) currently matches every `/jobs/<seg>`; this plan converts it to a route function so hubs and jobs coexist.
- **Hub shapes** (the path tail after `/jobs/`): `remote` · `<skill>` · `location/<city>` · `<skill>/remote` · `<skill>/location/<city>`. The **slug** is exactly that tail (e.g. `react`, `react/location/austin`).
- **Indexability threshold:** a hub with **≥5 matching active jobs** renders fully and is indexable; below 5 it still renders (thin) but emits `noindex,follow` and skips the AI-copy fetch.
- **AI resilience:** `generate_hub_copy` tries the LLM; on any failure or missing key it returns deterministic templated copy. Hub pages never 500 on AI failure.
- **Job matching:** a job matches a hub descriptor when — skill (if set) is in the job's `required_skills`+`nice_skills` (case-insensitive); remote (if set) requires `job.remote === true`; city (if set) requires the slugified `job.location` to contain the city slug.
- **Out of scope:** a `/jobs` job-list/search page (separate work); hub pagination; sitemap entries for hubs (Phase 4).
- Backend commands run from `backend/`; frontend from `frontend/`. The Bash working directory resets between turns — prefix with the absolute path.

---

# BACKEND

## Task 1: `hub_content` table + database helpers

**Files:**
- Create: `backend/supabase/migrations/007_hub_content.sql`
- Modify: `backend/api/core/database.py` (append a new section after the JOB RECRUITERS section)
- Test: `backend/tests/unit/test_hub_content_db.py`

- [ ] **Step 1: Write the failing test** — `backend/tests/unit/test_hub_content_db.py`

```python
"""Unit tests for hub_content database helpers."""

import pytest

from api.core.database import get_hub_content, create_hub_content


@pytest.mark.unit
def test_create_and_get_hub_content():
    create_hub_content({
        "slug": "react",
        "copy": "React jobs intro copy.",
        "faq_json": [{"q": "Q1", "a": "A1"}],
    })
    row = get_hub_content("react")
    assert row is not None
    assert row["copy"] == "React jobs intro copy."
    assert row["faq_json"] == [{"q": "Q1", "a": "A1"}]


@pytest.mark.unit
def test_get_missing_hub_content_returns_none():
    assert get_hub_content("does-not-exist") is None


@pytest.mark.unit
def test_faq_json_parsed_from_string():
    # Supabase may return jsonb as a string; the helper must normalize to a list.
    create_hub_content({"slug": "python", "copy": "c", "faq_json": '[{"q": "x", "a": "y"}]'})
    row = get_hub_content("python")
    assert row["faq_json"] == [{"q": "x", "a": "y"}]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/unit/test_hub_content_db.py -v`
Expected: FAIL — `ImportError: cannot import name 'get_hub_content'`.

- [ ] **Step 3: Create the migration** — `backend/supabase/migrations/007_hub_content.sql`

```sql
-- ─── Hub Content (cached AI copy for SEO hub pages) ──────
-- One row per hub slug (e.g. 'react', 'react/location/austin').
-- See docs/superpowers/specs/2026-05-16-sp2-ssr-seo-design.md §A.
create table if not exists public.hub_content (
  slug         text primary key,
  copy         text not null,
  faq_json     jsonb default '[]'::jsonb,
  generated_at timestamptz default now()
);

alter table public.hub_content enable row level security;
create policy "Service role full access" on public.hub_content
  for all using (true) with check (true);
```

- [ ] **Step 4: Add the database helpers**

In `backend/api/core/database.py`, insert this section immediately after `get_jobs_for_recruiter` (the last function in the JOB RECRUITERS section, before the `CONVERSATIONS & MESSAGES` banner):

```python
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  HUB CONTENT (cached SEO copy)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def _parse_hub_row(data: dict) -> dict:
    if not data:
        return data
    val = data.get("faq_json")
    if val is None:
        data["faq_json"] = []
    elif isinstance(val, str):
        import json as _json
        try:
            data["faq_json"] = _json.loads(val)
        except (ValueError, TypeError):
            data["faq_json"] = []
    return data


def get_hub_content(slug: str) -> Optional[dict]:
    res = supabase.table("hub_content").select("*").eq("slug", slug).limit(1).execute()
    return _parse_hub_row(res.data[0]) if res.data else None


def create_hub_content(row: dict) -> dict:
    res = supabase.table("hub_content").insert(row).execute()
    return _parse_hub_row(res.data[0])
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/unit/test_hub_content_db.py -v`
Expected: PASS — 3 tests.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add backend/supabase/migrations/007_hub_content.sql backend/api/core/database.py backend/tests/unit/test_hub_content_db.py
git commit -m "$(cat <<'EOF'
feat: add hub_content table and database helpers (SP2 phase 3)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Hub-copy AI service

**Files:**
- Create: `backend/api/services/seo_ai.py`
- Test: `backend/tests/unit/test_seo_ai.py`

- [ ] **Step 1: Write the failing test** — `backend/tests/unit/test_seo_ai.py`

```python
"""Unit tests for the hub-copy SEO AI service."""

import pytest

from api.services.seo_ai import parse_hub_slug, hub_label, generate_hub_copy


@pytest.mark.unit
def test_parse_hub_slug_shapes():
    assert parse_hub_slug("remote") == {"skill": None, "city": None, "remote": True}
    assert parse_hub_slug("react") == {"skill": "react", "city": None, "remote": False}
    assert parse_hub_slug("location/austin") == {"skill": None, "city": "austin", "remote": False}
    assert parse_hub_slug("react/remote") == {"skill": "react", "city": None, "remote": True}
    assert parse_hub_slug("react/location/austin") == {"skill": "react", "city": "austin", "remote": False}


@pytest.mark.unit
def test_parse_hub_slug_rejects_garbage():
    assert parse_hub_slug("") is None
    assert parse_hub_slug("a/b/c/d/e") is None
    assert parse_hub_slug("location") is None  # 'location' needs a city


@pytest.mark.unit
def test_hub_label_reads_naturally():
    assert hub_label({"skill": "react", "city": "austin", "remote": False}) == "React jobs in Austin"
    assert hub_label({"skill": "react", "city": None, "remote": True}) == "Remote React jobs"
    assert hub_label({"skill": None, "city": None, "remote": True}) == "Remote jobs"


@pytest.mark.unit
def test_generate_hub_copy_falls_back_without_llm(monkeypatch):
    # Force the LLM call to fail so the deterministic fallback is exercised.
    import api.services.seo_ai as mod
    monkeypatch.setattr(mod, "_call_llm", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("no key")))
    result = generate_hub_copy("react")
    assert isinstance(result["copy"], str) and len(result["copy"]) > 50
    assert isinstance(result["faq"], list) and len(result["faq"]) >= 1
    assert all("q" in item and "a" in item for item in result["faq"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/unit/test_seo_ai.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'api.services.seo_ai'`.

- [ ] **Step 3: Implement `backend/api/services/seo_ai.py`**

```python
"""
SEO Hub-Copy AI Service
=======================
Generates intro copy and FAQ for long-tail hub pages.
Uses the shared LLM infrastructure; degrades to deterministic templated
copy when the LLM is unconfigured or fails.
"""

from __future__ import annotations

from api.services.llm import _call_llm, _parse_json_response


_HUB_SYSTEM = """You are an SEO content strategist for JobsSearch, a job marketplace.
Given a description of a job-search hub page, write a helpful intro and FAQ.
Respond ONLY with valid JSON (no markdown fences) matching this schema:
{
  "copy": "<200-350 word intro paragraph about this job category>",
  "faq": [
    {"q": "<question>", "a": "<concise answer>"},
    {"q": "<question>", "a": "<concise answer>"},
    {"q": "<question>", "a": "<concise answer>"}
  ]
}"""


def parse_hub_slug(slug: str) -> dict | None:
    """Parse a hub slug into a descriptor, or None when the shape is invalid."""
    parts = [p for p in (slug or "").split("/") if p]
    if not parts or len(parts) > 3:
        return None

    skill = None
    city = None
    remote = False
    i = 0
    if parts[i] not in ("remote", "location"):
        skill = parts[i]
        i += 1
    if i < len(parts) and parts[i] == "remote":
        remote = True
        i += 1
    elif i < len(parts) and parts[i] == "location":
        if i + 1 >= len(parts):
            return None  # 'location' must be followed by a city
        city = parts[i + 1]
        i += 2

    if i != len(parts):
        return None  # leftover/unrecognized segments
    if skill is None and city is None and not remote:
        return None
    return {"skill": skill, "city": city, "remote": remote}


def hub_label(descriptor: dict) -> str:
    """Human-readable label, e.g. 'Remote React jobs in Austin'."""
    skill = descriptor.get("skill")
    city = descriptor.get("city")
    remote = descriptor.get("remote")
    prefix = "Remote " if remote else ""
    core = f"{skill.title()} jobs" if skill else "jobs"
    label = f"{prefix}{core}"
    if city:
        label += f" in {city.title()}"
    return label


def _fallback_copy(label: str) -> dict:
    return {
        "copy": (
            f"Explore {label} on JobsSearch. We aggregate openings from multiple "
            f"providers and score every role against your skills, experience, and "
            f"work preferences so you can decide whether to apply now, build proof "
            f"first, or pivot to a better-fit path. Browse the current {label.lower()} "
            f"below and create a free account to see your personalized match score."
        ),
        "faq": [
            {"q": f"How many {label.lower()} are available?",
             "a": "Listings update continuously as employers post and close roles. The roles shown below are live right now."},
            {"q": f"Can I get matched to {label.lower()}?",
             "a": "Yes. Create a free JobsSearch profile and our AI scores each role against your skills and preferences."},
            {"q": "Is JobsSearch free for job seekers?",
             "a": "Yes, job seekers can search, match, and apply for free."},
        ],
    }


def generate_hub_copy(slug: str) -> dict:
    """Return {copy, faq} for a hub slug — AI-generated, with templated fallback."""
    descriptor = parse_hub_slug(slug) or {"skill": None, "city": None, "remote": False}
    label = hub_label(descriptor)
    try:
        raw = _call_llm(_HUB_SYSTEM, f"Hub page: {label}", json_mode=True)
        result = _parse_json_response(raw)
        copy = (result.get("copy") or "").strip()
        faq = result.get("faq") or []
        valid_faq = [f for f in faq if isinstance(f, dict) and f.get("q") and f.get("a")]
        if len(copy) > 50 and valid_faq:
            return {"copy": copy, "faq": valid_faq}
    except Exception:
        pass
    return _fallback_copy(label)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/unit/test_seo_ai.py -v`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add backend/api/services/seo_ai.py backend/tests/unit/test_seo_ai.py
git commit -m "$(cat <<'EOF'
feat: add hub-copy AI service with templated fallback (SP2 phase 3)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `GET /api/seo/hub/{slug}` route

**Files:**
- Create: `backend/api/routes/seo.py`
- Modify: `backend/api/index.py` (imports line 25, registration line 79)
- Test: `backend/tests/test_seo_hub.py`

- [ ] **Step 1: Write the failing test** — `backend/tests/test_seo_hub.py`

```python
"""Integration tests for the SEO hub-content endpoint."""

import pytest


class TestHubContentEndpoint:

    @pytest.mark.integration
    def test_hub_endpoint_returns_copy_and_faq(self, client):
        resp = client.get("/api/seo/hub/react")
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body["copy"], str) and len(body["copy"]) > 50
        assert isinstance(body["faq"], list) and len(body["faq"]) >= 1
        assert body["slug"] == "react"

    @pytest.mark.integration
    def test_hub_endpoint_caches_after_first_call(self, client, mock_supabase):
        client.get("/api/seo/hub/python")
        rows = list(mock_supabase.store.get("hub_content", {}).values())
        assert any(r["slug"] == "python" for r in rows)

    @pytest.mark.integration
    def test_multi_segment_slug(self, client):
        resp = client.get("/api/seo/hub/react/location/austin")
        assert resp.status_code == 200
        assert resp.json()["slug"] == "react/location/austin"

    @pytest.mark.integration
    def test_invalid_slug_returns_400(self, client):
        resp = client.get("/api/seo/hub/a/b/c/d/e")
        assert resp.status_code == 400
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/test_seo_hub.py -v`
Expected: FAIL — all return 404 (route not registered).

- [ ] **Step 3: Implement `backend/api/routes/seo.py`**

```python
from fastapi import APIRouter, HTTPException

from api.core.database import get_hub_content, create_hub_content
from api.services.seo_ai import parse_hub_slug, generate_hub_copy

router = APIRouter(prefix="/api/seo", tags=["SEO"])


@router.get("/hub/{slug:path}")
async def get_hub(slug: str):
    """Return cached AI copy + FAQ for a hub slug; generate and cache on a miss."""
    slug = slug.strip("/").lower()
    if parse_hub_slug(slug) is None:
        raise HTTPException(status_code=400, detail="Invalid hub slug")

    cached = get_hub_content(slug)
    if cached:
        return {"slug": slug, "copy": cached["copy"], "faq": cached.get("faq_json", [])}

    generated = generate_hub_copy(slug)
    create_hub_content({
        "slug": slug,
        "copy": generated["copy"],
        "faq_json": generated["faq"],
    })
    return {"slug": slug, "copy": generated["copy"], "faq": generated["faq"]}
```

- [ ] **Step 4: Register the router in `backend/api/index.py`**

Change the import on line 25 from:

```python
from api.routes import auth, seeker, jobs, recruiter, company, chat, matcher, features, blog
```

to:

```python
from api.routes import auth, seeker, jobs, recruiter, company, chat, matcher, features, blog, seo
```

And add this line immediately after `app.include_router(blog.router)`:

```python
app.include_router(seo.router)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/test_seo_hub.py -v`
Expected: PASS — 4 tests.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add backend/api/routes/seo.py backend/api/index.py backend/tests/test_seo_hub.py
git commit -m "$(cat <<'EOF'
feat: add GET /api/seo/hub/{slug} cache-or-generate endpoint (SP2 phase 3)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# FRONTEND

## Task 4: Hub-path parsing helper

**Files:**
- Create: `frontend/src/lib/hubRoute.js`
- Test: `frontend/src/lib/hubRoute.test.js`

- [ ] **Step 1: Write the failing test** — `frontend/src/lib/hubRoute.test.js`

```js
import { describe, it, expect } from 'vitest';
import { parseHubPath, hubSlug, hubUrlPath, hubLabel, jobMatchesHub } from './hubRoute';

describe('parseHubPath', () => {
  it('parses every supported hub shape', () => {
    expect(parseHubPath('remote')).toEqual({ skill: null, city: null, remote: true });
    expect(parseHubPath('react')).toEqual({ skill: 'react', city: null, remote: false });
    expect(parseHubPath('location/austin')).toEqual({ skill: null, city: 'austin', remote: false });
    expect(parseHubPath('react/remote')).toEqual({ skill: 'react', city: null, remote: true });
    expect(parseHubPath('react/location/austin')).toEqual({ skill: 'react', city: 'austin', remote: false });
  });
  it('rejects job-detail paths and garbage', () => {
    expect(parseHubPath('senior-react-dev-job_abc123')).toBeNull();
    expect(parseHubPath('a/b/c/d')).toBeNull();
    expect(parseHubPath('location')).toBeNull();
    expect(parseHubPath('')).toBeNull();
  });
});

describe('hubSlug / hubUrlPath', () => {
  it('round-trips a descriptor', () => {
    const d = { skill: 'react', city: 'austin', remote: false };
    expect(hubSlug(d)).toBe('react/location/austin');
    expect(hubUrlPath(d)).toBe('/jobs/react/location/austin');
  });
  it('builds remote and skill+remote slugs', () => {
    expect(hubSlug({ skill: null, city: null, remote: true })).toBe('remote');
    expect(hubSlug({ skill: 'python', city: null, remote: true })).toBe('python/remote');
  });
});

describe('hubLabel', () => {
  it('reads naturally', () => {
    expect(hubLabel({ skill: 'react', city: 'austin', remote: false })).toBe('React jobs in Austin');
    expect(hubLabel({ skill: null, city: null, remote: true })).toBe('Remote jobs');
  });
});

describe('jobMatchesHub', () => {
  const job = { required_skills: ['React', 'TypeScript'], nice_skills: ['Next.js'], remote: true, location: 'Austin, TX' };
  it('matches on skill, remote, and city', () => {
    expect(jobMatchesHub(job, { skill: 'react', city: null, remote: false })).toBe(true);
    expect(jobMatchesHub(job, { skill: 'react', city: null, remote: true })).toBe(true);
    expect(jobMatchesHub(job, { skill: 'react', city: 'austin', remote: false })).toBe(true);
    expect(jobMatchesHub(job, { skill: 'python', city: null, remote: false })).toBe(false);
    expect(jobMatchesHub(job, { skill: null, city: 'denver', remote: false })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- src/lib/hubRoute.test.js`
Expected: FAIL — `Cannot find module './hubRoute'`.

- [ ] **Step 3: Implement `frontend/src/lib/hubRoute.js`**

```js
import { toSlug } from './slug';
import { jobIdFromPath } from './jobUrl';

// A hub path tail is the part after '/jobs/'. Supported shapes:
//   remote | <skill> | location/<city> | <skill>/remote | <skill>/location/<city>
export function parseHubPath(pathTail) {
  if (jobIdFromPath(pathTail)) return null; // it's a job-detail URL, not a hub
  const parts = String(pathTail || '').split('/').filter(Boolean);
  if (parts.length === 0 || parts.length > 3) return null;

  let skill = null;
  let city = null;
  let remote = false;
  let i = 0;
  if (parts[i] !== 'remote' && parts[i] !== 'location') {
    skill = parts[i];
    i += 1;
  }
  if (parts[i] === 'remote') {
    remote = true;
    i += 1;
  } else if (parts[i] === 'location') {
    if (i + 1 >= parts.length) return null;
    city = parts[i + 1];
    i += 2;
  }
  if (i !== parts.length) return null;
  if (!skill && !city && !remote) return null;
  return { skill: skill || null, city: city || null, remote };
}

export function hubSlug({ skill, city, remote }) {
  const segs = [];
  if (skill) segs.push(skill);
  if (remote) segs.push('remote');
  if (city) segs.push('location', city);
  return segs.join('/');
}

export function hubUrlPath(descriptor) {
  return `/jobs/${hubSlug(descriptor)}`;
}

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export function hubLabel({ skill, city, remote }) {
  const prefix = remote ? 'Remote ' : '';
  const core = skill ? `${titleCase(skill)} jobs` : 'jobs';
  let label = `${prefix}${core}`;
  if (city) label += ` in ${titleCase(city)}`;
  return label;
}

export function jobMatchesHub(job, { skill, city, remote }) {
  if (remote && !job.remote) return false;
  if (skill) {
    const haystack = [...(job.required_skills || []), ...(job.nice_skills || [])]
      .map((s) => s.toLowerCase());
    if (!haystack.includes(skill.toLowerCase())) return false;
  }
  if (city) {
    if (!toSlug(job.location || '').includes(city.toLowerCase())) return false;
  }
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- src/lib/hubRoute.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/lib/hubRoute.js frontend/src/lib/hubRoute.test.js
git commit -m "$(cat <<'EOF'
feat: add hub-path parsing and job-matching helpers (SP2 phase 3)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `ItemList` + `FAQPage` schema builders

**Files:**
- Modify: `frontend/src/schema/jsonld.js`
- Modify: `frontend/src/schema/jsonld.test.js`

- [ ] **Step 1: Add failing tests** to `frontend/src/schema/jsonld.test.js`

Append at the end of the file:

```js
import { itemList, faqPage } from './jsonld';

describe('itemList', () => {
  it('wraps jobs as an ItemList of JobPostings, positioned from 1', () => {
    const jobs = [
      { id: 'job_a', title: 'A', company_name: 'X', location: 'NYC', description: 'd', type: 'full-time', remote: false, created_at: '2026-03-01T00:00:00Z', required_skills: [], nice_skills: [] },
      { id: 'job_b', title: 'B', company_name: 'Y', location: 'LA', description: 'd', type: 'contract', remote: true, created_at: '2026-03-01T00:00:00Z', required_skills: [], nice_skills: [] },
    ];
    const ld = itemList(jobs);
    expect(ld['@type']).toBe('ItemList');
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[0].item['@type']).toBe('JobPosting');
    expect(ld.itemListElement[1].position).toBe(2);
  });
});

describe('faqPage', () => {
  it('builds a FAQPage from q/a pairs', () => {
    const ld = faqPage([{ q: 'Question?', a: 'Answer.' }]);
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity[0]['@type']).toBe('Question');
    expect(ld.mainEntity[0].name).toBe('Question?');
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('Answer.');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- src/schema/jsonld.test.js`
Expected: FAIL — `itemList`/`faqPage` are not exported.

- [ ] **Step 3: Add the builders** to `frontend/src/schema/jsonld.js`

Append at the end of the file:

```js
export function itemList(jobs) {
  return {
    '@type': 'ItemList',
    itemListElement: jobs.map((job, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: jobPosting(job),
    })),
  };
}

export function faqPage(qa) {
  return {
    '@type': 'FAQPage',
    mainEntity: qa.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- src/schema/jsonld.test.js`
Expected: PASS — all schema tests (original 9 + 2 new).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/schema/jsonld.js frontend/src/schema/jsonld.test.js
git commit -m "$(cat <<'EOF'
feat: add ItemList and FAQPage JSON-LD builders (SP2 phase 3)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Disambiguate the job-detail route

**Files:**
- Modify: `frontend/pages/jobs/@jobPath/+route.js`

The Phase 2 job page matches every `/jobs/<seg>`. Converting it to a route function so it claims **only** job-detail URLs (segment ending in `job_<id>`), leaving hub URLs for Task 7's page.

- [ ] **Step 1: Replace `frontend/pages/jobs/@jobPath/+route.js`** with a route function

```js
import { jobIdFromPath } from '../../../src/lib/jobUrl';

// Claim /jobs/<x> only when <x> ends in a job_<id> token. Hub URLs
// (/jobs/react, /jobs/remote, ...) fall through to pages/jobs-hub.
export default (pageContext) => {
  const m = pageContext.urlPathname.match(/^\/jobs\/([^/]+)\/?$/);
  if (!m) return false;
  if (!jobIdFromPath(m[1])) return false;
  return { routeParams: { jobPath: m[1] } };
};
```

- [ ] **Step 2: Build to verify the route still compiles**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/pages/jobs/@jobPath/+route.js
git commit -m "$(cat <<'EOF'
refactor: job-detail route claims only job_<id> URLs (SP2 phase 3)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Hub Vike SSR page

**Files:**
- Create: `frontend/pages/jobs-hub/+route.js`, `+config.js`, `+data.js`, `+Page.jsx`, `+Head.jsx`, `+title.js`

- [ ] **Step 1: Create `frontend/pages/jobs-hub/+route.js`** — a route function claiming hub URLs

```js
import { parseHubPath } from '../../src/lib/hubRoute';

// Claim /jobs/<tail> when <tail> parses as a valid hub descriptor.
export default (pageContext) => {
  const m = pageContext.urlPathname.match(/^\/jobs\/(.+?)\/?$/);
  if (!m) return false;
  const descriptor = parseHubPath(m[1]);
  if (!descriptor) return false;
  return { routeParams: { hubPath: m[1] } };
};
```

- [ ] **Step 2: Create `frontend/pages/jobs-hub/+config.js`** — SSR on request

```js
export default {
  ssr: true,
  prerender: false,
};
```

- [ ] **Step 3: Create `frontend/pages/jobs-hub/+data.js`**

```js
import { parseHubPath, hubSlug, jobMatchesHub } from '../../src/lib/hubRoute';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const INDEXABLE_THRESHOLD = 5;

// Runs on the server during SSR. Fetches matching jobs; only when the hub
// clears the indexability threshold does it fetch (cost-bounded) AI copy.
export async function data(pageContext) {
  const descriptor = parseHubPath(pageContext.routeParams.hubPath);
  if (!descriptor) return { descriptor: null };

  let jobs = [];
  try {
    const res = await fetch(`${API_BASE}/api/jobs?limit=100`);
    if (res.ok) {
      const all = await res.json();
      jobs = (Array.isArray(all) ? all : []).filter((j) => jobMatchesHub(j, descriptor));
    }
  } catch {
    jobs = [];
  }

  const indexable = jobs.length >= INDEXABLE_THRESHOLD;

  let copy = '';
  let faq = [];
  if (indexable) {
    try {
      const res = await fetch(`${API_BASE}/api/seo/hub/${hubSlug(descriptor)}`);
      if (res.ok) {
        const body = await res.json();
        copy = body.copy || '';
        faq = body.faq || [];
      }
    } catch {
      // Non-fatal — the hub still renders with listings, just no AI copy.
    }
  }

  return { descriptor, jobs, indexable, copy, faq };
}
```

- [ ] **Step 4: Create `frontend/pages/jobs-hub/+title.js`**

```js
import { parseHubPath, hubLabel } from '../../src/lib/hubRoute';

export default (pageContext) => {
  const descriptor = parseHubPath(pageContext.routeParams.hubPath);
  return descriptor
    ? `${hubLabel(descriptor)} | JobsSearch`
    : 'Jobs | JobsSearch';
};
```

- [ ] **Step 5: Create `frontend/pages/jobs-hub/+Head.jsx`**

```jsx
import { usePageContext } from 'vike-react/usePageContext';
import { itemList, faqPage, breadcrumbList } from '../../src/schema/jsonld';
import { hubUrlPath, hubLabel } from '../../src/lib/hubRoute';

export default function Head() {
  const { data } = usePageContext();
  const descriptor = data?.descriptor;
  if (!descriptor) {
    return <meta name="robots" content="noindex,follow" />;
  }
  const canonical = `https://jobssearch.work${hubUrlPath(descriptor)}`;
  const label = hubLabel(descriptor);

  // Below the indexability threshold: render but keep it out of the index.
  if (!data.indexable) {
    return (
      <>
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="noindex,follow" />
      </>
    );
  }

  const graph = [
    breadcrumbList([
      { name: 'Home', url: 'https://jobssearch.work/' },
      { name: 'Jobs', url: 'https://jobssearch.work/jobs' },
      { name: label, url: canonical },
    ]),
    itemList(data.jobs),
  ];
  if (data.faq && data.faq.length > 0) {
    graph.push(faqPage(data.faq));
  }
  const ld = { '@context': 'https://schema.org', '@graph': graph };

  return (
    <>
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={`${label} | JobsSearch`} />
      <meta property="og:url" content={canonical} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
```

- [ ] **Step 6: Create `frontend/pages/jobs-hub/+Page.jsx`**

```jsx
import { usePageContext } from 'vike-react/usePageContext';
import GlobalStyles from '../../src/styles/GlobalStyles';
import PublicNav from '../../src/components/PublicNav';
import Card from '../../src/components/ui/Card';
import { marketingNavProps } from '../../src/lib/vikeNav';
import { hubLabel, hubUrlPath } from '../../src/lib/hubRoute';
import { jobUrlPath } from '../../src/lib/jobUrl';

export default function HubPage() {
  const { data } = usePageContext();
  const nav = marketingNavProps('home');
  const descriptor = data?.descriptor;

  if (!descriptor) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        <GlobalStyles />
        <PublicNav {...nav} />
        <section style={{ maxWidth: 940, margin: '0 auto', padding: '64px 48px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: 'var(--ink)' }}>Jobs</h1>
        </section>
      </div>
    );
  }

  const label = hubLabel(descriptor);
  const jobs = data.jobs || [];

  // Sibling hubs: same skill in a couple of other dimensions, for internal linking.
  const siblings = [];
  if (descriptor.skill && !descriptor.remote) {
    siblings.push({ label: `Remote ${label}`, href: hubUrlPath({ ...descriptor, remote: true }) });
  }
  if (descriptor.skill && descriptor.city) {
    siblings.push({ label: `${hubLabel({ skill: descriptor.skill })}`, href: hubUrlPath({ skill: descriptor.skill, city: null, remote: false }) });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...nav} />
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '56px 48px 80px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, color: 'var(--ink)', marginBottom: 14 }}>{label}</h1>
        {data.copy && (
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 28, maxWidth: 720 }}>{data.copy}</p>
        )}

        {jobs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No open roles match this search right now. Check back soon.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
            {jobs.map((job) => (
              <a key={job.id} href={jobUrlPath(job)} style={{ textDecoration: 'none' }}>
                <Card style={{ padding: 20 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--ink)' }}>{job.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>
                    {job.company_name} · {job.location}{job.remote ? ' · Remote' : ''}
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )}

        {data.faq && data.faq.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'var(--ink)', marginBottom: 14 }}>Frequently asked</h2>
            {data.faq.map((item) => (
              <div key={item.q} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{item.q}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{item.a}</div>
              </div>
            ))}
          </div>
        )}

        {siblings.length > 0 && (
          <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {siblings.map((s) => (
              <a key={s.href} href={s.href} style={{ color: 'var(--coral)', fontWeight: 700, textDecoration: 'none' }}>{s.label} →</a>
            ))}
          </nav>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 7: Build to verify the hub route compiles**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run build`
Expected: build succeeds; `/jobs/@*` hub route listed as non-prerendered (SSR).

- [ ] **Step 8: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/pages/jobs-hub
git commit -m "$(cat <<'EOF'
feat: add SSR hub pages with ItemList/FAQ schema (SP2 phase 3)

Skill / location / remote hub pages derived from live job data;
sub-threshold hubs render noindex. AI copy fetched only at >=5 jobs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: SSR e2e assertion + final verification

**Files:**
- Modify: `frontend/e2e/ssr.spec.js`

- [ ] **Step 1: Add a hub SSR assertion** to `frontend/e2e/ssr.spec.js`

Append at the end of the file:

```js
test('a skill hub page server-renders a heading and is reachable', async ({ request }) => {
  // A hub URL always resolves (200) regardless of how many jobs match.
  const res = await request.get('/jobs/react');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toMatch(/<h1[^>]*>[^<]*[Rr]eact jobs/);
});

test('a job-detail URL still routes to the job page, not the hub', async ({ request }) => {
  // A segment ending in job_<id> must not be claimed by the hub route.
  const res = await request.get('/jobs/some-title-job_nonexistent');
  expect(res.status()).toBe(200);
  const html = await res.text();
  // The job page renders its not-found state for an unknown id.
  expect(html).toContain('no longer available');
});
```

- [ ] **Step 2: Run the SSR spec**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run test:e2e -- e2e/ssr.spec.js`
Expected: PASS — original 3 SSR tests plus the 2 new ones.

- [ ] **Step 3: Run the full frontend e2e + unit suites**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run test:e2e && npm test`
Expected: all e2e specs pass; all Vitest unit tests pass (including `hubRoute.test.js` and the extended `jsonld.test.js`).

- [ ] **Step 4: Run the backend fast gate**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow && node tools/verify.mjs --skip-frontend`
Expected: API parity, backend dependency consistency, and backend unit+integration tests all pass (including `test_hub_content_db.py`, `test_seo_ai.py`, `test_seo_hub.py`).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/e2e/ssr.spec.js
git commit -m "$(cat <<'EOF'
test: add SSR assertions for hub pages and route disambiguation (SP2 phase 3)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

**Spec §3 coverage:** routes for skill/remote/location/combinations (Task 7 route function via `parseHubPath`) ✓; taxonomy derived at request time from live job data (`+data.js` filters `/api/jobs`) ✓; ≥5-job indexability threshold with `noindex,follow` below it (Task 7 `+Head.jsx`) ✓; AI intro copy + `ItemList` + `FAQPage` JSON-LD + sibling internal links (Tasks 5, 7) ✓; hub copy from the backend (Tasks 1–3) ✓.

**Deferred / out of scope (not in this plan):** `/sitemap-hubs.xml` (Phase 4); a dedicated `/jobs` job-list page; hub pagination; OG images for hubs (Phase 4 — hubs use the static fallback OG image meanwhile).

**Known approximation:** `/api/jobs?limit=100` caps hub matching at the 100 most-recent active jobs — acceptable at current catalog size; revisit with a backend skill/location filter if the catalog grows large.

**Verify during execution:** Task 6/7 both rely on Vike honoring two route functions under `/jobs/*` and picking the one returning a truthy match. If Vike reports a route conflict, give the job-detail route function a higher `precedence` (return `{ precedence: 1, routeParams }`) — confirm against the installed `vike@0.4.259` routing docs.
