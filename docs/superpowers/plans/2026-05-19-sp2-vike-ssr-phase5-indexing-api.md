# SP2 Vike SSR — Phase 5: Google Indexing API Notifier

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a job posting is created or closed, notify the Google Indexing API so Google for Jobs re-crawls (or drops) the job URL promptly.

**Architecture:** A new backend service module wraps the Google Indexing API, authenticated with a service-account JSON credential supplied as a backend env secret. The job create/close route handlers schedule the notification via FastAPI `BackgroundTasks` — it runs after the response is sent, and the notifier swallows all errors, so a notification failure can never block or fail the job operation. When no credential is configured the notifier is a silent no-op.

**Tech Stack:** FastAPI, `google-auth` + `requests` (service-account OAuth2), pytest.

---

## Background & Decisions

- Spec: `docs/superpowers/specs/2026-05-16-sp2-ssr-seo-design.md` §B. This is **Phase 5** of SP2. Phases 1–4 (Vike SSR, hubs, sitemaps, OG images) are merged.
- **Credential:** the Google service-account JSON is supplied whole as the `GOOGLE_INDEXING_CREDENTIALS` env var (raw JSON string). No credential → the notifier no-ops. This matches the existing config pattern (`RAPIDAPI_KEY`, `WISPR_API_KEY` etc. in `backend/api/core/config.py`).
- **Non-blocking:** notifications are scheduled with FastAPI `BackgroundTasks` (run after the HTTP response). The notifier additionally catches every exception and returns a bool — it never raises. Two layers of protection so a job create/close is never affected.
- **Job URL:** the public URL is `https://jobssearch.work/jobs/<title-slug>-<id>` — the same shape the frontend builds (`jobUrlPath` in `frontend/src/lib/jobUrl.js`). The backend gets its own small slug helper since the two codebases are separate.
- **Verification ceiling (honest):** the actual Google Indexing API call cannot be verified without a real Google service-account credential, which only the human can provision. Locally verifiable: the no-op path, URL building, exception-safety, and that create/close schedule the notification. The live API round-trip is a documented post-deploy human check.
- **`close` vs `delete`:** the codebase has no hard-delete for jobs — `DELETE /api/jobs/{id}` (`close_job_endpoint`) sets status to `closed`. Per the spec, closing a job sends `URL_DELETED`.
- Backend commands run from `backend/`. The Bash working directory resets between turns — use absolute paths. Repo root: `c:\Users\sreek\myprojects\jobshunter\hireflow`.

---

## Task 1: Dependencies + config

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/pyproject.toml`
- Modify: `backend/api/core/config.py`

- [ ] **Step 1: Add the dependencies to `backend/requirements.txt`**

Append two lines to the end of `backend/requirements.txt`:

```
google-auth>=2.0.0
requests>=2.31.0
```

- [ ] **Step 2: Add the same dependencies to `backend/pyproject.toml`**

The repo enforces that `requirements.txt` and `pyproject.toml`'s `dependencies` list stay in sync (`tools/check-backend-deps.mjs`). In `backend/pyproject.toml`, inside the `dependencies = [` array, add two entries (place them alongside the other entries, before the closing `]`):

```
    "google-auth>=2.0.0",
    "requests>=2.31.0",
```

- [ ] **Step 3: Install them**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && python -m pip install "google-auth>=2.0.0" "requests>=2.31.0"`
Expected: both install (or report already-satisfied).

- [ ] **Step 4: Add the config var to `backend/api/core/config.py`**

In `backend/api/core/config.py`, find the block of env reads (the lines reading `RAPIDAPI_KEY`, `WISPR_API_KEY`, `OPENAI_API_KEY`). Add this line immediately after the `WISPR_API_KEY` line:

```python
GOOGLE_INDEXING_CREDENTIALS = os.environ.get("GOOGLE_INDEXING_CREDENTIALS", "").strip()
```

