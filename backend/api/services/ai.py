"""
HireFlow AI Services
- Matching engine: computes compatibility scores between seekers and jobs
- Resume parser: extracts structured data from uploaded resumes (simulated)
- Summary generator: creates AI-powered professional summaries
"""

from __future__ import annotations

import hashlib
import re
from typing import Optional


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MATCHING ENGINE
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

    Scoring breakdown:
    - Required skill overlap: up to 50 points
    - Nice-to-have skill overlap: up to 15 points
    - Role alignment: up to 15 points
    - Work preference match: up to 10 points
    - Experience level fit: up to 10 points

    Returns dict with score, matched skills, and human-readable reasons.
    """
    u_skills = {s.lower() for s in user_skills}
    req_skills = job.get("required_skills", [])
    nice_skills = job.get("nice_skills", [])

    # ── Required skills (50 pts) ──────────────────────────
    req_matched = [s for s in req_skills if s.lower() in u_skills]
    req_ratio = len(req_matched) / max(len(req_skills), 1)
    req_score = req_ratio * 50

    # ── Nice-to-have skills (15 pts) ─────────────────────
    nice_matched = [s for s in nice_skills if s.lower() in u_skills]
    nice_ratio = len(nice_matched) / max(len(nice_skills), 1)
    nice_score = nice_ratio * 15

    # ── Role alignment (15 pts) ──────────────────────────
    role_score = 0
    reasons = []
    job_title_lower = job.get("title", "").lower()
    for role in desired_roles:
        # Check if any significant word from desired role appears in job title
        role_words = [w.lower() for w in role.split() if len(w) > 2]
        if any(w in job_title_lower for w in role_words):
            role_score = 15
            reasons.append(f"Role matches your desired position: {role}")
            break

    # ── Work preference (10 pts) ─────────────────────────
    work_score = 0
    if "Remote" in work_preferences and job.get("remote"):
        work_score = 10
        reasons.append("Supports remote work")
    elif "On-site" in work_preferences and not job.get("remote"):
        work_score = 10
    elif "Hybrid" in work_preferences:
        work_score = 5  # partial match for hybrid

    # ── Experience level (10 pts) ────────────────────────
    exp_score = 0
    if experience_level and job.get("experience_level"):
        if experience_level == job["experience_level"]:
            exp_score = 10
            reasons.append("Experience level is an exact match")
        else:
            # Partial credit for adjacent levels
            levels = ["Entry Level (0-2 yrs)", "Mid Level (3-5 yrs)", "Senior (6-9 yrs)", "Staff / Lead (10+ yrs)", "Executive / Director"]
            try:
                u_idx = levels.index(experience_level)
                j_idx = levels.index(job["experience_level"])
                if abs(u_idx - j_idx) == 1:
                    exp_score = 5
            except ValueError:
                pass

    # ── Aggregate ─────────────────────────────────────────
    raw_score = req_score + nice_score + role_score + work_score + exp_score

    # Add skill-match reasons
    if req_matched:
        reasons.insert(0, f"Matches {len(req_matched)}/{len(req_skills)} required skills")
    if nice_matched:
        reasons.insert(1, f"Matches {len(nice_matched)}/{len(nice_skills)} nice-to-have skills")

    # Clamp and apply a small deterministic jitter so scores aren't identical
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
#  RESUME PARSER (Simulated AI Extraction)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# In production, integrate with OpenAI, Anthropic, or a dedicated
# resume parsing API (Affinda, Sovren, etc.)

def parse_resume(filename: str, content: bytes) -> dict:
    """
    Simulate AI-powered resume parsing.
    Returns a structured profile extracted from the resume.

    In production, this would:
    1. Extract text via PDF/DOCX parser
    2. Send to LLM for structured extraction
    3. Map to skill taxonomy
    4. Infer preferences from context
    """
    # Determine a "persona" based on filename hash for varied demo results
    h = int(hashlib.md5(filename.encode()).hexdigest(), 16)
    personas = [
        {
            "name": "Alex Rivera",
            "headline": "Senior Full Stack Developer | React & Node.js Expert",
            "location": "San Francisco, CA",
            "skills": ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "SQL", "GraphQL", "Next.js", "CI/CD"],
            "desired_roles": ["Full Stack Developer", "Frontend Developer", "Software Engineer"],
            "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Remote", "Hybrid"],
            "salary_range": "$160k–$200k",
            "industries": ["Tech / SaaS", "AI / ML"],
            "experience": [
                {"title": "Senior Full Stack Developer", "company": "Stripe", "duration": "2021 – Present", "description": "Led migration of payment dashboard to Next.js, improving performance by 40%. Architected real-time analytics pipeline."},
                {"title": "Software Engineer", "company": "Airbnb", "duration": "2018 – 2021", "description": "Built core booking flow components in React. Implemented A/B testing framework increasing conversion by 12%."},
            ],
            "education": [{"school": "UC Berkeley", "degree": "B.S. Computer Science", "year": "2018"}],
        },
        {
            "name": "Priya Sharma",
            "headline": "ML Engineer | NLP & Deep Learning Specialist",
            "location": "Seattle, WA",
            "skills": ["Python", "PyTorch", "TensorFlow", "Machine Learning", "NLP", "AWS", "Docker", "SQL", "Pandas", "MLOps"],
            "desired_roles": ["ML Engineer", "Data Scientist", "AI Research Engineer"],
            "experience_level": "Mid Level (3-5 yrs)",
            "work_preferences": ["Remote"],
            "salary_range": "$160k–$200k",
            "industries": ["AI / ML", "Tech / SaaS"],
            "experience": [
                {"title": "ML Engineer", "company": "Meta", "duration": "2022 – Present", "description": "Developing NLP models for content understanding. Reduced inference latency by 35% through model optimization."},
                {"title": "Data Scientist", "company": "Spotify", "duration": "2020 – 2022", "description": "Built recommendation models serving 400M+ users. Improved playlist suggestions accuracy by 18%."},
            ],
            "education": [{"school": "Stanford University", "degree": "M.S. Computer Science (AI Track)", "year": "2020"}],
        },
        {
            "name": "Jordan Mitchell",
            "headline": "Product Designer | Design Systems & UX Strategy",
            "location": "New York, NY",
            "skills": ["Figma", "UX Research", "UI Design", "Design Systems", "Prototyping", "Accessibility", "Motion Design", "Adobe XD"],
            "desired_roles": ["Product Designer", "UX Researcher", "Design Lead"],
            "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Hybrid", "On-site"],
            "salary_range": "$140k–$175k",
            "industries": ["Tech / SaaS", "E-commerce"],
            "experience": [
                {"title": "Senior Product Designer", "company": "Figma", "duration": "2021 – Present", "description": "Leading design for collaboration features. Shipped auto-layout v3 used by 4M+ designers."},
                {"title": "Product Designer", "company": "Shopify", "duration": "2018 – 2021", "description": "Redesigned merchant dashboard increasing task completion by 28%."},
            ],
            "education": [{"school": "Rhode Island School of Design", "degree": "BFA Graphic Design", "year": "2017"}],
        },
    ]

    persona = personas[h % len(personas)]

    summary = generate_summary(
        name=persona["name"],
        skills=persona["skills"],
        desired_roles=persona["desired_roles"],
        experience_level=persona["experience_level"],
        experience=persona["experience"],
    )

    return {
        "profile": persona,
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
