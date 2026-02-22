"""
Unit tests for api/services/ai.py

Tests the matching engine, resume parser, summary generator,
headline generator, and skill suggestion without any DB calls.
"""

import pytest
from api.services.ai import (
    compute_job_match,
    compute_candidate_match,
    parse_resume,
    generate_summary,
    generate_headline,
    suggest_skills,
)


# ═════════════════════════════════════════════════════════
#  MATCHING ENGINE
# ═════════════════════════════════════════════════════════
class TestMatchingEngine:

    @pytest.fixture
    def react_job(self):
        return {
            "id": "job_test",
            "title": "Senior React Developer",
            "required_skills": ["React", "TypeScript", "JavaScript"],
            "nice_skills": ["Next.js", "Redux", "Node.js"],
            "remote": True,
            "experience_level": "Senior (6-9 yrs)",
        }

    @pytest.mark.unit
    def test_perfect_match_scores_high(self, react_job):
        result = compute_job_match(
            user_skills=["React", "TypeScript", "JavaScript", "Next.js", "Redux", "Node.js"],
            desired_roles=["Frontend Developer", "React Developer"],
            work_preferences=["Remote"],
            salary_range="$160k–$200k",
            experience_level="Senior (6-9 yrs)",
            job=react_job,
        )
        assert result["match_score"] >= 85
        assert len(result["matched_required"]) == 3
        assert len(result["matched_nice"]) == 3
        assert len(result["match_reasons"]) >= 2

    @pytest.mark.unit
    def test_no_skills_match_scores_low(self, react_job):
        result = compute_job_match(
            user_skills=["Python", "Django", "Flask"],
            desired_roles=["Backend Developer"],
            work_preferences=["On-site"],
            salary_range=None,
            experience_level="Entry Level (0-2 yrs)",
            job=react_job,
        )
        assert result["match_score"] < 30
        assert result["matched_required"] == []
        assert result["matched_nice"] == []

    @pytest.mark.unit
    def test_partial_skill_match(self, react_job):
        result = compute_job_match(
            user_skills=["React", "Python"],
            desired_roles=["Full Stack Developer"],
            work_preferences=["Remote"],
            salary_range=None,
            experience_level="Senior (6-9 yrs)",
            job=react_job,
        )
        assert result["matched_required"] == ["React"]
        assert result["match_score"] > 30

    @pytest.mark.unit
    def test_case_insensitive_matching(self, react_job):
        result = compute_job_match(
            user_skills=["react", "typescript", "javascript"],
            desired_roles=[],
            work_preferences=[],
            salary_range=None,
            experience_level=None,
            job=react_job,
        )
        assert len(result["matched_required"]) == 3

    @pytest.mark.unit
    def test_remote_preference_gives_bonus(self, react_job):
        remote = compute_job_match(["React"], [], ["Remote"], None, None, react_job)
        onsite = compute_job_match(["React"], [], ["On-site"], None, None, react_job)
        assert remote["match_score"] > onsite["match_score"]

    @pytest.mark.unit
    def test_hybrid_preference_partial_score(self, react_job):
        hybrid = compute_job_match(["React"], [], ["Hybrid"], None, None, react_job)
        remote = compute_job_match(["React"], [], ["Remote"], None, None, react_job)
        none_pref = compute_job_match(["React"], [], [], None, None, react_job)
        assert hybrid["match_score"] >= none_pref["match_score"]

    @pytest.mark.unit
    def test_exact_experience_level_bonus(self, react_job):
        exact = compute_job_match([], [], [], None, "Senior (6-9 yrs)", react_job)
        off = compute_job_match([], [], [], None, "Entry Level (0-2 yrs)", react_job)
        assert exact["match_score"] >= off["match_score"]

    @pytest.mark.unit
    def test_adjacent_experience_level_partial(self, react_job):
        adjacent = compute_job_match([], [], [], None, "Staff / Lead (10+ yrs)", react_job)
        far_off = compute_job_match([], [], [], None, "Entry Level (0-2 yrs)", react_job)
        assert adjacent["match_score"] >= far_off["match_score"]

    @pytest.mark.unit
    def test_role_alignment_bonus(self, react_job):
        aligned = compute_job_match([], ["React Developer"], [], None, None, react_job)
        unaligned = compute_job_match([], ["Data Scientist"], [], None, None, react_job)
        assert aligned["match_score"] > unaligned["match_score"]

    @pytest.mark.unit
    def test_score_clamped_between_15_and_99(self, react_job):
        # Even with zero matches, score is at least 15
        low = compute_job_match([], [], [], None, None, react_job)
        assert 15 <= low["match_score"] <= 99

        # Even with everything matching, score caps at 99
        high = compute_job_match(
            ["React", "TypeScript", "JavaScript", "Next.js", "Redux", "Node.js"],
            ["React Developer"], ["Remote"], None, "Senior (6-9 yrs)", react_job,
        )
        assert high["match_score"] <= 99

    @pytest.mark.unit
    def test_match_reasons_populated(self, react_job):
        result = compute_job_match(
            ["React", "TypeScript", "JavaScript", "Next.js"],
            ["React Developer"], ["Remote"], None, "Senior (6-9 yrs)", react_job,
        )
        assert any("required" in r.lower() for r in result["match_reasons"])
        assert any("remote" in r.lower() for r in result["match_reasons"])

    @pytest.mark.unit
    def test_empty_job_skills_handles_gracefully(self):
        job = {"id": "empty", "title": "Mystery Role", "required_skills": [], "nice_skills": []}
        result = compute_job_match(["Python"], ["Developer"], [], None, None, job)
        assert result["match_score"] >= 15
        assert result["matched_required"] == []

    @pytest.mark.unit
    def test_deterministic_jitter(self, react_job):
        """Same inputs produce same score (jitter is deterministic per job id)."""
        a = compute_job_match(["React"], [], [], None, None, react_job)
        b = compute_job_match(["React"], [], [], None, None, react_job)
        assert a["match_score"] == b["match_score"]


