"""
HireFlow AI Services
- Matching engine: LLM-powered (OpenAI) with rule-based fallback
- Resume parser: extracts structured data from uploaded resumes
- Summary generator: creates AI-powered professional summaries
"""

from __future__ import annotations

import hashlib
import io
import json
import logging
import re
from datetime import datetime
from typing import Optional

import PyPDF2
import docx

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MATCHING ENGINE — LLM-powered with rule-based fallback
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def compute_job_match(
    user_skills: list[str],
    desired_roles: list[str],
    work_preferences: list[str],
    salary_range: Optional[str],
    experience_level: Optional[str],
    job: dict,
) -> dict:
    """
    Compute a match score (0-99) between a seeker profile and a job posting.
    Uses OpenAI LLM for semantic matching when available, falls back to rule-based.
    """
    from api.core.config import OPENAI_API_KEY

    if OPENAI_API_KEY:
        try:
            return _llm_match(
                user_skills, desired_roles, work_preferences,
                salary_range, experience_level, job, OPENAI_API_KEY,
            )
        except Exception as e:
            logger.warning(f"LLM matching failed, falling back to rules: {e}")

    return _rule_based_match(
        user_skills, desired_roles, work_preferences,
        salary_range, experience_level, job,
    )


def _llm_match(
    user_skills: list[str],
    desired_roles: list[str],
    work_preferences: list[str],
    salary_range: Optional[str],
    experience_level: Optional[str],
    job: dict,
    api_key: str,
) -> dict:
    """Use OpenAI to semantically match a candidate to a job."""
    from openai import OpenAI

    client = OpenAI(api_key=api_key)

    # Build concise profile and job summaries for the LLM
    profile_summary = {
        "skills": user_skills[:15],
        "desired_roles": desired_roles[:5],
        "work_preferences": work_preferences,
        "salary_range": salary_range or "Not specified",
        "experience_level": experience_level or "Not specified",
    }

    job_summary = {
        "title": job.get("title", ""),
        "company": job.get("company", ""),
        "description": (job.get("description", "") or "")[:800],
        "required_skills": job.get("required_skills", []),
        "nice_skills": job.get("nice_skills", []),
        "location": job.get("location", ""),
        "remote": job.get("remote", False),
        "employment_type": job.get("employment_type", ""),
        "experience_level": job.get("experience_level", ""),
        "salary_min": job.get("salary_min"),
        "salary_max": job.get("salary_max"),
    }

    system_prompt = """You are an expert job matching AI. Analyze the candidate profile against the job posting and provide a detailed match assessment.

Consider these factors with semantic understanding:
1. **Skill Match (0-50 pts)**: Don't just match exact strings — understand that "React" relates to "Frontend", "Node.js" relates to "JavaScript", "AWS" relates to "Cloud". Recognize equivalent/related skills.
2. **Role Alignment (0-15 pts)**: Does the job title align with the candidate's desired roles? Consider related titles (e.g., "Software Engineer" matches "Full Stack Developer").
3. **Nice-to-have Skills (0-15 pts)**: Bonus for matching optional skills, including semantically related ones.
4. **Work Preference (0-10 pts)**: Remote/hybrid/on-site alignment.
5. **Experience Level (0-10 pts)**: Seniority match (exact = 10, adjacent = 5).

Return ONLY valid JSON with this exact structure:
{
  "match_score": <integer 15-99>,
  "matched_required": ["skill1", "skill2"],
  "matched_nice": ["skill1"],
  "match_reasons": ["reason1", "reason2", "reason3"],
  "semantic_insights": ["insight about transferable skills or hidden matches"]
}

Be nuanced — a React expert with TypeScript is a strong match for a "Frontend Engineer" role even if the JD says "Vue.js" (transferable skills). But don't inflate scores — be honest about gaps."""

    user_prompt = f"""**Candidate Profile:**
{json.dumps(profile_summary, indent=2)}

**Job Posting:**
{json.dumps(job_summary, indent=2)}

Analyze the match and return JSON."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=500,
        response_format={"type": "json_object"},
    )

    result = json.loads(response.choices[0].message.content)

    # Validate and clamp
    score = max(15, min(99, int(result.get("match_score", 50))))
    reasons = result.get("match_reasons", [])
    semantic = result.get("semantic_insights", [])
    if semantic:
        reasons.extend(semantic)

    return {
        "match_score": score,
        "matched_required": result.get("matched_required", []),
        "matched_nice": result.get("matched_nice", []),
        "match_reasons": reasons[:6],
    }


def _rule_based_match(
    user_skills: list[str],
    desired_roles: list[str],
    work_preferences: list[str],
    salary_range: Optional[str],
    experience_level: Optional[str],
    job: dict,
) -> dict:
    """Original rule-based matching as fallback."""
    u_skills = {s.lower() for s in user_skills}
    req_skills = job.get("required_skills", [])
    nice_skills = job.get("nice_skills", [])

    # ── Required skills (50 pts)
    req_matched = [s for s in req_skills if s.lower() in u_skills]
    req_ratio = len(req_matched) / max(len(req_skills), 1)
    req_score = req_ratio * 50

    # ── Nice-to-have skills (15 pts)
    nice_matched = [s for s in nice_skills if s.lower() in u_skills]
    nice_ratio = len(nice_matched) / max(len(nice_skills), 1)
    nice_score = nice_ratio * 15

    # ── Role alignment (15 pts)
    role_score = 0
    reasons = []
    job_title_lower = job.get("title", "").lower()
    for role in desired_roles:
        role_words = [w.lower() for w in role.split() if len(w) > 2]
        if any(w in job_title_lower for w in role_words):
            role_score = 15
            reasons.append(f"Role matches your desired position: {role}")
            break

    # ── Work preference (10 pts)
    work_score = 0
    if "Remote" in work_preferences and job.get("remote"):
        work_score = 10
        reasons.append("Supports remote work")
    elif "On-site" in work_preferences and not job.get("remote"):
        work_score = 10
    elif "Hybrid" in work_preferences:
        work_score = 5

    # ── Experience level (10 pts)
    exp_score = 0
    if experience_level and job.get("experience_level"):
        if experience_level == job["experience_level"]:
            exp_score = 10
            reasons.append("Experience level is an exact match")
        else:
            levels = ["Entry Level (0-2 yrs)", "Mid Level (3-5 yrs)", "Senior (6-9 yrs)", "Staff / Lead (10+ yrs)", "Executive / Director"]
            try:
                u_idx = levels.index(experience_level)
                j_idx = levels.index(job["experience_level"])
                if abs(u_idx - j_idx) == 1:
                    exp_score = 5
            except ValueError:
                pass

    # ── Aggregate
    raw_score = req_score + nice_score + role_score + work_score + exp_score
    if req_matched:
        reasons.insert(0, f"Matches {len(req_matched)}/{len(req_skills)} required skills")
    if nice_matched:
        reasons.insert(1, f"Matches {len(nice_matched)}/{len(nice_skills)} nice-to-have skills")

    jitter = int(hashlib.md5(f"{job.get('id', '')}".encode()).hexdigest(), 16) % 5
    final_score = min(99, max(15, int(raw_score + jitter)))

    return {
        "match_score": final_score,
        "matched_required": req_matched,
        "matched_nice": nice_matched,
        "match_reasons": reasons,
    }


def compute_candidate_match(candidate: dict, job: dict) -> int:
    """Compute match score for a candidate against a specific job (recruiter/company view)."""
    result = compute_job_match(
        user_skills=candidate.get("skills", []),
        desired_roles=candidate.get("desired_roles", []),
        work_preferences=candidate.get("work_preferences", []),
        salary_range=candidate.get("salary_range"),
        experience_level=candidate.get("experience_level"),
        job=job,
    )
    return result["match_score"]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  RESUME PARSER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Skill taxonomy derived from frontend SKILL_CATEGORIES
_SKILL_TAXONOMY = [
    # Frontend
    "React", "Vue.js", "Angular", "TypeScript", "JavaScript", "HTML/CSS",
    "Next.js", "Tailwind CSS", "Redux", "Svelte",
    # Backend
    "Node.js", "Python", "Java", "Go", "Ruby", "PHP", "C#", ".NET", "Rust", "Elixir",
    # Data & AI
    "Machine Learning", "TensorFlow", "PyTorch", "Data Analysis", "SQL", "Pandas",
    "NLP", "Computer Vision", "Deep Learning", "MLOps",
    # Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD",
    "Linux", "Nginx", "Jenkins",
    # Design
    "Figma", "UX Research", "UI Design", "Design Systems", "Prototyping",
    "Adobe XD", "Sketch", "Accessibility", "Motion Design", "Branding",
    # Management
    "Agile/Scrum", "Product Strategy", "Stakeholder Mgmt", "Roadmapping",
    "Team Leadership", "Budgeting", "OKRs", "Hiring", "Mentoring", "Cross-functional",
    # Common extras
    "GraphQL", "MongoDB", "Redis", "PostgreSQL", "Express", "Django", "FastAPI",
    "Flask", "Spring", "Kafka", "Git", "GitHub", "Jira", "NumPy",
    "Elasticsearch", "RabbitMQ",
]

# Build a lowercase-to-canonical mapping for fast lookups
_SKILL_LOWER_MAP: dict[str, str] = {s.lower(): s for s in _SKILL_TAXONOMY}


def _extract_text(filename: str, content: bytes) -> str:
    """Extract plain text from PDF, DOCX, or DOC bytes."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "pdf":
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            pages = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(pages)
        except Exception:
            return ""

    if ext == "docx":
        try:
            document = docx.Document(io.BytesIO(content))
            paragraphs = [p.text for p in document.paragraphs]
            return "\n".join(paragraphs)
        except Exception:
            return ""

    # .doc fallback — try UTF-8 decoding (best-effort)
    try:
        return content.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def _infer_experience_level(experience: list[dict]) -> str:
    """Infer experience level from date spans found in experience entries."""
    current_year = datetime.now().year
    total_years = 0

    for entry in experience:
        duration = entry.get("duration", "")
        # Find 4-digit years in the duration string
        years_found = re.findall(r"\b(?:19|20)\d{2}\b", duration)
        has_present = bool(re.search(r"\b(present|current|now)\b", duration, re.IGNORECASE))

        if len(years_found) >= 2:
            start = int(years_found[0])
            end = int(years_found[-1])
            total_years += end - start
        elif len(years_found) == 1 and has_present:
            start = int(years_found[0])
            total_years += current_year - start

    if total_years >= 10:
        return "Staff / Lead (10+ yrs)"
    if total_years >= 6:
        return "Senior (6-9 yrs)"
    if total_years >= 3:
        return "Mid Level (3-5 yrs)"
    return "Entry Level (0-2 yrs)"


