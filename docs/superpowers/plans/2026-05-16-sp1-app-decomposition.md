# SP1 — App.jsx Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the ~5,700-line `frontend/src/App.jsx` monolith into focused per-page and per-feature modules with zero behavior change.

**Architecture:** Leaf-first extraction in 9 batches. Each batch moves a group of components/symbols into new `src/` modules, fixes imports, and ends in one independently-green commit. `App.jsx` stays the state+routing orchestrator throughout; it simply imports more and inlines less as batches progress. The seven oversized components are additionally split into prop-driven presentational sub-components.

**Tech Stack:** React 18, Vite, Vitest + @testing-library/react (unit/render tests), Playwright (e2e). All test infrastructure already exists from SP0.

**Spec:** `docs/superpowers/specs/2026-05-16-sp1-app-decomposition-design.md`

---

## Ground rules

- **Pure refactor.** No behavior, styling, or feature change. No new state, no React context.
- **Locate components by name, not absolute line number.** Line numbers in this plan reflect the pre-refactor `App.jsx` and shift as batches proceed. Always find a component by its `const Name =` / `function Name` declaration.
- **Default exports for moved components.** Keep each moved component's existing declaration unchanged (`const Name = (props) => {...}`) and append `export default Name;`. `App.jsx` imports it as `import Name from './path/Name'`.
- **Named exports for newly-written sub-components.** Split-out sub-components are new files: `export function SubName({ ...props }) { return (...); }`.
- **No barrel `index.js` files.** Direct module paths only.
- **Commit message trailer.** Every commit message must end with a blank line then:
  `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
- **The regression net** is the SP0 e2e suite. `npm run test:e2e` (run from `frontend/`) must report `18 passed` after every batch before committing.

---

## The Extraction Recipe

This deterministic procedure moves one existing top-level component or symbol `X` out of `App.jsx`. Every batch applies it per item.

1. **Create the destination file** at the exact path the batch task specifies.
2. **Cut** `X`'s entire definition (the `const X = ... ` / `function X ...` block, or the `const X = [...]` data declaration) from `App.jsx` and **paste** it into the new file, unchanged.
3. **Add imports to the new file** for every identifier `X` references that is *not* defined inside `X` itself and *not* a browser/JS global (`window`, `document`, `fetch`, `Math`, `console`, `setTimeout`, …):
   - React hooks used by `X` → `import { useState, useEffect, useRef } from 'react';` (include only the hooks actually used). No bare `import React` is needed — Vite uses the automatic JSX runtime.
   - UI primitives (`Button`, `Input`, `Tag`, `MatchScore`, `Avatar`, `Card`, `StatCard`, `Icons`) → import each from its `../components/ui/<Name>` file (adjust `../` depth to the new file's location).
   - Data/constants (`SKILL_CATEGORIES`, `JOBS`, `FEATURED_JOB_POSTINGS`, `getJobPostingBySlug`, `CANDIDATES`, `PIPELINE_*`, `MESSAGES`, `FEATURE_*`, `STATUS_CONFIG`, `CATEGORY_COLORS`, `ROLE_BADGES`, `DESIRED_ROLES`, `EXPERIENCE_LEVELS`, `WORK_PREFS`, `SALARY_RANGES`) → import from the relevant `../data/*` file.
   - Helpers (`toSlug`, `formatTimeAgo`, `getPageFromPath`, `getPathFromPage`, `PUBLIC_PAGE_TO_PATH`, `scoreColor`) → import from the relevant `../lib/*` file.
   - The API client → `import { api } from '../api';` (adjust depth). `api.js` is unchanged.
   - Other already-extracted components → import from their module path.
4. **Append the export:** `export default X;` (for sub-components written fresh, use `export function`).
5. **Update `App.jsx`:** add `import X from './<path>/X';` at the top, next to the other imports. Remove the now-empty space where `X` lived.
6. If the new file references an identifier that has *not yet been extracted* in an earlier batch, that is a batch-ordering error — stop and report it. Leaf-first ordering is designed so this never happens.

**Verifying imports are complete:** after a batch, `npm run test:e2e` exercises the real app; a missing import surfaces immediately as a build/runtime error. The Vite dev server (started by Playwright) will fail to compile on an undefined reference.

---

## Render-test template (for the seven split components only)

Each split component gets a co-located `<Name>.test.jsx`. The test mounts the component with representative props and asserts it renders, with `fetch` stubbed so the test is offline and deterministic. `scrollIntoView` is also stubbed because jsdom does not implement it and some components call it from a mount effect.

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComponentName from './ComponentName';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    ),
  );
  // jsdom does not implement scrollIntoView; some components call it on mount.
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ComponentName', () => {
  it('renders without crashing', () => {
    render(<ComponentName {/* props per the task */} />);
    expect(screen.getByRole('heading')).toBeTruthy();
  });
});
```

Run unit tests with `npm test` (from `frontend/`). Expected after a batch that adds render tests: all test files pass.

---

## Task 1: Batch 1 — support layer (lib, data, styles)

Pure data/helper moves. No components yet. Lowest risk.

**Files:**
- Create: `frontend/src/lib/routing.js`, `frontend/src/lib/slug.js`, `frontend/src/lib/format.js`
- Create: `frontend/src/data/constants.js`, `frontend/src/data/mockData.js`, `frontend/src/data/ideasConfig.js`
- Create: `frontend/src/styles/GlobalStyles.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/lib/slug.js`**

Apply the Recipe to `toSlug`. It has no dependencies. End the file with `export const toSlug = ...` (it is already a `const`; export it directly rather than a default).

- [ ] **Step 2: Create `frontend/src/lib/routing.js`**

Move `PUBLIC_PAGE_TO_PATH`, `getPageFromPath`, `getPathFromPage` into it. Export each as a named export (`export const PUBLIC_PAGE_TO_PATH = ...`, etc.). No external dependencies.

- [ ] **Step 3: Create `frontend/src/lib/format.js`**

Move `formatTimeAgo` into it. `export const formatTimeAgo = ...`. No dependencies.

- [ ] **Step 4: Create `frontend/src/data/constants.js`**

Move `SKILL_CATEGORIES`, `DESIRED_ROLES`, `EXPERIENCE_LEVELS`, `WORK_PREFS`, `SALARY_RANGES`. Export each as a named export. No dependencies.

- [ ] **Step 5: Create `frontend/src/data/mockData.js`**

Move `JOBS`, `FEATURED_JOB_POSTINGS`, `getJobPostingBySlug`, `CANDIDATES`, `PIPELINE_STAGES`, `PIPELINE_DATA`, `MESSAGES`. Export each as a named export. `FEATURED_JOB_POSTINGS` uses `toSlug` and `JOBS`; add `import { toSlug } from '../lib/slug';` at the top.

- [ ] **Step 6: Create `frontend/src/data/ideasConfig.js`**

Move `FEATURE_CATEGORIES`, `FEATURE_STATUSES`, `STATUS_CONFIG`, `CATEGORY_COLORS`, `ROLE_BADGES`. Export each as a named export. No dependencies.

- [ ] **Step 7: Create `frontend/src/styles/GlobalStyles.jsx`**

Move the `GlobalStyles` component. `export default GlobalStyles;`. No dependencies beyond JSX.

- [ ] **Step 8: Update `App.jsx` imports**

Add at the top of `App.jsx`:
```js
import { toSlug } from './lib/slug';
import { PUBLIC_PAGE_TO_PATH, getPageFromPath, getPathFromPage } from './lib/routing';
import { formatTimeAgo } from './lib/format';
import { SKILL_CATEGORIES, DESIRED_ROLES, EXPERIENCE_LEVELS, WORK_PREFS, SALARY_RANGES } from './data/constants';
import { JOBS, FEATURED_JOB_POSTINGS, getJobPostingBySlug, CANDIDATES, PIPELINE_STAGES, PIPELINE_DATA, MESSAGES } from './data/mockData';
import { FEATURE_CATEGORIES, FEATURE_STATUSES, STATUS_CONFIG, CATEGORY_COLORS, ROLE_BADGES } from './data/ideasConfig';
import GlobalStyles from './styles/GlobalStyles';
```
Confirm no duplicate declarations of these symbols remain in `App.jsx`.

- [ ] **Step 9: Run the e2e suite**

Run from `frontend/`: `npm run test:e2e`
Expected: `18 passed`.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/lib frontend/src/data frontend/src/styles frontend/src/App.jsx
git commit -m "SP1 batch 1: extract lib, data, styles modules"
```

