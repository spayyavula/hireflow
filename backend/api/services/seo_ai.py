"""
SEO Hub-Copy AI Service
=======================
Generates intro copy and FAQ for long-tail hub pages.
Uses the shared LLM infrastructure; degrades to deterministic templated
copy when the LLM is unconfigured or fails.
"""

from __future__ import annotations

import logging

from api.services.llm import _call_llm, _parse_json_response

logger = logging.getLogger(__name__)


_HUB_SYSTEM = """You are an SEO content strategist for Hyrly, a job marketplace.
Given a description of a job-search hub page, write a helpful intro and FAQ.
Respond ONLY with valid JSON (no markdown fences) matching this schema:
{
  "copy": "<200-350 word intro paragraph about this job category>",
  "faq": [
    {"q": "<question>", "a": "<concise answer>"},
    {"q": "<question>", "a": "<concise answer>"},
    {"q": "<question>", "a": "<concise answer>"}
  ]
}"""


def parse_hub_slug(slug: str) -> dict | None:
    """Parse a hub slug into a descriptor, or None when the shape is invalid."""
    parts = [p for p in (slug or "").split("/") if p]
    if not parts or len(parts) > 3:
        return None

    skill = None
    city = None
    remote = False
    i = 0
    if parts[i] not in ("remote", "location"):
        skill = parts[i]
        i += 1
    if i < len(parts) and parts[i] == "remote":
        remote = True
        i += 1
    elif i < len(parts) and parts[i] == "location":
        if i + 1 >= len(parts):
            return None  # 'location' must be followed by a city
        city = parts[i + 1]
        i += 2

    if i != len(parts):
        return None  # leftover/unrecognized segments
    if skill is None and city is None and not remote:
        return None
    return {"skill": skill, "city": city, "remote": remote}


def hub_label(descriptor: dict) -> str:
    """Human-readable label, e.g. 'Remote React jobs in Austin'."""
    skill = descriptor.get("skill")
    city = descriptor.get("city")
    remote = descriptor.get("remote")
    prefix = "Remote " if remote else ""
    core = f"{skill.title()} jobs" if skill else "jobs"
    label = f"{prefix}{core}"
    if city:
        label += f" in {city.title()}"
    return label


def _fallback_copy(label: str) -> dict:
    return {
        "copy": (
            f"Explore {label} on Hyrly. We aggregate openings from multiple "
            f"providers and score every role against your skills, experience, and "
            f"work preferences so you can decide whether to apply now, build proof "
            f"first, or pivot to a better-fit path. Browse the current {label.lower()} "
            f"below and create a free account to see your personalized match score."
        ),
        "faq": [
            {"q": f"How many {label.lower()} are available?",
             "a": "Listings update continuously as employers post and close roles. The roles shown below are live right now."},
            {"q": f"Can I get matched to {label.lower()}?",
             "a": "Yes. Create a free Hyrly profile and our AI scores each role against your skills and preferences."},
            {"q": "Is Hyrly free for job seekers?",
             "a": "Yes, job seekers can search, match, and apply for free."},
        ],
    }


def generate_hub_copy(slug: str) -> dict:
    """Return {copy, faq} for a hub slug — AI-generated, with templated fallback."""
    descriptor = parse_hub_slug(slug) or {"skill": None, "city": None, "remote": False}
    label = hub_label(descriptor)
    try:
        raw = _call_llm(_HUB_SYSTEM, f"Hub page: {label}", json_mode=True)
        result = _parse_json_response(raw)
        copy = (result.get("copy") or "").strip()
        faq = result.get("faq") or []
        valid_faq = [f for f in faq if isinstance(f, dict) and f.get("q") and f.get("a")]
        if len(copy) > 50 and valid_faq:
            return {"copy": copy, "faq": valid_faq}
    except Exception as exc:
        logger.warning("Hub copy LLM generation failed, using fallback: %s", exc)
    return _fallback_copy(label)
