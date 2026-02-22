# HireFlow Deployment Guide
## Deploy to Vercel + Supabase

---

## Prerequisites

| Tool | Get it from |
|------|------------|
| **Supabase account** | [supabase.com](https://supabase.com) |
| **Vercel account** | [vercel.com](https://vercel.com) |
| **Node.js ≥ 18** | [nodejs.org](https://nodejs.org) |
| **Vercel CLI** | `npm i -g vercel` |

---

## Step 1 — Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. Choose a name (e.g. `hireflow`) and set a database password
3. Once created, go to **Project Settings → API** and copy:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **service_role key** (under "Project API keys")

## Step 2 — Run Database Migrations

Open the **SQL Editor** in Supabase Dashboard and run the two scripts in order:

### 2a. Schema (tables, indexes, RLS, triggers)
Copy the entire contents of `hireflow-api/supabase/migrations/001_schema.sql` and execute it.

### 2b. Seed data (optional)
Copy the contents of `hireflow-api/supabase/migrations/002_seed.sql` and execute it.

**Verify:** In the Table Editor, you should see 6 tables: `users`, `jobs`, `applications`, `conversations`, `conversation_participants`, `messages`.

## Step 3 — Deploy Backend API to Vercel

```bash
cd hireflow-api

# Login to Vercel (first time only)
vercel login

# Deploy
vercel --prod

# When prompted:
#   Set up and deploy? → Y
#   Which scope? → your account
#   Link to existing project? → N
#   Project name? → hireflow-api
#   Directory? → ./
#   Override settings? → N
```

Then set environment variables:
```bash
vercel env add SUPABASE_URL        # paste your project URL
vercel env add SUPABASE_SERVICE_ROLE_KEY  # paste your service_role key
vercel env add SECRET_KEY           # paste a random secret (run: openssl rand -hex 32)
```

Redeploy to pick up the env vars:
```bash
vercel --prod
```

**Test:** Visit `https://hireflow-api-xxx.vercel.app/docs` — you should see the Swagger UI.

## Step 4 — Deploy Frontend to Vercel

```bash
cd hireflow-frontend

# Install deps
npm install

# Deploy
vercel --prod

# When prompted:
#   Project name? → hireflow
#   Framework? → Vite (auto-detected)
```

Set the API URL env var:
```bash
vercel env add VITE_API_URL   # paste your backend URL, e.g. https://hireflow-api-xxx.vercel.app
```

Redeploy:
```bash
vercel --prod
```

**Test:** Visit `https://hireflow-xxx.vercel.app` — the app should load.

## Step 5 — Update Backend CORS

Once you know the frontend URL, update `hireflow-api/api/index.py` to replace `"*"` in `allow_origins` with your actual frontend domain:

```python
allow_origins=[
    "https://hireflow-xxx.vercel.app",
    "http://localhost:5173",
],
```

---

## Quick Deploy Script

If you prefer a one-shot automated deploy, use the included `deploy.sh`:

```bash
chmod +x deploy.sh
./deploy.sh
```

It will prompt for your credentials and deploy everything.

---

## Environment Variables Reference

### Backend (`hireflow-api`)
| Variable | Description |
|----------|------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role API key |
| `SECRET_KEY` | JWT signing secret (random hex string) |

### Frontend (`hireflow-frontend`)
| Variable | Description |
|----------|------------|
| `VITE_API_URL` | Backend API URL (e.g. `https://hireflow-api-xxx.vercel.app`) |

---

## Local Development

### Backend
```bash
cd hireflow-api
cp .env.example .env     # fill in your Supabase creds
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

### Frontend
```bash
cd hireflow-frontend
npm install
npm run dev              # starts on http://localhost:5173
                         # proxies /api to localhost:8000
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Missing SUPABASE_URL` on Vercel | Run `vercel env add SUPABASE_URL` and redeploy |
| CORS errors in browser | Update `allow_origins` in `api/index.py` |
| 404 on API routes | Check `vercel.json` routes config |
| Frontend blank page | Ensure `VITE_API_URL` is set and backend is deployed |
| Database tables missing | Re-run `001_schema.sql` in Supabase SQL Editor |