- [ ] **Step 5: Verify**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow && node tools/check-backend-deps.mjs`
Expected: `Backend dependency consistency check passed.` (the two files now match).
Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && python -c "from api.core.config import GOOGLE_INDEXING_CREDENTIALS; print('config OK:', repr(GOOGLE_INDEXING_CREDENTIALS))"`
Expected: `config OK: ''` (empty when the env var is unset — the no-op case).

- [ ] **Step 6: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add backend/requirements.txt backend/pyproject.toml backend/api/core/config.py
git commit -m "$(cat <<'EOF'
build: add google-auth dependency and GOOGLE_INDEXING_CREDENTIALS config (SP2 phase 5)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Indexing notifier service

**Files:**
- Create: `backend/api/services/indexing.py`
- Test: `backend/tests/unit/test_indexing.py`

- [ ] **Step 1: Write the failing tests** — `backend/tests/unit/test_indexing.py`

```python
"""Unit tests for the Google Indexing API notifier."""

import pytest

from api.services import indexing
from api.services.indexing import job_public_url, notify_url, notify_job_published


@pytest.mark.unit
def test_job_public_url_builds_a_slugged_url():
    url = job_public_url({"id": "job_abc123", "title": "Senior React Developer"})
    assert url == "https://jobssearch.work/jobs/senior-react-developer-job_abc123"


@pytest.mark.unit
def test_job_public_url_handles_messy_titles():
    url = job_public_url({"id": "job_x", "title": "  C++ / Go  Engineer!! "})
    assert url == "https://jobssearch.work/jobs/c-go-engineer-job_x"


@pytest.mark.unit
def test_notify_url_is_a_noop_when_unconfigured(monkeypatch):
    # No credential configured -> no-op, returns False, does not raise.
    monkeypatch.setattr(indexing, "GOOGLE_INDEXING_CREDENTIALS", "")
    assert notify_url("https://jobssearch.work/jobs/x-job_1", "URL_UPDATED") is False


@pytest.mark.unit
def test_notify_url_never_raises_on_bad_credential(monkeypatch):
    # A malformed credential must be caught — the notifier returns False, never raises.
    monkeypatch.setattr(indexing, "GOOGLE_INDEXING_CREDENTIALS", "not-valid-json")
    assert notify_url("https://jobssearch.work/jobs/x-job_1", "URL_UPDATED") is False


@pytest.mark.unit
def test_notify_job_published_uses_url_updated(monkeypatch):
    calls = []
    monkeypatch.setattr(indexing, "notify_url", lambda url, action: calls.append((url, action)))
    notify_job_published({"id": "job_1", "title": "Data Scientist"})
    assert calls == [("https://jobssearch.work/jobs/data-scientist-job_1", "URL_UPDATED")]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && python -m pytest tests/unit/test_indexing.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'api.services.indexing'`.

- [ ] **Step 3: Implement `backend/api/services/indexing.py`**

