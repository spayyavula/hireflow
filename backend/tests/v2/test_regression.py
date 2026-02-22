"""
HireFlow Backend — Regression Test Suite v2
=============================================
End-to-end user journeys, cross-module interactions, data integrity,
auth protection, and boundary conditions.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SEEKER FULL JOURNEY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSeekerFullJourney:
    """Complete seeker workflow: register → build profile → match → apply → track."""

    def test_register_upload_match_apply(self, seeded_client):
        # 1. Register
        r = seeded_client.post("/api/auth/register", json={
            "email": "journey@test.com", "password": "testpassword123",
            "role": "seeker", "name": "Journey Tester",
        })
        assert r.status_code == 201
        token = r.json()["access_token"]
        headers = auth_header(token)

        # 2. Upload resume
        r = seeded_client.post("/api/seeker/resume/upload",
                               files={"file": ("resume.pdf", b"content", "application/pdf")},
                               headers=headers)
        assert r.status_code == 200
        assert r.json()["skills_extracted"] > 0

        # 3. Profile should now exist
        r = seeded_client.get("/api/seeker/profile", headers=headers)
        assert r.status_code == 200
        profile = r.json()
        assert len(profile["skills"]) > 0

        # 4. Get matched jobs
        r = seeded_client.get("/api/seeker/jobs/matches", headers=headers)
        assert r.status_code == 200
        matches = r.json()
        assert len(matches) > 0
        # Should be sorted by score descending
        for i in range(1, len(matches)):
            assert matches[i]["match_score"] <= matches[i - 1]["match_score"]

        # 5. Apply to top match
        top_job_id = matches[0]["id"]
        r = seeded_client.post(f"/api/jobs/{top_job_id}/apply", json={
            "job_id": top_job_id, "cover_letter": "Great match!",
        }, headers=headers)
        assert r.status_code == 201

        # 6. Check my applications
        r = seeded_client.get("/api/jobs/me/applications", headers=headers)
        assert r.status_code == 200
        assert len(r.json()) == 1
        assert r.json()[0]["job_id"] == top_job_id

        # 7. Analytics should reflect
        r = seeded_client.get("/api/seeker/analytics", headers=headers)
        assert r.status_code == 200
        assert r.json()["total_applications"] == 1

    def test_builder_flow_with_ai_summary(self, seeded_client):
        """Register → build profile via wizard → generate AI summary → match."""
        r = seeded_client.post("/api/auth/register", json={
            "email": "builder@test.com", "password": "testpassword123",
            "role": "seeker", "name": "Builder User",
        })
        token = r.json()["access_token"]
        headers = auth_header(token)

        # Build profile manually
        r = seeded_client.post("/api/seeker/profile", json={
            "name": "Builder User",
            "skills": ["React", "TypeScript", "JavaScript"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Remote"],
        }, headers=headers)
        assert r.status_code == 201

        # Generate AI summary
        r = seeded_client.post("/api/seeker/ai/summary", json={
            "name": "Builder User",
            "skills": ["React", "TypeScript", "JavaScript"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
        }, headers=headers)
        assert r.status_code == 200
        assert len(r.json()["summary"]) > 20

        # Match jobs
        r = seeded_client.get("/api/seeker/jobs/matches", headers=headers)
        assert r.status_code == 200
        assert len(r.json()) > 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  COMPANY HIRING PIPELINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestCompanyHiringPipeline:
    """Company: post job → receive applications → advance through pipeline → hire."""

    def test_full_hiring_flow(self, client):
        # 1. Company registers and posts job
        co_r = client.post("/api/auth/register", json={
            "email": "hiring@test.com", "password": "testpassword123",
            "role": "company", "company_name": "HireCo",
        })
        co_token = co_r.json()["access_token"]
        co_headers = auth_header(co_token)

        job_r = client.post("/api/jobs", json={
            "title": "Python Developer", "location": "Remote",
            "description": "Build APIs",
            "required_skills": ["Python", "FastAPI"],
            "remote": True,
        }, headers=co_headers)
        assert job_r.status_code == 201
        job_id = job_r.json()["id"]

        # 2. Seeker registers and applies
        sk_r = client.post("/api/auth/register", json={
            "email": "candidate@test.com", "password": "testpassword123",
            "role": "seeker", "name": "Candidate Smith",
        })
        sk_token = sk_r.json()["access_token"]
        sk_headers = auth_header(sk_token)

        app_r = client.post(f"/api/jobs/{job_id}/apply", json={
            "job_id": job_id, "cover_letter": "I'm your person!",
        }, headers=sk_headers)
        assert app_r.status_code == 201
        app_id = app_r.json()["id"]

        # 3. Company advances through pipeline stages
        pipeline_stages = ["screening", "interview", "offer", "hired"]
        for stage in pipeline_stages:
            r = client.patch(f"/api/jobs/applications/{app_id}/status",
                             json={"status": stage}, headers=co_headers)
            assert r.status_code == 200
            assert r.json()["status"] == stage

        # 4. Verify final status
        r = client.get("/api/jobs/me/applications", headers=sk_headers)
        assert r.status_code == 200
        apps = r.json()
        assert len(apps) == 1
        assert apps[0]["status"] == "hired"

    def test_reject_application(self, client):
        """Company can reject an application."""
        co_token, _ = register_user(client, email="rejector@test.com", role="company",
                                    company_name="RejectCo")
        job_r = client.post("/api/jobs", json={
            "title": "Dev", "location": "Remote", "description": "Test",
        }, headers=auth_header(co_token))
        job_id = job_r.json()["id"]

        sk_token, _ = register_user(client, email="rejected@test.com", role="seeker",
                                    name="Rejected")
        app_r = client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id},
                            headers=auth_header(sk_token))
        app_id = app_r.json()["id"]

        r = client.patch(f"/api/jobs/applications/{app_id}/status",
                         json={"status": "rejected"}, headers=auth_header(co_token))
        assert r.status_code == 200
        assert r.json()["status"] == "rejected"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  RECRUITER WORKFLOW
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestRecruiterWorkflow:
    """Recruiter: search candidates → view pipeline → check analytics."""

    def test_recruiter_search_and_pipeline(self, seeded_client):
        # Create seekers with profiles
        create_seeker_with_profile(seeded_client)
        rec_token, _ = register_user(seeded_client, email="rec_flow@test.com",
                                     role="recruiter", name="Recruiter")
        rec_headers = auth_header(rec_token)

        # Search candidates
        r = seeded_client.get("/api/recruiter/candidates", headers=rec_headers)
        assert r.status_code == 200
        candidates = r.json()
        assert len(candidates) >= 1

        # Advanced search by skill
        r = seeded_client.post("/api/recruiter/candidates/search", json={
            "skills": ["React"],
        }, headers=rec_headers)
        assert r.status_code == 200

        # Check pipeline
        r = seeded_client.get("/api/recruiter/pipeline", headers=rec_headers)
        assert r.status_code == 200
        pipeline = r.json()
        assert "pipeline" in pipeline

        # Check analytics
        r = seeded_client.get("/api/recruiter/analytics", headers=rec_headers)
        assert r.status_code == 200


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CROSS-ROLE CHAT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestCrossRoleChat:
    """Multi-user chat flows: seeker ↔ recruiter messaging."""

    def test_bidirectional_conversation(self, client):
        tk1, u1 = register_user(client, email="chat_a@test.com", role="seeker", name="Alice")
        tk2, u2 = register_user(client, email="chat_b@test.com", role="recruiter", name="Bob")

        # Alice sends to Bob
        r1 = client.post("/api/chat/messages", json={
            "recipient_id": u2["id"], "content": "Hi Bob!",
        }, headers=auth_header(tk1))
        assert r1.status_code == 201
        conv_id = r1.json()["conversation_id"]

        # Bob replies to Alice
        r2 = client.post("/api/chat/messages", json={
            "recipient_id": u1["id"], "content": "Hi Alice!",
        }, headers=auth_header(tk2))
        assert r2.status_code == 201
        # Should reuse same conversation
        assert r2.json()["conversation_id"] == conv_id

        # Both should see the conversation
        r = client.get("/api/chat/conversations", headers=auth_header(tk1))
        assert len(r.json()) == 1
        r = client.get("/api/chat/conversations", headers=auth_header(tk2))
        assert len(r.json()) == 1

        # Messages should be visible to both
        r = client.get(f"/api/chat/conversations/{conv_id}/messages",
                       headers=auth_header(tk1))
        assert len(r.json()) == 2

    def test_multiple_conversations(self, client):
        """A user can have multiple conversations with different people."""
        tk1, u1 = register_user(client, email="multi_a@test.com", role="seeker", name="A")
        _, u2 = register_user(client, email="multi_b@test.com", role="recruiter", name="B")
        _, u3 = register_user(client, email="multi_c@test.com", role="company",
                              company_name="C Corp")

        client.post("/api/chat/messages", json={
            "recipient_id": u2["id"], "content": "To B",
        }, headers=auth_header(tk1))
        client.post("/api/chat/messages", json={
            "recipient_id": u3["id"], "content": "To C",
        }, headers=auth_header(tk1))

        r = client.get("/api/chat/conversations", headers=auth_header(tk1))
        assert len(r.json()) == 2


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTH PROTECTION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestAuthProtection:
    """Ensure all protected endpoints reject unauthenticated requests."""

    @pytest.mark.parametrize("method,path", [
        ("GET", "/api/seeker/profile"),
        ("POST", "/api/seeker/profile"),
        ("POST", "/api/seeker/resume/upload"),
        ("POST", "/api/seeker/ai/summary"),
        ("GET", "/api/seeker/jobs/matches"),
        ("GET", "/api/seeker/analytics"),
        ("POST", "/api/jobs"),
        ("GET", "/api/jobs/me/applications"),
        ("GET", "/api/recruiter/candidates"),
        ("POST", "/api/recruiter/candidates/search"),
        ("GET", "/api/recruiter/pipeline"),
        ("GET", "/api/recruiter/analytics"),
        ("GET", "/api/company/dashboard"),
        ("GET", "/api/company/candidates/recommended"),
        ("GET", "/api/company/analytics"),
        ("GET", "/api/chat/conversations"),
        ("POST", "/api/chat/messages"),
    ])
    def test_endpoint_requires_auth(self, client, method, path):
        if method == "GET":
            r = client.get(path)
        elif method == "POST":
            r = client.post(path, json={})
        assert r.status_code in [401, 422], f"{method} {path} returned {r.status_code}"

    @pytest.mark.parametrize("method,path", [
        ("GET", "/api/jobs"),
        ("GET", "/api"),
        ("GET", "/api/health"),
    ])
    def test_public_get_endpoints_no_auth(self, client, method, path):
        """Public GET endpoints should work without auth."""
        r = client.get(path)
        assert r.status_code == 200

    def test_register_is_public(self, client):
        """Registration endpoint should work without auth."""
        r = client.post("/api/auth/register", json={
            "email": "pub@test.com", "password": "testpassword123",
            "role": "seeker",
        })
        assert r.status_code == 201

    def test_login_is_public(self, client):
        """Login endpoint should be accessible without auth (returns 401 for bad creds, not 403)."""
        r = client.post("/api/auth/login", json={
            "email": "nobody@test.com", "password": "testpassword123",
        })
        # 401 = auth failed (valid endpoint), not 403 = forbidden
        assert r.status_code == 401


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  DATA ISOLATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestDataIsolation:
    """Ensure users can only see their own data."""

    def test_seeker_applications_isolated(self, seeded_client):
        """Seeker A's applications should not appear for Seeker B."""
        tk_a, _ = register_user(seeded_client, email="iso_a@test.com", role="seeker")
        tk_b, _ = register_user(seeded_client, email="iso_b@test.com", role="seeker")

        # A applies
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"},
                           headers=auth_header(tk_a))

        # B should see 0 applications
        r = seeded_client.get("/api/jobs/me/applications", headers=auth_header(tk_b))
        assert len(r.json()) == 0

    def test_company_dashboard_shows_only_own_jobs(self, client):
        """Company A's dashboard should not show Company B's jobs."""
        tk_a, _ = register_user(client, email="co_a@test.com", role="company",
                                company_name="Co A")
        tk_b, _ = register_user(client, email="co_b@test.com", role="company",
                                company_name="Co B")

        client.post("/api/jobs", json={
            "title": "A's Job", "location": "Remote", "description": "A's work",
        }, headers=auth_header(tk_a))
        client.post("/api/jobs", json={
            "title": "B's Job", "location": "Remote", "description": "B's work",
        }, headers=auth_header(tk_b))

        r = client.get("/api/company/dashboard", headers=auth_header(tk_a))
        data = r.json()
        assert data["open_positions"] == 1
        assert data["jobs"][0]["title"] == "A's Job"

    def test_job_update_ownership(self, client):
        """Company B cannot update Company A's job."""
        tk_a, _ = register_user(client, email="own_a@test.com", role="company",
                                company_name="Owner A")
        job_r = client.post("/api/jobs", json={
            "title": "A's Job", "location": "X", "description": "Y",
        }, headers=auth_header(tk_a))
        job_id = job_r.json()["id"]

        tk_b, _ = register_user(client, email="own_b@test.com", role="company",
                                company_name="Owner B")
        r = client.put(f"/api/jobs/{job_id}", json={
            "title": "Hacked", "location": "X", "description": "Y",
        }, headers=auth_header(tk_b))
        assert r.status_code == 403


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MATCHING CONSISTENCY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestMatchingConsistency:
    """Ensure matching engine produces consistent, sane results across the API."""

    def test_match_scores_are_bounded(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        r = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        for job in r.json():
            assert 15 <= job["match_score"] <= 99

    def test_match_contains_skill_details(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        r = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        for job in r.json():
            assert "matched_required" in job
            assert "matched_nice" in job
            assert "match_reasons" in job
            assert isinstance(job["matched_required"], list)
            assert isinstance(job["match_reasons"], list)

    def test_public_and_auth_matching_same_results(self, seeded_client):
        """Public POST and authenticated GET matching should give similar results."""
        token, profile = create_seeker_with_profile(seeded_client)

        # Authenticated match
        r1 = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        auth_jobs = r1.json()

        # Public match with same skills
        r2 = seeded_client.post("/api/seeker/jobs/matches", json={
            "skills": profile["skills"],
            "desired_roles": profile["desired_roles"],
            "work_preferences": profile["work_preferences"],
            "salary_range": profile["salary_range"],
            "experience_level": profile["experience_level"],
        })
        public_jobs = r2.json()

        # Same number of jobs
        assert len(auth_jobs) == len(public_jobs)
        # Same job IDs (order may differ due to same-score jitter)
        auth_ids = {j["id"] for j in auth_jobs}
        public_ids = {j["id"] for j in public_jobs}
        assert auth_ids == public_ids


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CLOSED JOB BEHAVIOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestClosedJobBehavior:
    """Ensure closed jobs behave correctly."""

    def test_closed_job_not_in_listings(self, client):
        token, _ = register_user(client, email="close_co@test.com", role="company",
                                 company_name="CloseCo")
        headers = auth_header(token)

        job_r = client.post("/api/jobs", json={
            "title": "Temp Job", "location": "Remote", "description": "Temp",
        }, headers=headers)
        job_id = job_r.json()["id"]

        # Job should appear in listings
        r = client.get("/api/jobs")
        assert any(j["id"] == job_id for j in r.json())

        # Close it
        client.delete(f"/api/jobs/{job_id}", headers=headers)

        # Should no longer appear in active listings
        r = client.get("/api/jobs")
        assert not any(j["id"] == job_id for j in r.json())

    def test_apply_to_closed_job_rejected(self, client):
        co_token, _ = register_user(client, email="close_co2@test.com", role="company",
                                    company_name="CloseCo2")
        job_r = client.post("/api/jobs", json={
            "title": "Closing", "location": "X", "description": "Y",
        }, headers=auth_header(co_token))
        job_id = job_r.json()["id"]
        client.delete(f"/api/jobs/{job_id}", headers=auth_header(co_token))

        sk_token, _ = register_user(client, email="late_app@test.com", role="seeker")
        r = client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id},
                        headers=auth_header(sk_token))
        assert r.status_code == 400
        assert "no longer" in r.json()["detail"].lower()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SALARY DISPLAY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSalaryDisplay:
    """Ensure salary_display is formatted correctly."""

    def test_salary_display_format(self, client):
        token, _ = register_user(client, email="salary@test.com", role="company",
                                 company_name="PayCo")
        r = client.post("/api/jobs", json={
            "title": "Well Paid", "location": "Remote", "description": "Good pay",
            "salary_min": 150000, "salary_max": 200000,
        }, headers=auth_header(token))
        assert r.status_code == 201
        data = r.json()
        assert data["salary_display"] == "$150k–$200k"

    def test_salary_display_none_when_no_salary(self, client):
        token, _ = register_user(client, email="nosalary@test.com", role="company",
                                 company_name="CheapCo")
        r = client.post("/api/jobs", json={
            "title": "Unpaid Intern", "location": "Remote", "description": "Free",
        }, headers=auth_header(token))
        assert r.json()["salary_display"] is None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  EDGE CASES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestEdgeCases:
    def test_empty_cover_letter(self, seeded_client):
        token, _ = register_user(seeded_client, email="nocl@test.com", role="seeker")
        r = seeded_client.post("/api/jobs/job_1/apply", json={
            "job_id": "job_1",
        }, headers=auth_header(token))
        assert r.status_code == 201
        assert r.json()["cover_letter"] is None

    def test_register_with_optional_name_none(self, client):
        r = client.post("/api/auth/register", json={
            "email": "noname@test.com", "password": "testpassword123",
            "role": "seeker",
        })
        assert r.status_code == 201

    def test_profile_with_empty_arrays(self, client):
        token, _ = register_user(client, email="empty_profile@test.com", role="seeker")
        r = client.post("/api/seeker/profile", json={
            "name": "Minimal",
            "skills": [],
            "desired_roles": [],
            "experience": [],
            "education": [],
        }, headers=auth_header(token))
        assert r.status_code == 201

    def test_multiple_seekers_apply_same_job(self, seeded_client):
        """Multiple seekers can apply to the same job."""
        tokens = []
        for i in range(3):
            t, _ = register_user(seeded_client, email=f"multi_{i}@test.com", role="seeker")
            tokens.append(t)

        for t in tokens:
            r = seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"},
                                   headers=auth_header(t))
            assert r.status_code == 201

        # Check application count via job endpoint
        r = seeded_client.get("/api/jobs/job_1")
        # All 3 should have applied
        comp_token, _ = register_user(seeded_client, email="check_apps@test.com",
                                      role="company", company_name="Checker")
        r = seeded_client.get("/api/jobs/job_1/applications",
                              headers=auth_header(comp_token))
        assert len(r.json()) == 3

    def test_login_then_access_protected_route(self, client):
        """Full auth flow: register → login → access protected route."""
        register_user(client, email="flow@test.com", password="mypassword123", role="seeker")
        login_r = client.post("/api/auth/login", json={
            "email": "flow@test.com", "password": "mypassword123",
        })
        token = login_r.json()["access_token"]
        r = client.get("/api/seeker/analytics", headers=auth_header(token))
        assert r.status_code == 200
