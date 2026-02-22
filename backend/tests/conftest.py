"""
Shared test fixtures.

Mocks the Supabase client so that all tests run against an in-memory
dict-backed store — no real database needed.
"""

import os
import pytest
from unittest.mock import MagicMock
from datetime import datetime, timezone
from uuid import uuid4

# ─── Set env vars BEFORE any app imports ──────────────────
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-role-key"
os.environ["SECRET_KEY"] = "test-secret-key-for-unit-tests"


# ═════════════════════════════════════════════════════════
#  In-Memory Supabase Mock
# ═════════════════════════════════════════════════════════
class FakeTable:
    """Dict-backed mock that mimics the Supabase query builder."""

    def __init__(self, store: dict, table_name: str):
        self._store = store
        self._table = table_name
        self._filters = []
        self._select_cols = "*"
        self._order_col = None
        self._order_desc = False
        self._limit_n = None
        self._count_mode = None
        self._maybe_single_flag = False

    def _rows(self):
        rows = list(self._store.get(self._table, {}).values())
        for f in self._filters:
            rows = [r for r in rows if f(r)]
        if self._order_col:
            rows.sort(key=lambda r: str(r.get(self._order_col, "")), reverse=self._order_desc)
        if self._limit_n:
            rows = rows[: self._limit_n]
        return rows

    def select(self, cols="*", count=None):
        self._select_cols = cols
        self._count_mode = count
        return self

    def eq(self, col, val):
        self._filters.append(lambda r, c=col, v=val: r.get(c) == v)
        return self

    def neq(self, col, val):
        self._filters.append(lambda r, c=col, v=val: r.get(c) != v)
        return self

    def in_(self, col, vals):
        self._filters.append(lambda r, c=col, vs=vals: r.get(c) in vs)
        return self

    def order(self, col, desc=False):
        self._order_col = col
        self._order_desc = desc
        return self

    def limit(self, n):
        self._limit_n = n
        return self

    def maybe_single(self):
        self._maybe_single_flag = True
        return self

    def insert(self, data):
        self._insert_data = data if isinstance(data, list) else [data]
        return self

    def update(self, data):
        self._update_data = data
        return self

    def delete(self):
        self._delete_flag = True
        return self

    def execute(self):
        tbl = self._store.setdefault(self._table, {})
        result = MagicMock()

        # ── Insert ────────────────────────────────────────
        if hasattr(self, "_insert_data"):
            inserted = []
            for row in self._insert_data:
                row.setdefault("created_at", datetime.now(timezone.utc).isoformat())
                key = row.get("id") or str(uuid4())
                row.setdefault("id", key)
                tbl[key] = {**row}
                inserted.append({**row})
            result.data = inserted
            result.count = len(inserted)
            return result

        # ── Update ────────────────────────────────────────
        if hasattr(self, "_update_data"):
            rows = self._rows()
            updated = []
            for row in rows:
                key = row["id"]
                tbl[key].update(self._update_data)
                updated.append({**tbl[key]})
            result.data = updated
            result.count = len(updated)
            return result

        # ── Delete ────────────────────────────────────────
        if hasattr(self, "_delete_flag"):
            rows = self._rows()
            for row in rows:
                tbl.pop(row["id"], None)
            result.data = rows
            result.count = len(rows)
            return result

        # ── Select ────────────────────────────────────────
        rows = self._rows()
        if self._maybe_single_flag:
            result.data = rows[0] if rows else None
        else:
            result.data = rows
        result.count = len(rows) if not self._maybe_single_flag else (1 if rows else 0)
        return result


class FakeSupabaseClient:
    """In-memory Supabase client replacement."""

    def __init__(self):
        self.store: dict[str, dict] = {}

    def table(self, name: str) -> FakeTable:
        return FakeTable(self.store, name)

    def reset(self):
        self.store.clear()


# ═════════════════════════════════════════════════════════
#  Fixtures
# ═════════════════════════════════════════════════════════
@pytest.fixture(autouse=True)
def mock_supabase(monkeypatch):
    """Replace the real Supabase client with our in-memory fake."""
    fake = FakeSupabaseClient()
    import api.core.database as db_mod
    monkeypatch.setattr(db_mod, "supabase", fake)
    yield fake
    fake.reset()


