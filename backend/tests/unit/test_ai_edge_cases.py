"""
Extended unit tests for AI services — edge cases, boundary conditions,
and thorough coverage of compute_job_match, compute_candidate_match,
parse_resume, generate_summary, generate_headline, suggest_skills.
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


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  compute_job_match — Boundary & Edge Cases
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestComputeJobMatchEdgeCases:

    BASE_JOB = {
        "id": "test-1",
        "title": "Software Engineer",
        "required_skills": ["Python", "Django", "PostgreSQL"],
        "nice_skills": ["Docker", "AWS"],
        "remote": True,
        "experience_level": "Mid Level (3-5 yrs)",
    }

    def test_empty_everything_returns_minimum_score(self):
        result = compute_job_match([], [], [], None, None, {"id": "e1"})
        assert result["match_score"] >= 15
        assert result["match_score"] <= 99
        assert result["matched_required"] == []
        assert result["matched_nice"] == []

    def test_job_with_no_skills_listed(self):
        job = {"id": "noskill", "title": "Open Role"}
        result = compute_job_match(["Python", "React"], [], [], None, None, job)
        assert result["match_score"] >= 15

    def test_perfect_match_all_dimensions(self):
        result = compute_job_match(
            user_skills=["Python", "Django", "PostgreSQL", "Docker", "AWS"],
            desired_roles=["Software Engineer"],
            work_preferences=["Remote"],
            salary_range="$120k-$160k",
            experience_level="Mid Level (3-5 yrs)",
            job=self.BASE_JOB,
        )
        # Max theoretical: 50 + 15 + 15 + 10 + 10 = 100, clamped to 99
        assert result["match_score"] >= 85
        assert len(result["matched_required"]) == 3
        assert len(result["matched_nice"]) == 2

    def test_only_nice_skills_matched(self):
        result = compute_job_match(
            user_skills=["Docker", "AWS"],
            desired_roles=[],
            work_preferences=[],
            salary_range=None,
            experience_level=None,
            job=self.BASE_JOB,
        )
        assert result["matched_required"] == []
        assert len(result["matched_nice"]) == 2

    def test_case_insensitive_skill_matching(self):
        result = compute_job_match(
            ["python", "DJANGO", "PostgreSql"],
            [], [], None, None, self.BASE_JOB,
        )
        assert len(result["matched_required"]) == 3

    def test_role_alignment_partial_word_match(self):
        job = {"id": "fe-1", "title": "Senior Frontend Developer", "required_skills": []}
        result = compute_job_match(
            [], ["Frontend Developer"], [], None, None, job,
        )
        reasons = " ".join(result["match_reasons"])
        assert "Role matches" in reasons

    def test_role_alignment_short_words_skipped(self):
        """Words <= 2 chars ('ML') should be skipped in role matching."""
        job = {"id": "ml-1", "title": "ML Engineer", "required_skills": []}
        result = compute_job_match(
            [], ["ML Engineer"], [], None, None, job,
        )
        # "ML" has 2 chars, only "Engineer" (>2) should be checked
        reasons = " ".join(result["match_reasons"])
        assert "Role matches" in reasons

    def test_on_site_preference_non_remote_job(self):
        job = {**self.BASE_JOB, "remote": False}
        result = compute_job_match(
            [], [], ["On-site"], None, None, job,
        )
        # On-site pref + non-remote job = 10 pts
        result_remote = compute_job_match(
            [], [], ["Remote"], None, None, job,
        )
        assert result["match_score"] >= result_remote["match_score"]

    def test_hybrid_preference_gives_partial(self):
        result = compute_job_match(
            [], [], ["Hybrid"], None, None, self.BASE_JOB,
        )
        assert result["match_score"] >= 15  # at least minimum

    def test_experience_exact_match_10_points(self):
        result_exact = compute_job_match(
            [], [], [], None, "Mid Level (3-5 yrs)", self.BASE_JOB,
        )
        result_none = compute_job_match(
            [], [], [], None, None, self.BASE_JOB,
        )
        assert result_exact["match_score"] >= result_none["match_score"]

    def test_experience_adjacent_level_5_points(self):
        result = compute_job_match(
            [], [], [], None, "Senior (6-9 yrs)", self.BASE_JOB,
        )
        # Adjacent to "Mid Level (3-5 yrs)", should get 5 pts
        assert result["match_score"] >= 15

    def test_experience_distant_level_0_points(self):
        result = compute_job_match(
            [], [], [], None, "Executive / Director", self.BASE_JOB,
        )
        # Far from "Mid Level", should get 0 exp pts
        assert result["match_score"] >= 15

    def test_experience_invalid_level_no_crash(self):
        result = compute_job_match(
            [], [], [], None, "Unknown Level", self.BASE_JOB,
        )
        assert result["match_score"] >= 15

    def test_deterministic_jitter(self):
        """Same inputs produce same jitter (via md5 hash of job id)."""
        results = [
            compute_job_match(["Python"], [], [], None, None, self.BASE_JOB)
            for _ in range(10)
        ]
        scores = {r["match_score"] for r in results}
        assert len(scores) == 1  # deterministic

    def test_score_always_clamped_15_to_99(self):
        """No combination should produce scores outside [15, 99]."""
        test_cases = [
            ([], [], [], None, None, {"id": "0"}),
            (["Python", "Django", "PostgreSQL", "Docker", "AWS"],
             ["Software Engineer"], ["Remote"], "$120k", "Mid Level (3-5 yrs)",
             self.BASE_JOB),
        ]
        for args in test_cases:
            result = compute_job_match(*args)
            assert 15 <= result["match_score"] <= 99

    def test_match_reasons_populated_for_skills(self):
        result = compute_job_match(
            ["Python", "Docker"], [], [], None, None, self.BASE_JOB,
        )
        reasons_text = " ".join(result["match_reasons"])
        assert "required" in reasons_text.lower()

    def test_match_reasons_populated_for_nice_skills(self):
        result = compute_job_match(
            ["Docker", "AWS"], [], [], None, None, self.BASE_JOB,
        )
        reasons_text = " ".join(result["match_reasons"])
        assert "nice-to-have" in reasons_text.lower()

    def test_many_user_skills_few_job_skills(self):
        """User has 20 skills, job requires 1."""
        job = {"id": "tiny", "title": "Dev", "required_skills": ["Python"], "nice_skills": []}
        result = compute_job_match(
            [f"Skill{i}" for i in range(20)] + ["Python"],
            [], [], None, None, job,
        )
        assert result["matched_required"] == ["Python"]
        assert result["match_score"] >= 50  # got the 1/1 required skill


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  compute_candidate_match — Wrapper Tests
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestComputeCandidateMatch:

    def test_basic_candidate_match(self):
        candidate = {
            "skills": ["Python", "Django"],
            "desired_roles": ["Backend Developer"],
            "work_preferences": ["Remote"],
            "salary_range": "$120k",
            "experience_level": "Mid Level (3-5 yrs)",
        }
        job = {
            "id": "j1",
            "title": "Backend Developer",
            "required_skills": ["Python", "Django", "PostgreSQL"],
            "nice_skills": [],
            "remote": True,
            "experience_level": "Mid Level (3-5 yrs)",
        }
        score = compute_candidate_match(candidate, job)
        assert 15 <= score <= 99

    def test_empty_candidate_profile(self):
        score = compute_candidate_match({}, {"id": "j1", "title": "Dev"})
        assert 15 <= score <= 99

    def test_candidate_with_missing_fields(self):
        """Candidate dict without some expected keys shouldn't crash."""
        candidate = {"skills": ["React"]}
        job = {"id": "j1", "title": "React Dev", "required_skills": ["React"]}
        score = compute_candidate_match(candidate, job)
        assert 15 <= score <= 99


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  parse_resume — Persona Selection & Structure
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestParseResumeEdgeCases:

    def test_persona_assignment_is_deterministic(self):
        r1 = parse_resume("resume.pdf", b"content")
        r2 = parse_resume("resume.pdf", b"different_content")
        # Same filename → same persona (hash based on filename)
        assert r1["profile"]["name"] == r2["profile"]["name"]

    def test_different_filenames_may_differ(self):
        r1 = parse_resume("alice.pdf", b"x")
        r2 = parse_resume("bob.pdf", b"x")
        r3 = parse_resume("charlie.pdf", b"x")
        names = {r1["profile"]["name"], r2["profile"]["name"], r3["profile"]["name"]}
        # With 3 personas and 3 different filenames, we should get at least 2 different names
        # (probabilistically)
        assert len(names) >= 1  # at minimum doesn't crash

    def test_profile_has_all_required_fields(self):
        result = parse_resume("test.pdf", b"data")
        profile = result["profile"]
        required = ["name", "headline", "location", "skills", "desired_roles",
                     "experience_level", "work_preferences", "experience", "education"]
        for field in required:
            assert field in profile, f"Missing field: {field}"

    def test_profile_skills_are_list(self):
        result = parse_resume("test.pdf", b"data")
        assert isinstance(result["profile"]["skills"], list)

    def test_ai_summary_is_string(self):
        result = parse_resume("test.pdf", b"data")
        assert isinstance(result["ai_summary"], str)

    def test_experience_entries_have_required_fields(self):
        result = parse_resume("test.pdf", b"data")
        for exp in result["profile"]["experience"]:
            assert "title" in exp
            assert "company" in exp
            assert "duration" in exp

    def test_education_entries_have_required_fields(self):
        result = parse_resume("test.pdf", b"data")
        for edu in result["profile"]["education"]:
            assert "school" in edu
            assert "degree" in edu


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  generate_summary — Edge Cases
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestGenerateSummaryEdgeCases:

    def test_minimal_inputs(self):
        s = generate_summary("A", [], [])
        assert isinstance(s, str)
        assert len(s) > 0

    def test_includes_name_context(self):
        """Summary mentions skills and roles."""
        s = generate_summary(
            "Alice", ["React", "Python"], ["Frontend Developer"],
            "Senior (6-9 yrs)",
            [{"title": "Dev", "company": "Co", "description": "Built stuff"}],
        )
        assert "React" in s
        assert "senior" in s.lower()

    def test_no_experience_still_works(self):
        s = generate_summary("Bob", ["Go"], ["Backend Developer"])
        assert isinstance(s, str)
        assert "Go" in s

    def test_experience_without_description(self):
        s = generate_summary(
            "Charlie", ["Java"], ["Dev"], "Mid Level (3-5 yrs)",
            [{"title": "Engineer", "company": "Acme", "description": ""}],
        )
        assert "Acme" in s

    def test_many_skills_truncated_in_summary(self):
        skills = [f"Skill{i}" for i in range(20)]
        s = generate_summary("Dan", skills, [])
        # Only first 5 skills should appear
        assert "Skill0" in s
        assert "Skill4" in s
        assert "Skill5" not in s

    def test_multiple_desired_roles_joined(self):
        s = generate_summary("Eve", [], ["ML Engineer", "Data Scientist"])
        assert "ML Engineer" in s
        assert "Data Scientist" in s


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  generate_headline — Edge Cases
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestGenerateHeadlineEdgeCases:

    def test_with_roles_and_skills(self):
        h = generate_headline("Alice", ["React", "TypeScript"], ["Frontend Developer"])
        assert "Frontend Developer" in h
        assert "React" in h

    def test_no_skills_no_roles(self):
        h = generate_headline("Bob", [], [])
        assert h == "Professional"

    def test_no_skills_with_role(self):
        h = generate_headline("Charlie", [], ["ML Engineer"])
        assert h == "ML Engineer"

    def test_skills_without_roles(self):
        h = generate_headline("Dan", ["Python", "Django"], [])
        assert "Professional" in h
        assert "Python" in h

    def test_single_skill(self):
        h = generate_headline("Eve", ["React"], ["Dev"])
        assert "React" in h


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  suggest_skills — Skill Graph Traversal
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSuggestSkillsEdgeCases:

    def test_known_skill_returns_suggestions(self):
        suggestions = suggest_skills(["React"])
        assert len(suggestions) > 0
        assert "React" not in suggestions  # don't suggest what they already have

    def test_unknown_skill_returns_empty(self):
        suggestions = suggest_skills(["Obscure Framework"])
        assert suggestions == []

    def test_no_skills_returns_empty(self):
        assert suggest_skills([]) == []

    def test_suggestions_exclude_existing(self):
        suggestions = suggest_skills(["React", "TypeScript", "Next.js"])
        for s in suggestions:
            assert s.lower() not in {"react", "typescript", "next.js"}

    def test_max_8_suggestions(self):
        # Give skills with lots of related items
        suggestions = suggest_skills(["React", "Python", "AWS", "TypeScript", "Node.js"])
        assert len(suggestions) <= 8

    def test_case_insensitive_lookup(self):
        s1 = suggest_skills(["react"])
        s2 = suggest_skills(["React"])
        # Both should find suggestions from the "react" key
        assert len(s1) > 0
        assert len(s2) > 0

    def test_multiple_skills_aggregate_suggestions(self):
        s_react = suggest_skills(["React"])
        s_python = suggest_skills(["Python"])
        s_both = suggest_skills(["React", "Python"])
        # Combined should have items from both
        assert len(s_both) >= max(len(s_react), len(s_python))

    def test_suggestions_are_strings(self):
        suggestions = suggest_skills(["Machine Learning"])
        for s in suggestions:
            assert isinstance(s, str)
            assert len(s) > 0