```python
"""
Google Indexing API Notifier
============================
Notifies Google's Indexing API when a job posting is published or closed,
so Google for Jobs re-crawls (or drops) the job URL.

Authenticated with a service-account JSON credential supplied whole as the
GOOGLE_INDEXING_CREDENTIALS env var. When the credential is absent the
notifier is a silent no-op. Every failure is caught and logged — a
notification never raises and never blocks the job operation.
"""

from __future__ import annotations

import logging
import re

from api.core.config import GOOGLE_INDEXING_CREDENTIALS

logger = logging.getLogger(__name__)

SITE = "https://jobssearch.work"
_INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"
_SCOPE = "https://www.googleapis.com/auth/indexing"


def _slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower())
    return re.sub(r"^-+|-+$", "", s)


def job_public_url(job: dict) -> str:
    """The canonical public URL of a job posting."""
    return f"{SITE}/jobs/{_slug(job.get('title', ''))}-{job['id']}"


def notify_url(url: str, action: str) -> bool:
    """Send a urlNotifications:publish to the Google Indexing API.

    `action` is 'URL_UPDATED' or 'URL_DELETED'. Returns True on success,
    False on a no-op (unconfigured) or any failure. Never raises.
    """
    if not GOOGLE_INDEXING_CREDENTIALS:
        logger.debug("Google Indexing not configured; skipping %s for %s", action, url)
        return False
    try:
        import json
        import requests
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request as GoogleAuthRequest

        info = json.loads(GOOGLE_INDEXING_CREDENTIALS)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=[_SCOPE],
        )
        creds.refresh(GoogleAuthRequest())

        resp = requests.post(
            _INDEXING_ENDPOINT,
            headers={"Authorization": f"Bearer {creds.token}"},
            json={"url": url, "type": action},
            timeout=10,
        )
        resp.raise_for_status()
        logger.info("Google Indexing notified: %s %s", action, url)
        return True
    except Exception as exc:
        logger.warning("Google Indexing notification failed (%s %s): %s", action, url, exc)
        return False


def notify_job_published(job: dict) -> bool:
    """Notify Google that a job posting is live (URL_UPDATED)."""
    return notify_url(job_public_url(job), "URL_UPDATED")


def notify_job_removed(job: dict) -> bool:
    """Notify Google that a job posting has closed (URL_DELETED)."""
    return notify_url(job_public_url(job), "URL_DELETED")
```

> Note: `requests` / `google-auth` are imported lazily inside `notify_url` so the no-op path and `job_public_url` carry no dependency, and the module imports cleanly regardless. `GOOGLE_INDEXING_CREDENTIALS` is imported at module load — the tests `monkeypatch` it on the `indexing` module, which works because the function reads the module-level name.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && python -m pytest tests/unit/test_indexing.py -v`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add backend/api/services/indexing.py backend/tests/unit/test_indexing.py
git commit -m "$(cat <<'EOF'
feat: add Google Indexing API notifier service (SP2 phase 5)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Wire the notifier into the job lifecycle

**Files:**
- Modify: `backend/api/routes/jobs.py` (imports; `create_job_endpoint`; `close_job_endpoint`)
- Test: `backend/tests/test_indexing_hooks.py`

- [ ] **Step 1: Write the failing test** — `backend/tests/test_indexing_hooks.py`

```python
"""Integration tests: job create/close schedule Google Indexing notifications."""

import pytest

import api.routes.jobs as jobs_route
from tests.conftest import auth_header


def _company_token(client):
    resp = client.post("/api/auth/login", json={"email": "techvault@demo.com", "password": "demo1234"})
    return resp.json()["access_token"]


class TestIndexingHooks:

    @pytest.mark.integration
    def test_creating_a_job_notifies_url_updated(self, seeded_client, monkeypatch):
        calls = []
        monkeypatch.setattr(jobs_route, "notify_job_published", lambda job: calls.append(job))

        token = _company_token(seeded_client)
        resp = seeded_client.post("/api/jobs", json={
            "title": "Indexed Role", "location": "Remote",
            "type": "full-time", "description": "A job.",
        }, headers=auth_header(token))
        assert resp.status_code == 201

        # BackgroundTasks run after the response — by now the hook has fired.
        assert len(calls) == 1
        assert calls[0]["title"] == "Indexed Role"

    @pytest.mark.integration
    def test_closing_a_job_notifies_url_deleted(self, seeded_client, monkeypatch):
        calls = []
        monkeypatch.setattr(jobs_route, "notify_job_removed", lambda job: calls.append(job))

        token = _company_token(seeded_client)
        resp = seeded_client.delete("/api/jobs/job_1", headers=auth_header(token))
        assert resp.status_code == 200

        assert len(calls) == 1
        assert calls[0]["id"] == "job_1"

    @pytest.mark.integration
    def test_create_still_succeeds_if_notifier_raises(self, seeded_client, monkeypatch):
        # A notifier exception must not affect the job operation.
        def boom(job):
            raise RuntimeError("indexing down")
        monkeypatch.setattr(jobs_route, "notify_job_published", boom)

        token = _company_token(seeded_client)
        resp = seeded_client.post("/api/jobs", json={
            "title": "Resilient Role", "location": "Remote",
            "type": "full-time", "description": "A job.",
        }, headers=auth_header(token))
        assert resp.status_code == 201
