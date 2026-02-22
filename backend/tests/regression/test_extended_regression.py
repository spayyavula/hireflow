"""
Extended regression suite for HireFlow API.

Multi-step, cross-role flows that exercise complex interactions.
Run after every code change to catch regressions.
"""

import io
import pytest


class TestFullHiringCycle:
    """Company posts → Seeker applies → Company advances → Hired."""

    def test_complete_hiring_pipeline(self, client):
        # ── Company setup ──
        r = client.post("/api/auth/register", json={
            "email": "pipeline_co@test.com", "password": "password123",
            "role": "company", "name": "PipelineCo", "company_name": "PipelineCo",
        })
        co = {"Authorization": f"Bearer {r.json()['access_token']}"}

        r = client.post("/api/jobs", headers=co, json={
            "title": "Rust Developer", "location": "Remote",
            "description": "Systems programming", "type": "full-time",
            "remote": True, "required_skills": ["Rust", "Linux"],
            "salary_min": 170000, "salary_max": 220000,
        })
        job_id = r.json()["id"]

        # ── Seeker setup & apply ──
        r = client.post("/api/auth/register", json={
            "email": "pipeline_sk@test.com", "password": "password123",
            "role": "seeker", "name": "Rust Dev",
        })
        sk = {"Authorization": f"Bearer {r.json()['access_token']}"}

        client.post("/api/seeker/profile", headers=sk, json={
            "name": "Rust Dev", "skills": ["Rust", "Linux", "Docker"],
            "desired_roles": ["Backend Developer"],
            "experience_level": "Senior (6-9 yrs)",
        })

        r = client.post(f"/api/jobs/{job_id}/apply", headers=sk, json={
            "job_id": job_id, "cover_letter": "Rust expert here!",
        })
        assert r.status_code == 201
        app_id = r.json()["id"]

        # ── Company advances through all stages ──
        stages = ["screening", "interview", "offer", "hired"]
        for status in stages:
            r = client.patch(
                f"/api/jobs/applications/{app_id}/status", headers=co,
                json={"status": status},
            )
            assert r.status_code == 200
            assert r.json()["status"] == status

        # ── Verify final state ──
        r = client.get("/api/jobs/me/applications", headers=sk)
        assert r.json()[0]["status"] == "hired"

        r = client.get(f"/api/jobs/{job_id}/applications", headers=co)
        assert r.json()[0]["status"] == "hired"


class TestMultiSeekerCompetition:
    """Multiple seekers apply to the same job; company views all."""

    def test_multiple_applicants(self, client, company_auth, sample_jobs):
        job_id = sample_jobs[0]
        seeker_tokens = []

        for i in range(3):
            r = client.post("/api/auth/register", json={
                "email": f"multi_{i}@test.com", "password": "password123",
                "role": "seeker", "name": f"Seeker {i}",
            })
            tok = {"Authorization": f"Bearer {r.json()['access_token']}"}
            seeker_tokens.append(tok)
            r = client.post(f"/api/jobs/{job_id}/apply", headers=tok, json={
                "job_id": job_id, "cover_letter": f"Cover letter {i}",
            })
            assert r.status_code == 201

        # Company sees all 3 applications
        r = client.get(f"/api/jobs/{job_id}/applications", headers=company_auth)
        assert len(r.json()) == 3


class TestConcurrentChat:
    """Multiple conversations between different user pairs."""

    def test_chat_isolation(self, client):
        users = {}
        for name in ["alice", "bob", "charlie"]:
            r = client.post("/api/auth/register", json={
                "email": f"{name}@chat.com", "password": "password123",
                "role": "seeker", "name": name.title(),
            })
            users[name] = {
                "id": r.json()["user"]["id"],
                "auth": {"Authorization": f"Bearer {r.json()['access_token']}"},
            }

        # Alice → Bob
        client.post("/api/chat/messages", headers=users["alice"]["auth"], json={
            "recipient_id": users["bob"]["id"], "content": "Hi Bob!",
        })
        # Alice → Charlie
        client.post("/api/chat/messages", headers=users["alice"]["auth"], json={
            "recipient_id": users["charlie"]["id"], "content": "Hi Charlie!",
        })
        # Bob → Charlie
        client.post("/api/chat/messages", headers=users["bob"]["auth"], json={
            "recipient_id": users["charlie"]["id"], "content": "Hey Charlie!",
        })

        # Alice should have 2 conversations
        r = client.get("/api/chat/conversations", headers=users["alice"]["auth"])
        assert len(r.json()) == 2

        # Bob should have 2 conversations
        r = client.get("/api/chat/conversations", headers=users["bob"]["auth"])
        assert len(r.json()) == 2

        # Charlie should have 2 conversations
        r = client.get("/api/chat/conversations", headers=users["charlie"]["auth"])
        assert len(r.json()) == 2


