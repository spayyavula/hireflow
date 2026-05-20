# Hyrly LP0 + LP1: Cleanup + Triage-as-Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Layoff Pivot's first wave — fix the live trademark/testimonial liabilities (LP0) and replace `hyrly.ai/` with a Layoff Triage tool that hands off into Scout AI with the user's context preloaded (LP1).

**Architecture:** New Vike `+Page.jsx` at `/` renders a 10-question Triage wizard above the fold. Wizard state lives in client React (`useReducer`); the final answers POST to a new `/api/triage` endpoint that runs a deterministic rule-based plan generator and persists the response to a new `triage_responses` Supabase table. The "Talk to Scout AI" CTA on the result page calls `/api/scout/chat` with a synthesized first-message that embeds the user's context summary — no schema changes to Scout. Old marketing pages (`/features`, `/pricing`, `/about`, etc.) stay mounted unchanged behind nav; the homepage is the *only* thing rewritten.

**Tech Stack:** Vike + React 18 (frontend), FastAPI + Supabase (backend), Vitest + Playwright (frontend tests), pytest (backend tests).

**Spec:** [`docs/superpowers/specs/2026-05-20-hyrly-layoff-pivot-design.md`](../specs/2026-05-20-hyrly-layoff-pivot-design.md) — the strategic spine. Don't re-derive decisions here; read the spec when uncertain about ICP, pricing, or wedge.

---

## File Structure

**LP0 cleanup (existing files modified):**
- `frontend/src/pages/marketing/LandingPage.jsx` — change LinkedIn/Indeed marketing copy
- `frontend/src/pages/marketing/FeaturesPage.jsx` — same
- `frontend/src/App.jsx` — change Scout-AI search subtitle copy
- `frontend/src/pages/marketing/landing/LandingTestimonials.jsx` — replace fake testimonials with honest placeholder
- `frontend/src/pages/marketing/landing/LandingFeaturedJobs.jsx` — remove "Demo preview — sample data" badge (component itself will stop being used after LP1, but cleanup the copy now in case it remains)

**LP1 backend (new):**
- `backend/supabase/migrations/008_triage.sql` — `triage_responses` table
- `backend/api/models/schemas.py` — append `TriageAnswers`, `TriageActionItem`, `TriagePlan`, `TriageResponse` Pydantic models
- `backend/api/services/triage.py` — deterministic plan generator
- `backend/tests/unit/test_triage_service.py` — generator tests
- `backend/api/routes/triage.py` — `POST /api/triage` endpoint
- `backend/tests/integration/test_triage_route.py` — endpoint test
- `backend/api/index.py` — register the new router

**LP1 frontend (new + replacement):**
- `frontend/src/features/triage/questions.js` — the 10 question definitions
- `frontend/src/features/triage/questions.test.js` — schema validation
- `frontend/src/features/triage/TriageWizard.jsx` — the multi-step UI component
- `frontend/src/features/triage/TriageWizard.test.jsx` — wizard interaction tests
- `frontend/src/features/triage/TriagePlan.jsx` — output rendering with Scout handoff CTA
- `frontend/src/features/triage/TriagePlan.test.jsx` — render test
- `frontend/src/features/triage/scoutHandoff.js` — synthesize the Scout opening message
- `frontend/src/features/triage/scoutHandoff.test.js` — handoff message tests
- `frontend/src/api.js` — add `submitTriage()` + `startScoutWithContext()` methods
- `frontend/pages/index/+Page.jsx` — **rewrite** to render the new homepage
- `frontend/pages/index/+config.js` — update SEO title/description
- `frontend/pages/index/+Head.jsx` — **new** file to override the root `+Head.jsx` JSON-LD for the homepage-specific positioning (organization + WebSite + the WebPage about LayoffTriage)

**Files explicitly NOT touched (kept as-is, just demoted from homepage):**
- `frontend/src/pages/marketing/LandingPage.jsx` (after the LP0 copy fix — the component still exists for `/about-product` if we want it later; for LP1 it's just unmounted from `/`)
- All other marketing pages, recruiter/company features, blog, jobs hub, etc.

---

## Task 1: LP0 — Trademark copy cleanup

**Files:**
- Modify: `frontend/src/pages/marketing/LandingPage.jsx:55`
- Modify: `frontend/src/pages/marketing/FeaturesPage.jsx:22`
- Modify: `frontend/src/App.jsx:837`

**Context:** `App.jsx:645` (the per-job source badge labeling a job from the LinkedIn data source we received) and `AboutPage.jsx:23` (a team bio saying someone "worked at LinkedIn") are *nominative fair use* — they describe real facts, not data partnerships. Don't touch them. The three sites above are *marketing claims* implying we have a data partnership we don't have — these need to go.

- [ ] **Step 1: Replace LandingPage.jsx aiFeatures copy**

In `frontend/src/pages/marketing/LandingPage.jsx`, find the `aiFeatures` array's third entry (Multi-Provider Job Search). The current `desc`:
```js
desc: "Search across JSearch, Jobs API, LinkedIn, Indeed, and multi-board aggregators simultaneously. Jobs are deduplicated, scored against your profile, and ranked by match strength.",
```
Replace with:
```js
desc: "Aggregated search across 5+ public job-board APIs and open data sources. Jobs are deduplicated, scored against your profile, and ranked by match strength.",
```

- [ ] **Step 2: Replace FeaturesPage.jsx feature description**

In `frontend/src/pages/marketing/FeaturesPage.jsx` line 22, the current entry:
```js
{ icon: Icons.search, title: "Multi-Provider Job Search", desc: "Search JSearch, Jobs API, LinkedIn, Indeed, and multi-board aggregators — deduplicated and match-scored." },
```
Replace `desc` with:
```js
desc: "Aggregated search across 5+ public job-board APIs and open data sources — deduplicated and match-scored.",
```

- [ ] **Step 3: Replace App.jsx Scout search subtitle**

In `frontend/src/App.jsx` around line 837, the current text:
```jsx
Scout searches JSearch, Jobs API, LinkedIn, Indeed & more simultaneously
```
Replace with:
```jsx
Scout searches multiple public job-board APIs in parallel
```

- [ ] **Step 4: Confirm zero remaining marketing-claim mentions**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow && grep -n "LinkedIn, Indeed\|Indeed, and\|LinkedIn and Indeed" frontend/src --include=\*.jsx --include=\*.js -r
```
Expected: no matches. (The `App.jsx:645` source-badge dict — `linkedin:"LinkedIn",indeed:"Indeed"` — is a label map for data we receive, and is fine; the grep above explicitly avoids matching that.)

- [ ] **Step 5: Run tests**

Run: `cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test`
Expected: PASS — 34/34. No existing test asserts the old marketing copy.

- [ ] **Step 6: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/pages/marketing/LandingPage.jsx frontend/src/pages/marketing/FeaturesPage.jsx frontend/src/App.jsx
git commit -m "$(cat <<'EOF'
chore: drop LinkedIn/Indeed name-drops from marketing copy

LP0 cleanup #1. Both LinkedIn and Indeed actively enforce trademark
+ false-affiliation claims. We never had a data partnership with
either; we surface results from public job-board APIs that may include
their listings via downstream aggregators (JSearch et al.). Marketing
copy now describes the capability ("5+ public job-board APIs") without
naming trademarked third parties. The two remaining nominative uses
(App.jsx job-source label dict, AboutPage team bio) are factual and
stay.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: LP0 — Testimonials honest placeholder

**Files:**
- Modify: `frontend/src/pages/marketing/landing/LandingTestimonials.jsx`

**Context:** The three current testimonials (Priya M., Daniel R., Lena K.) have initial-only names, no photos, no LinkedIn links, no company logos — the FTC's Endorsement Guides explicitly flag this shape as a violation risk since 2024. We don't have real beta users yet; the right move is a credible "coming soon" placeholder. After LP4 distribution brings the first 5–10 beta users in, this file becomes the real testimonials file.

- [ ] **Step 1: Replace the file contents wholesale**

Open `frontend/src/pages/marketing/landing/LandingTestimonials.jsx` and replace the **entire file** with:

```jsx
export function LandingTestimonials() {
  return (
    <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 16,
        }}>What early users say</h2>
        <div style={{
          maxWidth: 560, margin: "0 auto", padding: "32px 28px",
          background: "white", borderRadius: 20,
          border: "1px dashed var(--border)",
        }}>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
            We're collecting real testimonials from our first cohort of beta users
            right now. Quotes will appear here with full name, photo, and LinkedIn
            link once we have permission. If you're a Hyrly user and would like to
            be featured, <a href="mailto:hello@hyrly.ai" style={{ color: "var(--coral)", fontWeight: 600 }}>email us</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
```

(The file is currently 53 lines; the new version is ~25 lines, and the named export contract is preserved so `LandingPage.jsx`'s import line still works.)

- [ ] **Step 2: Confirm no other file references the old testimonials data**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow && grep -rn "Priya M\|Daniel R\|Lena K" --include=\*.jsx --include=\*.js
```
Expected: no matches (the `LandingTestimonials.jsx` no longer contains them).

- [ ] **Step 3: Run tests**

Run: `cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test`
Expected: PASS — 34/34.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/pages/marketing/landing/LandingTestimonials.jsx
git commit -m "$(cat <<'EOF'
chore: replace fabricated-looking testimonials with honest placeholder

LP0 cleanup #2. The previous testimonials (Priya M., Daniel R., Lena K.)
had initial-only names + no photos + no LinkedIn + no company logos —
the exact shape the FTC flags as endorsement-rule violations under the
2024 update. We don't have real testimonials yet; the placeholder
invites beta users to opt in via email. Replace with real quotes
(full name, photo, LinkedIn, company logo) once available.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: LP0 — Remove "sample data" badges

**Files:**
- Modify: `frontend/src/pages/marketing/landing/LandingFeaturedJobs.jsx:14-18`
- Modify: `frontend/src/App.jsx:1414`

**Context:** Two visible "sample data" / "Demo preview" indicators currently signal to visitors that the product isn't real. The `LandingFeaturedJobs` component is about to stop being mounted on the homepage anyway (LP1 replaces the homepage), but it remains importable for other pages, so clean it. The `App.jsx` indicator inside the seeker job-search view is a real conditional but the *copy* is unflattering — replace with neutral framing.

- [ ] **Step 1: Drop the "Demo preview — sample data" badge from LandingFeaturedJobs.jsx**

In `frontend/src/pages/marketing/landing/LandingFeaturedJobs.jsx` lines 12–18, the current header block is:
```jsx
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 12px" }}>
          Top roles from companies using Hyrly right now
        </p>
        <span style={{
          display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: "rgba(126,184,158,0.12)", color: "var(--sage)", border: "1px solid rgba(126,184,158,0.25)",
        }}>Demo preview — sample data</span>
```
Replace with:
```jsx
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
          A sample of roles surfaced by Hyrly's match engine
        </p>
```
(Both the "Top roles from companies using Hyrly right now" claim and the "Demo preview — sample data" badge go away; the new copy is honest without being self-deprecating.)

- [ ] **Step 2: Soften the seeker view "(sample data)" indicator**

In `frontend/src/App.jsx` around line 1414, the current line:
```jsx
{!usingRealJobs && !jobsLoading && <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>(sample data)</span>}
```
Replace with:
```jsx
{!usingRealJobs && !jobsLoading && <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>(showing sample roles — connect a profile to see live results)</span>}
```

- [ ] **Step 3: Run tests**

Run: `cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test`
Expected: PASS — 34/34.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/pages/marketing/landing/LandingFeaturedJobs.jsx frontend/src/App.jsx
git commit -m "$(cat <<'EOF'
chore: replace 'demo preview / sample data' framing with honest CTAs

LP0 cleanup #3. The two visible "sample data" markers (homepage
LandingFeaturedJobs badge + seeker job-search subtitle) read as
"product isn't real yet" to visitors. Replace with neutral framing
that explains why sample data is shown and how to switch to live
results.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Backend — `triage_responses` table migration

