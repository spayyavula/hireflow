from fastapi import APIRouter, Depends

from api.core.config import require_user
from api.core.database import (
    get_jobs_by_company,
    get_seekers_with_skills,
    get_user_by_id,
)
from api.models.schemas import (
    CompanyAnalytics,
    CandidateResponse,
)
from api.services.ai import compute_candidate_match

router = APIRouter(prefix="/api/company", tags=["Company"])


@router.get("/dashboard", response_model=dict)
async def company_dashboard(user: dict = Depends(require_user)):
    """Get company dashboard overview."""
    company_jobs = get_jobs_by_company(user["id"])
    active_jobs = [j for j in company_jobs if j.get("status") == "active"]
    total_applicants = sum(j.get("applicant_count", 0) for j in active_jobs)

    return {
        "open_positions": len(active_jobs),
        "total_applicants": total_applicants,
        "avg_match_quality": 91,
        "avg_time_to_hire": 16,
        "jobs": [
            {
                "id": j["id"],
                "title": j["title"],
                "location": j.get("location", ""),
                "salary_display": (
                    f"${j.get('salary_min', 0)//1000}k–${j.get('salary_max', 0)//1000}k"
                    if j.get("salary_min") else None
                ),
                "type": j.get("type"),
                "applicant_count": j.get("applicant_count", 0),
                "status": j.get("status"),
                "created_at": j.get("created_at"),
            }
            for j in active_jobs
        ],
    }


@router.get("/candidates/recommended", response_model=list[CandidateResponse])
async def recommended_candidates(user: dict = Depends(require_user)):
    """Get AI-recommended candidates for the company's open positions."""
    company_jobs = [j for j in get_jobs_by_company(user["id"]) if j.get("status") == "active"]
    seekers = get_seekers_with_skills()

    results = []
    seen = set()

    for job in company_jobs:
        for s in seekers:
            if s["id"] in seen:
                continue
            score = compute_candidate_match(s, job)
            if score >= 60:
                seen.add(s["id"])
                results.append(CandidateResponse(
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
                ))

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results[:20]


@router.get("/analytics", response_model=CompanyAnalytics)
async def company_analytics(user: dict = Depends(require_user)):
    """Get company hiring analytics."""
    company_jobs = get_jobs_by_company(user["id"])
    active = [j for j in company_jobs if j.get("status") == "active"]
    total_apps = sum(j.get("applicant_count", 0) for j in active)

    return CompanyAnalytics(
        open_positions=len(active),
        total_applicants=total_apps,
        avg_match_quality=91.0,
        avg_time_to_hire=16,
        cost_per_hire=3200,
        offer_acceptance_rate=92.0,
        hires_by_department=[
            {"department": "Engineering", "count": 12},
            {"department": "Design", "count": 4},
            {"department": "Product", "count": 6},
            {"department": "Sales", "count": 8},
            {"department": "Ops", "count": 3},
            {"department": "Marketing", "count": 5},
        ],
        diversity_metrics=[
            {"metric": "Gender Diversity", "percentage": 47},
            {"metric": "Ethnic Diversity", "percentage": 52},
            {"metric": "Age Distribution", "percentage": 68},
        ],
    )
