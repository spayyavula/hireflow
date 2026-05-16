# SP1 — App.jsx Decomposition Design

**Status:** Approved design — ready for implementation planning.
**Date:** 2026-05-16
**Sub-project:** SP1 of the JobsSearch (HireFlow) frontend roadmap (SP0 testing ✅ → **SP1** → SP2 Vike SSR → SP3 → SP4).

## Problem

The entire frontend lives in one file: `frontend/src/App.jsx`, ~5,700 lines, ~40 components. It is hard to navigate, hard to review, and impossible to map onto a filesystem router. SP2 (Vike SSR) needs each public page as a self-contained module so Vike's filesystem routing can target it.

## Goal

Decompose `App.jsx` into focused per-page and per-feature modules under `frontend/src/`, with **zero behavior change**, producing the module layout that SP2's Vike routing will wrap.

## Constraints

- **Pure refactor — no new features, no behavior change.** The SP0 e2e suite (18 Playwright tests) is the regression net and must stay green after every batch.
- **No framework change.** SP1 produces a neutral `src/` layout. `App.jsx` remains the orchestrator. Vike is introduced in SP2.
- **No state-management change.** Prop-threading is preserved exactly; `App()` stays the single state owner. No React context is introduced (SP2 reworks routing/data, so navigation context built now would be churned).
- **No styling change.** Inline styles and the `GlobalStyles` injection are moved as-is, not reworked.

## Non-Goals

- Introducing React context or any store.
- Converting inline styles to CSS modules / a styling system.
- Adopting Vike or any router (SP2).
- Adding features or changing UI.

---

## Current Structure of `App.jsx`

~40 components, mapped by line range:

- **11–126:** constants, mock data (`JOBS`, `FEATURED_JOB_POSTINGS`, `getJobPostingBySlug`, `CANDIDATES`, `PIPELINE_STAGES`, `PIPELINE_DATA`, `MESSAGES`), `toSlug`, routing helpers (`PUBLIC_PAGE_TO_PATH`, `getPageFromPath`, `getPathFromPage`)
- **127–483:** `GlobalStyles`, `Icons`, and UI primitives `Button`, `Input`, `Tag`, `MatchScore`, `Avatar`, `Card`, `StatCard`
- **484–1593:** `PublicNav`, `LandingPage`, `FeaturesPage`, `PricingPage`, `AboutPage`
- **1594–2051:** Ideas-board config constants + `IdeasBoard`
- **2052–3011:** `AuthScreen`, `RoleSelect`, `SeekerChoice`, `ResumeUpload`, `ResumeBuilder`
- **3013–3811:** `InterviewBot`, `ScoutView` (with nested `ScoutJobCard`)
- **3812–4571:** `Sidebar`, `JobCard`, `MatcherView`, `formatTimeAgo`, `SeekerDashboard`
- **4572–4836:** `ChatView`, `RecruiterDashboard`, `CompanyDashboard`
- **4837–5593:** `BlogListPage`, `BlogPostPage`, `StaticContentPage`, `ComingSoonPage`, `JobDetailPage`
- **5594:** `App()` — routing + state orchestrator

---

## Target Module Structure

A neutral `src/` layout. SP2 later adds thin Vike `+Page.jsx` wrappers that import from `pages/`.

```
frontend/src/
  main.jsx                   # unchanged
  api.js                     # unchanged (API client already extracted)
  App.jsx                    # slimmed: state + routing + renders selected page/dashboard

  lib/
    routing.js               # PUBLIC_PAGE_TO_PATH, getPageFromPath, getPathFromPage
    slug.js                  # toSlug
    format.js                # formatTimeAgo
  data/
    constants.js             # SKILL_CATEGORIES, DESIRED_ROLES, EXPERIENCE_LEVELS, WORK_PREFS, SALARY_RANGES
    mockData.js              # JOBS, FEATURED_JOB_POSTINGS, getJobPostingBySlug, CANDIDATES, PIPELINE_STAGES, PIPELINE_DATA, MESSAGES
    ideasConfig.js           # FEATURE_CATEGORIES, FEATURE_STATUSES, STATUS_CONFIG, CATEGORY_COLORS, ROLE_BADGES
  styles/
    GlobalStyles.jsx

  components/
    ui/                      # Button, Input, Tag, MatchScore, Avatar, Card, StatCard, Icons
    PublicNav.jsx
    Sidebar.jsx
    JobCard.jsx

  pages/                     # public, route-addressable (SP2 maps these to Vike routes)
    marketing/               # LandingPage, FeaturesPage, PricingPage, AboutPage, IdeasBoard
    blog/                    # BlogListPage, BlogPostPage
    jobs/                    # JobDetailPage
    static/                  # StaticContentPage, ComingSoonPage

  features/                  # authenticated app (stays SPA in SP2)
    auth/                    # AuthScreen, RoleSelect
    onboarding/              # SeekerChoice, ResumeUpload, ResumeBuilder
    interview/               # InterviewBot
    scout/                   # ScoutView, ScoutJobCard
    matcher/                 # MatcherView
    chat/                    # ChatView
    dashboard/               # SeekerDashboard, RecruiterDashboard, CompanyDashboard
```

