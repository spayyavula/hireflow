"""Integration tests for the SEO hub-content endpoint."""

import pytest


class TestHubContentEndpoint:

    @pytest.mark.integration
    def test_hub_endpoint_returns_copy_and_faq(self, client):
        resp = client.get("/api/seo/hub/react")
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body["copy"], str) and len(body["copy"]) > 50
        assert isinstance(body["faq"], list) and len(body["faq"]) >= 1
        assert body["slug"] == "react"

    @pytest.mark.integration
    def test_hub_endpoint_caches_after_first_call(self, client, mock_supabase):
        client.get("/api/seo/hub/python")
        rows = list(mock_supabase.store.get("hub_content", {}).values())
        assert any(r["slug"] == "python" for r in rows)

    @pytest.mark.integration
    def test_multi_segment_slug(self, client):
        resp = client.get("/api/seo/hub/react/location/austin")
        assert resp.status_code == 200
        assert resp.json()["slug"] == "react/location/austin"

    @pytest.mark.integration
    def test_invalid_slug_returns_400(self, client):
        resp = client.get("/api/seo/hub/a/b/c/d/e")
        assert resp.status_code == 400
