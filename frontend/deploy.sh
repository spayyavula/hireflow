#!/usr/bin/env bash
set -euo pipefail

# ─── HireFlow Deployment Script ───────────────────────────
# Deploys both backend (FastAPI) and frontend (Vite+React)
# to Vercel, and runs Supabase migrations.
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# ──────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}\n"; }
print_ok()   { echo -e "${GREEN}✓ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_err()  { echo -e "${RED}✗ $1${NC}"; }

# ─── Check prerequisites ────────────────────────────────
print_step "Checking prerequisites"

if ! command -v node &>/dev/null; then
  print_err "Node.js is required. Install from https://nodejs.org"
  exit 1
fi
print_ok "Node.js $(node -v)"

if ! command -v npx &>/dev/null; then
  print_err "npx not found. Install Node.js ≥ 18"
  exit 1
fi

if ! command -v vercel &>/dev/null; then
  echo "Installing Vercel CLI..."
  npm i -g vercel
fi
print_ok "Vercel CLI installed"

# ─── Collect credentials ────────────────────────────────
print_step "Supabase & Vercel Credentials"

read -rp "Supabase Project URL (https://xxx.supabase.co): " SUPABASE_URL
read -rp "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
SECRET_KEY=$(openssl rand -hex 32)
print_ok "Generated JWT secret"

echo ""
echo "Please make sure you're logged into Vercel CLI:"
echo "  Run: vercel login"
echo ""
read -rp "Press Enter when ready to deploy..."

# ─── Run Supabase Migrations ────────────────────────────
print_step "Running database migrations"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Use Supabase Management API to run SQL
SUPABASE_PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co||')

echo "Running 001_schema.sql..."
if command -v psql &>/dev/null; then
  # If psql is available, try direct connection
  print_warn "For direct SQL execution, use the Supabase Dashboard SQL Editor"
  print_warn "Copy and paste the contents of supabase/migrations/001_schema.sql"
  echo ""
  echo "  Dashboard → SQL Editor → New Query → Paste → Run"
  echo ""
  read -rp "Have you run the schema migration? (y/N): " SCHEMA_DONE
  if [[ "$SCHEMA_DONE" != "y" && "$SCHEMA_DONE" != "Y" ]]; then
    print_warn "Skipping migrations — run them manually before using the app"
  fi
else
  print_warn "psql not found — run migrations manually in Supabase Dashboard"
  print_warn "  1. Go to SQL Editor in your Supabase Dashboard"
  print_warn "  2. Run 001_schema.sql first, then 002_seed.sql"
  read -rp "Press Enter to continue with deployment..."
fi

# ─── Deploy Backend ─────────────────────────────────────
print_step "Deploying Backend API"

BACKEND_DIR="$SCRIPT_DIR/../backend/api"
if [[ ! -d "$BACKEND_DIR" ]]; then
  BACKEND_DIR="$SCRIPT_DIR/hireflow-api"
fi
if [[ ! -d "$BACKEND_DIR" ]]; then
  print_err "Cannot find hireflow-api directory"
  exit 1
fi

cd "$BACKEND_DIR"

echo "Deploying to Vercel..."
BACKEND_URL=$(vercel --prod --yes 2>&1 | tail -1)
print_ok "Backend deployed: $BACKEND_URL"

echo "Setting environment variables..."
echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production --yes 2>/dev/null || \
  vercel env rm SUPABASE_URL production --yes 2>/dev/null && \
  echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production --yes

echo "$SUPABASE_SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes 2>/dev/null || \
  vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes 2>/dev/null && \
  echo "$SUPABASE_SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes

echo "$SECRET_KEY" | vercel env add SECRET_KEY production --yes 2>/dev/null || \
  vercel env rm SECRET_KEY production --yes 2>/dev/null && \
  echo "$SECRET_KEY" | vercel env add SECRET_KEY production --yes

echo "Redeploying with env vars..."
BACKEND_URL=$(vercel --prod --yes 2>&1 | tail -1)
print_ok "Backend live: $BACKEND_URL"

# ─── Deploy Frontend ────────────────────────────────────
print_step "Deploying Frontend"

FRONTEND_DIR="$SCRIPT_DIR"
if [[ ! -f "$FRONTEND_DIR/vite.config.js" ]]; then
  FRONTEND_DIR="$SCRIPT_DIR/../hireflow-frontend"
fi

cd "$FRONTEND_DIR"

echo "Installing dependencies..."
npm install --silent

echo "Deploying to Vercel..."
FRONTEND_URL=$(vercel --prod --yes 2>&1 | tail -1)
print_ok "Frontend deployed: $FRONTEND_URL"

echo "Setting VITE_API_URL..."
echo "$BACKEND_URL" | vercel env add VITE_API_URL production --yes 2>/dev/null || \
  vercel env rm VITE_API_URL production --yes 2>/dev/null && \
  echo "$BACKEND_URL" | vercel env add VITE_API_URL production --yes

echo "Redeploying with API URL..."
FRONTEND_URL=$(vercel --prod --yes 2>&1 | tail -1)
print_ok "Frontend live: $FRONTEND_URL"

# ─── Summary ────────────────────────────────────────────
print_step "Deployment Complete!"

echo -e "${GREEN}┌──────────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│  HireFlow is live!                           │${NC}"
echo -e "${GREEN}├──────────────────────────────────────────────┤${NC}"
echo -e "${GREEN}│  Frontend:  ${NC}$FRONTEND_URL"
echo -e "${GREEN}│  Backend:   ${NC}$BACKEND_URL"
echo -e "${GREEN}│  API Docs:  ${NC}${BACKEND_URL}/docs"
echo -e "${GREEN}│  Supabase:  ${NC}$SUPABASE_URL"
echo -e "${GREEN}└──────────────────────────────────────────────┘${NC}"
echo ""

if [[ "${SCHEMA_DONE:-n}" != "y" && "${SCHEMA_DONE:-n}" != "Y" ]]; then
  print_warn "Remember: Run the SQL migrations in Supabase Dashboard!"
  echo "  Files: hireflow-api/supabase/migrations/001_schema.sql"
  echo "         hireflow-api/supabase/migrations/002_seed.sql"
fi

echo ""
echo "Next steps:"
echo "  1. Update CORS origins in api/index.py with: $FRONTEND_URL"
echo "  2. Run the Supabase migrations if you haven't already"
echo "  3. Visit $FRONTEND_URL and try the app!"
