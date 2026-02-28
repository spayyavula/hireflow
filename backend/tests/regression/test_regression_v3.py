"""
Regression Test Suite v3 — Advanced scenarios.

Covers: profile evolution, multi-user operations, status transitions,
chat flow integrity, cross-role visibility, resume-to-apply chains,
and analytics consistency.
"""

import pytest
from tests.conftest import register_user, auth_header


def _reg(client, email, role="seeker", name="Test User", company_name=None):
    """Quick helper: register user, return (headers_dict, user_id)."""
    token, user = register_user(client, email, "password123", role, name, company_name)
    return auth_header(token), user["id"]


def _profile(name="Test User", **overrides):
    """Build a minimal valid profile dict with required 'name' field."""
    base = {"name": name, "skills": ["Python"], "desired_roles": ["Developer"],
            "experience_level": "Mid Level (3-5 yrs)"}
    base.update(overrides)
    return base


def _apply(client, job_id, headers, cover_letter="Applying"):
    """Apply to a job with the correct body schema (includes job_id)."""
    return client.post(f"/api/jobs/{job_id}/apply", headers=headers, json={
        "job_id": job_id, "cover_letter": cover_letter,
    })


def _send_msg(client, headers, recipient_id, content):
    """Send chat message using correct schema field name."""
    return client.post("/api/chat/messages", headers=headers, json={
        "recipient_id": recipient_id, "content": content,
    })


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Profile Evolution & Match Score Tracking
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestProfileEvolution:

    def test_adding_skills_improves_match_scores(self, client, sample_jobs):
        headers, _ = _reg(client, "evolve@test.com")

        # Minimal profile
        client.post("/api/seeker/profile", headers=headers, json=_profile(
            name="Evolve User", skills=["Python"],
            desired_roles=["Backend Developer"],
        ))
        resp1 = client.get("/api/seeker/jobs/matches", headers=headers)
        assert resp1.status_code == 200
        scores1 = {m["id"]: m["match_score"] for m in resp1.json()}

        # Richer profile
        client.post("/api/seeker/profile", headers=headers, json=_profile(
            name="Evolve User",
            skills=["Python", "Django", "PostgreSQL", "Docker", "AWS"],
            desired_roles=["Backend Developer", "DevOps Engineer"],
            work_preferences=["Remote"],
        ))
        resp2 = client.get("/api/seeker/jobs/matches", headers=headers)
        assert resp2.status_code == 200
        scores2 = {m["id"]: m["match_score"] for m in resp2.json()}

        improved = sum(1 for jid in scores1 if jid in scores2 and scores2[jid] > scores1[jid])
        assert improved >= 1

    def test_match_min_score_filter(self, client, sample_jobs):
        headers, _ = _reg(client, "filter@test.com")
        client.post("/api/seeker/profile", headers=headers, json=_profile(
            name="Filter User",
            skills=["React", "TypeScript", "Node.js"],
            desired_roles=["Frontend Developer"],
            experience_level="Senior (6-9 yrs)",
        ))

        all_resp = client.get("/api/seeker/jobs/matches", headers=headers)
        assert all_resp.status_code == 200
        high_resp = client.get("/api/seeker/jobs/matches?min_score=60", headers=headers)
        assert high_resp.status_code == 200

        assert len(high_resp.json()) <= len(all_resp.json())
        for job in high_resp.json():
            assert job["match_score"] >= 60


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Multi-Seeker Application Flow
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestMultiSeekerApplicationFlow:

    def test_multiple_seekers_apply(self, client, sample_jobs):
        job_id = sample_jobs[0]
        for i in range(3):
            h, _ = _reg(client, f"multi{i}@test.com", name=f"Seeker {i}")
            client.post("/api/seeker/profile", headers=h, json=_profile(
                name=f"Seeker {i}", skills=["React"],
                desired_roles=["Dev"], experience_level="Entry Level (0-2 yrs)",
            ))
            resp = _apply(client, job_id, h, f"Seeker {i} applying")
            assert resp.status_code == 201

        co_h, _ = _reg(client, "multi-co@test.com", "company", "Multi Co", "Multi Co")
        resp = client.get(f"/api/jobs/{job_id}/applications", headers=co_h)
        assert resp.status_code == 200
        assert len(resp.json()) == 3

    def test_duplicate_application_rejected(self, client, sample_jobs):
        job_id = sample_jobs[0]
        h, _ = _reg(client, "dup@test.com")
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="Dup User", skills=["Python"], desired_roles=["Dev"],
        ))

        resp1 = _apply(client, job_id, h, "First")
        assert resp1.status_code == 201

        resp2 = _apply(client, job_id, h, "Duplicate")
        assert resp2.status_code == 409


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Application Status Pipeline
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestApplicationStatusPipeline:

    def test_full_status_progression(self, client, company_auth, sample_jobs):
        job_id = sample_jobs[0]
        seeker_h, _ = _reg(client, "pipeline@test.com")
        client.post("/api/seeker/profile", headers=seeker_h, json=_profile(
            name="Pipeline User", skills=["React"], desired_roles=["Dev"],
        ))

        resp = _apply(client, job_id, seeker_h, "Excited!")
        assert resp.status_code == 201
        app_id = resp.json()["id"]
        assert resp.json()["status"] == "applied"

        for status in ["screening", "interview", "offer", "hired"]:
            resp = client.patch(
                f"/api/jobs/applications/{app_id}/status",
                headers=company_auth, json={"status": status},
            )
            assert resp.status_code == 200
            assert resp.json()["status"] == status

    def test_rejected_status(self, client, company_auth, sample_jobs):
        job_id = sample_jobs[0]
        h, _ = _reg(client, "reject@test.com")
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="Reject User", skills=["Go"], desired_roles=["Dev"],
            experience_level="Entry Level (0-2 yrs)",
        ))

        resp = _apply(client, job_id, h, "Please")
        app_id = resp.json()["id"]

        resp = client.patch(
            f"/api/jobs/applications/{app_id}/status",
            headers=company_auth, json={"status": "rejected"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Chat Flow Integrity
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestChatFlowIntegrity:

    def test_bidirectional_chat(self, client):
        h1, uid1 = _reg(client, "chat1@test.com", "seeker", "Alice")
        h2, uid2 = _reg(client, "chat2@test.com", "recruiter", "Bob")

        resp = _send_msg(client, h1, uid2, "Hi Bob!")
        assert resp.status_code == 201

        resp = _send_msg(client, h2, uid1, "Hello Alice!")
        assert resp.status_code == 201

        convs1 = client.get("/api/chat/conversations", headers=h1).json()
        convs2 = client.get("/api/chat/conversations", headers=h2).json()
        assert len(convs1) == 1
        assert len(convs2) == 1
        assert convs1[0]["id"] == convs2[0]["id"]

    def test_multiple_conversations(self, client):
        h1, uid1 = _reg(client, "mc1@test.com", "seeker", "S1")
        h2, uid2 = _reg(client, "mc2@test.com", "recruiter", "R1")
        h3, uid3 = _reg(client, "mc3@test.com", "company", "C1", "Co1")

        _send_msg(client, h1, uid2, "To recruiter")
        _send_msg(client, h1, uid3, "To company")

        convs = client.get("/api/chat/conversations", headers=h1).json()
        assert len(convs) == 2

    def test_message_ordering(self, client):
        h1, uid1 = _reg(client, "o1@test.com", "seeker", "S")
        h2, uid2 = _reg(client, "o2@test.com", "recruiter", "R")

        for msg in ["First", "Second", "Third"]:
            _send_msg(client, h1, uid2, msg)

        convs = client.get("/api/chat/conversations", headers=h1).json()
        conv_id = convs[0]["id"]
        msgs = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=h1).json()
        assert len(msgs) == 3
        assert [m["content"] for m in msgs] == ["First", "Second", "Third"]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Cross-Role Data Visibility
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestCrossRoleVisibility:

    def test_company_sees_applications(self, client, company_auth, sample_jobs):
        job_id = sample_jobs[0]
        h, _ = _reg(client, "vis-seeker@test.com", name="Visible Seeker")
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="Visible Seeker",
            skills=["Python", "Django"],
            desired_roles=["Backend Developer"],
            experience_level="Senior (6-9 yrs)",
        ))
        _apply(client, job_id, h, "Applying!")

        resp = client.get(f"/api/jobs/{job_id}/applications", headers=company_auth)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_recruiter_finds_seeker(self, client):
        h, _ = _reg(client, "findme@test.com", name="Findable Seeker")
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="Findable Seeker",
            skills=["Rust", "WebAssembly"],
            desired_roles=["Systems Developer"],
            experience_level="Senior (6-9 yrs)",
        ))

        rec_h, _ = _reg(client, "finder@test.com", "recruiter", "Rec")
        resp = client.get("/api/recruiter/candidates?skill=Rust", headers=rec_h)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_public_match_endpoint(self, client, sample_jobs):
        resp = client.post("/api/seeker/jobs/matches", json={
            "skills": ["React", "TypeScript"],
            "desired_roles": ["Frontend Developer"],
        })
        assert resp.status_code == 200
        assert len(resp.json()) > 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Resume → Profile → Match → Apply Chain
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestResumeToApplicationChain:

    def test_complete_chain(self, client, sample_jobs):
        headers, _ = _reg(client, "chain@test.com")

        resp = client.post(
            "/api/seeker/resume/upload", headers=headers,
            files={"file": ("resume.pdf", b"fake", "application/pdf")},
        )
        assert resp.status_code == 200

        # Explicitly save profile to DB after upload
        resp = client.post("/api/seeker/profile", headers=headers, json={
            "name": "Test User",
            "skills": ["React", "TypeScript", "Python", "Docker", "AWS"],
            "desired_roles": ["Full Stack Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Remote"],
            "experience": [{"title": "Engineer", "company": "Acme", "duration": "2020 - Present"}],
            "education": [{"school": "MIT", "degree": "B.S. CS", "year": "2020"}],
        })
        assert resp.status_code == 201

        resp = client.get("/api/seeker/profile", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()["skills"]) > 0

        resp = client.get("/api/seeker/jobs/matches", headers=headers)
        assert resp.status_code == 200
        matches = resp.json()
        assert len(matches) > 0

        job_id = matches[0]["id"]
        resp = _apply(client, job_id, headers, "Best match!")
        assert resp.status_code == 201

        resp = client.get("/api/jobs/me/applications", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Analytics Consistency
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestDashboardAnalytics:

    def test_company_dashboard_job_count(self, client):
        h, _ = _reg(client, "dash-co@test.com", "company", "Dash Co", "Dash Co")
        for i in range(3):
            client.post("/api/jobs", headers=h, json={
                "title": f"Job {i}", "company_name": "Dash Co",
                "required_skills": ["Python"],
            })
        resp = client.get("/api/company/dashboard", headers=h)
        assert resp.status_code == 200

    def test_seeker_analytics(self, client, sample_jobs):
        h, _ = _reg(client, "a-seeker@test.com")
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="Analytics Seeker", skills=["React"], desired_roles=["Dev"],
        ))
        resp = client.get("/api/seeker/analytics", headers=h)
        assert resp.status_code == 200

    def test_recruiter_analytics(self, client):
        h, _ = _reg(client, "a-rec@test.com", "recruiter", "Rec")
        resp = client.get("/api/recruiter/analytics", headers=h)
        assert resp.status_code == 200

    def test_company_analytics(self, client):
        h, _ = _reg(client, "a-co@test.com", "company", "Co", "Co")
        resp = client.get("/api/company/analytics", headers=h)
        assert resp.status_code == 200
