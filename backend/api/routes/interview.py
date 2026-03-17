"""
AI Interview Bot — Voice-based mock interviews.
Generates personalized questions from profile + JD, uses Wispr Flow for voice transcription.
"""

import re
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from api.core.config import get_current_user, require_user, WISPR_API_KEY
from api.core.database import get_user_by_id

router = APIRouter(prefix="/api/interview", tags=["Interview"])

WISPR_API_URL = "https://platform-api.wisprflow.ai/api/v1/dash/api"


class InterviewSetup(BaseModel):
    job_description: str
    job_title: Optional[str] = ""
    company_name: Optional[str] = ""
    interview_type: str = "mixed"  # "behavioral", "technical", "mixed"
    difficulty: str = "mid"  # "entry", "mid", "senior"


class TranscribeRequest(BaseModel):
    audio_base64: str  # Base64-encoded 16kHz WAV audio


class EvaluateRequest(BaseModel):
    question: str
    answer: str
    job_description: str
    question_type: str = "behavioral"


class InterviewSession(BaseModel):
    session_id: str
    questions: list[dict]
    job_title: str
    company_name: str
    interview_type: str
    difficulty: str


# ═══════════════════════════════════════════════════════════════
# Question Generation
# ═══════════════════════════════════════════════════════════════

_BEHAVIORAL_QUESTIONS = [
    {"q": "Tell me about yourself and why you're interested in this role.", "type": "behavioral", "tip": "Use the Present-Past-Future framework. Keep it under 90 seconds."},
    {"q": "Describe a challenging project you worked on. What was your approach and the outcome?", "type": "behavioral", "tip": "Use the STAR method. Focus 60% on your specific actions."},
    {"q": "Tell me about a time you had to learn a new technology quickly. How did you approach it?", "type": "behavioral", "tip": "Show your learning process and how fast you became productive."},
    {"q": "Describe a situation where you disagreed with a team member on a technical decision. How did you resolve it?", "type": "behavioral", "tip": "Show emotional intelligence and focus on the resolution, not the conflict."},
    {"q": "Tell me about a time you failed or made a mistake at work. What did you learn?", "type": "behavioral", "tip": "Be genuine. Show self-awareness and growth. Pick a real mistake, not a humble-brag."},
    {"q": "How do you prioritize your work when you have multiple deadlines?", "type": "behavioral", "tip": "Give a concrete system or framework you use, with a specific example."},
    {"q": "Describe a time you went above and beyond what was expected of you.", "type": "behavioral", "tip": "Focus on impact and initiative, not just extra hours."},
    {"q": "Tell me about a time you had to work with a difficult stakeholder or client.", "type": "behavioral", "tip": "Demonstrate empathy, communication skills, and problem-solving."},
    {"q": "How do you handle receiving critical feedback?", "type": "behavioral", "tip": "Show openness to growth. Give a specific example of feedback you acted on."},
    {"q": "Describe a time you mentored or helped a colleague grow.", "type": "behavioral", "tip": "Shows leadership potential. Focus on their growth, not your expertise."},
    {"q": "What's your greatest professional achievement and why?", "type": "behavioral", "tip": "Pick something relevant to the role. Quantify the impact."},
    {"q": "Tell me about a time you had to make a decision with incomplete information.", "type": "behavioral", "tip": "Show your decision-making process and how you managed risk."},
]

