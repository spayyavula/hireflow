"""Unit tests for hub_content database helpers."""

import pytest

from api.core.database import get_hub_content, create_hub_content


@pytest.mark.unit
def test_create_and_get_hub_content():
    create_hub_content({
        "slug": "react",
        "copy": "React jobs intro copy.",
        "faq_json": [{"q": "Q1", "a": "A1"}],
    })
    row = get_hub_content("react")
    assert row is not None
    assert row["copy"] == "React jobs intro copy."
    assert row["faq_json"] == [{"q": "Q1", "a": "A1"}]


@pytest.mark.unit
def test_get_missing_hub_content_returns_none():
    assert get_hub_content("does-not-exist") is None


@pytest.mark.unit
def test_faq_json_parsed_from_string():
    # Supabase may return jsonb as a string; the helper must normalize to a list.
    create_hub_content({"slug": "python", "copy": "c", "faq_json": '[{"q": "x", "a": "y"}]'})
    row = get_hub_content("python")
    assert row["faq_json"] == [{"q": "x", "a": "y"}]