**Files:**
- Create: `backend/supabase/migrations/008_triage.sql`

**Context:** Each triage submission is a row. We capture the raw answers (so we can re-analyze later), the generated plan (so we can render it without re-running the generator), and an optional `user_id` (null for anonymous, FK to users for logged-in). `triage_responses` is the canonical name; the table sits alongside `hub_content`, `feature_requests`, etc. in `backend/supabase/migrations/`. Migrations are applied manually in the Supabase dashboard (per repo convention — there's no automated migration runner).

- [ ] **Step 1: Create the migration file**

Create `backend/supabase/migrations/008_triage.sql`:

```sql
-- LP1: Layoff Triage responses
-- Each row = one completed triage submission.
-- answers JSONB holds the raw 10 question/answer pairs.
-- plan JSONB holds the deterministic plan generator's output.
-- user_id is NULL for anonymous submissions (homepage triage requires no signup).

CREATE TABLE IF NOT EXISTS triage_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  answers       JSONB NOT NULL,
  plan          JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS triage_responses_user_id_idx
  ON triage_responses(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS triage_responses_created_at_idx
  ON triage_responses(created_at DESC);

-- RLS: anonymous inserts allowed via the service-role key (backend writes
-- everything); reads only via service role. The frontend never reads this
-- table directly; it gets the plan back from the POST response.
ALTER TABLE triage_responses ENABLE ROW LEVEL SECURITY;

-- No public policies = nothing readable/writable without service role.
-- This matches the pattern in 005_blog.sql and 007_hub_content.sql.
```

- [ ] **Step 2: Note that the migration must be applied via Supabase dashboard**

Add a one-line note to the file's top comment (already covered above by "applied manually") and to the commit message. There is no automated runner to invoke; the user (or you, when shipping LP1) will paste this SQL into the Supabase SQL Editor.

- [ ] **Step 3: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add backend/supabase/migrations/008_triage.sql
git commit -m "$(cat <<'EOF'
feat(db): add triage_responses table (LP1)

Schema for the Layoff Triage homepage tool. Apply manually via the
Supabase SQL Editor before LP1 endpoint ships. Anonymous submissions
allowed (user_id nullable); RLS locks all access to service role.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Backend — Pydantic schemas for triage

**Files:**
- Modify: `backend/api/models/schemas.py` (append at end)

**Context:** The triage answers and plan need typed shapes both as inbound (POST body) and outbound (response model). Keep the schemas in the existing `schemas.py` since that's where everything else lives — don't fragment by feature.

- [ ] **Step 1: Append the schemas**

Open `backend/api/models/schemas.py` and append at the end (after the last existing class, before the file ends):

```python


# ─── LP1: Layoff Triage ──────────────────────────────────────

class TriageAnswers(BaseModel):
    """Raw answers from the 10-question Triage wizard.

    Each field matches a question id from
    frontend/src/features/triage/questions.js. Keep field names in lockstep
    with that file — if a question id changes there, change it here too.
    """
    laid_off_when: str           # 'today' | '1-7d' | '8-30d' | '31-90d' | '90+d'
    role: str                    # 'engineer' | 'em' | 'pm' | 'designer' | 'data' | 'other'
    level: str                   # 'junior' | 'mid' | 'senior' | 'staff_plus'
    company_tier: str            # 'faang' | 'public' | 'series_b_d' | 'pre_series_b' | 'other'
    severance_runway: str        # 'none' | 'lt_8w' | '8_16w' | '16w_plus'
    visa_status: str             # 'citizen_gc' | 'h1b' | 'opt' | 'other_temp'
    location_flexibility: str    # 'same_metro' | 'us_relocate' | 'remote_us' | 'international'
    resume_state: str            # 'up_to_date' | 'needs_rewrite' | 'not_started' | 'unsure'
    network_state: str           # 'warm_intros' | 'cold_contacts' | 'limited' | 'rebuild'
    top_concern: str             # 'finances' | 'visa' | 'imposter' | 'direction' | 'family' | 'other'


class TriageActionItem(BaseModel):
    priority: int                # 1..N (lower = more urgent)
    title: str                   # "File for unemployment this week"
    why: str                     # "With <8 weeks of severance, the 1-3 week processing delay matters."
    how: str                     # "uidol.dol.gov has a state-by-state filing tool. ~20 min."
    eta: str                     # "20 minutes" | "1-2 hours" | "this week"


class TriagePlan(BaseModel):
    summary: str                 # "You're a Senior Engineer, just laid off from a Series C startup..."
    suggested_first_topic: str   # 'severance' | 'visa' | 'resume' | 'career_exploration' | 'finances' | 'networking'
    actions: list[TriageActionItem]


class TriageResponse(BaseModel):
    """Response shape from POST /api/triage."""
    triage_id: str               # UUID, used to fetch + Scout handoff
    plan: TriagePlan
```

- [ ] **Step 2: Confirm the file imports work**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && SECRET_KEY=test SUPABASE_URL=https://x.supabase.co SUPABASE_SERVICE_ROLE_KEY=test python -c "from api.models.schemas import TriageAnswers, TriagePlan, TriageActionItem, TriageResponse; print('ok')"
```
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add backend/api/models/schemas.py
git commit -m "$(cat <<'EOF'
feat(api): TriageAnswers/Plan/Response schemas (LP1)

Pydantic shapes for the Layoff Triage endpoint. Field names mirror
the question ids in frontend/src/features/triage/questions.js — keep
them in lockstep.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Backend — Triage plan generator service (TDD)

**Files:**
- Create: `backend/api/services/triage.py`
- Create: `backend/tests/unit/test_triage_service.py`

**Context:** Deterministic rule-based generator for v1 — no LLM call, no external dependency, fast and 100% testable. Takes a `TriageAnswers` and returns a `TriagePlan`. Rules:

1. If `visa_status == 'h1b'` AND `laid_off_when in {'today','1-7d','8-30d'}` → top priority is **visa clock** with a hard 60-day countdown.
2. Else if `severance_runway == 'none'` AND `laid_off_when in {'today','1-7d'}` → top priority is **negotiate severance**.
3. Else if `severance_runway in {'none','lt_8w'}` → top priority is **file for unemployment**.
4. Else (longer runway, no urgent crisis) → top priority is **career direction conversation with Scout AI**.

Then layer in resume rewrite (if `resume_state in {'needs_rewrite','not_started','unsure'}`), networking (if `network_state in {'cold_contacts','limited','rebuild'}`), interview prep (always — Hyrly's Interview Bot is a free intro session), and "what do you want next" exploration (if `top_concern == 'direction'`).

Cap at 8 action items. Each item has a hand-written `why`/`how` so the output reads like a real coach wrote it, not an LLM hallucinated it.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/unit/test_triage_service.py`:

```python
import pytest
from api.models.schemas import TriageAnswers
from api.services.triage import generate_plan


def _base_answers(**overrides) -> TriageAnswers:
    """Sensible defaults; tests override only what they care about."""
    return TriageAnswers(
        laid_off_when='1-7d',
        role='engineer',
        level='senior',
        company_tier='series_b_d',
        severance_runway='8_16w',
        visa_status='citizen_gc',
        location_flexibility='remote_us',
        resume_state='needs_rewrite',
        network_state='cold_contacts',
        top_concern='direction',
    )


@pytest.mark.unit
class TestTriageGenerator:

    def test_h1b_recent_layoff_visa_is_top_priority(self):
        ans = _base_answers(visa_status='h1b', laid_off_when='today')
        plan = generate_plan(ans)
        assert plan.actions[0].title.startswith('H-1B 60-day grace')
        assert plan.suggested_first_topic == 'visa'

    def test_no_severance_recent_layoff_negotiate_first(self):
        ans = _base_answers(severance_runway='none', laid_off_when='today')
        plan = generate_plan(ans)
        assert 'severance' in plan.actions[0].title.lower()
        assert plan.suggested_first_topic == 'severance'

    def test_low_runway_unemployment_first(self):
        ans = _base_answers(severance_runway='lt_8w', laid_off_when='8-30d')
        plan = generate_plan(ans)
        # Unemployment beats resume rewrite when runway is tight.
        assert 'unemployment' in plan.actions[0].title.lower()

    def test_long_runway_direction_career_conversation_first(self):
        ans = _base_answers(severance_runway='16w_plus', top_concern='direction')
        plan = generate_plan(ans)
        assert 'scout' in plan.actions[0].title.lower() or 'direction' in plan.actions[0].title.lower()
        assert plan.suggested_first_topic == 'career_exploration'

    def test_resume_rewrite_appears_when_needed(self):
        ans = _base_answers(resume_state='needs_rewrite')
        plan = generate_plan(ans)
        titles = [a.title.lower() for a in plan.actions]
        assert any('resume' in t for t in titles)

    def test_no_resume_action_when_already_up_to_date(self):
        ans = _base_answers(resume_state='up_to_date')
        plan = generate_plan(ans)
        titles = [a.title.lower() for a in plan.actions]
        assert not any('resume' in t and 'rewrite' in t for t in titles)

    def test_networking_action_when_weak_network(self):
        ans = _base_answers(network_state='limited')
        plan = generate_plan(ans)
        titles = [a.title.lower() for a in plan.actions]
        assert any('network' in t or 'intro' in t for t in titles)

    def test_max_8_actions(self):
        # Maximal stress: every condition triggers an action.
        ans = _base_answers(
            visa_status='h1b', laid_off_when='today', severance_runway='none',
            resume_state='not_started', network_state='rebuild', top_concern='direction',
        )
        plan = generate_plan(ans)
        assert len(plan.actions) <= 8

    def test_priority_numbers_are_sequential(self):
        ans = _base_answers()
        plan = generate_plan(ans)
        priorities = [a.priority for a in plan.actions]
        assert priorities == list(range(1, len(priorities) + 1))

    def test_summary_mentions_role_level_when(self):
        ans = _base_answers(role='engineer', level='senior', laid_off_when='1-7d')
        plan = generate_plan(ans)
        # Free-text summary; check for the actual signal words.
        s = plan.summary.lower()
        assert 'senior' in s and ('engineer' in s or 'eng' in s)
        assert 'week' in s or 'day' in s  # references when

    def test_actions_have_nonempty_strings(self):
        ans = _base_answers()
        plan = generate_plan(ans)
        for a in plan.actions:
            assert a.title.strip(), f"empty title in {a}"
            assert a.why.strip(), f"empty why in {a}"
            assert a.how.strip(), f"empty how in {a}"
            assert a.eta.strip(), f"empty eta in {a}"
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/unit/test_triage_service.py -v 2>&1 | tail -20
```
Expected: All 11 tests fail with `ModuleNotFoundError: No module named 'api.services.triage'`.

- [ ] **Step 3: Implement the generator**

Create `backend/api/services/triage.py`:

```python
"""LP1 Triage plan generator.

Deterministic rule-based mapping from TriageAnswers -> TriagePlan. Every
action item has hand-written copy (no LLM call) so the output reads like
a coach wrote it. v1 covers the four most-load-bearing layoff scenarios:
visa clock, no-severance crisis, tight-runway file-for-unemployment, and
long-runway-but-stuck career exploration. Layered on top: resume rewrite,
networking, interview prep, direction conversation.
"""

from __future__ import annotations

from api.models.schemas import TriageAnswers, TriageActionItem, TriagePlan


# ─── Copy-as-data: action item templates ──────────────────────

def _visa_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,  # placeholder; renumbered at the end
        title="H-1B 60-day grace period — start the clock today",
        why="From your last day, you have 60 days to find a new H-1B sponsor "
            "or change status. Day 30 is when most people start panicking; you "
            "want to be in offer conversations by then.",
        how="(1) Filter only H-1B-friendly employers (h1bgrader.com, MyVisaJobs). "
            "(2) Tell recruiters upfront — they can fast-track or de-prioritize you, "
            "but they MUST know. (3) Talk to an immigration attorney this week "
            "about backup options (B-2 visitor extension, F-1 reactivation, "
            "spouse-dependent visa).",
        eta="this week",
    )


def _negotiate_severance_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="Negotiate severance before you sign anything",
        why="The first severance offer is almost never the final number. "
            "Companies expect counter-offers and many will improve the package — "
            "especially if you flag age/discrimination concerns or unused PTO/RSU vesting.",
        how="(1) Don't sign for 48-72 hours. (2) Ask HR in writing: 'Is this "
            "negotiable?' — the answer is almost always yes. (3) Counter on "
            "duration (+2-4 weeks), benefits continuation, RSU acceleration, "
            "and outplacement budget. (4) Get an employment attorney to review "
            "if the package is >$20k.",
        eta="48-72 hours",
    )


def _unemployment_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="File for unemployment this week",
        why="Most laid-off engineers skip this thinking they're 'fine' — but "
            "weekly benefits stack up to $5-15k over a multi-month search, "
            "and the 1-3 week processing delay means you want to file now even "
            "if you might find work fast.",
        how="Your state's unemployment site (Google '<state> unemployment "
            "filing'). 20 minutes online; you'll need your last employer's "
            "EIN (on a recent paystub) and dates of employment.",
        eta="20 minutes",
    )


def _career_direction_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="Start a Scout AI session on what you want next",
        why="You have runway and the freedom to actually choose what's next "
            "instead of taking the first offer. The biggest mistake in week 1 "
            "is jumping into job applications before deciding what you're "
            "applying for.",
        how="Open Scout AI and start with 'Help me figure out what I want my "
            "next role to look like.' Scout will work through values, "
            "constraints, must-haves, and walk-aways with you. Takes 20-30 min.",
        eta="30 minutes",
    )


def _resume_rewrite_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="Rewrite your resume for the active-search version",
        why="A resume written while employed sounds different from one written "
            "for active search — bullet emphasis shifts from 'responsibilities' "
            "to 'shipped + measurable impact', and the headline should flag "
            "your search status without sounding desperate.",
        how="Use Hyrly's Scout AI 'Resume Rewrite' flow, or run your current "
            "resume past the JD of one job you'd want and rewrite the top "
            "third to match its keywords. Aim for 1 page if <10 years, 2 if more.",
        eta="2-3 hours",
    )


def _networking_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="Send 10 warm-reactivation messages this week",
        why="60-70% of senior engineering roles fill via referral, never reaching "
            "a public job board. Your dormant network is your highest-ROI search "
            "channel — but you have to actually message people, not just update "
            "your LinkedIn headline.",
        how="Pick 10 people you've worked with in the last 5 years. Same message "
            "to each: 'Hey [name], I'm exploring what's next after [company]. "
            "Are you / do you know anyone hiring [role] right now? Happy to send "
            "my resume if useful.' Don't apologize for asking.",
        eta="1 hour to write, replies trickle in for weeks",
    )


def _interview_prep_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="Do one voice mock interview before your first real call",
        why="The first real interview always goes worse than later ones because "
            "you're rusty. Burn the rust on a mock instead of a real role.",
        how="Open Hyrly's Interview Bot, paste a JD you'd realistically apply to, "
            "and do one full mock. The voice transcript + STAR-method scoring "
            "tells you exactly which answers need work.",
        eta="30 minutes",
    )


def _direction_conversation_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="One 90-minute thinking session — not in front of a computer",
        why="Your top concern is 'what do I want next', which doesn't get "
            "solved by scrolling LinkedIn. It gets solved by getting bored "
            "enough that the answer surfaces on its own.",
        how="Walk for 90 minutes with a notebook. Three questions: What did I "
            "actually love about my last role? What did I quietly dread? What "
            "would I regret not trying in the next 5 years? Bring the answers "
            "back to a Scout AI session.",
        eta="90 minutes",
    )


# ─── Plan composition ─────────────────────────────────────────

def _build_summary(a: TriageAnswers) -> str:
    role_label = {
        'engineer': 'engineer', 'em': 'engineering manager', 'pm': 'PM',
        'designer': 'designer', 'data': 'data professional', 'other': 'professional',
    }.get(a.role, 'professional')
    level_label = {
        'junior': 'Junior', 'mid': 'Mid-level', 'senior': 'Senior', 'staff_plus': 'Staff+/Director',
    }.get(a.level, '')
    tier_label = {
        'faang': 'a FAANG-tier company', 'public': 'a public tech company',
        'series_b_d': 'a Series B-D startup', 'pre_series_b': 'a pre-Series B startup',
        'other': 'your last role',
    }.get(a.company_tier, 'your last role')
    when_label = {
        'today': 'today', '1-7d': 'in the last week', '8-30d': 'in the last month',
        '31-90d': 'in the last 1-3 months', '90+d': 'over 3 months ago',
    }.get(a.laid_off_when, '')
    runway_label = {
        'none': 'no severance', 'lt_8w': 'less than 8 weeks of runway',
        '8_16w': '8-16 weeks of runway', '16w_plus': '16+ weeks of runway',
    }.get(a.severance_runway, '')

    return (
        f"You're a {level_label} {role_label}, laid off from {tier_label} "
        f"{when_label}, with {runway_label}. Here are the priorities I'd work "
        f"in your order, based on what tends to actually move the needle in "
        f"week 1 vs. what feels productive but isn't."
    )


def _pick_first_topic(a: TriageAnswers) -> str:
    if a.visa_status == 'h1b' and a.laid_off_when in {'today', '1-7d', '8-30d'}:
        return 'visa'
    if a.severance_runway == 'none' and a.laid_off_when in {'today', '1-7d'}:
        return 'severance'
    if a.severance_runway in {'none', 'lt_8w'}:
        return 'finances'
    if a.top_concern == 'direction':
        return 'career_exploration'
    if a.resume_state in {'needs_rewrite', 'not_started', 'unsure'}:
        return 'resume'
    return 'networking'


def generate_plan(a: TriageAnswers) -> TriagePlan:
    actions: list[TriageActionItem] = []

    # Top priority — the one urgent thing.
    if a.visa_status == 'h1b' and a.laid_off_when in {'today', '1-7d', '8-30d'}:
        actions.append(_visa_action())
    elif a.severance_runway == 'none' and a.laid_off_when in {'today', '1-7d'}:
        actions.append(_negotiate_severance_action())
    elif a.severance_runway in {'none', 'lt_8w'}:
        actions.append(_unemployment_action())
    else:
        actions.append(_career_direction_action())

    # Layered actions, conditional.
    if a.severance_runway in {'none', 'lt_8w'} and not (
        a.severance_runway == 'none' and a.laid_off_when in {'today', '1-7d'}
    ):
        # If they didn't already get the negotiate-severance action, suggest unemployment regardless.
        if not any(x.title.startswith('File for unemployment') for x in actions):
            actions.append(_unemployment_action())

    if a.resume_state in {'needs_rewrite', 'not_started', 'unsure'}:
        actions.append(_resume_rewrite_action())

    if a.network_state in {'cold_contacts', 'limited', 'rebuild'}:
        actions.append(_networking_action())

    if a.top_concern == 'direction':
        actions.append(_direction_conversation_action())

    # Always-on: interview prep.
    actions.append(_interview_prep_action())

    # Cap at 8 and renumber.
    actions = actions[:8]
    for i, item in enumerate(actions, start=1):
        item.priority = i

    return TriagePlan(
        summary=_build_summary(a),
        suggested_first_topic=_pick_first_topic(a),
        actions=actions,
    )
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/unit/test_triage_service.py -v 2>&1 | tail -25
```
Expected: All 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add backend/api/services/triage.py backend/tests/unit/test_triage_service.py
git commit -m "$(cat <<'EOF'
feat(triage): deterministic plan generator (LP1)

Rule-based generator covering the four load-bearing layoff scenarios
(visa clock, no-severance, tight runway, long-runway-but-stuck) plus
layered actions (resume, networking, interview prep, direction
conversation). Hand-written copy on every action item — no LLM call,
fully testable. Capped at 8 actions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Backend — `POST /api/triage` endpoint (TDD)

**Files:**
- Create: `backend/api/routes/triage.py`
- Create: `backend/tests/integration/test_triage_route.py`
- Modify: `backend/api/index.py:25,80` (import + register router)

**Context:** Endpoint accepts `TriageAnswers`, runs the generator, persists to `triage_responses`, returns `{triage_id, plan}`. No auth required (anonymous submissions are fine — the homepage triage doesn't gate on signup). Backend `core/database.py` exposes the Supabase client we use elsewhere.

- [ ] **Step 1: Write the failing integration test**

Create `backend/tests/integration/test_triage_route.py`:

```python
"""Integration tests for POST /api/triage.

Uses the mocked Supabase pattern from tests/integration/test_jobs.py etc. —
patch api.core.database.supabase to assert insert was called with the
right shape, and to return a synthesized row so the endpoint can build a
response.
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from api.index import app


client = TestClient(app)


VALID_PAYLOAD = {
    "laid_off_when": "1-7d",
    "role": "engineer",
    "level": "senior",
    "company_tier": "series_b_d",
    "severance_runway": "8_16w",
    "visa_status": "citizen_gc",
    "location_flexibility": "remote_us",
    "resume_state": "needs_rewrite",
    "network_state": "cold_contacts",
    "top_concern": "direction",
}


@pytest.mark.integration
def test_triage_post_returns_triage_id_and_plan():
    fake_id = "abc-123-uuid"
    insert_mock = MagicMock()
    insert_mock.execute.return_value = MagicMock(
        data=[{"id": fake_id}], count=None
    )
    table_mock = MagicMock()
    table_mock.insert.return_value = insert_mock

    with patch("api.routes.triage.supabase") as sb:
        sb.table.return_value = table_mock
        resp = client.post("/api/triage", json=VALID_PAYLOAD)

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["triage_id"] == fake_id
    assert "plan" in body
    assert body["plan"]["summary"].startswith("You're a Senior engineer")
    assert len(body["plan"]["actions"]) >= 1
    assert body["plan"]["actions"][0]["priority"] == 1

    # Verify what was inserted.
    sb.table.assert_called_with("triage_responses")
    insert_args = table_mock.insert.call_args[0][0]
    assert insert_args["answers"] == VALID_PAYLOAD
    assert insert_args["plan"]["actions"][0]["title"]
    assert insert_args["user_id"] is None  # anonymous


@pytest.mark.integration
def test_triage_post_rejects_missing_field():
    bad = dict(VALID_PAYLOAD)
    del bad["visa_status"]
    resp = client.post("/api/triage", json=bad)
    assert resp.status_code == 422


@pytest.mark.integration
def test_triage_post_returns_503_when_db_insert_fails():
    insert_mock = MagicMock()
    insert_mock.execute.side_effect = Exception("supabase down")
    table_mock = MagicMock()
    table_mock.insert.return_value = insert_mock

    with patch("api.routes.triage.supabase") as sb:
        sb.table.return_value = table_mock
        resp = client.post("/api/triage", json=VALID_PAYLOAD)

    assert resp.status_code == 503
    assert "triage" in resp.json()["detail"].lower() or "unavailable" in resp.json()["detail"].lower()
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/integration/test_triage_route.py -v 2>&1 | tail -15
```
Expected: All 3 tests fail with `ModuleNotFoundError` or `404` (no route registered).

- [ ] **Step 3: Implement the route**

Create `backend/api/routes/triage.py`:

```python
"""LP1: POST /api/triage — accepts the 10-question Triage answers,
generates a deterministic priority plan, persists, returns the plan.

No auth required — anonymous submissions are the primary path for
homepage Triage."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.core.database import supabase
from api.models.schemas import TriageAnswers, TriageResponse
from api.services.triage import generate_plan


router = APIRouter(prefix="/api/triage", tags=["Triage"])


@router.post("", response_model=TriageResponse)
def submit_triage(answers: TriageAnswers) -> TriageResponse:
    plan = generate_plan(answers)
    try:
        result = (
            supabase.table("triage_responses")
            .insert({
                "user_id": None,
                "answers": answers.model_dump(),
                "plan": plan.model_dump(),
            })
            .execute()
        )
    except Exception as exc:
        # Don't leak the supabase error; surface a generic 503.
        raise HTTPException(
            status_code=503,
            detail="Triage service temporarily unavailable.",
        ) from exc

    if not result.data:
        raise HTTPException(
            status_code=503,
            detail="Triage service temporarily unavailable.",
        )

    triage_id = str(result.data[0]["id"])
    return TriageResponse(triage_id=triage_id, plan=plan)
```

- [ ] **Step 4: Wire the router into the app**

In `backend/api/index.py`, find line 25:
```python
from api.routes import auth, seeker, jobs, recruiter, company, chat, matcher, features, blog, seo
```
Add `triage`:
```python
from api.routes import auth, seeker, jobs, recruiter, company, chat, matcher, features, blog, seo, triage
```

Then find the block of `app.include_router(...)` calls (around line 71-80). Append:
```python
app.include_router(triage.router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/integration/test_triage_route.py -v 2>&1 | tail -15
```
Expected: All 3 tests PASS.

- [ ] **Step 6: Run full backend test suite to confirm nothing regressed**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest -m "unit or integration" 2>&1 | tail -5
```
Expected: 158 passed (the 144 from before + 11 generator unit tests + 3 route integration tests).

- [ ] **Step 7: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add backend/api/routes/triage.py backend/tests/integration/test_triage_route.py backend/api/index.py
git commit -m "$(cat <<'EOF'
feat(api): POST /api/triage endpoint (LP1)

Anonymous submission of the 10-question Layoff Triage. Runs the
deterministic plan generator, persists to triage_responses, returns
{triage_id, plan}. Surfaces a clean 503 if Supabase is unreachable
instead of leaking the underlying error.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Frontend — Triage question definitions

**Files:**
- Create: `frontend/src/features/triage/questions.js`
- Create: `frontend/src/features/triage/questions.test.js`

**Context:** Questions are a data module — separate from the wizard component so the rendering logic stays simple and the question set can be edited by a non-React-fluent person (or eventually a content editor). Each question has an `id` (matching the backend `TriageAnswers` field name), a `prompt`, a `subtitle` (optional context), and `options` (array of `{value, label}`). The wizard renders them generically.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/triage/questions.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { QUESTIONS, QUESTION_IDS } from './questions';

describe('triage questions', () => {
  it('has exactly 10 questions', () => {
    expect(QUESTIONS).toHaveLength(10);
  });

  it('every question has id, prompt, options', () => {
    for (const q of QUESTIONS) {
      expect(q.id).toBeTypeOf('string');
      expect(q.id.length).toBeGreaterThan(0);
      expect(q.prompt).toBeTypeOf('string');
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      for (const opt of q.options) {
        expect(opt.value).toBeTypeOf('string');
        expect(opt.label).toBeTypeOf('string');
      }
    }
  });

  it('question ids match the backend TriageAnswers schema field names', () => {
    // Hard-coded reference: keep in lockstep with backend/api/models/schemas.py TriageAnswers
    const expected = [
      'laid_off_when', 'role', 'level', 'company_tier', 'severance_runway',
      'visa_status', 'location_flexibility', 'resume_state', 'network_state', 'top_concern',
    ];
    expect(QUESTION_IDS).toEqual(expected);
  });

  it('exports QUESTION_IDS in the same order as QUESTIONS', () => {
    expect(QUESTION_IDS).toEqual(QUESTIONS.map((q) => q.id));
  });

  it('option values match the backend enum values', () => {
    // Spot-check a few. Don't enumerate everything (the schema is the source of truth);
    // just ensure no typos in the ones the generator tests assert on.
    const byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
    const values = (id) => byId[id].options.map((o) => o.value);

    expect(values('laid_off_when')).toContain('today');
    expect(values('laid_off_when')).toContain('1-7d');
    expect(values('visa_status')).toContain('h1b');
    expect(values('severance_runway')).toContain('none');
    expect(values('top_concern')).toContain('direction');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- questions.test.js 2>&1 | tail -15
```
Expected: FAIL — cannot resolve `./questions`.

- [ ] **Step 3: Create the questions module**

Create `frontend/src/features/triage/questions.js`:

```js
// 10-question Layoff Triage. Order is the wizard order.
// Question ids and option values MUST stay in lockstep with the backend
// TriageAnswers Pydantic model in backend/api/models/schemas.py.

export const QUESTIONS = [
  {
    id: 'laid_off_when',
    prompt: 'When were you laid off?',
    options: [
      { value: 'today', label: 'Today or yesterday' },
      { value: '1-7d', label: '1–7 days ago' },
      { value: '8-30d', label: '8–30 days ago' },
      { value: '31-90d', label: '1–3 months ago' },
      { value: '90+d', label: 'More than 3 months ago' },
    ],
  },
  {
    id: 'role',
    prompt: 'What was your role?',
    options: [
      { value: 'engineer', label: 'Software engineer' },
      { value: 'em', label: 'Engineering manager' },
      { value: 'pm', label: 'Product manager' },
      { value: 'designer', label: 'Designer' },
      { value: 'data', label: 'Data / ML / Analytics' },
      { value: 'other', label: 'Other tech role' },
    ],
  },
  {
    id: 'level',
    prompt: 'What level were you at?',
    options: [
      { value: 'junior', label: 'Junior (0–3 yrs)' },
      { value: 'mid', label: 'Mid-level (3–7 yrs)' },
      { value: 'senior', label: 'Senior (7–15 yrs)' },
      { value: 'staff_plus', label: 'Staff+ / Director / VP (15+ yrs)' },
    ],
  },
  {
    id: 'company_tier',
    prompt: 'What kind of company were you at?',
    options: [
      { value: 'faang', label: 'FAANG / Big Tech' },
      { value: 'public', label: 'Other public tech company' },
      { value: 'series_b_d', label: 'Series B–D startup' },
      { value: 'pre_series_b', label: 'Pre-Series B startup' },
      { value: 'other', label: 'Other (consulting, agency, non-tech, etc.)' },
    ],
  },
  {
    id: 'severance_runway',
    prompt: 'How long is your runway?',
    subtitle: 'Counting severance + savings, how long before you NEED a paycheck?',
    options: [
      { value: 'none', label: 'No severance, tight savings' },
      { value: 'lt_8w', label: 'Less than 8 weeks' },
      { value: '8_16w', label: '8–16 weeks (2–4 months)' },
      { value: '16w_plus', label: '16+ weeks' },
    ],
  },
  {
    id: 'visa_status',
    prompt: 'What\'s your work-authorization status in the US?',
    options: [
      { value: 'citizen_gc', label: 'US citizen or green card' },
      { value: 'h1b', label: 'H-1B — need a new sponsor' },
      { value: 'opt', label: 'F-1 OPT / STEM OPT' },
      { value: 'other_temp', label: 'Other temporary visa' },
    ],
  },
  {
    id: 'location_flexibility',
    prompt: 'How flexible is your location?',
    options: [
      { value: 'same_metro', label: 'Same metro only' },
      { value: 'us_relocate', label: 'Open to relocating in the US' },
      { value: 'remote_us', label: 'Remote US only' },
      { value: 'international', label: 'Open to international' },
    ],
  },
  {
    id: 'resume_state',
    prompt: 'How current is your resume?',
    options: [
      { value: 'up_to_date', label: 'Up to date — ready to send' },
      { value: 'needs_rewrite', label: 'Needs a rewrite' },
      { value: 'not_started', label: 'Haven\'t started' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    id: 'network_state',
    prompt: 'How\'s your network?',
    options: [
      { value: 'warm_intros', label: 'Have warm intros lined up' },
      { value: 'cold_contacts', label: 'Have contacts but mostly cold' },
      { value: 'limited', label: 'Limited — small network' },
      { value: 'rebuild', label: 'Need to rebuild from scratch' },
    ],
  },
  {
    id: 'top_concern',
    prompt: 'What\'s the #1 thing keeping you up at night?',
    options: [
      { value: 'finances', label: 'Finances / runway' },
      { value: 'visa', label: 'Visa clock' },
      { value: 'imposter', label: 'Imposter syndrome / confidence' },
      { value: 'direction', label: 'What I want to do next' },
      { value: 'family', label: 'Family / partner pressure' },
      { value: 'other', label: 'Something else' },
    ],
  },
];

export const QUESTION_IDS = QUESTIONS.map((q) => q.id);
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- questions.test.js 2>&1 | tail -8
```
Expected: PASS — 5/5.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/features/triage/questions.js frontend/src/features/triage/questions.test.js
git commit -m "$(cat <<'EOF'
feat(triage): 10-question definitions module (LP1)

Pure data module: each question has id (matching backend TriageAnswers
field), prompt, optional subtitle, and 2+ options each with value+label.
QUESTION_IDS is the ordered list of ids, exported for the wizard and
asserted against the backend schema in the test.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Frontend — `api.js` triage helpers

**Files:**
- Modify: `frontend/src/api.js` (append two methods to the `HyrlyAPI` class)

**Context:** Two new client methods. `submitTriage(answers)` POSTs to `/api/triage` and returns `{triage_id, plan}`. `startScoutWithContext({summary, suggestedFirstTopic})` POSTs to `/api/scout/chat` with a synthesized opening message that includes the triage summary — Scout then has full context without re-asking. The latter is just a one-line wrapper around the existing Scout chat flow; no backend change required.

- [ ] **Step 1: Locate the insertion point**

In `frontend/src/api.js`, find the `logout()` method around line 72-75:
```js
  logout() {
    this.token = null;
    safeStorage.remove('hyrly_token');
  }
```
The triage methods go right after `logout()` and before `// ─── Seeker ───`.

- [ ] **Step 2: Append the two methods**

After `logout()` and before the `// ─── Seeker ───────────────────────────────────────────` comment, insert:

```js

  // ─── Triage (LP1) ─────────────────────────────────────
  async submitTriage(answers) {
    return this._fetch('/api/triage', {
      method: 'POST',
      body: JSON.stringify(answers),
    });
  }

  async startScoutWithContext({ summary, suggestedFirstTopic }) {
    // Synthesize a Scout opening message that embeds the triage summary
    // so Scout doesn't make the user re-explain. The Scout backend treats
    // any inbound message as user input, so this is the cleanest handoff.
    const openings = {
      visa: 'Help me figure out my H-1B grace-period plan.',
      severance: 'Help me negotiate my severance package.',
      finances: 'Help me budget and file for unemployment.',
      resume: 'Help me rewrite my resume for active search.',
      career_exploration: 'Help me figure out what I want my next role to look like.',
      networking: 'Help me reactivate my network.',
    };
    const opening = openings[suggestedFirstTopic] || 'I\'d like a career coaching session.';
    const message = `${opening}\n\nContext: ${summary}`;
    return this._fetch('/api/scout/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
```

- [ ] **Step 3: Run tests**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test
```
Expected: PASS — 35/35 (the 34 existing + the 1 new questions.test.js file, which counts as 5 individual tests).

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/api.js
git commit -m "$(cat <<'EOF'
feat(api): submitTriage + startScoutWithContext client helpers (LP1)

Two new methods on HyrlyAPI. submitTriage POSTs the 10 answers.
startScoutWithContext synthesizes an opening message that embeds the
triage summary, so Scout AI gets full context without re-asking the
user. No backend change required — Scout treats the synthesized message
as ordinary user input.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Frontend — `TriageWizard` component (TDD)

**Files:**
- Create: `frontend/src/features/triage/TriageWizard.jsx`
- Create: `frontend/src/features/triage/TriageWizard.test.jsx`

**Context:** Multi-step wizard. Renders one question at a time with the option as buttons. Tracks answers in `useReducer` state. On the final answer, calls `props.onComplete(answers)`. Includes a progress indicator ("Question 3 of 10") and a back button. State is held in component only — no localStorage persistence in v1 (3 minutes is short enough that a refresh recovery isn't worth the complexity).

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/triage/TriageWizard.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TriageWizard } from './TriageWizard';
import { QUESTIONS } from './questions';

describe('TriageWizard', () => {
  it('renders the first question initially', () => {
    render(<TriageWizard onComplete={() => {}} />);
    expect(screen.getByText(QUESTIONS[0].prompt)).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 10/i)).toBeInTheDocument();
  });

  it('advances to the next question when an option is clicked', () => {
    render(<TriageWizard onComplete={() => {}} />);
    fireEvent.click(screen.getByText(QUESTIONS[0].options[0].label));
    expect(screen.getByText(QUESTIONS[1].prompt)).toBeInTheDocument();
    expect(screen.getByText(/Question 2 of 10/i)).toBeInTheDocument();
  });

  it('renders a back button after question 1 that returns to the previous question', () => {
    render(<TriageWizard onComplete={() => {}} />);
    fireEvent.click(screen.getByText(QUESTIONS[0].options[0].label));  // advance
    fireEvent.click(screen.getByText(/Back/i));
    expect(screen.getByText(QUESTIONS[0].prompt)).toBeInTheDocument();
  });

  it('calls onComplete with all 10 answers when the last question is answered', () => {
    const onComplete = vi.fn();
    render(<TriageWizard onComplete={onComplete} />);
    // Click the first option of every question in sequence.
    for (let i = 0; i < QUESTIONS.length; i++) {
      fireEvent.click(screen.getByText(QUESTIONS[i].options[0].label));
    }
    expect(onComplete).toHaveBeenCalledOnce();
    const answers = onComplete.mock.calls[0][0];
    for (const q of QUESTIONS) {
      expect(answers[q.id]).toBe(q.options[0].value);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- TriageWizard 2>&1 | tail -10
```
Expected: FAIL — cannot resolve `./TriageWizard`.

- [ ] **Step 3: Implement the wizard**

Create `frontend/src/features/triage/TriageWizard.jsx`:

```jsx
import { useReducer } from 'react';
import { QUESTIONS } from './questions';

function reducer(state, action) {
  switch (action.type) {
    case 'answer': {
      const q = QUESTIONS[state.index];
      const answers = { ...state.answers, [q.id]: action.value };
      const next = state.index + 1;
      return { index: next, answers };
    }
    case 'back':
      return { ...state, index: Math.max(0, state.index - 1) };
    default:
      return state;
  }
}

export function TriageWizard({ onComplete }) {
  const [state, dispatch] = useReducer(reducer, { index: 0, answers: {} });

  // Trigger onComplete when we've stepped past the last question.
  if (state.index >= QUESTIONS.length) {
    // Render a transient "Generating your plan…" so React doesn't render nothing on the final tick.
    // The parent will swap us out when its onComplete callback resolves.
    onComplete(state.answers);
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Generating your plan…
      </div>
    );
  }

  const q = QUESTIONS[state.index];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600 }}>
        Question {state.index + 1} of {QUESTIONS.length}
      </div>
      <h2 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
        color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: q.subtitle ? 8 : 24,
      }}>{q.prompt}</h2>
      {q.subtitle && (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>{q.subtitle}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {q.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => dispatch({ type: 'answer', value: opt.value })}
            style={{
              padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)',
              background: 'white', color: 'var(--ink)', fontSize: 15, fontWeight: 500,
              textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--coral)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {state.index > 0 && (
        <button
          onClick={() => dispatch({ type: 'back' })}
          style={{
            marginTop: 20, background: 'transparent', border: 'none', color: 'var(--text-muted)',
            fontSize: 13, cursor: 'pointer', padding: '4px 0',
          }}
        >
          ← Back
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- TriageWizard 2>&1 | tail -10
```
Expected: PASS — 4/4.

(If the `onComplete` test fires twice because the post-completion render re-invokes onComplete on re-render: that's a real concern. The simplest fix is to gate the call in a `useEffect` instead. If the test fails on `toHaveBeenCalledOnce`, swap the inline-call for:
```jsx
import { useEffect, useReducer } from 'react';
// ...
useEffect(() => {
  if (state.index >= QUESTIONS.length) onComplete(state.answers);
}, [state.index, state.answers, onComplete]);
if (state.index >= QUESTIONS.length) {
  return <div ...>Generating your plan…</div>;
}
```)

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/features/triage/TriageWizard.jsx frontend/src/features/triage/TriageWizard.test.jsx
git commit -m "$(cat <<'EOF'
feat(triage): TriageWizard component (LP1)

Multi-step wizard rendering one question at a time from QUESTIONS.
useReducer for state, progress indicator, back button after question 1,
onComplete called with the full answers dict when the last question is
answered.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Frontend — `TriagePlan` output component (TDD)

**Files:**
- Create: `frontend/src/features/triage/TriagePlan.jsx`
- Create: `frontend/src/features/triage/TriagePlan.test.jsx`

**Context:** Renders the `TriagePlan` returned from the backend. Shows the summary at top, then 5–8 action cards (priority + title + why + how + eta), then a sticky "Talk to Scout AI about this →" CTA that calls `onStartScout(plan)`. No state of its own — it's a pure render.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/triage/TriagePlan.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TriagePlan } from './TriagePlan';

const SAMPLE_PLAN = {
  summary: "You're a Senior engineer, laid off in the last week...",
  suggested_first_topic: 'career_exploration',
  actions: [
    {
      priority: 1, title: 'Negotiate severance',
      why: 'First offer is never final.', how: 'Don\'t sign for 48 hours.', eta: '48 hours',
    },
    {
      priority: 2, title: 'File for unemployment',
      why: 'Processing takes 1-3 weeks.', how: 'Your state UI portal.', eta: '20 minutes',
    },
  ],
};

describe('TriagePlan', () => {
  it('renders the summary', () => {
    render(<TriagePlan plan={SAMPLE_PLAN} onStartScout={() => {}} />);
    expect(screen.getByText(/Senior engineer/)).toBeInTheDocument();
  });

  it('renders all action items in priority order', () => {
    render(<TriagePlan plan={SAMPLE_PLAN} onStartScout={() => {}} />);
    expect(screen.getByText('Negotiate severance')).toBeInTheDocument();
    expect(screen.getByText('File for unemployment')).toBeInTheDocument();
    expect(screen.getByText(/First offer is never final/)).toBeInTheDocument();
    expect(screen.getByText(/Your state UI portal/)).toBeInTheDocument();
  });

  it('calls onStartScout with the plan when the Scout CTA is clicked', () => {
    const onStartScout = vi.fn();
    render(<TriagePlan plan={SAMPLE_PLAN} onStartScout={onStartScout} />);
    fireEvent.click(screen.getByText(/Talk to Scout AI/i));
    expect(onStartScout).toHaveBeenCalledWith(SAMPLE_PLAN);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- TriagePlan 2>&1 | tail -10
```
Expected: FAIL — cannot resolve `./TriagePlan`.

- [ ] **Step 3: Implement the component**

Create `frontend/src/features/triage/TriagePlan.jsx`:

```jsx
export function TriagePlan({ plan, onStartScout }) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 16,
        }}>Your week-1 priorities</h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {plan.summary}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {plan.actions.map((a) => (
          <div key={a.priority} style={{
            background: 'white', borderRadius: 16, padding: '20px 24px',
            border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(13,13,15,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--coral)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}>{a.priority}</div>
              <h3 style={{
                fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1.35,
              }}>{a.title}</h3>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 10 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Why:</strong> {a.why}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 10 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>How:</strong> {a.how}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>~ {a.eta}</p>
          </div>
        ))}
      </div>

      <div style={{
        position: 'sticky', bottom: 16,
        background: 'var(--cream)', padding: '16px 24px', borderRadius: 16,
        border: '1px solid var(--border)', boxShadow: '0 -2px 12px rgba(13,13,15,0.06)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          Want a coach to help you actually execute this plan?
        </p>
        <button
          onClick={() => onStartScout(plan)}
          style={{
            background: 'var(--ink)', color: 'white', padding: '14px 28px',
            borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Talk to Scout AI about this →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- TriagePlan 2>&1 | tail -8
```
Expected: PASS — 3/3.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/features/triage/TriagePlan.jsx frontend/src/features/triage/TriagePlan.test.jsx
git commit -m "$(cat <<'EOF'
feat(triage): TriagePlan output component (LP1)

Pure-render component for the plan returned from POST /api/triage.
Renders summary + N action cards (priority badge + title + why + how
+ eta) + sticky Scout CTA. onStartScout(plan) callback hands the plan
up to the page-level container for the Scout handoff.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Frontend — Replace the homepage with the Triage flow

**Files:**
- Rewrite: `frontend/pages/index/+Page.jsx`
- Rewrite: `frontend/pages/index/+config.js`
- Create: `frontend/pages/index/+Head.jsx`

**Context:** This is the heart of LP1 — `hyrly.ai/` becomes the Triage tool. The existing marketing `LandingPage` component still exists at `frontend/src/pages/marketing/LandingPage.jsx` (cleaned in LP0 Tasks 1–3) but is no longer mounted at `/`. It can later be wired into `/about-product` if we want a separate marketing surface, but that's out of scope here — for LP1, marketing content lives in the per-page routes (`/features`, `/pricing`, `/about`, etc.) which are unchanged.

- [ ] **Step 1: Rewrite the index page**

Open `frontend/pages/index/+Page.jsx` and replace the **entire file** with:

```jsx
import { useState } from 'react';
import GlobalStyles from '../../src/styles/GlobalStyles';
import PublicNav from '../../src/components/PublicNav';
import { TriageWizard } from '../../src/features/triage/TriageWizard';
import { TriagePlan } from '../../src/features/triage/TriagePlan';
import api from '../../src/api';
import { marketingNavProps } from '../../src/lib/vikeNav';

const HERO_TITLE = 'Just got laid off?';
const HERO_SUBHEAD = 'Don\'t update your resume yet.';
const HERO_BODY =
  'Most laid-off engineers spend week 1 on tasks that don\'t matter and skip ' +
  'the ones that do. Answer 10 questions about your situation. Get your ' +
  'priorities ranked.';

export default function HomePage() {
  const navProps = marketingNavProps('home');
  const [stage, setStage] = useState('hero');           // 'hero' | 'wizard' | 'submitting' | 'plan' | 'scout'
  const [plan, setPlan] = useState(null);
  const [scoutReply, setScoutReply] = useState(null);
  const [error, setError] = useState(null);

  async function handleWizardComplete(answers) {
    setStage('submitting');
    setError(null);
    try {
      const resp = await api.submitTriage(answers);
      setPlan(resp.plan);
      setStage('plan');
    } catch (err) {
      setError(err.message || 'Submission failed');
      setStage('hero');
    }
  }

  async function handleStartScout(p) {
    setStage('submitting');
    setError(null);
    try {
      const reply = await api.startScoutWithContext({
        summary: p.summary,
        suggestedFirstTopic: p.suggested_first_topic,
      });
      setScoutReply(reply);
      setStage('scout');
    } catch (err) {
      setError(err.message || 'Scout request failed');
      setStage('plan');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...navProps} />

      {stage === 'hero' && (
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 64px', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 56, fontWeight: 700,
            color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1,
          }}>{HERO_TITLE}</h1>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400,
            color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 32,
          }}>{HERO_SUBHEAD}</h2>
          <p style={{
            fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6,
            maxWidth: 540, margin: '0 auto 40px',
          }}>{HERO_BODY}</p>
          <button
            onClick={() => setStage('wizard')}
            style={{
              background: 'var(--ink)', color: 'white', padding: '16px 36px',
              borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(13,13,15,0.12)',
            }}
          >Start triage — 3 minutes →</button>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
            No signup. No email. Free.
          </p>
          {error && (
            <p style={{ marginTop: 16, color: 'var(--coral)', fontSize: 14 }}>{error}</p>
          )}
        </section>
      )}

      {stage === 'wizard' && (
        <TriageWizard onComplete={handleWizardComplete} />
      )}

      {stage === 'submitting' && (
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Working on it…
        </div>
      )}

      {stage === 'plan' && plan && (
        <TriagePlan plan={plan} onStartScout={handleStartScout} />
      )}

      {stage === 'scout' && scoutReply && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
            color: 'var(--ink)', marginBottom: 16,
          }}>Scout says:</h2>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24,
            border: '1px solid var(--border)', whiteSpace: 'pre-wrap', lineHeight: 1.7,
          }}>{scoutReply.message || JSON.stringify(scoutReply, null, 2)}</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `+config.js` SEO title + description**

Open `frontend/pages/index/+config.js` and replace its contents with:

```js
export default {
  title: 'Hyrly — The AI coach for laid-off tech engineers',
  description:
    'Just got laid off? Answer 10 questions in 3 minutes and get your week-1 priorities ranked. Then talk to Scout AI, your coach across the 13 things that actually matter post-layoff.',
};
```

- [ ] **Step 3: Create `+Head.jsx` for homepage-specific JSON-LD**

Create `frontend/pages/index/+Head.jsx`:

```jsx
const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function HomeHead() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE}/#webpage-home`,
    url: `${SITE}/`,
    name: 'Hyrly — Layoff Triage + AI Career Coach',
    description:
      'Free 10-question Layoff Triage that ranks your week-1 priorities, ' +
      'with a hand-off to Scout AI for ongoing career coaching.',
    isPartOf: { '@id': `${SITE}/#website` },
    about: {
      '@type': 'Thing',
      name: 'Layoff response and career coaching for US tech engineers',
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
```

(Note: this is in addition to the root `frontend/pages/+Head.jsx` Organization/WebSite JSON-LD that fires on every page. Vike composes both.)

- [ ] **Step 4: Run frontend tests**

Run: `cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test`
Expected: PASS — 43/43 (34 baseline + 5 questions + 4 wizard + 3 plan = 46 actually; if numbers differ by ±1, that's fine — just no failures).

- [ ] **Step 5: Sanity-build to confirm the homepage compiles**

Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod 2>&1 | tail -20
```
Expected: build succeeds; "Sitemaps written" reports non-zero counts; `.vercel/output/` present; no errors.

- [ ] **Step 6: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/pages/index/+Page.jsx frontend/pages/index/+config.js frontend/pages/index/+Head.jsx
git commit -m "$(cat <<'EOF'
feat(home): replace marketing landing with Layoff Triage tool (LP1)

hyrly.ai/ is now the Triage tool, not a marketing carousel. Hero text
'Just got laid off? / Don't update your resume yet.' followed by the
10-question wizard, the personalized week-1 priorities output, and a
Scout AI handoff. SEO title + description rewritten for the new ICP.
WebPage JSON-LD added at /+Head.jsx (composes with the root
Organization/WebSite JSON-LD).

The old marketing LandingPage component still lives at
src/pages/marketing/LandingPage.jsx for future use; it's just no longer
mounted at /.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Deploy + smoke-test

**Files:** none modified — this is a deployment task.

**Context:** Frontend deploy uses the same CLI pattern from [[hireflow-deploy]] — `vercel build --prod` with explicit env vars, then `vercel deploy --prebuilt --prod --yes`. The backend ALSO needs a redeploy since we added a new route file (the deployed function won't know about `triage.py` until then) AND the migration `008_triage.sql` must be applied to Supabase before the endpoint can succeed.

- [ ] **Step 1: Apply the Supabase migration**

Open the Supabase project at https://supabase.com/dashboard/project/{your-project-id}/sql.

Paste the contents of `backend/supabase/migrations/008_triage.sql` and click **Run**.

Verify: in the Table Editor, `triage_responses` now exists with columns `id`, `user_id`, `answers`, `plan`, `created_at`. RLS is enabled, with no policies (= service-role-only access).

- [ ] **Step 2: Deploy the backend**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && vercel --prod --yes 2>&1 | tail -10
```
Expected: `readyState: READY`. Note the deployment URL.

Smoke-test the endpoint:
```bash
node -e "fetch('https://hireflow-api.vercel.app/api/triage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({laid_off_when:'1-7d',role:'engineer',level:'senior',company_tier:'series_b_d',severance_runway:'8_16w',visa_status:'citizen_gc',location_flexibility:'remote_us',resume_state:'needs_rewrite',network_state:'cold_contacts',top_concern:'direction'})}).then(r=>r.json()).then(b=>console.log('triage_id',b.triage_id,'actions',b.plan.actions.length,'first',b.plan.actions[0].title))"
```
Expected: a real `triage_id` (uuid), a positive action count, and a non-empty first action title. If 503: re-check that the migration ran and the deploy succeeded.

- [ ] **Step 3: Build the frontend**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && rm -rf .vercel/output dist && VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod 2>&1 | tail -10
```
Expected: build succeeds; "Sitemaps written" reports non-zero counts.

- [ ] **Step 4: Deploy the frontend**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && vercel deploy --prebuilt --prod --yes 2>&1 | tail -10
```
Expected: `Deployment ... ready`.

- [ ] **Step 5: Smoke-test the new homepage**

```bash
node -e "fetch('https://hyrly.ai/').then(r=>{console.log('status',r.status);return r.text();}).then(t=>{console.log('bytes',t.length);console.log('has-hero',t.includes('Just got laid off'));console.log('has-not-update-resume',t.includes('Don\\'t update your resume yet'));console.log('has-3-minutes',t.includes('3 minutes'));})"
```
Expected: status 200, contains all three hero strings.

- [ ] **Step 6: End-to-end Triage smoke-test from production**

Open https://hyrly.ai/ in a browser. Click "Start triage". Answer all 10 questions (any choices). Verify:
- (a) Each question advances cleanly with a Back button after Q1
- (b) The final answer triggers a network POST to `/api/triage`
- (c) The Plan renders with a summary, ≥1 action card, and a "Talk to Scout AI" button
- (d) Clicking "Talk to Scout AI" triggers a POST to `/api/scout/chat` and renders a response

If any step fails, check browser DevTools Network tab for the failing request and the server response.

- [ ] **Step 7: Final commit (deploy log)**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow && git push origin main
```

(There's nothing new to commit at this point — Task 13 is purely deploys + smoke tests. The `git push` syncs the LP0+LP1 commits to origin in case they aren't already.)

---

## Self-Review Notes

**Spec coverage (`docs/superpowers/specs/2026-05-20-hyrly-layoff-pivot-design.md`):**

- §2 ICP (US tech laid-off engineers): encoded in `_build_summary` + the visa/severance branches of the generator → ✅ Task 6
- §3 Wedge (Scout as coach): handoff via `startScoutWithContext` → ✅ Task 9, surfaced via TriagePlan CTA → ✅ Task 11
- §4 Front door (Triage as homepage): `+Page.jsx` rewrite → ✅ Task 12
- §4 Hero copy ("Just got laid off? / Don't update your resume yet."): exact strings in `+Page.jsx` → ✅ Task 12
- §5 Pricing (freemium $29/mo + $99 Sprint): **NOT covered here — deferred to LP3 per the spec**. No paywall in LP1; Scout sessions are unlimited at first ship. Acceptable.
- §6.1 LinkedIn/Indeed cleanup: → ✅ Task 1
- §6.2 Testimonials cleanup: → ✅ Task 2
- §8 Kill list ("AI-powered career partner" tagline, three-audience positioning, sample-data carousel): → ✅ Tasks 1, 3, 12 (the kill is implicit in the homepage rewrite — the old `LandingPage` is no longer mounted at `/`)
- §10 Success metrics: not implementable as code; tracked manually post-ship

**Placeholder scan:** none found. Every step has actual code or actual shell commands.

**Type/name consistency:** `TriageAnswers` / `TriagePlan` / `TriageActionItem` / `TriageResponse` consistent across schema (Task 5), service (Task 6), route (Task 7), and frontend `api.js` (Task 9). Question ids in `questions.js` (Task 8) match field names in `TriageAnswers` (Task 5) — explicitly asserted by `questions.test.js`. `suggested_first_topic` enum values in service (Task 6) match the keys in `startScoutWithContext`'s `openings` map (Task 9): `visa`, `severance`, `finances`, `resume`, `career_exploration`, `networking`.

**Open follow-ups for next sub-projects (NOT this plan):**

- LP2: harden Scout for the 13 explicit domains; tune the layoff-specific opening session
- LP3: gating Scout to 3 free sessions + Stripe for $29/mo + $99 Sprint bundle
- LP4: distribution (LinkedIn post from founder, layoffs.fyi community outreach, free Severance Calculator at `/tools/severance`)
