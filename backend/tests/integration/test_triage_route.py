"""Integration tests for POST /api/triage.

Patches api.core.database.supabase (the module-level binding that the route
imports via `from api.core.database import supabase`) so that the _SupabaseProxy
is replaced before the route handler runs. Uses the `client` fixture (from
conftest) which already applies the autouse mock_supabase — we override it per
test with a finer-grained MagicMock to assert exact insert shapes.
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from api.index import app


VALID_PAYLOAD = {
    "laid_off_when": "1-7d",
    "role": "engineer",
    "level": "senior",
    "company_tier": "series_b_d",
    "severance_runway": "8_16w",
    "visa_status": "citizen_gc",
    "location_flexibility": "remote_us",
    "resume_state": "needs_rewrite",
    "network_state": "cold_contacts",
    "top_concern": "direction",
}


@pytest.mark.integration
def test_triage_post_returns_triage_id_and_plan(client):
    fake_id = "abc-123-uuid"
    insert_mock = MagicMock()
    insert_mock.execute.return_value = MagicMock(
        data=[{"id": fake_id}], count=None
    )
    table_mock = MagicMock()
    table_mock.insert.return_value = insert_mock
    sb_mock = MagicMock()
    sb_mock.table.return_value = table_mock

    with patch("api.core.database.supabase", sb_mock):
        resp = client.post("/api/triage", json=VALID_PAYLOAD)

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["triage_id"] == fake_id
    assert "plan" in body
    assert body["plan"]["summary"].startswith("You're a Senior engineer")
    assert len(body["plan"]["actions"]) >= 1
    assert body["plan"]["actions"][0]["priority"] == 1

    # Verify what was inserted.
    sb_mock.table.assert_called_with("triage_responses")
    insert_args = table_mock.insert.call_args[0][0]
    assert insert_args["answers"] == VALID_PAYLOAD
    assert insert_args["plan"]["actions"][0]["title"]
    assert insert_args["user_id"] is None  # anonymous


@pytest.mark.integration
def test_triage_post_rejects_missing_field(client):
    bad = dict(VALID_PAYLOAD)
    del bad["visa_status"]
    resp = client.post("/api/triage", json=bad)
    assert resp.status_code == 422


@pytest.mark.integration
def test_triage_post_returns_503_when_db_insert_fails(client):
    insert_mock = MagicMock()
    insert_mock.execute.side_effect = Exception("supabase down")
    table_mock = MagicMock()
    table_mock.insert.return_value = insert_mock
    sb_mock = MagicMock()
    sb_mock.table.return_value = table_mock

    with patch("api.core.database.supabase", sb_mock):
        resp = client.post("/api/triage", json=VALID_PAYLOAD)

    assert resp.status_code == 503
    assert "triage" in resp.json()["detail"].lower() or "unavailable" in resp.json()["detail"].lower()
