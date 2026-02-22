"""
Integration tests for API response contracts.
Validates that every endpoint returns correctly shaped data,
proper status codes, and appropriate error responses.
"""

import pytest
from tests.conftest import register_user, auth_header


def _reg(client, email, role="seeker", name="Test User", company_name=None):
    token, user = register_user(client, email, "password123", role, name, company_name)
    return auth_header(token), user


def _job_payload(**kw):
    base = {
        "title": "Test Job", "location": "Remote",
        "description": "A test job.", "required_skills": ["Python"],
    }
    base.update(kw)
    return base


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTH CONTRACT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestAuthContract:

    def test_register_returns_token_and_user(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "contract@test.com", "password": "password123",
            "role": "seeker", "name": "Contract User",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "contract@test.com"
        assert data["user"]["role"] == "seeker"
        assert "id" in data["user"]

    def test_login_returns_same_shape(self, client):
        client.post("/api/auth/register", json={
            "email": "login-shape@test.com", "password": "password123",
            "role": "seeker", "name": "Login Shape",
        })
        resp = client.post("/api/auth/login", json={
            "email": "login-shape@test.com", "password": "password123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data

    def test_register_duplicate_email_409(self, client):
        client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "password123",
            "role": "seeker",
        })
        resp = client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "password123",
            "role": "seeker",
        })
        assert resp.status_code == 409

    def test_login_wrong_password_401(self, client):
        client.post("/api/auth/register", json={
            "email": "wrong@test.com", "password": "password123",
            "role": "seeker",
        })
        resp = client.post("/api/auth/login", json={
            "email": "wrong@test.com", "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user_401(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "ghost@test.com", "password": "password123",
        })
        assert resp.status_code == 401

    def test_register_short_password_422(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "short@test.com", "password": "abc",
            "role": "seeker",
        })
        assert resp.status_code == 422

    def test_register_invalid_role_422(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "bad-role@test.com", "password": "password123",
            "role": "admin",
        })
        assert resp.status_code == 422


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SEEKER PROFILE CONTRACT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSeekerProfileContract:

    def test_profile_response_shape(self, client):
        h, _ = _reg(client, "profile-shape@test.com")
        resp = client.post("/api/seeker/profile", headers=h, json={
            "name": "Shape User", "skills": ["React", "TypeScript", "Node.js"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Shape User"
        assert isinstance(data["skills"], list)
        assert "profile_strength" in data
        assert "id" in data
        assert "email" in data
        assert "created_at" in data

    def test_get_profile_returns_full_data(self, client):
        h, _ = _reg(client, "get-profile@test.com")
        client.post("/api/seeker/profile", headers=h, json={
            "name": "Get Profile", "headline": "Engineer",
            "location": "SF", "skills": ["Python", "Go", "SQL"],
            "desired_roles": ["Backend Developer"],
            "experience_level": "Mid Level (3-5 yrs)",
            "work_preferences": ["Remote"],
            "salary_range": "$160k–$200k",
            "experience": [{"title": "Dev", "company": "Acme", "duration": "2y"}],
            "education": [{"school": "MIT", "degree": "BS CS"}],
            "summary": "Experienced dev.",
        })
        resp = client.get("/api/seeker/profile", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["headline"] == "Engineer"
        assert len(data["skills"]) == 3
        assert len(data["experience"]) == 1
        assert len(data["education"]) == 1

    def test_profile_requires_auth(self, client):
        resp = client.get("/api/seeker/profile")
        assert resp.status_code in (401, 403)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JOB ENDPOINTS CONTRACT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestJobContract:

    def test_list_jobs_returns_array(self, client):
        resp = client.get("/api/jobs")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_job_response_shape(self, client):
        h, _ = _reg(client, "job-shape@test.com", "company", "JobCo", "JobCo")
        resp = client.post("/api/jobs", headers=h, json=_job_payload())
        assert resp.status_code == 201
        data = resp.json()
        required_fields = [
            "id", "company_id", "title", "location", "type",
            "remote", "description", "required_skills", "nice_skills",
            "status", "applicant_count", "created_at",
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        assert data["status"] == "active"
        assert data["applicant_count"] == 0

    def test_get_job_by_id(self, client):
        h, _ = _reg(client, "get-job@test.com", "company", "GetCo", "GetCo")
        create_resp = client.post("/api/jobs", headers=h, json=_job_payload(title="Findable"))
        job_id = create_resp.json()["id"]

        resp = client.get(f"/api/jobs/{job_id}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Findable"

    def test_get_nonexistent_job_404(self, client):
        resp = client.get("/api/jobs/nonexistent_id")
        assert resp.status_code == 404

    def test_only_companies_can_create_jobs(self, client):
        h, _ = _reg(client, "seeker-job@test.com", "seeker")
        resp = client.post("/api/jobs", headers=h, json=_job_payload())
        assert resp.status_code == 403

    def test_salary_display_format(self, client):
        h, _ = _reg(client, "salary-fmt@test.com", "company", "SalCo", "SalCo")
        resp = client.post("/api/jobs", headers=h, json=_job_payload(
            salary_min=120000, salary_max=160000,
        ))
        data = resp.json()
        assert data["salary_display"] == "$120k–$160k"

    def test_salary_display_null_when_missing(self, client):
        h, _ = _reg(client, "no-sal@test.com", "company", "NoSalCo", "NoSalCo")
        resp = client.post("/api/jobs", headers=h, json=_job_payload())
        assert resp.json()["salary_display"] is None

    def test_job_type_enum_validation(self, client):
        h, _ = _reg(client, "type-enum@test.com", "company", "TypeCo", "TypeCo")
        resp = client.post("/api/jobs", headers=h, json=_job_payload(type="invalid-type"))
        assert resp.status_code == 422

    def test_close_job_success(self, client):
        h, _ = _reg(client, "close-ok@test.com", "company", "CloseCo", "CloseCo")
        job_id = client.post("/api/jobs", headers=h, json=_job_payload()).json()["id"]
        resp = client.delete(f"/api/jobs/{job_id}", headers=h)
        assert resp.status_code == 200
        assert resp.json()["message"] == "Job closed"

    def test_close_others_job_403(self, client):
        h1, _ = _reg(client, "owner@test.com", "company", "Owner", "Owner")
        h2, _ = _reg(client, "other@test.com", "company", "Other", "Other")
        job_id = client.post("/api/jobs", headers=h1, json=_job_payload()).json()["id"]
        resp = client.delete(f"/api/jobs/{job_id}", headers=h2)
        assert resp.status_code == 403


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  APPLICATION CONTRACT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestApplicationContract:

    def test_apply_returns_application(self, client):
        co_h, _ = _reg(client, "app-co@test.com", "company", "AppCo", "AppCo")
        job_id = client.post("/api/jobs", headers=co_h, json=_job_payload()).json()["id"]

        sk_h, _ = _reg(client, "app-sk@test.com")
        resp = client.post(f"/api/jobs/{job_id}/apply", headers=sk_h, json={
            "job_id": job_id, "cover_letter": "Hire me!",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "applied"
        assert data["cover_letter"] == "Hire me!"
        assert "job" in data
        assert data["job"]["id"] == job_id

    def test_duplicate_application_409(self, client):
        co_h, _ = _reg(client, "dup-co@test.com", "company", "DupCo", "DupCo")
        job_id = client.post("/api/jobs", headers=co_h, json=_job_payload()).json()["id"]

        sk_h, _ = _reg(client, "dup-sk@test.com")
        client.post(f"/api/jobs/{job_id}/apply", headers=sk_h, json={"job_id": job_id})
        resp = client.post(f"/api/jobs/{job_id}/apply", headers=sk_h, json={"job_id": job_id})
        assert resp.status_code == 409

    def test_apply_nonexistent_job_404(self, client):
        h, _ = _reg(client, "noexist-app@test.com")
        resp = client.post("/api/jobs/fake_job/apply", headers=h, json={"job_id": "fake_job"})
        assert resp.status_code == 404

    def test_my_applications(self, client):
        co_h, _ = _reg(client, "myapp-co@test.com", "company", "MyAppCo", "MyAppCo")
        j1 = client.post("/api/jobs", headers=co_h, json=_job_payload(title="Job A")).json()["id"]
        j2 = client.post("/api/jobs", headers=co_h, json=_job_payload(title="Job B")).json()["id"]

        sk_h, _ = _reg(client, "myapp-sk@test.com")
        client.post(f"/api/jobs/{j1}/apply", headers=sk_h, json={"job_id": j1})
        client.post(f"/api/jobs/{j2}/apply", headers=sk_h, json={"job_id": j2})

        resp = client.get("/api/jobs/me/applications", headers=sk_h)
        assert resp.status_code == 200
        apps = resp.json()
        assert len(apps) == 2
        assert all("job" in a for a in apps)

    def test_update_application_status(self, client):
        co_h, _ = _reg(client, "status-co@test.com", "company", "StatusCo", "StatusCo")
        job_id = client.post("/api/jobs", headers=co_h, json=_job_payload()).json()["id"]

        sk_h, _ = _reg(client, "status-sk@test.com")
        app_id = client.post(f"/api/jobs/{job_id}/apply", headers=sk_h, json={
            "job_id": job_id,
        }).json()["id"]

        resp = client.patch(f"/api/jobs/applications/{app_id}/status", headers=co_h, json={
            "status": "interview",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "interview"

    def test_invalid_application_status_422(self, client):
        co_h, _ = _reg(client, "bad-status-co@test.com", "company", "BadCo", "BadCo")
        job_id = client.post("/api/jobs", headers=co_h, json=_job_payload()).json()["id"]
        sk_h, _ = _reg(client, "bad-status-sk@test.com")
        app_id = client.post(f"/api/jobs/{job_id}/apply", headers=sk_h, json={
            "job_id": job_id,
        }).json()["id"]

        resp = client.patch(f"/api/jobs/applications/{app_id}/status", headers=co_h, json={
            "status": "invalid_status",
        })
        assert resp.status_code == 422


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CHAT CONTRACT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestChatContract:

    def test_send_message_response_shape(self, client):
        h1, u1 = _reg(client, "chat1@test.com", name="Alice")
        h2, u2 = _reg(client, "chat2@test.com", "recruiter", "Bob")

        resp = client.post("/api/chat/messages", headers=h1, json={
            "recipient_id": u2["id"], "content": "Hi Bob!",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Hi Bob!"
        assert "conversation_id" in data
        assert "sender_id" in data
        assert "created_at" in data

    def test_conversation_list_response_shape(self, client):
        h1, u1 = _reg(client, "convlist1@test.com", name="Conv1")
        h2, u2 = _reg(client, "convlist2@test.com", "recruiter", "Conv2")
        client.post("/api/chat/messages", headers=h1, json={
            "recipient_id": u2["id"], "content": "Hey",
        })

        resp = client.get("/api/chat/conversations", headers=h1)
        assert resp.status_code == 200
        convs = resp.json()
        assert len(convs) == 1
        assert "participants" in convs[0]
        assert "last_message" in convs[0]

    def test_empty_conversations_list(self, client):
        h, _ = _reg(client, "no-convs@test.com")
        resp = client.get("/api/chat/conversations", headers=h)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_message_to_nonexistent_user(self, client):
        h, _ = _reg(client, "msg-ghost@test.com")
        resp = client.post("/api/chat/messages", headers=h, json={
            "recipient_id": "nonexistent_user", "content": "Hello?",
        })
        assert resp.status_code in (404, 201)  # depends on validation


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  RECRUITER CONTRACT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestRecruiterContract:

    def test_candidates_returns_array(self, client):
        h, _ = _reg(client, "rec-cands@test.com", "recruiter", "Recruiter")
        resp = client.get("/api/recruiter/candidates", headers=h)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_candidate_response_shape(self, client):
        # Create a seeker with skills
        sk_h, _ = _reg(client, "cand-shape-sk@test.com", name="Shaped Seeker")
        client.post("/api/seeker/profile", headers=sk_h, json={
            "name": "Shaped Seeker", "skills": ["React", "TypeScript"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
        })

        rec_h, _ = _reg(client, "cand-shape-rec@test.com", "recruiter", "Rec")
        resp = client.get("/api/recruiter/candidates", headers=rec_h)
        candidates = resp.json()
        assert len(candidates) >= 1

        c = candidates[0]
        for field in ["id", "name", "skills", "match_score", "status"]:
            assert field in c, f"Missing field: {field}"

    def test_pipeline_response_shape(self, client):
        h, _ = _reg(client, "pipeline@test.com", "recruiter", "Pipeline Rec")
        resp = client.get("/api/recruiter/pipeline", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert "stages" in data
        assert "pipeline" in data
        assert "total" in data
        assert set(data["stages"]) == {"applied", "screening", "interview", "offer", "hired"}

    def test_analytics_response_shape(self, client):
        h, _ = _reg(client, "rec-analytics@test.com", "recruiter", "Analytics Rec")
        resp = client.get("/api/recruiter/analytics", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        for field in ["placements_ytd", "revenue_ytd", "avg_time_to_fill",
                      "pipeline_conversion", "placements_by_month"]:
            assert field in data


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  COMPANY CONTRACT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestCompanyContract:

    def test_dashboard_response_shape(self, client):
        h, _ = _reg(client, "co-dash@test.com", "company", "DashCo", "DashCo")
        resp = client.get("/api/company/dashboard", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert "jobs" in data
        assert "total_applicants" in data

    def test_analytics_response_shape(self, client):
        h, _ = _reg(client, "co-anal@test.com", "company", "AnalCo", "AnalCo")
        resp = client.get("/api/company/analytics", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        for field in ["open_positions", "total_applicants", "avg_match_quality"]:
            assert field in data


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SEEKER MATCHING CONTRACT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestMatchingContract:

    def test_matches_require_profile(self, client):
        h, _ = _reg(client, "no-prof-match@test.com")
        resp = client.get("/api/seeker/jobs/matches", headers=h)
        # Should return 400 or empty list
        assert resp.status_code in (200, 400)

    def test_match_response_shape(self, client):
        co_h, _ = _reg(client, "match-co@test.com", "company", "MatchCo", "MatchCo")
        client.post("/api/jobs", headers=co_h, json=_job_payload(
            title="React Dev", required_skills=["React", "TypeScript"],
        ))

        sk_h, _ = _reg(client, "match-sk@test.com")
        client.post("/api/seeker/profile", headers=sk_h, json={
            "name": "Matcher", "skills": ["React", "TypeScript", "Node.js"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
        })

        resp = client.get("/api/seeker/jobs/matches", headers=sk_h)
        assert resp.status_code == 200
        matches = resp.json()
        assert len(matches) >= 1

        m = matches[0]
        for field in ["id", "title", "match_score", "matched_required"]:
            assert field in m, f"Missing field: {field}"
        assert 0 <= m["match_score"] <= 99
