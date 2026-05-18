"""Integration tests for /api/recruiter authorization and pipeline scoping."""

import pytest
from tests.conftest import register_user, auth_header


def _company_token(client, email="techvault@demo.com"):
    resp = client.post("/api/auth/login", json={"email": email, "password": "demo1234"})
    return resp.json()["access_token"]


def _recruiter_token(client):
    resp = client.post("/api/auth/login", json={"email": "recruiter@demo.com", "password": "demo1234"})
    return resp.json()["access_token"]


class TestRecruiterRouteGuards:

    @pytest.mark.integration
    def test_seeker_cannot_access_candidates(self, seeded_client):
        token, _ = register_user(seeded_client, email="s1@test.com", role="seeker")
        resp = seeded_client.get("/api/recruiter/candidates", headers=auth_header(token))
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_company_cannot_access_recruiter_pipeline(self, seeded_client):
        resp = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(_company_token(seeded_client)))
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_unauthenticated_cannot_access_analytics(self, seeded_client):
        resp = seeded_client.get("/api/recruiter/analytics")
        assert resp.status_code == 401

    @pytest.mark.integration
    def test_recruiter_can_access_candidates(self, seeded_client):
        resp = seeded_client.get("/api/recruiter/candidates", headers=auth_header(_recruiter_token(seeded_client)))
        assert resp.status_code == 200

    @pytest.mark.integration
    def test_recruiter_can_access_advanced_search(self, seeded_client):
        resp = seeded_client.post(
            "/api/recruiter/candidates/search",
            json={"query": None, "skills": [], "roles": [], "min_match": 0},
            headers=auth_header(_recruiter_token(seeded_client)),
        )
        assert resp.status_code == 200


class TestPipelineScoping:

    @pytest.mark.integration
    def test_pipeline_excludes_unassigned_jobs(self, seeded_client):
        # A seeker applies to job_2 (comp_2). rec_1 is NOT assigned to job_2.
        seeker_token, _ = register_user(seeded_client, email="appj2@test.com", role="seeker")
        seeded_client.post("/api/jobs/job_2/apply", json={"job_id": "job_2"}, headers=auth_header(seeker_token))

        resp = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(_recruiter_token(seeded_client)))
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    @pytest.mark.integration
    def test_pipeline_includes_assigned_jobs(self, seeded_client):
        # A seeker applies to job_1; comp_1 assigns rec_1 to job_1.
        seeker_token, _ = register_user(seeded_client, email="appj1@test.com", role="seeker", name="Pat Applicant")
        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(seeker_token))
        seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_1"},
            headers=auth_header(_company_token(seeded_client)),
        )

        resp = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(_recruiter_token(seeded_client)))
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert body["pipeline"]["applied"][0]["job_id"] == "job_1"