---

## Task 2: Batch 2 — UI primitives (`components/ui/`)

**Files:**
- Create: `frontend/src/components/ui/Icons.jsx`, `Button.jsx`, `Input.jsx`, `Tag.jsx`, `MatchScore.jsx`, `Avatar.jsx`, `Card.jsx`, `StatCard.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract each primitive per the Recipe**

Create one file per component, in this dependency-safe order (each may use the ones above it):
`Icons` → `Button` → `Input` → `Tag` → `MatchScore` → `Avatar` → `Card` → `StatCard`.
For each: move the component, add `import { ... } from 'react'` only if it uses hooks, add imports for any sibling primitive it references (e.g. if `Button` uses `Icons`, add `import Icons from './Icons';`), append `export default <Name>;`.

- [ ] **Step 2: Update `App.jsx` imports**

Add:
```js
import Icons from './components/ui/Icons';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Tag from './components/ui/Tag';
import MatchScore from './components/ui/MatchScore';
import Avatar from './components/ui/Avatar';
import Card from './components/ui/Card';
import StatCard from './components/ui/StatCard';
```

- [ ] **Step 3: Run the e2e suite**

Run from `frontend/`: `npm run test:e2e`
Expected: `18 passed`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui frontend/src/App.jsx
git commit -m "SP1 batch 2: extract shared UI primitives"
```

