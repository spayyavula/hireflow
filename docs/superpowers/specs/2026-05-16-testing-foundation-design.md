# Design Spec — SP0: Testing Foundation

**Date:** 2026-05-16
**Status:** Approved (design)
**Project:** HireFlow / JobsSearch frontend

## Context

The HireFlow frontend (`frontend/src/App.jsx`) is a single ~5,700-line React +
Vite file with state-based page switching and no automated tests. A multi-step
migration to **Vike** (SSR/SSG framework) is planned to deliver real URL
routing, prerendered marketing pages, and server-rendered blog pages.

The migration decomposes into sub-projects:

- **SP0 — Testing foundation** — *this spec*.
- **SP1 — Decompose `App.jsx`** into per-component modules (pure refactor).
- **SP2 — Introduce Vike** + migrate marketing pages to SSG; Vike filesystem
  routing replaces state-based switching.
- **SP3 — Blog SSR** — `/blog` and `/blog/@slug` server-rendered per request.
- **SP4 — Vercel deployment + cleanup.**

SP0 comes first because SP1 is a "no behavior change" refactor across ~50
modules: the only way to *prove* nothing regressed is to capture the current
app's behavior in an end-to-end suite **before** the refactor, then re-run it
after every phase. The suite then carries through SP1–SP4 as the regression
net.

## Goal

Stand up an automated test foundation for the frontend:

1. A unit/component test framework, wired and proven.
2. An end-to-end (e2e) suite covering the app's core user flows, written
   against the **current** app, that serves as the regression net for the
   whole Vike migration.

Success: `npm test` and `npm run test:e2e` both pass, and CI runs them on
every push.

## Non-goals

- No production behavior change — SP0 only adds test tooling and tests.
- No exhaustive coverage of dashboards or AI features (Scout, Interview,
  Matcher). Scope is **core flows** (see below). Those can be added later.
- No change to `App.jsx`, the build, or deployment config beyond adding test
  tooling and a CI workflow.

## Frameworks

- **Vitest** + **@testing-library/react** + **jsdom** + **@testing-library/jest-dom**
  — unit/component tests. Vitest is the Vite-native test runner.
- **Playwright** (`@playwright/test`) — e2e tests. New `e2e/` directory,
  `playwright.config.js` configured to auto-start the Vite dev server.
- New `package.json` scripts:
  - `test` → `vitest run`
  - `test:watch` → `vitest`
  - `test:e2e` → `playwright test`

## E2e backend strategy (hybrid)

The app depends on a separate backend (`hireflow-api` + Supabase). The e2e
suite uses a hybrid strategy:

- **Marketing / static pages** — no API calls; pure render and navigation
  tests. No backend needed.
- **Blog** — tests hit the real, read-only `/api/blog` endpoint on the live
  backend. This exercises real frontend↔backend integration. It fails only
  when the backend is unavailable; the keep-warm cron added previously
  mitigates the Supabase auto-pause risk.
- **Auth + onboarding** — Playwright `route` interception mocks the relevant
  endpoints (`/api/auth/*`, `/api/seeker/*`, etc.). Deterministic, and creates
  no real users or data.

A reusable API-mocking helper is built once (in the `auth.spec` phase) and
shared by the auth and onboarding specs.

## E2e coverage (core flows)

| Spec file        | Covers                                                        | Backend |
|------------------|---------------------------------------------------------------|---------|
| `marketing.spec` | landing/features/pricing/about/terms/privacy/help/roadmap render; nav links + CTAs work | none |
| `blog.spec`      | blog list renders posts; opening a post renders the post page | real (read-only) |
| `auth.spec`      | register (seeker/recruiter/company) + login flows; validation errors | mocked |
| `onboarding.spec`| seeker post-register: resume-upload and resume-builder paths  | mocked |

## Unit/component framework

The unit/component framework is set up and proven with one smoke test in SP0.
**Real component tests are added incrementally during SP1** — as each component
is extracted from `App.jsx` into its own module and becomes importable, that
SP1 phase adds a component test for it. SP0 and SP1 interlock: SP0 provides the
tooling, SP1 populates the component-test coverage.

## Phasing

Each phase is a small, independently committable increment: write → run green
→ commit.

1. **Vitest setup** — install deps, `vitest.config.js` / `src/test/setup.js`,
   `package.json` scripts, one smoke test that passes.
2. **Playwright setup** — install `@playwright/test` + browsers,
   `playwright.config.js` (auto-starts dev server), one homepage smoke e2e.
3. **`marketing.spec`** — render + navigation tests for the public pages.
4. **`blog.spec`** — blog list + blog post tests against the real read-only API.
5. **`auth.spec`** — register/login flows; build the reusable API-mocking helper.
6. **`onboarding.spec`** — seeker resume-upload and resume-builder paths.
7. **CI workflow** — GitHub Actions workflow running `npm test` and
   `npm run test:e2e` on every push.

## The suite evolves with the migration

These tests are written against the **current state-based app**. When SP2
introduces Vike's filesystem routing, the e2e tests are updated to navigate by
real URLs (which also makes them more robust). This is expected: the regression
net adapts as the app changes. The invariant that matters is that the suite is
green before and after each migration phase.

## Verification

- `npm test` — Vitest unit/component tests pass.
- `npm run test:e2e` — Playwright e2e suite passes.
- The CI workflow enforces both on every push.

## Risk

Low. SP0 is purely additive — no production code changes. The main watch-items:

- **Blog e2e flakiness** if the backend is down. Accepted tradeoff per the
  hybrid strategy; the keep-warm cron reduces it. If it becomes a problem, the
  blog spec can fall back to mocked fixtures.
- **Playwright in CI** needs browser binaries installed (`playwright install`)
  — handled in the CI workflow.
