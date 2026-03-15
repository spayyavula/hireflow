"""
HireFlow Matcher Routes
=======================
Resume & Cover Letter vs Job Description matching powered by LLM.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from api.core.config import require_user
from api.core.database import (
    get_user_by_id,
    get_job_by_id,
    create_matcher_analysis,
    get_matcher_analyses_by_seeker,
    get_matcher_analysis_by_id,
)
from api.models.schemas import (
    MatcherRequest,
    MatcherResponse,
    MatcherAnalysis,
    MatcherHistoryItem,
)

router = APIRouter(prefix="/api/matcher", tags=["Matcher"])


# ── Helpers ───────────────────────────────────────────────
def _profile_to_resume_text(user: dict) -> str:
    """Reconstruct plain-text resume from a user's profile fields."""
    parts = []
    if user.get("name"):
        parts.append(user["name"])
    if user.get("headline"):
        parts.append(user["headline"])
    if user.get("location"):
        parts.append(user["location"])
    if user.get("summary") or user.get("ai_summary"):
        parts.append(f"\nSummary:\n{user.get('summary') or user.get('ai_summary')}")
    if user.get("skills"):
        parts.append(f"\nSkills: {', '.join(user['skills'])}")
    for exp in user.get("experience", []):
        line = f"\n- {exp.get('title', '')} at {exp.get('company', '')}"
        if exp.get("duration"):
            line += f" ({exp['duration']})"
        if exp.get("description"):
            line += f": {exp['description']}"
        parts.append(line)
    for edu in user.get("education", []):
        line = f"\n- {edu.get('degree', '')}"
        if edu.get("school"):
            line += f", {edu['school']}"
        if edu.get("year"):
            line += f" ({edu['year']})"
        parts.append(line)
    return "\n".join(parts)


def _job_to_jd_text(job: dict) -> str:
    """Reconstruct plain-text JD from a job record."""
    parts = [job.get("title", "")]
    if job.get("location"):
        parts.append(f"Location: {job['location']}")
    if job.get("description"):
        parts.append(f"\n{job['description']}")
    if job.get("required_skills"):
        parts.append(f"\nRequired Skills: {', '.join(job['required_skills'])}")
    if job.get("nice_skills"):
        parts.append(f"Nice to Have: {', '.join(job['nice_skills'])}")
    if job.get("experience_level"):
        parts.append(f"Experience Level: {job['experience_level']}")
    return "\n".join(parts)


def _resolve_inputs(req: MatcherRequest, user: dict) -> tuple[str, str]:
    """Resolve resume text and JD text from the request sources."""
    # Resume
    if req.resume_source == "profile":
        u = get_user_by_id(user["id"])
        if not u or not u.get("skills"):
            raise HTTPException(400, "Complete your profile first to use saved profile as resume source.")
        resume_text = _profile_to_resume_text(u)
    else:
        if not req.resume_text or not req.resume_text.strip():
            raise HTTPException(400, "resume_text is required when resume_source is 'upload'.")
        resume_text = req.resume_text

    # JD
    if req.jd_source == "internal":
        if not req.job_id:
            raise HTTPException(400, "job_id is required when jd_source is 'internal'.")
        job = get_job_by_id(req.job_id)
        if not job:
            raise HTTPException(404, "Job not found.")
        jd_text = _job_to_jd_text(job)
    else:
        if not req.jd_text or not req.jd_text.strip():
            raise HTTPException(400, "jd_text is required when jd_source is 'external'.")
        jd_text = req.jd_text

    return resume_text, jd_text