---

## Task 3: Batch 3 — shared components

**Files:**
- Create: `frontend/src/components/PublicNav.jsx`, `frontend/src/components/Sidebar.jsx`, `frontend/src/components/JobCard.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `PublicNav`, `Sidebar`, `JobCard` per the Recipe**

One file each. These use UI primitives and possibly `Icons` — import from `./ui/<Name>`. `JobCard` may use `MatchScore`/`Tag`. Append `export default <Name>;`.

- [ ] **Step 2: Update `App.jsx` imports**

```js
import PublicNav from './components/PublicNav';
import Sidebar from './components/Sidebar';
import JobCard from './components/JobCard';
```

- [ ] **Step 3: Run the e2e suite**

Run from `frontend/`: `npm run test:e2e`
Expected: `18 passed`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/PublicNav.jsx frontend/src/components/Sidebar.jsx frontend/src/components/JobCard.jsx frontend/src/App.jsx
git commit -m "SP1 batch 3: extract PublicNav, Sidebar, JobCard"
```

---

## Task 4: Batch 4 — marketing pages (with LandingPage + IdeasBoard splits)

**Files:**
- Create: `frontend/src/pages/marketing/FeaturesPage.jsx`, `PricingPage.jsx`, `AboutPage.jsx`
- Create: `frontend/src/pages/marketing/LandingPage.jsx` + `frontend/src/pages/marketing/landing/` (8 sub-components)
- Create: `frontend/src/pages/marketing/IdeasBoard.jsx` + `frontend/src/pages/marketing/ideas/` (4 sub-components)
- Create: `frontend/src/pages/marketing/LandingPage.test.jsx`, `frontend/src/pages/marketing/IdeasBoard.test.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `FeaturesPage`, `PricingPage`, `AboutPage` per the Recipe**

One file each in `pages/marketing/`. They take `{ onGetStarted, onSignIn, onNavigate, currentPage }`. Import `PublicNav` and any UI primitives they use. Append `export default <Name>;`.

- [ ] **Step 2: Extract `LandingPage` and split it**

Move `LandingPage` to `frontend/src/pages/marketing/LandingPage.jsx`. Then create `frontend/src/pages/marketing/landing/` with these presentational sub-components (each `export function`, props-only, no state — the parent keeps its local `featuredJobs`/`steps`/`roles`/`aiFeatures`/`stats` arrays and passes them down):

| Sub-component file | Description | Props |
|---|---|---|
| `landing/LandingHero.jsx` | Headline, subtext, decorative orbs, two CTA buttons | `onGetStarted`, `onNavigate` |
| `landing/LandingStatsBar.jsx` | Three-stat pill bar | `stats` |
| `landing/LandingHowItWorks.jsx` | 4-step "how it works" grid | `steps` |
| `landing/LandingRoleCards.jsx` | Job-seeker card + recruiter/company 2-up grid | `roles` |
| `landing/LandingAIFeatures.jsx` | "AI that actually helps" feature rows | `aiFeatures` |
| `landing/LandingFeaturedJobs.jsx` | Featured 3-job card grid | `featuredJobs`, `onNavigate` |
| `landing/LandingTestimonials.jsx` | 3-column testimonial cards (testimonial data stays inline in this file) | none |
| `landing/LandingCTAFooter.jsx` | Dark CTA section + footer links | `onGetStarted`, `onNavigate` |

`LandingPage.jsx` keeps the data arrays and renders the 8 sub-components in order, passing the props above. Sub-components import any UI primitives they use from `../../../components/ui/<Name>`.

- [ ] **Step 3: Extract `IdeasBoard` and split it**

Move `IdeasBoard` to `frontend/src/pages/marketing/IdeasBoard.jsx`. It keeps all 13 `useState`, both `useEffect`, all 6 handlers (`loadFeatures`, `handleVote`, `handleSubmit`, `loadComments`, `handleExpand`, `handleComment`), and the derived `totalVotes`/`shippedCount`/`isPublic`/`isLoggedIn`. Create `frontend/src/pages/marketing/ideas/`:

| Sub-component file | Description | Props |
|---|---|---|
| `ideas/IdeasBoardHeader.jsx` | Title, tagline, stats row, submit CTA | `features`, `totalVotes`, `shippedCount`, `isLoggedIn`, `onGetStarted`, `onShowSubmit` |
| `ideas/IdeasBoardFilters.jsx` | Category chips, status pills, sort toggle | `category`, `statusFilter`, `sort`, `onCategoryChange`, `onStatusChange`, `onSortChange` |
| `ideas/FeatureCard.jsx` | One feature card: vote column, content, expanded comments | `feature`, `isExpanded`, `comments`, `voting`, `isLoggedIn`, `commentText`, `onVote`, `onExpand`, `onCommentChange`, `onCommentSubmit` |
| `ideas/SubmitIdeaModal.jsx` | Submit-a-new-idea modal | `submitForm`, `submitting`, `error`, `onClose`, `onFieldChange`, `onSubmit` |

`IdeasBoard.jsx` imports `FEATURE_CATEGORIES`, `FEATURE_STATUSES`, `STATUS_CONFIG`, `CATEGORY_COLORS`, `ROLE_BADGES` from `../../data/ideasConfig` and the `api` client. It passes its state values + handler callbacks into the sub-components per the prop tables above.

- [ ] **Step 4: Update `App.jsx` imports**

```js
import LandingPage from './pages/marketing/LandingPage';
import FeaturesPage from './pages/marketing/FeaturesPage';
import PricingPage from './pages/marketing/PricingPage';
import AboutPage from './pages/marketing/AboutPage';
import IdeasBoard from './pages/marketing/IdeasBoard';
```

- [ ] **Step 5: Run the e2e suite**

Run from `frontend/`: `npm run test:e2e`
Expected: `18 passed` (the marketing and roadmap specs directly exercise these pages).

- [ ] **Step 6: Write render tests for `LandingPage` and `IdeasBoard`**

Create `LandingPage.test.jsx` using the render-test template, with:
```jsx
render(<LandingPage onGetStarted={() => {}} onSignIn={() => {}} onNavigate={() => {}} currentPage="landing" />);
```
Create `IdeasBoard.test.jsx`, with:
```jsx
render(<IdeasBoard onGetStarted={() => {}} onSignIn={() => {}} onNavigate={() => {}} currentPage="roadmap" user={null} />);
```
Each asserts a heading renders (`expect(screen.getByRole('heading')).toBeTruthy()` — use `getAllByRole` if multiple).

- [ ] **Step 7: Run the unit tests**

Run from `frontend/`: `npm test`
Expected: all test files pass (smoke + the two new render tests).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/marketing frontend/src/App.jsx
git commit -m "SP1 batch 4: extract and split marketing pages"
```

