"""
Integration tests for /api/company endpoints.
"""

import pytest
from tests.conftest import auth_header, create_seeker_with_profile


class TestCompanyDashboard:

    @pytest.mark.integration
    def test_dashboard(self, seeded_client):
        resp = seeded_client.post("/api/auth/login", json={
            "email": "techvault@demo.com", "password": "demo1234",
        })
        token = resp.json()["access_token"]

        resp = seeded_client.get("/api/company/dashboard", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "open_positions" in data
        assert "total_applicants" in data
        assert "jobs" in data
        assert isinstance(data["jobs"], list)

    @pytest.mark.integration
    def test_dashboard_shows_companys_own_jobs(self, seeded_client):
        resp = seeded_client.post("/api/auth/login", json={
            "email": "techvault@demo.com", "password": "demo1234",
        })
        token = resp.json()["access_token"]

        resp = seeded_client.get("/api/company/dashboard", headers=auth_header(token))
        data = resp.json()
        assert data["open_positions"] >= 1
        for j in data["jobs"]:
            assert j["title"]


class TestRecommendedCandidates:

    @pytest.mark.integration
    def test_recommendations_with_seekers(self, seeded_client):
        create_seeker_with_profile(seeded_client)

        resp = seeded_client.post("/api/auth/login", json={
            "email": "techvault@demo.com", "password": "demo1234",
        })
        token = resp.json()["access_token"]

        resp = seeded_client.get("/api/company/candidates/recommended", headers=auth_header(token))
        assert resp.status_code == 200
        candidates = resp.json()
        assert isinstance(candidates, list)

    @pytest.mark.integration
    def test_recommendations_empty_when_no_seekers(self, seeded_client):
        resp = seeded_client.post("/api/auth/login", json={
            "email": "techvault@demo.com", "password": "demo1234",
        })
        token = resp.json()["access_token"]

        resp = seeded_client.get("/api/company/candidates/recommended", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []


class TestCompanyAnalytics:

    @pytest.mark.integration
    def test_analytics_structure(self, seeded_client):
        resp = seeded_client.post("/api/auth/login", json={
            "email": "techvault@demo.com", "password": "demo1234",
        })
        token = resp.json()["access_token"]

        resp = seeded_client.get("/api/company/analytics", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "open_positions" in data
        assert "hires_by_department" in data
        assert "diversity_metrics" in data
        assert data["offer_acceptance_rate"] > 0