_TECHNICAL_QUESTIONS = {
    "general": [
        {"q": "How would you design a system to handle 10x your current traffic?", "type": "technical", "tip": "Discuss caching, load balancing, database scaling, and async processing."},
        {"q": "Explain the tradeoffs between SQL and NoSQL databases. When would you choose each?", "type": "technical", "tip": "Show understanding of consistency, scalability, and query patterns."},
        {"q": "What's your approach to debugging a production issue that you can't reproduce locally?", "type": "technical", "tip": "Mention logging, monitoring, feature flags, and systematic elimination."},
        {"q": "How do you ensure code quality in a fast-moving team?", "type": "technical", "tip": "Discuss code reviews, testing strategy, CI/CD, and coding standards."},
        {"q": "Explain the concept of technical debt. How do you decide when to address it?", "type": "technical", "tip": "Balance business needs with engineering sustainability. Give real examples."},
        {"q": "Walk me through how you'd design an authentication system from scratch.", "type": "technical", "tip": "Cover JWT vs sessions, OAuth, password hashing, refresh tokens, and security."},
    ],
    "frontend": [
        {"q": "Explain the virtual DOM and why frameworks like React use it.", "type": "technical", "tip": "Compare with direct DOM manipulation. Discuss reconciliation and performance."},
        {"q": "How would you optimize a web application that's loading slowly?", "type": "technical", "tip": "Cover code splitting, lazy loading, caching, image optimization, and Core Web Vitals."},
        {"q": "Describe your approach to making a web application accessible.", "type": "technical", "tip": "Discuss ARIA, semantic HTML, keyboard navigation, and screen reader testing."},
    ],
    "backend": [
        {"q": "How would you design a rate limiter for an API?", "type": "technical", "tip": "Discuss token bucket, sliding window, and distributed rate limiting with Redis."},
        {"q": "Explain microservices vs monolith. What are the tradeoffs?", "type": "technical", "tip": "Cover deployment, debugging, data consistency, and team organization."},
        {"q": "How do you handle database migrations in a production environment?", "type": "technical", "tip": "Discuss backward compatibility, rollback strategies, and zero-downtime deploys."},
    ],
    "data": [
        {"q": "How would you design a data pipeline for real-time analytics?", "type": "technical", "tip": "Discuss streaming (Kafka), batch processing, and data warehousing."},
        {"q": "Explain overfitting in machine learning and how to prevent it.", "type": "technical", "tip": "Cover regularization, cross-validation, ensemble methods, and data augmentation."},
    ],
    "devops": [
        {"q": "How would you set up a CI/CD pipeline for a new project?", "type": "technical", "tip": "Cover testing stages, environment promotion, rollback, and monitoring."},
        {"q": "Explain containers vs virtual machines. When would you choose each?", "type": "technical", "tip": "Discuss isolation, resource usage, startup time, and orchestration."},
    ],
}

_SITUATIONAL_QUESTIONS = [
    {"q": "You notice a senior colleague is writing code that doesn't follow team standards. How do you approach this?", "type": "situational", "tip": "Show diplomacy and respect while maintaining standards."},
    {"q": "Your team is falling behind on a sprint. The PM asks if you can cut corners to meet the deadline. What do you do?", "type": "situational", "tip": "Balance business needs with engineering quality. Propose alternatives."},
    {"q": "You're given a feature request that you believe is technically flawed. How do you handle it?", "type": "situational", "tip": "Show how you provide constructive pushback with data and alternatives."},
    {"q": "A production bug is reported during your off-hours. What's your process?", "type": "situational", "tip": "Discuss severity assessment, communication, and incident response."},
    {"q": "You're asked to estimate a project but have very limited information. What do you do?", "type": "situational", "tip": "Discuss asking clarifying questions, breaking down unknowns, and providing ranges."},
]

_CLOSING_QUESTIONS = [
    {"q": "What questions do you have for me about the role or the company?", "type": "closing", "tip": "Always have 2-3 thoughtful questions prepared. Ask about team, challenges, and success metrics."},
    {"q": "Where do you see yourself in 3-5 years?", "type": "closing", "tip": "Show ambition aligned with the role's growth path. Be genuine."},
    {"q": "Why are you leaving your current position?", "type": "closing", "tip": "Stay positive. Focus on what you're moving toward, not what you're leaving."},
    {"q": "What's your greatest weakness?", "type": "closing", "tip": "Be honest but strategic. Show self-awareness and active improvement."},
]


def _detect_domain(skills: list, jd: str) -> str:
    """Detect the technical domain from skills and job description."""
    text = " ".join(skills).lower() + " " + jd.lower()
    domains = {
        "frontend": ["react", "vue", "angular", "css", "html", "javascript", "typescript", "frontend", "ui", "ux"],
        "backend": ["python", "java", "node", "api", "backend", "server", "database", "sql", "rest", "graphql"],
        "data": ["machine learning", "data science", "pytorch", "tensorflow", "pandas", "ml", "ai", "analytics"],
        "devops": ["docker", "kubernetes", "aws", "terraform", "ci/cd", "devops", "infrastructure", "cloud"],
    }
    scores = {}
    for domain, keywords in domains.items():
        scores[domain] = sum(1 for k in keywords if k in text)
    return max(scores, key=scores.get) if max(scores.values()) > 0 else "general"


def _extract_skills_from_jd(jd: str) -> list[str]:
    """Extract key skills mentioned in a job description."""
    known = [
        "react", "vue", "angular", "typescript", "javascript", "python", "java", "go",
        "rust", "node.js", "sql", "postgresql", "mongodb", "aws", "azure", "gcp",
        "docker", "kubernetes", "terraform", "machine learning", "pytorch", "tensorflow",
        "graphql", "rest", "redis", "kafka", "elasticsearch", "git", "ci/cd",
    ]
    jd_lower = jd.lower()
    return [s for s in known if s in jd_lower]


def _personalize_question(q: str, profile: dict, job_title: str, company: str) -> str:
    """Add personalization to generic questions."""
    q = q.replace("this role", f"the {job_title} role" if job_title else "this role")
    if company:
        q = q.replace("the company", company).replace("our team", f"the team at {company}")
    return q


