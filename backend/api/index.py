"""
HireFlow API — AI-Powered Job Matching Platform
================================================

FastAPI backend serving three user types:
  • Job Seekers — Build AI resumes, get matched to jobs
  • Recruiters  — Search candidates, manage pipelines
  • Companies   — Post jobs, track hiring analytics

Deployed on Vercel as a serverless Python function.
Database: Supabase (PostgreSQL)
"""

# Load .env for local development (no-op on Vercel)
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import auth, seeker, jobs, recruiter, company, chat

# ─── App Setup ────────────────────────────────────────────
app = FastAPI(
    title="HireFlow API",
    description="AI-powered job matching platform connecting seekers, recruiters, and companies.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS (allow frontend origins) ───────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
        "*",  # tighten in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ────────────────────────────────────
app.include_router(auth.router)
app.include_router(seeker.router)
app.include_router(jobs.router)
app.include_router(recruiter.router)
app.include_router(company.router)
app.include_router(chat.router)


# ─── Health Check ─────────────────────────────────────────
@app.get("/api", tags=["Health"])
async def root():
    return {
        "name": "HireFlow API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Health"])
async def health():
    from api.core.database import _get_client
    try:
        client = _get_client()
        users = client.table("users").select("id", count="exact").execute()
        jobs = client.table("jobs").select("id", count="exact").execute()
        apps = client.table("applications").select("id", count="exact").execute()
        return {
            "status": "ok",
            "database": "supabase",
            "users": users.count or 0,
            "jobs": jobs.count or 0,
            "applications": apps.count or 0,
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}
