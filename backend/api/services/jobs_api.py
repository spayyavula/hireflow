"""
External job API clients for fetching real job postings from RapidAPI.
Supports JSearch and Jobs API providers. Transforms external data to
HireFlow's internal job schema so the existing compute_job_match()
scoring works unchanged.
"""

import asyncio
import re
import httpx
from typing import Optional

JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"
JOBS_API_URL = "https://jobs-api14.p.rapidapi.com/v2/list"
LINKEDIN_URL = "https://fresh-linkedin-scraper-api.p.rapidapi.com/api/v1/job/search"
INDEED_URL = "https://indeed-jobs-api.p.rapidapi.com/indeed-us/"
JOBS_SEARCH_URL = "https://jobs-search-api.p.rapidapi.com/getjobs"


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
        if resp.status_code == 403:
            raise ValueError("Invalid or expired RapidAPI key. Check your RAPIDAPI_KEY.")
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
    highlights = raw.get("job_highlights") or {}
    quals = highlights.get("Qualifications") or []

    # Also check the description for skills if qualifications are sparse
    text_sources = list(quals)
    if len(quals) < 3:
        desc = raw.get("job_description", "")
        if desc:
            text_sources.append(desc)

    return _extract_skills_from_text(" ".join(text_sources))


# ── Jobs API (jobs-api14) ────────────────────────────────


async def search_jobs_api(
    query: str,
    location: str = "",
    remote_only: bool = False,
    page: int = 1,
    api_key: str = "",
) -> list[dict]:
    """Fetch jobs from Jobs API (jobs-api14) and transform to internal schema."""
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "jobs-api14.p.rapidapi.com",
    }
    params: dict[str, str] = {
        "query": query,
        "page": str(page),
    }
    if location:
        params["location"] = location
    if remote_only:
        params["remoteOnly"] = "true"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(JOBS_API_URL, headers=headers, params=params)
        if resp.status_code == 403:
            raise ValueError("Invalid or expired RapidAPI key for Jobs API.")
        resp.raise_for_status()
        data = resp.json()

    jobs_list = data.get("jobs", [])
    return [_transform_jobs_api(j) for j in jobs_list]


def _transform_jobs_api(raw: dict) -> dict:
    """Transform Jobs API response to HireFlow internal job schema."""
    location = raw.get("location", "")
    is_remote = bool(
        raw.get("workType", "").lower() in ("remote", "work from home")
        or "remote" in location.lower()
    )
    if is_remote and not location:
        location = "Remote"

    salary_min = None
    salary_max = None
    salary_str = raw.get("salaryRange", "") or ""
    if salary_str:
        nums = re.findall(r"[\d,]+", salary_str.replace(",", ""))
        nums = [int(n) for n in nums if n]
        if len(nums) >= 2:
            salary_min, salary_max = nums[0], nums[1]
        elif len(nums) == 1:
            salary_min = nums[0]

    description = raw.get("description", "")

    return {
        "id": raw.get("id", ""),
        "title": raw.get("title", ""),
        "company": raw.get("company", ""),
        "company_logo": None,
        "location": location,
        "remote": is_remote,
        "description": description,
        "employment_type": raw.get("employmentType", ""),
        "posted_at": raw.get("datePosted", ""),
        "apply_link": raw.get("jobProviders", [{}])[0].get("url", "") if raw.get("jobProviders") else "",
        "salary_min": salary_min,
        "salary_max": salary_max,
        "required_skills": _extract_skills_from_text(description),
        "nice_skills": [],
        "experience_level": raw.get("experienceLevel", ""),
        "source": "jobs_api",
    }


def _extract_skills_from_text(text: str) -> list[str]:
    """Extract skills from plain text description."""
    if not text:
        return []
    skills: list[str] = []
    text_lower = text.lower()
    for skill in _KNOWN_SKILLS:
        if skill in text_lower:
            canonical = _canonical_skill_name(skill)
            if canonical not in skills:
                skills.append(canonical)
    return skills[:10]


