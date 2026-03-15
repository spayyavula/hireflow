"""
HireFlow Feature Requests Routes
=================================
Public feature request board with voting and comments.
"""

from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from api.core.config import require_user, get_current_user
from api.core.database import (
    get_user_by_id,
    create_feature_request,
    get_feature_requests,
    get_feature_request_by_id,
    update_feature_request,
    get_feature_vote,
    create_feature_vote,
    delete_feature_vote,
    get_user_votes,
    get_feature_comments,
    create_feature_comment,
    get_comment_counts,
)
from api.models.schemas import (
    FeatureRequestCreate,
    FeatureRequestResponse,
    FeatureStatusUpdate,
    FeatureCommentCreate,
    FeatureCommentResponse,
    SuccessResponse,
)

router = APIRouter(prefix="/api/features", tags=["Feature Requests"])

# Admin emails — users with these emails can update feature status
ADMIN_EMAILS = {"admin@hireflow.com"}


def _enrich_feature(f: dict, user_votes: set[str], comment_counts: dict[str, int]) -> FeatureRequestResponse:
    """Enrich a raw feature_request row with user info, vote status, and comment count."""
    author = get_user_by_id(f["user_id"]) or {}
    return FeatureRequestResponse(
        id=f["id"],
        user_id=f["user_id"],
        user_name=author.get("name") or author.get("company_name") or "Anonymous",
        user_role=author.get("role"),
        title=f["title"],
        description=f["description"],
        category=f["category"],
        status=f.get("status", "submitted"),
        vote_count=f.get("vote_count", 0),
        user_has_voted=f["id"] in user_votes,
        comment_count=comment_counts.get(f["id"], 0),
        created_at=f.get("created_at", ""),
    )


# ── List Feature Requests ────────────────────────────────
@router.get("", response_model=list[FeatureRequestResponse])
async def list_features(
    category: str = Query(None, description="Filter by category"),
    status: str = Query(None, description="Filter by status"),
    sort: str = Query("votes", description="Sort by: votes, newest"),
    role: str = Query(None, description="Filter by submitter role"),
    limit: int = Query(50, ge=1, le=100),
    user=Depends(get_current_user),
):
    """List feature requests. Public endpoint — auth optional for vote status."""
    features = get_feature_requests(category=category, status=status, sort_by=sort, limit=limit)

    # Filter by submitter role in Python (simpler than joining)
    if role:
        role_filtered = []
        for f in features:
            author = get_user_by_id(f["user_id"]) or {}
            if author.get("role") == role:
                role_filtered.append(f)
        features = role_filtered

    user_votes: set[str] = set()
    if user:
        user_votes = get_user_votes(user["id"])

    feature_ids = [f["id"] for f in features]
    comment_counts = get_comment_counts(feature_ids)

    return [_enrich_feature(f, user_votes, comment_counts) for f in features]


# ── Get Single Feature Request ───────────────────────────
@router.get("/{feature_id}", response_model=FeatureRequestResponse)
async def get_feature(feature_id: str, user=Depends(get_current_user)):
    """Get a single feature request with details."""
    f = get_feature_request_by_id(feature_id)
    if not f:
        raise HTTPException(404, "Feature request not found.")

    user_votes: set[str] = set()
    if user:
        user_votes = get_user_votes(user["id"])

    comment_counts = get_comment_counts([feature_id])
    return _enrich_feature(f, user_votes, comment_counts)


# ── Create Feature Request ───────────────────────────────
@router.post("", response_model=FeatureRequestResponse, status_code=201)
async def create_feature(req: FeatureRequestCreate, user: dict = Depends(require_user)):
    """Submit a new feature request (auth required)."""
    feature_id = f"fr_{uuid4().hex[:12]}"
    row = {
        "id": feature_id,
        "user_id": user["id"],
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "status": "submitted",
        "vote_count": 0,
    }
    f = create_feature_request(row)
    return _enrich_feature(f, set(), {})


# ── Update Status (Admin Only) ──────────────────────────
@router.patch("/{feature_id}/status", response_model=FeatureRequestResponse)
async def update_status(feature_id: str, req: FeatureStatusUpdate, user: dict = Depends(require_user)):
    """Update feature request status (admin only)."""
    if user.get("email") not in ADMIN_EMAILS:
        raise HTTPException(403, "Only admins can update feature status.")

    f = get_feature_request_by_id(feature_id)
    if not f:
        raise HTTPException(404, "Feature request not found.")

    update_feature_request(feature_id, {"status": req.status})
    f["status"] = req.status

    user_votes = get_user_votes(user["id"])
    comment_counts = get_comment_counts([feature_id])
    return _enrich_feature(f, user_votes, comment_counts)


# ── Vote / Unvote ────────────────────────────────────────
@router.post("/{feature_id}/vote", response_model=SuccessResponse)
async def vote_feature(feature_id: str, user: dict = Depends(require_user)):
    """Toggle vote on a feature request. Vote if not voted, unvote if already voted."""
    f = get_feature_request_by_id(feature_id)
    if not f:
        raise HTTPException(404, "Feature request not found.")

    existing = get_feature_vote(feature_id, user["id"])
    if existing:
        delete_feature_vote(feature_id, user["id"])
        new_count = max(0, f.get("vote_count", 0) - 1)
        update_feature_request(feature_id, {"vote_count": new_count})
        return SuccessResponse(message="Vote removed", id=feature_id)
    else:
        vote_id = f"fv_{uuid4().hex[:12]}"
        create_feature_vote({"id": vote_id, "feature_id": feature_id, "user_id": user["id"]})
        new_count = f.get("vote_count", 0) + 1
        update_feature_request(feature_id, {"vote_count": new_count})
        return SuccessResponse(message="Vote added", id=feature_id)


# ── Comments ─────────────────────────────────────────────
@router.get("/{feature_id}/comments", response_model=list[FeatureCommentResponse])
async def list_comments(feature_id: str):
    """Get all comments for a feature request (public)."""
    f = get_feature_request_by_id(feature_id)
    if not f:
        raise HTTPException(404, "Feature request not found.")

    comments = get_feature_comments(feature_id)
    results = []
    for c in comments:
        author = get_user_by_id(c["user_id"]) or {}
        results.append(FeatureCommentResponse(
            id=c["id"],
            feature_id=c["feature_id"],
            user_id=c["user_id"],
            user_name=author.get("name") or author.get("company_name") or "Anonymous",
            user_role=author.get("role"),
            content=c["content"],
            created_at=c.get("created_at", ""),
        ))
    return results


@router.post("/{feature_id}/comments", response_model=FeatureCommentResponse, status_code=201)
async def add_comment(feature_id: str, req: FeatureCommentCreate, user: dict = Depends(require_user)):
    """Add a comment to a feature request (auth required)."""
    f = get_feature_request_by_id(feature_id)
    if not f:
        raise HTTPException(404, "Feature request not found.")

    comment_id = f"fc_{uuid4().hex[:12]}"
    c = create_feature_comment({
        "id": comment_id,
        "feature_id": feature_id,
        "user_id": user["id"],
        "content": req.content,
    })

    author = get_user_by_id(user["id"]) or {}
    return FeatureCommentResponse(
        id=c["id"],
        feature_id=feature_id,
        user_id=user["id"],
        user_name=author.get("name") or author.get("company_name") or "Anonymous",
        user_role=author.get("role"),
        content=c["content"],
        created_at=c.get("created_at", ""),
    )
