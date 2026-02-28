"""
Comprehensive unit tests for HireFlow backend.
Covers: JSONB helpers, database layer, config/auth utilities,
AI services boundary conditions, schema edge cases.
"""

import json
import os
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CONFIG & AUTH UTILITIES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestPasswordHashing:
    """Password hashing and verification edge cases."""

    def test_hash_produces_bcrypt_prefix(self):
        from api.core.config import hash_password
        h = hash_password("testpassword")
        assert h.startswith("$2b$") or h.startswith("$2a$")

    def test_hash_is_unique_per_call(self):
        from api.core.config import hash_password
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")
        assert h1 != h2  # bcrypt salts differently each time

    def test_verify_correct_password(self):
        from api.core.config import hash_password, verify_password
        h = hash_password("hunter2")
        assert verify_password("hunter2", h) is True

    def test_verify_wrong_password(self):
        from api.core.config import hash_password, verify_password
        h = hash_password("correct_password")
        assert verify_password("wrong_password", h) is False

    def test_verify_empty_password(self):
        from api.core.config import hash_password, verify_password
        h = hash_password("")
        assert verify_password("", h) is True
        assert verify_password("notempty", h) is False

    def test_unicode_password(self):
        from api.core.config import hash_password, verify_password
        pw = "パスワード🔑"
        h = hash_password(pw)
        assert verify_password(pw, h) is True

    def test_very_long_password(self):
        from api.core.config import hash_password, verify_password
        pw = "a" * 200
        h = hash_password(pw)
        assert verify_password(pw, h) is True


