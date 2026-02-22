# HireFlow API

AI-powered job matching platform backend built with **FastAPI** + **Supabase**, deployable to **Vercel**.

## Architecture

```
api/
├── index.py                  # FastAPI app entry point (Vercel handler)
├── core/
│   ├── config.py             # Settings, JWT auth, password hashing
│   └── database.py           # Supabase client & all DB queries
├── models/
│   └── schemas.py            # Pydantic models for all endpoints
├── services/
│   └── ai.py                 # Matching engine, resume parser, AI summary
├── routes/
│   ├── auth.py               # Register, login
│   ├── seeker.py             # Profile, resume upload, job matching, analytics
│   ├── jobs.py               # CRUD jobs, applications, search
│   ├── recruiter.py          # Candidate search, pipeline, analytics
│   ├── company.py            # Dashboard, recommended candidates, analytics
│   └── chat.py               # Conversations, messages
supabase/
└── migrations/
    ├── 001_schema.sql        # Tables, indexes, RLS, triggers
    └── 002_seed.sql          # Demo companies, jobs, recruiter
```

## Supabase Setup

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New Project

### 2. Run the migrations
Open **SQL Editor** in your Supabase dashboard and run these files in order:

1. `supabase/migrations/001_schema.sql` — Creates tables, indexes, RLS policies, and triggers
2. `supabase/migrations/002_seed.sql` — Inserts demo companies, jobs, and a recruiter account

### 3. Get your credentials
Go to **Project Settings → API** and copy:
- **Project URL** → `SUPABASE_URL`
- **service_role key** (⚠️ not the anon key) → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configure environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Database Schema

| Table | Description |
|-------|-------------|
| `users` | All user types (seeker, recruiter, company) with profile fields as JSONB |
| `jobs` | Job postings with required/nice skills as JSONB arrays |
| `applications` | Job applications with pipeline status tracking |
| `conversations` | Chat conversations |
| `conversation_participants` | Many-to-many link between users and conversations |
| `messages` | Chat messages with read status |

**Key features:**
- `applicant_count` auto-increments via a PostgreSQL trigger on new applications
- JSONB columns for flexible arrays (skills, experience, education)
- Unique constraint on `(job_id, seeker_id)` prevents duplicate applications
- Row Level Security enabled on all tables (service_role bypasses RLS)

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT |

### Job Seeker
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seeker/profile` | Create/update profile |
| GET | `/api/seeker/profile` | Get profile |
| POST | `/api/seeker/resume/upload` | Upload resume, AI extracts data |
| POST | `/api/seeker/ai/summary` | Generate AI summary |
| GET | `/api/seeker/jobs/matches` | AI-matched jobs (auth) |
| POST | `/api/seeker/jobs/matches` | AI-matched jobs (no auth) |
| GET | `/api/seeker/analytics` | Analytics dashboard |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List/search jobs |
| GET | `/api/jobs/{id}` | Job details |
| POST | `/api/jobs` | Create job (company) |
| PUT | `/api/jobs/{id}` | Update job |
| DELETE | `/api/jobs/{id}` | Close job |
| POST | `/api/jobs/{id}/apply` | Apply (seeker) |
| GET | `/api/jobs/{id}/applications` | List applications |
| PATCH | `/api/jobs/applications/{id}/status` | Update pipeline stage |
| GET | `/api/jobs/me/applications` | My applications |

### Recruiter
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recruiter/candidates` | Search candidates |
| POST | `/api/recruiter/candidates/search` | Advanced search |
| GET | `/api/recruiter/pipeline` | Pipeline by stage |
| GET | `/api/recruiter/analytics` | Analytics |

### Company
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/company/dashboard` | Overview |
| GET | `/api/company/candidates/recommended` | AI candidates |
| GET | `/api/company/analytics` | Hiring analytics |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | List conversations |
| GET | `/api/chat/conversations/{id}/messages` | Get messages |
| POST | `/api/chat/messages` | Send message |

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Add your Supabase credentials to .env

# Run locally
uvicorn api.index:app --reload --port 8000

# Open docs
open http://localhost:8000/docs
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SECRET_KEY

# Deploy
vercel --prod
```

## Demo Accounts (after running seed SQL)

| Role | Email | Password |
|------|-------|----------|
| Company (TechVault) | `techvault@demo.com` | `demo1234` |
| Company (DataPulse AI) | `datapulseai@demo.com` | `demo1234` |
| Recruiter | `recruiter@demo.com` | `demo1234` |

## Matching Engine

Scores candidates against jobs (0–99):

| Factor | Points | Description |
|--------|--------|-------------|
| Required skills | 50 | Overlap with must-have skills |
| Nice-to-have skills | 15 | Bonus skill matches |
| Role alignment | 15 | Desired role ↔ job title |
| Work preference | 10 | Remote/hybrid/on-site match |
| Experience level | 10 | Exact or adjacent level |