def _parse_structured_data(text: str) -> dict:
    """
    Extract structured profile data from plain resume text using
    regex heuristics and skill taxonomy matching.
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    # ── Name ─────────────────────────────────────────────
    name = ""
    email_re = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
    phone_re = re.compile(r"(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})")
    for line in lines[:5]:
        if email_re.search(line) or phone_re.search(line):
            continue
        if len(line) < 60 and re.match(r"^[A-Za-z]+([\s\-'][A-Za-z]+){1,4}$", line):
            name = line
            break

    # ── Email ────────────────────────────────────────────
    email = ""
    email_match = email_re.search(text)
    if email_match:
        email = email_match.group(0)

    # ── Phone ────────────────────────────────────────────
    phone = ""
    phone_match = phone_re.search(text)
    if phone_match:
        phone = phone_match.group(0).strip()

    # ── Location ("City, ST" or "City, State") ───────────
    location = ""
    loc_match = re.search(
        r"\b([A-Z][a-zA-Z ]+),\s*([A-Z]{2}|[A-Z][a-z]+)\b", text
    )
    if loc_match:
        location = loc_match.group(0)

    # ── Skills — taxonomy matching across full text ───────
    text_lower = text.lower()
    found_skills: list[str] = []
    for skill_lower, canonical in _SKILL_LOWER_MAP.items():
        # Use word-boundary aware search
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(skill_lower) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, text_lower):
            found_skills.append(canonical)

    # Also extract from an explicit "Skills:" section
    skills_section_match = re.search(
        r"(?:skills|technical skills|core competencies)[:\s]*\n?(.*?)(?:\n\n|\Z)",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if skills_section_match:
        section_text = skills_section_match.group(1).lower()
        for skill_lower, canonical in _SKILL_LOWER_MAP.items():
            if canonical not in found_skills:
                pattern = r"(?<![a-zA-Z0-9])" + re.escape(skill_lower) + r"(?![a-zA-Z0-9])"
                if re.search(pattern, section_text):
                    found_skills.append(canonical)

    # ── Experience ────────────────────────────────────────
    experience: list[dict] = []

    # Look for "Title at Company" patterns with optional date ranges
    exp_pattern = re.compile(
        r"([A-Z][A-Za-z /,]+?)\s+at\s+([A-Z][A-Za-z &,.]+?)(?=\s*(?:[\|–\-]|\n|\Z))"
        r"(?:\s*[\|–\-]\s*([\w ,–\-]+\d{4}[\w ,–\-]*))?",
    )
    for m in exp_pattern.finditer(text):
        title = m.group(1).strip()
        company = m.group(2).strip().rstrip(",.")
        duration = m.group(3).strip() if m.group(3) else ""
        if 2 <= len(title.split()) <= 7:
            experience.append({"title": title, "company": company, "duration": duration, "description": ""})

    # Fallback: section-based extraction if no "at" patterns found
    if not experience:
        exp_section_match = re.search(
            r"(?:experience|work history|employment)[:\s]*\n(.*?)(?:\n(?:education|skills|projects|certifications)\b|\Z)",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        if exp_section_match:
            section = exp_section_match.group(1)
            for line in section.splitlines():
                line = line.strip()
                if line and len(line) > 10 and re.search(r"\d{4}", line):
                    experience.append({"title": line, "company": "", "duration": "", "description": ""})

    # ── Education ─────────────────────────────────────────
    education: list[dict] = []
    degree_keywords = r"(?:B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|MBA|Ph\.?D\.?|Bachelor|Master|Doctor|Associate)"

    # Section-based
    edu_section_match = re.search(
        r"(?:education|academic background)[:\s]*\n(.*?)(?:\n(?:experience|skills|projects|certifications)\b|\Z)",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if edu_section_match:
        section = edu_section_match.group(1)
        year_re = re.compile(r"\b(19|20)\d{2}\b")
        for line in section.splitlines():
            line = line.strip()
            if re.search(degree_keywords, line, re.IGNORECASE) or year_re.search(line):
                year_match = year_re.search(line)
                education.append({
                    "school": "",
                    "degree": line,
                    "year": year_match.group(0) if year_match else "",
                })
    else:
        # Inline degree mentions
        for m in re.finditer(
            rf"({degree_keywords}[^,\n]{{0,60}})",
            text,
            re.IGNORECASE,
        ):
            year_match = re.search(r"\b(19|20)\d{2}\b", m.group(1))
            education.append({
                "school": "",
                "degree": m.group(1).strip(),
                "year": year_match.group(0) if year_match else "",
            })

    # ── Summary ───────────────────────────────────────────
    summary = ""
    summary_match = re.search(
        r"(?:summary|objective|profile|about)[:\s]*\n?(.*?)(?:\n\n|\n(?:[A-Z][A-Z\s]{3,}:)|\Z)",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if summary_match:
        summary = summary_match.group(1).strip()

    # ── Experience level inference ────────────────────────
    experience_level = _infer_experience_level(experience)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "headline": "",
        "location": location,
        "skills": found_skills,
        "desired_roles": [],
        "experience_level": experience_level,
        "work_preferences": [],
        "salary_range": "",
        "industries": [],
        "experience": experience,
        "education": education,
        "summary": summary,
    }


def parse_resume(filename: str, content: bytes) -> dict:
    """
    Parse a resume file (PDF or DOCX) and return a structured profile.

    Steps:
    1. Extract text from the file bytes.
    2. Parse structured data via regex/heuristics.
    3. Generate an AI summary from parsed data.
    """
    text = _extract_text(filename, content)

    if not text.strip():
        # Return a minimal empty profile when text extraction fails
        return {
            "profile": {
                "name": "", "email": "", "phone": "", "headline": "",
                "location": "", "skills": [], "desired_roles": [],
                "experience_level": "Entry Level (0-2 yrs)",
                "work_preferences": [], "salary_range": "", "industries": [],
                "experience": [], "education": [], "summary": "",
            },
            "ai_summary": "",
        }

    profile = _parse_structured_data(text)

    summary = generate_summary(
        name=profile["name"],
        skills=profile["skills"],
        desired_roles=profile["desired_roles"],
        experience_level=profile["experience_level"],
        experience=profile["experience"],
    )

    return {
        "profile": profile,
        "ai_summary": summary,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI SUMMARY GENERATOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# In production, call an LLM API for high-quality generation.

def generate_summary(
    name: str,
    skills: list[str],
    desired_roles: list[str],
    experience_level: Optional[str] = None,
    experience: Optional[list[dict]] = None,
) -> str:
    """Generate a professional summary from profile data."""
    exp_label = experience_level.split(" ")[0].lower() if experience_level else ""
    skills_str = ", ".join(skills[:5])
    roles_str = " and ".join(desired_roles[:2]) if desired_roles else "technology"

    parts = [
        f"Results-driven {exp_label} professional with deep expertise in {skills_str}."
    ]

    if experience:
        latest = experience[0]
        desc = latest.get('description') or 'they drove impactful results'
        parts.append(
            f"Most recently served as {latest['title']} at {latest['company']}, "
            f"where {desc.lower().rstrip('.')}."
        )

    parts.append(
        f"Passionate about building innovative solutions and seeking "
        f"opportunities in {roles_str}. Known for strong problem-solving "
        f"abilities, cross-functional collaboration, and delivering "
        f"high-quality work in fast-paced environments."
    )

    return " ".join(parts)


def generate_headline(name: str, skills: list[str], desired_roles: list[str]) -> str:
    """Generate a professional headline."""
    role = desired_roles[0] if desired_roles else "Professional"
    top_skills = " & ".join(skills[:2]) if skills else ""
    return f"{role} | {top_skills} Expert" if top_skills else role


def suggest_skills(existing_skills: list[str]) -> list[str]:
    """Suggest complementary skills based on existing ones."""
    skill_graph = {
        "react": ["TypeScript", "Next.js", "Redux", "Tailwind CSS", "GraphQL"],
        "python": ["FastAPI", "Django", "Pandas", "NumPy", "Docker"],
        "typescript": ["React", "Node.js", "Next.js", "GraphQL", "Jest"],
        "aws": ["Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"],
        "figma": ["Prototyping", "Design Systems", "UX Research", "Accessibility"],
        "machine learning": ["Python", "PyTorch", "TensorFlow", "MLOps", "Deep Learning"],
        "node.js": ["TypeScript", "Express", "PostgreSQL", "Docker", "GraphQL"],
    }

    suggestions = set()
    existing_lower = {s.lower() for s in existing_skills}

    for skill in existing_skills:
        related = skill_graph.get(skill.lower(), [])
        for r in related:
            if r.lower() not in existing_lower:
                suggestions.add(r)

    return list(suggestions)[:8]
