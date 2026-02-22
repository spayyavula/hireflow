"""
Integration tests for /api/recruiter endpoints.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


class TestCandidateSearch:

    @pytest.mark.integration
    def test_search_returns_seekers(self, seeded_client):
        # Create a seeker with profile
        create_seeker_with_profile(seeded_client)

        # Login as recruiter
        resp = seeded_client.post("/api/auth/login", json={
            "email": "recruiter@demo.com", "password": "demo1234",
        })
        rec_token = resp.json()["access_token"]

        resp = seeded_client.get("/api/recruiter/candidates", headers=auth_header(rec_token))
        assert resp.status_code == 200
        candidates = resp.json()
        assert len(candidates) >= 1
        assert candidates[0]["skills"]

    @pytest.mark.integration
    def test_search_by_skill(self, seeded_client):
        create_seeker_with_profile(seeded_client)
        resp = seeded_client.post("/api/auth/login", json={
            "email": "recruiter@demo.com", "password": "demo1234",
        })
        rec_token = resp.json()["access_token"]

        resp = seeded_client.get("/api/recruiter/candidates?skills=React", headers=auth_header(rec_token))
        assert resp.status_code == 200
        for c in resp.json():
            assert any("React" in s for s in c["skills"])

    @pytest.mark.integration
    def test_advanced_search(self, seeded_client):
        create_seeker_with_profile(seeded_client)
        resp = seeded_client.post("/api/auth/login", json={
            "email": "recruiter@demo.com", "password": "demo1234",
        })
        rec_token = resp.json()["access_token"]

        resp = seeded_client.post("/api/recruiter/candidates/search", json={
            "skills": ["TypeScript"],
            "min_match": 0,
        }, headers=auth_header(rec_token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


class TestPipeline:

    @pytest.mark.integration
    def test_pipeline_structure(self, seeded_client):
        resp = seeded_client.post("/api/auth/login", json={
            "email": "recruiter@demo.com", "password": "demo1234",
        })
        rec_token = resp.json()["access_token"]

        resp = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(rec_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "stages" in data
        assert "pipeline" in data
        assert "total" in data
        assert set(data["stages"]) == {"applied", "screening", "interview", "offer", "hired"}

    @pytest.mark.integration
    def test_pipeline_includes_applications(self, seeded_client):
        # Create application
        seeker_token, _ = register_user(seeded_client, email="pipe@test.com", role="seeker", name="Pipe User")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(seeker_token))

        resp = seeded_client.post("/api/auth/login", json={"email": "recruiter@demo.com", "password": "demo1234"})
        rec_token = resp.json()["access_token"]

        resp = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(rec_token))
        data = resp.json()
        assert data["total"] >= 1
        assert len(data["pipeline"]["applied"]) >= 1


class TestRecruiterAnalytics:

    @pytest.mark.integration
    def test_analytics_structure(self, seeded_client):
        resp = seeded_client.post("/api/auth/login", json={
            "email": "recruiter@demo.com", "password": "demo1234",
        })
        rec_token = resp.json()["access_token"]

        resp = seeded_client.get("/api/recruiter/analytics", headers=auth_header(rec_token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["placements_ytd"] > 0
        assert data["pipeline_conversion"]
        assert data["placements_by_month"]