```

> Note on the last test: `notify_job_published`/`notify_job_removed` never raise in production (they catch everything). This test patches in a *raising* stub to prove that even a misbehaving notifier — scheduled as a `BackgroundTask` after the response — cannot turn a successful job create into a failure. The `201` is returned before background tasks run.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && python -m pytest tests/test_indexing_hooks.py -v`
Expected: FAIL — `AttributeError: module 'api.routes.jobs' has no attribute 'notify_job_published'`.

- [ ] **Step 3: Add the import to `backend/api/routes/jobs.py`**

At the top of `backend/api/routes/jobs.py`, the FastAPI import line is currently:
```python
from fastapi import APIRouter, Depends, HTTPException, Query
```
Change it to add `BackgroundTasks`:
```python
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
```

Then add a new import line after the existing `from api.models.schemas import (...)` block:
```python
from api.services.indexing import notify_job_published, notify_job_removed
```

- [ ] **Step 4: Schedule the notification in `create_job_endpoint`**

In `backend/api/routes/jobs.py`, the `create_job_endpoint` handler currently is:
```python
@router.post("", response_model=JobResponse, status_code=201)
async def create_job_endpoint(req: JobCreate, user: dict = Depends(require_user)):
    """Create a new job posting (company only)."""
    if user.get("role") != "company":
        raise HTTPException(status_code=403, detail="Only companies can create job postings")

    job_id = f"job_{uuid4().hex[:12]}"
    job = create_job({
        "id": job_id,
        "company_id": user["id"],
        **req.model_dump(),
        "type": req.type.value,
        "status": "active",
        "applicant_count": 0,
    })
    return _format_job(job)
```

Replace it with (adds the `background_tasks` parameter and the `add_task` call):
```python
@router.post("", response_model=JobResponse, status_code=201)
async def create_job_endpoint(
    req: JobCreate, background_tasks: BackgroundTasks, user: dict = Depends(require_user),
):
    """Create a new job posting (company only)."""
    if user.get("role") != "company":
        raise HTTPException(status_code=403, detail="Only companies can create job postings")

    job_id = f"job_{uuid4().hex[:12]}"
    job = create_job({
        "id": job_id,
        "company_id": user["id"],
        **req.model_dump(),
        "type": req.type.value,
        "status": "active",
        "applicant_count": 0,
    })
    background_tasks.add_task(notify_job_published, job)
    return _format_job(job)
```

- [ ] **Step 5: Schedule the notification in `close_job_endpoint`**

In `backend/api/routes/jobs.py`, the `close_job_endpoint` handler currently is:
```python
@router.delete("/{job_id}", response_model=SuccessResponse)
async def close_job_endpoint(job_id: str, user: dict = Depends(require_user)):
    """Close a job posting."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("company_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your job posting")
    close_job(job_id)
    return SuccessResponse(message="Job closed", id=job_id)
```

Replace it with:
```python
@router.delete("/{job_id}", response_model=SuccessResponse)
async def close_job_endpoint(
    job_id: str, background_tasks: BackgroundTasks, user: dict = Depends(require_user),
):
    """Close a job posting."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("company_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your job posting")
    close_job(job_id)
    background_tasks.add_task(notify_job_removed, job)
    return SuccessResponse(message="Job closed", id=job_id)
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && python -m pytest tests/test_indexing_hooks.py tests/test_jobs.py -v`
Expected: PASS — the 3 new hook tests plus the existing `test_jobs.py` suite (no regression — the `BackgroundTasks` parameter is injected by FastAPI and does not change the existing job-create/close behavior or responses).

