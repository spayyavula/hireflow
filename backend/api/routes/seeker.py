from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query

from api.core.config import require_user
from api.core.database import (
    get_user_by_id,
    update_user,
    get_active_jobs,
    get_applications_by_seeker,
)
from api.models.schemas import (
    SeekerProfileCreate,
    SeekerProfileResponse,
    AISummaryRequest,
    AISummaryResponse,
    JobMatchResponse,
    MatchRequest,
    SeekerAnalytics,
)
from api.services.ai import (
    compute_job_match,
    parse_resume,
    generate_summary,
    generate_headline,
    suggest_skills,
)

router = APIRouter(prefix="/api/seeker", tags=["Job Seeker"])


def _user_to_profile(u: dict) -> SeekerProfileResponse:
    return SeekerProfileResponse(
        id=u["id"],
        email=u.get("email", ""),
        name=u.get("name", ""),
        headline=u.get("headline"),
        location=u.get("location"),
        skills=u.get("skills", []),
        desired_roles=u.get("desired_roles", []),
        experience_level=u.get("experience_level"),
        work_preferences=u.get("work_preferences", []),
        salary_range=u.get("salary_range"),
        industries=u.get("industries", []),
        experience=u.get("experience", []),
        education=u.get("education", []),
        summary=u.get("summary"),
        ai_summary=u.get("ai_summary"),
        profile_strength=u.get("profile_strength", "Good"),
        created_at=u.get("created_at", ""),
    )


def _calc_profile_strength(profile: dict) -> str:
    score = sum([
        bool(profile.get("skills")),
        bool(profile.get("experience")),
        bool(profile.get("education")),
        bool(profile.get("desired_roles")),
        bool(profile.get("summary") or profile.get("ai_summary")),
    ])
    if score >= 4:
        return "Strong"
    elif score >= 2:
        return "Good"
    return "Needs Work"


def _build_match_response(job: dict, match: dict, company_name: str) -> JobMatchResponse:
    salary_display = None
    if job.get("salary_min") and job.get("salary_max"):
        salary_display = f"${job['salary_min']//1000}k–${job['salary_max']//1000}k"

    return JobMatchResponse(
        id=job["id"],
        company_id=job.get("company_id", ""),
        company_name=company_name,
        title=job["title"],
        location=job.get("location", ""),
        salary_min=job.get("salary_min"),
        salary_max=job.get("salary_max"),
        salary_display=salary_display,
        type=job.get("type", "full-time"),
        remote=job.get("remote", False),
        description=job.get("description", ""),
        required_skills=job.get("required_skills", []),
        nice_skills=job.get("nice_skills", []),
        experience_level=job.get("experience_level"),
        status=job.get("status", "active"),
        applicant_count=job.get("applicant_count", 0),
        created_at=job.get("created_at", ""),
        match_score=match["match_score"],
        matched_required=match["matched_required"],
        matched_nice=match["matched_nice"],
        match_reasons=match["match_reasons"],
    )


# ── Profile ───────────────────────────────────────────────
@router.post("/profile", response_model=SeekerProfileResponse, status_code=201)
async def create_profile(profile: SeekerProfileCreate, user: dict = Depends(require_user)):
    """Create or update the seeker's profile from the resume builder wizard."""
    data = profile.model_dump()
    data["ai_summary"] = data.get("summary")
    data["profile_strength"] = _calc_profile_strength(data)

    updated = update_user(user["id"], data)
    merged = {**user, **updated}
    return _user_to_profile(merged)


@router.get("/profile", response_model=SeekerProfileResponse)
async def get_profile(user: dict = Depends(require_user)):
    """Get the current seeker's profile."""
    u = get_user_by_id(user["id"])
    if not u or not u.get("skills"):
        raise HTTPException(status_code=404, detail="Profile not yet created. Complete the resume builder first.")
    return _user_to_profile(u)


