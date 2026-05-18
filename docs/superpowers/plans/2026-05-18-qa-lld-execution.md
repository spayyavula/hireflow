# QA LLD Execution Plan
Date: 2026-05-18
Owner: QA and platform quality
Scope source: [docs/LLD-QA.md](../../LLD-QA.md)

## Objective
Implement release-grade quality gates aligned with LLD, including contract drift detection, role-based regression coverage, and dependency-failure validation.

## Baseline already implemented (do not rebuild)

- Backend unit/integration/regression suites already exist under `backend/tests/`.
- Frontend e2e suite already exists under `frontend/e2e/`.
- This plan is focused on matrix completeness, drift detection, and stronger release gates.

Execution rule for this plan:
- Reuse and extend existing suites before creating new standalone frameworks.

Approved fast-gate workflow before merge:
- Windows/PowerShell: [tools/verify.ps1](../../../tools/verify.ps1)
- Cross-platform: [tools/verify.mjs](../../../tools/verify.mjs)
- Treat these as the default pre-CI validation path for fast feedback.

## Milestones

## M1 - Regression matrix operationalization
Target: 2 days

Tasks:
- Convert role-based regression matrix into executable test suites:
  - seeker
  - recruiter
  - company
  - cross-role common features
- Tag tests by risk and criticality.

Acceptance criteria:
- Every critical journey has at least one automated happy-path test.
- Regression matrix and automated suite mapping is documented.

## M2 - Contract drift tests
Target: 2 days

Tasks:
- Add automated checks that assert:
  - path exists
  - HTTP method matches
  - auth expectation matches
  - response top-level keys exist
- Run these checks against staging API before release.

Acceptance criteria:
- Contract drift suite fails fast on path/method/auth mismatches.
- Drift report is easy to interpret for developers.

## M3 - Failure-mode validation
Target: 2 days

Tasks:
- Add tests for AI/provider failure paths:
  - missing API key
  - timeout/transport errors
  - malformed provider responses
- Verify backend maps these to stable status codes and details.

Acceptance criteria:
- Failure-path behavior is deterministic and documented.
- No raw provider exceptions leak to client payloads.

## M4 - Release gate automation
Target: 2 days

Tasks:
- Build one command runner for pre-release checks:
  - backend unit/integration/regression
  - frontend tests
  - e2e smoke
  - contract drift checks
- Add release gate checklist and owner sign-off template.

Acceptance criteria:
- Release gate command produces pass/fail summary and artifact links.
- Team follows checklist before production deploy.

## Dependencies
- Stable staging environment and seed data.
- CI capacity for expanded matrix execution.

## Risks
- Flaky AI-dependent tests if external calls are not mocked/stubbed.
- Slow total test runtime unless suites are split by markers.

## Rollout strategy
- Start with highest-risk journeys first (auth, apply, chat, matcher).
- Keep flaky test quarantine process separate from core release gates.
- Add incremental thresholds (critical-only -> full matrix).

## Exit criteria
- Release pipeline blocks on critical regression and contract drift failures.
- QA can pinpoint breakage to route/role quickly.
- Confidence in cross-role production stability improves measurably.
