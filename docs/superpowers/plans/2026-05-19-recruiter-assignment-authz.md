# Recruiter Assignment & Hiring-Side Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement ADR-0001 (Recruiter as per-job assigned agency) and close three broken-access-control bugs where any authenticated user can read or mutate any job's applications.

**Architecture:** A new `job_recruiters` join table links recruiter users to specific jobs. A shared authorization predicate (`_user_can_access_job`) gates every hiring-side endpoint: a company may access jobs it owns; a recruiter may access jobs it is assigned to; everyone else is denied. Companies manage assignments through new endpoints on the jobs router. The recruiter pipeline is rescoped from "all applications" to "applications for assigned jobs only."

**Tech Stack:** FastAPI, Pydantic, Supabase (PostgreSQL). Tests: pytest with the in-memory `FakeSupabaseClient` fixture (no real DB).

---

## Background

See `docs/adr/0001-recruiter-as-per-job-assigned-agency.md` and `CONTEXT.md`.

Three bugs being fixed (all in `backend/api/routes/`):
1. `GET /jobs/{job_id}/applications` — no role/ownership check; any user reads any applicant.
2. `PATCH /jobs/applications/{app_id}/status` — no role/ownership check; any user mutates any application.
3. `GET /recruiter/pipeline` — returns `get_all_applications()` (whole system) to any caller; `recruiter.py` routes have no role guard.

**Authorization rules (from ADR-0001):**
- A **company** can access a job if `job.company_id == user.id`.
- A **recruiter** can access a job if a `job_recruiters` row links them.
- On an accessible job, a recruiter may advance application status to any value **except `hired`**; only the company may set `hired`.
- Job create/close stay company-only (already enforced — not touched).
- `/api/recruiter/*` routes are recruiter-only.
- Candidate search stays marketplace-wide (no per-job scoping) — only the role guard is added.

**Test infrastructure notes:**
- `seeded_client` fixture (`backend/tests/conftest.py`) seeds: companies `comp_1`/`comp_2`/`comp_3`, recruiter `rec_1`, jobs `job_1` (owned by `comp_1`), `job_2` (`comp_2`), `job_3` (`comp_3`). All seeded accounts use password `demo1234`. Logins: `techvault@demo.com` → `comp_1`, `datapulseai@demo.com` → `comp_2`, `recruiter@demo.com` → `rec_1`.
- The in-memory `FakeSupabaseClient` works for any table name with no migration. The `006` migration is only for real Supabase.
- `FakeTable.insert` adds a synthetic `id` uuid to rows lacking one. The `job_recruiters` table has a composite PK and no `id` column; the synthetic `id` in the fake store is harmless because all reads filter by `job_id`/`recruiter_id`.
- All commands below are run from the `backend/` directory unless stated otherwise.

---

## Task 1: `job_recruiters` schema + database layer

**Files:**
- Create: `backend/supabase/migrations/006_job_recruiters.sql`
- Modify: `backend/api/core/database.py` (append a new section after the APPLICATIONS section, before CONVERSATIONS — around line 189)
- Test: `backend/tests/unit/test_job_recruiters_db.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/unit/test_job_recruiters_db.py`:

```python
"""Unit tests for job_recruiters database helpers."""

import pytest

from api.core.database import (
    assign_recruiter_to_job,
    unassign_recruiter_from_job,
    get_recruiter_assignment,
    get_recruiters_for_job,
    get_jobs_for_recruiter,
)


@pytest.mark.unit
def test_assign_and_get_recruiter_assignment():
    assign_recruiter_to_job("job_1", "rec_1")
    assert get_recruiter_assignment("job_1", "rec_1") is not None
    assert get_recruiter_assignment("job_1", "rec_2") is None
    assert get_recruiter_assignment("job_2", "rec_1") is None


@pytest.mark.unit
def test_get_recruiters_for_job():
    assign_recruiter_to_job("job_1", "rec_1")
    assign_recruiter_to_job("job_1", "rec_2")
    assign_recruiter_to_job("job_2", "rec_3")
    assert set(get_recruiters_for_job("job_1")) == {"rec_1", "rec_2"}
    assert get_recruiters_for_job("job_3") == []


@pytest.mark.unit
def test_get_jobs_for_recruiter():
    assign_recruiter_to_job("job_1", "rec_1")
    assign_recruiter_to_job("job_2", "rec_1")
    assign_recruiter_to_job("job_3", "rec_2")
    assert set(get_jobs_for_recruiter("rec_1")) == {"job_1", "job_2"}
    assert get_jobs_for_recruiter("rec_9") == []


@pytest.mark.unit
def test_unassign_recruiter():
    assign_recruiter_to_job("job_1", "rec_1")
    unassign_recruiter_from_job("job_1", "rec_1")
    assert get_recruiter_assignment("job_1", "rec_1") is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/unit/test_job_recruiters_db.py -v`