def _generate_questions(
    profile: dict,
    jd: str,
    job_title: str,
    company: str,
    interview_type: str,
    difficulty: str,
) -> list[dict]:
    """Generate a personalized set of interview questions."""
    import random

    skills = profile.get("skills", []) if profile else []
    domain = _detect_domain(skills, jd)
    jd_skills = _extract_skills_from_jd(jd)

    questions = []

    # 1. Opening — always start with "tell me about yourself"
    questions.append({
        **_BEHAVIORAL_QUESTIONS[0],
        "q": _personalize_question(_BEHAVIORAL_QUESTIONS[0]["q"], profile, job_title, company),
        "order": 1,
    })

    # 2. Behavioral questions (2-3)
    behavioral_pool = _BEHAVIORAL_QUESTIONS[1:]
    random.shuffle(behavioral_pool)
    n_behavioral = 3 if interview_type == "behavioral" else 2
    for bq in behavioral_pool[:n_behavioral]:
        questions.append({
            **bq,
            "q": _personalize_question(bq["q"], profile, job_title, company),
            "order": len(questions) + 1,
        })

    # 3. Technical questions (2-4 depending on type)
    if interview_type in ("technical", "mixed"):
        tech_pool = _TECHNICAL_QUESTIONS.get(domain, []) + _TECHNICAL_QUESTIONS["general"]
        random.shuffle(tech_pool)
        n_tech = 4 if interview_type == "technical" else 2
        for tq in tech_pool[:n_tech]:
            questions.append({**tq, "order": len(questions) + 1})

    # 4. Situational question (1)
    situational_pool = list(_SITUATIONAL_QUESTIONS)
    random.shuffle(situational_pool)
    questions.append({**situational_pool[0], "order": len(questions) + 1})

    # 5. Role-specific question based on JD
    if jd_skills:
        top_skills = jd_skills[:3]
        custom_q = {
            "q": f"This role requires expertise in {', '.join(top_skills)}. Can you walk me through a project where you used {'these technologies' if len(top_skills) > 1 else top_skills[0]} to solve a real problem?",
            "type": "technical",
            "tip": "Be specific about the problem, your technical approach, and the measurable outcome.",
            "order": len(questions) + 1,
        }
        questions.append(custom_q)

    # 6. Difficulty-based adjustment
    if difficulty == "senior":
        senior_q = {
            "q": "Tell me about a time you had to make a significant architectural decision that affected the entire team or product. What was your approach?",
            "type": "behavioral",
            "tip": "Show strategic thinking, stakeholder management, and long-term vision.",
            "order": len(questions) + 1,
        }
        questions.append(senior_q)

    # 7. Closing question
    closing_pool = list(_CLOSING_QUESTIONS)
    random.shuffle(closing_pool)
    questions.append({**closing_pool[0], "order": len(questions) + 1})

    return questions


# ═══════════════════════════════════════════════════════════════
# Answer Evaluation
# ═══════════════════════════════════════════════════════════════