def _canonical_skill_name(skill: str) -> str:
    """Return properly-cased skill name."""
    overrides = {
        "aws": "AWS", "gcp": "GCP", "sql": "SQL", "css": "CSS",
        "html": "HTML", "ci/cd": "CI/CD", "graphql": "GraphQL",
        "node.js": "Node.js", "next.js": "Next.js",
        "postgresql": "PostgreSQL", "mongodb": "MongoDB",
        "fastapi": "FastAPI", "pytorch": "PyTorch",
        "tensorflow": "TensorFlow", "c#": "C#", ".net": ".NET",
        "elasticsearch": "Elasticsearch",
    }
    return overrides.get(skill, skill.title())


# ── LinkedIn Jobs (Fresh LinkedIn Scraper) ───────────────


async def search_linkedin(
    query: str,
    location: str = "",
    remote_only: bool = False,
    page: int = 1,
    api_key: str = "",
) -> list[dict]:
    """Fetch jobs from LinkedIn via Fresh LinkedIn Scraper API."""
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "fresh-linkedin-scraper-api.p.rapidapi.com",
    }
    params: dict[str, str] = {
        "keyword": query,
        "page": str(page),
        "sort_by": "recent",
    }
    if location:
        params["keyword"] = f"{query} {location}"
    if remote_only:
        params["remote"] = "remote"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(LINKEDIN_URL, headers=headers, params=params)
        if resp.status_code == 403:
            raise ValueError("Invalid or expired RapidAPI key for LinkedIn API.")
        resp.raise_for_status()
        data = resp.json()

    return [_transform_linkedin(j) for j in data.get("data", [])]


def _transform_linkedin(raw: dict) -> dict:
    """Transform LinkedIn job response to HireFlow internal schema."""
    company = raw.get("company") or {}
    logo = None
    logos = company.get("logo") or []
    if logos and isinstance(logos, list):
        logo = logos[0].get("url")

    location = raw.get("location", "")
    is_remote = "remote" in location.lower()

    return {
        "id": raw.get("id", ""),
        "title": raw.get("title", ""),
        "company": company.get("name", ""),
        "company_logo": logo,
        "location": location,
        "remote": is_remote,
        "description": "",
        "employment_type": "",
        "posted_at": raw.get("listed_at", ""),
        "apply_link": raw.get("url", ""),
        "salary_min": None,
        "salary_max": None,
        "required_skills": [],
        "nice_skills": [],
        "experience_level": "",
        "source": "linkedin",
    }


# ── Indeed Jobs ──────────────────────────────────────────


