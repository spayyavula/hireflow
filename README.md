# HireFlow

**AI-powered three-sided job marketplace** connecting Job Seekers, Recruiters, and Companies.

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

---

## Overview

HireFlow is a full-stack AI-powered hiring platform with three distinct user experiences:

- **Job Seekers** — Upload resumes or build AI-enhanced profiles, get matched to jobs with intelligent scoring, apply with one click
- **Recruiters** — Search candidates by skill, manage hiring pipelines, track analytics
- **Companies** — Post jobs, review applicants, advance candidates through hiring stages

### Key Features

- **AI Resume Builder** — 6-step guided wizard with AI-generated summaries, headlines, and skill suggestions
- **Smart Matching** — Scoring algorithm (0-99) based on skills, role, experience, and remote preferences
- **Resume Parsing** — PDF/DOCX upload with automatic profile extraction
- **AI Job Matcher** — LLM-powered resume-to-JD analysis, cover letter generation, and gap detection
- **Real-time Chat** — In-app messaging between seekers, recruiters, and companies
- **Analytics Dashboards** — Role-specific insights and hiring metrics
- **Feature Requests Board** — Community-driven idea voting, comments, and status tracking
- **Pressroom CMS** — Browserless blog system with CLI authoring, AI content enrichment, and SEO optimization
- **Related Jobs Engine** — Blog posts auto-link to matching job listings via skill extraction
- **Social Sharing** — Share blog posts to LinkedIn, X, Facebook, and copy link
- **Mobile App** — React Native (Expo) app for Android/iOS with full feature parity
- **External Job Search** — Aggregated job listings from RapidAPI alongside internal postings

## Architecture

```
hireflow/
├── frontend/              → Vite + React SPA
│   ├── src/App.jsx        → Single-file React app (4000+ lines)
│   ├── src/api.js         → API client for backend communication
│   └── vercel.json        → Vercel SPA deployment config
│
├── backend/               → FastAPI + Supabase
│   ├── api/
│   │   ├── index.py               → App entrypoint + CORS + routers
│   │   ├── core/config.py         → JWT auth, bcrypt hashing
│   │   ├── core/database.py       → 50+ Supabase DB functions
│   │   ├── models/schemas.py      → Pydantic request/response models
│   │   ├── routes/                → 11 route modules (auth, seeker, jobs, recruiter, company, chat, matcher, features, blog, scout, interview)
│   │   └── services/              → AI matching, LLM client, blog AI enrichment, jobs provider integration
│   ├── tools/pressroom.py         → Browserless CMS CLI tool
│   ├── supabase/migrations/       → Schema + seed SQL (5 migrations)
│   ├── tests/                     → 128+ pytest tests (unit/integration/regression)
│   └── vercel.json                → Serverless Python deployment config
│
├── mobile/                → React Native (Expo) app
│   ├── src/screens/       → 10 screens (Jobs, Blog, Chat, Analytics, etc.)
│   ├── src/services/      → API client + auth context
│   └── src/navigation/    → Role-based tab navigation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Playfair Display + Source Sans 3 |
| Backend | FastAPI, Pydantic v2, python-jose (JWT) |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | bcrypt + JWT tokens (7-day expiry) |
| AI/LLM | OpenAI / Anthropic (provider-agnostic) |
| Mobile | React Native 0.81, Expo 54 |
| CMS | Pressroom CLI (Python, markdown + YAML frontmatter) |
| Deployment | Vercel (serverless) |
| Testing | pytest (backend), Vitest + RTL (frontend) |

## Quick Start

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- [Supabase](https://supabase.com) project (free tier works)

### 1. Database Setup

Create a Supabase project, then run the migrations in the SQL Editor:

```sql
-- Run in order:
-- 1. backend/supabase/migrations/001_schema.sql  (tables, indexes, RLS)
-- 2. backend/supabase/migrations/002_seed.sql     (optional seed data)
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase URL, service_role key, and a JWT secret

pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

