"""LP1: POST /api/triage — accepts the 10-question Triage answers,
generates a deterministic priority plan, persists, returns the plan.

No auth required — anonymous submissions are the primary path for
homepage Triage."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

import api.core.database as _db
from api.models.schemas import TriageAnswers, TriageResponse
from api.services.triage import generate_plan


router = APIRouter(prefix="/api/triage", tags=["Triage"])


@router.post("", response_model=TriageResponse)
def submit_triage(answers: TriageAnswers) -> TriageResponse:
    plan = generate_plan(answers)
    try:
        result = (
            _db.supabase.table("triage_responses")
            .insert({
                "user_id": None,
                "answers": answers.model_dump(),
                "plan": plan.model_dump(),
            })
            .execute()
        )
    except Exception as exc:
        # Don't leak the supabase error; surface a generic 503.
        raise HTTPException(
            status_code=503,
            detail="Triage service temporarily unavailable.",
        ) from exc

    if not result.data:
        raise HTTPException(
            status_code=503,
            detail="Triage service temporarily unavailable.",
        )

    triage_id = str(result.data[0]["id"])
    return TriageResponse(triage_id=triage_id, plan=plan)