class TestResumeMatchApplyRegression:
    """Upload resume → confirm AI parsing → match → apply → verify application."""

    def test_resume_to_application_flow(self, client, sample_jobs):
        r = client.post("/api/auth/register", json={
            "email": "resume_flow@test.com", "password": "password123",
            "role": "seeker", "name": "Resume User",
        })
        sk = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # Upload resume
        r = client.post("/api/seeker/resume/upload", headers=sk,
                        files={"file": ("cv.pdf", io.BytesIO(b"pdf data"), "application/pdf")})
        assert r.status_code == 200
        skills_count = r.json()["skills_extracted"]
        assert skills_count >= 5

        # Profile should be populated
        r = client.get("/api/seeker/profile", headers=sk)
        assert r.status_code == 200
        profile = r.json()
        assert len(profile["skills"]) >= 5
        assert profile["profile_strength"] in ("Good", "Strong")

        # Matches should work
        r = client.get("/api/seeker/jobs/matches", headers=sk)
        assert r.status_code == 200
        matches = r.json()
        assert len(matches) >= 1

        # Apply to top match
        top = matches[0]
        r = client.post(f"/api/jobs/{top['id']}/apply", headers=sk, json={
            "job_id": top["id"],
        })
        assert r.status_code == 201

        # Analytics should show application
        r = client.get("/api/seeker/analytics", headers=sk)
        assert r.json()["total_applications"] == 1


class TestRoleBasedAccessRegression:
    """Verify auth & role rules on routes that enforce them."""

    def _auth(self, client, email, role, company_name=None):
        body = {"email": email, "password": "password123", "role": role, "name": "Test"}
        if company_name:
            body["company_name"] = company_name
        r = client.post("/api/auth/register", json=body)
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    def test_unauthenticated_blocked_everywhere(self, client):
        """All protected endpoints require auth."""
        endpoints = [
            "/api/seeker/profile", "/api/seeker/jobs/matches",
            "/api/recruiter/candidates", "/api/company/dashboard",
            "/api/chat/conversations",
        ]
        for ep in endpoints:
            assert client.get(ep).status_code == 401, f"{ep} should require auth"

    def test_recruiter_cannot_post_jobs(self, client):
        rec = self._auth(client, "rbac_r2@test.com", "recruiter")
        r = client.post("/api/jobs", headers=rec, json={
            "title": "X", "location": "X", "description": "X",
        })
        assert r.status_code == 403

    def test_seeker_cannot_post_jobs(self, client):
        sk = self._auth(client, "rbac_s@test.com", "seeker")
        r = client.post("/api/jobs", headers=sk, json={
            "title": "X", "location": "X", "description": "X",
        })
        assert r.status_code == 403

    def test_company_can_post_and_manage_jobs(self, client):
        co = self._auth(client, "rbac_c@test.com", "company", "RBAC Corp")
        r = client.post("/api/jobs", headers=co, json={
            "title": "RBAC Job", "location": "Remote", "description": "Test",
        })
        assert r.status_code == 201
        jid = r.json()["id"]
        assert client.get(f"/api/jobs/{jid}").status_code == 200


class TestDashboardDataIntegrity:
    """Verify dashboard aggregates are consistent with underlying data."""

    def test_company_dashboard_job_counts(self, client, company_auth, sample_jobs):
        # Dashboard shows correct open positions
        r = client.get("/api/company/dashboard", headers=company_auth)
        assert r.json()["open_positions"] == 3

        # Close a job → open positions decreases
        client.delete(f"/api/jobs/{sample_jobs[1]}", headers=company_auth)
        r = client.get("/api/company/dashboard", headers=company_auth)
        assert r.json()["open_positions"] == 2

    def test_applications_visible_on_job(self, client, company_auth, sample_jobs):
        """Applications created via apply show up in job's application list."""
        r = client.post("/api/auth/register", json={
            "email": "integrity@test.com", "password": "password123",
            "role": "seeker", "name": "Integrity",
        })
        sk = {"Authorization": f"Bearer {r.json()['access_token']}"}
        client.post(f"/api/jobs/{sample_jobs[0]}/apply", headers=sk, json={
            "job_id": sample_jobs[0],
        })
        r = client.get(f"/api/jobs/{sample_jobs[0]}/applications", headers=company_auth)
        assert len(r.json()) == 1