class TestCandidateMatch:

    @pytest.mark.unit
    def test_candidate_match_delegates_correctly(self):
        candidate = {
            "skills": ["React", "TypeScript"],
            "desired_roles": ["Frontend Developer"],
            "work_preferences": ["Remote"],
            "salary_range": None,
            "experience_level": "Senior (6-9 yrs)",
        }
        job = {
            "id": "j1", "title": "React Developer",
            "required_skills": ["React", "TypeScript"], "nice_skills": [],
            "remote": True, "experience_level": "Senior (6-9 yrs)",
        }
        score = compute_candidate_match(candidate, job)
        assert isinstance(score, int)
        assert 15 <= score <= 99


# ═════════════════════════════════════════════════════════
#  RESUME PARSER
# ═════════════════════════════════════════════════════════
class TestResumeParser:

    @pytest.mark.unit
    def test_returns_profile_and_summary(self):
        result = parse_resume("test_resume.pdf", b"fake content")
        assert "profile" in result
        assert "ai_summary" in result
        assert isinstance(result["ai_summary"], str)
        assert len(result["ai_summary"]) > 50

    @pytest.mark.unit
    def test_profile_has_required_fields(self):
        result = parse_resume("resume.docx", b"bytes")
        profile = result["profile"]
        assert "name" in profile
        assert "skills" in profile
        assert "experience" in profile
        assert "education" in profile
        assert len(profile["skills"]) >= 5

    @pytest.mark.unit
    def test_different_filenames_can_produce_different_personas(self):
        r1 = parse_resume("alice.pdf", b"x")
        r2 = parse_resume("bob.pdf", b"x")
        r3 = parse_resume("charlie.pdf", b"x")
        names = {r1["profile"]["name"], r2["profile"]["name"], r3["profile"]["name"]}
        # At least 2 different personas should appear across 3 hashes
        assert len(names) >= 2

    @pytest.mark.unit
    def test_same_filename_same_result(self):
        a = parse_resume("stable_name.pdf", b"a")
        b = parse_resume("stable_name.pdf", b"b")
        assert a["profile"]["name"] == b["profile"]["name"]

    @pytest.mark.unit
    def test_experience_has_structure(self):
        result = parse_resume("test.pdf", b"x")
        for exp in result["profile"]["experience"]:
            assert "title" in exp
            assert "company" in exp
            assert "duration" in exp


# ═════════════════════════════════════════════════════════
#  SUMMARY & HEADLINE GENERATORS
# ═════════════════════════════════════════════════════════
class TestSummaryGenerator:

    @pytest.mark.unit
    def test_basic_summary(self):
        s = generate_summary(
            name="Jane", skills=["React", "TypeScript"],
            desired_roles=["Frontend Developer"],
            experience_level="Senior (6-9 yrs)",
        )
        assert "React" in s
        assert "TypeScript" in s
        assert len(s) > 50

    @pytest.mark.unit
    def test_summary_with_experience(self):
        s = generate_summary(
            name="Jane", skills=["Python"],
            desired_roles=["ML Engineer"],
            experience_level="Mid Level (3-5 yrs)",
            experience=[{"title": "ML Engineer", "company": "Google", "description": "Built ML models."}],
        )
        assert "Google" in s
        assert "ML Engineer" in s

    @pytest.mark.unit
    def test_summary_without_optional_fields(self):
        s = generate_summary(name="Bob", skills=["Java"], desired_roles=[])
        assert isinstance(s, str)
        assert len(s) > 20


class TestHeadlineGenerator:

    @pytest.mark.unit
    def test_headline_includes_role_and_skills(self):
        h = generate_headline("Jane", ["React", "TypeScript"], ["Frontend Developer"])
        assert "Frontend Developer" in h
        assert "React" in h

    @pytest.mark.unit
    def test_headline_with_no_skills(self):
        h = generate_headline("Jane", [], ["Engineer"])
        assert "Engineer" in h

    @pytest.mark.unit
    def test_headline_with_no_roles(self):
        h = generate_headline("Jane", ["Python"], [])
        assert "Professional" in h


class TestSkillSuggestions:

    @pytest.mark.unit
    def test_suggests_complementary_skills(self):
        suggestions = suggest_skills(["React"])
        assert len(suggestions) > 0
        assert "React" not in suggestions  # shouldn't suggest what you already have

    @pytest.mark.unit
    def test_no_duplicates_of_existing(self):
        existing = ["React", "TypeScript"]
        suggestions = suggest_skills(existing)
        for s in suggestions:
            assert s.lower() not in {e.lower() for e in existing}

    @pytest.mark.unit
    def test_max_8_suggestions(self):
        suggestions = suggest_skills(["React", "Python", "AWS", "Machine Learning", "Node.js"])
        assert len(suggestions) <= 8

    @pytest.mark.unit
    def test_unknown_skill_returns_empty(self):
        suggestions = suggest_skills(["ZephyrLang4000"])
        assert suggestions == []
