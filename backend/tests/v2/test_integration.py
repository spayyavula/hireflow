"""
HireFlow Backend — Integration Tests v2
=========================================
Full API endpoint testing with real HTTP calls through FastAPI TestClient.
Covers auth, seeker, jobs, recruiter, company, chat routes with edge cases.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  HEALTH ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestHealthEndpoints:
    def test_root_endpoint(self, client):
        r = client.get("/api")
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "HireFlow API"
        assert data["status"] == "healthy"

    def test_health_endpoint(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert "status" in data


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTH ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestAuthRoutes:
    def test_register_seeker(self, client):
        r = client.post("/api/auth/register", json={
            "email": "alice@test.com", "password": "testpassword123",
            "role": "seeker", "name": "Alice",
        })
        assert r.status_code == 201
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == "alice@test.com"
        assert data["user"]["role"] == "seeker"

    def test_register_company_requires_company_name(self, client):
        r = client.post("/api/auth/register", json={
            "email": "co@test.com", "password": "testpassword123",
            "role": "company",
        })
        assert r.status_code == 400
        assert "company_name" in r.json()["detail"].lower()

    def test_register_company_with_name(self, client):
        r = client.post("/api/auth/register", json={
            "email": "co@test.com", "password": "testpassword123",
            "role": "company", "company_name": "Acme Inc",
        })
        assert r.status_code == 201
        assert r.json()["user"]["company_name"] == "Acme Inc"

    def test_register_recruiter(self, client):
        r = client.post("/api/auth/register", json={
            "email": "rec@test.com", "password": "testpassword123",
            "role": "recruiter", "name": "Jordan",
        })
        assert r.status_code == 201
        assert r.json()["user"]["role"] == "recruiter"

    def test_register_duplicate_email(self, client):
        client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "testpassword123",
            "role": "seeker", "name": "First",
        })
        r = client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "testpassword123",
            "role": "seeker", "name": "Second",
        })
        assert r.status_code == 409

    def test_register_short_password(self, client):
        r = client.post("/api/auth/register", json={
            "email": "bad@test.com", "password": "short",
            "role": "seeker",
        })
        assert r.status_code == 422

    def test_login_success(self, client):
        register_user(client, email="login@test.com", password="correct_password")
        r = client.post("/api/auth/login", json={
            "email": "login@test.com", "password": "correct_password",
        })
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password(self, client):
        register_user(client, email="login2@test.com", password="correct_password")
        r = client.post("/api/auth/login", json={
            "email": "login2@test.com", "password": "wrong_password",
        })
        assert r.status_code == 401

    def test_login_nonexistent_user(self, client):
        r = client.post("/api/auth/login", json={
            "email": "nobody@test.com", "password": "whatever123",
        })
        assert r.status_code == 401

    def test_register_invalid_role(self, client):
        r = client.post("/api/auth/register", json={
            "email": "x@x.com", "password": "longpassword",
            "role": "admin",
        })
        assert r.status_code == 422


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SEEKER ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSeekerRoutes:
    def test_create_profile(self, client):
        token, _ = register_user(client, email="seeker1@test.com", role="seeker")
        r = client.post("/api/seeker/profile", json={
            "name": "Test Seeker", "skills": ["Python", "React"],
            "desired_roles": ["Developer"],
        }, headers=auth_header(token))
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "Test Seeker"
        assert "Python" in data["skills"]

    def test_get_profile_not_created_yet(self, client):
        token, _ = register_user(client, email="empty@test.com", role="seeker")
        r = client.get("/api/seeker/profile", headers=auth_header(token))
        assert r.status_code == 404

    def test_get_profile_after_creation(self, client):
        token, _ = create_seeker_with_profile(client)
        r = client.get("/api/seeker/profile", headers=auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Test Seeker"
        assert len(data["skills"]) >= 3

    def test_profile_strength_calculation(self, client):
        token, _ = create_seeker_with_profile(client)
        r = client.get("/api/seeker/profile", headers=auth_header(token))
        data = r.json()
        assert data["profile_strength"] in ["Strong", "Good", "Needs Work"]

    def test_resume_upload_pdf(self, client):
        token, _ = register_user(client, email="uploader@test.com", role="seeker")
        r = client.post(
            "/api/seeker/resume/upload",
            files={"file": ("resume.pdf", b"fake pdf content", "application/pdf")},
            headers=auth_header(token),
        )
        assert r.status_code == 200
        data = r.json()
        assert data["message"] == "Resume parsed successfully"
        assert "parsed_profile" in data
        assert isinstance(data["skills_extracted"], int)
        assert isinstance(data["experience_extracted"], int)

    def test_resume_upload_docx(self, client):
        token, _ = register_user(client, email="uploader2@test.com", role="seeker")
        r = client.post(
            "/api/seeker/resume/upload",
            files={"file": ("resume.docx", b"fake docx content", "application/vnd.openxmlformats")},
            headers=auth_header(token),
        )
        assert r.status_code == 200

    def test_resume_upload_invalid_type(self, client):
        token, _ = register_user(client, email="uploader3@test.com", role="seeker")
        r = client.post(
            "/api/seeker/resume/upload",
            files={"file": ("image.png", b"png data", "image/png")},
            headers=auth_header(token),
        )
        assert r.status_code == 400
        assert "Unsupported" in r.json()["detail"]

    def test_ai_summary_generation(self, client):
        token, _ = register_user(client, email="ai@test.com", role="seeker")
        r = client.post("/api/seeker/ai/summary", json={
            "name": "Test User", "skills": ["React", "Python"],
            "desired_roles": ["Developer"],
        }, headers=auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert len(data["summary"]) > 20
        assert len(data["suggested_headline"]) > 5
        assert isinstance(data["suggested_skills"], list)

    def test_job_matching_requires_profile(self, seeded_client):
        token, _ = register_user(seeded_client, email="noprofile@test.com", role="seeker")
        r = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        assert r.status_code == 400

    def test_job_matching_with_profile(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        r = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        # Should be sorted descending by match_score
        for i in range(1, len(data)):
            assert data[i]["match_score"] <= data[i - 1]["match_score"]

    def test_job_matching_with_min_score(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        r = seeded_client.get("/api/seeker/jobs/matches?min_score=80", headers=auth_header(token))
        assert r.status_code == 200
        for job in r.json():
            assert job["match_score"] >= 80

    def test_public_job_matching(self, seeded_client):
        r = seeded_client.post("/api/seeker/jobs/matches", json={
            "skills": ["React", "TypeScript", "JavaScript"],
            "desired_roles": ["Frontend Developer"],
            "work_preferences": ["Remote"],
        })
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0

    def test_seeker_analytics(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        r = seeded_client.get("/api/seeker/analytics", headers=auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert "total_applications" in data
        assert "avg_match_score" in data
        assert "skills_in_demand" in data

    def test_unauthenticated_profile_access(self, client):
        r = client.get("/api/seeker/profile")
        assert r.status_code == 401


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JOBS ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestJobRoutes:
    def test_list_jobs_empty(self, client):
        r = client.get("/api/jobs")
        assert r.status_code == 200
        assert r.json() == []

    def test_list_jobs_with_seeded_data(self, seeded_client):
        r = seeded_client.get("/api/jobs")
        assert r.status_code == 200
        assert len(r.json()) == 3

    def test_get_job_by_id(self, seeded_client):
        r = seeded_client.get("/api/jobs/job_1")
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "Senior React Developer"

    def test_get_nonexistent_job(self, seeded_client):
        r = seeded_client.get("/api/jobs/nonexistent")
        assert r.status_code == 404

    def test_search_jobs_by_title(self, seeded_client):
        r = seeded_client.get("/api/jobs?search=react")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert any("React" in j["title"] for j in data)

    def test_search_jobs_by_skill(self, seeded_client):
        r = seeded_client.get("/api/jobs?search=python")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_filter_remote_jobs(self, seeded_client):
        r = seeded_client.get("/api/jobs?remote_only=true")
        assert r.status_code == 200
        for job in r.json():
            assert job["remote"] is True

    def test_create_job_as_company(self, client):
        token, _ = register_user(client, email="company@test.com", role="company",
                                 company_name="TestCo")
        r = client.post("/api/jobs", json={
            "title": "Backend Dev", "location": "Remote",
            "description": "Build APIs", "required_skills": ["Python"],
        }, headers=auth_header(token))
        assert r.status_code == 201
        data = r.json()
        assert data["title"] == "Backend Dev"
        assert data["status"] == "active"

    def test_seeker_cannot_create_job(self, client):
        token, _ = register_user(client, email="seeker@test.com", role="seeker")
        r = client.post("/api/jobs", json={
            "title": "X", "location": "Y", "description": "Z",
        }, headers=auth_header(token))
        assert r.status_code == 403

    def test_apply_to_job(self, seeded_client):
        token, _ = register_user(seeded_client, email="applicant@test.com", role="seeker")
        r = seeded_client.post("/api/jobs/job_1/apply", json={
            "job_id": "job_1", "cover_letter": "I'm interested!",
        }, headers=auth_header(token))
        assert r.status_code == 201
        data = r.json()
        assert data["status"] == "applied"
        assert data["cover_letter"] == "I'm interested!"

    def test_duplicate_application_rejected(self, seeded_client):
        token, _ = register_user(seeded_client, email="dup_app@test.com", role="seeker")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"},
                           headers=auth_header(token))
        r = seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"},
                               headers=auth_header(token))
        assert r.status_code == 409

    def test_apply_to_nonexistent_job(self, client):
        token, _ = register_user(client, email="app@test.com", role="seeker")
        r = client.post("/api/jobs/fake_job/apply", json={"job_id": "fake_job"},
                        headers=auth_header(token))
        assert r.status_code == 404

    def test_get_job_applications(self, seeded_client):
        # Register company and check job_1 apps
        token, _ = register_user(seeded_client, email="comp_check@test.com", role="company",
                                 company_name="Check")
        # Apply as seeker first
        seeker_token, _ = register_user(seeded_client, email="app2@test.com", role="seeker")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"},
                           headers=auth_header(seeker_token))
        r = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(token))
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_update_application_status(self, seeded_client):
        seeker_token, _ = register_user(seeded_client, email="status@test.com", role="seeker")
        app_r = seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"},
                                   headers=auth_header(seeker_token))
        app_id = app_r.json()["id"]

        comp_token, _ = register_user(seeded_client, email="mgr@test.com", role="company",
                                      company_name="Corp")
        r = seeded_client.patch(f"/api/jobs/applications/{app_id}/status",
                                json={"status": "screening"},
                                headers=auth_header(comp_token))
        assert r.status_code == 200
        assert r.json()["status"] == "screening"

    def test_close_job(self, client):
        token, _ = register_user(client, email="closer@test.com", role="company",
                                 company_name="CloseCo")
        create_r = client.post("/api/jobs", json={
            "title": "Temp Job", "location": "Here", "description": "Temporary",
        }, headers=auth_header(token))
        job_id = create_r.json()["id"]

        r = client.delete(f"/api/jobs/{job_id}", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["message"] == "Job closed"

    def test_close_job_not_owner(self, client):
        token1, _ = register_user(client, email="owner@test.com", role="company",
                                  company_name="Owner")
        create_r = client.post("/api/jobs", json={
            "title": "My Job", "location": "Here", "description": "Mine",
        }, headers=auth_header(token1))
        job_id = create_r.json()["id"]

        token2, _ = register_user(client, email="other@test.com", role="company",
                                  company_name="Other")
        r = client.delete(f"/api/jobs/{job_id}", headers=auth_header(token2))
        assert r.status_code == 403

    def test_my_applications(self, seeded_client):
        token, _ = register_user(seeded_client, email="myapps@test.com", role="seeker")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"},
                           headers=auth_header(token))
        seeded_client.post("/api/jobs/job_2/apply", json={"job_id": "job_2"},
                           headers=auth_header(token))
        r = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token))
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_update_job(self, client):
        token, _ = register_user(client, email="updater@test.com", role="company",
                                 company_name="UpdateCo")
        create_r = client.post("/api/jobs", json={
            "title": "Old Title", "location": "Here", "description": "Old desc",
        }, headers=auth_header(token))
        job_id = create_r.json()["id"]

        r = client.put(f"/api/jobs/{job_id}", json={
            "title": "New Title", "location": "There", "description": "New desc",
        }, headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["title"] == "New Title"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  RECRUITER ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestRecruiterRoutes:
    def test_search_candidates_empty(self, client):
        token, _ = register_user(client, email="rec@test.com", role="recruiter")
        r = client.get("/api/recruiter/candidates", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json() == []

    def test_search_candidates_with_seekers(self, seeded_client):
        # Create a seeker with profile
        create_seeker_with_profile(seeded_client)
        token, _ = register_user(seeded_client, email="rec2@test.com", role="recruiter")
        r = seeded_client.get("/api/recruiter/candidates", headers=auth_header(token))
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_search_candidates_by_skill(self, seeded_client):
        create_seeker_with_profile(seeded_client)
        token, _ = register_user(seeded_client, email="rec3@test.com", role="recruiter")
        r = seeded_client.get("/api/recruiter/candidates?skills=React",
                              headers=auth_header(token))
        assert r.status_code == 200
        for c in r.json():
            assert any("react" in s.lower() for s in c["skills"])

    def test_advanced_search(self, seeded_client):
        create_seeker_with_profile(seeded_client)
        token, _ = register_user(seeded_client, email="rec4@test.com", role="recruiter")
        r = seeded_client.post("/api/recruiter/candidates/search", json={
            "skills": ["React"],
        }, headers=auth_header(token))
        assert r.status_code == 200

    def test_pipeline(self, seeded_client):
        token, _ = register_user(seeded_client, email="rec5@test.com", role="recruiter")
        r = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert "stages" in data
        assert "pipeline" in data
        assert set(data["stages"]) == {"applied", "screening", "interview", "offer", "hired"}

    def test_recruiter_analytics(self, client):
        token, _ = register_user(client, email="rec6@test.com", role="recruiter")
        r = client.get("/api/recruiter/analytics", headers=auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert data["placements_ytd"] > 0
        assert "pipeline_conversion" in data

    def test_unauthenticated_recruiter_access(self, client):
        r = client.get("/api/recruiter/candidates")
        assert r.status_code == 401


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  COMPANY ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestCompanyRoutes:
    def test_dashboard_no_jobs(self, client):
        token, _ = register_user(client, email="co@test.com", role="company",
                                 company_name="Empty Inc")
        r = client.get("/api/company/dashboard", headers=auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert data["open_positions"] == 0
        assert data["jobs"] == []

    def test_dashboard_with_jobs(self, client):
        token, _ = register_user(client, email="co2@test.com", role="company",
                                 company_name="Active Inc")
        client.post("/api/jobs", json={
            "title": "Dev", "location": "Remote", "description": "Build stuff",
        }, headers=auth_header(token))
        r = client.get("/api/company/dashboard", headers=auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert data["open_positions"] == 1
        assert len(data["jobs"]) == 1

    def test_recommended_candidates(self, seeded_client):
        token, _ = register_user(seeded_client, email="co3@test.com", role="company",
                                 company_name="Rec Inc")
        # Create a job so candidates can be matched
        seeded_client.post("/api/jobs", json={
            "title": "React Dev", "location": "Remote",
            "description": "Frontend", "required_skills": ["React", "TypeScript"],
        }, headers=auth_header(token))
        # Create a seeker with matching skills
        create_seeker_with_profile(seeded_client)
        r = seeded_client.get("/api/company/candidates/recommended",
                              headers=auth_header(token))
        assert r.status_code == 200

    def test_company_analytics(self, client):
        token, _ = register_user(client, email="co4@test.com", role="company",
                                 company_name="Analytics Inc")
        r = client.get("/api/company/analytics", headers=auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert "hires_by_department" in data
        assert "diversity_metrics" in data

    def test_unauthenticated_dashboard(self, client):
        r = client.get("/api/company/dashboard")
        assert r.status_code == 401


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CHAT ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestChatRoutes:
    def test_send_message(self, client):
        token1, user1 = register_user(client, email="u1@test.com", role="seeker", name="User1")
        _, user2 = register_user(client, email="u2@test.com", role="recruiter", name="User2")
        r = client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "Hello!",
        }, headers=auth_header(token1))
        assert r.status_code == 201
        data = r.json()
        assert data["content"] == "Hello!"
        assert data["sender_id"] == user1["id"]

    def test_send_message_to_nonexistent_user(self, client):
        token, _ = register_user(client, email="chat1@test.com", role="seeker")
        r = client.post("/api/chat/messages", json={
            "recipient_id": "nobody_id", "content": "Hey",
        }, headers=auth_header(token))
        assert r.status_code == 404

    def test_list_conversations(self, client):
        token1, user1 = register_user(client, email="conv1@test.com", role="seeker", name="A")
        token2, user2 = register_user(client, email="conv2@test.com", role="recruiter", name="B")
        client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "Hi",
        }, headers=auth_header(token1))

        r = client.get("/api/chat/conversations", headers=auth_header(token1))
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1

    def test_get_conversation_messages(self, client):
        token1, user1 = register_user(client, email="msg1@test.com", role="seeker", name="Alice")
        token2, user2 = register_user(client, email="msg2@test.com", role="recruiter", name="Bob")

        # Send messages
        msg_r = client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "First message",
        }, headers=auth_header(token1))
        conv_id = msg_r.json()["conversation_id"]

        client.post("/api/chat/messages", json={
            "recipient_id": user1["id"], "content": "Reply",
        }, headers=auth_header(token2))

        r = client.get(f"/api/chat/conversations/{conv_id}/messages",
                       headers=auth_header(token1))
        assert r.status_code == 200
        msgs = r.json()
        assert len(msgs) >= 2

    def test_conversation_reuse(self, client):
        """Sending multiple messages between same users should reuse conversation."""
        token1, user1 = register_user(client, email="reuse1@test.com", role="seeker", name="A")
        _, user2 = register_user(client, email="reuse2@test.com", role="recruiter", name="B")

        msg1 = client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "Msg 1",
        }, headers=auth_header(token1))
        msg2 = client.post("/api/chat/messages", json={
            "recipient_id": user2["id"], "content": "Msg 2",
        }, headers=auth_header(token1))

        assert msg1.json()["conversation_id"] == msg2.json()["conversation_id"]

    def test_get_nonexistent_conversation(self, client):
        token, _ = register_user(client, email="noconv@test.com", role="seeker")
        r = client.get("/api/chat/conversations/fake_conv_id/messages",
                       headers=auth_header(token))
        assert r.status_code == 404

    def test_unauthenticated_chat(self, client):
        r = client.get("/api/chat/conversations")
        assert r.status_code == 401
