from fastapi import APIRouter, Depends, Query

from api.core.config import require_user
from api.core.database import (
    get_seekers_with_skills,
    get_active_jobs,
    get_job_by_id,
    get_user_by_id,
    get_all_applications,
)
from api.models.schemas import (
    CandidateResponse,
    CandidateSearchRequest,
    RecruiterAnalytics,
)
from api.services.ai import compute_candidate_match

router = APIRouter(prefix="/api/recruiter", tags=["Recruiter"])


def _seeker_to_candidate(s: dict, score: int = 75) -> CandidateResponse:
    return CandidateResponse(
        id=s["id"],
        name=s.get("name", "Unknown"),
        headline=s.get("headline"),
        location=s.get("location"),
        skills=s.get("skills", []),
        experience_level=s.get("experience_level"),
        desired_roles=s.get("desired_roles", []),
        experience=s.get("experience", []),
        education=s.get("education", []),
        match_score=score,
        status="Active",
    )


# ── Candidate Search ──────────────────────────────────────
@router.get("/candidates", response_model=list[CandidateResponse])
async def search_candidates(
    query: str = Query(None),
    skills: str = Query(None, description="Comma-separated skill filter"),
    experience_level: str = Query(None),
    job_id: str = Query(None, description="Match candidates against a specific job"),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(require_user),
):
    """Search and rank candidates. Optionally match against a specific job."""
    seekers = get_seekers_with_skills()

    if query:
        q = query.lower()
        seekers = [
            s for s in seekers
            if q in s.get("name", "").lower()
            or any(q in sk.lower() for sk in s.get("skills", []))
            or any(q in r.lower() for r in s.get("desired_roles", []))
        ]

    if skills:
        skill_list = [s.strip().lower() for s in skills.split(",")]
        seekers = [
            s for s in seekers
            if any(sk.lower() in skill_list for sk in s.get("skills", []))
        ]

    if experience_level:
        seekers = [s for s in seekers if s.get("experience_level") == experience_level]

    target_job = get_job_by_id(job_id) if job_id else None
    if not target_job:
        active = get_active_jobs()
        target_job = active[0] if active else None

    results = []
    for s in seekers:
        score = compute_candidate_match(s, target_job) if target_job else 75
        results.append(_seeker_to_candidate(s, score))

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results[:limit]


@router.post("/candidates/search", response_model=list[CandidateResponse])
async def search_candidates_advanced(req: CandidateSearchRequest, user: dict = Depends(require_user)):
    """Advanced candidate search with structured filters."""
    seekers = get_seekers_with_skills()

    if req.query:
        q = req.query.lower()
        seekers = [
            s for s in seekers
            if q in s.get("name", "").lower()
            or any(q in sk.lower() for sk in s.get("skills", []))
        ]

    if req.skills:
        req_lower = {s.lower() for s in req.skills}
        seekers = [
            s for s in seekers
            if any(sk.lower() in req_lower for sk in s.get("skills", []))
        ]

    if req.experience_level:
        seekers = [s for s in seekers if s.get("experience_level") == req.experience_level]

    active = get_active_jobs()
    ref_job = active[0] if active else None

    results = []
    for s in seekers:
        score = compute_candidate_match(s, ref_job) if ref_job else 75
        if score < req.min_match:
            continue
        results.append(_seeker_to_candidate(s, score))

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results


# ── Pipeline ──────────────────────────────────────────────
@router.get("/pipeline", response_model=dict)
async def get_pipeline(user: dict = Depends(require_user)):
    """Get the hiring pipeline grouped by stage."""
    stages = ["applied", "screening", "interview", "offer", "hired"]
    pipeline = {stage: [] for stage in stages}

    all_apps = get_all_applications()
    for app in all_apps:
        status = app.get("status", "applied")
        if status in pipeline:
            seeker = get_user_by_id(app.get("seeker_id", "")) or {}
            job = get_job_by_id(app.get("job_id", "")) or {}
            pipeline[status].append({
                "application_id": app["id"],
                "candidate_name": seeker.get("name", "Unknown"),
                "candidate_id": app.get("seeker_id"),
                "job_title": job.get("title", "Unknown"),
                "job_id": app.get("job_id"),
                "applied_at": app.get("created_at"),
            })

    return {
        "stages": stages,
        "pipeline": pipeline,
        "total": sum(len(v) for v in pipeline.values()),
    }


# ── Analytics ─────────────────────────────────────────────
@router.get("/analytics", response_model=RecruiterAnalytics)
async def get_recruiter_analytics(user: dict = Depends(require_user)):
    """Get recruiter analytics dashboard data."""
    return RecruiterAnalytics(
        placements_ytd=23,
        revenue_ytd=412000,
        avg_time_to_fill=18,
        candidate_nps=87,
        active_searches=8,
        candidates_sourced=124,
        response_rate=73.0,
        pipeline_conversion=[
            {"stage": "Sourced → Screened", "rate": 68},
            {"stage": "Screened → Interview", "rate": 52},
            {"stage": "Interview → Offer", "rate": 38},
            {"stage": "Offer → Hired", "rate": 85},
        ],
        placements_by_month=[
            {"month": "Sep", "count": 3}, {"month": "Oct", "count": 4},
            {"month": "Nov", "count": 2}, {"month": "Dec", "count": 5},
            {"month": "Jan", "count": 4}, {"month": "Feb", "count": 5},
        ],
    )