Expected: FAIL — `ImportError: cannot import name 'assign_recruiter_to_job'`.

- [ ] **Step 3: Create the migration file**

Create `backend/supabase/migrations/006_job_recruiters.sql`:

```sql
-- ─── Job Recruiters (recruiter ↔ job assignments) ────────
-- Links an independent recruiter (users.role = 'recruiter') to a specific
-- job posting. See docs/adr/0001-recruiter-as-per-job-assigned-agency.md.
create table if not exists public.job_recruiters (
  job_id        text not null references public.jobs(id) on delete cascade,
  recruiter_id  text not null references public.users(id) on delete cascade,
  assigned_at   timestamptz default now(),
  primary key (job_id, recruiter_id)
);

create index if not exists idx_jr_recruiter on public.job_recruiters (recruiter_id);

alter table public.job_recruiters enable row level security;
create policy "Service role full access" on public.job_recruiters
  for all using (true) with check (true);
```

- [ ] **Step 4: Add the database helpers**

In `backend/api/core/database.py`, insert this section immediately after the `get_all_applications` function (after line 188, before the `CONVERSATIONS & MESSAGES` banner):

```python
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JOB RECRUITERS (recruiter ↔ job assignments)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def assign_recruiter_to_job(job_id: str, recruiter_id: str) -> dict:
    res = supabase.table("job_recruiters").insert(
        {"job_id": job_id, "recruiter_id": recruiter_id}
    ).execute()
    return res.data[0]


def unassign_recruiter_from_job(job_id: str, recruiter_id: str):
    supabase.table("job_recruiters").delete().eq("job_id", job_id).eq(
        "recruiter_id", recruiter_id
    ).execute()


def get_recruiter_assignment(job_id: str, recruiter_id: str) -> Optional[dict]:
    res = (
        supabase.table("job_recruiters")
        .select("*")
        .eq("job_id", job_id)
        .eq("recruiter_id", recruiter_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def get_recruiters_for_job(job_id: str) -> list[str]:
    res = supabase.table("job_recruiters").select("recruiter_id").eq("job_id", job_id).execute()
    return [r["recruiter_id"] for r in (res.data or [])]


def get_jobs_for_recruiter(recruiter_id: str) -> list[str]:
    res = supabase.table("job_recruiters").select("job_id").eq("recruiter_id", recruiter_id).execute()
    return [r["job_id"] for r in (res.data or [])]
```

- [ ] **Step 5: Run test to verify it passes**

Run: `python -m pytest tests/unit/test_job_recruiters_db.py -v`
Expected: PASS — 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/supabase/migrations/006_job_recruiters.sql backend/api/core/database.py backend/tests/unit/test_job_recruiters_db.py
git commit -m "$(cat <<'EOF'
feat: add job_recruiters table and database helpers

Implements the recruiter↔job assignment storage from ADR-0001.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Recruiter assignment endpoints (company-managed)

**Files:**
- Modify: `backend/api/models/schemas.py` (append after `ApplicationUpdateStatus`, around line 181)
- Modify: `backend/api/routes/jobs.py` (imports at lines 7-28; new endpoints appended after `update_app_status`, after line 257)
- Test: `backend/tests/test_job_recruiters_api.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_job_recruiters_api.py`:

```python
"""Integration tests for recruiter↔job assignment endpoints."""

import pytest
from tests.conftest import register_user, auth_header


def _company_token(client, email="techvault@demo.com"):
    resp = client.post("/api/auth/login", json={"email": email, "password": "demo1234"})
    return resp.json()["access_token"]


def _recruiter_token(client):
    resp = client.post("/api/auth/login", json={"email": "recruiter@demo.com", "password": "demo1234"})
    return resp.json()["access_token"]


class TestAssignRecruiter:

    @pytest.mark.integration
    def test_company_assigns_recruiter_to_own_job(self, seeded_client):
        token = _company_token(seeded_client)
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_1"},
            headers=auth_header(token),
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["job_id"] == "job_1"
        assert data["recruiter_id"] == "rec_1"

    @pytest.mark.integration
    def test_company_cannot_assign_to_other_companys_job(self, seeded_client):
        # comp_2 (datapulse) tries to assign a recruiter to comp_1's job_1
        token = _company_token(seeded_client, email="datapulseai@demo.com")
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_1"},
            headers=auth_header(token),
        )
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_recruiter_cannot_assign(self, seeded_client):
        token = _recruiter_token(seeded_client)
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_1"},
            headers=auth_header(token),
        )
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_assigning_non_recruiter_is_rejected(self, seeded_client):
        token = _company_token(seeded_client)
        seeker_token, seeker = register_user(seeded_client, email="notrec@test.com", role="seeker")
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": seeker["id"]},
            headers=auth_header(token),
        )
        assert resp.status_code == 400

    @pytest.mark.integration
    def test_assigning_unknown_user_is_404(self, seeded_client):
        token = _company_token(seeded_client)
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_does_not_exist"},
            headers=auth_header(token),
        )
        assert resp.status_code == 404

    @pytest.mark.integration
    def test_duplicate_assignment_is_conflict(self, seeded_client):
        token = _company_token(seeded_client)
        seeded_client.post("/api/jobs/job_1/recruiters", json={"recruiter_id": "rec_1"}, headers=auth_header(token))
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_1"},
            headers=auth_header(token),
        )
        assert resp.status_code == 409


class TestListAndUnassignRecruiters:

    @pytest.mark.integration
    def test_list_assigned_recruiters(self, seeded_client):
        token = _company_token(seeded_client)
        seeded_client.post("/api/jobs/job_1/recruiters", json={"recruiter_id": "rec_1"}, headers=auth_header(token))
        resp = seeded_client.get("/api/jobs/job_1/recruiters", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["recruiter_id"] == "rec_1"

    @pytest.mark.integration
    def test_company_unassigns_recruiter(self, seeded_client):
        token = _company_token(seeded_client)
        seeded_client.post("/api/jobs/job_1/recruiters", json={"recruiter_id": "rec_1"}, headers=auth_header(token))
        resp = seeded_client.delete("/api/jobs/job_1/recruiters/rec_1", headers=auth_header(token))
        assert resp.status_code == 200
        resp = seeded_client.get("/api/jobs/job_1/recruiters", headers=auth_header(token))
        assert resp.json() == []

    @pytest.mark.integration
    def test_assigned_recruiter_can_list_recruiters(self, seeded_client):
        token = _company_token(seeded_client)
        seeded_client.post("/api/jobs/job_1/recruiters", json={"recruiter_id": "rec_1"}, headers=auth_header(token))
        rec_token = _recruiter_token(seeded_client)
        resp = seeded_client.get("/api/jobs/job_1/recruiters", headers=auth_header(rec_token))
        assert resp.status_code == 200
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_job_recruiters_api.py -v`
Expected: FAIL — assignment returns 404/405 (route does not exist yet).

- [ ] **Step 3: Add the schemas**

In `backend/api/models/schemas.py`, insert after `class ApplicationUpdateStatus` (after line 180):

```python


class AssignRecruiterRequest(BaseModel):
    recruiter_id: str


class RecruiterAssignmentResponse(BaseModel):
    job_id: str
    recruiter_id: str
    recruiter_name: Optional[str] = None
    agency: Optional[str] = None
```

- [ ] **Step 4: Update the jobs.py imports**

In `backend/api/routes/jobs.py`, replace the database import block (lines 7-20) with — note this adds every `job_recruiters` helper needed by both this task and Task 3:

```python
from api.core.database import (
    get_user_by_id,
    get_job_by_id,
    search_jobs,
    create_job,
    update_job,
    close_job,
    get_application_by_id,
    get_application_by_job_and_seeker,
    get_applications_by_job,
    get_applications_by_seeker,
    create_application,
    update_application_status,
    assign_recruiter_to_job,
    unassign_recruiter_from_job,
    get_recruiter_assignment,
    get_recruiters_for_job,
)
```