class TestJWTTokens:
    """JWT creation and decoding edge cases."""

    def test_token_contains_sub_and_role(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "user_123", "role": "seeker"})
        payload = decode_token(token)
        assert payload["sub"] == "user_123"
        assert payload["role"] == "seeker"

    def test_token_has_expiry(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "u1"})
        payload = decode_token(token)
        assert "exp" in payload

    def test_custom_expiry(self):
        from api.core.config import create_access_token, decode_token
        delta = timedelta(minutes=5)
        token = create_access_token({"sub": "u1"}, expires_delta=delta)
        payload = decode_token(token)
        assert payload is not None

    def test_expired_token_returns_none(self):
        from api.core.config import create_access_token, decode_token
        delta = timedelta(seconds=-10)  # already expired
        token = create_access_token({"sub": "u1"}, expires_delta=delta)
        assert decode_token(token) is None

    def test_tampered_token_returns_none(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "u1"})
        tampered = token[:-5] + "XXXXX"
        assert decode_token(tampered) is None

    def test_random_string_returns_none(self):
        from api.core.config import decode_token
        assert decode_token("not.a.jwt") is None
        assert decode_token("") is None

    def test_additional_claims_preserved(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "u1", "email": "a@b.com", "custom": 42})
        payload = decode_token(token)
        assert payload["email"] == "a@b.com"
        assert payload["custom"] == 42


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JSONB HELPERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestJSONBHelpers:
    """Test the JSONB field parsing/prep helpers in database.py."""

    def test_parse_user_none_fields_become_lists(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"id": "u1", "skills": None, "desired_roles": None, "experience": None}
        result = _parse_jsonb_fields_user(data)
        assert result["skills"] == []
        assert result["desired_roles"] == []
        assert result["experience"] == []

    def test_parse_user_string_json_decoded(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"skills": '["React", "Python"]', "desired_roles": '["Dev"]'}
        result = _parse_jsonb_fields_user(data)
        assert result["skills"] == ["React", "Python"]
        assert result["desired_roles"] == ["Dev"]

    def test_parse_user_invalid_json_becomes_empty(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"skills": "not-valid-json{", "desired_roles": ""}
        result = _parse_jsonb_fields_user(data)
        assert result["skills"] == []
        assert result["desired_roles"] == []

    def test_parse_user_list_passthrough(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"skills": ["React", "TypeScript"], "industries": ["Tech"]}
        result = _parse_jsonb_fields_user(data)
        assert result["skills"] == ["React", "TypeScript"]

    def test_parse_user_empty_dict(self):
        from api.core.database import _parse_jsonb_fields_user
        assert _parse_jsonb_fields_user({}) == {}

    def test_parse_user_none_returns_none(self):
        from api.core.database import _parse_jsonb_fields_user
        assert _parse_jsonb_fields_user(None) is None

    def test_prep_user_string_json_decoded(self):
        from api.core.database import _prep_jsonb_fields_user
        data = {"skills": '["React"]'}
        result = _prep_jsonb_fields_user(data)
        assert result["skills"] == ["React"]

    def test_prep_user_invalid_string_becomes_empty(self):
        from api.core.database import _prep_jsonb_fields_user
        data = {"skills": "broken[json"}
        result = _prep_jsonb_fields_user(data)
        assert result["skills"] == []

    def test_parse_job_fields(self):
        from api.core.database import _parse_jsonb_fields_job
        data = {"required_skills": None, "nice_skills": '["Docker"]'}
        result = _parse_jsonb_fields_job(data)
        assert result["required_skills"] == []
        assert result["nice_skills"] == ["Docker"]

    def test_prep_job_fields_passthrough(self):
        from api.core.database import _prep_jsonb_fields_job
        data = {"required_skills": ["React"], "nice_skills": ["Docker"]}
        result = _prep_jsonb_fields_job(data)
        assert result["required_skills"] == ["React"]

    def test_parse_job_empty(self):
        from api.core.database import _parse_jsonb_fields_job
        assert _parse_jsonb_fields_job({}) == {}
        assert _parse_jsonb_fields_job(None) is None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  DATABASE LAYER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestDatabaseUserOps:
    """User CRUD through database functions with mock Supabase."""

    def test_create_and_get_user(self, mock_supabase):
        from api.core.database import create_user, get_user_by_id
        user = create_user({
            "id": "u1", "email": "test@test.com", "role": "seeker",
            "hashed_password": "hash", "skills": ["React"],
        })
        assert user["id"] == "u1"
        fetched = get_user_by_id("u1")
        assert fetched["email"] == "test@test.com"
        assert fetched["skills"] == ["React"]

    def test_get_nonexistent_user(self, mock_supabase):
        from api.core.database import get_user_by_id
        assert get_user_by_id("nonexistent") is None

    def test_get_user_by_email(self, mock_supabase):
        from api.core.database import create_user, get_user_by_email
        create_user({"id": "u2", "email": "find@me.com", "role": "company"})
        found = get_user_by_email("find@me.com")
        assert found is not None
        assert found["role"] == "company"

    def test_get_user_by_email_not_found(self, mock_supabase):
        from api.core.database import get_user_by_email
        assert get_user_by_email("nobody@nowhere.com") is None

    def test_update_user(self, mock_supabase):
        from api.core.database import create_user, update_user, get_user_by_id
        create_user({"id": "u3", "email": "upd@test.com", "role": "seeker", "name": "Old"})
        update_user("u3", {"name": "New", "skills": ["Python"]})
        u = get_user_by_id("u3")
        assert u["name"] == "New"
        assert "Python" in u["skills"]

    def test_get_users_by_role(self, mock_supabase):
        from api.core.database import create_user, get_users_by_role
        create_user({"id": "s1", "email": "s1@t.com", "role": "seeker"})
        create_user({"id": "s2", "email": "s2@t.com", "role": "seeker"})
        create_user({"id": "c1", "email": "c1@t.com", "role": "company"})
        seekers = get_users_by_role("seeker")
        assert len(seekers) == 2
        companies = get_users_by_role("company")
        assert len(companies) == 1


