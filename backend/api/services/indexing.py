"""
Google Indexing API Notifier
============================
Notifies Google's Indexing API when a job posting is published or closed,
so Google for Jobs re-crawls (or drops) the job URL.

Authenticated with a service-account JSON credential supplied whole as the
GOOGLE_INDEXING_CREDENTIALS env var. When the credential is absent the
notifier is a silent no-op. Every failure is caught and logged — a
notification never raises and never blocks the job operation.
"""

from __future__ import annotations

import json
import logging
import os
import re

from api.core.config import GOOGLE_INDEXING_CREDENTIALS

logger = logging.getLogger(__name__)

SITE = os.environ.get("SITE_URL", "https://hyrly.ai")
_INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"
_SCOPE = "https://www.googleapis.com/auth/indexing"


def _slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower())
    return re.sub(r"^-+|-+$", "", s)


def job_public_url(job: dict) -> str:
    """The canonical public URL of a job posting."""
    return f"{SITE}/jobs/{_slug(job.get('title', ''))}-{job.get('id', '')}"


def notify_url(url: str, action: str) -> bool:
    """Send a urlNotifications:publish to the Google Indexing API.

    `action` is 'URL_UPDATED' or 'URL_DELETED'. Returns True on success,
    False on a no-op (unconfigured) or any failure. Never raises.
    """
    if not GOOGLE_INDEXING_CREDENTIALS:
        logger.debug("Google Indexing not configured; skipping %s for %s", action, url)
        return False
    try:
        import requests
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request as GoogleAuthRequest

        info = json.loads(GOOGLE_INDEXING_CREDENTIALS)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=[_SCOPE],
        )
        creds.refresh(GoogleAuthRequest())

        resp = requests.post(
            _INDEXING_ENDPOINT,
            headers={"Authorization": f"Bearer {creds.token}"},
            json={"url": url, "type": action},
            timeout=10,
        )
        resp.raise_for_status()
        logger.info("Google Indexing notified: %s %s", action, url)
        return True
    except Exception as exc:
        logger.warning("Google Indexing notification failed (%s %s): %s", action, url, exc)
        return False


def notify_job_published(job: dict) -> bool:
    """Notify Google that a job posting is live (URL_UPDATED)."""
    return notify_url(job_public_url(job), "URL_UPDATED")


def notify_job_removed(job: dict) -> bool:
    """Notify Google that a job posting has closed (URL_DELETED)."""
    return notify_url(job_public_url(job), "URL_DELETED")