The split is by **responsibility, not technical layer**: `pages/` = public route targets, `features/` = authenticated feature modules, `components/` = genuinely shared UI, `lib/`/`data/`/`styles/` = support.

**Imports:** direct module paths. **No barrel `index.js` files** — explicit imports, no circular-import risk.

---

## Oversized-Component Splits

Seven components exceed ~300 lines. Each gets its own file plus a **co-located sub-folder** for split-out children. Target: **no file over ~250 lines**.

**Split rule:** extracted children are **presentational components that receive props** — no new state, no new context, no behavior change. The parent keeps all state and passes data down.

Expected decomposition (exact seams finalized in the implementation plan after reading each component):

| Component | ~Lines | Expected split |
|---|---|---|
| `InterviewBot` | 490 | setup/config view, conversation/turn UI, results/feedback view |
| `LandingPage` | 476 | hero, feature sections, social-proof/testimonials, CTA blocks |
| `IdeasBoard` | 440 | filter bar, idea card, submission form |
| `MatcherView` | 370 | filter/controls, results list, match-detail panel |
| `ResumeUpload` | 370 | upload dropzone, parse/progress state, parsed-result review |
| `ScoutView` | 310 | controls, results list (`ScoutJobCard` lifts out — already a nested component) |
| `SeekerDashboard` | 220 | dashboard stat/overview blocks; split only where a child lifts cleanly |

---

## Sequencing — Leaf-First Batches

Modules are extracted bottom-up so each batch depends only on already-extracted code. Dependency direction is one-way: `ui ← components ← pages/features ← App`.

| Batch | Contents |
|---|---|
| 1 | `lib/` (routing, slug, format), `data/` (constants, mockData, ideasConfig), `styles/GlobalStyles` |
| 2 | `components/ui/` primitives — Button, Input, Tag, MatchScore, Avatar, Card, StatCard, Icons |
| 3 | Shared components — `PublicNav`, `Sidebar`, `JobCard` |
| 4 | `pages/marketing/` — LandingPage, FeaturesPage, PricingPage, AboutPage, IdeasBoard (with splits) |
| 5 | `pages/blog/`, `pages/jobs/`, `pages/static/` |
| 6 | `features/auth/`, `features/onboarding/` (ResumeUpload split) |
| 7 | `features/interview/`, `features/scout/`, `features/matcher/` (all three split) |
| 8 | `features/dashboard/`, `features/chat/` (SeekerDashboard split) |
| 9 | Final `App.jsx` slim-down + dead-code removal |

**Per-batch cycle:** extract → fix imports → `npm run test:e2e` (18 tests) green → unit tests green for any split components in that batch → commit. Each commit leaves `main` fully working — ~9 independently-green commits.

---

## Final `App.jsx`

Keeps only orchestration:

- `useState` for `user`, `profile`, `currentPage`, `activeTab`, `phase`.
- The effect syncing `currentPage` from `window.location.pathname`.
- Auth and navigation handlers.
- A render switch selecting the page or dashboard component.

Target: a few hundred lines, all wiring — no JSX beyond the render switch.

---

## Verification

- **Regression net:** the SP0 e2e suite (18 Playwright tests) runs after every batch and must stay green.
- **Split-component hardening:** each of the seven split components gets a Vitest **render test** — mount with representative props, assert key elements render. This targets the components where splitting (not just moving) introduces risk. The other ~30 components are verified by the e2e suite alone.
- **No new test infrastructure** — uses the Vitest + Playwright frameworks SP0 already established.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| A component references a shared style object or helper still in `App.jsx` | Leaf-first ordering surfaces these early; the implementation plan inventories every cross-reference before extraction. |
| Circular imports | One-way dependency direction (`ui ← components ← pages/features ← App`); no barrel files. |
| Subtle breakage in a split component | Vitest render tests on all seven split components; e2e suite per batch. |
| Behavior drift during a large mechanical move | ~9 small batches, each independently green and committed; bisectable. |

## Success Criteria

- `App.jsx` is reduced to an orchestrator of a few hundred lines.
- Every component lives in a focused module under the target structure; no file exceeds ~250 lines.
- The SP0 e2e suite stays green; the seven split components have passing render tests.
- No behavior, styling, or feature change is observable.
- `pages/` contains the public route-target modules SP2's Vike routing will wrap.