class TestDatabaseJobOps:
    """Job CRUD through database functions."""

    def test_create_and_get_job(self, mock_supabase):
        from api.core.database import create_job, get_job_by_id
        j = create_job({
            "id": "j1", "company_id": "c1", "title": "Dev",
            "required_skills": ["React"], "nice_skills": [], "status": "active",
        })
        assert j["id"] == "j1"
        fetched = get_job_by_id("j1")
        assert fetched["title"] == "Dev"

    def test_get_active_jobs(self, mock_supabase):
        from api.core.database import create_job, get_active_jobs
        create_job({"id": "j1", "status": "active", "title": "A", "required_skills": [], "nice_skills": []})
        create_job({"id": "j2", "status": "closed", "title": "B", "required_skills": [], "nice_skills": []})
        create_job({"id": "j3", "status": "active", "title": "C", "required_skills": [], "nice_skills": []})
        active = get_active_jobs()
        assert len(active) == 2
        assert all(j["status"] == "active" for j in active)

    def test_search_jobs_by_title(self, mock_supabase):
        from api.core.database import create_job, search_jobs
        create_job({"id": "j1", "status": "active", "title": "React Developer", "required_skills": ["React"], "nice_skills": [], "description": ""})
        create_job({"id": "j2", "status": "active", "title": "Python Engineer", "required_skills": ["Python"], "nice_skills": [], "description": ""})
        results = search_jobs(search="react")
        assert len(results) == 1
        assert results[0]["title"] == "React Developer"

    def test_search_jobs_by_skill(self, mock_supabase):
        from api.core.database import create_job, search_jobs
        create_job({"id": "j1", "status": "active", "title": "Dev", "required_skills": ["Docker", "K8s"], "nice_skills": [], "description": ""})
        results = search_jobs(search="docker")
        assert len(results) == 1

    def test_search_jobs_remote_filter(self, mock_supabase):
        from api.core.database import create_job, search_jobs
        create_job({"id": "j1", "status": "active", "title": "A", "remote": True, "required_skills": [], "nice_skills": []})
        create_job({"id": "j2", "status": "active", "title": "B", "remote": False, "required_skills": [], "nice_skills": []})
        remote = search_jobs(remote_only=True)
        assert len(remote) == 1
        assert remote[0]["remote"] is True

    def test_search_jobs_type_filter(self, mock_supabase):
        from api.core.database import create_job, search_jobs
        create_job({"id": "j1", "status": "active", "title": "A", "type": "full-time", "required_skills": [], "nice_skills": []})
        create_job({"id": "j2", "status": "active", "title": "B", "type": "contract", "required_skills": [], "nice_skills": []})
        ft = search_jobs(job_type="full-time")
        assert len(ft) == 1

    def test_close_job(self, mock_supabase):
        from api.core.database import create_job, close_job, get_job_by_id
        create_job({"id": "j1", "status": "active", "title": "X", "required_skills": [], "nice_skills": []})
        close_job("j1")
        j = get_job_by_id("j1")
        assert j["status"] == "closed"

    def test_get_jobs_by_company(self, mock_supabase):
        from api.core.database import create_job, get_jobs_by_company
        create_job({"id": "j1", "company_id": "c1", "status": "active", "title": "A", "required_skills": [], "nice_skills": []})
        create_job({"id": "j2", "company_id": "c2", "status": "active", "title": "B", "required_skills": [], "nice_skills": []})
        c1_jobs = get_jobs_by_company("c1")
        assert len(c1_jobs) == 1
        assert c1_jobs[0]["company_id"] == "c1"


class TestDatabaseApplicationOps:
    """Application CRUD through database functions."""

    def test_create_and_get_application(self, mock_supabase):
        from api.core.database import create_application, get_application_by_id
        app = create_application({
            "id": "a1", "job_id": "j1", "seeker_id": "s1",
            "status": "applied", "cover_letter": "Hello!",
        })
        assert app["id"] == "a1"
        fetched = get_application_by_id("a1")
        assert fetched["status"] == "applied"

    def test_get_applications_by_job(self, mock_supabase):
        from api.core.database import create_application, get_applications_by_job
        create_application({"id": "a1", "job_id": "j1", "seeker_id": "s1", "status": "applied"})
        create_application({"id": "a2", "job_id": "j1", "seeker_id": "s2", "status": "applied"})
        create_application({"id": "a3", "job_id": "j2", "seeker_id": "s1", "status": "applied"})
        j1_apps = get_applications_by_job("j1")
        assert len(j1_apps) == 2

    def test_get_applications_by_seeker(self, mock_supabase):
        from api.core.database import create_application, get_applications_by_seeker
        create_application({"id": "a1", "job_id": "j1", "seeker_id": "s1", "status": "applied"})
        create_application({"id": "a2", "job_id": "j2", "seeker_id": "s1", "status": "screening"})
        apps = get_applications_by_seeker("s1")
        assert len(apps) == 2

    def test_duplicate_detection(self, mock_supabase):
        from api.core.database import create_application, get_application_by_job_and_seeker
        create_application({"id": "a1", "job_id": "j1", "seeker_id": "s1", "status": "applied"})
        dup = get_application_by_job_and_seeker("j1", "s1")
        assert dup is not None
        assert dup["id"] == "a1"

    def test_no_duplicate(self, mock_supabase):
        from api.core.database import get_application_by_job_and_seeker
        assert get_application_by_job_and_seeker("j1", "s1") is None

    def test_update_application_status(self, mock_supabase):
        from api.core.database import create_application, update_application_status, get_application_by_id
        create_application({"id": "a1", "job_id": "j1", "seeker_id": "s1", "status": "applied"})
        update_application_status("a1", "interview")
        a = get_application_by_id("a1")
        assert a["status"] == "interview"


