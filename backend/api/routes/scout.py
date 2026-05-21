"""
Scout — AI Career Counselor & Job Search Strategist.
Full-spectrum career guidance: job search, interview prep, resume advice,
salary negotiation, career transitions, networking, work-life balance,
leadership coaching, and more.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import re
import random

from api.core.config import get_current_user, require_user
from api.core.database import get_user_by_id
import api.core.database as _db
from api.services.jobs_api import search_all_providers
from api.services.ai import compute_job_match
from api.services.scout_layoff import build_opening_response, route_message
from api.models.schemas import (
    ScoutSessionCreateRequest,
    ScoutSessionResponse,
    ScoutSessionMessage,
    ScoutSessionMessageRequest,
)

router = APIRouter(prefix="/api/scout", tags=["Scout"])


class ScoutMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ScoutResponse(BaseModel):
    reply: str
    jobs: Optional[list] = None
    suggestions: list[str] = []
    insight_type: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════
# Intent Detection — broad career counseling coverage
# ═══════════════════════════════════════════════════════════════════

_INTENTS = {
    "greeting": [
        "hello", "hi", "hey", "help", "what can you do", "who are you",
        "start", "get started", "good morning", "good evening",
    ],
    "job_search": [
        "find", "search", "looking for", "show me", "jobs", "roles", "positions",
        "opportunities", "openings", "hiring", "remote", "work from home",
        "startup", "intern", "entry level",
    ],
    "skill_gap": [
        "what am i missing", "skill gap", "upskill", "what should i learn",
        "why not matching", "not qualifying", "gap in my", "strengthen",
        "missing skills", "skill landscape", "skill analysis",
    ],
    "interview_prep": [
        "interview", "prepare for interview", "mock interview", "behavioral",
        "technical interview", "whiteboard", "coding challenge", "star method",
        "tell me about yourself", "common questions", "interview tips",
        "phone screen", "onsite", "panel interview",
    ],
    "resume_advice": [
        "resume", "cv", "cover letter", "improve my resume", "resume tips",
        "resume review", "ats", "applicant tracking", "resume format",
        "how to write", "tailor my resume", "resume keywords",
    ],
    "salary_negotiation": [
        "salary", "negotiate", "compensation", "pay", "offer", "counter offer",
        "worth", "underpaid", "raise", "equity", "stock options", "benefits",
        "total comp", "market rate", "how much should i",
    ],
    "career_transition": [
        "career change", "switch careers", "transition", "pivot",
        "change field", "new career", "different industry", "moving from",
        "switching to", "career pivot", "non-traditional", "bootcamp",
        "self-taught", "break into",
    ],
    "networking": [
        "network", "linkedin", "connect", "referral", "cold email",
        "reach out", "personal brand", "portfolio", "online presence",
        "twitter", "github profile", "blog", "conference", "meetup",
    ],
    "burnout_wellbeing": [
        "burnout", "burned out", "stressed", "overwhelmed", "exhausted",
        "work life balance", "toxic", "quit", "resign", "hate my job",
        "unmotivated", "mental health", "anxiety", "imposter syndrome",
        "feeling stuck", "bored at work",
    ],
    "promotion_growth": [
        "promotion", "promoted", "advance", "grow", "career growth",
        "next level", "senior", "staff engineer", "lead", "principal",
        "manager", "career ladder", "get promoted", "performance review",
        "raise", "title change", "move up",
    ],
    "freelance_entrepreneurship": [
        "freelance", "freelancing", "consulting", "contractor", "self-employed",
        "start a business", "side project", "side hustle", "entrepreneur",
        "independent", "client", "pricing", "hourly rate",
    ],
    "leadership": [
        "manage", "managing", "first time manager", "team lead",
        "give feedback", "one on one", "1:1", "delegate", "build a team",
        "hire", "fire", "people management", "engineering manager",
        "skip level", "difficult conversation",
    ],
    "industry_insights": [
        "market", "industry", "trend", "demand", "outlook", "layoff",
        "recession", "ai replacing", "future of", "hot skills",
        "growing field", "declining", "job market", "tech market",
        "hiring freeze",
    ],
    "education_learning": [
        "certification", "certificate", "course", "degree", "master",
        "phd", "bootcamp", "tutorial", "learn", "study", "training",
        "aws certified", "google certified", "pmp", "scrum master",
        "mooc", "udemy", "coursera",
    ],
    "workplace_dynamics": [
        "coworker", "colleague", "difficult boss", "micromanager",
        "office politics", "conflict", "hostile", "discrimination",
        "harassment", "feedback", "communication", "remote team",
        "async", "culture fit",
    ],
    "strategy": [
        "strategy", "advice", "tips", "how should i", "plan", "approach",
        "best way", "optimize", "stand out", "competitive",
    ],
}


def _detect_intent(message: str) -> str:
    msg = message.lower().strip()
    scores = {}
    for intent, triggers in _INTENTS.items():
        score = sum(1 for t in triggers if t in msg)
        if score > 0:
            scores[intent] = score
    if not scores:
        return "general"
    return max(scores, key=scores.get)


def _extract_search_params(message: str) -> dict:
    msg = message.lower()
    remote_only = any(w in msg for w in ["remote", "work from home", "wfh", "anywhere"])
    location = ""
    for pat in [r"in\s+([\w\s]+?)(?:\s+area|\s+region|\s*$|\s*,)",
                r"near\s+([\w\s]+?)(?:\s*$|\s*,)"]:
        m = re.search(pat, msg)
        if m:
            loc = m.group(1).strip()
            if loc not in ["a", "the", "an", "least", "most", "home", "general"]:
                location = loc
                break
    query = msg
    for filler in ["find me", "search for", "show me", "looking for", "i want",
                    "i need", "can you find", "please find", "help me find", "get me"]:
        query = query.replace(filler, "")
    query = query.replace("remote", "").replace("jobs", "").replace("roles", "").replace("positions", "")
    query = " ".join(query.split()).strip()
    if not query or len(query) < 3:
        query = "software engineer"
    return {"query": query, "location": location, "remote_only": remote_only}


def _p(profile: dict, key: str, default=None):
    """Safe profile accessor."""
    if not profile:
        return default
    return profile.get(key, default)


def _name(profile: dict) -> str:
    name = _p(profile, "name", "")
    return name.split()[0] if name else ""


# ═══════════════════════════════════════════════════════════════════
# Response Builders — one per career counseling domain
# ═══════════════════════════════════════════════════════════════════

def _build_greeting(profile: dict = None) -> ScoutResponse:
    name = _name(profile)
    reply = f"Hey{' ' + name if name else ''}! I'm **Scout**, your AI career counselor.\n\n"
    reply += "I'm here to help with **every aspect** of your career — not just finding jobs. Here's what I can help with:\n\n"
    reply += "**Job Search** — Smart job discovery across multiple providers\n"
    reply += "**Interview Prep** — Practice questions, STAR method, and confidence building\n"
    reply += "**Resume & Cover Letters** — Optimization tips and ATS-friendly advice\n"
    reply += "**Salary Negotiation** — Know your worth and how to ask for it\n"
    reply += "**Career Transitions** — Pivoting industries or roles strategically\n"
    reply += "**Skill Development** — What to learn next and where your gaps are\n"
    reply += "**Work-Life Balance** — Burnout prevention and wellbeing strategies\n"
    reply += "**Leadership & Growth** — From IC to manager and beyond\n\n"
    reply += "What's on your mind?"

    suggestions = [
        "Find me remote jobs",
        "Help me prepare for an interview",
        "How do I negotiate a better salary?",
        "I'm thinking about switching careers",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="greeting")


def _build_interview_prep(message: str, profile: dict = None) -> ScoutResponse:
    msg = message.lower()
    skills = _p(profile, "skills", [])
    experience = _p(profile, "experience_level", "")
    desired = _p(profile, "desired_roles", [])

    # Detect sub-topic
    if any(w in msg for w in ["behavioral", "star", "tell me about"]):
        reply = "**Behavioral Interview Mastery**\n\n"
        reply += "Use the **STAR method** for every behavioral question:\n\n"
        reply += "**S**ituation — Set the scene (1-2 sentences)\n"
        reply += "**T**ask — What was your responsibility?\n"
        reply += "**A**ction — What specifically did YOU do? (this is 60% of your answer)\n"
        reply += "**R**esult — Quantify the outcome\n\n"
        reply += "**Top 5 questions to prepare:**\n"
        reply += "1. Tell me about a time you dealt with a difficult stakeholder\n"
        reply += "2. Describe a project that failed. What did you learn?\n"
        reply += "3. How do you handle competing priorities?\n"
        reply += "4. Tell me about a time you went above and beyond\n"
        reply += "5. Describe a disagreement with a coworker and how you resolved it\n\n"
        reply += "**Pro tip:** Prepare 8-10 stories from your experience that can flex across different questions. Each story should highlight different strengths."
        suggestions = [
            "Give me a mock behavioral question",
            "How do I handle 'What's your weakness?'",
            "Tips for the technical round",
            "How do I ask good questions at the end?",
        ]

    elif any(w in msg for w in ["technical", "coding", "whiteboard", "system design"]):
        reply = "**Technical Interview Strategy**\n\n"
        if skills:
            reply += f"Based on your skills ({', '.join(skills[:5])}), focus on:\n\n"
        reply += "**Before the interview:**\n"
        reply += "• Practice 2-3 problems daily on LeetCode/HackerRank for 2 weeks\n"
        reply += "• Focus on: arrays, strings, trees, graphs, dynamic programming\n"
        reply += "• Review system design fundamentals (load balancers, caching, databases)\n\n"
        reply += "**During the interview:**\n"
        reply += "• **Clarify first** — Ask about edge cases, constraints, input size\n"
        reply += "• **Think out loud** — The process matters more than the perfect answer\n"
        reply += "• **Start simple** — Brute force first, then optimize\n"
        reply += "• **Test your code** — Walk through with a small example\n\n"
        reply += "**System design tips:**\n"
        reply += "• Start with requirements (functional & non-functional)\n"
        reply += "• Draw the high-level architecture first\n"
        reply += "• Discuss tradeoffs — there's no single right answer\n"
        reply += "• Mention monitoring, error handling, and scalability"
        suggestions = [
            "Common system design questions",
            "How to handle a problem I can't solve",
            "Behavioral round tips",
            "How to negotiate after passing interviews",
        ]

    elif any(w in msg for w in ["question", "ask"]) and any(w in msg for w in ["end", "them", "interviewer"]):
        reply = "**Great Questions to Ask Your Interviewer**\n\n"
        reply += "These show you're thoughtful and serious:\n\n"
        reply += "**About the role:**\n"
        reply += "• What does success look like in the first 90 days?\n"
        reply += "• What's the biggest challenge the team is facing right now?\n"
        reply += "• How is performance measured and reviewed?\n\n"
        reply += "**About the team:**\n"
        reply += "• What's the team's development process like?\n"
        reply += "• How do you handle technical debt vs. feature work?\n"
        reply += "• What's the on-call rotation like?\n\n"
        reply += "**Red flag detectors (ask subtly):**\n"
        reply += "• What's the typical tenure on this team?\n"
        reply += "• Why is this position open?\n"
        reply += "• How has the team changed in the last year?\n\n"
        reply += "**Never ask about:** salary (save for HR/recruiter), vacation days (in first round), or things easily found on their website."
        suggestions = [
            "How do I research a company before interviewing?",
            "Tips for phone screens",
            "How to follow up after an interview",
        ]

    elif any(w in msg for w in ["weakness", "greatest weakness"]):
        reply = "**How to Answer 'What's Your Greatest Weakness?'**\n\n"
        reply += "The formula: **Real weakness + Self-awareness + Active improvement**\n\n"
        reply += "**Good examples:**\n\n"
        reply += "• *\"I tend to over-engineer solutions. I've learned to timebox my design phase and ship iteratively instead of waiting for perfection.\"*\n\n"
        reply += "• *\"Public speaking used to make me nervous. I've been volunteering to present at team demos, and I joined a local Toastmasters group.\"*\n\n"
        reply += "• *\"I sometimes struggle with delegation — I want to ensure quality. I'm working on building trust through code reviews rather than doing everything myself.\"*\n\n"
        reply += "**Avoid:**\n"
        reply += "• \"I'm a perfectionist\" (cliché)\n"
        reply += "• \"I work too hard\" (nobody believes this)\n"
        reply += "• Anything that's actually a core requirement of the job"
        suggestions = [
            "How do I answer 'Tell me about yourself'?",
            "Behavioral interview strategies",
            "How to negotiate the offer",
        ]

    elif any(w in msg for w in ["tell me about yourself", "introduce myself"]):
        reply = "**Crafting Your 'Tell Me About Yourself' Answer**\n\n"
        reply += "Use the **Present-Past-Future** framework (60-90 seconds):\n\n"
        if profile:
            name = _name(profile)
            role = (desired[0] if desired else "professional") if desired else "professional"
            reply += f"**Here's a template based on your profile:**\n\n"
            reply += f"*\"I'm {name or 'a ' + role} "
            if skills:
                reply += f"with expertise in {', '.join(skills[:3])}. "
            if experience:
                reply += f"At the {experience} level, I've focused on... "
            reply += "[mention a key achievement]. "
            reply += "I'm excited about this role because [connect your experience to their needs].\"*\n\n"
        reply += "**Key principles:**\n"
        reply += "• **Lead with your current situation** — role, company, key focus\n"
        reply += "• **Highlight 2-3 relevant achievements** — quantified results\n"
        reply += "• **End with why THIS role** — connect your story to their needs\n"
        reply += "• **Keep it under 90 seconds** — this is a trailer, not the movie\n\n"
        reply += "**Avoid:** Life story from childhood, listing every job, or asking \"What do you want to know?\""
        suggestions = [
            "How do I handle the weakness question?",
            "Tips for technical interviews",
            "Practice behavioral questions with me",
        ]

    else:
        reply = "**Interview Preparation Guide**\n\n"
        role_hint = desired[0] if desired else "your target role"
        reply += f"Here's your action plan for **{role_hint}** interviews:\n\n"
        reply += "**Week 1-2: Foundation**\n"
        reply += "• Research the company deeply (product, culture, recent news)\n"
        reply += "• Prepare 8-10 STAR stories from your experience\n"
        reply += "• Practice your 60-second \"Tell me about yourself\"\n\n"
        reply += "**Week 2-3: Technical Depth**\n"
        reply += "• Review core concepts for your domain\n"
        reply += "• Do 2-3 practice problems or case studies daily\n"
        reply += "• Practice explaining technical concepts simply\n\n"
        reply += "**Day Before:**\n"
        reply += "• Review the job description one more time\n"
        reply += "• Prepare your questions for the interviewer\n"
        reply += "• Get good sleep — seriously, it matters more than last-minute cramming\n\n"
        reply += "**Confidence booster:** They already liked your resume enough to interview you. You belong in that room."
        suggestions = [
            "Help with behavioral questions",
            "Technical interview strategy",
            "What questions should I ask them?",
            "How to handle the salary question",
        ]

    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="interview_prep")


def _build_resume_advice(message: str, profile: dict = None) -> ScoutResponse:
    msg = message.lower()
    skills = _p(profile, "skills", [])

    if any(w in msg for w in ["cover letter", "letter"]):
        reply = "**Cover Letter That Gets Read**\n\n"
        reply += "Most cover letters go unread. Here's how to make yours count:\n\n"
        reply += "**The 4-paragraph formula:**\n\n"
        reply += "**1. The Hook** (2 sentences max)\n"
        reply += "Lead with why you're excited about THIS company — reference something specific (a product feature, blog post, mission statement).\n\n"
        reply += "**2. Your Value** (3-4 sentences)\n"
        reply += "Your top 2 achievements that directly relate to the job. Quantify everything.\n\n"
        reply += "**3. The Connection** (2-3 sentences)\n"
        reply += "Why your specific experience makes you uniquely suited. Not just \"I'm a good fit\" — show how your background solves their specific problem.\n\n"
        reply += "**4. The Close** (1-2 sentences)\n"
        reply += "Express enthusiasm and suggest next steps. Keep it confident, not desperate.\n\n"
        reply += "**Length:** Under 250 words. Hiring managers spend ~7 seconds scanning.\n"
        reply += "**Tone:** Professional but human. Write like you talk (minus the \"um\"s)."
        suggestions = [
            "Tips for my resume",
            "How to tailor for each application",
            "ATS optimization tips",
        ]

    elif any(w in msg for w in ["ats", "applicant tracking", "keyword"]):
        reply = "**Beating the ATS (Applicant Tracking System)**\n\n"
        reply += "~75% of resumes are filtered by ATS before a human sees them.\n\n"
        reply += "**Do:**\n"
        reply += "• Use **exact keywords** from the job description\n"
        reply += "• Standard section headers: \"Experience\", \"Education\", \"Skills\"\n"
        reply += "• Simple formatting — single column, standard fonts\n"
        reply += "• Save as PDF (unless they specify .docx)\n"
        reply += "• Include both acronyms AND full terms (\"AWS\" and \"Amazon Web Services\")\n\n"
        reply += "**Don't:**\n"
        reply += "• Use tables, columns, or text boxes\n"
        reply += "• Put important info in headers/footers\n"
        reply += "• Use images, icons, or graphics\n"
        reply += "• Use creative job titles instead of standard ones\n\n"
        if skills:
            reply += f"**Your skills to always include:** {', '.join(skills[:8])}\n\n"
        reply += "**Test:** Copy-paste your resume into plain text. If it's readable, ATS can parse it."
        suggestions = [
            "How to tailor my resume per job",
            "Cover letter tips",
            "What makes a resume stand out?",
        ]

    else:
        reply = "**Resume Optimization Guide**\n\n"
        reply += "The average recruiter spends **6-7 seconds** on a resume. Make every word count:\n\n"
        reply += "**Structure (1 page for <10 years, 2 max):**\n"
        reply += "• Contact info + LinkedIn\n"
        reply += "• Summary (2-3 punchy sentences — NOT an objective statement)\n"
        reply += "• Experience (reverse chronological)\n"
        reply += "• Skills (technical + tools)\n"
        reply += "• Education\n\n"
        reply += "**Experience bullets formula:**\n"
        reply += "**[Action verb]** + **[What you did]** + **[Quantified result]**\n\n"
        reply += "• ❌ \"Responsible for managing the database\"\n"
        reply += "• ✅ \"Optimized PostgreSQL queries, reducing p95 latency by 60% and saving $12K/month in compute costs\"\n\n"
        reply += "**Power verbs:** Architected, Automated, Delivered, Drove, Eliminated, Implemented, Launched, Migrated, Optimized, Scaled, Shipped, Streamlined\n\n"
        if skills:
            reply += f"**Your profile skills:** {', '.join(skills[:10])}\n"
            reply += "Make sure ALL of these appear on your resume — and add any you know but haven't listed.\n\n"
        reply += "**Final check:** Can someone understand your impact in 6 seconds? If not, simplify."
        suggestions = [
            "ATS optimization tips",
            "Help with my cover letter",
            "How do I quantify soft skills?",
            "Find jobs matching my resume",
        ]

    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="resume_advice")


def _build_salary_negotiation(message: str, profile: dict = None) -> ScoutResponse:
    msg = message.lower()
    experience = _p(profile, "experience_level", "")
    skills = _p(profile, "skills", [])
    salary_range = _p(profile, "salary_range", "")

    if any(w in msg for w in ["counter", "offer", "got an offer", "received"]):
        reply = "**Negotiating Your Job Offer**\n\n"
        reply += "You have more leverage than you think — **87% of employers expect negotiation**.\n\n"
        reply += "**Step 1: Don't respond immediately**\n"
        reply += "\"Thank you! I'm very excited. I'd like a day or two to review the full package.\"\n\n"
        reply += "**Step 2: Evaluate the full picture**\n"
        reply += "• Base salary\n"
        reply += "• Equity/stock (ask about vesting schedule, strike price, dilution)\n"
        reply += "• Bonus (signing + annual)\n"
        reply += "• PTO / flexibility\n"
        reply += "• 401k match, health benefits\n"
        reply += "• Remote work policy\n"
        reply += "• Learning budget, conference allowance\n\n"
        reply += "**Step 3: The counter**\n"
        reply += "\"Based on my research and experience, I was targeting [X-Y range]. Is there flexibility on base salary?\"\n\n"
        reply += "**Key rules:**\n"
        reply += "• **Never lie** about competing offers\n"
        reply += "• **Never give a number first** if you can avoid it\n"
        reply += "• If they can't move on salary, negotiate equity, signing bonus, or PTO\n"
        reply += "• Get everything in writing before accepting\n"
        reply += "• **A good negotiation leaves both sides feeling good**"
        suggestions = [
            "How do I research market rates?",
            "What if they ask my current salary?",
            "Is it okay to negotiate at a startup?",
        ]

    elif any(w in msg for w in ["raise", "current", "ask for more", "underpaid"]):
        reply = "**Asking for a Raise**\n\n"
        reply += "**Timing matters:**\n"
        reply += "• After a big win or successful project\n"
        reply += "• During review cycles (not right after layoffs)\n"
        reply += "• When you've been in the role 12+ months\n\n"
        reply += "**Build your case:**\n"
        reply += "1. Document your achievements with numbers\n"
        reply += "2. Research market rates (Levels.fyi, Glassdoor, Blind)\n"
        reply += "3. List additional responsibilities you've taken on\n"
        reply += "4. Prepare 3-5 specific impact examples\n\n"
        reply += "**The conversation:**\n"
        reply += "• Schedule a dedicated meeting (not in passing)\n"
        reply += "• Lead with value: \"I want to discuss my compensation in light of my contributions\"\n"
        reply += "• Present your research and achievements\n"
        reply += "• Give a specific number or range\n"
        reply += "• If \"no\" now, ask: \"What would it take, and when can we revisit?\"\n\n"
        reply += "**If the answer is still no:** That's data. It may be time to explore external options."
        suggestions = [
            "How to research my market value",
            "Help me find better-paying roles",
            "How do I bring up salary with my manager?",
        ]

    else:
        reply = "**Salary & Compensation Guide**\n\n"
        if salary_range:
            reply += f"Your target range: **{salary_range}**\n\n"
        reply += "**Know your market value:**\n"
        reply += "• **Levels.fyi** — Best for tech (real verified data)\n"
        reply += "• **Glassdoor** — Broad industry coverage\n"
        reply += "• **Blind** — Anonymous, often higher accuracy\n"
        reply += "• **Payscale** — Good for non-tech roles\n"
        reply += "• **LinkedIn Salary** — Network-based estimates\n\n"
        if skills:
            hot_skills = {"typescript", "rust", "kubernetes", "go", "pytorch", "terraform", "scala"}
            user_hot = [s for s in skills if s.lower() in hot_skills]
            if user_hot:
                reply += f"**Premium skills you have:** {', '.join(user_hot)} — these command 10-20% above base market rate\n\n"
        reply += "**Factors that increase your leverage:**\n"
        reply += "• Multiple offers (even from companies you don't prefer)\n"
        reply += "• Niche or in-demand skills\n"
        reply += "• Relevant domain expertise\n"
        reply += "• Strong referral or internal champion\n"
        reply += "• Willingness to walk away (the strongest lever)\n\n"
        reply += "**The golden rule:** Your salary is set in the negotiation, not the job posting. Always negotiate."
        suggestions = [
            "I just got an offer — how do I counter?",
            "How do I ask for a raise?",
            "What's the market rate for my skills?",
            "Find high-paying roles for my profile",
        ]

    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="salary_negotiation")


def _build_career_transition(message: str, profile: dict = None) -> ScoutResponse:
    msg = message.lower()
    skills = _p(profile, "skills", [])

    reply = "**Career Transition Playbook**\n\n"

    if any(w in msg for w in ["bootcamp", "self-taught", "no degree", "no experience"]):
        reply += "Breaking in without a traditional background is **absolutely possible** — "
        reply += "42% of developers are self-taught.\n\n"
        reply += "**The proven path:**\n\n"
        reply += "**Month 1-2: Build foundation**\n"
        reply += "• Pick ONE stack and go deep (e.g., React + Node or Python + Django)\n"
        reply += "• Complete a structured course (freeCodeCamp, The Odin Project, CS50)\n\n"
        reply += "**Month 3-4: Build proof**\n"
        reply += "• Create 2-3 real projects (not tutorials — solve actual problems)\n"
        reply += "• Contribute to open source (even documentation counts)\n"
        reply += "• Start a dev blog or Twitter presence\n\n"
        reply += "**Month 5-6: Get hired**\n"
        reply += "• Target startups and mid-size companies (more open to non-traditional)\n"
        reply += "• Leverage your previous career as a strength, not a weakness\n"
        reply += "• Network: 80% of jobs are filled through connections\n\n"
        reply += "**Your superpower:** Domain expertise from your previous career. A nurse who codes is rare. A teacher who codes understands learning. That's your differentiator."
    else:
        reply += "Changing careers is one of the bravest and smartest moves you can make. Here's how to do it strategically:\n\n"
        reply += "**Step 1: Map transferable skills**\n"
        if skills:
            reply += f"Your current skills ({', '.join(skills[:5])}) transfer more than you think.\n"
        reply += "• Communication, problem-solving, project management are universal\n"
        reply += "• Industry knowledge from your current field is valuable in the new one\n\n"
        reply += "**Step 2: Bridge the gap (don't leap)**\n"
        reply += "• Find roles that sit BETWEEN your current and target field\n"
        reply += "• Example: Marketing → Growth Engineer, Finance → FinTech Product Manager\n"
        reply += "• Take on side projects in the new field while still employed\n\n"
        reply += "**Step 3: Build credibility fast**\n"
        reply += "• Get 1-2 relevant certifications\n"
        reply += "• Do freelance or volunteer work in the new field\n"
        reply += "• Attend industry events and join communities\n\n"
        reply += "**Step 4: Reframe your story**\n"
        reply += "• Don't apologize for your background — position it as an advantage\n"
        reply += "• \"I bring 5 years of X perspective to Y\" is powerful\n"
        reply += "• Update your LinkedIn headline to reflect where you're going, not where you've been\n\n"
        reply += "**Timeline expectation:** 3-9 months for a deliberate, strategic transition."

    suggestions = [
        "What roles bridge my current and target field?",
        "How do I explain a career change in interviews?",
        "What skills should I learn for this transition?",
        "Find entry-level roles in my target field",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="career_transition")


def _build_networking(message: str, profile: dict = None) -> ScoutResponse:
    msg = message.lower()
    name = _name(profile)

    if any(w in msg for w in ["linkedin", "profile", "online"]):
        reply = "**LinkedIn Profile Optimization**\n\n"
        reply += "Your LinkedIn is often seen BEFORE your resume. Make it count:\n\n"
        reply += "**Headline** (most important!)\n"
        reply += "• ❌ \"Software Engineer at Company X\"\n"
        reply += "• ✅ \"Senior Frontend Engineer | React & TypeScript | Building tools that simplify complex workflows\"\n\n"
        reply += "**About section:**\n"
        reply += "• First 2 lines appear in previews — make them count\n"
        reply += "• Write in first person, be human\n"
        reply += "• Include what you do, what drives you, and what you're looking for\n\n"
        reply += "**Activity (the secret weapon):**\n"
        reply += "• Post 1-2x per week about your field\n"
        reply += "• Comment thoughtfully on others' posts\n"
        reply += "• Share what you're learning, building, or thinking about\n"
        reply += "• Recruiters notice active profiles 3x more\n\n"
        reply += "**Pro tip:** Turn on \"Open to Work\" but set it to recruiters-only visibility. More opportunities, less awkwardness."
    elif any(w in msg for w in ["cold email", "reach out", "cold message", "referral"]):
        reply = "**Cold Outreach That Gets Responses**\n\n"
        reply += "The response rate for cold messages is ~5-15%. Here's how to be in the top tier:\n\n"
        reply += "**The formula:**\n\n"
        reply += "1. **Personalized hook** — Reference their work, post, or something specific\n"
        reply += "2. **Credibility** — One sentence about you (relevance, not resume dump)\n"
        reply += "3. **Clear ask** — Specific and small (\"15-minute call\" not \"be my mentor\")\n\n"
        reply += "**Template:**\n"
        reply += f"*\"Hi [Name], I read your post about [topic] — the point about [specific detail] resonated with me. I'm {name or 'a developer'} exploring [area], and I'd love to hear how you approached [specific challenge]. Would you be open to a 15-minute chat this week?\"*\n\n"
        reply += "**Rules:**\n"
        reply += "• Keep it under 100 words\n"
        reply += "• Follow up once after 5-7 days (then stop)\n"
        reply += "• Don't ask for a job in the first message\n"
        reply += "• Thank them regardless of the outcome\n"
        reply += "• Coffee chats lead to referrals — referrals lead to jobs"
    else:
        reply = "**Networking Strategy Guide**\n\n"
        reply += "**80% of jobs are filled through networking.** But networking isn't what most people think.\n\n"
        reply += "**Mindset shift:** Networking isn't asking for favors. It's building genuine relationships over time.\n\n"
        reply += "**Where to network:**\n"
        reply += "• Industry meetups and conferences\n"
        reply += "• Online communities (Discord, Slack groups, Reddit)\n"
        reply += "• Open source projects\n"
        reply += "• LinkedIn (post + comment strategy)\n"
        reply += "• Alumni networks (most underused resource)\n\n"
        reply += "**The 5-5-5 weekly habit:**\n"
        reply += "• Connect with **5** new people\n"
        reply += "• Engage with **5** posts meaningfully\n"
        reply += "• Reach out to **5** existing connections\n\n"
        reply += "**Building your personal brand:**\n"
        reply += "• Share what you learn (blog posts, threads, talks)\n"
        reply += "• Help others publicly (answer questions, mentor)\n"
        reply += "• Be consistent — showing up regularly beats going viral\n\n"
        reply += "**Remember:** The best time to network is BEFORE you need something."

    suggestions = [
        "How do I optimize my LinkedIn?",
        "Help me write a cold outreach message",
        "How do I build a portfolio?",
        "How to get referrals at top companies",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="networking")


def _build_burnout_wellbeing(message: str, profile: dict = None) -> ScoutResponse:
    msg = message.lower()

    if any(w in msg for w in ["quit", "resign", "leave", "hate my job"]):
        reply = "**Thinking About Leaving? Let's Be Strategic**\n\n"
        reply += "Your feelings are valid. But let's make sure you're running **toward** something, not just **away** from something.\n\n"
        reply += "**Before you quit, ask yourself:**\n"
        reply += "• Is this the job, the team, the company, or the career?\n"
        reply += "• Have I communicated what's not working to my manager?\n"
        reply += "• Would a different team/role at the same company fix it?\n"
        reply += "• Am I making this decision from a rested place?\n\n"
        reply += "**If it's time to go:**\n"
        reply += "• Start searching while employed (3-6 month runway)\n"
        reply += "• Don't rage-quit — protect your references\n"
        reply += "• Save 3-6 months of expenses before leaving without a plan\n"
        reply += "• Take at least 2 weeks between jobs to decompress\n\n"
        reply += "**If it might be fixable:**\n"
        reply += "• Have an honest 1:1 with your manager\n"
        reply += "• Request a project change or team transfer\n"
        reply += "• Set clear boundaries (no Slack after 6pm, for example)\n"
        reply += "• Give it 30 days with new boundaries before deciding\n\n"
        reply += "**Either way:** You're not stuck. You always have options."
        suggestions = [
            "Help me start a job search quietly",
            "How do I set boundaries at work?",
            "What should I look for in my next role?",
            "How to handle a counter-offer",
        ]

    elif any(w in msg for w in ["imposter", "impostor", "don't belong", "not good enough", "fraud"]):
        reply = "**Dealing with Imposter Syndrome**\n\n"
        reply += "70% of people experience imposter syndrome. You're not alone, and it's not a sign of weakness — it often hits the most capable people.\n\n"
        reply += "**Reframe the feeling:**\n"
        reply += "• \"I don't know enough\" → \"I'm still learning, and that's normal\"\n"
        reply += "• \"I got lucky\" → \"I prepared, and opportunity met preparation\"\n"
        reply += "• \"Everyone else knows more\" → \"They're Googling things too\"\n\n"
        reply += "**Practical tactics:**\n"
        reply += "• Keep a **wins journal** — write down one thing you did well each day\n"
        reply += "• Save positive feedback (emails, Slack messages, reviews)\n"
        reply += "• Talk to a trusted colleague — they'll tell you you're not alone\n"
        reply += "• Mentor someone junior — teaching proves your knowledge to yourself\n\n"
        reply += "**The truth:** If you were actually an imposter, you wouldn't worry about being one. The concern itself is proof of your conscientiousness.\n\n"
        reply += "**You earned your seat at the table.** 💪"
        suggestions = [
            "How do I build confidence at work?",
            "Tips for speaking up in meetings",
            "How to handle not knowing the answer",
        ]

    else:
        reply = "**Burnout Prevention & Recovery**\n\n"
        reply += "Burnout isn't a badge of honor — it's a signal that something needs to change.\n\n"
        reply += "**Signs you might be burning out:**\n"
        reply += "• Dreading Monday on Sunday afternoon\n"
        reply += "• Cynicism about work that used to excite you\n"
        reply += "• Physical exhaustion that rest doesn't fix\n"
        reply += "• Difficulty concentrating or making decisions\n"
        reply += "• Withdrawing from colleagues\n\n"
        reply += "**Immediate relief (this week):**\n"
        reply += "• Block off 2 hours of \"no-meeting\" time daily\n"
        reply += "• Take a real lunch break away from your desk\n"
        reply += "• Turn off notifications after work hours\n"
        reply += "• Do one thing that recharges you (exercise, hobby, nature)\n\n"
        reply += "**Structural fixes (this month):**\n"
        reply += "• Audit your calendar — what can be declined or delegated?\n"
        reply += "• Have an honest conversation with your manager about workload\n"
        reply += "• Set hard boundaries and communicate them clearly\n"
        reply += "• Consider: is this temporary (crunch) or systemic (culture)?\n\n"
        reply += "**If it's systemic:** The problem is the environment, not you. No amount of self-care fixes a toxic workplace. It might be time for a change.\n\n"
        reply += "**You matter more than any job.** Take care of yourself first."
        suggestions = [
            "I'm thinking about quitting",
            "How do I set boundaries with my manager?",
            "Help me find a healthier work environment",
            "How do I recover from burnout?",
        ]

    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="burnout_wellbeing")


def _build_promotion_growth(message: str, profile: dict = None) -> ScoutResponse:
    experience = _p(profile, "experience_level", "")
    skills = _p(profile, "skills", [])

    reply = "**Career Growth & Promotion Strategy**\n\n"

    if "senior" in experience.lower() or "staff" in experience.lower() or "lead" in experience.lower():
        reply += "At your level, growth is less about technical skills and more about **impact and influence**.\n\n"
        reply += "**Staff/Principal Engineer Path:**\n"
        reply += "• Own cross-team technical strategy\n"
        reply += "• Write RFCs and technical vision docs\n"
        reply += "• Mentor senior engineers (not just juniors)\n"
        reply += "• Identify and solve problems nobody asked you to solve\n"
        reply += "• Build relationships with product and business leaders\n\n"
        reply += "**Engineering Manager Path:**\n"
        reply += "• Start with tech lead responsibilities\n"
        reply += "• Volunteer to run sprint planning, retros, 1:1s\n"
        reply += "• Focus on growing others — your success = their success\n"
        reply += "• Read: \"The Manager's Path\" by Camille Fournier\n"
        reply += "• Be intentional — management isn't a promotion, it's a career change\n\n"
        reply += "**The key question:** Do you want to go deep (Staff+) or wide (Management)? Both are equally valid."
    else:
        reply += "**Getting to the Next Level:**\n\n"
        reply += "**To reach Mid-Level:**\n"
        reply += "• Ship features independently without hand-holding\n"
        reply += "• Own small projects end-to-end\n"
        reply += "• Write tests, handle edge cases, think about prod readiness\n"
        reply += "• Start reviewing others' code\n\n"
        reply += "**To reach Senior:**\n"
        reply += "• Lead projects spanning multiple sprints\n"
        reply += "• Make technical decisions and document the \"why\"\n"
        reply += "• Mentor junior developers\n"
        reply += "• Identify and fix systemic problems (not just tickets)\n"
        reply += "• Communicate effectively with non-technical stakeholders\n\n"
        reply += "**The promotion framework:**\n"
        reply += "1. **Understand the rubric** — Ask your manager exactly what the next level looks like\n"
        reply += "2. **Do the job before you have the title** — Operate at the next level\n"
        reply += "3. **Make your work visible** — Share updates, present in demos\n"
        reply += "4. **Get a sponsor** — Someone senior who advocates for you in rooms you're not in\n"
        reply += "5. **Document everything** — Self-reviews write themselves when you track wins weekly"

    suggestions = [
        "Should I go into management or stay technical?",
        "How do I make my work more visible?",
        "What skills do I need for the next level?",
        "Find senior/staff level roles",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="promotion_growth")


def _build_freelance(message: str, profile: dict = None) -> ScoutResponse:
    skills = _p(profile, "skills", [])

    reply = "**Freelancing & Independent Consulting**\n\n"
    reply += "Freelancing isn't just \"work without a boss\" — it's running a business.\n\n"

    reply += "**Getting started:**\n"
    reply += "1. **Build a runway** — Save 6 months of expenses before going full-time\n"
    reply += "2. **Start as a side gig** — Take 1-2 clients while still employed\n"
    reply += "3. **Pick a niche** — \"I build React dashboards for fintech\" beats \"I do web dev\"\n\n"

    if skills:
        reply += f"**Your marketable skills:** {', '.join(skills[:6])}\n\n"

    reply += "**Pricing:**\n"
    reply += "• **Hourly:** Take your desired annual salary ÷ 1,000 (e.g., $150K = $150/hr)\n"
    reply += "• **Project-based:** Better for both sides — scope the work, price the value\n"
    reply += "• **Retainer:** Monthly fee for ongoing availability — best for stability\n"
    reply += "• **Never** compete on price. Compete on expertise and reliability.\n\n"

    reply += "**Finding clients:**\n"
    reply += "• Toptal, Upwork (start here for credibility)\n"
    reply += "• Your existing network (tell EVERYONE)\n"
    reply += "• LinkedIn content marketing\n"
    reply += "• Open source contributions that showcase your expertise\n"
    reply += "• Speak at meetups and conferences\n\n"

    reply += "**Common mistakes:**\n"
    reply += "• Underpricing yourself (raise rates every 6 months)\n"
    reply += "• Not having a contract (ALWAYS have one)\n"
    reply += "• Scope creep (define deliverables clearly)\n"
    reply += "• Forgetting to save for taxes (set aside 25-30%)"

    suggestions = [
        "How do I price my services?",
        "How to find my first client",
        "Should I freelance or go full-time?",
        "How to build a portfolio",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="freelance")


def _build_leadership(message: str, profile: dict = None) -> ScoutResponse:
    msg = message.lower()

    if any(w in msg for w in ["first time", "new manager", "just promoted"]):
        reply = "**First-Time Manager Survival Guide**\n\n"
        reply += "Congratulations! The skills that made you a great IC won't automatically make you a great manager. That's normal.\n\n"
        reply += "**First 30 days:**\n"
        reply += "• Have 1:1s with every team member — LISTEN more than you talk\n"
        reply += "• Ask: \"What's working? What's not? What would you change?\"\n"
        reply += "• Don't change anything yet — earn trust first\n"
        reply += "• Build relationships with peer managers and your skip-level\n\n"
        reply += "**Core habits to build:**\n"
        reply += "• Weekly 1:1s (never skip these — they're sacred)\n"
        reply += "• Give feedback in real-time, not just during reviews\n"
        reply += "• Shield your team from unnecessary chaos\n"
        reply += "• Celebrate wins publicly, give critical feedback privately\n\n"
        reply += "**Common new-manager mistakes:**\n"
        reply += "• Trying to be everyone's friend (be friendly, not a friend)\n"
        reply += "• Doing the work yourself instead of delegating\n"
        reply += "• Avoiding difficult conversations\n"
        reply += "• Measuring your value by YOUR output instead of the TEAM's\n\n"
        reply += "**Must-read:** \"The Manager's Path\" by Camille Fournier"
    elif any(w in msg for w in ["feedback", "difficult conversation", "conflict"]):
        reply = "**Giving Effective Feedback**\n\n"
        reply += "Great managers give feedback that's **specific, kind, and actionable**.\n\n"
        reply += "**The SBI Framework:**\n"
        reply += "• **Situation:** \"In yesterday's code review...\"\n"
        reply += "• **Behavior:** \"I noticed you dismissed two suggestions without explanation...\"\n"
        reply += "• **Impact:** \"...which made the junior dev hesitant to contribute further.\"\n\n"
        reply += "**For positive feedback:**\n"
        reply += "• Be specific (not just \"great job\")\n"
        reply += "• Explain the impact (\"Your documentation saved the new hire 2 days of onboarding\")\n"
        reply += "• Give it publicly when appropriate\n\n"
        reply += "**For critical feedback:**\n"
        reply += "• Give it privately, promptly, and kindly\n"
        reply += "• Focus on behavior, not character\n"
        reply += "• End with a clear expectation or action item\n"
        reply += "• Follow up to acknowledge improvement\n\n"
        reply += "**The ratio:** Aim for 5 positive interactions for every 1 critical one. Not because you're sugarcoating — because most people don't hear enough genuine appreciation."
    else:
        reply = "**Leadership & People Management**\n\n"
        reply += "Leadership isn't about having authority. It's about creating the conditions for others to do their best work.\n\n"
        reply += "**The 4 pillars of engineering leadership:**\n\n"
        reply += "**1. Direction** — Does your team know WHY they're building what they're building?\n"
        reply += "• Connect daily work to business outcomes\n"
        reply += "• Be transparent about priorities and tradeoffs\n\n"
        reply += "**2. Coaching** — Are you growing your people?\n"
        reply += "• Regular 1:1s focused on THEIR growth, not status updates\n"
        reply += "• Stretch assignments that challenge without overwhelming\n"
        reply += "• Create psychological safety for mistakes\n\n"
        reply += "**3. Execution** — Is the team shipping reliably?\n"
        reply += "• Remove blockers faster than you add process\n"
        reply += "• Protect focus time — minimize meetings\n"
        reply += "• Celebrate shipped work, not just started work\n\n"
        reply += "**4. Culture** — Would someone enjoy joining your team?\n"
        reply += "• Model the behavior you want to see\n"
        reply += "• Address toxic behavior immediately\n"
        reply += "• Build rituals that strengthen connection"

    suggestions = [
        "How do I give difficult feedback?",
        "Tips for running effective 1:1s",
        "How to delegate without micromanaging",
        "Should I move into management?",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="leadership")


def _build_industry_insights(message: str, profile: dict = None) -> ScoutResponse:
    skills = _p(profile, "skills", [])

    reply = "**Tech Industry Landscape — 2025**\n\n"

    reply += "**Hottest areas right now:**\n"
    reply += "• **AI/ML Engineering** — Demand up 60%+, especially MLOps and AI infrastructure\n"
    reply += "• **Platform Engineering** — Internal developer platforms, replacing pure DevOps\n"
    reply += "• **Cybersecurity** — Chronic talent shortage, high salaries\n"
    reply += "• **Rust & Go** — Growing rapidly for systems and cloud infrastructure\n"
    reply += "• **Data Engineering** — Every company is drowning in data, not enough pipelines\n\n"

    reply += "**Stable & strong:**\n"
    reply += "• Full-stack development (React + Node/Python remains king)\n"
    reply += "• Cloud architecture (AWS/GCP certifications = instant credibility)\n"
    reply += "• Mobile (React Native, Flutter, Swift)\n"
    reply += "• Product Management (especially technical PMs)\n\n"

    reply += "**Changing landscape:**\n"
    reply += "• AI is augmenting (not replacing) most developer roles\n"
    reply += "• Remote work is stabilizing — fewer fully-remote, more hybrid\n"
    reply += "• Startups are hiring more carefully but paying competitively\n"
    reply += "• \"Full-stack\" increasingly means frontend + backend + infrastructure\n\n"

    if skills:
        hot = {"python", "typescript", "rust", "go", "kubernetes", "terraform", "pytorch", "react"}
        user_hot = [s for s in skills if s.lower() in hot]
        declining = {"jquery", "php", "perl", "coffeescript", "backbone"}
        user_declining = [s for s in skills if s.lower() in declining]
        if user_hot:
            reply += f"**Your in-demand skills:** {', '.join(user_hot)} — these are strong in today's market\n"
        if user_declining:
            reply += f"**Consider updating:** {', '.join(user_declining)} — demand is declining; pair with modern alternatives\n"

    reply += "\n**The takeaway:** The best investment is T-shaped expertise — go deep in one area, stay current in adjacent ones."

    suggestions = [
        "What skills should I learn next?",
        "Is AI going to replace developers?",
        "Find jobs in the hottest areas",
        "How do I future-proof my career?",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="industry_insights")


def _build_education_learning(message: str, profile: dict = None) -> ScoutResponse:
    skills = _p(profile, "skills", [])
    experience = _p(profile, "experience_level", "")

    reply = "**Learning & Professional Development**\n\n"

    if any(w in message.lower() for w in ["certification", "certified", "certificate"]):
        reply += "**High-ROI Certifications for 2025:**\n\n"
        reply += "**Cloud (highest demand):**\n"
        reply += "• AWS Solutions Architect Associate — ~$40K salary bump\n"
        reply += "• Google Cloud Professional — growing fastest\n"
        reply += "• Azure Administrator — dominant in enterprise\n\n"
        reply += "**Security:**\n"
        reply += "• CompTIA Security+ — great entry point\n"
        reply += "• CISSP — senior security roles\n\n"
        reply += "**Data & AI:**\n"
        reply += "• Google Data Analytics Certificate\n"
        reply += "• TensorFlow Developer Certificate\n"
        reply += "• dbt Analytics Engineering Certification\n\n"
        reply += "**Management:**\n"
        reply += "• PMP (Project Management Professional)\n"
        reply += "• Certified Scrum Master (CSM)\n\n"
        reply += "**My honest take:** Certifications matter most for career changers and regulated industries. For experienced developers, a strong portfolio often beats a cert."
    elif any(w in message.lower() for w in ["degree", "master", "phd", "college", "university"]):
        reply += "**Is a Degree Worth It?**\n\n"
        reply += "**CS Degree:** Valuable but not required. ~50% of developers working at FAANG don't have a CS degree.\n\n"
        reply += "**Master's Degree:** Worth it if:\n"
        reply += "• You want to specialize (ML, robotics, distributed systems)\n"
        reply += "• You're targeting research-heavy roles\n"
        reply += "• Your employer will pay for it\n"
        reply += "• You want the visa/immigration benefits\n\n"
        reply += "**Skip it if:**\n"
        reply += "• You're primarily doing it for a salary bump (ROI varies widely)\n"
        reply += "• You could spend those 2 years gaining real experience instead\n"
        reply += "• You're already senior — diminishing returns\n\n"
        reply += "**PhD:** Only if you genuinely love research. It's a lifestyle choice, not a career accelerator (except in AI/ML where it still matters).\n\n"
        reply += "**Alternative path:** Georgia Tech's OMSCS — $7K total for a top-10 CS master's, fully online."
    else:
        reply += "**Building a Learning Habit:**\n\n"
        reply += "**The 1-hour rule:** Dedicate 1 hour per workday to learning. This compounds dramatically over a year.\n\n"
        reply += "**Best free resources:**\n"
        reply += "• **freeCodeCamp** — Full curricula, project-based\n"
        reply += "• **The Odin Project** — Deep full-stack curriculum\n"
        reply += "• **CS50 (Harvard)** — Best intro CS course ever made\n"
        reply += "• **MIT OpenCourseWare** — Advanced topics\n"
        reply += "• **YouTube** — Fireship, Theo, ThePrimeagen for staying current\n\n"
        reply += "**Best paid resources:**\n"
        reply += "• **Frontend Masters** — Frontend & Node deep dives\n"
        reply += "• **Pluralsight** — Enterprise tech & cloud\n"
        reply += "• **Educative.io** — Text-based, great for interview prep\n"
        reply += "• **O'Reilly Learning** — Books + video, huge library\n\n"
        if skills:
            reply += f"**Based on your skills ({', '.join(skills[:4])})**, consider learning:\n"
            if any(s.lower() in ["react", "javascript", "typescript"] for s in skills):
                reply += "• Next.js or Remix (full-stack React)\n"
                reply += "• Testing (Vitest, Playwright)\n"
            if any(s.lower() in ["python", "django", "fastapi"] for s in skills):
                reply += "• Async Python patterns\n"
                reply += "• Data engineering fundamentals\n"
            if any(s.lower() in ["aws", "docker", "kubernetes"] for s in skills):
                reply += "• Terraform or Pulumi (IaC)\n"
                reply += "• Observability (OpenTelemetry)\n"

    suggestions = [
        "What certifications should I get?",
        "Is a master's degree worth it?",
        "Best free resources to learn coding",
        "What should I learn based on my skills?",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="education")


def _build_workplace_dynamics(message: str, profile: dict = None) -> ScoutResponse:
    msg = message.lower()

    if any(w in msg for w in ["difficult boss", "micromanager", "bad manager"]):
        reply = "**Dealing with a Difficult Manager**\n\n"
        reply += "Before labeling them \"bad,\" try to understand their pressure. Then decide how to respond:\n\n"
        reply += "**If they micromanage:**\n"
        reply += "• Proactively over-communicate — send updates before they ask\n"
        reply += "• Ask for clear expectations: \"What does 'done' look like for you?\"\n"
        reply += "• Build trust through consistent, reliable delivery\n"
        reply += "• Propose: \"Can we try weekly check-ins instead of daily?\"\n\n"
        reply += "**If they don't give feedback:**\n"
        reply += "• Ask directly: \"What's one thing I could do better?\"\n"
        reply += "• Request regular 1:1s if you don't have them\n"
        reply += "• Seek feedback from peers and skip-levels too\n\n"
        reply += "**If it's genuinely toxic:**\n"
        reply += "• Document specific incidents (dates, quotes, witnesses)\n"
        reply += "• Talk to HR or your skip-level manager\n"
        reply += "• Start your job search — life is too short\n\n"
        reply += "**The 6-month rule:** Try to improve the relationship for 6 months with specific strategies. If nothing changes, it's data — not failure."
    else:
        reply = "**Navigating Workplace Dynamics**\n\n"
        reply += "Technical skills get you hired. Workplace skills get you promoted.\n\n"
        reply += "**Communication:**\n"
        reply += "• Adjust your communication style to your audience\n"
        reply += "• For executives: lead with impact, not implementation\n"
        reply += "• For peers: be direct, give context, propose solutions\n"
        reply += "• For reports: be clear, supportive, growth-oriented\n\n"
        reply += "**Visibility without bragging:**\n"
        reply += "• Share learnings in team channels\n"
        reply += "• Present at team demos and all-hands\n"
        reply += "• Write clear, thorough pull request descriptions\n"
        reply += "• Volunteer for cross-team initiatives\n\n"
        reply += "**Handling conflict:**\n"
        reply += "• Address issues early — they don't age well\n"
        reply += "• Assume good intent until proven otherwise\n"
        reply += "• Focus on the problem, not the person\n"
        reply += "• Propose solutions, don't just identify problems\n\n"
        reply += "**Building influence:**\n"
        reply += "• Be the person who follows through\n"
        reply += "• Help others succeed — it always comes back\n"
        reply += "• Develop opinions and share them thoughtfully"

    suggestions = [
        "How do I deal with a micromanager?",
        "Tips for speaking up in meetings",
        "How to handle office politics",
        "I'm thinking about switching teams",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="workplace")


def _build_skill_gap_response(profile: dict) -> ScoutResponse:
    skills = [s.lower() for s in (profile.get("skills") or [])]
    experience = profile.get("experience_level", "")

    skill_clusters = {
        "frontend": {"react", "vue", "angular", "typescript", "javascript", "css", "html", "next.js", "tailwind"},
        "backend": {"python", "node.js", "java", "go", "sql", "postgresql", "redis", "graphql", "fastapi", "django"},
        "devops": {"docker", "kubernetes", "aws", "terraform", "ci/cd", "linux", "azure", "gcp"},
        "data & ai": {"python", "sql", "machine learning", "tensorflow", "pytorch", "pandas"},
        "leadership": {"agile/scrum", "team leadership", "mentoring", "stakeholder mgmt", "roadmapping"},
    }

    coverage = {}
    for cluster, cluster_skills in skill_clusters.items():
        user_has = cluster_skills & set(skills)
        missing = cluster_skills - set(skills)
        if user_has:
            pct = len(user_has) / len(cluster_skills) * 100
            coverage[cluster] = {"pct": pct, "has": user_has, "missing": missing}

    if not coverage:
        reply = "I'd love to analyze your skill gaps, but I need more profile data. "
        reply += "Make sure your resume is uploaded with your skills listed!"
        return ScoutResponse(reply=reply, suggestions=["Help with my resume", "What should I learn?"], insight_type="skill_gap")

    reply = "Here's your **skill landscape** analysis:\n\n"
    sorted_clusters = sorted(coverage.items(), key=lambda x: x[1]["pct"], reverse=True)
    for cluster, data in sorted_clusters:
        bar_filled = int(data["pct"] / 10)
        bar_empty = 10 - bar_filled
        bar = "█" * bar_filled + "░" * bar_empty
        reply += f"**{cluster.title()}** {bar} {data['pct']:.0f}%\n"
        if data["missing"] and data["pct"] < 80:
            top_missing = sorted(data["missing"])[:3]
            reply += f"  ↳ Learn: {', '.join(s.title() for s in top_missing)}\n"
        reply += "\n"

    if "senior" in experience.lower() or "staff" in experience.lower() or "lead" in experience.lower():
        reply += "**Senior-level tip:** At your level, system design, mentorship, and cross-team influence matter more than adding frameworks."
    else:
        best = sorted_clusters[0][0]
        reply += f"**Growth strategy:** You're strongest in **{best}**. Deepen this — specialists earn more than generalists."

    suggestions = [
        "Find roles that match my current skills",
        "What certifications should I get?",
        "Show me stretch roles I could grow into",
        "What's trending in my strongest area?",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="skill_gap")


def _build_strategy_response(message: str, profile: dict) -> ScoutResponse:
    skills = profile.get("skills") or []
    desired = profile.get("desired_roles") or []
    experience = profile.get("experience_level", "")
    prefs = profile.get("work_preferences") or []

    reply = "Here's my **strategic assessment** for your career:\n\n"
    if skills:
        reply += f"**Your arsenal:** {', '.join(skills[:8])}"
        if len(skills) > 8:
            reply += f" +{len(skills) - 8} more"
        reply += "\n\n"
    if desired:
        reply += f"**Target roles:** {', '.join(desired[:4])}\n\n"

    reply += "**Positioning tips:**\n"
    hot_skills = {"typescript", "rust", "kubernetes", "terraform", "pytorch", "next.js", "go"}
    user_hot = [s for s in skills if s.lower() in hot_skills]
    if user_hot:
        reply += f"• Your hot skills ({', '.join(user_hot)}) are in high demand — lead with these\n"
    if "Remote" in prefs:
        reply += "• Remote roles are competitive — highlight async communication and self-management\n"
    if "senior" in experience.lower() or "staff" in experience.lower():
        reply += "• At your level, impact stories > tech stack lists\n"
        reply += "• Focus on: teams scaled, systems designed, revenue impacted\n"
    else:
        reply += "• Quantify everything: \"Reduced load time by 40%\" beats \"Improved performance\"\n"
        reply += "• Side projects and open source fill experience gaps\n"

    reply += "\n**Quick wins:**\n"
    reply += "• Apply to companies with 50-500 employees — best response rates\n"
    reply += "• Customize your first 2 sentences for each application\n"
    reply += "• Tuesday-Thursday, 9-11 AM is the best time to apply"

    suggestions = [
        "Find me jobs where I'd stand out",
        "How should I prepare for interviews?",
        "What skills should I learn next?",
        "How do I negotiate a better salary?",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="strategy")


def _build_general_response(message: str, profile: dict = None) -> ScoutResponse:
    """Fallback for messages that don't match a specific intent."""
    reply = "That's a great question! While I think about the best way to help, here are some things I can dive deep on:\n\n"
    reply += "• **Job search** — \"Find me remote Python jobs in Austin\"\n"
    reply += "• **Interview prep** — \"Help me prepare for behavioral interviews\"\n"
    reply += "• **Resume advice** — \"How do I make my resume ATS-friendly?\"\n"
    reply += "• **Salary negotiation** — \"I got an offer, how do I negotiate?\"\n"
    reply += "• **Career change** — \"How do I switch from marketing to tech?\"\n"
    reply += "• **Burnout & wellbeing** — \"I'm feeling burned out\"\n"
    reply += "• **Growth & promotion** — \"How do I get promoted to senior?\"\n"
    reply += "• **Leadership** — \"I'm a new manager, help!\"\n"
    reply += "• **Networking** — \"How do I optimize my LinkedIn?\"\n"
    reply += "• **Industry trends** — \"What's the job market like right now?\"\n\n"
    reply += "Try asking me anything about your career!"

    suggestions = [
        "What can you help me with?",
        "Analyze my skill gaps",
        "Find jobs matching my profile",
        "Help me prepare for an interview",
    ]
    return ScoutResponse(reply=reply, suggestions=suggestions, insight_type="general")


