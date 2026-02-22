"""
HireFlow Backend — API Integration Tests
==========================================
Tests all API routes with full HTTP request/response cycles.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


# ━━ AUTH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestAuthRegistration:
    def test_register_seeker(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "seeker@test.com", "password": "testpass123",
            "role": "seeker", "name": "Test Seeker",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["role"] == "seeker"

    def test_register_company(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "company@test.com", "password": "testpass123",
            "role": "company", "company_name": "TestCorp",
        })
        assert resp.status_code == 201
        assert resp.json()["user"]["role"] == "company"

    def test_register_recruiter(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "recruiter@test.com", "password": "testpass123",
            "role": "recruiter", "name": "Test Recruiter",
        })
        assert resp.status_code == 201
        assert resp.json()["user"]["role"] == "recruiter"

    def test_duplicate_email_rejected(self, client):
        register_user(client, email="dup@test.com")
        resp = client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "testpass123",
            "role": "seeker", "name": "Duplicate",
        })
        assert resp.status_code == 409

    def test_short_password_rejected(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "short@test.com", "password": "short",
            "role": "seeker",
        })
        assert resp.status_code == 422


class TestAuthLogin:
    def test_login_success(self, client):
        register_user(client, email="login@test.com", password="mypassword123")
        resp = client.post("/api/auth/login", json={
            "email": "login@test.com", "password": "mypassword123",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_wrong_password(self, client):
        register_user(client, email="login2@test.com", password="correctpass123")
        resp = client.post("/api/auth/login", json={
            "email": "login2@test.com", "password": "wrongpass123",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "nobody@test.com", "password": "whatever123",
        })
        assert resp.status_code == 401


# ━━ SEEKER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSeekerProfile:
    def test_create_profile(self, client):
        token, _ = register_user(client, email="sp@test.com", role="seeker")
        resp = client.post("/api/seeker/profile", json={
            "name": "Alice", "skills": ["React", "TypeScript"],
            "desired_roles": ["Frontend Developer"],
        }, headers=auth_header(token))
        assert resp.status_code == 201

    def test_get_profile(self, client):
        token, _ = create_seeker_with_profile(client)
        resp = client.get("/api/seeker/profile", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Test Seeker"
        assert "React" in data["skills"]

    def test_profile_strength_calculated(self, client):
        token, _ = create_seeker_with_profile(client)
        resp = client.get("/api/seeker/profile", headers=auth_header(token))
        assert "profile_strength" in resp.json()

    def test_unauthorized_profile_access(self, client):
        resp = client.get("/api/seeker/profile")
        assert resp.status_code in [401, 403]


class TestSeekerResume:
    def test_upload_pdf(self, client):
        token, _ = register_user(client, email="upload@test.com", role="seeker", name="Upload")
        resp = client.post("/api/seeker/resume/upload",
            files={"file": ("resume.pdf", b"%PDF-fake-content", "application/pdf")},
            headers=auth_header(token))
        assert resp.status_code == 200
        assert "profile" in resp.json()

    def test_upload_docx(self, client):
        token, _ = register_user(client, email="docx@test.com", role="seeker", name="Docx")
        resp = client.post("/api/seeker/resume/upload",
            files={"file": ("resume.docx", b"fake-docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            headers=auth_header(token))
        assert resp.status_code == 200

    def test_upload_invalid_file_type(self, client):
        token, _ = register_user(client, email="inv@test.com", role="seeker", name="Invalid")
        resp = client.post("/api/seeker/resume/upload",
            files={"file": ("photo.jpg", b"fake-jpg", "image/jpeg")},
            headers=auth_header(token))
        assert resp.status_code == 400


class TestSeekerMatching:
    def test_get_matches_requires_profile(self, client):
        token, _ = register_user(client, email="noprofile@test.com", role="seeker")
        resp = client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        assert resp.status_code in [400, 404]

    def test_get_matches_with_profile(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        resp = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        if data:
            assert "match_score" in data[0]

    def test_matches_sorted_by_score(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        data = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token)).json()
        scores = [j["match_score"] for j in data]
        assert scores == sorted(scores, reverse=True)

    def test_matches_with_min_score_filter(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        data = seeded_client.get("/api/seeker/jobs/matches?min_score=50", headers=auth_header(token)).json()
        for job in data:
            assert job["match_score"] >= 50


class TestSeekerAI:
    def test_generate_ai_summary(self, client):
        token, _ = register_user(client, email="ai@test.com", role="seeker")
        resp = client.post("/api/seeker/ai/summary", json={
            "name": "Alice", "skills": ["React", "TypeScript"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "summary" in data
        assert "suggested_headline" in data


# ━━ JOBS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestJobRoutes:
    @staticmethod
    def _create_company_and_job(c):
        token, user = register_user(c, email="co@test.com", role="company", company_name="TestCorp")
        job = c.post("/api/jobs", json={
            "title": "React Developer", "location": "Remote",
            "description": "Build UIs", "required_skills": ["React", "TypeScript"],
        }, headers=auth_header(token)).json()
        return token, user, job

    def test_create_job(self, client):
        _, _, job = self._create_company_and_job(client)
        assert "id" in job
        assert job["title"] == "React Developer"

    def test_seeker_cannot_create_job(self, client):
        token, _ = register_user(client, email="s@test.com", role="seeker")
        resp = client.post("/api/jobs", json={
            "title": "Test", "location": "X", "description": "Y",
        }, headers=auth_header(token))
        assert resp.status_code == 403

    def test_list_active_jobs(self, seeded_client):
        resp = seeded_client.get("/api/jobs")
        assert resp.status_code == 200
        assert len(resp.json()) > 0

    def test_get_single_job(self, client):
        _, _, job = self._create_company_and_job(client)
        resp = client.get(f"/api/jobs/{job['id']}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "React Developer"

    def test_search_jobs_by_skill(self, seeded_client):
        data = seeded_client.get("/api/jobs?search=Python").json()
        assert len(data) > 0

    def test_filter_remote_jobs(self, seeded_client):
        data = seeded_client.get("/api/jobs?remote_only=true").json()
        for job in data:
            assert job["remote"] is True

    def test_close_job(self, client):
        token, _, job = self._create_company_and_job(client)
        resp = client.delete(f"/api/jobs/{job['id']}", headers=auth_header(token))
        assert resp.status_code == 200


# ━━ APPLICATIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestApplicationRoutes:
    def test_apply_to_job(self, seeded_client):
        token, _ = register_user(seeded_client, email="applicant@test.com", role="seeker")
        resp = seeded_client.post("/api/jobs/job_1/apply",
            json={"job_id": "job_1", "cover_letter": "Interested!"}, headers=auth_header(token))
        assert resp.status_code == 201

    def test_duplicate_application_rejected(self, seeded_client):
        token, _ = register_user(seeded_client, email="dup_app@test.com", role="seeker")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
        resp = seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
        assert resp.status_code == 409

    def test_get_my_applications(self, seeded_client):
        token, _ = register_user(seeded_client, email="myapps@test.com", role="seeker")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
        seeded_client.post("/api/jobs/job_2/apply", json={"job_id": "job_2"}, headers=auth_header(token))
        resp = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) == 2


# ━━ COMPANY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestCompanyRoutes:
    def test_company_dashboard(self, seeded_client):
        from api.core.config import create_access_token
        token = create_access_token({"sub": "comp_1", "role": "company"})
        resp = seeded_client.get("/api/company/dashboard", headers=auth_header(token))
        assert resp.status_code == 200

    def test_company_analytics(self, client):
        token, _ = register_user(client, email="co_a@test.com", role="company", company_name="AnalyticsCo")
        resp = client.get("/api/company/analytics", headers=auth_header(token))
        assert resp.status_code == 200


# ━━ CHAT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestChatRoutes:
    def test_send_message(self, client):
        token1, _ = register_user(client, email="chat1@test.com", role="seeker", name="Chat1")
        _, user2 = register_user(client, email="chat2@test.com", role="recruiter", name="Chat2")
        resp = client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "Hello!",
        }, headers=auth_header(token1))
        assert resp.status_code == 201

    def test_list_conversations(self, client):
        token1, _ = register_user(client, email="conv1@test.com", role="seeker", name="Conv1")
        _, user2 = register_user(client, email="conv2@test.com", role="recruiter", name="Conv2")
        client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "Hi",
        }, headers=auth_header(token1))
        resp = client.get("/api/chat/conversations", headers=auth_header(token1))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_get_conversation_messages(self, client):
        token1, user1 = register_user(client, email="msg1@test.com", role="seeker", name="Msg1")
        token2, user2 = register_user(client, email="msg2@test.com", role="recruiter", name="Msg2")
        client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "Message 1",
        }, headers=auth_header(token1))
        client.post("/api/chat/messages", json={
            "recipient_id": user1["id"], "content": "Reply 1",
        }, headers=auth_header(token2))
        convos = client.get("/api/chat/conversations", headers=auth_header(token1)).json()
        conv_id = convos[0]["id"]
        resp = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=auth_header(token1))
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    def test_send_to_nonexistent_user(self, client):
        token, _ = register_user(client, email="ghost@test.com", role="seeker")
        resp = client.post("/api/chat/messages", json={
            "recipient_id": "nonexistent_id", "content": "Hello?",
        }, headers=auth_header(token))
        assert resp.status_code in [400, 404]


# ━━ ANALYTICS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSeekerAnalytics:
    def test_seeker_analytics_endpoint(self, client):
        token, _ = create_seeker_with_profile(client)
        resp = client.get("/api/seeker/analytics", headers=auth_header(token))
        assert resp.status_code == 200
        assert "total_applications" in resp.json()

    def test_recruiter_analytics(self, client):
        token, _ = register_user(client, email="rec@test.com", role="recruiter", name="Rec")
        resp = client.get("/api/recruiter/analytics", headers=auth_header(token))
        assert resp.status_code == 200
