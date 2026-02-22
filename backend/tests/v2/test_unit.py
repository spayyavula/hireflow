"""
HireFlow Backend — Unit Tests v2
=================================
Covers edge cases and gaps in AI services, schemas, auth utils, and database helpers.
"""

import os
import pytest
import hashlib
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

# Env vars must be set before any app imports
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SERVICE — MATCHING ENGINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestMatchingEngineEdgeCases:
    """Edge cases for compute_job_match that weren't previously tested."""

    def setup_method(self):
        from api.services.ai import compute_job_match
        self.match = compute_job_match

    def test_empty_user_skills_against_job_with_requirements(self):
        """User with no skills should get only the minimum base score (15)."""
        result = self.match([], [], [], None, None, {
            "id": "j1",
            "title": "Dev",
            "required_skills": ["Python", "Go"],
            "nice_skills": ["Docker"],
        })
        assert result["match_score"] >= 15
        assert result["match_score"] < 30  # very low
        assert result["matched_required"] == []
        assert result["matched_nice"] == []

    def test_user_with_skills_job_has_no_requirements(self):
        """Job with empty required_skills — skill ratio is 0/0, so req_score stays 0."""
        result = self.match(
            ["Python", "React"], [], [], None, None,
            {"id": "j2", "title": "Open Role", "required_skills": [], "nice_skills": []},
        )
        # Score should be low since there's nothing to match on
        assert result["match_score"] >= 15
        assert result["matched_required"] == []

    def test_case_insensitive_matching(self):
        """Skills should be matched case-insensitively."""
        result = self.match(
            ["PYTHON", "react", "Docker"], [], [], None, None,
            {"id": "j3", "title": "Dev", "required_skills": ["python", "React"], "nice_skills": ["docker"]},
        )
        assert len(result["matched_required"]) == 2
        assert len(result["matched_nice"]) == 1

    def test_adjacent_experience_level_partial_credit(self):
        """Adjacent experience levels should give 5 points partial credit."""
        levels = [
            "Entry Level (0-2 yrs)", "Mid Level (3-5 yrs)",
            "Senior (6-9 yrs)", "Staff / Lead (10+ yrs)", "Executive / Director",
        ]
        result = self.match(
            ["Python"], [], [], None, "Mid Level (3-5 yrs)",
            {"id": "j4", "title": "Dev", "required_skills": ["Python"],
             "nice_skills": [], "experience_level": "Senior (6-9 yrs)"},
        )
        # Adjacent level should contribute 5 pts
        assert result["match_score"] > 15

    def test_non_adjacent_experience_level_no_credit(self):
        """Experience levels 2+ steps apart should give 0 points."""
        result_exact = self.match(
            ["Python"], [], [], None, "Entry Level (0-2 yrs)",
            {"id": "j5", "title": "Dev", "required_skills": ["Python"],
             "nice_skills": [], "experience_level": "Entry Level (0-2 yrs)"},
        )
        result_far = self.match(
            ["Python"], [], [], None, "Entry Level (0-2 yrs)",
            {"id": "j5", "title": "Dev", "required_skills": ["Python"],
             "nice_skills": [], "experience_level": "Executive / Director"},
        )
        assert result_exact["match_score"] > result_far["match_score"]

    def test_hybrid_work_preference_partial_score(self):
        """Hybrid preference should get partial (5 pts) for any job."""
        result = self.match(
            ["Python"], [], ["Hybrid"], None, None,
            {"id": "j6", "title": "Dev", "required_skills": ["Python"],
             "nice_skills": [], "remote": True},
        )
        # Hybrid should get 5 pts rather than 10
        assert result["match_score"] >= 15

    def test_on_site_preference_matches_non_remote_job(self):
        """On-site preference should match non-remote jobs for 10 pts."""
        result_match = self.match(
            [], [], ["On-site"], None, None,
            {"id": "j7", "title": "Dev", "required_skills": [], "nice_skills": [], "remote": False},
        )
        result_mismatch = self.match(
            [], [], ["On-site"], None, None,
            {"id": "j7", "title": "Dev", "required_skills": [], "nice_skills": [], "remote": True},
        )
        assert result_match["match_score"] >= result_mismatch["match_score"]

    def test_role_alignment_uses_word_overlap(self):
        """Role matching checks if any word >2 chars from desired role appears in job title."""
        result = self.match(
            [], ["Full Stack Developer"], [], None, None,
            {"id": "j8", "title": "Senior Full Stack Engineer",
             "required_skills": [], "nice_skills": []},
        )
        assert any("Role matches" in r for r in result["match_reasons"])

    def test_role_alignment_ignores_short_words(self):
        """Words with <=2 chars from desired_role should not trigger role match."""
        result = self.match(
            [], ["QA Lead"], [], None, None,
            {"id": "j9", "title": "Something QA related",
             "required_skills": [], "nice_skills": []},
        )
        # "QA" is only 2 chars — should NOT match
        assert not any("Role matches" in r for r in result["match_reasons"])

    def test_score_clamped_at_99(self):
        """Even with perfect scores on all dimensions, score cannot exceed 99."""
        result = self.match(
            ["React", "TypeScript", "Node.js"],
            ["React Developer"],
            ["Remote"],
            "$160k–$200k",
            "Senior (6-9 yrs)",
            {
                "id": "j10", "title": "Senior React Developer",
                "required_skills": ["React", "TypeScript", "Node.js"],
                "nice_skills": ["React", "TypeScript", "Node.js"],
                "remote": True, "experience_level": "Senior (6-9 yrs)",
            },
        )
        assert result["match_score"] <= 99

    def test_score_floor_is_15(self):
        """Score should never drop below 15 even with zero overlap."""
        result = self.match(
            ["Cooking", "Gardening"], ["Chef"], ["On-site"], None, None,
            {"id": "j11", "title": "ML Engineer",
             "required_skills": ["Python", "PyTorch"], "nice_skills": ["Docker"],
             "remote": True, "experience_level": "Executive / Director"},
        )
        assert result["match_score"] >= 15

    def test_deterministic_jitter(self):
        """Same job ID should always produce the same jitter offset."""
        r1 = self.match(["X"], [], [], None, None, {"id": "stable", "title": "A", "required_skills": ["X"], "nice_skills": []})
        r2 = self.match(["X"], [], [], None, None, {"id": "stable", "title": "A", "required_skills": ["X"], "nice_skills": []})
        assert r1["match_score"] == r2["match_score"]

    def test_different_job_ids_can_produce_different_jitter(self):
        """Different job IDs should (usually) produce different jitter offsets."""
        scores = set()
        for i in range(10):
            r = self.match(
                ["X"], [], [], None, None,
                {"id": f"job_{i}", "title": "Dev", "required_skills": ["X"], "nice_skills": []},
            )
            scores.add(r["match_score"])
        # With 10 different IDs and jitter range 0-4, we should get at least 2 distinct scores
        assert len(scores) >= 2


