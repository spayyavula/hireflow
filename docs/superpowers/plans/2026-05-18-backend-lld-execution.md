# Backend LLD Execution Plan
Date: 2026-05-18
Owner: Backend team
Scope source: [docs/LLD-BACKEND.md](../../LLD-BACKEND.md)

## Objective
Execute the backend LLD by hardening contracts, reducing coupling in data access, and improving operational resilience for AI-dependent routes.

## Baseline already implemented (do not rebuild)

- Route surface is already live for auth, seeker, jobs, recruiter, company, chat, matcher, features, blog, scout, and interview.
- Security baseline is already live (JWT, bcrypt, auth dependencies) in `backend/api/core/config.py`.
- Supabase abstraction layer is already centralized in `backend/api/core/database.py`.
- Existing migrations and route/test suites are already present; this plan is for incremental hardening and refactoring only.

Execution rule for this plan:
- Before each task, confirm the capability does not already exist; if it exists, convert the task to validation, cleanup, or de-scope.

Approved fast-gate workflow before merge:
- Windows/PowerShell: [tools/verify.ps1](../../../tools/verify.ps1)
- Cross-platform: [tools/verify.mjs](../../../tools/verify.mjs)
- Use these as the default local validation loop before widening scope.

## Milestones

## M1 - Contract and boundary hardening
Target: 2 days

Tasks:
- Add/verify schema coverage for all active route groups in `backend/api/models/schemas.py`.
- Standardize route-level error responses (`detail`) across all route modules.
- Add missing auth/role assertions where behavior depends on role.
- Create endpoint-method-contract matrix document in `backend/tests/` for validation.

Acceptance criteria:
- Every public/protected endpoint has an explicit response model or documented reason.
- Error status usage aligns with LLD guidance (`400/401/403/404/409/502/503`).
- No route directly performs Supabase SDK calls outside `core/database.py`.

## M2 - Data access modularization (phase 1)
Target: 3 days

Tasks:
- Split `backend/api/core/database.py` into domain modules:
  - `database_users.py`
  - `database_jobs.py`
  - `database_chat.py`
  - `database_features.py`
  - `database_blog.py`
  - `database_matcher.py`
- Keep a compatibility facade in `database.py` to avoid breaking imports.
- Move JSONB prep/parse helpers into shared internal utility module.

Acceptance criteria:
- Existing route imports still work through the compatibility facade.
- Unit and integration tests pass with no behavior regression.
- Merge conflict surface in data access code reduced (domain ownership split).

## M3 - AI route extraction and resilience
Target: 3 days

Tasks:
- Extract non-trivial logic from `routes/scout.py` into `services/scout_service.py`.
- Extract non-trivial logic from `routes/interview.py` into `services/interview_service.py`.
- Add provider wrappers with timeout and retry policies for LLM/Wispr calls.
- Add structured logs around AI calls (latency, provider, status).

Acceptance criteria:
- Route files become orchestration-only (validation/auth/dependency wiring).
- External failures consistently map to stable 502/503 responses.
- Logs include request context for AI failure diagnosis.

## M4 - Regression guardrails
Target: 2 days

Tasks:
- Add tests for:
  - auth enforcement
  - role permission checks
  - conflict paths (duplicate application/vote)
  - AI service failure mapping
- Add one smoke script covering critical role endpoints in sequence.

Acceptance criteria:
- New tests are green in CI.
- Critical API smoke passes in local and staging.

## Dependencies
- Environment variables available in dev and CI (`SECRET_KEY`, Supabase keys, provider keys).
- Coordination with frontend/mobile for any contract clarifications.

## Risks
- Large file extraction can cause import-cycle mistakes.
- AI provider variability may make flaky tests if not mocked appropriately.

## Rollout strategy
- Ship M1 first.
- Land M2 behind compatibility facade in small PRs.
- Ship M3 in two PRs (`scout`, then `interview`).
- Gate release on M4 completion.

## Exit criteria
- Backend codebase follows route->service->database layering consistently.
- AI and provider failure behavior is predictable and test-backed.
- Team can add backend features using the LLD template with minimal ambiguity.