Then replace the schemas import block (lines 21-28) with:

```python
from api.models.schemas import (
    JobCreate,
    JobResponse,
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdateStatus,
    AssignRecruiterRequest,
    RecruiterAssignmentResponse,
    SuccessResponse,
)
```

- [ ] **Step 5: Add the `_user_can_access_job` helper**

In `backend/api/routes/jobs.py`, insert this helper right after `_format_job` ends (after line 56):

```python


def _user_can_access_job(user: dict, job: dict) -> bool:
    """A company can access jobs it owns; a recruiter can access jobs it is assigned to."""
    role = user.get("role")
    if role == "company":
        return job.get("company_id") == user["id"]
    if role == "recruiter":
        return get_recruiter_assignment(job["id"], user["id"]) is not None
    return False
```

This predicate is the single authorization gate for hiring-side job access. It is used by the endpoints below and, in Task 3, by the two bug-fixed handlers.

- [ ] **Step 6: Add the assignment endpoints**

In `backend/api/routes/jobs.py`, append after `update_app_status` (after line 257):

```python


# ── Recruiter Assignments (Company-managed) ───────────────
@router.post("/{job_id}/recruiters", response_model=RecruiterAssignmentResponse, status_code=201)
async def assign_recruiter(job_id: str, req: AssignRecruiterRequest, user: dict = Depends(require_user)):
    """Assign a recruiter to a job posting (owning company only)."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if user.get("role") != "company" or job.get("company_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Only the owning company can assign recruiters")

    recruiter = get_user_by_id(req.recruiter_id)
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    if recruiter.get("role") != "recruiter":
        raise HTTPException(status_code=400, detail="User is not a recruiter")

    if get_recruiter_assignment(job_id, req.recruiter_id):
        raise HTTPException(status_code=409, detail="Recruiter already assigned to this job")

    assign_recruiter_to_job(job_id, req.recruiter_id)
    return RecruiterAssignmentResponse(
        job_id=job_id,
        recruiter_id=req.recruiter_id,
        recruiter_name=recruiter.get("name"),
        agency=recruiter.get("agency"),
    )


@router.delete("/{job_id}/recruiters/{recruiter_id}", response_model=SuccessResponse)
async def unassign_recruiter(job_id: str, recruiter_id: str, user: dict = Depends(require_user)):
    """Remove a recruiter from a job posting (owning company only)."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if user.get("role") != "company" or job.get("company_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Only the owning company can unassign recruiters")

    unassign_recruiter_from_job(job_id, recruiter_id)
    return SuccessResponse(message="Recruiter unassigned", id=recruiter_id)


@router.get("/{job_id}/recruiters", response_model=list[RecruiterAssignmentResponse])
async def list_job_recruiters(job_id: str, user: dict = Depends(require_user)):
    """List recruiters assigned to a job (owning company or an assigned recruiter)."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not _user_can_access_job(user, job):
        raise HTTPException(status_code=403, detail="You do not have access to this job")

    results = []
    for rid in get_recruiters_for_job(job_id):
        recruiter = get_user_by_id(rid) or {}
        results.append(RecruiterAssignmentResponse(
            job_id=job_id,
            recruiter_id=rid,
            recruiter_name=recruiter.get("name"),
            agency=recruiter.get("agency"),
        ))
    return results
```

- [ ] **Step 7: Run test to verify it passes**

Run: `python -m pytest tests/test_job_recruiters_api.py -v`
Expected: PASS — all 9 tests pass.

- [ ] **Step 8: Commit**

```bash
git add backend/api/models/schemas.py backend/api/routes/jobs.py backend/tests/test_job_recruiters_api.py
git commit -m "$(cat <<'EOF'
feat: add company-managed recruiter assignment endpoints

POST/GET/DELETE /api/jobs/{job_id}/recruiters. Adds the
_user_can_access_job authorization predicate (ADR-0001).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Fix `get_job_applications` and `update_app_status` authorization

**Files:**
- Modify: `backend/api/routes/jobs.py` (`get_job_applications` lines 223-238; `update_app_status` lines 241-257)
- Test: `backend/tests/test_application_authz.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_application_authz.py`:

```python
"""Integration tests for hiring-side application authorization (ADR-0001)."""

