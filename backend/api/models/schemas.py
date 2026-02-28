from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ENUMS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class UserRole(str, Enum):
    SEEKER = "seeker"
    RECRUITER = "recruiter"
    COMPANY = "company"


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"


class JobStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"


class JobType(str, Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTH
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    role: UserRole
    name: Optional[str] = None
    company_name: Optional[str] = None  # required for company role


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class UserPublic(BaseModel):
    id: str
    email: str
    role: UserRole
    name: Optional[str] = None
    company_name: Optional[str] = None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SEEKER PROFILE / RESUME
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Experience(BaseModel):
    title: str
    company: str
    duration: str
    description: Optional[str] = None


class Education(BaseModel):
    school: str
    degree: str
    year: Optional[str] = None


class SeekerProfileCreate(BaseModel):
    name: str
    headline: Optional[str] = None
    location: Optional[str] = None
    skills: list[str] = []
    desired_roles: list[str] = []
    experience_level: Optional[str] = None
    work_preferences: list[str] = []  # Remote, Hybrid, On-site
    salary_range: Optional[str] = None
    industries: list[str] = []
    experience: list[Experience] = []
    education: list[Education] = []
    summary: Optional[str] = None


class SeekerProfileResponse(SeekerProfileCreate):
    id: str
    email: str
    ai_summary: Optional[str] = None
    profile_strength: str = "Good"
    created_at: str


class ResumeUploadResponse(BaseModel):
    message: str
    parsed_profile: dict
    ai_summary: str
    skills_extracted: int
    experience_extracted: int


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JOBS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class JobCreate(BaseModel):
    title: str
    location: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    type: JobType = JobType.FULL_TIME
    remote: bool = False
    description: str
    required_skills: list[str] = []
    nice_skills: list[str] = []
    experience_level: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    company_id: str
    company_name: Optional[str] = None
    title: str
    location: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_display: Optional[str] = None
    type: str
    remote: bool
    description: str
    required_skills: list[str]
    nice_skills: list[str]
    experience_level: Optional[str] = None
    status: str
    applicant_count: int = 0
    created_at: str


class JobMatchResponse(JobResponse):
    match_score: int = 0
    matched_required: list[str] = []
    matched_nice: list[str] = []
    match_reasons: list[str] = []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  APPLICATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    seeker_id: str
    status: ApplicationStatus
    cover_letter: Optional[str] = None
    job: Optional[JobResponse] = None
    created_at: str


class ApplicationUpdateStatus(BaseModel):
    status: ApplicationStatus


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CANDIDATES (recruiter/company view of seekers)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class CandidateResponse(BaseModel):
    id: str
    name: str
    headline: Optional[str] = None
    location: Optional[str] = None
    skills: list[str] = []
    experience_level: Optional[str] = None
    desired_roles: list[str] = []
    experience: list[Experience] = []
    education: list[Education] = []
    match_score: int = 0
    status: str = "Active"


class CandidateSearchRequest(BaseModel):
    query: Optional[str] = None
    skills: list[str] = []
    roles: list[str] = []
    experience_level: Optional[str] = None
    location: Optional[str] = None
    min_match: int = 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CHAT / MESSAGES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class MessageSend(BaseModel):
    recipient_id: str
    content: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: Optional[str] = None
    content: str
    read: bool = False
    created_at: str


class ConversationResponse(BaseModel):
    id: str
    participants: list[str]
    participant_names: dict[str, str] = {}
    last_message: Optional[str] = None
    last_message_at: Optional[str] = None
    unread_count: int = 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ANALYTICS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SeekerAnalytics(BaseModel):
    total_applications: int = 0
    avg_match_score: float = 0
    strong_matches: int = 0  # 80%+
    profile_views: int = 0
    interview_invites: int = 0
    skills_in_demand: list[dict] = []  # [{skill, job_count}]
    match_distribution: list[dict] = []  # [{company, score}]
    application_timeline: list[dict] = []  # [{week, count}]


class RecruiterAnalytics(BaseModel):
    placements_ytd: int = 0
    revenue_ytd: float = 0
    avg_time_to_fill: int = 0
    candidate_nps: int = 0
    active_searches: int = 0
    candidates_sourced: int = 0
    response_rate: float = 0
    pipeline_conversion: list[dict] = []
    placements_by_month: list[dict] = []


class CompanyAnalytics(BaseModel):
    open_positions: int = 0
    total_applicants: int = 0
    avg_match_quality: float = 0
    avg_time_to_hire: int = 0
    cost_per_hire: float = 0
    offer_acceptance_rate: float = 0
    hires_by_department: list[dict] = []
    diversity_metrics: list[dict] = []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI / MATCHING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class AISummaryRequest(BaseModel):
    name: str
    skills: list[str]
    desired_roles: list[str]
    experience_level: Optional[str] = None
    experience: list[Experience] = []


class AISummaryResponse(BaseModel):
    summary: str
    suggested_headline: str
    suggested_skills: list[str] = []


class MatchRequest(BaseModel):
    skills: list[str]
    desired_roles: list[str] = []
    work_preferences: list[str] = []
    salary_range: Optional[str] = None
    experience_level: Optional[str] = None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  GENERIC
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SuccessResponse(BaseModel):
    message: str
    id: Optional[str] = None


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int = 1
    per_page: int = 20