# ═══════════════════════════════════════════════════════════════════
# Main Chat Endpoint
# ═══════════════════════════════════════════════════════════════════

@router.post("/chat", response_model=ScoutResponse)
async def scout_chat(req: ScoutMessage, user=Depends(get_current_user)):
    """Chat with Scout — your AI career counselor."""
    from api.core.config import RAPIDAPI_KEY

    message = req.message.strip()
    if not message:
        raise HTTPException(400, "Message cannot be empty")

    profile = None
    if user:
        profile = get_user_by_id(user["id"]) or {}

    intent = _detect_intent(message)

    # ── Route to the appropriate counselor ──
    if intent == "greeting":
        return _build_greeting(profile)

    if intent == "interview_prep":
        return _build_interview_prep(message, profile)

    if intent == "resume_advice":
        return _build_resume_advice(message, profile)

    if intent == "salary_negotiation":
        return _build_salary_negotiation(message, profile)

    if intent == "career_transition":
        return _build_career_transition(message, profile)

    if intent == "networking":
        return _build_networking(message, profile)

    if intent == "burnout_wellbeing":
        return _build_burnout_wellbeing(message, profile)

    if intent == "promotion_growth":
        return _build_promotion_growth(message, profile)

    if intent == "freelance_entrepreneurship":
        return _build_freelance(message, profile)

    if intent == "leadership":
        return _build_leadership(message, profile)

    if intent == "industry_insights":
        return _build_industry_insights(message, profile)

    if intent == "education_learning":
        return _build_education_learning(message, profile)

    if intent == "workplace_dynamics":
        return _build_workplace_dynamics(message, profile)

    if intent == "skill_gap":
        if not profile:
            return ScoutResponse(
                reply="I'd love to analyze your skills, but you'll need to **sign in** first so I can see your profile!",
                suggestions=["What can you do?", "Find remote jobs"],
                insight_type="skill_gap",
            )
        return _build_skill_gap_response(profile)

    if intent == "strategy":
        if not profile:
            return ScoutResponse(
                reply="Sign in and I'll give you personalized career strategy based on your profile!",
                suggestions=["What can you do?", "Search for React developer jobs"],
                insight_type="strategy",
            )
        return _build_strategy_response(message, profile)

    # ── Job search (explicit or fallback for unmatched) ──
    if intent == "job_search":
        return await _handle_job_search(message, profile, RAPIDAPI_KEY)

    # ── General fallback ──
    return _build_general_response(message, profile)


