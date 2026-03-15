"""
HireFlow LLM Service
====================
Provider-agnostic LLM client. Configured via environment variables:
  LLM_PROVIDER = "openai" | "anthropic"   (default: "openai")
  LLM_API_KEY  = <provider api key>
  LLM_MODEL    = <optional model override>

Public surface:
  analyze_match(resume_text, jd_text, cover_letter) -> dict
  generate_cover_letter(resume_text, jd_text) -> str
  improve_cover_letter(resume_text, jd_text, cover_letter) -> str
"""

from __future__ import annotations

import json
import os
import re
from typing import Optional


_PROVIDER = os.environ.get("LLM_PROVIDER", "openai").lower()
_API_KEY = os.environ.get("LLM_API_KEY", "")
_MODEL = os.environ.get("LLM_MODEL", "")


# ── Prompt templates ──────────────────────────────────────
_ANALYZE_SYSTEM = """You are an expert career coach and ATS specialist.
Analyze how well the candidate's resume matches the job description.
If a cover letter is provided, also evaluate it.
Respond ONLY with valid JSON matching this exact schema (no markdown fences):
{
  "overall_score": <int 0-100>,
  "summary": "<2-3 sentence assessment>",
  "strengths": ["<strength 1>", ...],
  "gaps": ["<gap 1>", ...],
  "keyword_matches": ["<keyword found in resume>", ...],
  "keyword_misses": ["<keyword missing from resume>", ...],
  "cover_letter_score": <int 0-100 or null if no cover letter>,
  "cover_letter_feedback": "<feedback string or null if no cover letter>"
}"""

_GENERATE_SYSTEM = """You are an expert cover letter writer.
Write a professional, specific, and compelling cover letter tailored to the job description.
Use the candidate's resume as the source of facts about their background.
Output only the cover letter text. Do not include any JSON, markdown fences, or meta-commentary."""

_IMPROVE_SYSTEM = """You are an expert cover letter coach.
Rewrite and improve the provided cover letter to better match the job description.
Use the candidate's resume as the source of facts.
Output only the improved cover letter text. Do not include any JSON, markdown fences, or meta-commentary."""


# ── Provider calls ────────────────────────────────────────
def _call_openai(system: str, user: str, json_mode: bool) -> str:
    try:
        import openai
    except ImportError:
        raise RuntimeError("Install 'openai' package: pip install openai>=1.0.0")

    client = openai.OpenAI(api_key=_API_KEY)
    model = _MODEL or "gpt-4o-mini"
    kwargs = dict(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
    )
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content.strip()


def _call_anthropic(system: str, user: str) -> str:
    try:
        import anthropic
    except ImportError:
        raise RuntimeError("Install 'anthropic' package: pip install anthropic>=0.25.0")

    client = anthropic.Anthropic(api_key=_API_KEY)
    model = _MODEL or "claude-3-5-haiku-20241022"
    resp = client.messages.create(
        model=model,
        max_tokens=2048,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return resp.content[0].text.strip()


def _call_llm(system: str, user: str, json_mode: bool = False) -> str:
    if not _API_KEY:
        raise RuntimeError(
            "LLM_API_KEY environment variable is not set. "
            "Set it to your OpenAI or Anthropic API key."
        )
    if _PROVIDER == "anthropic":
        return _call_anthropic(system, user)
    return _call_openai(system, user, json_mode)


def _parse_json_response(raw: str) -> dict:
    """Parse JSON from LLM response, stripping markdown fences if present."""
    # Strip markdown code fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"```\s*$", "", cleaned, flags=re.MULTILINE)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to extract JSON object from the response
        m = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if m:
            return json.loads(m.group(0))
        return {}


# ── Public API ────────────────────────────────────────────
def analyze_match(
    resume_text: str,
    jd_text: str,
    cover_letter: Optional[str] = None,
) -> dict:
    """Analyze resume (and optional cover letter) against a job description."""
    parts = [f"RESUME:\n{resume_text[:4000]}\n\nJOB DESCRIPTION:\n{jd_text[:4000]}"]
    if cover_letter:
        parts.append(f"\nCOVER LETTER:\n{cover_letter[:3000]}")
    prompt = "\n".join(parts)

    raw = _call_llm(_ANALYZE_SYSTEM, prompt, json_mode=True)
    result = _parse_json_response(raw)

    # Ensure required fields have defaults
    return {
        "overall_score": result.get("overall_score", 0),
        "summary": result.get("summary", ""),
        "strengths": result.get("strengths", []),
        "gaps": result.get("gaps", []),
        "keyword_matches": result.get("keyword_matches", []),
        "keyword_misses": result.get("keyword_misses", []),
        "cover_letter_score": result.get("cover_letter_score"),
        "cover_letter_feedback": result.get("cover_letter_feedback"),
    }


def generate_cover_letter(resume_text: str, jd_text: str) -> str:
    """Generate a tailored cover letter from resume and job description."""
    prompt = f"RESUME:\n{resume_text[:4000]}\n\nJOB DESCRIPTION:\n{jd_text[:4000]}"
    return _call_llm(_GENERATE_SYSTEM, prompt, json_mode=False)


def improve_cover_letter(
    resume_text: str,
    jd_text: str,
    cover_letter: str,
) -> str:
    """Improve an existing cover letter to better match the job description."""
    prompt = (
        f"RESUME:\n{resume_text[:4000]}\n\n"
        f"JOB DESCRIPTION:\n{jd_text[:4000]}\n\n"
        f"EXISTING COVER LETTER:\n{cover_letter[:3000]}"
    )
    return _call_llm(_IMPROVE_SYSTEM, prompt, json_mode=False)
