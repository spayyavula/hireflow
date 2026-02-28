"""
Comprehensive integration tests for HireFlow API routes.
Covers all endpoints with success paths, error paths, authorization,
boundary conditions, and cross-route interactions.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTH ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestAuthRegister:
    def test_register_seeker_success(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "new@test.com", "password": "testpass123", "role": "seeker", "name": "New User",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "new@test.com"
        assert data["user"]["role"] == "seeker"

    def test_register_company_success(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "co@test.com", "password": "testpass123", "role": "company", "company_name": "Acme Inc",
        })
        assert resp.status_code == 201
        assert resp.json()["user"]["company_name"] == "Acme Inc"

    def test_register_company_without_name_fails(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "co@test.com", "password": "testpass123", "role": "company",
        })
        assert resp.status_code == 400

    def test_register_recruiter(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "rec@test.com", "password": "testpass123", "role": "recruiter", "name": "Recruiter",
        })
        assert resp.status_code == 201
        assert resp.json()["user"]["role"] == "recruiter"

    def test_register_duplicate_email(self, client):
        client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "testpass123", "role": "seeker",
        })
        resp = client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "testpass123", "role": "seeker",
        })
        assert resp.status_code == 409

    def test_register_short_password(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "a@b.com", "password": "short", "role": "seeker",
        })
        assert resp.status_code == 422

    def test_register_invalid_role(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "a@b.com", "password": "longpass123", "role": "admin",
        })
        assert resp.status_code == 422


class TestAuthLogin:
    def test_login_success(self, client):
        register_user(client, email="login@test.com", password="mypassword1")
        resp = client.post("/api/auth/login", json={
            "email": "login@test.com", "password": "mypassword1",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_wrong_password(self, client):
        register_user(client, email="login2@test.com", password="correct123")
        resp = client.post("/api/auth/login", json={
            "email": "login2@test.com", "password": "wrongpass123",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "nobody@test.com", "password": "somepass123",
        })
        assert resp.status_code == 401

    def test_login_returns_user_info(self, client):
        register_user(client, email="info@test.com", password="testpass123", role="seeker", name="Info User")
        resp = client.post("/api/auth/login", json={
            "email": "info@test.com", "password": "testpass123",
        })
        user = resp.json()["user"]
        assert user["name"] == "Info User"
        assert user["role"] == "seeker"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SEEKER ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestSeekerProfile:
    def test_create_profile(self, client):
        token, _ = register_user(client, email="s@t.com", role="seeker")
        resp = client.post("/api/seeker/profile", json={
            "name": "Seeker One", "skills": ["React", "Python", "AWS"],
            "desired_roles": ["Developer"], "experience_level": "Mid Level (3-5 yrs)",
        }, headers=auth_header(token))
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Seeker One"
        assert "profile_strength" in data

    def test_get_profile(self, client):
        token, _ = register_user(client, email="s@t.com", role="seeker")
        client.post("/api/seeker/profile", json={
            "name": "Test", "skills": ["React"],
        }, headers=auth_header(token))
        resp = client.get("/api/seeker/profile", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["skills"] == ["React"]

    def test_profile_strength_calculation(self, client):
        token, _ = register_user(client, email="s@t.com", role="seeker")
        # Minimal profile
        resp = client.post("/api/seeker/profile", json={
            "name": "Test", "skills": ["React", "Python", "JS"],
        }, headers=auth_header(token))
        strength = resp.json()["profile_strength"]
        assert strength in ["Needs Work", "Good", "Strong"]

    def test_unauthenticated_profile_access(self, client):
        resp = client.get("/api/seeker/profile")
        assert resp.status_code in [401, 403]


class TestSeekerResumeUpload:
    def test_upload_pdf(self, client):
        token, _ = register_user(client, email="up@t.com", role="seeker")
        resp = client.post("/api/seeker/resume/upload",
            files={"file": ("resume.pdf", b"fake pdf content", "application/pdf")},
            headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "ai_summary" in data
        assert isinstance(data["skills_extracted"], int)

    def test_upload_docx(self, client):
        token, _ = register_user(client, email="up2@t.com", role="seeker")
        resp = client.post("/api/seeker/resume/upload",
            files={"file": ("resume.docx", b"fake docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            headers=auth_header(token))
        assert resp.status_code == 200

    def test_upload_invalid_type(self, client):
        token, _ = register_user(client, email="up3@t.com", role="seeker")
        resp = client.post("/api/seeker/resume/upload",
            files={"file": ("image.png", b"fake png", "image/png")},
            headers=auth_header(token))
        assert resp.status_code == 400


class TestSeekerAISummary:
    def test_generate_summary(self, client):
        token, _ = register_user(client, email="ai@t.com", role="seeker")
        resp = client.post("/api/seeker/ai/summary", json={
            "name": "Alice", "skills": ["React", "Python"],
            "desired_roles": ["Frontend Developer"],
        }, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["summary"]) > 20
        assert len(data["suggested_headline"]) > 5

    def test_summary_suggests_skills(self, client):
        token, _ = register_user(client, email="ai2@t.com", role="seeker")
        resp = client.post("/api/seeker/ai/summary", json={
            "name": "Bob", "skills": ["React", "TypeScript"],
            "desired_roles": ["Developer"],
        }, headers=auth_header(token))
        data = resp.json()
        assert isinstance(data["suggested_skills"], list)


class TestSeekerJobMatching:
    def test_match_with_profile(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        resp = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        assert resp.status_code == 200
        matches = resp.json()
        assert len(matches) > 0
        assert all("match_score" in m for m in matches)
        # Results should be sorted by score descending
        scores = [m["match_score"] for m in matches]
        assert scores == sorted(scores, reverse=True)

    def test_match_min_score_filter(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        resp = seeded_client.get("/api/seeker/jobs/matches?min_score=80", headers=auth_header(token))
        matches = resp.json()
        assert all(m["match_score"] >= 80 for m in matches)

    def test_match_without_profile(self, seeded_client):
        token, _ = register_user(seeded_client, email="noprof@t.com", role="seeker")
        resp = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        # Should return empty or error since no profile
        assert resp.status_code in [200, 400]

    def test_public_match_endpoint(self, seeded_client):
        resp = seeded_client.post("/api/seeker/jobs/matches", json={
            "skills": ["React", "TypeScript"],
            "desired_roles": ["Frontend Developer"],
            "work_preferences": ["Remote"],
        })
        assert resp.status_code == 200
        matches = resp.json()
        assert len(matches) > 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JOB ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestJobsCRUD:
    def test_list_jobs_empty(self, client):
        resp = client.get("/api/jobs")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_jobs_with_seed(self, seeded_client):
        resp = seeded_client.get("/api/jobs")
        assert resp.status_code == 200
        assert len(resp.json()) >= 3

    def test_get_single_job(self, seeded_client):
        resp = seeded_client.get("/api/jobs/job_1")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Senior React Developer"

    def test_get_nonexistent_job(self, seeded_client):
        resp = seeded_client.get("/api/jobs/nonexistent_id")
        assert resp.status_code == 404

    def test_create_job_as_company(self, seeded_client):
        token, _ = register_user(seeded_client, email="newco@t.com", role="company", company_name="NewCo")
        resp = seeded_client.post("/api/jobs", json={
            "title": "Test Job", "location": "Remote",
            "description": "A test position", "required_skills": ["Python"],
        }, headers=auth_header(token))
        assert resp.status_code == 201
        assert resp.json()["title"] == "Test Job"

    def test_create_job_as_seeker_forbidden(self, seeded_client):
        token, _ = register_user(seeded_client, email="seeker@t.com", role="seeker")
        resp = seeded_client.post("/api/jobs", json={
            "title": "Bad Job", "location": "Nowhere",
            "description": "Nope", "required_skills": [],
        }, headers=auth_header(token))
        assert resp.status_code == 403

    def test_search_jobs_by_query(self, seeded_client):
        resp = seeded_client.get("/api/jobs?search=react")
        matches = resp.json()
        assert len(matches) >= 1
        assert any("react" in j["title"].lower() for j in matches)

    def test_search_remote_only(self, seeded_client):
        resp = seeded_client.get("/api/jobs?remote_only=true")
        jobs = resp.json()
        assert all(j["remote"] for j in jobs)

    def test_close_job(self, seeded_client):
        token, _ = register_user(seeded_client, email="co@t.com", role="company", company_name="CloseCo")
        create_resp = seeded_client.post("/api/jobs", json={
            "title": "Closeable", "location": "Remote",
            "description": "Will close", "required_skills": [],
        }, headers=auth_header(token))
        job_id = create_resp.json()["id"]
        resp = seeded_client.delete(f"/api/jobs/{job_id}", headers=auth_header(token))
        assert resp.status_code == 200


class TestJobApplications:
    def test_apply_to_job(self, seeded_client):
        token, _ = register_user(seeded_client, email="applicant@t.com", role="seeker")
        resp = seeded_client.post("/api/jobs/job_1/apply", json={
            "job_id": "job_1", "cover_letter": "I'm interested!",
        }, headers=auth_header(token))
        assert resp.status_code == 201
        assert resp.json()["status"] == "applied"

    def test_duplicate_application_rejected(self, seeded_client):
        token, _ = register_user(seeded_client, email="dup@t.com", role="seeker")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
        resp = seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
        assert resp.status_code == 409

    def test_get_my_applications(self, seeded_client):
        token, _ = register_user(seeded_client, email="myapps@t.com", role="seeker")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
        seeded_client.post("/api/jobs/job_2/apply", json={"job_id": "job_2"}, headers=auth_header(token))
        resp = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_job_applications_as_company(self, seeded_client):
        # Apply as seeker
        token_s, _ = register_user(seeded_client, email="s@t.com", role="seeker")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token_s))
        # View as company (comp_1 owns job_1)
        from api.core.config import create_access_token
        token_c = create_access_token({"sub": "comp_1", "role": "company"})
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(token_c))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_update_application_status(self, seeded_client):
        token_s, _ = register_user(seeded_client, email="s@t.com", role="seeker")
        apply_resp = seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token_s))
        app_id = apply_resp.json()["id"]
        from api.core.config import create_access_token
        token_c = create_access_token({"sub": "comp_1", "role": "company"})
        resp = seeded_client.patch(f"/api/jobs/applications/{app_id}/status",
            json={"status": "screening"}, headers=auth_header(token_c))
        assert resp.status_code == 200
        assert resp.json()["status"] == "screening"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  RECRUITER ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestRecruiterEndpoints:
    def test_search_candidates_empty(self, client):
        token, _ = register_user(client, email="rec@t.com", role="recruiter")
        resp = client.get("/api/recruiter/candidates", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_search_candidates_with_seekers(self, seeded_client):
        # Create a seeker with profile
        create_seeker_with_profile(seeded_client)
        token, _ = register_user(seeded_client, email="rec@t.com", role="recruiter")
        resp = seeded_client.get("/api/recruiter/candidates", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_search_candidates_by_skill(self, seeded_client):
        create_seeker_with_profile(seeded_client)
        token, _ = register_user(seeded_client, email="rec@t.com", role="recruiter")
        resp = seeded_client.get("/api/recruiter/candidates?q=React", headers=auth_header(token))
        assert resp.status_code == 200

    def test_advanced_candidate_search(self, seeded_client):
        create_seeker_with_profile(seeded_client)
        token, _ = register_user(seeded_client, email="rec@t.com", role="recruiter")
        resp = seeded_client.post("/api/recruiter/candidates/search", json={
            "skills": ["React", "TypeScript"],
        }, headers=auth_header(token))
        assert resp.status_code == 200

    def test_pipeline(self, seeded_client):
        token, _ = register_user(seeded_client, email="rec@t.com", role="recruiter")
        resp = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "stages" in data

    def test_analytics(self, seeded_client):
        token, _ = register_user(seeded_client, email="rec@t.com", role="recruiter")
        resp = seeded_client.get("/api/recruiter/analytics", headers=auth_header(token))
        assert resp.status_code == 200


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  COMPANY ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestCompanyEndpoints:
    def test_dashboard(self, seeded_client):
        from api.core.config import create_access_token
        token = create_access_token({"sub": "comp_1", "role": "company"})
        resp = seeded_client.get("/api/company/dashboard", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "jobs" in data or "open_positions" in data or "total_applicants" in data

    def test_recommended_candidates(self, seeded_client):
        create_seeker_with_profile(seeded_client)
        from api.core.config import create_access_token
        token = create_access_token({"sub": "comp_1", "role": "company"})
        resp = seeded_client.get("/api/company/candidates/recommended", headers=auth_header(token))
        assert resp.status_code == 200

    def test_analytics(self, seeded_client):
        from api.core.config import create_access_token
        token = create_access_token({"sub": "comp_1", "role": "company"})
        resp = seeded_client.get("/api/company/analytics", headers=auth_header(token))
        assert resp.status_code == 200


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CHAT ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestChatEndpoints:
    def test_send_message(self, client):
        token_a, user_a = register_user(client, email="a@t.com", role="seeker", name="Alice")
        token_b, user_b = register_user(client, email="b@t.com", role="recruiter", name="Bob")
        resp = client.post("/api/chat/messages", json={
            "recipient_id": user_b["id"], "content": "Hello Bob!",
        }, headers=auth_header(token_a))
        assert resp.status_code == 201
        assert resp.json()["content"] == "Hello Bob!"

    def test_list_conversations(self, client):
        token_a, user_a = register_user(client, email="a@t.com", role="seeker", name="Alice")
        token_b, user_b = register_user(client, email="b@t.com", role="recruiter", name="Bob")
        client.post("/api/chat/messages", json={
            "recipient_id": user_b["id"], "content": "Hi!",
        }, headers=auth_header(token_a))
        resp = client.get("/api/chat/conversations", headers=auth_header(token_a))
        assert resp.status_code == 200
        convos = resp.json()
        assert len(convos) == 1

    def test_get_messages_in_conversation(self, client):
        token_a, user_a = register_user(client, email="a@t.com", role="seeker", name="Alice")
        token_b, user_b = register_user(client, email="b@t.com", role="recruiter", name="Bob")
        msg_resp = client.post("/api/chat/messages", json={
            "recipient_id": user_b["id"], "content": "Hello!",
        }, headers=auth_header(token_a))
        conv_id = msg_resp.json()["conversation_id"]
        # Send reply
        client.post("/api/chat/messages", json={
            "recipient_id": user_a["id"], "content": "Hi back!",
        }, headers=auth_header(token_b))
        resp = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=auth_header(token_a))
        assert resp.status_code == 200
        msgs = resp.json()
        assert len(msgs) == 2

    def test_conversation_reused(self, client):
        """Two messages between same users use same conversation."""
        token_a, user_a = register_user(client, email="a@t.com", role="seeker")
        token_b, user_b = register_user(client, email="b@t.com", role="recruiter")
        r1 = client.post("/api/chat/messages", json={
            "recipient_id": user_b["id"], "content": "First",
        }, headers=auth_header(token_a))
        r2 = client.post("/api/chat/messages", json={
            "recipient_id": user_b["id"], "content": "Second",
        }, headers=auth_header(token_a))
        assert r1.json()["conversation_id"] == r2.json()["conversation_id"]

    def test_message_to_nonexistent_user(self, client):
        token, _ = register_user(client, email="a@t.com", role="seeker")
        resp = client.post("/api/chat/messages", json={
            "recipient_id": "nonexistent_user_id", "content": "Hello?",
        }, headers=auth_header(token))
        assert resp.status_code in [404, 400]

    def test_unauthenticated_chat_access(self, client):
        resp = client.get("/api/chat/conversations")
        assert resp.status_code in [401, 403]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTHORIZATION BOUNDARY TESTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestAuthorizationBoundaries:
    """Ensure each role can only access their own endpoints."""

    @pytest.mark.parametrize("endpoint", [
        "/api/seeker/profile",
        "/api/seeker/jobs/matches",
        "/api/seeker/analytics",
    ])
    def test_protected_seeker_endpoints_reject_unauthed(self, client, endpoint):
        resp = client.get(endpoint)
        assert resp.status_code in [401, 403]

    @pytest.mark.parametrize("endpoint", [
        "/api/recruiter/candidates",
        "/api/recruiter/pipeline",
        "/api/recruiter/analytics",
    ])
    def test_protected_recruiter_endpoints_reject_unauthed(self, client, endpoint):
        resp = client.get(endpoint)
        assert resp.status_code in [401, 403]

    @pytest.mark.parametrize("endpoint", [
        "/api/company/dashboard",
        "/api/company/analytics",
    ])
    def test_protected_company_endpoints_reject_unauthed(self, client, endpoint):
        resp = client.get(endpoint)
        assert resp.status_code in [401, 403]

    def test_invalid_token_rejected(self, client):
        resp = client.get("/api/seeker/profile", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code in [401, 403]

    def test_expired_token_rejected(self, client):
        from api.core.config import create_access_token
        from datetime import timedelta
        token = create_access_token({"sub": "u1", "role": "seeker"}, expires_delta=timedelta(seconds=-10))
        resp = client.get("/api/seeker/profile", headers=auth_header(token))
        assert resp.status_code in [401, 403]