---

## Task 5: Batch 5 — blog, jobs, static pages

**Files:**
- Create: `frontend/src/pages/blog/BlogListPage.jsx`, `frontend/src/pages/blog/BlogPostPage.jsx`
- Create: `frontend/src/pages/jobs/JobDetailPage.jsx`
- Create: `frontend/src/pages/static/StaticContentPage.jsx`, `frontend/src/pages/static/ComingSoonPage.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract the five pages per the Recipe**

One file each. `BlogListPage`/`BlogPostPage` use the `api` client and `PublicNav`. `JobDetailPage` uses `getJobPostingBySlug` from `../../data/mockData`, `toSlug` from `../../lib/slug`, and `PublicNav`. `StaticContentPage`/`ComingSoonPage` use `PublicNav`. Append `export default <Name>;`.

- [ ] **Step 2: Update `App.jsx` imports**

```js
import BlogListPage from './pages/blog/BlogListPage';
import BlogPostPage from './pages/blog/BlogPostPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import StaticContentPage from './pages/static/StaticContentPage';
import ComingSoonPage from './pages/static/ComingSoonPage';
```

- [ ] **Step 3: Run the e2e suite**

Run from `frontend/`: `npm run test:e2e`
Expected: `18 passed` (the blog spec exercises `BlogListPage`/`BlogPostPage`).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/blog frontend/src/pages/jobs frontend/src/pages/static frontend/src/App.jsx
git commit -m "SP1 batch 5: extract blog, jobs, static pages"
```