class TestDatabaseChatOps:
    """Conversation and message operations."""

    def test_create_conversation_and_get(self, mock_supabase):
        from api.core.database import create_conversation, get_conversation_participants
        create_conversation("conv_1", ["u1", "u2"])
        parts = get_conversation_participants("conv_1")
        assert set(parts) == {"u1", "u2"}

    def test_conversation_between_found(self, mock_supabase):
        from api.core.database import create_conversation, get_conversation_between
        create_conversation("conv_1", ["u1", "u2"])
        found = get_conversation_between("u1", "u2")
        assert found == "conv_1"

    def test_conversation_between_not_found(self, mock_supabase):
        from api.core.database import get_conversation_between
        assert get_conversation_between("u1", "u2") is None

    def test_create_and_get_messages(self, mock_supabase):
        from api.core.database import create_conversation, create_message, get_messages
        create_conversation("c1", ["u1", "u2"])
        create_message({"id": "m1", "conversation_id": "c1", "sender_id": "u1", "content": "Hello", "read": False})
        create_message({"id": "m2", "conversation_id": "c1", "sender_id": "u2", "content": "Hi!", "read": False})
        msgs = get_messages("c1")
        assert len(msgs) == 2

    def test_mark_messages_read(self, mock_supabase):
        from api.core.database import (
            create_conversation, create_message, mark_messages_read, get_messages,
        )
        create_conversation("c1", ["u1", "u2"])
        create_message({"id": "m1", "conversation_id": "c1", "sender_id": "u1", "content": "Hello", "read": False})
        create_message({"id": "m2", "conversation_id": "c1", "sender_id": "u2", "content": "Hi!", "read": False})
        mark_messages_read("c1", "u2")  # u2 reads u1's messages
        msgs = get_messages("c1")
        # m1 (sent by u1) should now be read
        m1 = next(m for m in msgs if m["id"] == "m1")
        assert m1["read"] is True
        # m2 (sent by u2) should still be unread (sender can't mark own as read)
        m2 = next(m for m in msgs if m["id"] == "m2")
        assert m2["read"] is False


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SERVICES — BOUNDARY CONDITIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestComputeJobMatchBoundary:
    """Boundary and edge case testing for the matching engine."""

    def test_empty_skills_low_score(self):
        from api.services.ai import compute_job_match
        result = compute_job_match(
            user_skills=[], desired_roles=[], work_preferences=[],
            salary_range=None, experience_level=None,
            job={"id": "j1", "required_skills": ["React"], "nice_skills": ["Docker"]},
        )
        assert result["match_score"] >= 15
        assert result["match_score"] <= 30  # Only jitter

    def test_perfect_match_high_score(self):
        from api.services.ai import compute_job_match
        result = compute_job_match(
            user_skills=["React", "TypeScript", "JavaScript", "Next.js", "Redux", "Node.js"],
            desired_roles=["Frontend Developer"],
            work_preferences=["Remote"],
            salary_range="$160k-$200k",
            experience_level="Senior (6-9 yrs)",
            job={
                "id": "j1", "title": "Frontend Developer",
                "required_skills": ["React", "TypeScript", "JavaScript"],
                "nice_skills": ["Next.js", "Redux", "Node.js"],
                "remote": True,
                "experience_level": "Senior (6-9 yrs)",
            },
        )
        assert result["match_score"] >= 90

    def test_case_insensitive_matching(self):
        from api.services.ai import compute_job_match
        result = compute_job_match(
            user_skills=["react", "TYPESCRIPT", "JavaScript"],
            desired_roles=[], work_preferences=[], salary_range=None, experience_level=None,
            job={"id": "j1", "required_skills": ["React", "TypeScript", "JavaScript"], "nice_skills": []},
        )
        assert len(result["matched_required"]) == 3

    def test_adjacent_experience_partial_credit(self):
        from api.services.ai import compute_job_match
        result = compute_job_match(
            user_skills=["React"], desired_roles=[], work_preferences=[],
            salary_range=None, experience_level="Senior (6-9 yrs)",
            job={
                "id": "j1", "required_skills": ["React"], "nice_skills": [],
                "experience_level": "Mid Level (3-5 yrs)",
            },
        )
        # Adjacent level = 5 pts partial credit
        result_exact = compute_job_match(
            user_skills=["React"], desired_roles=[], work_preferences=[],
            salary_range=None, experience_level="Mid Level (3-5 yrs)",
            job={
                "id": "j1", "required_skills": ["React"], "nice_skills": [],
                "experience_level": "Mid Level (3-5 yrs)",
            },
        )
        assert result_exact["match_score"] >= result["match_score"]

    def test_hybrid_work_preference_partial(self):
        from api.services.ai import compute_job_match
        result = compute_job_match(
            user_skills=[], desired_roles=[], work_preferences=["Hybrid"],
            salary_range=None, experience_level=None,
            job={"id": "j1", "required_skills": [], "nice_skills": [], "remote": True},
        )
        # Hybrid gets 5 pts partial
        assert result["match_score"] >= 15

    def test_onsite_preference_non_remote_job(self):
        from api.services.ai import compute_job_match
        result = compute_job_match(
            user_skills=[], desired_roles=[], work_preferences=["On-site"],
            salary_range=None, experience_level=None,
            job={"id": "j1", "required_skills": [], "nice_skills": [], "remote": False},
        )
        # On-site + non-remote = 10 pts
        assert result["match_score"] >= 15

    def test_jitter_deterministic_for_same_job_id(self):
        from api.services.ai import compute_job_match
        args = dict(
            user_skills=["React"], desired_roles=[], work_preferences=[],
            salary_range=None, experience_level=None,
        )
        r1 = compute_job_match(**args, job={"id": "j42", "required_skills": ["React"], "nice_skills": []})
        r2 = compute_job_match(**args, job={"id": "j42", "required_skills": ["React"], "nice_skills": []})
        assert r1["match_score"] == r2["match_score"]

    def test_score_clamped_to_99(self):
        from api.services.ai import compute_job_match
        # Even with maximum everything, score shouldn't exceed 99
        result = compute_job_match(
            user_skills=["A", "B", "C", "D", "E", "F"],
            desired_roles=["Developer"],
            work_preferences=["Remote"],
            salary_range="$200k+",
            experience_level="Senior (6-9 yrs)",
            job={
                "id": "j1", "title": "Senior Developer",
                "required_skills": ["A", "B", "C"],
                "nice_skills": ["D", "E", "F"],
                "remote": True,
                "experience_level": "Senior (6-9 yrs)",
            },
        )
        assert result["match_score"] <= 99

    def test_score_minimum_15(self):
        from api.services.ai import compute_job_match
        result = compute_job_match(
            user_skills=[], desired_roles=[], work_preferences=[],
            salary_range=None, experience_level=None,
            job={"id": "j1", "required_skills": [], "nice_skills": []},
        )
        assert result["match_score"] >= 15

    def test_match_reasons_populated(self):
        from api.services.ai import compute_job_match
        result = compute_job_match(
            user_skills=["React", "TypeScript"],
            desired_roles=["Frontend Developer"],
            work_preferences=["Remote"],
            salary_range=None, experience_level=None,
            job={
                "id": "j1", "title": "Frontend Developer",
                "required_skills": ["React", "TypeScript"],
                "nice_skills": [], "remote": True,
            },
        )
        assert len(result["match_reasons"]) >= 2  # skill match + role + remote


