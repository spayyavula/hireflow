"""Integration tests for hiring-side application authorization (ADR-0001)."""

import pytest
from tests.conftest import register_user, auth_header


def _company_token(client, email="techvault@demo.com"):
    resp = client.post("/api/auth/login", json={"email": email, "password": "demo1234"})
    return resp.json()["access_token"]


def _recruiter_token(client):
    resp = client.post("/api/auth/login", json={"email": "recruiter@demo.com", "password": "demo1234"})
    return resp.json()["access_token"]


def _apply_to_job_1(client):
    """Register a seeker, apply to job_1, return (seeker_token, application_id)."""
    token, _ = register_user(client, email="applicant1@test.com", role="seeker", name="Applicant One")
    resp = client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token))
    return token, resp.json()["id"]


def _assign_rec_1_to_job_1(client):
    token = _company_token(client)
    client.post("/api/jobs/job_1/recruiters", json={"recruiter_id": "rec_1"}, headers=auth_header(token))


class TestGetJobApplications:

    @pytest.mark.integration
    def test_owning_company_can_list_applications(self, seeded_client):
        _apply_to_job_1(seeded_client)
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(_company_token(seeded_client)))
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.integration
    def test_assigned_recruiter_can_list_applications(self, seeded_client):
        _apply_to_job_1(seeded_client)
        _assign_rec_1_to_job_1(seeded_client)
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(_recruiter_token(seeded_client)))
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.integration
    def test_unassigned_recruiter_cannot_list_applications(self, seeded_client):
        _apply_to_job_1(seeded_client)
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(_recruiter_token(seeded_client)))
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_other_company_cannot_list_applications(self, seeded_client):
        _apply_to_job_1(seeded_client)
        token = _company_token(seeded_client, email="datapulseai@demo.com")
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(token))
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_seeker_cannot_list_applications(self, seeded_client):
        # Regression: a seeker must not be able to read competitors' applications.
        seeker_token, _ = _apply_to_job_1(seeded_client)
        resp = seeded_client.get("/api/jobs/job_1/applications", headers=auth_header(seeker_token))
        assert resp.status_code == 403


class TestUpdateApplicationStatus:

    @pytest.mark.integration
    def test_owning_company_can_advance_status(self, seeded_client):
        _, app_id = _apply_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "interview"},
            headers=auth_header(_company_token(seeded_client)),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "interview"

    @pytest.mark.integration
    def test_owning_company_can_mark_hired(self, seeded_client):
        _, app_id = _apply_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "hired"},
            headers=auth_header(_company_token(seeded_client)),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "hired"

    @pytest.mark.integration
    def test_assigned_recruiter_can_advance_status(self, seeded_client):
        _, app_id = _apply_to_job_1(seeded_client)
        _assign_rec_1_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "offer"},
            headers=auth_header(_recruiter_token(seeded_client)),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "offer"

    @pytest.mark.integration
    def test_recruiter_cannot_mark_hired(self, seeded_client):
        _, app_id = _apply_to_job_1(seeded_client)
        _assign_rec_1_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "hired"},
            headers=auth_header(_recruiter_token(seeded_client)),
        )
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_unassigned_recruiter_cannot_advance_status(self, seeded_client):
        _, app_id = _apply_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "interview"},
            headers=auth_header(_recruiter_token(seeded_client)),
        )
        assert resp.status_code == 403

    @pytest.mark.integration
    def test_seeker_cannot_advance_status(self, seeded_client):
        # Regression: a seeker must not be able to mutate any application.
        seeker_token, app_id = _apply_to_job_1(seeded_client)
        resp = seeded_client.patch(
            f"/api/jobs/applications/{app_id}/status",
            json={"status": "hired"},
            headers=auth_header(seeker_token),
        )
        assert resp.status_code == 403