---

## Task 6: Batch 6 — auth + onboarding (with ResumeUpload split)

**Files:**
- Create: `frontend/src/features/auth/AuthScreen.jsx`, `frontend/src/features/auth/RoleSelect.jsx`
- Create: `frontend/src/features/onboarding/SeekerChoice.jsx`, `frontend/src/features/onboarding/ResumeBuilder.jsx`
- Create: `frontend/src/features/onboarding/ResumeUpload.jsx` + `frontend/src/features/onboarding/resume-upload/` (7 sub-components)
- Create: `frontend/src/styles/formStyles.js`
- Create: `frontend/src/features/onboarding/ResumeUpload.test.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/styles/formStyles.js`**

`ResumeUpload` (and later `MatcherView`) define the same `inputStyle`, `labelStyle`, `sectionTitle` style objects. Move `ResumeUpload`'s copies into `formStyles.js` as named exports:
```js
export const inputStyle = { /* exact object from ResumeUpload */ };
export const labelStyle = { /* exact object from ResumeUpload */ };
export const sectionTitle = { /* exact object from ResumeUpload */ };
```

- [ ] **Step 2: Extract `AuthScreen`, `RoleSelect`, `SeekerChoice`, `ResumeBuilder` per the Recipe**

One file each. `AuthScreen` uses the `api` client and UI primitives. `RoleSelect`/`SeekerChoice` use UI primitives. `ResumeBuilder` uses `api`, `SKILL_CATEGORIES`/`DESIRED_ROLES`/`EXPERIENCE_LEVELS`/`WORK_PREFS`/`SALARY_RANGES` from `../../data/constants`. Append `export default <Name>;`.

- [ ] **Step 3: Extract `ResumeUpload` and split it**

Move `ResumeUpload` to `frontend/src/features/onboarding/ResumeUpload.jsx`. It keeps all 8 `useState`, the `fileRef`, and all 9 helpers (`set`, `toggleSkill`, `updateExp`, `addExp`, `removeExp`, `updateEdu`, `addEdu`, `removeEdu`, `startParsing`, `handleSave`). Replace its local `inputStyle`/`labelStyle`/`sectionTitle` with `import { inputStyle, labelStyle, sectionTitle } from '../../styles/formStyles';`. Create `frontend/src/features/onboarding/resume-upload/`:

| Sub-component file | Description | Props |
|---|---|---|
| `resume-upload/ResumeParsingScreen.jsx` | Full-screen spinner + progress bar | `fileName`, `progress` |
| `resume-upload/ResumeUploadDropzone.jsx` | Logo header, drag-and-drop dropzone, back button | `dragOver`, `error`, `onDragOver`, `onDragLeave`, `onDrop`, `onClick`, `fileRef`, `onFileChange`, `onBack` |
| `resume-upload/ResumeReviewBasicInfo.jsx` | Name/Email/Headline/Location grid | `parsed`, `onSet` |
| `resume-upload/ResumeReviewSkills.jsx` | Skill tags + search-to-add | `parsed`, `skillSearch`, `filteredSkills`, `onRemoveSkill`, `onSkillSearchChange`, `onAddSkill` |
| `resume-upload/ResumeReviewExperience.jsx` | Experience entries with edit/remove/add | `experience`, `onUpdateExp`, `onAddExp`, `onRemoveExp` |
| `resume-upload/ResumeReviewEducation.jsx` | Education entries with edit/remove/add | `education`, `onUpdateEdu`, `onAddEdu`, `onRemoveEdu` |
| `resume-upload/ResumeReviewPreferences.jsx` | Roles / experience level / work prefs / salary pickers | `parsed`, `onSet` |

`ResumeUpload.jsx` keeps the three phase branches (parsing / upload / review) and stitches the sub-components into the review branch, passing state values and helper callbacks per the prop tables. Sub-components import `inputStyle`/`labelStyle`/`sectionTitle` from `../../../styles/formStyles` and UI primitives from `../../../components/ui/<Name>` as needed.

- [ ] **Step 4: Update `App.jsx` imports**

```js
import AuthScreen from './features/auth/AuthScreen';
import RoleSelect from './features/auth/RoleSelect';
import SeekerChoice from './features/onboarding/SeekerChoice';
import ResumeUpload from './features/onboarding/ResumeUpload';
import ResumeBuilder from './features/onboarding/ResumeBuilder';
```

