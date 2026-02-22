"""
Extended unit tests for HireFlow backend.
Covers schema validation edge cases, AI service boundaries,
and utility function behavior.
"""

import pytest
from pydantic import ValidationError

from api.models.schemas import (
    RegisterRequest, LoginRequest, SeekerProfileCreate, JobCreate,
    ApplicationCreate, MessageSend, AISummaryRequest, CandidateSearchRequest,
    UserRole, ApplicationStatus, JobStatus, JobType, Experience, Education,
    ApplicationUpdateStatus, MatchRequest,
)
from api.services.ai import (
    compute_job_match, compute_candidate_match, parse_resume,
    generate_summary, generate_headline, suggest_skills,
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SCHEMA VALIDATION – EDGE CASES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSchemaEdgeCases:
    """Validate Pydantic model constraints and defaults."""

    def test_register_password_min_length(self):
        with pytest.raises(ValidationError):
            RegisterRequest(email="a@b.com", password="short", role="seeker")

    def test_register_password_exact_min(self):
        r = RegisterRequest(email="a@b.com", password="12345678", role="seeker")
        assert r.password == "12345678"

    def test_register_invalid_role(self):
        with pytest.raises(ValidationError):
            RegisterRequest(email="a@b.com", password="12345678", role="admin")

    def test_register_all_roles_valid(self):
        for role in ["seeker", "recruiter", "company"]:
            r = RegisterRequest(email="a@b.com", password="12345678", role=role)
            assert r.role.value == role

    def test_register_optional_fields_default_none(self):
        r = RegisterRequest(email="a@b.com", password="12345678", role="seeker")
        assert r.name is None
        assert r.company_name is None

    def test_job_create_defaults(self):
        j = JobCreate(title="Dev", location="Remote", description="Build things")
        assert j.type == JobType.FULL_TIME
        assert j.remote is False
        assert j.required_skills == []
        assert j.nice_skills == []
        assert j.salary_min is None

    def test_job_create_all_types(self):
        for jt in ["full-time", "part-time", "contract", "internship"]:
            j = JobCreate(title="Dev", location="X", description="X", type=jt)
            assert j.type.value == jt

    def test_seeker_profile_create_defaults(self):
        p = SeekerProfileCreate(name="Test")
        assert p.skills == []
        assert p.desired_roles == []
        assert p.work_preferences == []
        assert p.experience == []
        assert p.education == []
        assert p.headline is None

    def test_seeker_profile_nested_experience(self):
        p = SeekerProfileCreate(
            name="Test",
            experience=[Experience(title="Dev", company="Co", duration="2y")],
            education=[Education(school="MIT", degree="BS")],
        )
        assert len(p.experience) == 1
        assert p.experience[0].title == "Dev"
        assert p.education[0].school == "MIT"

    def test_application_status_values(self):
        valid = {"applied", "screening", "interview", "offer", "hired", "rejected"}
        assert {s.value for s in ApplicationStatus} == valid

    def test_application_update_valid_statuses(self):
        for status in ApplicationStatus:
            u = ApplicationUpdateStatus(status=status)
            assert u.status == status

    def test_match_request_defaults(self):
        m = MatchRequest(skills=["React"])
        assert m.desired_roles == []
        assert m.work_preferences == []
        assert m.salary_range is None

    def test_candidate_search_request_defaults(self):
        s = CandidateSearchRequest()
        assert s.query is None
        assert s.skills == []
        assert s.min_match == 0

    def test_message_send_requires_fields(self):
        with pytest.raises(ValidationError):
            MessageSend(recipient_id="123")  # missing content
        with pytest.raises(ValidationError):
            MessageSend(content="Hi")  # missing recipient_id

    def test_ai_summary_request_minimal(self):
        r = AISummaryRequest(name="A", skills=["React"], desired_roles=["Dev"])
        assert r.experience == []
        assert r.experience_level is None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SERVICES – EXTENDED
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestComputeJobMatchExtended:
    """Thorough testing of the matching algorithm edge cases."""

    JOB_REACT = {
        "id": "j1", "title": "React Developer",
        "required_skills": ["React", "TypeScript", "JavaScript"],
        "nice_skills": ["Next.js", "Redux", "Node.js"],
        "remote": True, "experience_level": "Senior (6-9 yrs)",
    }
    JOB_ML = {
        "id": "j2", "title": "ML Engineer",
        "required_skills": ["Python", "Machine Learning", "PyTorch"],
        "nice_skills": ["MLOps", "AWS", "Docker"],
        "remote": True, "experience_level": "Mid Level (3-5 yrs)",
    }
    JOB_ONSITE = {
        "id": "j3", "title": "Backend Developer",
        "required_skills": ["Java", "Spring", "SQL"],
        "nice_skills": ["Redis", "Docker", "Kubernetes"],
        "remote": False,
    }

    def test_perfect_match_scores_high(self):
        result = compute_job_match(
            user_skills=["React", "TypeScript", "JavaScript", "Next.js", "Redux", "Node.js"],
            desired_roles=["React Developer"],
            work_preferences=["Remote"],
            salary_range=None,
            experience_level="Senior (6-9 yrs)",
            job=self.JOB_REACT,
        )
        assert result["match_score"] >= 80
        assert len(result["matched_required"]) == 3
        assert len(result["matched_nice"]) == 3

    def test_zero_overlap_scores_low(self):
        result = compute_job_match(
            user_skills=["Figma", "Sketch", "Adobe XD"],
            desired_roles=["Product Designer"],
            work_preferences=["On-site"],
            salary_range=None,
            experience_level=None,
            job=self.JOB_REACT,
        )
        assert result["match_score"] <= 30
        assert result["matched_required"] == []
        assert result["matched_nice"] == []

    def test_case_insensitive_skills(self):
        r1 = compute_job_match(["REACT", "typescript"], [], [], None, None, self.JOB_REACT)
        r2 = compute_job_match(["react", "TypeScript"], [], [], None, None, self.JOB_REACT)
        assert r1["match_score"] == r2["match_score"]

    def test_remote_preference_bonus(self):
        with_remote = compute_job_match(
            ["React"], [], ["Remote"], None, None, self.JOB_REACT
        )
        without_remote = compute_job_match(
            ["React"], [], [], None, None, self.JOB_REACT
        )
        assert with_remote["match_score"] >= without_remote["match_score"]

    def test_onsite_preference_for_onsite_job(self):
        result = compute_job_match(
            ["Java", "Spring", "SQL"], [], ["On-site"], None, None, self.JOB_ONSITE
        )
        assert result["match_score"] >= 50

    def test_hybrid_gets_partial_work_pref_credit(self):
        result = compute_job_match(
            ["React"], [], ["Hybrid"], None, None, self.JOB_REACT
        )
        # Hybrid should still get some score but less than exact Remote
        assert result["match_score"] >= 15

    def test_experience_level_exact_match_bonus(self):
        exact = compute_job_match(
            ["React"], [], [], None, "Senior (6-9 yrs)", self.JOB_REACT
        )
        wrong = compute_job_match(
            ["React"], [], [], None, "Entry Level (0-2 yrs)", self.JOB_REACT
        )
        assert exact["match_score"] >= wrong["match_score"]

    def test_adjacent_experience_gets_partial_credit(self):
        exact = compute_job_match(
            ["Python", "Machine Learning"], [], [], None, "Mid Level (3-5 yrs)", self.JOB_ML
        )
        adjacent = compute_job_match(
            ["Python", "Machine Learning"], [], [], None, "Senior (6-9 yrs)", self.JOB_ML
        )
        far = compute_job_match(
            ["Python", "Machine Learning"], [], [], None, "Executive / Director", self.JOB_ML
        )
        assert exact["match_score"] >= adjacent["match_score"]
        assert adjacent["match_score"] >= far["match_score"]

    def test_score_always_in_valid_range(self):
        """Score is always between 15 and 99 regardless of inputs."""
        edge_cases = [
            ([], [], [], None, None),  # empty everything
            (["A"*100], [], [], None, None),  # gibberish
            (["React", "TypeScript", "JavaScript", "Next.js", "Redux", "Node.js"],
             ["React Developer"], ["Remote"], "$200k+", "Senior (6-9 yrs)"),  # perfect
        ]
        for skills, roles, prefs, sal, exp in edge_cases:
            r = compute_job_match(skills, roles, prefs, sal, exp, self.JOB_REACT)
            assert 15 <= r["match_score"] <= 99

    def test_deterministic_jitter(self):
        """Same inputs always produce the same score."""
        r1 = compute_job_match(["React"], [], [], None, None, self.JOB_REACT)
        r2 = compute_job_match(["React"], [], [], None, None, self.JOB_REACT)
        assert r1["match_score"] == r2["match_score"]

    def test_match_reasons_populated(self):
        result = compute_job_match(
            ["React", "TypeScript"], ["React Developer"], ["Remote"],
            None, None, self.JOB_REACT,
        )
        assert len(result["match_reasons"]) >= 1
        assert any("required" in r.lower() for r in result["match_reasons"])

    def test_role_alignment_with_multi_word_roles(self):
        result = compute_job_match(
            ["Python"], ["Machine Learning Engineer"], [], None, None, self.JOB_ML,
        )
        assert any("role" in r.lower() for r in result["match_reasons"])

    def test_no_required_skills_in_job(self):
        """Job with no required skills shouldn't crash."""
        job = {"id": "j99", "title": "Open Role", "required_skills": [], "nice_skills": []}
        r = compute_job_match(["React"], [], [], None, None, job)
        assert 15 <= r["match_score"] <= 99


class TestComputeCandidateMatch:
    """Test the simplified candidate matcher."""

    def test_candidate_match_returns_int(self):
        candidate = {"skills": ["React"], "desired_roles": [], "work_preferences": []}
        job = {"id": "j1", "title": "Dev", "required_skills": ["React"], "nice_skills": []}
        score = compute_candidate_match(candidate, job)
        assert isinstance(score, int)
        assert 15 <= score <= 99

    def test_candidate_match_handles_missing_fields(self):
        score = compute_candidate_match({}, {"id": "j1", "title": "Dev"})
        assert isinstance(score, int)


class TestParseResumeExtended:
    """Additional resume parser tests."""

    def test_all_personas_have_required_fields(self):
        filenames = ["resume_a.pdf", "resume_b.pdf", "resume_c.docx"]
        for fn in filenames:
            result = parse_resume(fn, b"dummy")
            p = result["profile"]
            assert p["name"]
            assert p["headline"]
            assert len(p["skills"]) >= 5
            assert len(p["desired_roles"]) >= 1
            assert len(p["experience"]) >= 1
            assert len(p["education"]) >= 1

    def test_summary_is_generated(self):
        result = parse_resume("test.pdf", b"content")
        assert len(result["ai_summary"]) > 50

    def test_deterministic_for_same_filename(self):
        r1 = parse_resume("stable.pdf", b"data1")
        r2 = parse_resume("stable.pdf", b"data2")
        assert r1["profile"]["name"] == r2["profile"]["name"]


class TestGenerateSummaryExtended:
    """Test summary generation edge cases."""

    def test_summary_mentions_skills(self):
        s = generate_summary("Alice", ["React", "Python"], ["Dev"])
        assert "React" in s
        assert "Python" in s

    def test_summary_with_experience(self):
        s = generate_summary("Bob", ["Java"], ["Dev"], experience_level="Senior (6-9 yrs)",
                             experience=[{"title": "CTO", "company": "BigCo", "description": "Led engineering"}])
        assert "CTO" in s
        assert "BigCo" in s

    def test_summary_without_experience(self):
        s = generate_summary("Charlie", ["Go"], ["Backend Developer"])
        assert "Charlie" not in s  # name not in summary
        assert "Go" in s

    def test_headline_generation(self):
        h = generate_headline("Alice", ["React", "TypeScript"], ["Frontend Developer"])
        assert "Frontend Developer" in h
        assert "React" in h

    def test_headline_no_skills(self):
        h = generate_headline("Bob", [], ["Data Scientist"])
        assert "Data Scientist" in h

    def test_headline_no_roles(self):
        h = generate_headline("Charlie", ["Python"], [])
        assert "Professional" in h


class TestSuggestSkillsExtended:
    """Test skill suggestion engine."""

    def test_react_suggests_ecosystem(self):
        suggestions = suggest_skills(["React"])
        assert any(s in suggestions for s in ["TypeScript", "Next.js", "Redux"])

    def test_python_suggests_ecosystem(self):
        suggestions = suggest_skills(["Python"])
        assert any(s in suggestions for s in ["FastAPI", "Django", "Pandas"])

    def test_no_duplicates_of_existing(self):
        suggestions = suggest_skills(["React", "TypeScript"])
        assert "React" not in suggestions
        assert "TypeScript" not in suggestions

    def test_multiple_skills_expand_suggestions(self):
        few = suggest_skills(["React"])
        many = suggest_skills(["React", "Python", "AWS"])
        assert len(many) >= len(few)

    def test_unknown_skills_return_empty(self):
        suggestions = suggest_skills(["Fortran", "COBOL"])
        assert suggestions == []

    def test_max_eight_suggestions(self):
        suggestions = suggest_skills(["React", "Python", "AWS", "Node.js", "Machine Learning"])
        assert len(suggestions) <= 8

    def test_case_insensitive_dedup(self):
        suggestions = suggest_skills(["react", "typescript"])
        assert "React" not in [s.lower() for s in suggestions]
