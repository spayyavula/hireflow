"""Integration tests: job create/close schedule Google Indexing notifications."""

import pytest

import api.routes.jobs as jobs_route
from tests.conftest import auth_header


def _company_token(client):
    resp = client.post("/api/auth/login", json={"email": "techvault@demo.com", "password": "demo1234"})
    return resp.json()["access_token"]


class TestIndexingHooks:

    @pytest.mark.integration
    def test_creating_a_job_notifies_url_updated(self, seeded_client, monkeypatch):
        calls = []
        monkeypatch.setattr(jobs_route, "notify_job_published", lambda job: calls.append(job))

        token = _company_token(seeded_client)
        resp = seeded_client.post("/api/jobs", json={
            "title": "Indexed Role", "location": "Remote",
            "type": "full-time", "description": "A job.",
        }, headers=auth_header(token))
        assert resp.status_code == 201

        # BackgroundTasks run after the response — by now the hook has fired.
        assert len(calls) == 1
        assert calls[0]["title"] == "Indexed Role"

    @pytest.mark.integration
    def test_closing_a_job_notifies_url_deleted(self, seeded_client, monkeypatch):
        calls = []
        monkeypatch.setattr(jobs_route, "notify_job_removed", lambda job: calls.append(job))

        token = _company_token(seeded_client)
        resp = seeded_client.delete("/api/jobs/job_1", headers=auth_header(token))
        assert resp.status_code == 200

        assert len(calls) == 1
        assert calls[0]["id"] == "job_1"

    @pytest.mark.integration
    def test_create_still_succeeds_if_notifier_raises(self, seeded_client, monkeypatch):
        # A notifier exception must not affect the job operation.
        def boom(job):
            raise RuntimeError("indexing down")
        monkeypatch.setattr(jobs_route, "notify_job_published", boom)

        token = _company_token(seeded_client)
        resp = seeded_client.post("/api/jobs", json={
            "title": "Resilient Role", "location": "Remote",
            "type": "full-time", "description": "A job.",
        }, headers=auth_header(token))
        assert resp.status_code == 201