- [ ] **Step 7: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add backend/api/routes/jobs.py backend/tests/test_indexing_hooks.py
git commit -m "$(cat <<'EOF'
feat: notify Google Indexing API on job create and close (SP2 phase 5)

Scheduled via FastAPI BackgroundTasks so a notification never blocks
or fails the job operation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Document the env var

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add `GOOGLE_INDEXING_CREDENTIALS` to the README environment docs**

In `README.md`, find where backend environment variables are documented (search for `RAPIDAPI_KEY` or `WISPR_API_KEY` — there is a backend env-var list or table). Add an entry for `GOOGLE_INDEXING_CREDENTIALS` consistent with the existing format, with this description:

```
GOOGLE_INDEXING_CREDENTIALS — (optional) Google service-account JSON (the whole file contents as one value) for the Google Indexing API. When set, the backend notifies Google when a job is created or closed. When unset, indexing notifications are silently skipped. The service account must be added as an owner of the property in Google Search Console.
```

If the README has no backend env-var section at all, add a short `### Optional environment variables` subsection near the existing backend setup instructions containing that entry.

- [ ] **Step 2: Verify**

Read the modified `README.md` section back and confirm the entry is present and well-formed.

- [ ] **Step 3: Commit**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add README.md
git commit -m "$(cat <<'EOF'
docs: document GOOGLE_INDEXING_CREDENTIALS env var (SP2 phase 5)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Final verification

- [ ] **Step 1: Backend fast gate**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow && node tools/verify.mjs --skip-frontend`
Expected: API contract parity passes, backend dependency consistency passes (the `requirements.txt`/`pyproject.toml` sync from Task 1), and backend unit+integration tests pass — including `test_indexing.py` and `test_indexing_hooks.py`.

- [ ] **Step 2: Backend regression suite**

Run: `cd c:\Users\sreek\myprojects\jobshunter\hireflow\backend && python -m pytest -m regression`
Expected: PASS — no regression from the `BackgroundTasks` parameter additions to the job handlers.

- [ ] **Step 3: Report the outstanding human check**

Summarize for the controller: the live Google Indexing API round-trip cannot be verified without a real `GOOGLE_INDEXING_CREDENTIALS` service-account credential. After deploy, with the credential set, a job create/close should be confirmed against the Indexing API (e.g. Search Console's URL Inspection, or the API's `urlNotifications/metadata` endpoint).

- [ ] **Step 4: Commit (only if Steps 1–2 required a fix; otherwise skip)**

```bash
cd c:\Users\sreek\myprojects\jobshunter\hireflow
git add -A
git commit -m "$(cat <<'EOF'
test: final verification fixes for SP2 phase 5

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

**Spec §B coverage:** service-account-authenticated Indexing API wrapper (Task 2 `indexing.py`); called from job `create` → `URL_UPDATED` and job `close` → `URL_DELETED` (Task 3); failures logged and non-fatal (Task 2 catches all exceptions + returns bool; Task 3 schedules via `BackgroundTasks` so it runs post-response). Credential as a backend env secret (Task 1 `GOOGLE_INDEXING_CREDENTIALS`).

**Verification ceiling:** the live Google API call needs a real credential — Task 5 Step 3 records it as a human post-deploy check. Everything else (no-op path, URL building, exception-safety, create/close scheduling, no regression) is verified locally.

**Type consistency:** `job_public_url`, `notify_url`, `notify_job_published`, `notify_job_removed` defined in Task 2 and consumed by Task 3's wiring — names match. `notify_url(url, action)` action values `"URL_UPDATED"`/`"URL_DELETED"` consistent across tasks.

**Verify during execution:** confirm `google-auth`'s `google.auth.transport.requests.Request` import path is current for the installed version; if it differs, adjust the lazy import in `notify_url` and re-run `test_indexing.py` (the bad-credential test exercises the import path).
