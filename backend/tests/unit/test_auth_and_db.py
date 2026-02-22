"""
Additional unit tests for auth utilities and AI service edge cases.
Pure unit tests — no external dependencies.
"""

import pytest
from api.core.config import (
    hash_password, verify_password,
    create_access_token, decode_token,
)
from api.services.ai import (
    compute_job_match, compute_candidate_match,
    parse_resume, generate_summary, generate_headline, suggest_skills,
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Password Hashing - Extended
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestPasswordSecurity:
    def test_hash_differs_from_plaintext(self):
        assert hash_password("secret") != "secret"

    def test_verify_correct(self):
        assert verify_password("mypass", hash_password("mypass")) is True

    def test_verify_wrong(self):
        assert verify_password("wrong", hash_password("correct")) is False

    def test_unique_salts(self):
        a, b = hash_password("same"), hash_password("same")
        assert a != b
        assert verify_password("same", a) and verify_password("same", b)

    def test_empty_password(self):
        h = hash_password("")
        assert verify_password("", h) is True
        assert verify_password("x", h) is False

    def test_unicode_password(self):
        h = hash_password("пароль🔐")
        assert verify_password("пароль🔐", h) is True
        assert verify_password("пароль", h) is False

    def test_long_password(self):
        assert verify_password("a" * 200, hash_password("a" * 200)) is True


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JWT Tokens - Extended
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestJWTTokens:
    def test_roundtrip(self):
        d = decode_token(create_access_token({"sub": "u1", "role": "seeker"}))
        assert d["sub"] == "u1" and d["role"] == "seeker" and "exp" in d

    def test_invalid_token(self):
        assert decode_token("not.a.token") is None

    def test_empty_string(self):
        assert decode_token("") is None

    def test_tampered_signature(self):
        t = create_access_token({"sub": "x"})
        assert decode_token(t[:-4] + "ZZZZ") is None

    def test_multiple_claims_preserved(self):
        d = decode_token(create_access_token({"sub": "u1", "role": "company", "x": 42}))
        assert d["x"] == 42


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI Matching Engine - Extended Edge Cases
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JOB = {
    "id": "j1", "title": "Senior React Developer",
    "required_skills": ["React", "TypeScript", "JavaScript"],
    "nice_skills": ["Next.js", "Redux"],
    "remote": True, "experience_level": "Senior (6-9 yrs)",
}

class TestMatchEdgeCases:
    def test_all_empty_inputs(self):
        r = compute_job_match([], [], [], None, None, JOB)
        assert 15 <= r["match_score"] <= 99
        assert r["matched_required"] == []

    def test_superset_of_skills(self):
        r = compute_job_match(
            ["React", "TypeScript", "JavaScript", "Go", "Rust"],
            [], [], None, None, JOB,
        )
        assert len(r["matched_required"]) == 3

    def test_special_chars_in_skills(self):
        job = {"id": "j2", "title": "Dev", "required_skills": ["C#", ".NET"],
               "nice_skills": [], "remote": False}
        r = compute_job_match(["C#", ".NET"], [], [], None, None, job)
        assert len(r["matched_required"]) == 2

    def test_candidate_match_returns_int(self):
        s = compute_candidate_match({"skills": ["React"]}, JOB)
        assert isinstance(s, int) and 15 <= s <= 99


class TestParseResumeEdges:
    def test_pdf(self):
        assert "profile" in parse_resume("test.pdf", b"data")

    def test_docx(self):
        assert "profile" in parse_resume("test.docx", b"data")

    def test_txt(self):
        assert "profile" in parse_resume("test.txt", b"data")


class TestSummaryEdges:
    def test_only_name(self):
        assert len(generate_summary("Jane", [], [])) > 10

    def test_many_skills(self):
        assert isinstance(generate_summary("Jane", ["React", "Vue", "Angular", "Svelte", "Next.js"], ["Dev"]), str)

    def test_headline_both_empty(self):
        assert generate_headline("Jane", [], []) == "Professional"

    def test_suggest_from_known(self):
        s = suggest_skills(["Python"])
        assert len(s) > 0 and "Python" not in s
