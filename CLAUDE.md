# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HireFlow is an AI-powered three-sided job marketplace connecting Job Seekers, Recruiters, and Companies. It features intelligent job matching, AI resume analysis, real-time chat, and analytics dashboards.

## Tech Stack

- **Frontend:** React 18 + Vite (single-page application)
- **Backend:** FastAPI (Python 3.10+) with Pydantic validation
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Auth:** JWT tokens (7-day expiry) with bcrypt password hashing
- **Deployment:** Vercel (serverless)

## Development Commands

### Frontend (from `frontend/`)
```bash
npm install              # Install dependencies
npm run dev              # Dev server at http://localhost:5173 (proxies /api to backend)
npm run build            # Production build
npm test                 # Run vitest tests
```

### Backend (from `backend/`)
```bash
pip install -r requirements.txt    # Install dependencies
uvicorn api.index:app --reload --port 8000   # Dev server at http://localhost:8000

# API documentation available at:
# http://localhost:8000/docs (Swagger)
# http://localhost:8000/redoc (ReDoc)

# Run tests
pytest                   # All tests (128+)
pytest tests/unit/       # Unit tests only
pytest tests/integration/ # Integration tests only
pytest -v --tb=short     # Verbose with short tracebacks
```

### Environment Variables

Backend requires `.env` with:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SECRET_KEY=your-jwt-secret-key
```

## Architecture

```
Frontend (React SPA)
    │
    │ REST API + JWT Bearer tokens
    ▼
Backend (FastAPI)
    ├── api/index.py         → App entry, CORS, router registration
    ├── api/core/config.py   → JWT auth, bcrypt, OAuth2 dependencies
    ├── api/core/database.py → Supabase abstraction (30+ functions)
    ├── api/models/schemas.py → Pydantic request/response models
    ├── api/services/ai.py   → Matching engine, resume parser
    └── api/routes/          → 6 route modules (auth, seeker, jobs, recruiter, company, chat)
    │
    │ Supabase SDK
    ▼
Database (PostgreSQL + RLS)
    └── Tables: users, jobs, applications, conversations, conversation_participants, messages
```

### Key Patterns

1. **Route → Model → Service → Database**: Clean separation; no direct DB calls in route handlers
2. **Auth dependency injection**: `get_current_user()` (optional auth) vs `require_user()` (required auth)
3. **Database abstraction**: All Supabase calls go through `database.py` functions
4. **AI matching**: Rule-based scoring (0-99) considering skills, role alignment, work preferences, experience

### Frontend Structure

The frontend uses a single monolithic component (`src/App.jsx`, ~1200 lines) with role-based conditional rendering. `src/api.js` provides the API client abstraction.

## Database Schema

- **users**: All roles (seeker/recruiter/company) with JSONB fields for skills, experience, education
- **jobs**: Company postings with required_skills and nice_skills as JSONB arrays
- **applications**: Job applications with status pipeline; unique constraint on (job_id, seeker_id)
- **conversations/conversation_participants/messages**: Chat system with read status

## Test Markers

Tests use pytest markers defined in `pyproject.toml`:
- `@pytest.mark.unit` - No database or network
- `@pytest.mark.integration` - Mocked database, real FastAPI
- `@pytest.mark.regression` - Full flow tests

## API Endpoints

Key endpoint groups under `/api/`:
- `/auth/*` - Register, login
- `/seeker/*` - Profile, resume upload, AI matching
- `/jobs/*` - Job CRUD, applications, search
- `/recruiter/*` - Candidate search, pipeline, analytics
- `/company/*` - Dashboard, recommendations, analytics
- `/chat/*` - Conversations, messages
