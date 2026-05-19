"""Unit tests for the hub-copy SEO AI service."""

import pytest

from api.services.seo_ai import parse_hub_slug, hub_label, generate_hub_copy


@pytest.mark.unit
def test_parse_hub_slug_shapes():
    assert parse_hub_slug("remote") == {"skill": None, "city": None, "remote": True}
    assert parse_hub_slug("react") == {"skill": "react", "city": None, "remote": False}
    assert parse_hub_slug("location/austin") == {"skill": None, "city": "austin", "remote": False}
    assert parse_hub_slug("react/remote") == {"skill": "react", "city": None, "remote": True}
    assert parse_hub_slug("react/location/austin") == {"skill": "react", "city": "austin", "remote": False}


@pytest.mark.unit
def test_parse_hub_slug_rejects_garbage():
    assert parse_hub_slug("") is None
    assert parse_hub_slug("a/b/c/d/e") is None
    assert parse_hub_slug("location") is None  # 'location' needs a city


@pytest.mark.unit
def test_hub_label_reads_naturally():
    assert hub_label({"skill": "react", "city": "austin", "remote": False}) == "React jobs in Austin"
    assert hub_label({"skill": "react", "city": None, "remote": True}) == "Remote React jobs"
    assert hub_label({"skill": None, "city": None, "remote": True}) == "Remote jobs"


@pytest.mark.unit
def test_generate_hub_copy_falls_back_without_llm(monkeypatch):
    # Force the LLM call to fail so the deterministic fallback is exercised.
    import api.services.seo_ai as mod
    monkeypatch.setattr(mod, "_call_llm", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("no key")))
    result = generate_hub_copy("react")
    assert isinstance(result["copy"], str) and len(result["copy"]) > 50
    assert isinstance(result["faq"], list) and len(result["faq"]) >= 1
    assert all("q" in item and "a" in item for item in result["faq"])


@pytest.mark.unit
def test_generate_hub_copy_uses_valid_llm_output(monkeypatch):
    import api.services.seo_ai as mod
    good = {
        "copy": "x" * 60,
        "faq": [{"q": "Real question?", "a": "Real answer."}],
    }
    monkeypatch.setattr(mod, "_call_llm", lambda *a, **k: "ignored-raw")
    monkeypatch.setattr(mod, "_parse_json_response", lambda raw: good)
    result = generate_hub_copy("react")
    assert result["copy"] == good["copy"]
    assert result["faq"] == good["faq"]


@pytest.mark.unit
def test_generate_hub_copy_rejects_weak_llm_output(monkeypatch):
    import api.services.seo_ai as mod
    weak = {"copy": "short", "faq": []}
    monkeypatch.setattr(mod, "_call_llm", lambda *a, **k: "ignored-raw")
    monkeypatch.setattr(mod, "_parse_json_response", lambda raw: weak)
    result = generate_hub_copy("react")
    # Weak output is discarded — the deterministic fallback is used instead.
    assert result["copy"] != "short"
    assert len(result["faq"]) >= 1
