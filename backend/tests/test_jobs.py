"""
Integration tests for /api/jobs endpoints.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


class TestListJobs:

    @pytest.mark.integration
    def test_list_all_jobs(self, seeded_client):
        resp = seeded_client.get("/api/jobs")
        assert resp.status_code == 200
        jobs = resp.json()
        assert len(jobs) == 3
        assert all(j["status"] == "active" for j in jobs)

    @pytest.mark.integration
    def test_list_remote_only(self, seeded_client):
        resp = seeded_client.get("/api/jobs?remote_only=true")
        assert resp.status_code == 200
        for j in resp.json():
            assert j["remote"] is True

    @pytest.mark.integration
    def test_search_by_keyword(self, seeded_client):
        resp = seeded_client.get("/api/jobs?search=React")
        assert resp.status_code == 200
        jobs = resp.json()
        assert any("React" in j["title"] for j in jobs)

    @pytest.mark.integration
    def test_search_no_results(self, seeded_client):
        resp = seeded_client.get("/api/jobs?search=ZephyrLang4000")
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    @pytest.mark.integration
    def test_get_single_job(self, seeded_client):
        resp = seeded_client.get("/api/jobs/job_1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "job_1"
        assert data["title"] == "Senior React Developer"
        assert data["company_name"] == "TechVault"
        assert data["salary_display"]

    @pytest.mark.integration
    def test_get_nonexistent_job(self, seeded_client):
        resp = seeded_client.get("/api/jobs/job_999")
        assert resp.status_code == 404


class TestCreateJob:

    @pytest.mark.integration
    def test_company_creates_job(self, seeded_client):
        resp = seeded_client.post("/api/auth/login", json={
            "email": "techvault@demo.com", "password": "demo1234",
        })
        token = resp.json()["access_token"]

        resp = seeded_client.post("/api/jobs", json={
            "title": "Junior React Dev",
            "location": "Remote",
            "salary_min": 90000, "salary_max": 120000,
            "type": "full-time", "remote": True,
            "description": "Entry-level React position.",
            "required_skills": ["React", "JavaScript"],
            "nice_skills": ["TypeScript"],
            "experience_level": "Entry Level (0-2 yrs)",
        }, headers=auth_header(token))
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Junior React Dev"
        assert data["status"] == "active"
        assert data["company_name"] == "TechVault"

    @pytest.mark.integration
    def test_seeker_cannot_create_job(self, seeded_client):
        token, _ = register_user(seeded_client, email="s@test.com", role="seeker")
        resp = seeded_client.post("/api/jobs", json={
            "title": "Fake", "location": "Nowhere", "description": "Nope.",
        }, headers=auth_header(token))
        assert resp.status_code == 403


class TestApplications:

    @pytest.mark.integration
    def test_apply_to_job(self, seeded_client):
        token, _ = register_user(seeded_client, email="applicant@test.com", role="seeker", name="Applicant")
        resp = seeded_client.post("/api/jobs/job_1/apply", json={
            "job_id": "job_1", "cover_letter": "I love React!",
        }, headers=auth_header(token))
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "applied"
        assert data["cover_letter"] == "I love React!"

    @pytest.mark.integration
    def test_duplicate_application_rejected(self, seeded_client):
        token, _ = register_user(seeded_client, email="dup@test.com", role="seeker")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
        resp = seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
        assert resp.status_code == 409

    @pytest.mark.integration
    def test_apply_to_nonexistent_job(self, seeded_client):
        token, _ = register_user(seeded_client, email="ghost@test.com", role="seeker")
        resp = seeded_client.post("/api/jobs/job_999/apply", json={"job_id": "job_999"}, headers=auth_header(token))
        assert resp.status_code == 404

    @pytest.mark.integration
    def test_get_my_applications(self, seeded_client):
        token, _ = register_user(seeded_client, email="myapps@test.com", role="seeker")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
        seeded_client.post("/api/jobs/job_2/apply", json={"job_id": "job_2"}, headers=auth_header(token))
        resp = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    @pytest.mark.integration
    def test_update_application_status(self, seeded_client):
        # Seeker applies
        token, _ = register_user(seeded_client, email="stage@test.com", role="seeker")
        app_resp = seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
        app_id = app_resp.json()["id"]

        # Company advances the application
        co_resp = seeded_client.post("/api/auth/login", json={"email": "techvault@demo.com", "password": "demo1234"})
        co_token = co_resp.json()["access_token"]

        resp = seeded_client.patch(f"/api/jobs/applications/{app_id}/status", json={
            "status": "interview",
        }, headers=auth_header(co_token))
        assert resp.status_code == 200
        assert resp.json()["status"] == "interview"


class TestJobManagement:

    @pytest.mark.integration
    def test_close_job(self, seeded_client):
        co_resp = seeded_client.post("/api/auth/login", json={"email": "techvault@demo.com", "password": "demo1234"})
        token = co_resp.json()["access_token"]

        resp = seeded_client.delete("/api/jobs/job_1", headers=auth_header(token))
        assert resp.status_code == 200

        # Verify it's closed
        resp = seeded_client.get("/api/jobs/job_1")
        assert resp.json()["status"] == "closed"

    @pytest.mark.integration
    def test_cannot_close_other_companys_job(self, seeded_client):
        # DataPulse tries to close TechVault's job
        co_resp = seeded_client.post("/api/auth/login", json={"email": "datapulseai@demo.com", "password": "demo1234"})
        token = co_resp.json()["access_token"]
        resp = seeded_client.delete("/api/jobs/job_1", headers=auth_header(token))
        assert resp.status_code == 403
