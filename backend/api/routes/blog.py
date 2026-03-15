"""
Pressroom Blog Routes
=====================
Public blog endpoints + admin CUD endpoints for the CLI.
"""

from __future__ import annotations

from uuid import uuid4
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from api.core.config import require_user, get_current_user
from api.core.database import (
    create_blog_post,
    get_blog_post_by_slug,
    get_blog_post_by_id,
    list_blog_posts,
    count_blog_posts,
    update_blog_post,
    delete_blog_post,
    increment_blog_view,
    get_blog_categories_with_counts,
    get_related_jobs_for_skills,
)
from api.models.schemas import (
    BlogPostCreate,
    BlogPostUpdate,
    BlogPostResponse,
    BlogPostListItem,
    BlogEnrichRequest,
    BlogEnrichResponse,
    SuccessResponse,
)

router = APIRouter(prefix="/api/blog", tags=["Blog"])

BLOG_CATEGORY_LABELS = {
    "career-playbook": "Career Playbook",
    "resume-lab": "Resume & Profile Lab",
    "interview-decoded": "Interview Decoded",
    "hiring-signals": "Hiring Signals",
    "company-spotlight": "Company Spotlight",
    "engineering-culture": "Engineering Culture",
    "remote-work": "Remote Work Atlas",
    "ai-future-work": "AI & Future of Work",
    "salary-compass": "Salary Compass",
    "recruiter-craft": "Recruiter Craft",
}


def _to_list_item(p: dict) -> BlogPostListItem:
    return BlogPostListItem(
        id=p["id"],
        slug=p["slug"],
        title=p["title"],
        subtitle=p.get("subtitle"),
        excerpt=p.get("excerpt"),
        cover_image_url=p.get("cover_image_url"),
        author_name=p.get("author_name", ""),
        category=p["category"],
        tags=p.get("tags", []),
        reading_time_min=p.get("reading_time_min", 5),
        featured=p.get("featured", False),
        view_count=p.get("view_count", 0),
        published_at=p.get("published_at"),
    )


def _to_response(p: dict) -> BlogPostResponse:
    return BlogPostResponse(
        id=p["id"],
        slug=p["slug"],
        title=p["title"],
        subtitle=p.get("subtitle"),
        body_html=p.get("body_html", ""),
        excerpt=p.get("excerpt"),
        cover_image_url=p.get("cover_image_url"),
        author_id=p.get("author_id"),
        author_name=p.get("author_name", ""),
        author_bio=p.get("author_bio"),
        category=p["category"],
        tags=p.get("tags", []),
        related_skills=p.get("related_skills", []),
        seo_title=p.get("seo_title"),
        seo_description=p.get("seo_description"),
        reading_time_min=p.get("reading_time_min", 5),
        status=p.get("status", "draft"),
        featured=p.get("featured", False),
        view_count=p.get("view_count", 0),
        published_at=p.get("published_at"),
        created_at=p.get("created_at"),
    )


# ── Public Endpoints ─────────────────────────────────────

@router.get("", response_model=list[BlogPostListItem])
async def list_posts(
    category: str = Query(None),
    tag: str = Query(None),
    featured: bool = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
):
    """List published blog posts with optional filters."""
    offset = (page - 1) * per_page
    posts = list_blog_posts(
        category=category, tag=tag, featured=featured,
        status="published", limit=per_page, offset=offset,
    )
    return [_to_list_item(p) for p in posts]


@router.get("/categories")
async def get_categories():
    """List all categories with post counts."""
    cats = get_blog_categories_with_counts()
    return [
        {**c, "label": BLOG_CATEGORY_LABELS.get(c["category"], c["category"])}
        for c in cats
    ]


@router.get("/{slug}", response_model=BlogPostResponse)
async def get_post(slug: str):
    """Get a single published blog post by slug. Increments view count."""
    post = get_blog_post_by_slug(slug)
    if not post or post.get("status") != "published":
        raise HTTPException(404, "Post not found.")
    increment_blog_view(post["id"])
    return _to_response(post)


