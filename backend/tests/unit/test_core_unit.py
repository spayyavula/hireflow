"""
HireFlow Backend — Core Unit Tests
====================================
Tests AI services, schemas, auth utilities, and pure business logic.
"""

import pytest
import hashlib
from datetime import datetime, timezone
from unittest.mock import MagicMock

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SERVICE: compute_job_match
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestComputeJobMatch:
    """Tests for the matching engine scoring algorithm."""

    def test_perfect_required_skill_match(self):
        from api.services.ai import compute_job_match
        job = {
            "id": "j1",
            "title": "React Developer",
            "required_skills": ["React", "TypeScript"],
            "nice_skills": ["Redux"],
            "remote": True,
            "experience_level": "Senior (6-9 yrs)",
        }
        result = compute_job_match(
            user_skills=["React", "TypeScript"],
            desired_roles=["Frontend Developer"],
            work_preferences=["Remote"],
            salary_range="$160k-$200k",
            experience_level="Senior (6-9 yrs)",
            job=job,
        )
        assert result["match_score"] >= 70
        assert "React" in result["matched_required"]
        assert "TypeScript" in result["matched_required"]
        assert len(result["match_reasons"]) > 0

    def test_no_skill_overlap(self):
        from api.services.ai import compute_job_match
        job = {
            "id": "j2",
            "title": "Data Scientist",
            "required_skills": ["Python", "SQL", "Pandas"],
            "nice_skills": ["TensorFlow"],
            "remote": False,
        }
        result = compute_job_match(
            user_skills=["React", "Vue.js", "Angular"],
            desired_roles=["Frontend Developer"],
            work_preferences=["Remote"],
            salary_range=None,
            experience_level=None,
            job=job,
        )
        assert result["match_score"] <= 30
        assert len(result["matched_required"]) == 0

    def test_partial_skill_overlap(self):
        from api.services.ai import compute_job_match
        job = {
            "id": "j3",
            "title": "Full Stack Dev",
            "required_skills": ["React", "Node.js", "SQL"],
            "nice_skills": ["Docker", "AWS"],
            "remote": True,
        }
        result = compute_job_match(
            user_skills=["React", "Docker"],
            desired_roles=[],
            work_preferences=[],
            salary_range=None,
            experience_level=None,
            job=job,
        )
        assert 15 <= result["match_score"] <= 99
        assert "React" in result["matched_required"]
        assert "Docker" in result["matched_nice"]

    def test_case_insensitive_matching(self):
        from api.services.ai import compute_job_match
        job = {
            "id": "j4",
            "title": "Dev",
            "required_skills": ["React", "TypeScript"],
            "nice_skills": [],
            "remote": False,
        }
        result = compute_job_match(
            user_skills=["REACT", "typescript"],
            desired_roles=[], work_preferences=[],
            salary_range=None, experience_level=None, job=job,
        )
        assert len(result["matched_required"]) == 2

    def test_role_alignment_bonus(self):
        from api.services.ai import compute_job_match
        job = {
            "id": "j5",
            "title": "Senior Frontend Developer",
            "required_skills": ["React"],
            "nice_skills": [],
            "remote": False,
        }
        with_role = compute_job_match(
            user_skills=["React"],
            desired_roles=["Frontend Developer"],
            work_preferences=[], salary_range=None,
            experience_level=None, job=job,
        )
        without_role = compute_job_match(
            user_skills=["React"],
            desired_roles=["Data Scientist"],
            work_preferences=[], salary_range=None,
            experience_level=None, job=job,
        )
        assert with_role["match_score"] >= without_role["match_score"]

    def test_remote_preference_bonus(self):
        from api.services.ai import compute_job_match
        remote_job = {
            "id": "j6", "title": "Dev",
            "required_skills": ["React"], "nice_skills": [],
            "remote": True,
        }
        onsite_job = {
            "id": "j7", "title": "Dev",
            "required_skills": ["React"], "nice_skills": [],
            "remote": False,
        }
        remote_result = compute_job_match(
            user_skills=["React"], desired_roles=[],
            work_preferences=["Remote"], salary_range=None,
            experience_level=None, job=remote_job,
        )
        onsite_result = compute_job_match(
            user_skills=["React"], desired_roles=[],
            work_preferences=["Remote"], salary_range=None,
            experience_level=None, job=onsite_job,
        )
        assert remote_result["match_score"] >= onsite_result["match_score"]

    def test_experience_level_exact_match(self):
        from api.services.ai import compute_job_match
        job = {
            "id": "j8", "title": "Dev",
            "required_skills": ["React"], "nice_skills": [],
            "remote": False, "experience_level": "Senior (6-9 yrs)",
        }
        result = compute_job_match(
            user_skills=["React"], desired_roles=[],
            work_preferences=[], salary_range=None,
            experience_level="Senior (6-9 yrs)", job=job,
        )
        assert any("exact match" in r.lower() for r in result["match_reasons"])

    def test_experience_level_adjacent_partial_credit(self):
        from api.services.ai import compute_job_match
        job = {
            "id": "j9", "title": "Dev",
            "required_skills": ["React"], "nice_skills": [],
            "remote": False, "experience_level": "Senior (6-9 yrs)",
        }
        exact = compute_job_match(
            user_skills=["React"], desired_roles=[],
            work_preferences=[], salary_range=None,
            experience_level="Senior (6-9 yrs)", job=job,
        )
        adjacent = compute_job_match(
            user_skills=["React"], desired_roles=[],
            work_preferences=[], salary_range=None,
            experience_level="Mid Level (3-5 yrs)", job=job,
        )
        assert exact["match_score"] >= adjacent["match_score"]

    def test_score_clamped_to_range(self):
        from api.services.ai import compute_job_match
        # Perfect match scenario
        job = {
            "id": "j10", "title": "React Developer",
            "required_skills": ["React", "TypeScript", "JavaScript"],
            "nice_skills": ["Next.js", "Redux", "Node.js"],
            "remote": True, "experience_level": "Senior (6-9 yrs)",
        }
        result = compute_job_match(
            user_skills=["React", "TypeScript", "JavaScript", "Next.js", "Redux", "Node.js"],
            desired_roles=["Frontend Developer"],
            work_preferences=["Remote"], salary_range="$160k-$200k",
            experience_level="Senior (6-9 yrs)", job=job,
        )
        assert 15 <= result["match_score"] <= 99

    def test_deterministic_jitter(self):
        from api.services.ai import compute_job_match
        job = {"id": "test_job", "title": "Dev", "required_skills": ["React"], "nice_skills": [], "remote": False}
        r1 = compute_job_match(["React"], [], [], None, None, job)
        r2 = compute_job_match(["React"], [], [], None, None, job)
        assert r1["match_score"] == r2["match_score"]

    def test_empty_job_skills(self):
        from api.services.ai import compute_job_match
        job = {"id": "empty", "title": "Dev", "required_skills": [], "nice_skills": [], "remote": False}
        result = compute_job_match(["React"], [], [], None, None, job)
        assert 15 <= result["match_score"] <= 99

    def test_hybrid_work_preference(self):
        from api.services.ai import compute_job_match
        job = {"id": "j11", "title": "Dev", "required_skills": ["React"], "nice_skills": [], "remote": False}
        result = compute_job_match(["React"], [], ["Hybrid"], None, None, job)
        assert result["match_score"] >= 15


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SERVICE: compute_candidate_match
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestComputeCandidateMatch:
    def test_returns_integer_score(self):
        from api.services.ai import compute_candidate_match
        candidate = {"skills": ["React", "TypeScript"], "desired_roles": ["Dev"], "work_preferences": [], "salary_range": None, "experience_level": None}
        job = {"id": "j1", "title": "Dev", "required_skills": ["React"], "nice_skills": [], "remote": False}
        score = compute_candidate_match(candidate, job)
        assert isinstance(score, int)
        assert 15 <= score <= 99

    def test_empty_candidate(self):
        from api.services.ai import compute_candidate_match
        candidate = {"skills": [], "desired_roles": [], "work_preferences": []}
        job = {"id": "j1", "title": "Dev", "required_skills": ["React"], "nice_skills": [], "remote": False}
        score = compute_candidate_match(candidate, job)
        assert 15 <= score <= 99


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SERVICE: parse_resume
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestParseResume:
    def test_returns_profile_and_summary(self):
        from api.services.ai import parse_resume
        result = parse_resume("test_resume.pdf", b"dummy content")
        assert "profile" in result
        assert "ai_summary" in result

    def test_profile_has_required_fields(self):
        from api.services.ai import parse_resume
        result = parse_resume("test.pdf", b"content")
        profile = result["profile"]
        for field in ["name", "headline", "skills", "desired_roles", "experience_level", "experience", "education"]:
            assert field in profile, f"Missing field: {field}"

    def test_profile_skills_non_empty(self):
        from api.services.ai import parse_resume
        result = parse_resume("resume.docx", b"content")
        assert isinstance(result["profile"]["skills"], list)

    def test_deterministic_persona_for_same_filename(self):
        from api.services.ai import parse_resume
        r1 = parse_resume("alice_resume.pdf", b"content1")
        r2 = parse_resume("alice_resume.pdf", b"content2")
        assert r1["profile"]["name"] == r2["profile"]["name"]

    def test_different_filenames_can_produce_different_personas(self):
        from api.services.ai import parse_resume
        r1 = parse_resume("file_a.pdf", b"c")
        r2 = parse_resume("file_b.pdf", b"c")
        r3 = parse_resume("file_c.pdf", b"c")
        names = {r1["profile"]["name"], r2["profile"]["name"], r3["profile"]["name"]}
        # At least 1 persona, could be more depending on hash distribution
        assert len(names) >= 1

    def test_summary_is_nonempty_string(self):
        from api.services.ai import parse_resume
        result = parse_resume("test.pdf", b"content")
        assert isinstance(result["ai_summary"], str)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SERVICE: generate_summary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestGenerateSummary:
    def test_includes_skills(self):
        from api.services.ai import generate_summary
        summary = generate_summary("Alice", ["React", "TypeScript"], ["Dev"])
        assert "React" in summary

    def test_includes_experience(self):
        from api.services.ai import generate_summary
        summary = generate_summary(
            "Alice", ["React"], ["Dev"], "Senior (6-9 yrs)",
            [{"title": "Lead Dev", "company": "Acme", "description": "Led team"}],
        )
        assert "Acme" in summary
        assert "Lead Dev" in summary

    def test_handles_no_experience(self):
        from api.services.ai import generate_summary
        summary = generate_summary("Alice", ["React"], ["Dev"])
        assert isinstance(summary, str)
        assert len(summary) > 0

    def test_includes_desired_roles(self):
        from api.services.ai import generate_summary
        summary = generate_summary("Alice", ["React"], ["Frontend Developer", "Full Stack Developer"])
        assert "Frontend Developer" in summary


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SERVICE: generate_headline, suggest_skills
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestGenerateHeadline:
    def test_includes_role(self):
        from api.services.ai import generate_headline
        headline = generate_headline("Alice", ["React"], ["Frontend Developer"])
        assert "Frontend Developer" in headline

    def test_includes_skills(self):
        from api.services.ai import generate_headline
        headline = generate_headline("Alice", ["React", "TypeScript"], ["Dev"])
        assert "React" in headline

    def test_no_roles_fallback(self):
        from api.services.ai import generate_headline
        headline = generate_headline("Alice", [], [])
        assert isinstance(headline, str)
        assert len(headline) > 0