async def search_indeed(
    query: str,
    location: str = "",
    remote_only: bool = False,
    page: int = 1,
    api_key: str = "",
) -> list[dict]:
    """Fetch jobs from Indeed Jobs API."""
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "indeed-jobs-api.p.rapidapi.com",
    }
    offset = (page - 1) * 10
    search_query = f"{query} remote" if remote_only else query
    params: dict[str, str] = {
        "keyword": search_query,
        "location": location or "usa",
        "offset": str(offset),
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(INDEED_URL, headers=headers, params=params)
        if resp.status_code == 403:
            raise ValueError("Invalid or expired RapidAPI key for Indeed API.")
        resp.raise_for_status()
        data = resp.json()

    jobs_list = data if isinstance(data, list) else data.get("results", [])
    return [_transform_indeed(j) for j in jobs_list]


def _transform_indeed(raw: dict) -> dict:
    """Transform Indeed job response to HireFlow internal schema."""
    location = raw.get("job_location", "")
    is_remote = "remote" in location.lower()
    title = raw.get("job_title", "")

    salary_min = None
    salary_max = None
    salary_str = raw.get("salary", "") or ""
    if salary_str:
        nums = re.findall(r"[\d,]+", salary_str.replace(",", ""))
        nums = [int(n) for n in nums if n]
        if len(nums) >= 2:
            salary_min, salary_max = nums[0], nums[1]
        elif len(nums) == 1:
            salary_min = nums[0]

    return {
        "id": raw.get("job_url", title),
        "title": title,
        "company": raw.get("company_name", ""),
        "company_logo": raw.get("company_logo_url"),
        "location": location,
        "remote": is_remote,
        "description": "",
        "employment_type": "",
        "posted_at": raw.get("date", ""),
        "apply_link": raw.get("job_url", ""),
        "salary_min": salary_min,
        "salary_max": salary_max,
        "required_skills": [],
        "nice_skills": [],
        "experience_level": "",
        "source": "indeed",
    }


# ── Jobs Search API (multi-board aggregator) ─────────────


async def search_jobs_search_api(
    query: str,
    location: str = "",
    remote_only: bool = False,
    page: int = 1,
    api_key: str = "",
) -> list[dict]:
    """Fetch jobs from Jobs Search API (multi-board aggregator)."""
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "jobs-search-api.p.rapidapi.com",
        "Content-Type": "application/json",
    }
    body = {
        "search_term": query,
        "location": location or "united states",
        "results_wanted": 10,
        "page": page,
    }
    if remote_only:
        body["is_remote"] = True

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(JOBS_SEARCH_URL, headers=headers, json=body)
        if resp.status_code == 403:
            raise ValueError("Invalid or expired RapidAPI key for Jobs Search API.")
        resp.raise_for_status()
        data = resp.json()

    jobs_list = data.get("jobs", []) if isinstance(data, dict) else data if isinstance(data, list) else []
    return [_transform_jobs_search(j) for j in jobs_list]


def _transform_jobs_search(raw: dict) -> dict:
    """Transform Jobs Search API response to HireFlow internal schema."""
    location = raw.get("location", "") or raw.get("job_location", "")
    is_remote = bool(
        raw.get("is_remote")
        or "remote" in location.lower()
    )
    description = raw.get("description", "") or raw.get("job_description", "")

    salary_min = raw.get("min_amount") or raw.get("salary_min")
    salary_max = raw.get("max_amount") or raw.get("salary_max")

    return {
        "id": raw.get("id", raw.get("job_url", "")),
        "title": raw.get("title", "") or raw.get("job_title", ""),
        "company": raw.get("company_name", "") or raw.get("company", ""),
        "company_logo": raw.get("company_logo") or raw.get("company_logo_url"),
        "location": location,
        "remote": is_remote,
        "description": description[:500] if description else "",
        "employment_type": raw.get("job_type", ""),
        "posted_at": raw.get("date_posted", "") or raw.get("date", ""),
        "apply_link": raw.get("job_url", "") or raw.get("url", ""),
        "salary_min": salary_min,
        "salary_max": salary_max,
        "required_skills": _extract_skills_from_text(description) if description else [],
        "nice_skills": [],
        "experience_level": "",
        "source": "jobs_search",
    }


# ── Combined multi-provider search ──────────────────────


async def search_all_providers(
    query: str,
    location: str = "",
    remote_only: bool = False,
    page: int = 1,
    api_key: str = "",
) -> list[dict]:
    """Fetch jobs from all 5 providers concurrently and merge results."""
    tasks = [
        asyncio.create_task(_safe_search(fn, query, location, remote_only, page, api_key))
        for fn in [search_jsearch, search_jobs_api, search_linkedin, search_indeed, search_jobs_search_api]
    ]

    all_results = await asyncio.gather(*tasks)

    # Merge all results, deduplicated by title+company
    seen: set[tuple] = set()
    merged: list[dict] = []
    for provider_results in all_results:
        for job in provider_results:
            key = (job.get("title", "").lower().strip(), job.get("company", "").lower().strip())
            if key not in seen:
                seen.add(key)
                merged.append(job)

    return merged


async def _safe_search(search_fn, query, location, remote_only, page, api_key) -> list[dict]:
    """Call a search function, returning empty list on failure instead of crashing."""
    try:
        return await search_fn(
            query=query,
            location=location,
            remote_only=remote_only,
            page=page,
            api_key=api_key,
        )
    except Exception:
        return []