def _evaluate_answer(question: str, answer: str, q_type: str, jd: str) -> dict:
    """Evaluate an interview answer and provide feedback."""
    if not answer or len(answer.strip()) < 10:
        return {
            "score": 0,
            "feedback": "It seems like you didn't provide an answer. Take a moment to collect your thoughts and try again. It's okay to pause before answering!",
            "strengths": [],
            "improvements": ["Try to provide a substantive answer even if you're unsure"],
            "tip": "Silence is worse than a partial answer. Start with what you know.",
        }

    word_count = len(answer.split())
    answer_lower = answer.lower()
    score = 50  # Start at baseline
    strengths = []
    improvements = []

    # Length analysis
    if word_count > 200:
        score += 10
        strengths.append("Detailed and thorough response")
    elif word_count > 100:
        score += 5
        strengths.append("Good level of detail")
    elif word_count < 30:
        score -= 10
        improvements.append("Try to elaborate more — aim for 1-2 minutes of speaking")

    # STAR method detection for behavioral
    if q_type == "behavioral":
        star_signals = {
            "situation": ["when i was", "at my previous", "in my role", "there was a time", "we were working on", "the situation was"],
            "task": ["i was responsible", "my role was", "i needed to", "the goal was", "i was tasked", "the challenge was"],
            "action": ["i decided to", "i implemented", "i created", "i led", "i built", "so i", "my approach was", "i took the initiative"],
            "result": ["as a result", "the outcome", "we achieved", "this led to", "increased", "decreased", "reduced", "improved", "saved"],
        }
        star_found = []
        for element, signals in star_signals.items():
            if any(s in answer_lower for s in signals):
                star_found.append(element)

        if len(star_found) >= 3:
            score += 15
            strengths.append(f"Great use of STAR method ({', '.join(star_found)})")
        elif len(star_found) >= 2:
            score += 8
            strengths.append(f"Good structure with {', '.join(star_found)} elements")
        else:
            improvements.append("Try using the STAR method: Situation, Task, Action, Result")

    # Quantification check
    has_numbers = bool(re.search(r'\d+[%xk]|\d+\s*(percent|users|customers|team|people|months|years|hours)', answer_lower))
    if has_numbers:
        score += 10
        strengths.append("Good use of quantified results")
    else:
        improvements.append("Try to quantify your impact (e.g., 'reduced load time by 40%', 'team of 5')")

    # Technical depth for technical questions
    if q_type == "technical":
        jd_skills = _extract_skills_from_jd(jd)
        mentioned_skills = [s for s in jd_skills if s in answer_lower]
        if mentioned_skills:
            score += 5 * min(len(mentioned_skills), 3)
            strengths.append(f"Referenced relevant technologies: {', '.join(mentioned_skills)}")

        depth_signals = ["tradeoff", "trade-off", "because", "the reason", "compared to", "alternatively",
                        "the advantage", "the disadvantage", "complexity", "scalab", "performance"]
        depth_count = sum(1 for s in depth_signals if s in answer_lower)
        if depth_count >= 2:
            score += 10
            strengths.append("Demonstrated technical depth and tradeoff analysis")
        elif depth_count == 0:
            improvements.append("Discuss tradeoffs and reasoning behind your technical choices")

    # Specificity check
    specificity_signals = ["for example", "specifically", "in particular", "one instance", "a concrete example"]
    if any(s in answer_lower for s in specificity_signals):
        score += 8
        strengths.append("Used specific examples to illustrate your points")
    else:
        improvements.append("Include a specific, concrete example to make your answer memorable")

    # Self-awareness signals
    awareness_signals = ["i learned", "looking back", "i would have", "next time", "in hindsight", "i realized"]
    if any(s in answer_lower for s in awareness_signals):
        score += 5
        strengths.append("Showed self-awareness and growth mindset")

    # Cap score
    score = min(score, 98)

    # Generate feedback
    if score >= 85:
        feedback = "Excellent answer! You demonstrated strong communication and relevant experience. "
    elif score >= 70:
        feedback = "Good answer with solid content. A few tweaks could make it even stronger. "
    elif score >= 50:
        feedback = "Decent foundation, but there's room for improvement. "
    else:
        feedback = "This needs more work. Don't worry — practice makes perfect. "

    if improvements:
        feedback += "Focus on: " + improvements[0] + "."

    return {
        "score": score,
        "feedback": feedback,
        "strengths": strengths[:3],
        "improvements": improvements[:3],
    }


# ═══════════════════════════════════════════════════════════════
# API Endpoints
# ═══════════════════════════════════════════════════════════════

@router.post("/start", response_model=InterviewSession)
async def start_interview(req: InterviewSetup, user=Depends(get_current_user)):
    """Start a mock interview session with personalized questions."""
    profile = None
    if user:
        profile = get_user_by_id(user["id"]) or {}

    questions = _generate_questions(
        profile=profile,
        jd=req.job_description,
        job_title=req.job_title,
        company=req.company_name,
        interview_type=req.interview_type,
        difficulty=req.difficulty,
    )

    return InterviewSession(
        session_id=f"int_{uuid4().hex[:12]}",
        questions=questions,
        job_title=req.job_title or "Software Engineer",
        company_name=req.company_name or "the company",
        interview_type=req.interview_type,
        difficulty=req.difficulty,
    )


@router.post("/transcribe")
async def transcribe_audio(req: TranscribeRequest, user=Depends(get_current_user)):
    """Proxy audio to Wispr Flow API for transcription."""
    wispr_key = WISPR_API_KEY
    if not wispr_key:
        raise HTTPException(400, "Voice transcription not configured. Set WISPR_API_KEY env var.")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                WISPR_API_URL,
                headers={
                    "Authorization": f"Bearer {wispr_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "audio": req.audio_base64,
                    "language": ["en"],
                    "context": {
                        "app": {"name": "JobsSearch Interview Bot", "type": "ai"},
                    },
                },
            )
            if resp.status_code == 401:
                raise HTTPException(401, "Invalid Wispr API key.")
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"Wispr transcription failed: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(502, f"Wispr transcription failed: {str(e)}")

    return {"text": data.get("text", ""), "language": data.get("detected_language", "en")}


@router.post("/evaluate")
async def evaluate_answer(req: EvaluateRequest, user=Depends(get_current_user)):
    """Evaluate an interview answer and provide feedback."""
    result = _evaluate_answer(
        question=req.question,
        answer=req.answer,
        q_type=req.question_type,
        jd=req.job_description,
    )
    return result