async def _handle_job_search(message: str, profile: dict, api_key: str) -> ScoutResponse:
    params = _extract_search_params(message)
    jobs = []
    if api_key:
        try:
            jobs = await search_all_providers(
                query=params["query"],
                location=params["location"],
                remote_only=params["remote_only"],
                api_key=api_key,
            )
        except Exception:
            pass

    if profile and jobs:
        for job in jobs:
            try:
                match_result = compute_job_match(
                    user_skills=profile.get("skills", []),
                    desired_roles=profile.get("desired_roles", []),
                    work_preferences=profile.get("work_preferences", []),
                    salary_range=profile.get("salary_range"),
                    experience_level=profile.get("experience_level"),
                    job=job,
                )
                job["match_score"] = match_result["match_score"]
                job["match_reasons"] = match_result["match_reasons"]
            except Exception:
                job["match_score"] = 0
                job["match_reasons"] = []
        jobs.sort(key=lambda j: j.get("match_score", 0), reverse=True)

    if jobs:
        top_match = jobs[0].get("match_score", 0) if profile else None
        remote_count = sum(1 for j in jobs if j.get("remote"))
        reply = f"Found **{len(jobs)} jobs** matching your search"
        if params["location"]:
            reply += f" in **{params['location'].title()}**"
        if params["remote_only"]:
            reply += " (remote only)"
        reply += "!\n\n"
        if top_match and top_match >= 80:
            reply += f"Your best match is **{top_match}%** — that's a strong fit!\n"
        elif top_match:
            reply += f"Top match score: **{top_match}%**.\n"
        if remote_count:
            reply += f"**{remote_count}** of these offer remote work.\n"
        reply += "\nHere are your top results:"
        suggestions = [
            "What skills am I missing for these?",
            "How should I prepare to apply?",
            "Help me write a cover letter",
        ]
    else:
        reply = "I couldn't find jobs matching that right now. Try a different query!"
        suggestions = [
            "Find remote developer jobs",
            "Search for Python engineer roles",
            "What roles match my profile?",
        ]

    return ScoutResponse(
        reply=reply,
        jobs=jobs[:10],
        suggestions=suggestions,
        insight_type="job_search",
    )


