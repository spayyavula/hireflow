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
#  MATCHER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class MatcherMode(str, Enum):
    ANALYZE = "analyze"
    GENERATE = "generate"
    IMPROVE = "improve"


class ResumeSource(str, Enum):
    PROFILE = "profile"
    UPLOAD = "upload"


class JDSource(str, Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"


class MatcherRequest(BaseModel):
    mode: MatcherMode
    resume_source: ResumeSource
    resume_text: Optional[str] = Field(None, max_length=8000)
    jd_source: JDSource
    job_id: Optional[str] = None
    jd_text: Optional[str] = Field(None, max_length=8000)
    cover_letter: Optional[str] = Field(None, max_length=5000)


class MatcherAnalysis(BaseModel):
    overall_score: int = 0
    summary: str = ""
    strengths: list[str] = []
    gaps: list[str] = []
    keyword_matches: list[str] = []
    keyword_misses: list[str] = []
    cover_letter_score: Optional[int] = None
    cover_letter_feedback: Optional[str] = None


class MatcherResponse(BaseModel):
    id: str
    mode: MatcherMode
    analysis: Optional[MatcherAnalysis] = None
    generated_cover_letter: Optional[str] = None
    created_at: str


class MatcherHistoryItem(BaseModel):
    id: str
    mode: MatcherMode
    job_title: Optional[str] = None
    overall_score: Optional[int] = None
    created_at: str


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  FEATURE REQUESTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class FeatureCategory(str, Enum):
    JOB_SEARCH = "Job Search"
    RESUME_TOOLS = "Resume Tools"
    RECRUITER_TOOLS = "Recruiter Tools"
    COMPANY_DASHBOARD = "Company Dashboard"
    CHAT_MESSAGING = "Chat & Messaging"
    AI_FEATURES = "AI Features"
    GENERAL = "General"


class FeatureStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    SHIPPED = "shipped"


class FeatureRequestCreate(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=10, max_length=2000)
    category: FeatureCategory


class FeatureRequestResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    title: str
    description: str
    category: FeatureCategory
    status: FeatureStatus = FeatureStatus.SUBMITTED
    vote_count: int = 0
    user_has_voted: bool = False
    comment_count: int = 0
    created_at: str


class FeatureStatusUpdate(BaseModel):
    status: FeatureStatus


class FeatureCommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class FeatureCommentResponse(BaseModel):
    id: str
    feature_id: str
    user_id: str
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    content: str
    created_at: str


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


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  BLOG (Pressroom CMS)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class BlogCategory(str, Enum):
    CAREER_PLAYBOOK = "career-playbook"
    RESUME_LAB = "resume-lab"
    INTERVIEW_DECODED = "interview-decoded"
    HIRING_SIGNALS = "hiring-signals"
    COMPANY_SPOTLIGHT = "company-spotlight"
    ENGINEERING_CULTURE = "engineering-culture"
    REMOTE_WORK = "remote-work"
    AI_FUTURE_WORK = "ai-future-work"
    SALARY_COMPASS = "salary-compass"
    RECRUITER_CRAFT = "recruiter-craft"


class BlogStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class BlogPostCreate(BaseModel):
    slug: str = Field(min_length=3, max_length=200)
    title: str = Field(min_length=3, max_length=300)
    subtitle: Optional[str] = None
    body_markdown: str = Field(min_length=10)
    body_html: str = Field(min_length=10)
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    author_name: str
    author_bio: Optional[str] = None
    category: BlogCategory
    tags: list[str] = []
    related_skills: list[str] = []
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: list[str] = []
    reading_time_min: int = 5
    status: BlogStatus = BlogStatus.DRAFT
    featured: bool = False
    published_at: Optional[str] = None
    scheduled_for: Optional[str] = None


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    body_markdown: Optional[str] = None
    body_html: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    category: Optional[BlogCategory] = None
    tags: Optional[list[str]] = None
    related_skills: Optional[list[str]] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[list[str]] = None
    reading_time_min: Optional[int] = None
    status: Optional[BlogStatus] = None
    featured: Optional[bool] = None
    published_at: Optional[str] = None
    scheduled_for: Optional[str] = None


class BlogPostResponse(BaseModel):
    id: str
    slug: str
    title: str
    subtitle: Optional[str] = None
    body_html: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    author_id: Optional[str] = None
    author_name: str
    author_bio: Optional[str] = None
    category: str
    tags: list[str] = []
    related_skills: list[str] = []
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    reading_time_min: int = 5
    status: str
    featured: bool = False
    view_count: int = 0
    published_at: Optional[str] = None
    created_at: Optional[str] = None


class BlogPostListItem(BaseModel):
    id: str
    slug: str
    title: str
    subtitle: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    author_name: str
    category: str
    tags: list[str] = []
    reading_time_min: int = 5
    featured: bool = False
    view_count: int = 0
    published_at: Optional[str] = None


class BlogEnrichRequest(BaseModel):
    title: str
    body_markdown: str
    category: BlogCategory


class BlogEnrichResponse(BaseModel):
    excerpt: str
    seo_title: str
    seo_description: str
    seo_keywords: list[str] = []
    suggested_tags: list[str] = []
    related_skills: list[str] = []
    reading_time_min: int
