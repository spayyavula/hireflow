"""Integration tests for recruiter-job assignment endpoints."""

import pytest
from tests.conftest import register_user, auth_header


def _company_token(client, email="techvault@demo.com"):
    resp = client.post("/api/auth/login", json={"email": email, "password": "demo1234"})
    return resp.json()["access_token"]


def _recruiter_token(client):
    resp = client.post("/api/auth/login", json={"email": "recruiter@demo.com", "password": "demo1234"})
    return resp.json()["access_token"]


class TestAssignRecruiter:

    @pytest.mark.integration
    def test_company_assigns_recruiter_to_own_job(self, seeded_client):
        token = _company_token(seeded_client)
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_1"},
            headers=auth_header(token),
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["job_id"] == "job_1"
        assert data["recruiter_id"] == "rec_1"

    @pytest.mark.integration
    def test_company_cannot_assign_to_other_companys_job(self, seeded_client):
        # comp_2 (datapulse) tries to assign a recruiter to comp_1's job_1
        token = _company_token(seeded_client, email="datapulseai@demo.com")
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_1"},
            headers=auth_header(token),
        )
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_recruiter_cannot_assign(self, seeded_client):
        token = _recruiter_token(seeded_client)
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_1"},
            headers=auth_header(token),
        )
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_assigning_non_recruiter_is_rejected(self, seeded_client):
        token = _company_token(seeded_client)
        seeker_token, seeker = register_user(seeded_client, email="notrec@test.com", role="seeker")
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": seeker["id"]},
            headers=auth_header(token),
        )
        assert resp.status_code == 400

    @pytest.mark.integration
    def test_assigning_unknown_user_is_404(self, seeded_client):
        token = _company_token(seeded_client)
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_does_not_exist"},
            headers=auth_header(token),
        )
        assert resp.status_code == 404

    @pytest.mark.integration
    def test_duplicate_assignment_is_conflict(self, seeded_client):
        token = _company_token(seeded_client)
        seeded_client.post("/api/jobs/job_1/recruiters", json={"recruiter_id": "rec_1"}, headers=auth_header(token))
        resp = seeded_client.post(
            "/api/jobs/job_1/recruiters",
            json={"recruiter_id": "rec_1"},
            headers=auth_header(token),
        )
        assert resp.status_code == 409


class TestListAndUnassignRecruiters:

    @pytest.mark.integration
    def test_list_assigned_recruiters(self, seeded_client):
        token = _company_token(seeded_client)
        seeded_client.post("/api/jobs/job_1/recruiters", json={"recruiter_id": "rec_1"}, headers=auth_header(token))
        resp = seeded_client.get("/api/jobs/job_1/recruiters", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["recruiter_id"] == "rec_1"

    @pytest.mark.integration
    def test_company_unassigns_recruiter(self, seeded_client):
        token = _company_token(seeded_client)
        seeded_client.post("/api/jobs/job_1/recruiters", json={"recruiter_id": "rec_1"}, headers=auth_header(token))
        resp = seeded_client.delete("/api/jobs/job_1/recruiters/rec_1", headers=auth_header(token))
        assert resp.status_code == 200
        resp = seeded_client.get("/api/jobs/job_1/recruiters", headers=auth_header(token))
        assert resp.json() == []

    @pytest.mark.integration
    def test_assigned_recruiter_can_list_recruiters(self, seeded_client):
        token = _company_token(seeded_client)
        seeded_client.post("/api/jobs/job_1/recruiters", json={"recruiter_id": "rec_1"}, headers=auth_header(token))
        rec_token = _recruiter_token(seeded_client)
        resp = seeded_client.get("/api/jobs/job_1/recruiters", headers=auth_header(rec_token))
        assert resp.status_code == 200