import pytest
from tests.conftest import register_user, auth_header


def _company_token(client, email="techvault@demo.com"):
    resp = client.post("/api/auth/login", json={"email": email, "password": "demo1234"})
    return resp.json()["access_token"]


def _recruiter_token(client):
    resp = client.post("/api/auth/login", json={"email": "recruiter@demo.com", "password": "demo1234"})
    return resp.json()["access_token"]


def _apply_to_job_1(client):
    """Register a seeker, apply to job_1, return (seeker_token, application_id)."""
    token, _ = register_user(client, email="applicant1@test.com", role="seeker", name="Applicant One")
    resp = client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
    return token, resp.json()["id"]


def _assign_rec_1_to_job_1(client):
    token = _company_token(client)
    client.post("/api/jobs/job_1/recruiters", json={"recruiter_id": "rec_1"}, headers=auth_header(token))


class TestGetJobApplications:

    @pytest.mark.integration
    def test_owning_company_can_list_applications(self, seeded_client):
        _apply_to_job_1(seeded_client)
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(_company_token(seeded_client)))
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.integration
    def test_assigned_recruiter_can_list_applications(self, seeded_client):
        _apply_to_job_1(seeded_client)
        _assign_rec_1_to_job_1(seeded_client)
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(_recruiter_token(seeded_client)))
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.integration
    def test_unassigned_recruiter_cannot_list_applications(self, seeded_client):
        _apply_to_job_1(seeded_client)
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(_recruiter_token(seeded_client)))
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_other_company_cannot_list_applications(self, seeded_client):
        _apply_to_job_1(seeded_client)
        token = _company_token(seeded_client, email="datapulseai@demo.com")
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(token))
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_seeker_cannot_list_applications(self, seeded_client):
        # Regression: a seeker must not be able to read competitors' applications.
        seeker_token, _ = _apply_to_job_1(seeded_client)
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(seeker_token))
        assert resp.status_code == 403


class TestUpdateApplicationStatus:

    @pytest.mark.integration
    def test_owning_company_can_advance_status(self, seeded_client):
        _, app_id = _apply_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "interview"},
            headers=auth_header(_company_token(seeded_client)),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "interview"

    @pytest.mark.integration
    def test_owning_company_can_mark_hired(self, seeded_client):
        _, app_id = _apply_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "hired"},
            headers=auth_header(_company_token(seeded_client)),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "hired"

    @pytest.mark.integration
    def test_assigned_recruiter_can_advance_status(self, seeded_client):
        _, app_id = _apply_to_job_1(seeded_client)
        _assign_rec_1_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "offer"},
            headers=auth_header(_recruiter_token(seeded_client)),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "offer"

    @pytest.mark.integration
    def test_recruiter_cannot_mark_hired(self, seeded_client):
        _, app_id = _apply_to_job_1(seeded_client)
        _assign_rec_1_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "hired"},
            headers=auth_header(_recruiter_token(seeded_client)),
        )
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_unassigned_recruiter_cannot_advance_status(self, seeded_client):
        _, app_id = _apply_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "interview"},
            headers=auth_header(_recruiter_token(seeded_client)),
        )
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_seeker_cannot_advance_status(self, seeded_client):
        # Regression: a seeker must not be able to mutate any application.
        seeker_token, app_id = _apply_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "hired"},
            headers=auth_header(seeker_token),
        )
        assert resp.status_code == 403
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_application_authz.py -v`
Expected: FAIL — `test_seeker_cannot_list_applications`, `test_seeker_cannot_advance_status`, `test_unassigned_recruiter_*`, `test_other_company_*`, and `test_recruiter_cannot_mark_hired` return `200` instead of `403` (the bugs).

- [ ] **Step 3: Confirm the `_user_can_access_job` helper exists**

It was added in Task 2 Step 5. If for any reason it is missing, add it after `_format_job` in `backend/api/routes/jobs.py`:

```python


def _user_can_access_job(user: dict, job: dict) -> bool:
    """A company can access jobs it owns; a recruiter can access jobs it is assigned to."""
    role = user.get("role")
    if role == "company":
        return job.get("company_id") == user["id"]
    if role == "recruiter":
        return get_recruiter_assignment(job["id"], user["id"]) is not None
    return False