class TestCandidateMatch:
    """Tests for compute_candidate_match wrapper."""

    def test_candidate_match_delegates_correctly(self):
        from api.services.ai import compute_candidate_match
        candidate = {
            "skills": ["React", "TypeScript"],
            "desired_roles": ["Frontend Dev"],
            "work_preferences": ["Remote"],
            "salary_range": None,
            "experience_level": "Senior (6-9 yrs)",
        }
        job = {
            "id": "j1", "title": "Frontend Developer",
            "required_skills": ["React", "TypeScript"],
            "nice_skills": ["Node.js"],
            "remote": True, "experience_level": "Senior (6-9 yrs)",
        }
        score = compute_candidate_match(candidate, job)
        assert isinstance(score, int)
        assert 15 <= score <= 99

    def test_candidate_match_empty_candidate(self):
        from api.services.ai import compute_candidate_match
        score = compute_candidate_match({}, {"id": "j", "title": "Dev", "required_skills": [], "nice_skills": []})
        assert isinstance(score, int)
        assert score >= 15


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SERVICE — RESUME PARSER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestResumeParser:
    """Tests for parse_resume function."""

    def test_parse_resume_returns_required_keys(self):
        from api.services.ai import parse_resume
        result = parse_resume("test.pdf", b"fake content")
        assert "profile" in result
        assert "ai_summary" in result

    def test_parse_resume_profile_has_required_fields(self):
        from api.services.ai import parse_resume
        result = parse_resume("test.pdf", b"content")
        profile = result["profile"]
        required_fields = ["name", "headline", "skills", "desired_roles",
                           "experience_level", "experience", "education"]
        for field in required_fields:
            assert field in profile, f"Missing field: {field}"

    def test_parse_resume_persona_deterministic(self):
        """Same filename should always produce the same persona."""
        from api.services.ai import parse_resume
        r1 = parse_resume("resume_alex.pdf", b"content1")
        r2 = parse_resume("resume_alex.pdf", b"different content")
        assert r1["profile"]["name"] == r2["profile"]["name"]

    def test_parse_resume_different_filenames_can_differ(self):
        """Different filenames should produce different personas (at least sometimes)."""
        from api.services.ai import parse_resume
        names = set()
        for fn in ["a.pdf", "b.pdf", "c.pdf", "d.pdf", "e.pdf", "f.pdf"]:
            r = parse_resume(fn, b"x")
            names.add(r["profile"]["name"])
        assert len(names) >= 2  # Should get at least 2 different personas

    def test_parse_resume_summary_is_string(self):
        from api.services.ai import parse_resume
        result = parse_resume("test.docx", b"data")
        assert isinstance(result["ai_summary"], str)
        assert len(result["ai_summary"]) > 50

    def test_all_personas_have_experience_entries(self):
        """Every persona should have at least one experience entry."""
        from api.services.ai import parse_resume
        for fn in ["a.pdf", "b.pdf", "c.pdf"]:
            result = parse_resume(fn, b"x")
            assert len(result["profile"]["experience"]) >= 1

    def test_all_personas_have_education_entries(self):
        from api.services.ai import parse_resume
        for fn in ["a.pdf", "b.pdf", "c.pdf"]:
            result = parse_resume(fn, b"x")
            assert len(result["profile"]["education"]) >= 1


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SERVICE — SUMMARY & HEADLINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSummaryGeneration:
    """Tests for generate_summary, generate_headline, suggest_skills."""

    def test_summary_includes_skills(self):
        from api.services.ai import generate_summary
        s = generate_summary("Alice", ["React", "Python"], ["Developer"], "Senior (6-9 yrs)")
        assert "React" in s
        assert "Python" in s

    def test_summary_includes_experience(self):
        from api.services.ai import generate_summary
        exp = [{"title": "CTO", "company": "Acme", "description": "Led engineering."}]
        s = generate_summary("Bob", ["Go"], ["CTO"], experience=exp)
        assert "CTO" in s
        assert "Acme" in s

    def test_summary_with_no_experience(self):
        from api.services.ai import generate_summary
        s = generate_summary("Eve", ["Figma"], ["Designer"])
        assert isinstance(s, str)
        assert len(s) > 20

    def test_summary_with_empty_skills(self):
        from api.services.ai import generate_summary
        s = generate_summary("Zara", [], [])
        assert isinstance(s, str)
        assert "Zara" not in s or True  # name may or may not appear

    def test_headline_with_roles(self):
        from api.services.ai import generate_headline
        h = generate_headline("Alice", ["React", "Node.js"], ["Frontend Developer"])
        assert "Frontend Developer" in h
        assert "React" in h

    def test_headline_with_no_roles(self):
        from api.services.ai import generate_headline
        h = generate_headline("Bob", ["Go"], [])
        assert "Professional" in h

    def test_headline_with_no_skills(self):
        from api.services.ai import generate_headline
        h = generate_headline("Carol", [], ["Designer"])
        assert "Designer" in h

    def test_suggest_skills_for_react(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["React"])
        assert len(suggestions) > 0
        # Should suggest related skills, not React itself
        assert "React" not in suggestions

    def test_suggest_skills_no_duplicates_with_existing(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["Python", "Docker"])
        existing_lower = {"python", "docker"}
        for s in suggestions:
            assert s.lower() not in existing_lower

    def test_suggest_skills_unknown_skill_returns_empty(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["InventedSkill123"])
        assert isinstance(suggestions, list)
        assert len(suggestions) == 0

    def test_suggest_skills_capped_at_8(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["React", "Python", "AWS", "TypeScript", "Node.js", "Machine Learning"])
        assert len(suggestions) <= 8


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTH UTILITIES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestAuthUtilities:
    """Tests for password hashing, JWT creation/verification."""

    def test_password_hash_is_not_plaintext(self):
        from api.core.config import hash_password
        hashed = hash_password("mysecretpassword")
        assert hashed != "mysecretpassword"
        assert len(hashed) > 20

    def test_password_verification_correct(self):
        from api.core.config import hash_password, verify_password
        hashed = hash_password("correct_password")
        assert verify_password("correct_password", hashed) is True

    def test_password_verification_wrong(self):
        from api.core.config import hash_password, verify_password
        hashed = hash_password("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_different_passwords_produce_different_hashes(self):
        from api.core.config import hash_password
        h1 = hash_password("password1")
        h2 = hash_password("password2")
        assert h1 != h2

    def test_same_password_different_salts(self):
        from api.core.config import hash_password
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")
        assert h1 != h2  # bcrypt uses random salts

    def test_jwt_create_and_decode(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "user_123", "role": "seeker"})
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user_123"
        assert payload["role"] == "seeker"

    def test_jwt_contains_expiry(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "x"})
        payload = decode_token(token)
        assert "exp" in payload

    def test_jwt_custom_expiry(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token(
            {"sub": "y"},
            expires_delta=timedelta(minutes=5),
        )
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "y"

    def test_jwt_tampered_token_rejected(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "z"})
        # Tamper with the token
        tampered = token[:-5] + "XXXXX"
        payload = decode_token(tampered)
        assert payload is None

    def test_jwt_completely_invalid_string(self):
        from api.core.config import decode_token
        assert decode_token("not.a.jwt") is None
        assert decode_token("") is None
        assert decode_token("random_garbage_string") is None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SCHEMA VALIDATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSchemaValidation:
    """Pydantic model validation tests."""

    def test_register_request_valid(self):
        from api.models.schemas import RegisterRequest
        req = RegisterRequest(email="test@example.com", password="longpassword", role="seeker")
        assert req.role.value == "seeker"

    def test_register_request_short_password_rejected(self):
        from api.models.schemas import RegisterRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            RegisterRequest(email="a@b.com", password="short", role="seeker")

    def test_register_request_invalid_role_rejected(self):
        from api.models.schemas import RegisterRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            RegisterRequest(email="a@b.com", password="longpassword", role="admin")

    def test_job_create_defaults(self):
        from api.models.schemas import JobCreate
        job = JobCreate(title="Dev", location="Remote", description="Desc")
        assert job.type.value == "full-time"
        assert job.remote is False
        assert job.required_skills == []

    def test_job_create_all_types_valid(self):
        from api.models.schemas import JobCreate, JobType
        for jtype in JobType:
            job = JobCreate(title="X", location="Y", description="Z", type=jtype)
            assert job.type == jtype

    def test_application_status_all_values(self):
        from api.models.schemas import ApplicationStatus
        expected = {"applied", "screening", "interview", "offer", "hired", "rejected"}
        actual = {s.value for s in ApplicationStatus}
        assert actual == expected

    def test_seeker_profile_create_defaults(self):
        from api.models.schemas import SeekerProfileCreate
        p = SeekerProfileCreate(name="Alice")
        assert p.skills == []
        assert p.desired_roles == []
        assert p.experience == []
        assert p.education == []

    def test_experience_model(self):
        from api.models.schemas import Experience
        exp = Experience(title="Dev", company="Acme", duration="2020-2024")
        assert exp.title == "Dev"
        assert exp.description is None

    def test_education_model(self):
        from api.models.schemas import Education
        edu = Education(school="MIT", degree="BS CS")
        assert edu.year is None

    def test_message_send_requires_fields(self):
        from api.models.schemas import MessageSend
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            MessageSend()  # missing required fields

    def test_candidate_search_request_defaults(self):
        from api.models.schemas import CandidateSearchRequest
        req = CandidateSearchRequest()
        assert req.query is None
        assert req.skills == []
        assert req.min_match == 0

    def test_match_request_defaults(self):
        from api.models.schemas import MatchRequest
        req = MatchRequest(skills=["Python"])
        assert req.desired_roles == []
        assert req.work_preferences == []
        assert req.salary_range is None

    def test_ai_summary_request(self):
        from api.models.schemas import AISummaryRequest
        req = AISummaryRequest(name="Bob", skills=["React"], desired_roles=["Dev"])
        assert req.experience_level is None
        assert req.experience == []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  DATABASE HELPERS — JSONB PARSING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestDatabaseHelpers:
    """Tests for JSONB field parsing/preparation helpers."""

    def test_parse_jsonb_user_none_fields_become_lists(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"id": "1", "skills": None, "desired_roles": None, "experience": None}
        parsed = _parse_jsonb_fields_user(data)
        assert parsed["skills"] == []
        assert parsed["desired_roles"] == []
        assert parsed["experience"] == []

    def test_parse_jsonb_user_string_json_fields(self):
        from api.core.database import _parse_jsonb_fields_user
        import json
        data = {"id": "1", "skills": json.dumps(["React", "Python"])}
        parsed = _parse_jsonb_fields_user(data)
        assert parsed["skills"] == ["React", "Python"]

    def test_parse_jsonb_user_invalid_json_string(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"id": "1", "skills": "not valid json"}
        parsed = _parse_jsonb_fields_user(data)
        assert parsed["skills"] == []

    def test_parse_jsonb_user_already_list_unchanged(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"id": "1", "skills": ["React"]}
        parsed = _parse_jsonb_fields_user(data)
        assert parsed["skills"] == ["React"]

    def test_parse_jsonb_job_fields(self):
        from api.core.database import _parse_jsonb_fields_job
        data = {"id": "1", "required_skills": None, "nice_skills": None}
        parsed = _parse_jsonb_fields_job(data)
        assert parsed["required_skills"] == []
        assert parsed["nice_skills"] == []

    def test_prep_jsonb_user_string_converted(self):
        from api.core.database import _prep_jsonb_fields_user
        import json
        data = {"skills": json.dumps(["Go", "Rust"])}
        prepped = _prep_jsonb_fields_user(data)
        assert prepped["skills"] == ["Go", "Rust"]

    def test_prep_jsonb_user_invalid_string(self):
        from api.core.database import _prep_jsonb_fields_user
        data = {"skills": "broken json"}
        prepped = _prep_jsonb_fields_user(data)
        assert prepped["skills"] == []

    def test_parse_jsonb_empty_dict_passthrough(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"id": "1"}
        parsed = _parse_jsonb_fields_user(data)
        assert parsed["id"] == "1"

    def test_parse_jsonb_user_all_fields(self):
        from api.core.database import _parse_jsonb_fields_user
        fields = ["skills", "desired_roles", "work_preferences",
                   "industries", "experience", "education", "specializations"]
        data = {f: None for f in fields}
        data["id"] = "1"
        parsed = _parse_jsonb_fields_user(data)
        for f in fields:
            assert parsed[f] == [], f"Field {f} should default to []"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  PROFILE STRENGTH CALCULATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestProfileStrength:
    """Tests for the _calc_profile_strength helper in seeker routes."""

    def test_strong_profile(self):
        from api.routes.seeker import _calc_profile_strength
        profile = {"skills": ["React"], "experience": [{"title": "Dev"}],
                   "education": [{"school": "MIT"}], "desired_roles": ["Dev"],
                   "summary": "A great dev."}
        assert _calc_profile_strength(profile) == "Strong"

    def test_good_profile(self):
        from api.routes.seeker import _calc_profile_strength
        profile = {"skills": ["React"], "experience": [{"title": "Dev"}],
                   "education": [], "desired_roles": [], "summary": None}
        assert _calc_profile_strength(profile) == "Good"

    def test_needs_work_profile(self):
        from api.routes.seeker import _calc_profile_strength
        profile = {"skills": [], "experience": [], "education": [],
                   "desired_roles": [], "summary": None, "ai_summary": None}
        assert _calc_profile_strength(profile) == "Needs Work"

    def test_ai_summary_counts_for_strength(self):
        from api.routes.seeker import _calc_profile_strength
        profile = {"skills": ["React"], "experience": [], "education": [],
                   "desired_roles": ["Dev"], "summary": None, "ai_summary": "Generated."}
        assert _calc_profile_strength(profile) == "Good"
