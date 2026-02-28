from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from api.core.config import require_user, get_current_user
from api.core.database import (
    get_user_by_id,
    get_job_by_id,
    search_jobs,
    create_job,
    update_job,
    close_job,
    get_application_by_id,
    get_application_by_job_and_seeker,
    get_applications_by_job,
    get_applications_by_seeker,
    create_application,
    update_application_status,
)
from api.models.schemas import (
    JobCreate,
    JobResponse,
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdateStatus,
    SuccessResponse,
)

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


def _format_job(job: dict) -> JobResponse:
    company = get_user_by_id(job.get("company_id", "")) or {}
    salary_display = None
    if job.get("salary_min") and job.get("salary_max"):
        salary_display = f"${job['salary_min']//1000}k–${job['salary_max']//1000}k"
    return JobResponse(
        id=job["id"],
        company_id=job.get("company_id", ""),
        company_name=company.get("company_name", "Unknown"),
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
    )


# ── List / Search Jobs ───────────────────────────────────
@router.get("", response_model=list[JobResponse])
async def list_jobs(
    search: str = Query(None, description="Search title, skills, or company"),
    remote_only: bool = Query(False),
    job_type: str = Query(None),
    limit: int = Query(50, ge=1, le=100),
):
    """List all active jobs with optional filtering."""
    jobs = search_jobs(search=search, remote_only=remote_only, job_type=job_type, limit=limit)
    return [_format_job(j) for j in jobs]


# ── External Job Search (JSearch API) ────────────────────
@router.get("/search")
async def search_external_jobs(
    query: str = Query("software engineer", description="Job search query"),
    location: str = Query("", description="Location filter"),
    remote_only: bool = Query(False),
    page: int = Query(1, ge=1),
    user=Depends(get_current_user),
):
    """Search real job postings from JSearch and optionally match against user profile."""
    from api.services.jobs_api import search_jsearch
    from api.core.config import RAPIDAPI_KEY

    if not RAPIDAPI_KEY:
        raise HTTPException(400, "External job search not configured. Set RAPIDAPI_KEY env var.")

    jobs = await search_jsearch(query, location, remote_only, page, api_key=RAPIDAPI_KEY)

    # If authenticated seeker, compute match scores
    if user and user.get("role") == "seeker":
        from api.services.ai import compute_job_match
        profile = get_user_by_id(user["id"])
        if profile:
            for job in jobs:
                match_result = compute_job_match(
                    user_skills=profile.get("skills", []),
                    desired_roles=profile.get("desired_roles", []),
                    work_preferences=profile.get("work_preferences", []),
                    salary_range=profile.get("salary_range"),
                    experience_level=profile.get("experience_level"),
                    job=job,
                )
                job["match_score"] = match_result["match_score"]
                job["match_reasons"] = match_result["match_reasons"]
                job["matched_required"] = match_result["matched_required"]
                job["matched_nice"] = match_result["matched_nice"]

    return {"jobs": jobs, "count": len(jobs)}


# ── My Applications (Seeker) — must be before /{job_id} ──
@router.get("/me/applications", response_model=list[ApplicationResponse])
async def my_applications(user: dict = Depends(require_user)):
    """Get all applications for the current seeker."""
    apps = get_applications_by_seeker(user["id"])
    results = []
    for a in apps:
        job = get_job_by_id(a["job_id"])
        results.append(ApplicationResponse(
            id=a["id"], job_id=a["job_id"], seeker_id=a["seeker_id"],
            status=a["status"], cover_letter=a.get("cover_letter"),
            job=_format_job(job) if job else None,
            created_at=a.get("created_at", ""),
        ))
    return results


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get a single job by ID."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _format_job(job)


# ── Create / Manage Jobs (Company) ────────────────────────
@router.post("", response_model=JobResponse, status_code=201)
async def create_job_endpoint(req: JobCreate, user: dict = Depends(require_user)):
    """Create a new job posting (company only)."""
    if user.get("role") != "company":
        raise HTTPException(status_code=403, detail="Only companies can create job postings")

    job_id = f"job_{uuid4().hex[:12]}"
    job = create_job({
        "id": job_id,
        "company_id": user["id"],
        **req.model_dump(),
        "type": req.type.value,
        "status": "active",
        "applicant_count": 0,
    })
    return _format_job(job)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job_endpoint(job_id: str, req: JobCreate, user: dict = Depends(require_user)):
    """Update a job posting."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("company_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your job posting")

    updated = update_job(job_id, {**req.model_dump(), "type": req.type.value})
    return _format_job({**job, **updated})


@router.delete("/{job_id}", response_model=SuccessResponse)
async def close_job_endpoint(job_id: str, user: dict = Depends(require_user)):
    """Close a job posting."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("company_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your job posting")
    close_job(job_id)
    return SuccessResponse(message="Job closed", id=job_id)


# ── Applications ──────────────────────────────────────────
@router.post("/{job_id}/apply", response_model=ApplicationResponse, status_code=201)
async def apply_to_job(job_id: str, req: ApplicationCreate, user: dict = Depends(require_user)):
    """Apply to a job (seeker only)."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") != "active":
        raise HTTPException(status_code=400, detail="Job is no longer accepting applications")

    if get_application_by_job_and_seeker(job_id, user["id"]):
        raise HTTPException(status_code=409, detail="Already applied to this job")

    app_id = f"app_{uuid4().hex[:12]}"
    app = create_application({
        "id": app_id,
        "job_id": job_id,
        "seeker_id": user["id"],
        "status": "applied",
        "cover_letter": req.cover_letter,
    })

    # Refresh job to get updated applicant_count (trigger handles increment)
    job = get_job_by_id(job_id) or job

    return ApplicationResponse(
        id=app_id,
        job_id=job_id,
        seeker_id=user["id"],
        status="applied",
        cover_letter=req.cover_letter,
        job=_format_job(job),
        created_at=app.get("created_at", ""),
    )


@router.get("/{job_id}/applications", response_model=list[ApplicationResponse])
async def get_job_applications(job_id: str, user: dict = Depends(require_user)):
    """Get all applications for a job (company/recruiter only)."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    apps = get_applications_by_job(job_id)
    return [
        ApplicationResponse(
            id=a["id"], job_id=a["job_id"], seeker_id=a["seeker_id"],
            status=a["status"], cover_letter=a.get("cover_letter"),
            created_at=a.get("created_at", ""),
        )
        for a in apps
    ]


@router.patch("/applications/{app_id}/status", response_model=ApplicationResponse)
async def update_app_status(app_id: str, req: ApplicationUpdateStatus, user: dict = Depends(require_user)):
    """Update application status (move candidate through pipeline)."""
    app = get_application_by_id(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    updated = update_application_status(app_id, req.status.value)
    job = get_job_by_id(app["job_id"])

    return ApplicationResponse(
        id=app["id"], job_id=app["job_id"], seeker_id=app["seeker_id"],
        status=updated.get("status", req.status.value),
        cover_letter=app.get("cover_letter"),
        job=_format_job(job) if job else None,
        created_at=app.get("created_at", ""),
    )



