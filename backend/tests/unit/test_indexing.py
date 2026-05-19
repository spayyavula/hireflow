"""Unit tests for the Google Indexing API notifier."""

import pytest

from api.services import indexing
from api.services.indexing import job_public_url, notify_url, notify_job_published


@pytest.mark.unit
def test_job_public_url_builds_a_slugged_url():
    url = job_public_url({"id": "job_abc123", "title": "Senior React Developer"})
    assert url == "https://jobssearch.work/jobs/senior-react-developer-job_abc123"


@pytest.mark.unit
def test_job_public_url_handles_messy_titles():
    url = job_public_url({"id": "job_x", "title": "  C++ / Go  Engineer!! "})
    assert url == "https://jobssearch.work/jobs/c-go-engineer-job_x"


@pytest.mark.unit
def test_notify_url_is_a_noop_when_unconfigured(monkeypatch):
    # No credential configured -> no-op, returns False, does not raise.
    monkeypatch.setattr(indexing, "GOOGLE_INDEXING_CREDENTIALS", "")
    assert notify_url("https://jobssearch.work/jobs/x-job_1", "URL_UPDATED") is False


@pytest.mark.unit
def test_notify_url_never_raises_on_bad_credential(monkeypatch):
    # A malformed credential must be caught — the notifier returns False, never raises.
    monkeypatch.setattr(indexing, "GOOGLE_INDEXING_CREDENTIALS", "not-valid-json")
    assert notify_url("https://jobssearch.work/jobs/x-job_1", "URL_UPDATED") is False


@pytest.mark.unit
def test_notify_job_published_uses_url_updated(monkeypatch):
    calls = []
    monkeypatch.setattr(indexing, "notify_url", lambda url, action: calls.append((url, action)))
    notify_job_published({"id": "job_1", "title": "Data Scientist"})
    assert calls == [("https://jobssearch.work/jobs/data-scientist-job_1", "URL_UPDATED")]