# ── Resume Upload ─────────────────────────────────────────
@router.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...), user: dict = Depends(require_user)):
    """Upload a resume file (PDF/DOCX). AI extracts profile data and returns it without saving."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed = {".pdf", ".docx"}
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(allowed)}")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10 MB.")

    result = parse_resume(file.filename, content)
    profile_data = result["profile"]
    ai_summary = result["ai_summary"]

    return {
        "message": "Resume parsed successfully",
        "parsed_profile": profile_data,
        "ai_summary": ai_summary,
        "skills_extracted": len(profile_data.get("skills", [])),
        "experience_extracted": len(profile_data.get("experience", [])),
    }


# ── AI Summary ────────────────────────────────────────────
@router.post("/ai/summary", response_model=AISummaryResponse)
async def generate_ai_summary(req: AISummaryRequest, user: dict = Depends(require_user)):
    """Generate an AI-powered professional summary from profile data."""
    summary = generate_summary(
        name=req.name,
        skills=req.skills,
        desired_roles=req.desired_roles,
        experience_level=req.experience_level,
        experience=[e.model_dump() for e in req.experience],
    )
    return AISummaryResponse(
        summary=summary,
        suggested_headline=generate_headline(req.name, req.skills, req.desired_roles),
        suggested_skills=suggest_skills(req.skills),
    )


# ── Job Matching ──────────────────────────────────────────
def _match_jobs_against_profile(user_skills, desired_roles, work_prefs, salary_range, exp_level, jobs, min_score=0, limit=50):
    results = []
    for job in jobs:
        match = compute_job_match(user_skills, desired_roles, work_prefs, salary_range, exp_level, job)
        if match["match_score"] < min_score:
            continue
        company = get_user_by_id(job.get("company_id", "")) or {}
        results.append(_build_match_response(job, match, company.get("company_name", "Unknown")))

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results[:limit]


@router.get("/jobs/matches", response_model=list[JobMatchResponse])
async def get_matched_jobs(
    user: dict = Depends(require_user),
    min_score: int = Query(0, ge=0, le=100),
    limit: int = Query(50, ge=1, le=100),
):
    """Get active jobs ranked by AI match score against the seeker's profile."""
    u = get_user_by_id(user["id"])
    if not u or not u.get("skills"):
        raise HTTPException(status_code=400, detail="Complete your profile first to get job matches.")

    return _match_jobs_against_profile(
        u.get("skills", []), u.get("desired_roles", []),
        u.get("work_preferences", []), u.get("salary_range"),
        u.get("experience_level"), get_active_jobs(), min_score, limit,
    )


@router.post("/jobs/matches", response_model=list[JobMatchResponse])
async def match_jobs_custom(req: MatchRequest):
    """Match jobs against a custom skill set (no auth required)."""
    return _match_jobs_against_profile(
        req.skills, req.desired_roles, req.work_preferences,
        req.salary_range, req.experience_level, get_active_jobs(),
    )


# ── Analytics ─────────────────────────────────────────────
@router.get("/analytics", response_model=SeekerAnalytics)
async def get_seeker_analytics(user: dict = Depends(require_user)):
    """Get analytics dashboard data for the current seeker."""
    u = get_user_by_id(user["id"])
    user_apps = get_applications_by_seeker(user["id"])
    active_jobs = get_active_jobs()

    scores = []
    for job in active_jobs:
        match = compute_job_match(
            u.get("skills", []), u.get("desired_roles", []),
            u.get("work_preferences", []), u.get("salary_range"),
            u.get("experience_level"), job,
        )
        company = get_user_by_id(job.get("company_id", "")) or {}
        scores.append({"company": company.get("company_name", "Unknown"), "score": match["match_score"]})

    avg_score = sum(s["score"] for s in scores) / max(len(scores), 1)

    # Skills demand analysis
    skills_demand = {}
    user_skills_lower = {s.lower() for s in u.get("skills", [])}
    for job in active_jobs:
        for skill in job.get("required_skills", []) + job.get("nice_skills", []):
            if skill.lower() in user_skills_lower:
                skills_demand[skill] = skills_demand.get(skill, 0) + 1

    return SeekerAnalytics(
        total_applications=len(user_apps),
        avg_match_score=round(avg_score, 1),
        strong_matches=len([s for s in scores if s["score"] >= 80]),
        profile_views=48,
        interview_invites=len([a for a in user_apps if a.get("status") in ("interview", "offer", "hired")]),
        skills_in_demand=sorted([{"skill": k, "job_count": v} for k, v in skills_demand.items()], key=lambda x: -x["job_count"])[:10],
        match_distribution=sorted(scores, key=lambda x: -x["score"]),
        application_timeline=[{"week": f"W{i+1}", "count": c} for i, c in enumerate([3, 5, 4, 8, 6, 9, 7, 12])],
    )