- [ ] **Step 5: Run the e2e suite**

Run from `frontend/`: `npm run test:e2e`
Expected: `18 passed` (the auth and onboarding specs exercise `AuthScreen`, `SeekerChoice`, `ResumeUpload`).

- [ ] **Step 6: Write the `ResumeUpload` render test**

Create `frontend/src/features/onboarding/ResumeUpload.test.jsx` using the render-test template, with:
```jsx
render(<ResumeUpload onComplete={() => {}} onBack={() => {}} />);
```
Assert the upload-phase heading renders (`expect(screen.getByRole('heading', { name: /upload your resume/i })).toBeTruthy()`).

- [ ] **Step 7: Run the unit tests**

Run from `frontend/`: `npm test`
Expected: all test files pass.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/features/auth frontend/src/features/onboarding frontend/src/styles/formStyles.js frontend/src/App.jsx
git commit -m "SP1 batch 6: extract and split auth + onboarding"
```

---

## Task 7: Batch 7 — seeker AI features (InterviewBot, ScoutView, MatcherView splits)

**Files:**
- Create: `frontend/src/lib/score.js`
- Create: `frontend/src/features/interview/InterviewBot.jsx` + `frontend/src/features/interview/` sub-components
- Create: `frontend/src/features/scout/ScoutView.jsx`, `frontend/src/features/scout/renderText.js` + `frontend/src/features/scout/` sub-components
- Create: `frontend/src/features/matcher/MatcherView.jsx` + `frontend/src/features/matcher/` sub-components
- Create: `InterviewBot.test.jsx`, `ScoutView.test.jsx`, `MatcherView.test.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/lib/score.js`**

`InterviewBot` and `MatcherView` both define an identical `scoreColor` helper. Create:
```js
// Maps a 0-100 score to its display color. (Exact body copied from the
// existing scoreColor helper in InterviewBot.)
export const scoreColor = (score) => { /* exact existing body */ };
```

- [ ] **Step 2: Extract `InterviewBot` and split it**

Move `InterviewBot` to `frontend/src/features/interview/InterviewBot.jsx`. It keeps all 14 `useState`, the 3 refs, all 7 handlers (`speak`, `startInterview`, `startRecording`, `stopRecording`, `submitAnswer`, `nextQuestion`, `resetInterview`), and derived `avgScore`. Replace its inline `scoreColor` with `import { scoreColor } from '../../lib/score';`. Create:

| Sub-component file | Description | Props |
|---|---|---|
| `interview/InterviewSetupPhase.jsx` | Setup form: JD textarea, title/company inputs, type/difficulty toggles, start button, info box | `jd`, `jobTitle`, `companyName`, `interviewType`, `difficulty`, `loading`, `onJdChange`, `onJobTitleChange`, `onCompanyChange`, `onInterviewTypeChange`, `onDifficultyChange`, `onStart` |
| `interview/InterviewActivePhase.jsx` | Active interview: header, progress, question card, recording controls, transcript editor, feedback card, next button | `session`, `currentQ`, `q`, `progress`, `isSpeaking`, `isRecording`, `isTranscribing`, `isEvaluating`, `transcript`, `feedback`, `scoreColor`, `onReset`, `onStartRecording`, `onStopRecording`, `onTranscriptChange`, `onSubmitAnswer`, `onNext` |
| `interview/InterviewReviewPhase.jsx` | Post-interview report: score circle, stats, per-answer cards, practice-again button | `answers`, `avgScore`, `scoreColor`, `onReset` |

`InterviewBot.jsx` keeps the 3 phase-routing early returns and renders the matching sub-component.

- [ ] **Step 3: Extract `ScoutView` and split it**

Move `ScoutView` to `frontend/src/features/scout/ScoutView.jsx`. It keeps its 4 `useState`, 2 refs, 2 `useEffect`, and handlers (`scrollToBottom`, `sendMessage`, `handleSuggestion`, `handleKeyDown`). Pull the pure `renderText` helper into `frontend/src/features/scout/renderText.js` as `export const renderText = ...`. Create:

| Sub-component file | Description | Props |
|---|---|---|
| `scout/ScoutJobCard.jsx` | One job result card (currently a nested component; `profile.skills` becomes an explicit prop) | `job`, `profileSkills` |
| `scout/ScoutHeader.jsx` | Avatar + "Scout AI" header | none |
| `scout/ScoutMessageList.jsx` | Scrollable message list, typing indicator, ref anchor | `messages`, `loading`, `messagesEndRef`, `onSuggestion`, `profileSkills`, `renderText` |
| `scout/ScoutInputBar.jsx` | Text input + send button + footer note | `input`, `loading`, `inputRef`, `onInputChange`, `onKeyDown`, `onSend` |

`ScoutView.jsx` imports `renderText` from `./renderText` and passes it to `ScoutMessageList`; it passes `profile?.skills` as `profileSkills`. `ScoutMessageList` renders `ScoutJobCard` for job results.

- [ ] **Step 4: Extract `MatcherView` and split it**

Move `MatcherView` to `frontend/src/features/matcher/MatcherView.jsx`. It keeps all `useState`, both `useEffect`, and handlers (`handleSubmit`, `handleCopy`, `handleReset`, `canSubmit`). Replace its inline `scoreColor` with `import { scoreColor } from '../../lib/score';` and its inline `inputStyle`/`labelStyle`/`sectionTitle` with `import { inputStyle, labelStyle, sectionTitle } from '../../styles/formStyles';`. Create:

| Sub-component file | Description | Props |
|---|---|---|
| `matcher/MatcherLoadingState.jsx` | Centered spinner with mode-dependent message | `mode` |
| `matcher/MatcherAnalysisResult.jsx` | Score circle, strengths/gaps, keywords, cover-letter score | `result`, `scoreColor` |
| `matcher/MatcherCoverLetterResult.jsx` | Generated cover letter + copy button | `generatedCL`, `mode`, `copied`, `onCopy` |
| `matcher/MatcherResultView.jsx` | Result wrapper: header + renders `MatcherAnalysisResult` or `MatcherCoverLetterResult` | `mode`, `result`, `generatedCL`, `copied`, `scoreColor`, `onReset`, `onCopy` |
| `matcher/MatcherInputView.jsx` | Full input form: header, history panel, mode/source selectors, cover-letter input, submit | `mode`, `resumeSource`, `resumeText`, `jdSource`, `jdText`, `selectedJobId`, `coverLetter`, `jobs`, `history`, `showHistory`, `error`, `loading`, `profile`, `canSubmit`, `scoreColor`, `onModeChange`, `onResumeSourceChange`, `onResumeTextChange`, `onJdSourceChange`, `onJdTextChange`, `onJobIdChange`, `onCoverLetterChange`, `onToggleHistory`, `onHistoryItemClick`, `onSubmit` |

`MatcherView.jsx` keeps the 3 step branches (loading / result / input) and renders the matching sub-component. `MatcherResultView` imports and renders the two result sub-components.

- [ ] **Step 5: Update `App.jsx` imports**

```js
import InterviewBot from './features/interview/InterviewBot';
import ScoutView from './features/scout/ScoutView';
import MatcherView from './features/matcher/MatcherView';
```

- [ ] **Step 6: Run the e2e suite**

Run from `frontend/`: `npm run test:e2e`
Expected: `18 passed`.

- [ ] **Step 7: Write render tests for `InterviewBot`, `ScoutView`, `MatcherView`**

Use the render-test template. Representative props:
```jsx
const profile = { name: 'Test Seeker', skills: [], desired_roles: [], experience: [], education: [] };
// InterviewBot.test.jsx
render(<InterviewBot profile={profile} />);
// ScoutView.test.jsx
render(<ScoutView profile={profile} />);
// MatcherView.test.jsx
render(<MatcherView profile={profile} />);
```
Each asserts the component renders a heading or its setup/input view (`expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)`).

- [ ] **Step 8: Run the unit tests**

Run from `frontend/`: `npm test`
Expected: all test files pass.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/lib/score.js frontend/src/features/interview frontend/src/features/scout frontend/src/features/matcher frontend/src/App.jsx
git commit -m "SP1 batch 7: extract and split seeker AI features"
```