@pytest.fixture
def seed_db(mock_supabase):
    """Seed the fake DB with demo data (companies, jobs, recruiter)."""
    from api.core.config import hash_password

    pw = hash_password("demo1234")
    base_user = {
        "skills": [], "desired_roles": [], "work_preferences": [],
        "industries": [], "experience": [], "education": [], "specializations": [],
    }
    now = datetime.now(timezone.utc).isoformat()

    # Companies
    companies = [
        ("comp_1", "TechVault", "Tech / SaaS", "500-1000", "San Francisco, CA"),
        ("comp_2", "DataPulse AI", "AI / ML", "50-200", "Remote"),
        ("comp_3", "Forma Studio", "Design", "50-200", "New York, NY"),
    ]
    for cid, name, ind, size, loc in companies:
        mock_supabase.store.setdefault("users", {})[cid] = {
            **base_user, "id": cid, "email": f"{name.lower().replace(' ', '')}@demo.com",
            "hashed_password": pw, "role": "company", "company_name": name,
            "industry": ind, "company_size": size, "location": loc, "created_at": now,
        }

    # Recruiter
    mock_supabase.store.setdefault("users", {})["rec_1"] = {
        **base_user, "id": "rec_1", "email": "recruiter@demo.com",
        "hashed_password": pw, "role": "recruiter", "name": "Jordan Taylor",
        "agency": "TalentBridge", "specializations": ["Engineering", "Product"],
        "created_at": now,
    }

    # Jobs
    jobs = [
        {"id": "job_1", "company_id": "comp_1", "title": "Senior React Developer", "location": "San Francisco, CA", "salary_min": 160000, "salary_max": 200000, "type": "full-time", "remote": True, "description": "Lead frontend architecture.", "required_skills": ["React", "TypeScript", "JavaScript"], "nice_skills": ["Next.js", "Redux", "Node.js"], "experience_level": "Senior (6-9 yrs)", "status": "active", "applicant_count": 0, "created_at": now},
        {"id": "job_2", "company_id": "comp_2", "title": "ML Engineer", "location": "Remote", "salary_min": 180000, "salary_max": 230000, "type": "full-time", "remote": True, "description": "Build ML pipelines.", "required_skills": ["Python", "Machine Learning", "PyTorch"], "nice_skills": ["MLOps", "AWS", "Docker"], "experience_level": "Senior (6-9 yrs)", "status": "active", "applicant_count": 0, "created_at": now},
        {"id": "job_3", "company_id": "comp_3", "title": "Product Designer", "location": "New York, NY", "salary_min": 130000, "salary_max": 165000, "type": "full-time", "remote": False, "description": "Shape design systems.", "required_skills": ["Figma", "UX Research", "UI Design"], "nice_skills": ["Design Systems", "Prototyping", "Accessibility"], "experience_level": "Mid Level (3-5 yrs)", "status": "active", "applicant_count": 0, "created_at": now},
    ]
    for j in jobs:
        mock_supabase.store.setdefault("jobs", {})[j["id"]] = j

    return mock_supabase


@pytest.fixture
def client(mock_supabase):
    """FastAPI TestClient with mocked DB."""
    from fastapi.testclient import TestClient
    from api.index import app
    return TestClient(app)


@pytest.fixture
def seeded_client(seed_db):
    """FastAPI TestClient with seeded demo data."""
    from fastapi.testclient import TestClient
    from api.index import app
    return TestClient(app)


# ─── Helpers ──────────────────────────────────────────────
def register_user(client, email="test@example.com", password="testpassword123",
                  role="seeker", name="Test User", company_name=None):
    """Register a user and return (token, user_dict)."""
    payload = {"email": email, "password": password, "role": role, "name": name}
    if company_name:
        payload["company_name"] = company_name
    resp = client.post("/api/auth/register", json=payload)
    data = resp.json()
    return data.get("access_token"), data.get("user", {})


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def create_seeker_with_profile(client):
    """Register a seeker and fill their profile. Returns (token, profile)."""
    token, _ = register_user(client, email="seeker@test.com", role="seeker", name="Test Seeker")
    profile_payload = {
        "name": "Test Seeker",
        "headline": "Senior React Developer",
        "location": "San Francisco, CA",
        "skills": ["React", "TypeScript", "JavaScript", "Node.js", "AWS"],
        "desired_roles": ["Frontend Developer", "Full Stack Developer"],
        "experience_level": "Senior (6-9 yrs)",
        "work_preferences": ["Remote"],
        "salary_range": "$160k–$200k",
        "industries": ["Tech / SaaS"],
        "experience": [{"title": "Senior Dev", "company": "Acme Corp", "duration": "2020–2024", "description": "Led frontend team."}],
        "education": [{"school": "MIT", "degree": "B.S. CS", "year": "2018"}],
        "summary": "Experienced React developer.",
    }
    client.post("/api/seeker/profile", json=profile_payload, headers=auth_header(token))
    return token, profile_payload
