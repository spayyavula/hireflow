"""
Integration tests for /api/chat endpoints.
"""

import pytest
from tests.conftest import register_user, auth_header


class TestMessaging:

    @pytest.mark.integration
    def test_send_message(self, seeded_client):
        token, _ = register_user(seeded_client, email="sender@test.com", role="seeker", name="Sender")
        resp = seeded_client.post("/api/chat/messages", json={
            "recipient_id": "rec_1", "content": "Hello recruiter!",
        }, headers=auth_header(token))
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Hello recruiter!"
        assert data["conversation_id"]
        assert data["read"] is False

    @pytest.mark.integration
    def test_send_to_nonexistent_recipient(self, client):
        token, _ = register_user(client, email="alone@test.com")
        resp = client.post("/api/chat/messages", json={
            "recipient_id": "ghost_user", "content": "Hello?",
        }, headers=auth_header(token))
        assert resp.status_code == 404

    @pytest.mark.integration
    def test_conversation_reuse(self, seeded_client):
        token, _ = register_user(seeded_client, email="reuse@test.com", role="seeker", name="Reuser")
        r1 = seeded_client.post("/api/chat/messages", json={
            "recipient_id": "rec_1", "content": "First message",
        }, headers=auth_header(token))
        r2 = seeded_client.post("/api/chat/messages", json={
            "recipient_id": "rec_1", "content": "Second message",
        }, headers=auth_header(token))
        assert r1.json()["conversation_id"] == r2.json()["conversation_id"]


class TestConversations:

    @pytest.mark.integration
    def test_list_conversations(self, seeded_client):
        token, _ = register_user(seeded_client, email="conv@test.com", role="seeker", name="Conv User")
        seeded_client.post("/api/chat/messages", json={
            "recipient_id": "rec_1", "content": "Hey!",
        }, headers=auth_header(token))

        resp = seeded_client.get("/api/chat/conversations", headers=auth_header(token))
        assert resp.status_code == 200
        convs = resp.json()
        assert len(convs) == 1
        assert convs[0]["last_message"] == "Hey!"
        assert "rec_1" in convs[0]["participants"]

    @pytest.mark.integration
    def test_empty_conversations(self, client):
        token, _ = register_user(client, email="empty@test.com")
        resp = client.get("/api/chat/conversations", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.integration
    def test_get_messages_in_conversation(self, seeded_client):
        token, _ = register_user(seeded_client, email="msgs@test.com", role="seeker", name="Msg User")
        r = seeded_client.post("/api/chat/messages", json={
            "recipient_id": "rec_1", "content": "Message 1",
        }, headers=auth_header(token))
        conv_id = r.json()["conversation_id"]

        seeded_client.post("/api/chat/messages", json={
            "recipient_id": "rec_1", "content": "Message 2",
        }, headers=auth_header(token))

        resp = seeded_client.get(f"/api/chat/conversations/{conv_id}/messages", headers=auth_header(token))
        assert resp.status_code == 200
        msgs = resp.json()
        assert len(msgs) == 2
        assert msgs[0]["content"] == "Message 1"
        assert msgs[1]["content"] == "Message 2"

    @pytest.mark.integration
    def test_cannot_read_others_conversation(self, seeded_client):
        # User A sends a message
        token_a, _ = register_user(seeded_client, email="a@test.com", role="seeker", name="A")
        r = seeded_client.post("/api/chat/messages", json={
            "recipient_id": "rec_1", "content": "Private!",
        }, headers=auth_header(token_a))
        conv_id = r.json()["conversation_id"]

        # User B tries to read it
        token_b, _ = register_user(seeded_client, email="b@test.com", role="seeker", name="B")
        resp = seeded_client.get(f"/api/chat/conversations/{conv_id}/messages", headers=auth_header(token_b))
        assert resp.status_code == 403