```

- [ ] **Step 4: Fix `get_job_applications`**

In `backend/api/routes/jobs.py`, replace the `get_job_applications` function (lines 223-238) with:

```python
@router.get("/{job_id}/applications", response_model=list[ApplicationResponse])
async def get_job_applications(job_id: str, user: dict = Depends(require_user)):
    """Get all applications for a job (owning company or an assigned recruiter only)."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not _user_can_access_job(user, job):
        raise HTTPException(status_code=403, detail="You do not have access to this job's applications")

    apps = get_applications_by_job(job_id)
    return [
        ApplicationResponse(
            id=a["id"], job_id=a["job_id"], seeker_id=a["seeker_id"],
            status=a["status"], cover_letter=a.get("cover_letter"),
            created_at=a.get("created_at", ""),
        )
        for a in apps
    ]
```

- [ ] **Step 5: Fix `update_app_status`**

In `backend/api/routes/jobs.py`, replace the `update_app_status` function (lines 241-257) with:

```python
@router.patch("/applications/{app_id}/status", response_model=ApplicationResponse)
async def update_app_status(app_id: str, req: ApplicationUpdateStatus, user: dict = Depends(require_user)):
    """Update application status (move a candidate through the pipeline).

    Owning company or an assigned recruiter only. Only the company may set 'hired'.
    """
    app = get_application_by_id(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    job = get_job_by_id(app["job_id"])
    if not job or not _user_can_access_job(user, job):
        raise HTTPException(status_code=403, detail="You do not have access to this application")

    if req.status.value == "hired" and user.get("role") != "company":
        raise HTTPException(status_code=403, detail="Only the company can mark a candidate as hired")

    updated = update_application_status(app_id, req.status.value)

    return ApplicationResponse(
        id=app["id"], job_id=app["job_id"], seeker_id=app["seeker_id"],
        status=updated.get("status", req.status.value),
        cover_letter=app.get("cover_letter"),
        job=_format_job(job),
        created_at=app.get("created_at", ""),
    )
```

- [ ] **Step 6: Run test to verify it passes**

Run: `python -m pytest tests/test_application_authz.py -v`
Expected: PASS — all 11 tests pass.

- [ ] **Step 7: Run the existing jobs suite to check for regressions**

Run: `python -m pytest tests/test_jobs.py -v`
Expected: PASS. `test_update_application_status` still passes (it logs in as the owning company `techvault@demo.com`).

- [ ] **Step 8: Commit**

```bash
git add backend/api/routes/jobs.py backend/tests/test_application_authz.py
git commit -m "$(cat <<'EOF'
fix: scope job application access to owning company and assigned recruiters

Closes broken-access-control bugs where any authenticated user could
read or mutate any job's applications. Only the company may set 'hired'.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Recruiter route guards and scoped pipeline

**Files:**
- Modify: `backend/api/routes/recruiter.py` (imports lines 3-15; new helper; all four route handlers)
- Test: `backend/tests/test_recruiter_authz.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_recruiter_authz.py`:

```python
"""Integration tests for /api/recruiter authorization and pipeline scoping."""

import pytest
from tests.conftest import register_user, auth_header


def _company_token(client, email="techvault@demo.com"):
    resp = client.post("/api/auth/login", json={"email": email, "password": "demo1234"})
    return resp.json()["access_token"]


def _recruiter_token(client):
    resp = client.post("/api/auth/login", json={"email": "recruiter@demo.com", "password": "demo1234"})
    return resp.json()["access_token"]


class TestRecruiterRouteGuards:

    @pytest.mark.integration
    def test_seeker_cannot_access_candidates(self, seeded_client):
        token, _ = register_user(seeded_client, email="s1@test.com", role="seeker")
        resp = seeded_client.get("/api/recruiter/candidates", headers=auth_header(token))
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_company_cannot_access_recruiter_pipeline(self, seeded_client):
        resp = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(_company_token(seeded_client)))
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_unauthenticated_cannot_access_analytics(self, seeded_client):
        resp = seeded_client.get("/api/recruiter/analytics")
        assert resp.status_code == 401

    @pytest.mark.integration
    def test_recruiter_can_access_candidates(self, seeded_client):
        resp = seeded_client.get("/api/recruiter/candidates", headers=auth_header(_recruiter_token(seeded_client)))
        assert resp.status_code == 200

    @pytest.mark.integration
    def test_recruiter_can_access_advanced_search(self, seeded_client):
        resp = seeded_client.post(
            "/api/recruiter/candidates/search",
            json={"query": None, "skills": [], "roles": [], "min_match": 0},
            headers=auth_header(_recruiter_token(seeded_client)),
        )
        assert resp.status_code == 200


class TestPipelineScoping:

    @pytest.mark.integration
    def test_pipeline_excludes_unassigned_jobs(self, seeded_client):
        # A seeker applies to job_2 (comp_2). rec_1 is NOT assigned to job_2.
        seeker_token, _ = register_user(seeded_client, email="appj2@test.com", role="seeker")
        seeded_client.post("/api/jobs/job_2/apply", json={"job_id": "job_2"}, headers=auth_header(seeker_token))

        resp = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(_recruiter_token(seeded_client)))
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    @pytest.mark.integration
    def test_pipeline_includes_assigned_jobs(self, seeded_client):
        # A seeker applies to job_1; comp_1 assigns rec_1 to job_1.
        seeker_token, _ = register_user(seeded_client, email="appj1@test.com", role="seeker", name="Pat Applicant")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(seeker_token))
        seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_1"},
            headers=auth_header(_company_token(seeded_client)),
        )

        resp = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(_recruiter_token(seeded_client)))
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert body["pipeline"]["applied"][0]["job_id"] == "job_1"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_recruiter_authz.py -v`
Expected: FAIL — `test_seeker_cannot_access_candidates` and `test_company_cannot_access_recruiter_pipeline` return `200` (no role guard); `test_pipeline_excludes_unassigned_jobs` returns `total == 1` (pipeline is unscoped).

- [ ] **Step 3: Update the recruiter.py imports**

In `backend/api/routes/recruiter.py`, replace the imports block (lines 1-16) with:

```python
from fastapi import APIRouter, Depends, HTTPException, Query

from api.core.config import require_user
from api.core.database import (
    get_seekers_with_skills,
    get_active_jobs,
    get_job_by_id,
    get_user_by_id,
    get_applications_by_job,
    get_jobs_for_recruiter,
)
from api.models.schemas import (
    CandidateResponse,
    CandidateSearchRequest,
    RecruiterAnalytics,
)
from api.services.ai import compute_candidate_match
```

> Note: `get_all_applications` is removed from the import — it is no longer used after the pipeline rescope.

- [ ] **Step 4: Add the role-guard helper**

In `backend/api/routes/recruiter.py`, insert immediately after the `router = APIRouter(...)` line (after line 18 in the original):

```python


def _require_recruiter(user: dict):
    """Reject any caller whose role is not 'recruiter'."""
    if user.get("role") != "recruiter":
        raise HTTPException(status_code=403, detail="Recruiter access only")
```

- [ ] **Step 5: Add the guard to all four route handlers**

In `backend/api/routes/recruiter.py`, add `_require_recruiter(user)` as the first statement in each handler body:

In `search_candidates` — replace the docstring line with:
```python
    """Search and rank candidates. Optionally match against a specific job."""
    _require_recruiter(user)
    seekers = get_seekers_with_skills()
```

In `search_candidates_advanced` — replace the docstring line with:
```python
    """Advanced candidate search with structured filters."""
    _require_recruiter(user)
    seekers = get_seekers_with_skills()
```

In `get_recruiter_analytics` — replace the docstring line with:
```python
    """Get recruiter analytics dashboard data."""
    _require_recruiter(user)
    return RecruiterAnalytics(
```

- [ ] **Step 6: Rewrite `get_pipeline` to scope by assigned jobs**

In `backend/api/routes/recruiter.py`, replace the entire `get_pipeline` function (lines 121-146 in the original) with:

```python
@router.get("/pipeline", response_model=dict)
async def get_pipeline(user: dict = Depends(require_user)):
    """Get the hiring pipeline for the recruiter's assigned jobs, grouped by stage."""
    _require_recruiter(user)
    stages = ["applied", "screening", "interview", "offer", "hired"]
    pipeline = {stage: [] for stage in stages}

    for job_id in get_jobs_for_recruiter(user["id"]):
        job = get_job_by_id(job_id) or {}
        for app in get_applications_by_job(job_id):
            status = app.get("status", "applied")
            if status in pipeline:
                seeker = get_user_by_id(app.get("seeker_id", "")) or {}
                pipeline[status].append({
                    "application_id": app["id"],
                    "candidate_name": seeker.get("name", "Unknown"),
                    "candidate_id": app.get("seeker_id"),
                    "job_title": job.get("title", "Unknown"),
                    "job_id": job_id,
                    "applied_at": app.get("created_at"),
                })

    return {
        "stages": stages,
        "pipeline": pipeline,
        "total": sum(len(v) for v in pipeline.values()),
    }
