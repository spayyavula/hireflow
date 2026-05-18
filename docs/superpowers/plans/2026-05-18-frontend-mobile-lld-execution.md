# Frontend and Mobile LLD Execution Plan
Date: 2026-05-18
Owner: Frontend and mobile team
Scope source: [docs/LLD-FRONTEND-MOBILE.md](../../LLD-FRONTEND-MOBILE.md)

## Objective
Align web and mobile clients to a shared API contract workflow, eliminate endpoint drift, and improve role-based UX reliability.

## Baseline already implemented (do not rebuild)

- Web and mobile API clients already exist in `frontend/src/api.js` and `mobile/src/services/api.js`.
- Role-based navigation and screen structure are already implemented in `mobile/src/navigation/AppNavigator.js` and existing web role flows.
- Existing e2e and feature tests are already present; this plan extends coverage and contract safety.

Execution rule for this plan:
- Treat tasks as parity checks and targeted fixes first, not rewrites.

Approved fast-gate workflow before merge:
- Windows/PowerShell: [tools/verify.ps1](../../../tools/verify.ps1)
- Cross-platform: [tools/verify.mjs](../../../tools/verify.mjs)
- Optional local PR e2e subset can be included when UI-routing or onboarding flows are touched.

## Milestones

## M1 - API client parity and drift elimination
Target: 2 days

Tasks:
- Create shared endpoint inventory (`frontend/src` + `mobile/src`) mapped to backend routes.
- Fix mismatched paths and stale aliases in:
  - `frontend/src/api.js`
  - `mobile/src/services/api.js`
- Add a parity check test that compares method/path lists across web and mobile clients.

Acceptance criteria:
- Web and mobile API clients expose aligned endpoint methods for shared features.
- All called paths resolve to real backend endpoints.

## M2 - Shared contract artifacts
Target: 2 days

Tasks:
- Introduce shared endpoint constants module for both clients.
- Introduce shared error normalization helper (extract and map `detail`).
- Add lightweight request/response typing strategy (JSDoc or generated typings).

Acceptance criteria:
- Endpoint strings are not duplicated across multiple files.
- Error handling is consistent across web and mobile surfaces.

## M3 - Role-based UX reliability
Target: 2 days

Tasks:
- Validate role navigation behavior in mobile navigator and web app role switches.
- Add guard checks for role-only pages/actions.
- Add loading/empty/error state audits for async screens:
  - jobs
  - chat
  - analytics
  - feature board
  - matcher

Acceptance criteria:
- Users cannot access incorrect role-only actions via client navigation.
- All critical async screens have explicit loading/empty/error states.

## M4 - Test and release hardening
Target: 2 days

Tasks:
- Expand Playwright coverage for:
  - auth
  - onboarding
  - blog
  - one role-based protected action per role
- Add client-level API integration tests for error payload handling.
- Add a release checklist for API changes requiring web+mobile updates.

Acceptance criteria:
- E2E suite covers the critical happy paths and one negative path per role.
- API change checklist is used before merge for contract-impacting PRs.

## Dependencies
- Backend contract stability for active sprint window.
- Test users and deterministic seed data for role journeys.

## Risks
- Shared constants refactor can cause broad merge conflicts.
- Role states may be inconsistently represented between web and mobile.

## Rollout strategy
- Finish M1 before UI-level refactors.
- Introduce shared constants and helpers in isolated PRs.
- Run end-to-end smoke after each milestone.

## Exit criteria
- Web and mobile clients remain contract-aligned by default.
- API-related regressions are detected before release.
- Role-based UX is predictable and test-backed.