@router.get("/{slug}/related-jobs")
async def get_related_jobs(slug: str, limit: int = Query(5, ge=1, le=10)):
    """Get active jobs whose skills match this post's related_skills."""
    post = get_blog_post_by_slug(slug)
    if not post:
        raise HTTPException(404, "Post not found.")
    jobs = get_related_jobs_for_skills(post.get("related_skills", []), limit=limit)
    return [
        {
            "id": j["id"],
            "title": j["title"],
            "company_name": j.get("company_name", ""),
            "location": j.get("location", ""),
            "remote": j.get("remote", False),
            "required_skills": j.get("required_skills", []),
        }
        for j in jobs
    ]


# ── Admin Endpoints (auth required) ─────────────────────

@router.post("/admin/posts", response_model=BlogPostResponse, status_code=201)
async def create_post(req: BlogPostCreate, user: dict = Depends(require_user)):
    """Create a new blog post (used by pressroom CLI)."""
    existing = get_blog_post_by_slug(req.slug)
    if existing:
        raise HTTPException(409, f"Post with slug '{req.slug}' already exists.")

    post_id = f"bp_{uuid4().hex[:12]}"
    row = {
        "id": post_id,
        "slug": req.slug,
        "title": req.title,
        "subtitle": req.subtitle,
        "body_markdown": req.body_markdown,
        "body_html": req.body_html,
        "excerpt": req.excerpt,
        "cover_image_url": req.cover_image_url,
        "author_id": user["id"],
        "author_name": req.author_name,
        "author_bio": req.author_bio,
        "category": req.category,
        "tags": req.tags,
        "related_skills": req.related_skills,
        "seo_title": req.seo_title,
        "seo_description": req.seo_description,
        "seo_keywords": req.seo_keywords,
        "reading_time_min": req.reading_time_min,
        "status": req.status,
        "featured": req.featured,
        "published_at": req.published_at,
        "scheduled_for": req.scheduled_for,
    }

    if req.status == "published" and not req.published_at:
        row["published_at"] = datetime.now(timezone.utc).isoformat()

    post = create_blog_post(row)
    return _to_response(post)


@router.put("/admin/posts/{slug}", response_model=BlogPostResponse)
async def update_post(slug: str, req: BlogPostUpdate, user: dict = Depends(require_user)):
    """Update an existing blog post."""
    post = get_blog_post_by_slug(slug)
    if not post:
        raise HTTPException(404, "Post not found.")

    data = req.model_dump(exclude_none=True)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    if data.get("status") == "published" and post.get("status") != "published":
        data.setdefault("published_at", datetime.now(timezone.utc).isoformat())

    updated = update_blog_post(post["id"], data)
    return _to_response(updated)


@router.post("/admin/posts/{slug}/publish", response_model=BlogPostResponse)
async def publish_post(slug: str, user: dict = Depends(require_user)):
    """Publish a draft post."""
    post = get_blog_post_by_slug(slug)
    if not post:
        raise HTTPException(404, "Post not found.")
    if post.get("status") == "published":
        raise HTTPException(400, "Post is already published.")

    data = {
        "status": "published",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    updated = update_blog_post(post["id"], data)
    return _to_response(updated)


@router.delete("/admin/posts/{slug}", response_model=SuccessResponse)
async def archive_post(slug: str, user: dict = Depends(require_user)):
    """Archive a blog post (soft delete)."""
    post = get_blog_post_by_slug(slug)
    if not post:
        raise HTTPException(404, "Post not found.")
    update_blog_post(post["id"], {"status": "archived"})
    return SuccessResponse(message="Post archived", id=post["id"])


@router.post("/admin/enrich", response_model=BlogEnrichResponse)
async def enrich_post_content(req: BlogEnrichRequest, user: dict = Depends(require_user)):
    """AI-enrich a blog post with SEO metadata and related skills."""
    from api.services.blog_ai import enrich_post
    result = enrich_post(req.title, req.body_markdown, req.category)
    return BlogEnrichResponse(**result)