---

## Task 8: Batch 8 — dashboards + chat (with SeekerDashboard split)

**Files:**
- Create: `frontend/src/features/chat/ChatView.jsx`
- Create: `frontend/src/features/dashboard/RecruiterDashboard.jsx`, `CompanyDashboard.jsx`
- Create: `frontend/src/features/dashboard/SeekerDashboard.jsx` + `frontend/src/features/dashboard/seeker/` (3 sub-components)
- Create: `frontend/src/features/dashboard/SeekerDashboard.test.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `ChatView`, `RecruiterDashboard`, `CompanyDashboard` per the Recipe**

One file each. They use UI primitives, `Sidebar`, `JobCard`, `MESSAGES`/`CANDIDATES`/`PIPELINE_*` from `../../data/mockData`, and the `api` client as applicable. Append `export default <Name>;`.

- [ ] **Step 2: Extract `SeekerDashboard` and split it**

Move `SeekerDashboard` to `frontend/src/features/dashboard/SeekerDashboard.jsx`. It keeps all `useState`, the `useEffect`, and `handleJobSearch`. It continues to route the `scout`/`interview`/`matcher`/`roadmap`/`chat` tabs to `ScoutView`/`InterviewBot`/`MatcherView`/`IdeasBoard`/`ChatView` (imported from their modules). Create `frontend/src/features/dashboard/seeker/`:

| Sub-component file | Description | Props |
|---|---|---|
| `seeker/SeekerResumeTab.jsx` | Resume view card with profile fields + AI summary | `profile`, `aiSummary`, `onEditResume` |
| `seeker/SeekerAnalyticsTab.jsx` | Stat cards + skill-demand bar chart | `matchedJobs`, `applied`, `profile` |
| `seeker/SeekerHomeTab.jsx` | Job search form, filter input, job list with loading state | `profile`, `search`, `searchInput`, `locationInput`, `filtered`, `jobsLoading`, `usingRealJobs`, `applied`, `saved`, `onSearchChange`, `onJobSearch`, `onSearchInputChange`, `onLocationInputChange`, `onApply`, `onSave` |

`SeekerDashboard.jsx` renders the matching tab sub-component, passing its state values + callbacks per the prop tables.

- [ ] **Step 3: Update `App.jsx` imports**

```js
import ChatView from './features/chat/ChatView';
import SeekerDashboard from './features/dashboard/SeekerDashboard';
import RecruiterDashboard from './features/dashboard/RecruiterDashboard';
import CompanyDashboard from './features/dashboard/CompanyDashboard';
```

- [ ] **Step 4: Run the e2e suite**

Run from `frontend/`: `npm run test:e2e`
Expected: `18 passed`.

- [ ] **Step 5: Write the `SeekerDashboard` render test**

Create `frontend/src/features/dashboard/SeekerDashboard.test.jsx` using the render-test template, with:
```jsx
const profile = { name: 'Test Seeker', skills: [], desired_roles: [], experience: [], education: [] };
render(<SeekerDashboard profile={profile} aiSummary="" activeTab="home" onEditResume={() => {}} />);
```
Assert a heading renders.

- [ ] **Step 6: Run the unit tests**

Run from `frontend/`: `npm test`
Expected: all test files pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/chat frontend/src/features/dashboard frontend/src/App.jsx
git commit -m "SP1 batch 8: extract and split dashboards + chat"
```

