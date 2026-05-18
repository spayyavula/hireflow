# HireFlow QA LLD

This QA-focused LLD defines quality gates, test design, and regression expectations across backend, web, and mobile.

## 1. Quality Goals

- Prevent role-based authorization regressions.
- Detect API contract drift early.
- Validate AI-assisted flows under both success and fallback conditions.
- Keep release confidence high for seeker, recruiter, and company journeys.

## 2. Test Layers

Backend layers:
- unit tests: isolated logic (AI scoring fallback, parsing, validators)
- integration tests: route + auth + DB abstraction behavior
- regression suites: multi-route workflow and edge case scenarios

Frontend layers:
- web unit/component tests
- e2e flows via Playwright for critical paths

Mobile layers:
- screen and navigation behavior checks
- API integration checks through mocked network where needed

## 3. Core Regression Matrix

Role-based journeys to validate each release:

Seeker
- register/login
- create/update profile
- upload resume
- fetch matches
- apply to job
- view applications
- use chat
- use matcher analyze/generate

Recruiter
- login
- candidate listing/search
- pipeline view
- analytics retrieval
- chat

Company
- login
- dashboard
- recommended candidates
- analytics
- job create/update/close

Cross-role/common
- blog browse and post detail
- feature request board create/vote/comment
- scout chat endpoint
- interview start/transcribe/evaluate

## 4. Negative and Edge Cases

Auth and permissions
- missing token returns 401 on protected routes
- wrong-role operations are denied

Validation
- malformed payloads return 400/422 as appropriate
- duplicate constraints return conflict behavior

Dependency failures
- LLM key missing path returns stable service errors
- downstream transport failures map to 503

Data integrity
- application uniqueness per job + seeker
- message read/unread transitions
- vote uniqueness per user + feature

## 5. Contract Drift Tests

Introduce explicit tests asserting web/mobile API paths are still valid against backend.

Minimum assertions:
- endpoint path exists
- HTTP method matches
- required auth matches expectation
- response includes expected top-level keys

## 6. Release Gate Checklist

1. Run backend unit + integration + regression suites.
2. Run frontend tests and Playwright smoke suite.
3. Execute role-based API smoke checks in staging.
4. Validate AI-dependent routes with mocked and real-key configurations.
5. Verify migration compatibility for schema changes.

## 7. Defect Triage Model

Severity guide:
- P0: auth bypass, data corruption, production outage
- P1: critical journey blocked (register/apply/chat)
- P2: major feature degraded with workaround
- P3: non-critical correctness/UI issues

Triage metadata:
- affected role
- endpoint and payload
- expected vs actual
- reproducibility and environment
- first bad version

## 8. Observability Requirements for QA

Recommended to improve defect turnaround:
- request id in API responses and logs
- structured error code field beyond detail text
- per-route latency and error-rate dashboards
- AI provider failure counters by route

## 9. Automation Backlog

- Build a generated API contract test suite from backend route definitions.
- Add role-scoped smoke runner that executes key workflows end-to-end.
- Add synthetic canaries for /api/health plus one protected route per role.
