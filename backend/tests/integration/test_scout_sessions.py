from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from api.index import app


client = TestClient(app)


TRIAGE_ROW = {
    'id': 'triage-uuid-1',
    'answers': {
        'laid_off_when': '1-7d', 'role': 'engineer', 'level': 'senior',
        'company_tier': 'series_b_d', 'severance_runway': '8_16w',
        'visa_status': 'h1b', 'location_flexibility': 'remote_us',
        'resume_state': 'needs_rewrite', 'network_state': 'cold_contacts',
        'top_concern': 'visa',
    },
    'plan': {
        'summary': "You're a Senior engineer...",
        'suggested_first_topic': 'visa',
        'actions': [{'priority': 1, 'title': 'H-1B 60-day grace period — start the clock today',
                     'why': '...', 'how': '...', 'eta': 'this week'}],
    },
}


@pytest.fixture
def patched_supabase():
    """Patches api.core.database.supabase with a chainable mock."""
    with patch('api.core.database.supabase') as sb:
        yield sb


@pytest.mark.integration
def test_create_session_with_triage_id_returns_first_scout_message(patched_supabase):
    # Mock: triage lookup
    triage_select = MagicMock()
    triage_select.execute.return_value = MagicMock(data=[TRIAGE_ROW])
    triage_eq = MagicMock()
    triage_eq.eq.return_value = triage_select
    triage_table = MagicMock()
    triage_table.select.return_value = triage_eq

    # Mock: session insert
    session_insert = MagicMock()
    session_insert.execute.return_value = MagicMock(data=[{'id': 'session-uuid-1'}])
    session_table = MagicMock()
    session_table.insert.return_value = session_insert

    patched_supabase.table.side_effect = lambda name: (
        triage_table if name == 'triage_responses' else session_table
    )

    resp = client.post('/api/scout/sessions', json={'triage_id': 'triage-uuid-1'})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body['session_id'] == 'session-uuid-1'
    assert len(body['messages']) == 1
    assert body['messages'][0]['role'] == 'scout'
    # Topic was 'visa' -> message mentions H-1B
    assert 'h-1b' in body['messages'][0]['content'].lower() or 'h1b' in body['messages'][0]['content'].lower()


@pytest.mark.integration
def test_create_session_without_triage_returns_generic_opening(patched_supabase):
    session_insert = MagicMock()
    session_insert.execute.return_value = MagicMock(data=[{'id': 'session-uuid-2'}])
    session_table = MagicMock()
    session_table.insert.return_value = session_insert

    patched_supabase.table.return_value = session_table

    resp = client.post('/api/scout/sessions', json={})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body['session_id'] == 'session-uuid-2'
    assert len(body['messages']) == 1
    assert body['messages'][0]['role'] == 'scout'
    # Generic greeting -> mentions multiple topics
    content_lower = body['messages'][0]['content'].lower()
    assert sum(t in content_lower for t in ['visa', 'severance', 'financ', 'resume', 'direction']) >= 3


@pytest.mark.integration
def test_create_session_with_suggested_first_topic_no_triage_uses_topic(patched_supabase):
    """Topic-keyed session without a triage (e.g. /laid-off-h1b landing page)."""
    session_insert = MagicMock()
    session_insert.execute.return_value = MagicMock(data=[{'id': 'session-uuid-3'}])
    session_table = MagicMock()
    session_table.insert.return_value = session_insert

    patched_supabase.table.return_value = session_table

    resp = client.post(
        '/api/scout/sessions',
        json={'suggested_first_topic': 'visa'},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body['session_id'] == 'session-uuid-3'
    assert len(body['messages']) == 1
    assert body['messages'][0]['role'] == 'scout'
    # Topic 'visa' -> opening mentions H-1B
    content_lower = body['messages'][0]['content'].lower()
    assert 'h-1b' in content_lower or 'h1b' in content_lower


@pytest.mark.integration
def test_create_session_returns_503_when_triage_lookup_fails(patched_supabase):
    triage_table = MagicMock()
    triage_table.select.side_effect = Exception('supabase down')
    patched_supabase.table.return_value = triage_table

    resp = client.post('/api/scout/sessions', json={'triage_id': 'triage-uuid-1'})
    assert resp.status_code == 503


@pytest.mark.integration
def test_append_message_returns_full_conversation(patched_supabase):
    existing = {
        'id': 'session-uuid-1',
        'triage_id': 'triage-uuid-1',
        'messages': [
            {'role': 'scout', 'content': 'Hey, sorry you\'re dealing with this...', 'ts': 't1'},
        ],
    }

    # Mock: session select
    sess_select = MagicMock()
    sess_select.execute.return_value = MagicMock(data=[existing])
    sess_eq = MagicMock()
    sess_eq.eq.return_value = sess_select
    sess_table = MagicMock()
    sess_table.select.return_value = sess_eq

    # Mock: triage select (for profile context on follow-ups)
    triage_select = MagicMock()
    triage_select.execute.return_value = MagicMock(data=[TRIAGE_ROW])
    triage_eq = MagicMock()
    triage_eq.eq.return_value = triage_select
    triage_table_mock = MagicMock()
    triage_table_mock.select.return_value = triage_eq

    # Mock: session update
    upd_eq = MagicMock()
    upd_eq.execute.return_value = MagicMock(data=[{'id': 'session-uuid-1'}])
    upd = MagicMock()
    upd.eq.return_value = upd_eq
    sess_table.update.return_value = upd

    def _table(name):
        if name == 'scout_sessions':
            return sess_table
        if name == 'triage_responses':
            return triage_table_mock
        return MagicMock()

    patched_supabase.table.side_effect = _table

    resp = client.post(
        '/api/scout/sessions/session-uuid-1/messages',
        json={'content': 'what about severance negotiation'},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert len(body['messages']) == 3  # original scout + new user + new scout
    assert body['messages'][0]['role'] == 'scout'
    assert body['messages'][1]['role'] == 'user'
    assert body['messages'][1]['content'] == 'what about severance negotiation'
    assert body['messages'][2]['role'] == 'scout'
    # Severance keyword -> severance handler
    assert 'severance' in body['messages'][2]['content'].lower()


@pytest.mark.integration
def test_append_message_returns_404_for_unknown_session(patched_supabase):
    sess_select = MagicMock()
    sess_select.execute.return_value = MagicMock(data=[])
    sess_eq = MagicMock()
    sess_eq.eq.return_value = sess_select
    sess_table = MagicMock()
    sess_table.select.return_value = sess_eq

    patched_supabase.table.return_value = sess_table

    resp = client.post(
        '/api/scout/sessions/missing-session/messages',
        json={'content': 'hello'},
    )
    assert resp.status_code == 404
