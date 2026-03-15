"""
Pressroom Blog AI Service
=========================
AI-powered content enrichment for the blog CMS.
Uses the existing LLM infrastructure from llm.py.
"""

from __future__ import annotations

import re
from typing import Optional

from api.services.llm import _call_llm, _parse_json_response


_ENRICH_SYSTEM = """You are an expert content strategist for a job marketplace called JobsSearch.
Given a blog post's markdown content, generate SEO-optimized metadata.
Respond ONLY with valid JSON matching this exact schema (no markdown fences):
{
  "excerpt": "<2-3 sentence compelling summary>",
  "seo_title": "<60 char max SEO title>",
  "seo_description": "<155 char max meta description>",
  "seo_keywords": ["<keyword1>", "<keyword2>", ...],
  "suggested_tags": ["<tag1>", "<tag2>", ...],
  "related_skills": ["<skill1>", "<skill2>", ...]
}
The related_skills should be professional skills mentioned or implied in the content
(e.g., React, Python, Leadership, Data Analysis) that could match against job listings."""

_SUGGEST_SYSTEM = """You are a content strategist for JobsSearch, a job marketplace.
Given data about active jobs and trending skills, suggest blog topics that would attract
job seekers searching for in-demand skills.
Respond ONLY with valid JSON matching this schema (no markdown fences):
{
  "suggestions": [
    {
      "title": "<suggested blog post title>",
      "category": "<one of: career-playbook, resume-lab, interview-decoded, hiring-signals, company-spotlight, remote-work, ai-future-work, salary-compass, recruiter-craft>",
      "rationale": "<why this topic would attract traffic>",
      "target_skills": ["<skill1>", "<skill2>"]
    }
  ]
}"""

_DRAFT_SYSTEM = """You are an expert content writer for JobsSearch, a job marketplace blog.
Write a well-structured blog post in markdown format based on the given title and category.
The content should be practical, actionable, and targeted at job market professionals.
Include headers (##), bullet points, and concrete examples.
Write 600-1000 words. Do not include frontmatter — just the body content."""


def compute_reading_time(markdown_text: str) -> int:
    """Estimate reading time in minutes (avg 238 words/min)."""
    words = len(re.findall(r'\w+', markdown_text))
    return max(1, round(words / 238))


def enrich_post(title: str, body_markdown: str, category: str) -> dict:
    """AI-enrich a blog post with SEO metadata, excerpt, and related skills."""
    prompt = (
        f"TITLE: {title}\n"
        f"CATEGORY: {category}\n\n"
        f"CONTENT:\n{body_markdown[:6000]}"
    )
    raw = _call_llm(_ENRICH_SYSTEM, prompt, json_mode=True)
    result = _parse_json_response(raw)

    return {
        "excerpt": result.get("excerpt", ""),
        "seo_title": result.get("seo_title", title)[:60],
        "seo_description": result.get("seo_description", "")[:155],
        "seo_keywords": result.get("seo_keywords", []),
        "suggested_tags": result.get("suggested_tags", []),
        "related_skills": result.get("related_skills", []),
        "reading_time_min": compute_reading_time(body_markdown),
    }


def suggest_topics(job_data: list[dict]) -> dict:
    """Suggest blog topics based on active job listings and skill demand."""
    # Summarize job data for the prompt
    skill_counts: dict[str, int] = {}
    role_counts: dict[str, int] = {}
    for job in job_data[:100]:
        for skill in job.get("required_skills", []):
            skill_counts[skill] = skill_counts.get(skill, 0) + 1
        role_counts[job.get("title", "")] = role_counts.get(job.get("title", ""), 0) + 1

    top_skills = sorted(skill_counts.items(), key=lambda x: -x[1])[:20]
    top_roles = sorted(role_counts.items(), key=lambda x: -x[1])[:10]

    prompt = (
        f"TOP IN-DEMAND SKILLS (skill: job count):\n"
        + "\n".join(f"  {s}: {c} jobs" for s, c in top_skills)
        + f"\n\nTOP ROLES:\n"
        + "\n".join(f"  {r}: {c} listings" for r, c in top_roles)
        + f"\n\nTotal active jobs: {len(job_data)}"
        + "\n\nSuggest 5 blog post ideas that would attract seekers with these in-demand skills."
    )
    raw = _call_llm(_SUGGEST_SYSTEM, prompt, json_mode=True)
    return _parse_json_response(raw)


def generate_draft(title: str, category: str) -> str:
    """Generate an AI first-draft for a blog post."""
    prompt = f"TITLE: {title}\nCATEGORY: {category}\n\nWrite the blog post."
    return _call_llm(_DRAFT_SYSTEM, prompt, json_mode=False)
