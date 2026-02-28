"""
JSearch API client for fetching real job postings from RapidAPI.
Transforms external data to HireFlow's internal job schema so the
existing compute_job_match() scoring works unchanged.
"""

import httpx
from typing import Optional

JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"


async def search_jsearch(
    query: str,
    location: str = "",
    remote_only: bool = False,
    page: int = 1,
    num_pages: int = 1,
    api_key: str = "",
) -> list[dict]:
    """Fetch jobs from JSearch API and transform to internal schema."""
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    }
    params: dict[str, str] = {
        "query": query,
        "page": str(page),
        "num_pages": str(num_pages),
    }
    if location:
        params["query"] = f"{query} in {location}"
    if remote_only:
        params["remote_jobs_only"] = "true"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(JSEARCH_URL, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()

    return [_transform_job(j) for j in data.get("data", [])]


def _transform_job(raw: dict) -> dict:
    """Transform JSearch response to HireFlow internal job schema."""
    return {
        "id": raw.get("job_id", ""),
        "title": raw.get("job_title", ""),
        "company": raw.get("employer_name", ""),
        "company_logo": raw.get("employer_logo"),
        "location": _build_location(raw),
        "remote": raw.get("job_is_remote", False),
        "description": raw.get("job_description", ""),
        "employment_type": raw.get("job_employment_type", ""),
        "posted_at": raw.get("job_posted_at_datetime_utc", ""),
        "apply_link": raw.get("job_apply_link", ""),
        "salary_min": raw.get("job_min_salary"),
        "salary_max": raw.get("job_max_salary"),
        "required_skills": _extract_skills(raw),
        "nice_skills": [],
        "experience_level": (raw.get("job_required_experience") or {}).get(
            "experience_level", ""
        ),
        "source": "jsearch",
    }


def _build_location(raw: dict) -> str:
    city = raw.get("job_city", "")
    state = raw.get("job_state", "")
    if raw.get("job_is_remote"):
        return "Remote" + (f" ({city}, {state})" if city else "")
    return f"{city}, {state}" if city else "Unknown"


# Skills we try to detect in qualification text
_KNOWN_SKILLS = {
    "react", "vue", "angular", "typescript", "javascript", "python",
    "java", "go", "rust", "node.js", "sql", "postgresql", "mongodb",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "figma", "machine learning", "pytorch", "tensorflow", "git",
    "ci/cd", "graphql", "rest", "html", "css", "tailwind",
    "next.js", "fastapi", "django", "flask", "spring", "redis",
    "c#", ".net", "ruby", "php", "kafka", "elasticsearch",
}


def _extract_skills(raw: dict) -> list[str]:
    """Extract skills from job highlights or qualifications."""
    skills: list[str] = []
    highlights = raw.get("job_highlights") or {}
    quals = highlights.get("Qualifications") or []

    # Also check the description for skills if qualifications are sparse
    text_sources = list(quals)
    if len(quals) < 3:
        desc = raw.get("job_description", "")
        if desc:
            text_sources.append(desc)

    for text in text_sources:
        text_lower = text.lower()
        for skill in _KNOWN_SKILLS:
            if skill in text_lower:
                canonical = skill.title()
                # Preserve special casing
                if skill == "aws":
                    canonical = "AWS"
                elif skill == "gcp":
                    canonical = "GCP"
                elif skill == "sql":
                    canonical = "SQL"
                elif skill == "css":
                    canonical = "CSS"
                elif skill == "html":
                    canonical = "HTML"
                elif skill == "ci/cd":
                    canonical = "CI/CD"
                elif skill == "graphql":
                    canonical = "GraphQL"
                elif skill == "node.js":
                    canonical = "Node.js"
                elif skill == "next.js":
                    canonical = "Next.js"
                elif skill == "postgresql":
                    canonical = "PostgreSQL"
                elif skill == "mongodb":
                    canonical = "MongoDB"
                elif skill == "fastapi":
                    canonical = "FastAPI"
                elif skill == "pytorch":
                    canonical = "PyTorch"
                elif skill == "tensorflow":
                    canonical = "TensorFlow"
                elif skill == "c#":
                    canonical = "C#"
                elif skill == ".net":
                    canonical = ".NET"
                elif skill == "elasticsearch":
                    canonical = "Elasticsearch"

                if canonical not in skills:
                    skills.append(canonical)

    return skills[:10]  # Cap at 10
