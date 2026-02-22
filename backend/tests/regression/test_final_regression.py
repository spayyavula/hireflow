"""
HireFlow Backend — Regression Test Suite
==========================================
End-to-end user journeys, cross-role interactions,
auth protection, data isolation, and edge cases.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Full Seeker Journey
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestSeekerJourney:
    """Seeker registers → uploads resume → gets matches → applies → checks applications."""

    def test_register_upload_match_apply(self, seeded_client):
        # 1. Register
        token, user = register_user(
            seeded_client, email="journey@test.com", role="seeker", name="Journey User"
        )
        assert user["role"] == "seeker"

        # 2. Upload resume
        resp = seeded_client.post(
            "/api/seeker/resume/upload",
            files={"file": ("resume.pdf", b"%PDF-fake", "application/pdf")},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        upload_data = resp.json()
        assert "profile" in upload_data
        assert upload_data["skills_extracted"] > 0

        # 3. Get matches
        resp = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        assert resp.status_code == 200
        matches = resp.json()
        assert len(matches) > 0

        # 4. Apply to first match
        job_id = matches[0]["id"]
        resp = seeded_client.post(f"/api/jobs/{job_id}/apply", json={
            "job_id": job_id,
            "cover_letter": "Very interested!",
        }, headers=auth_header(token))
        assert resp.status_code == 201

        # 5. Check my applications
        resp = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token))
        assert resp.status_code == 200
        apps = resp.json()
        assert len(apps) == 1
        assert apps[0]["job_id"] == job_id
        assert apps[0]["status"] == "applied"

    def test_builder_flow_with_ai_summary(self, client):
        # 1. Register
        token, _ = register_user(client, email="builder@test.com", role="seeker", name="Builder")

        # 2. Create profile manually (builder flow)
        resp = client.post("/api/seeker/profile", json={
            "name": "Builder User",
            "skills": ["React", "TypeScript", "Node.js", "AWS", "Python"],
            "desired_roles": ["Full Stack Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Remote"],
            "experience": [{"title": "Dev", "company": "Acme", "duration": "3y"}],
            "education": [{"school": "MIT", "degree": "CS"}],
        }, headers=auth_header(token))
        assert resp.status_code == 201

        # 3. Generate AI summary
        resp = client.post("/api/seeker/ai/summary", json={
            "name": "Builder User",
            "skills": ["React", "TypeScript", "Node.js", "AWS", "Python"],
            "desired_roles": ["Full Stack Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "experience": [{"title": "Dev", "company": "Acme", "duration": "3y"}],
        }, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["summary"]) > 20
        assert "suggested_headline" in data

        # 4. Check profile
        resp = client.get("/api/seeker/profile", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Builder User"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Company Hiring Pipeline
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestCompanyHiringPipeline:
    """Company posts job → seeker applies → company advances through pipeline."""

    def test_full_hiring_flow(self, client):
        # 1. Company creates job
        co_token, _ = register_user(client, email="hire_co@test.com", role="company", company_name="HireCorp")
        resp = client.post("/api/jobs", json={
            "title": "Python Developer", "location": "Remote",
            "description": "Build Python services",
            "required_skills": ["Python", "Django"], "nice_skills": ["Docker"],
            "remote": True,
        }, headers=auth_header(co_token))
        assert resp.status_code == 201
        job_id = resp.json()["id"]

        # 2. Seeker applies
        sk_token, _ = register_user(client, email="hire_sk@test.com", role="seeker", name="Applicant")
        resp = client.post(f"/api/jobs/{job_id}/apply", json={
            "job_id": job_id,
            "cover_letter": "Hire me!",
        }, headers=auth_header(sk_token))
        assert resp.status_code == 201
        app_id = resp.json()["id"]

        # 3. Company advances through pipeline
        for status in ["screening", "interview", "offer", "hired"]:
            resp = client.patch(f"/api/jobs/applications/{app_id}/status", json={
                "status": status,
            }, headers=auth_header(co_token))
            assert resp.status_code == 200
            assert resp.json()["status"] == status

    def test_reject_applicant(self, client):
        co_token, _ = register_user(client, email="rej_co@test.com", role="company", company_name="RejCorp")
        resp = client.post("/api/jobs", json={
            "title": "Dev", "location": "Remote", "description": "Dev",
            "required_skills": ["Java"], "remote": True,
        }, headers=auth_header(co_token))
        job_id = resp.json()["id"]

        sk_token, _ = register_user(client, email="rej_sk@test.com", role="seeker", name="Rejected")
        resp = client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id},
                          headers=auth_header(sk_token))
        app_id = resp.json()["id"]

        resp = client.patch(f"/api/jobs/applications/{app_id}/status", json={
            "status": "rejected",
        }, headers=auth_header(co_token))
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Recruiter Workflow
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestRecruiterWorkflow:
    def test_search_and_filter_candidates(self, client):
        create_seeker_with_profile(client)
        token2, _ = register_user(client, email="seeker2@test.com", role="seeker", name="Seeker2")
        client.post("/api/seeker/profile", json={
            "name": "Seeker2", "skills": ["Python", "Django", "SQL"],
            "desired_roles": ["Backend Developer"],
            "experience_level": "Mid Level (3-5 yrs)",
        }, headers=auth_header(token2))

        rec_token, _ = register_user(client, email="rec_wf@test.com", role="recruiter", name="RecWF")
        resp = client.get("/api/recruiter/candidates", headers=auth_header(rec_token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    def test_recruiter_analytics(self, client):
        rec_token, _ = register_user(client, email="rec_an@test.com", role="recruiter", name="RecAn")
        resp = client.get("/api/recruiter/analytics", headers=auth_header(rec_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "placements_ytd" in data


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Cross-Role Chat
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestCrossRoleChat:
    def test_bidirectional_messaging(self, client):
        token1, user1 = register_user(client, email="bi1@test.com", role="seeker", name="Bi1")
        token2, user2 = register_user(client, email="bi2@test.com", role="recruiter", name="Bi2")

        # Seeker → Recruiter
        resp = client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "Hi recruiter!",
        }, headers=auth_header(token1))
        assert resp.status_code == 201

        # Recruiter → Seeker
        resp = client.post("/api/chat/messages", json={
            "recipient_id": user1["id"], "content": "Hi seeker!",
        }, headers=auth_header(token2))
        assert resp.status_code == 201

        # Both see conversation
        c1 = client.get("/api/chat/conversations", headers=auth_header(token1)).json()
        c2 = client.get("/api/chat/conversations", headers=auth_header(token2)).json()
        assert len(c1) >= 1
        assert len(c2) >= 1

    def test_conversation_reuse(self, client):
        token1, user1 = register_user(client, email="reuse1@test.com", role="seeker", name="Reuse1")
        token2, user2 = register_user(client, email="reuse2@test.com", role="recruiter", name="Reuse2")

        # Send first message
        r1 = client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "Msg 1",
        }, headers=auth_header(token1)).json()

        # Send second message
        r2 = client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "Msg 2",
        }, headers=auth_header(token1)).json()

        # Should reuse same conversation
        assert r1["conversation_id"] == r2["conversation_id"]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Auth Protection
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestAuthProtection:
    @pytest.mark.parametrize("method,url", [
        ("GET", "/api/seeker/profile"),
        ("POST", "/api/seeker/profile"),
        ("GET", "/api/seeker/jobs/matches"),
        ("GET", "/api/seeker/analytics"),
        ("POST", "/api/seeker/ai/summary"),
        ("GET", "/api/recruiter/candidates"),
        ("GET", "/api/recruiter/analytics"),
        ("GET", "/api/company/dashboard"),
        ("GET", "/api/company/analytics"),
        ("POST", "/api/chat/messages"),
        ("GET", "/api/chat/conversations"),
        ("POST", "/api/jobs"),
    ])
    def test_protected_endpoint_requires_auth(self, client, method, url):
        if method == "GET":
            resp = client.get(url)
        else:
            resp = client.post(url, json={})
        assert resp.status_code in [401, 403, 422]

    def test_invalid_token_rejected(self, client):
        resp = client.get("/api/seeker/profile", headers={"Authorization": "Bearer invalid_token"})
        assert resp.status_code in [401, 403]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Data Isolation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestDataIsolation:
    def test_seeker_applications_isolated(self, seeded_client):
        token1, _ = register_user(seeded_client, email="iso1@test.com", role="seeker", name="Iso1")
        token2, _ = register_user(seeded_client, email="iso2@test.com", role="seeker", name="Iso2")

        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token1))
        seeded_client.post("/api/jobs/job_2/apply", json={"job_id": "job_2"}, headers=auth_header(token2))

        apps1 = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token1)).json()
        apps2 = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token2)).json()
        assert len(apps1) == 1
        assert len(apps2) == 1
        assert apps1[0]["job_id"] == "job_1"
        assert apps2[0]["job_id"] == "job_2"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Edge Cases
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestEdgeCases:
    def test_get_nonexistent_job(self, client):
        resp = client.get("/api/jobs/nonexistent_id_12345")
        assert resp.status_code == 404

    def test_apply_to_nonexistent_job(self, seeded_client):
        token, _ = register_user(seeded_client, email="edge@test.com", role="seeker")
        resp = seeded_client.post("/api/jobs/fake_job_id/apply", json={"job_id": "fake_job_id"},
                                 headers=auth_header(token))
        assert resp.status_code in [400, 404]

    def test_empty_profile_creation(self, client):
        token, _ = register_user(client, email="empty@test.com", role="seeker", name="Empty")
        resp = client.post("/api/seeker/profile", json={"name": "Empty"},
                          headers=auth_header(token))
        assert resp.status_code == 201

    def test_profile_update_preserves_data(self, client):
        token, _ = create_seeker_with_profile(client)
        resp = client.post("/api/seeker/profile", json={
            "name": "Updated Name",
            "skills": ["React", "TypeScript", "Python", "Go"],
            "desired_roles": ["Backend Developer"],
        }, headers=auth_header(token))
        assert resp.status_code == 201

        profile = client.get("/api/seeker/profile", headers=auth_header(token)).json()
        assert profile["name"] == "Updated Name"
        assert "Go" in profile["skills"]

    def test_multiple_applications_to_different_jobs(self, seeded_client):
        token, _ = register_user(seeded_client, email="multi@test.com", role="seeker")
        for job_id in ["job_1", "job_2", "job_3"]:
            resp = seeded_client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id},
                                     headers=auth_header(token))
            assert resp.status_code == 201

        apps = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token)).json()
        assert len(apps) == 3


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: AI Service Contracts
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestAIServiceContracts:
    def test_match_result_structure(self):
        from api.services.ai import compute_job_match
        job = {"id": "test", "title": "Dev", "required_skills": ["React"], "nice_skills": ["TS"], "remote": True}
        result = compute_job_match(["React"], ["Dev"], ["Remote"], None, None, job)
        assert isinstance(result["match_score"], int)
        assert isinstance(result["matched_required"], list)
        assert isinstance(result["matched_nice"], list)
        assert isinstance(result["match_reasons"], list)

    def test_parse_resume_structure(self):
        from api.services.ai import parse_resume
        result = parse_resume("test.pdf", b"content")
        assert isinstance(result["profile"], dict)
        assert isinstance(result["ai_summary"], str)
        assert isinstance(result["profile"]["skills"], list)

    def test_suggest_skills_return_type(self):
        from api.services.ai import suggest_skills
        result = suggest_skills(["React"])
        assert isinstance(result, list)

    def test_generate_summary_return_type(self):
        from api.services.ai import generate_summary
        assert isinstance(generate_summary("Alice", ["React"], ["Dev"]), str)

    def test_generate_headline_return_type(self):
        from api.services.ai import generate_headline
        assert isinstance(generate_headline("Alice", ["React"], ["Dev"]), str)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Schema Enums
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestSchemaEnums:
    def test_user_role_values(self):
        from api.models.schemas import UserRole
        assert set(r.value for r in UserRole) == {"seeker", "recruiter", "company"}

    def test_application_status_values(self):
        from api.models.schemas import ApplicationStatus
        expected = {"applied", "screening", "interview", "offer", "hired", "rejected"}
        assert set(s.value for s in ApplicationStatus) == expected

    def test_job_type_values(self):
        from api.models.schemas import JobType
        assert set(t.value for t in JobType) == {"full-time", "part-time", "contract", "internship"}