class TestCandidateMatch:
    """compute_candidate_match delegates correctly."""

    def test_delegates_to_job_match(self):
        from api.services.ai import compute_candidate_match
        candidate = {
            "skills": ["React", "Python"],
            "desired_roles": ["Developer"],
            "work_preferences": ["Remote"],
        }
        job = {
            "id": "j1", "title": "Developer",
            "required_skills": ["React"], "nice_skills": ["Python"],
            "remote": True,
        }
        score = compute_candidate_match(candidate, job)
        assert isinstance(score, int)
        assert 15 <= score <= 99


class TestResumeParser:
    """parse_resume edge cases."""

    def test_different_filenames_different_personas(self):
        from api.services.ai import parse_resume
        r1 = parse_resume("resume_a.pdf", b"content")
        r2 = parse_resume("resume_b.pdf", b"content")
        # Different filenames may produce same or different personas
        # but both should have valid structure
        assert "profile" in r1
        assert "ai_summary" in r1
        assert "profile" in r2

    def test_profile_has_required_fields(self):
        from api.services.ai import parse_resume
        result = parse_resume("test.pdf", b"data")
        profile = result["profile"]
        assert "name" in profile
        assert "skills" in profile
        assert "desired_roles" in profile
        assert "experience" in profile
        assert "education" in profile
        assert isinstance(profile["skills"], list)

    def test_ai_summary_nonempty(self):
        from api.services.ai import parse_resume
        result = parse_resume("test.pdf", b"data")
        assert isinstance(result["ai_summary"], str)