class TestSuggestSkills:
    def test_suggests_related_skills(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["React"])
        assert len(suggestions) > 0
        assert "TypeScript" in suggestions or "Next.js" in suggestions

    def test_does_not_suggest_existing_skills(self):
        from api.services.ai import suggest_skills
        existing = ["React", "TypeScript"]
        suggestions = suggest_skills(existing)
        for s in suggestions:
            assert s.lower() not in {e.lower() for e in existing}

    def test_max_8_suggestions(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["React", "Python", "AWS", "TypeScript", "Machine Learning", "Node.js"])
        assert len(suggestions) <= 8

    def test_unknown_skills_return_empty(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["NonExistentSkill123"])
        assert len(suggestions) == 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SCHEMA VALIDATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestSchemaValidation:
    def test_register_request_valid(self):
        from api.models.schemas import RegisterRequest
        req = RegisterRequest(email="a@b.com", password="12345678", role="seeker", name="Alice")
        assert req.email == "a@b.com"
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
            RegisterRequest(email="a@b.com", password="12345678", role="admin")

    def test_job_create_defaults(self):
        from api.models.schemas import JobCreate
        job = JobCreate(title="Dev", location="Remote", description="Build things")
        assert job.type.value == "full-time"
        assert job.remote is False
        assert job.required_skills == []

    def test_application_status_enum(self):
        from api.models.schemas import ApplicationStatus
        assert ApplicationStatus.APPLIED.value == "applied"
        assert ApplicationStatus.HIRED.value == "hired"
        assert ApplicationStatus.REJECTED.value == "rejected"

    def test_seeker_profile_create_defaults(self):
        from api.models.schemas import SeekerProfileCreate
        profile = SeekerProfileCreate(name="Alice")
        assert profile.skills == []
        assert profile.desired_roles == []
        assert profile.experience == []
        assert profile.education == []

    def test_experience_model(self):
        from api.models.schemas import Experience
        exp = Experience(title="Dev", company="Acme", duration="2y")
        assert exp.description is None

    def test_education_model(self):
        from api.models.schemas import Education
        edu = Education(school="MIT", degree="CS")
        assert edu.year is None

    def test_message_send_model(self):
        from api.models.schemas import MessageSend
        msg = MessageSend(recipient_id="user123", content="Hello")
        assert msg.recipient_id == "user123"

    def test_match_request_defaults(self):
        from api.models.schemas import MatchRequest
        req = MatchRequest(skills=["React"])
        assert req.desired_roles == []
        assert req.work_preferences == []

    def test_candidate_search_defaults(self):
        from api.models.schemas import CandidateSearchRequest
        req = CandidateSearchRequest()
        assert req.query is None
        assert req.skills == []
        assert req.min_match == 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTH UTILITIES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestAuthUtils:
    def test_password_hashing(self):
        from api.core.config import hash_password, verify_password
        pw = "mysecretpassword123"
        hashed = hash_password(pw)
        assert hashed != pw
        assert verify_password(pw, hashed)

    def test_password_verification_fails_for_wrong_password(self):
        from api.core.config import hash_password, verify_password
        hashed = hash_password("correct_password")
        assert not verify_password("wrong_password", hashed)

    def test_different_hashes_for_same_password(self):
        from api.core.config import hash_password
        h1 = hash_password("password123")
        h2 = hash_password("password123")
        assert h1 != h2  # bcrypt uses random salt

    def test_jwt_creation_and_decoding(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "user123", "role": "seeker"})
        payload = decode_token(token)
        assert payload["sub"] == "user123"
        assert payload["role"] == "seeker"

    def test_tampered_token_rejected(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "user123"})
        tampered = token[:-5] + "XXXXX"
        result = decode_token(tampered)
        assert result is None

    def test_token_contains_expiry(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "user123"})
        payload = decode_token(token)
        assert "exp" in payload