# ═══════════════════════════════════════════════════════════════════
# LP2: Layoff-tuned Scout sessions (homepage triage handoff)
# ═══════════════════════════════════════════════════════════════════

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _fetch_triage(triage_id: str) -> dict | None:
    """Returns the triage row dict, or None if not found."""
    result = (
        _db.supabase.table('triage_responses')
        .select('*')
        .eq('id', triage_id)
        .execute()
    )
    if not result.data:
        return None
    return result.data[0]


@router.post('/sessions', response_model=ScoutSessionResponse)
def create_session(req: ScoutSessionCreateRequest) -> ScoutSessionResponse:
    """Create a new Scout session, optionally seeded by a triage_id."""
    profile: dict = {}
    suggested_first_topic: str | None = None

    try:
        if req.triage_id:
            triage = _fetch_triage(req.triage_id)
            if triage:
                profile = triage.get('answers') or {}
                plan = triage.get('plan') or {}
                suggested_first_topic = plan.get('suggested_first_topic')

        opening_content = build_opening_response(profile, suggested_first_topic)
        first_msg = ScoutSessionMessage(
            role='scout', content=opening_content, ts=_now_iso(),
        )

        insert_result = (
            _db.supabase.table('scout_sessions')
            .insert({
                'user_id': None,
                'triage_id': req.triage_id,
                'messages': [first_msg.model_dump()],
            })
            .execute()
        )
        if not insert_result.data:
            raise RuntimeError('insert returned no data')

        session_id = str(insert_result.data[0]['id'])
        return ScoutSessionResponse(session_id=session_id, messages=[first_msg])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail='Scout session service temporarily unavailable.',
        ) from exc
