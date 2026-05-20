"""
One-shot migration script: notify the Google Indexing API to drop every
jobssearch.work job URL and re-index its hyrly.ai equivalent. Run once
after the domain cutover.

Reads GOOGLE_INDEXING_CREDENTIALS + SITE_URL from the same env the
backend uses. Requires a working backend reachable at HIREFLOW_API
(default https://hireflow-api.vercel.app).
"""

from __future__ import annotations

import os
import sys
import urllib.request
import urllib.error
import json

# Make the api package importable when running from backend/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.services.indexing import notify_url, job_public_url, _slug

OLD_SITE = "https://jobssearch.work"
API_BASE = os.environ.get("HIREFLOW_API", "https://hireflow-api.vercel.app").rstrip("/")


def fetch_jobs() -> list[dict]:
    req = urllib.request.Request(f"{API_BASE}/api/jobs?limit=100")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except (urllib.error.URLError, urllib.error.HTTPError) as exc:
        print(f"Failed to fetch jobs from {API_BASE}: {exc}", file=sys.stderr)
        return []


def old_url(job: dict) -> str:
    return f"{OLD_SITE}/jobs/{_slug(job.get('title', ''))}-{job.get('id', '')}"


def main() -> int:
    jobs = fetch_jobs()
    if not jobs:
        print("No jobs returned from backend; nothing to migrate.")
        return 1

    deleted_ok = updated_ok = deleted_fail = updated_fail = 0
    for job in jobs:
        old = old_url(job)
        new = job_public_url(job)
        if notify_url(old, "URL_DELETED"):
            deleted_ok += 1
        else:
            deleted_fail += 1
        if notify_url(new, "URL_UPDATED"):
            updated_ok += 1
        else:
            updated_fail += 1

    print(f"Indexing migration complete: {len(jobs)} jobs processed.")
    print(f"  URL_DELETED on {OLD_SITE}/jobs/*: {deleted_ok} ok, {deleted_fail} failed")
    print(f"  URL_UPDATED on new domain:        {updated_ok} ok, {updated_fail} failed")
    return 0 if (deleted_fail == 0 and updated_fail == 0) else 2


if __name__ == "__main__":
    raise SystemExit(main())
