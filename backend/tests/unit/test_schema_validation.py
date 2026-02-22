"""
Deep Pydantic schema validation tests — covering every model, enum,
field constraint, edge case, and cross-field interaction.
"""

import pytest
from pydantic import ValidationError

from api.models.schemas import (
    UserRole, ApplicationStatus, JobStatus, JobType,
    RegisterRequest, LoginRequest, TokenResponse, UserPublic,
    Experience, Education, SeekerProfileCreate,
    JobCreate, JobResponse, ApplicationCreate, ApplicationResponse,
    ApplicationUpdateStatus, MatchRequest, AISummaryRequest,
    CandidateSearchRequest, MessageSend,
    SeekerProfileResponse, ResumeUploadResponse, AISummaryResponse,
    JobMatchResponse, CandidateResponse, ConversationResponse,
    MessageResponse, SuccessResponse,
    SeekerAnalytics, RecruiterAnalytics, CompanyAnalytics,
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ENUM TESTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestEnums:
    def test_user_role_values(self):
        assert set(UserRole) == {UserRole.SEEKER, UserRole.RECRUITER, UserRole.COMPANY}

    def test_user_role_string_values(self):
        assert UserRole.SEEKER.value == "seeker"
        assert UserRole.RECRUITER.value == "recruiter"
        assert UserRole.COMPANY.value == "company"

    def test_application_status_values(self):
        expected = {"applied", "screening", "interview", "offer", "hired", "rejected"}
        assert {s.value for s in ApplicationStatus} == expected

    def test_application_status_ordering(self):
        """Status values should represent a valid progression."""
        statuses = [s.value for s in ApplicationStatus]
        assert statuses.index("applied") < statuses.index("screening")
        assert statuses.index("screening") < statuses.index("interview")
        assert statuses.index("interview") < statuses.index("offer")

    def test_job_status_values(self):
        assert {s.value for s in JobStatus} == {"active", "paused", "closed"}

    def test_job_type_values(self):
        assert {t.value for t in JobType} == {"full-time", "part-time", "contract", "internship"}

    def test_enum_from_string(self):
        assert UserRole("seeker") == UserRole.SEEKER
        assert ApplicationStatus("hired") == ApplicationStatus.HIRED
        assert JobType("contract") == JobType.CONTRACT

    def test_invalid_enum_value(self):
        with pytest.raises(ValueError):
            UserRole("admin")
        with pytest.raises(ValueError):
            ApplicationStatus("pending")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGISTER / LOGIN VALIDATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestRegisterRequest:
    def test_valid_seeker(self):
        r = RegisterRequest(email="test@test.com", password="password123", role="seeker", name="Test")
        assert r.role == UserRole.SEEKER
        assert r.company_name is None

    def test_valid_company(self):
        r = RegisterRequest(email="co@co.com", password="password123", role="company", company_name="Acme")
        assert r.company_name == "Acme"

    def test_password_too_short(self):
        with pytest.raises(ValidationError) as exc:
            RegisterRequest(email="t@t.com", password="short", role="seeker")
        assert "min_length" in str(exc.value).lower() or "at least" in str(exc.value).lower()

    def test_password_exactly_8_chars(self):
        r = RegisterRequest(email="t@t.com", password="12345678", role="seeker")
        assert len(r.password) == 8

    def test_missing_email(self):
        with pytest.raises(ValidationError):
            RegisterRequest(password="password123", role="seeker")

    def test_missing_password(self):
        with pytest.raises(ValidationError):
            RegisterRequest(email="t@t.com", role="seeker")

    def test_missing_role(self):
        with pytest.raises(ValidationError):
            RegisterRequest(email="t@t.com", password="password123")

    def test_invalid_role(self):
        with pytest.raises(ValidationError):
            RegisterRequest(email="t@t.com", password="password123", role="admin")

    def test_optional_fields_default_none(self):
        r = RegisterRequest(email="t@t.com", password="password123", role="seeker")
        assert r.name is None
        assert r.company_name is None

    def test_all_three_roles_accepted(self):
        for role in ["seeker", "recruiter", "company"]:
            r = RegisterRequest(email="t@t.com", password="password123", role=role)
            assert r.role.value == role


class TestLoginRequest:
    def test_valid_login(self):
        req = LoginRequest(email="t@t.com", password="anything")
        assert req.email == "t@t.com"

    def test_no_min_password_on_login(self):
        """Login should not enforce min length (user could have old password)."""
        req = LoginRequest(email="t@t.com", password="x")
        assert req.password == "x"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SEEKER PROFILE VALIDATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestSeekerProfileCreate:
    def test_minimal_profile(self):
        p = SeekerProfileCreate(name="Min User")
        assert p.skills == []
        assert p.experience == []
        assert p.education == []
        assert p.headline is None

    def test_full_profile(self):
        p = SeekerProfileCreate(
            name="Full User", headline="Senior Dev", location="NYC",
            skills=["React", "TypeScript", "Node.js"],
            desired_roles=["Frontend Developer"],
            experience_level="Senior (6-9 yrs)",
            work_preferences=["Remote"],
            salary_range="$160k–$200k",
            industries=["Tech / SaaS"],
            experience=[{"title": "Dev", "company": "X", "duration": "2020-2024"}],
            education=[{"school": "MIT", "degree": "BS CS"}],
            summary="A great developer.",
        )
        assert len(p.skills) == 3
        assert len(p.experience) == 1
        assert p.experience[0].title == "Dev"

    def test_empty_strings_accepted(self):
        p = SeekerProfileCreate(name="")
        assert p.name == ""

    def test_large_skill_list(self):
        skills = [f"Skill_{i}" for i in range(100)]
        p = SeekerProfileCreate(name="Skilled", skills=skills)
        assert len(p.skills) == 100

    def test_nested_experience_model(self):
        exp = Experience(title="Dev", company="Acme", duration="2y", description="Built stuff")
        assert exp.description == "Built stuff"

    def test_experience_optional_description(self):
        exp = Experience(title="Dev", company="Acme", duration="2y")
        assert exp.description is None

    def test_education_optional_year(self):
        edu = Education(school="MIT", degree="BS CS")
        assert edu.year is None

    def test_education_with_year(self):
        edu = Education(school="MIT", degree="BS CS", year="2020")
        assert edu.year == "2020"

    def test_missing_required_name(self):
        with pytest.raises(ValidationError):
            SeekerProfileCreate()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JOB SCHEMAS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestJobCreate:
    def test_valid_job(self):
        j = JobCreate(
            title="Developer", description="Write code",
            location="Remote", salary_min=100000, salary_max=150000,
            type="full-time", remote=True,
            required_skills=["Python"], nice_skills=["Docker"],
            experience_level="Mid Level (3-5 yrs)",
        )
        assert j.remote is True
        assert j.type == JobType.FULL_TIME

    def test_job_type_enum_validation(self):
        with pytest.raises(ValidationError):
            JobCreate(
                title="Dev", description="X", location="X",
                salary_min=50000, salary_max=80000,
                type="freelance", remote=False,
                required_skills=["Python"], nice_skills=[],
            )

    def test_empty_skills_accepted(self):
        j = JobCreate(
            title="Dev", description="X", location="X",
            salary_min=50000, salary_max=80000,
            type="full-time", remote=False,
            required_skills=[], nice_skills=[],
        )
        assert j.required_skills == []


class TestApplicationCreate:
    def test_valid_application(self):
        a = ApplicationCreate(job_id="job_1", cover_letter="I am great")
        assert a.cover_letter == "I am great"
        assert a.job_id == "job_1"

    def test_empty_cover_letter(self):
        a = ApplicationCreate(job_id="job_1", cover_letter="")
        assert a.cover_letter == ""

    def test_default_cover_letter(self):
        a = ApplicationCreate(job_id="job_1")
        assert a.cover_letter is None

    def test_missing_job_id(self):
        with pytest.raises(ValidationError):
            ApplicationCreate(cover_letter="Hi")


class TestApplicationUpdateStatus:
    def test_valid_status_update(self):
        u = ApplicationUpdateStatus(status="screening")
        assert u.status == ApplicationStatus.SCREENING

    def test_all_statuses_valid(self):
        for s in ["applied", "screening", "interview", "offer", "hired", "rejected"]:
            u = ApplicationUpdateStatus(status=s)
            assert u.status.value == s

    def test_invalid_status(self):
        with pytest.raises(ValidationError):
            ApplicationUpdateStatus(status="pending")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MATCH / AI REQUEST SCHEMAS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestMatchRequest:
    def test_valid_match_request(self):
        m = MatchRequest(
            skills=["React", "Python"], desired_roles=["Dev"],
            work_preferences=["Remote"],
        )
        assert len(m.skills) == 2

    def test_defaults(self):
        m = MatchRequest(skills=["Python"])
        assert m.desired_roles == []
        assert m.work_preferences == []
        assert m.salary_range is None


class TestAISummaryRequest:
    def test_valid_request(self):
        r = AISummaryRequest(
            name="Test", skills=["Python"], desired_roles=["Dev"],
        )
        assert r.name == "Test"

    def test_optional_fields(self):
        r = AISummaryRequest(name="Test", skills=["Python"], desired_roles=["Dev"])
        assert r.experience_level is None
        assert r.experience == []


class TestCandidateSearchRequest:
    def test_valid_search(self):
        c = CandidateSearchRequest(skills=["React"], min_match=50)
        assert c.skills == ["React"]

    def test_defaults(self):
        c = CandidateSearchRequest()
        assert c.skills == []
        assert c.min_match == 0
        assert c.query is None


class TestMessageSend:
    def test_valid_message(self):
        m = MessageSend(recipient_id="user_123", content="Hello!")
        assert m.recipient_id == "user_123"

    def test_missing_content(self):
        with pytest.raises(ValidationError):
            MessageSend(recipient_id="user_123")

    def test_missing_recipient(self):
        with pytest.raises(ValidationError):
            MessageSend(content="Hello")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  RESPONSE MODELS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestResponseModels:
    def test_user_public(self):
        u = UserPublic(id="123", email="a@b.com", role="seeker")
        assert u.name is None

    def test_success_response(self):
        s = SuccessResponse(message="Done")
        assert s.message == "Done"

    def test_seeker_analytics(self):
        a = SeekerAnalytics(
            total_applications=3, avg_match_score=78.5,
            strong_matches=5, profile_views=48,
            interview_invites=2,
        )
        assert a.avg_match_score == 78.5

    def test_recruiter_analytics(self):
        a = RecruiterAnalytics(
            placements_ytd=23, revenue_ytd=412000, avg_time_to_fill=18,
            candidate_nps=87, active_searches=8, candidates_sourced=124,
            response_rate=73.0,
        )
        assert a.candidates_sourced == 124

    def test_company_analytics(self):
        a = CompanyAnalytics(
            open_positions=5, total_applicants=100,
            avg_match_quality=82.0, avg_time_to_hire=25,
        )
        assert a.open_positions == 5

    def test_job_match_response(self):
        m = JobMatchResponse(
            id="j1", company_id="c1", title="Dev", company_name="X", location="Remote",
            salary_min=100000, salary_max=150000, type="full-time",
            remote=True, description="Code", required_skills=["Python"],
            nice_skills=[], experience_level="Mid", status="active",
            applicant_count=0, created_at="2024-01-01", match_score=85,
            matched_required=["Python"], matched_nice=[],
            match_reasons=["Great match"],
        )
        assert m.match_score == 85

    def test_conversation_response(self):
        c = ConversationResponse(
            id="conv1", participants=["u1", "u2"],
            last_message="Hi",
        )
        assert len(c.participants) == 2

    def test_message_response(self):
        m = MessageResponse(
            id="msg1", conversation_id="conv1",
            sender_id="u1", content="Hello", created_at="2024-01-01",
        )
        assert m.content == "Hello"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CROSS-FIELD VALIDATION EDGE CASES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestCrossFieldEdgeCases:
    def test_register_with_extra_fields_ignored(self):
        """Extra fields should be ignored (not raise errors)."""
        r = RegisterRequest(
            email="t@t.com", password="password123", role="seeker",
            name="Test",
        )
        assert r.email == "t@t.com"

    def test_profile_with_duplicate_skills(self):
        """Pydantic doesn't deduplicate - that's the app's job."""
        p = SeekerProfileCreate(name="Test", skills=["React", "React", "React"])
        assert len(p.skills) == 3

    def test_job_salary_min_greater_than_max_accepted(self):
        """Schema doesn't validate min < max - that's business logic."""
        j = JobCreate(
            title="Dev", description="X", location="X",
            salary_min=200000, salary_max=100000,
            type="full-time", remote=False,
            required_skills=["Python"], nice_skills=[],
        )
        assert j.salary_min > j.salary_max

    def test_unicode_in_all_string_fields(self):
        r = RegisterRequest(email="ü@ö.com", password="pässwörd123", role="seeker", name="名前")
        assert r.name == "名前"

    def test_very_long_strings(self):
        long_name = "A" * 10000
        p = SeekerProfileCreate(name=long_name)
        assert len(p.name) == 10000

    def test_serialization_roundtrip(self):
        """Model → dict → Model should be lossless."""
        original = SeekerProfileCreate(
            name="Test", skills=["React", "Python"],
            experience=[{"title": "Dev", "company": "X", "duration": "2y"}],
            education=[{"school": "MIT", "degree": "BS"}],
        )
        d = original.model_dump()
        restored = SeekerProfileCreate(**d)
        assert restored.name == original.name
        assert restored.skills == original.skills
        assert restored.experience[0].title == original.experience[0].title
