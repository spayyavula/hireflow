from fastapi import APIRouter, HTTPException

from api.core.database import get_hub_content, create_hub_content
from api.services.seo_ai import parse_hub_slug, generate_hub_copy

router = APIRouter(prefix="/api/seo", tags=["SEO"])


@router.get("/hub/{slug:path}")
async def get_hub(slug: str):
    """Return cached AI copy + FAQ for a hub slug; generate and cache on a miss."""
    slug = slug.strip("/").lower()
    if parse_hub_slug(slug) is None:
        raise HTTPException(status_code=400, detail="Invalid hub slug")

    cached = get_hub_content(slug)
    if cached:
        return {"slug": slug, "copy": cached["copy"], "faq": cached.get("faq_json", [])}

    generated = generate_hub_copy(slug)
    create_hub_content({
        "slug": slug,
        "copy": generated["copy"],
        "faq_json": generated["faq"],
    })
    return {"slug": slug, "copy": generated["copy"], "faq": generated["faq"]}