API docs at [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173) with API proxy to localhost:8000.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (seeker/recruiter/company) |
| POST | `/api/auth/login` | Login → JWT token |
| POST/GET | `/api/seeker/profile` | Seeker profile create/update + fetch |
| POST | `/api/seeker/resume/upload` | Upload PDF/DOCX resume |
| POST | `/api/seeker/ai/summary` | Generate AI profile summary |
| GET/POST | `/api/seeker/jobs/matches` | AI-scored job matches |
| GET | `/api/seeker/analytics` | Seeker analytics |
| GET | `/api/jobs` | List/search active jobs |
| GET | `/api/jobs/search` | Search external jobs |
| GET | `/api/jobs/{id}` | Job details |
| POST | `/api/jobs` | Create job posting (company) |
| POST | `/api/jobs/{id}/apply` | Apply to job |
| GET | `/api/jobs/{id}/applications` | List applications for a job |
| PATCH | `/api/jobs/applications/{id}/status` | Update pipeline stage |
| POST | `/api/jobs/{id}/recruiters` | Assign a recruiter to a job (company) |
| GET | `/api/jobs/{id}/recruiters` | List recruiters assigned to a job |
| DELETE | `/api/jobs/{id}/recruiters/{recruiter_id}` | Unassign a recruiter (company) |
| GET | `/api/jobs/me/applications` | My applications |
| GET | `/api/recruiter/candidates` | Search candidates |
| POST | `/api/recruiter/candidates/search` | Advanced candidate search |
| GET | `/api/recruiter/pipeline` | Recruiter pipeline |
| GET | `/api/recruiter/analytics` | Recruiter analytics |
| GET | `/api/company/dashboard` | Company hiring dashboard |
| GET | `/api/company/candidates/recommended` | Recommended candidates |
| GET | `/api/company/analytics` | Company analytics |
| GET | `/api/chat/conversations` | List conversations |
| GET | `/api/chat/conversations/{id}/messages` | Get messages |
| POST | `/api/chat/messages` | Send message |
| POST | `/api/matcher/analyze` | AI resume-to-JD match analysis |
| POST | `/api/matcher/generate` | AI cover letter generation |
| GET | `/api/matcher/history` | List matcher history |
| GET | `/api/matcher/history/{id}` | Get matcher analysis |
| GET | `/api/features` | List feature requests |
| POST | `/api/features` | Submit feature request |
| POST | `/api/features/{id}/vote` | Vote/unvote on feature |
| GET | `/api/features/{id}/comments` | List feature comments |
| POST | `/api/features/{id}/comments` | Add feature comment |
| GET | `/api/blog` | List published blog posts |
| GET | `/api/blog/categories` | List blog categories |
| GET | `/api/blog/{slug}` | Get blog post by slug |
| GET | `/api/blog/{slug}/related-jobs` | Jobs matching post skills |
| POST | `/api/blog/admin/posts` | Create blog post (CLI) |
| POST | `/api/blog/admin/enrich` | AI-enrich blog content |
| POST | `/api/scout/chat` | AI career counselor chat |
| POST | `/api/interview/start` | Start interview session |
| POST | `/api/interview/transcribe` | Transcribe interview audio |
| POST | `/api/interview/evaluate` | Evaluate interview answer |

Full Swagger docs available at `/docs` when running.

## Testing

### Fast local verification
```powershell
.\tools\verify.ps1
```

Cross-platform equivalent:
```bash
node tools/verify.mjs
```

Included fast gates:
- API contract parity
- Backend dependency consistency
- Frontend unit tests
- Backend unit and integration tests

Optional PR e2e subset:
```powershell
.\tools\verify.ps1 -IncludeE2E
```

```bash
node tools/verify.mjs --include-e2e
```

### Backend (pytest)
```bash
cd backend
pytest                           # Run all 128+ tests
pytest tests/unit/               # Unit tests only
pytest tests/integration/        # Integration tests only
pytest tests/regression/         # Regression tests only
pytest -m "unit or integration"  # Fast CI-aligned subset
pytest -v --tb=short             # Verbose with short tracebacks
```

### Frontend (Vitest)
```bash
cd frontend
npm test                         # Run all tests
npm run test:e2e:pr              # Fast PR e2e subset
npm run test:e2e                 # Full Playwright suite
```

## Deployment

Both frontend and backend deploy to Vercel. See [`DEPLOY.md`](frontend/DEPLOY.md) for step-by-step instructions or use the automated script:

```bash
cd frontend
chmod +x deploy.sh
./deploy.sh
```

### Environment Variables

**Backend:**
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role API key |
| `SECRET_KEY` | JWT signing secret |

**Frontend:**
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

## Database Schema

10 tables with Row Level Security:

- **users** — All three roles (seeker, recruiter, company) with profile fields
- **jobs** — Postings with required/nice-to-have skills
- **applications** — Job applications with status pipeline
- **conversations** — Chat threads
- **conversation_participants** — Many-to-many user ↔ conversation
- **messages** — Individual chat messages
- **matcher_analyses** — AI resume-to-JD match results
- **feature_requests** / **feature_votes** / **feature_comments** — Community feature board
- **blog_posts** — Pressroom CMS content with SEO, tags, and related skills

## License

MIT
