"""
Integration tests for error handling, input validation, and boundary conditions
across all API routes. Covers malformed payloads, missing fields, wrong types,
and HTTP method violations.
"""

import pytest


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Auth Route Validation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestAuthValidation:

    def test_register_missing_email(self, client):
        resp = client.post("/api/auth/register", json={
            "password": "pass1234", "role": "seeker",
        })
        assert resp.status_code == 422

    def test_register_missing_password(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "test@x.com", "role": "seeker",
        })
        assert resp.status_code == 422

    def test_register_invalid_role(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "a@b.com", "password": "pass1234", "role": "admin",
        })
        assert resp.status_code == 422

    def test_register_empty_body(self, client):
        resp = client.post("/api/auth/register", json={})
        assert resp.status_code == 422

    def test_register_password_too_short(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "short@pw.com", "password": "ab", "role": "seeker",
        })
        assert resp.status_code in (400, 422)

    def test_login_missing_fields(self, client):
        resp = client.post("/api/auth/login", json={"email": "a@b.com"})
        assert resp.status_code == 422

    def test_login_empty_body(self, client):
        resp = client.post("/api/auth/login", json={})
        assert resp.status_code == 422


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Job Route Validation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestJobValidation:

    def test_create_job_missing_title(self, client, company_auth):
        headers = company_auth
        resp = client.post("/api/jobs", headers=headers, json={
            "company_name": "Acme", "required_skills": ["Python"],
        })
        assert resp.status_code == 422

    def test_create_job_empty_body(self, client, company_auth):
        headers = company_auth
        resp = client.post("/api/jobs", headers=headers, json={})
        assert resp.status_code == 422

    def test_get_nonexistent_job(self, client):
        resp = client.get("/api/jobs/nonexistent-id-123")
        assert resp.status_code == 404

    def test_apply_to_nonexistent_job(self, client, seeker_auth):
        headers = seeker_auth
        resp = client.post("/api/jobs/fake-job-id/apply", headers=headers, json={
            "cover_letter": "Hi",
        })
        assert resp.status_code in (404, 422)

    def test_update_nonexistent_job(self, client, company_auth):
        headers = company_auth
        resp = client.put("/api/jobs/fake-id", headers=headers, json={
            "title": "Updated", "company_name": "Co", "required_skills": [],
        })
        assert resp.status_code in (404, 422)

    def test_close_nonexistent_job(self, client, company_auth):
        headers = company_auth
        resp = client.delete("/api/jobs/fake-id", headers=headers)
        assert resp.status_code == 404

    def test_update_application_invalid_status(self, client, company_auth, sample_jobs):
        headers = company_auth
        resp = client.patch("/api/jobs/applications/fake-app-id/status", headers=headers, json={
            "status": "invalid_status",
        })
        assert resp.status_code in (404, 422)

    def test_job_list_with_invalid_filter(self, client, company_auth, sample_jobs):
        """Unknown query params should be ignored, not error."""
        resp = client.get("/api/jobs?unknown_filter=xyz")
        assert resp.status_code == 200

    def test_job_search_empty_query(self, client, company_auth, sample_jobs):
        resp = client.get("/api/jobs?search=")
        assert resp.status_code == 200


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Seeker Route Validation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSeekerValidation:

    def test_create_profile_empty_body(self, client, seeker_auth):
        headers = seeker_auth
        resp = client.post("/api/seeker/profile", headers=headers, json={})
        assert resp.status_code == 422

    def test_resume_upload_no_file(self, client, seeker_auth):
        headers = seeker_auth
        resp = client.post("/api/seeker/resume/upload", headers=headers)
        assert resp.status_code == 422

    def test_ai_summary_empty_request(self, client, seeker_auth):
        headers = seeker_auth
        resp = client.post("/api/seeker/ai/summary", headers=headers, json={})
        assert resp.status_code == 422

    def test_matches_without_profile(self, client, seeker_auth, sample_jobs):
        """Seeker without skills in profile should get 400 or empty results."""
        headers = seeker_auth
        resp = client.get("/api/seeker/jobs/matches", headers=headers)
        assert resp.status_code in (400, 200)

    def test_my_applications_no_applications(self, client, seeker_auth):
        headers = seeker_auth
        resp = client.get("/api/jobs/me/applications", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Chat Route Validation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestChatValidation:

    def test_send_message_missing_fields(self, client, seeker_auth):
        headers = seeker_auth
        resp = client.post("/api/chat/messages", headers=headers, json={})
        assert resp.status_code == 422

    def test_send_message_to_nonexistent_user(self, client, seeker_auth):
        headers = seeker_auth
        resp = client.post("/api/chat/messages", headers=headers, json={
            "to_user_id": "nonexistent-user-id",
            "content": "Hello",
        })
        assert resp.status_code in (404, 400, 422)

    def test_get_conversation_messages_nonexistent(self, client, seeker_auth):
        headers = seeker_auth
        resp = client.get("/api/chat/conversations/nonexistent-conv-id/messages", headers=headers)
        assert resp.status_code in (404, 200)

    def test_list_conversations_empty(self, client, seeker_auth):
        headers = seeker_auth
        resp = client.get("/api/chat/conversations", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Recruiter Route Validation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestRecruiterValidation:

    def test_search_candidates_no_seekers(self, client, recruiter_auth):
        headers = recruiter_auth
        resp = client.get("/api/recruiter/candidates", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_advanced_search_empty_body(self, client, recruiter_auth):
        headers = recruiter_auth
        resp = client.post("/api/recruiter/candidates/search", headers=headers, json={})
        assert resp.status_code in (200, 422)

    def test_pipeline_empty(self, client, recruiter_auth):
        headers = recruiter_auth
        resp = client.get("/api/recruiter/pipeline", headers=headers)
        assert resp.status_code == 200

    def test_analytics_empty(self, client, recruiter_auth):
        headers = recruiter_auth
        resp = client.get("/api/recruiter/analytics", headers=headers)
        assert resp.status_code == 200


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Company Route Validation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestCompanyValidation:

    def test_dashboard_no_jobs(self, client, company_auth):
        headers = company_auth
        resp = client.get("/api/company/dashboard", headers=headers)
        assert resp.status_code == 200

    def test_recommended_candidates_no_seekers(self, client, company_auth):
        headers = company_auth
        resp = client.get("/api/company/candidates/recommended", headers=headers)
        assert resp.status_code == 200

    def test_analytics_no_data(self, client, company_auth):
        headers = company_auth
        resp = client.get("/api/company/analytics", headers=headers)
        assert resp.status_code == 200


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  HTTP Method Violations
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestHTTPMethodViolations:

    @pytest.mark.parametrize("method,path", [
        ("get", "/api/auth/register"),
        ("get", "/api/auth/login"),
        ("delete", "/api/auth/login"),
        ("put", "/api/seeker/profile"),
        ("delete", "/api/seeker/profile"),
        ("post", "/api/recruiter/pipeline"),
        ("post", "/api/company/dashboard"),
    ])
    def test_wrong_http_method(self, client, method, path):
        resp = getattr(client, method)(path)
        assert resp.status_code == 405

    def test_nonexistent_route_returns_404(self, client):
        resp = client.get("/api/nonexistent/route")
        assert resp.status_code == 404


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Content Type Handling
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestContentTypeHandling:

    def test_register_with_form_data_fails(self, client):
        resp = client.post("/api/auth/register", data={
            "email": "a@b.com", "password": "pass1234", "role": "seeker",
        })
        assert resp.status_code == 422

    def test_register_with_json_works(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "json@test.com", "password": "pass1234", "role": "seeker",
        })
        assert resp.status_code == 201