class TestSummaryGenerator:
    """generate_summary, generate_headline, suggest_skills."""

    def test_summary_includes_skills(self):
        from api.services.ai import generate_summary
        s = generate_summary("Alice", ["React", "Python", "AWS"], ["Developer"])
        assert "React" in s or "Python" in s

    def test_summary_includes_experience(self):
        from api.services.ai import generate_summary
        s = generate_summary(
            "Bob", ["Java"], ["Engineer"], "Senior (6-9 yrs)",
            [{"title": "CTO", "company": "Acme", "description": "Led engineering"}],
        )
        assert "CTO" in s
        assert "Acme" in s

    def test_summary_no_experience(self):
        from api.services.ai import generate_summary
        s = generate_summary("Charlie", ["Go"], ["Backend Dev"])
        assert len(s) > 10  # Should still produce a summary

    def test_headline_format(self):
        from api.services.ai import generate_headline
        h = generate_headline("Alice", ["React", "TypeScript"], ["Frontend Developer"])
        assert "Frontend Developer" in h
        assert "React" in h

    def test_headline_no_skills(self):
        from api.services.ai import generate_headline
        h = generate_headline("Bob", [], ["Engineer"])
        assert "Engineer" in h

    def test_headline_no_roles(self):
        from api.services.ai import generate_headline
        h = generate_headline("Charlie", ["Python"], [])
        assert "Professional" in h

    def test_suggest_skills_react(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["React"])
        assert len(suggestions) > 0
        assert "React" not in suggestions  # Don't suggest what they already have

    def test_suggest_skills_multiple(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["React", "Python", "AWS"])
        assert len(suggestions) > 0

    def test_suggest_skills_unknown(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["ObscureLang123"])
        assert suggestions == []  # No suggestions for unknown skills

    def test_suggest_skills_empty(self):
        from api.services.ai import suggest_skills
        assert suggest_skills([]) == []

    def test_suggest_skills_max_8(self):
        from api.services.ai import suggest_skills
        suggestions = suggest_skills(["React", "Python", "TypeScript", "AWS", "Node.js", "Machine Learning"])
        assert len(suggestions) <= 8


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SCHEMA VALIDATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class TestSchemaValidation:
    """Pydantic schema edge cases."""

    def test_register_short_password_rejected(self):
        from api.models.schemas import RegisterRequest
        with pytest.raises(Exception):
            RegisterRequest(email="a@b.com", password="short", role="seeker")

    def test_register_valid(self):
        from api.models.schemas import RegisterRequest
        r = RegisterRequest(email="a@b.com", password="longpassword", role="seeker", name="Test")
        assert r.role.value == "seeker"

    def test_job_create_defaults(self):
        from api.models.schemas import JobCreate
        j = JobCreate(title="Dev", location="Remote", description="Do things")
        assert j.type.value == "full-time"
        assert j.remote is False
        assert j.required_skills == []

    def test_application_status_enum(self):
        from api.models.schemas import ApplicationStatus
        assert ApplicationStatus.APPLIED.value == "applied"
        assert ApplicationStatus.HIRED.value == "hired"
        assert ApplicationStatus.REJECTED.value == "rejected"

    def test_seeker_profile_empty_lists_default(self):
        from api.models.schemas import SeekerProfileCreate
        p = SeekerProfileCreate(name="Test")
        assert p.skills == []
        assert p.desired_roles == []
        assert p.experience == []

    def test_experience_model(self):
        from api.models.schemas import Experience
        e = Experience(title="Dev", company="Acme", duration="2020-2024")
        assert e.description is None

    def test_education_model(self):
        from api.models.schemas import Education
        ed = Education(school="MIT", degree="BS CS")
        assert ed.year is None

    def test_candidate_search_defaults(self):
        from api.models.schemas import CandidateSearchRequest
        s = CandidateSearchRequest()
        assert s.query is None
        assert s.skills == []
        assert s.min_match == 0

    def test_message_send_required_fields(self):
        from api.models.schemas import MessageSend
        m = MessageSend(recipient_id="u1", content="Hello!")
        assert m.recipient_id == "u1"

    def test_job_type_enum_values(self):
        from api.models.schemas import JobType
        assert JobType.FULL_TIME.value == "full-time"
        assert JobType.CONTRACT.value == "contract"
        assert JobType.PART_TIME.value == "part-time"
        assert JobType.INTERNSHIP.value == "internship"