# ── Endpoints ────────────────────────────────────────────
@router.post("/analyze", response_model=MatcherResponse)
async def analyze_match(req: MatcherRequest, user: dict = Depends(require_user)):
    """Analyze how well a resume and optional cover letter match a job description."""
    if req.mode not in ("analyze",):
        raise HTTPException(400, "Use mode 'analyze' for this endpoint.")

    resume_text, jd_text = _resolve_inputs(req, user)

    from api.services.llm import analyze_match as llm_analyze
    try:
        result = await asyncio.to_thread(
            llm_analyze, resume_text, jd_text, req.cover_letter
        )
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception:
        raise HTTPException(502, "AI analysis failed. Please try again.")

    analysis_id = f"ma_{uuid4().hex[:12]}"
    row = {
        "id": analysis_id,
        "seeker_id": user["id"],
        "mode": req.mode,
        "jd_source": req.jd_source,
        "job_id": req.job_id if req.jd_source == "internal" else None,
        "jd_text": jd_text[:8000],
        "resume_snapshot": resume_text[:8000],
        "result": {**result, "generated_cover_letter": None},
    }
    create_matcher_analysis(row)

    return MatcherResponse(
        id=analysis_id,
        mode=req.mode,
        analysis=MatcherAnalysis(**result),
        generated_cover_letter=None,
        created_at=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/generate", response_model=MatcherResponse)
async def generate_or_improve(req: MatcherRequest, user: dict = Depends(require_user)):
    """Generate or improve a cover letter based on resume and job description."""
    if req.mode not in ("generate", "improve"):
        raise HTTPException(400, "Use mode 'generate' or 'improve' for this endpoint.")

    resume_text, jd_text = _resolve_inputs(req, user)

    from api.services.llm import generate_cover_letter, improve_cover_letter
    try:
        if req.mode == "improve":
            if not req.cover_letter or not req.cover_letter.strip():
                raise HTTPException(400, "cover_letter is required for 'improve' mode.")
            cover_text = await asyncio.to_thread(
                improve_cover_letter, resume_text, jd_text, req.cover_letter
            )
        else:
            cover_text = await asyncio.to_thread(
                generate_cover_letter, resume_text, jd_text
            )
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, "AI generation failed. Please try again.")

    analysis_id = f"ma_{uuid4().hex[:12]}"
    row = {
        "id": analysis_id,
        "seeker_id": user["id"],
        "mode": req.mode,
        "jd_source": req.jd_source,
        "job_id": req.job_id if req.jd_source == "internal" else None,
        "jd_text": jd_text[:8000],
        "resume_snapshot": resume_text[:8000],
        "result": {"generated_cover_letter": cover_text},
    }
    create_matcher_analysis(row)

    return MatcherResponse(
        id=analysis_id,
        mode=req.mode,
        analysis=None,
        generated_cover_letter=cover_text,
        created_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/history", response_model=list[MatcherHistoryItem])
async def get_history(
    user: dict = Depends(require_user),
    limit: int = Query(10, ge=1, le=50),
):
    """Get the current seeker's matcher analysis history."""
    rows = get_matcher_analyses_by_seeker(user["id"], limit=limit)
    items = []
    for r in rows:
        result = r.get("result", {})
        job_title = None
        if r.get("job_id"):
            job = get_job_by_id(r["job_id"])
            if job:
                job_title = job.get("title")
        items.append(MatcherHistoryItem(
            id=r["id"],
            mode=r["mode"],
            job_title=job_title,
            overall_score=result.get("overall_score"),
            created_at=r.get("created_at", ""),
        ))
    return items


@router.get("/history/{analysis_id}", response_model=MatcherResponse)
async def get_analysis(analysis_id: str, user: dict = Depends(require_user)):
    """Get a specific past analysis result."""
    row = get_matcher_analysis_by_id(analysis_id)
    if not row:
        raise HTTPException(404, "Analysis not found.")
    if row.get("seeker_id") != user["id"]:
        raise HTTPException(403, "Access denied.")

    result = row.get("result", {})
    analysis = None
    generated_cl = result.get("generated_cover_letter")

    if row["mode"] == "analyze":
        analysis = MatcherAnalysis(
            overall_score=result.get("overall_score", 0),
            summary=result.get("summary", ""),
            strengths=result.get("strengths", []),
            gaps=result.get("gaps", []),
            keyword_matches=result.get("keyword_matches", []),
            keyword_misses=result.get("keyword_misses", []),
            cover_letter_score=result.get("cover_letter_score"),
            cover_letter_feedback=result.get("cover_letter_feedback"),
        )

    return MatcherResponse(
        id=row["id"],
        mode=row["mode"],
        analysis=analysis,
        generated_cover_letter=generated_cl,
        created_at=row.get("created_at", ""),
    )