```

- [ ] **Step 7: Run test to verify it passes**

Run: `python -m pytest tests/test_recruiter_authz.py -v`
Expected: PASS — all 7 tests pass.

- [ ] **Step 8: Run the existing recruiter suite to check for regressions**

Run: `python -m pytest tests/test_recruiter.py -v`
Expected: PASS. If any existing test calls a `/api/recruiter/*` route as a non-recruiter and expected `200`, that test was asserting the bug — update it to log in as `recruiter@demo.com` or to expect `403`. Report any such change.

- [ ] **Step 9: Commit**

```bash
git add backend/api/routes/recruiter.py backend/tests/test_recruiter_authz.py
git commit -m "$(cat <<'EOF'
fix: enforce recruiter-only access and scope pipeline to assigned jobs

/api/recruiter/* now rejects non-recruiters; the pipeline returns only
applications for the recruiter's assigned jobs instead of the whole system.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Documentation update

**Files:**
- Modify: `docs/adr/0001-recruiter-as-per-job-assigned-agency.md` (add a Status line)
- Modify: `docs/ARCHITECTURE.md` (section 9, "Current Gaps and Technical Notes")
- Modify: `README.md` (API Endpoints table — add the three new routes)

- [ ] **Step 1: Mark ADR-0001 accepted**

In `docs/adr/0001-recruiter-as-per-job-assigned-agency.md`, insert directly under the H1 title line:

```markdown

**Status:** accepted — implemented 2026-05-19
```

- [ ] **Step 2: Update ARCHITECTURE.md**

Open `docs/ARCHITECTURE.md`, find section `## 9. Current Gaps and Technical Notes`. Remove any line stating that recruiter views are unscoped or that application endpoints lack authorization (if present). Add this line under section 9:

```markdown
- Recruiters are assigned to individual jobs via the `job_recruiters` table (ADR-0001); hiring-side endpoints are scoped to owned/assigned jobs.
```

- [ ] **Step 3: Update the README API table**

In `README.md`, in the API Endpoints table, add these rows in the jobs group (after the `/api/jobs/applications/{id}/status` row):

```markdown
| POST | `/api/jobs/{id}/recruiters` | Assign a recruiter to a job (company) |
| GET | `/api/jobs/{id}/recruiters` | List recruiters assigned to a job |
| DELETE | `/api/jobs/{id}/recruiters/{recruiter_id}` | Unassign a recruiter (company) |
```

- [ ] **Step 4: Verify API parity check still passes**

Run from the repo root: `node tools/check-api-parity.mjs`
Expected: `API parity check passed.` (The new README rows match the new backend routes.)

- [ ] **Step 5: Commit**

```bash
git add docs/adr/0001-recruiter-as-per-job-assigned-agency.md docs/ARCHITECTURE.md README.md
git commit -m "$(cat <<'EOF'
docs: record recruiter assignment model and endpoints

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification

- [ ] **Run the full fast gate from the repo root:**

Run: `node tools/verify.mjs --skip-frontend`
Expected: API parity passes, backend dependency consistency passes, backend unit + integration tests pass.

- [ ] **Run the backend regression suite to confirm no cross-flow breakage:**

Run (from `backend/`): `python -m pytest -m regression -v`
Expected: PASS. If a regression test exercised the old unscoped behavior, update it to the ADR-0001 model and report the change.

---

## Out of Scope (tracked, not done here)

- `verify.ps1` running bare `pytest` instead of `python -m pytest` (drift fix).
- `search_external_jobs` docstring saying "JSearch + Jobs API" while `search_all_providers` says "5 providers".
- Renaming the practice feature to `practice_sessions` / `/api/practice` (separate terminology pass).
- `scout.py` / `interview.py` switching to `require_user` (separate plan).