---

## Task 9: Batch 9 — final App.jsx slim-down

By now `App.jsx` should contain only: the top-of-file imports, the `App()` component, and `export default App`.

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Audit `App.jsx` for leftover code**

Read `App.jsx` end to end. Confirm the only definition remaining is `App()`. Anything else — a stray helper, a leftover constant, a commented-out block, an unused import — is dead code from the extraction.

- [ ] **Step 2: Remove dead code**

Delete any unused imports (imports of symbols `App()` no longer references) and any leftover non-`App` definitions that should have moved in an earlier batch. If a leftover definition is genuinely still used by `App()`, move it to the correct module (`lib/`, `data/`, or `components/`) per the Recipe and import it.

- [ ] **Step 3: Confirm `App()` is orchestration only**

`App()` should contain: the `useState` calls (`user`, `profile`, `currentPage`, `activeTab`, `phase`), the `useEffect` syncing `currentPage` from `window.location.pathname`, the auth/navigation handler functions, and a render switch selecting the page/dashboard component. It should render `GlobalStyles` plus the selected component — no large JSX of its own.

- [ ] **Step 4: Run the full test suite**

Run from `frontend/`:
```bash
npm test
npm run test:e2e
```
Expected: all unit test files pass; `18 passed` for e2e.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "SP1 batch 9: slim App.jsx to orchestrator, remove dead code"
```

---

## Done criteria

- `App.jsx` is an orchestrator of a few hundred lines — state, routing effect, handlers, render switch.
- Every former `App.jsx` component lives in a focused module under `src/lib`, `src/data`, `src/styles`, `src/components`, `src/pages`, or `src/features`.
- No file exceeds ~250 lines.
- The seven split components have passing co-located render tests.
- `npm run test:e2e` reports `18 passed`; `npm test` passes.
- Nine commits on `main`, each independently green.
