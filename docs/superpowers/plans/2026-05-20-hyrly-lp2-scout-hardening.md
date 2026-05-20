# Hyrly LP2 — Scout AI Hardening for the Layoff ICP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a layoff-tuned Scout AI MVP: chat continuation UI, `scout_sessions` persistence, layoff-aware intent detection, and 5 hand-written domain handlers (visa / severance / finances / resume / career_exploration) that read like the playbook voice. Reviewable end-to-end by Claude.ai.

**Architecture:** New endpoint pair `POST /api/scout/sessions` + `POST /api/scout/sessions/{id}/messages` backed by a `scout_sessions` Supabase table. Layoff-specific routing in a new `backend/api/services/scout_layoff.py` keeps the existing general-career Scout (`scout.py`) untouched for the `/app` flow. Frontend `ScoutChat.jsx` renders an iMessage-style conversation; `pages/index/+Page.jsx`'s `'scout'` stage swaps from the one-shot reply to this component.

**Tech Stack:** FastAPI + Supabase (backend), Vike + React 18 + Vitest (frontend), pytest (backend tests).

**Spec:** [`docs/superpowers/specs/2026-05-20-hyrly-lp2-scout-hardening-design.md`](../specs/2026-05-20-hyrly-lp2-scout-hardening-design.md)

---

## File Structure

**New files:**
- `backend/supabase/migrations/009_scout_sessions.sql` — `scout_sessions` table
- `backend/api/services/scout_layoff.py` — layoff-tuned intent detection + 5 domain handlers + opening builder + fallback
- `backend/tests/unit/test_scout_layoff.py` — handler + intent unit tests
- `backend/tests/integration/test_scout_sessions.py` — endpoint integration tests
- `frontend/src/features/scout/ScoutChat.jsx` — chat UI component
- `frontend/src/features/scout/ScoutChat.test.jsx` — component tests

**Modified files:**
- `backend/api/models/schemas.py` — append `ScoutSessionMessage`, `ScoutSessionCreateRequest`, `ScoutSessionResponse`, `ScoutSessionMessageRequest`
- `backend/api/routes/scout.py` — add the new `/sessions` endpoints (keep existing `/chat`)
- `frontend/src/api.js` — add `createScoutSession(triageId)` + `sendScoutMessage(sessionId, content)`
- `frontend/pages/index/+Page.jsx` — `'scout'` stage renders `ScoutChat` instead of single reply

**Untouched (LP2-MVP explicitly does NOT modify):**
- `backend/api/services/scout.py` and its existing handlers — used by `/api/scout/chat` for `/app` flow
- `backend/api/routes/scout.py:chat` route — backward compat
- Existing Scout-related frontend code under `/app`

---

## Task 1: `scout_sessions` migration SQL

**Files:**
- Create: `backend/supabase/migrations/009_scout_sessions.sql`

**Context:** `triage_responses.user_id` is TEXT (FK to `users.id` which is TEXT — see `008_triage.sql`). Match that. `messages` JSONB stores `[{role, content, ts}, ...]`. RLS locked to service-role-only (same pattern as `005_blog.sql`, `007_hub_content.sql`, `008_triage.sql`).

- [ ] **Step 1: Create the migration file**

Create `backend/supabase/migrations/009_scout_sessions.sql` with exactly:

```sql
-- LP2: Scout AI conversation sessions
-- Each row = one continuous conversation between a user and Scout AI.
-- messages JSONB holds the ordered list of {role, content, ts} entries.
-- user_id is nullable (anonymous homepage sessions). triage_id links the
-- session back to the triage that initiated it, used by the opening builder
-- to pull the user's profile + plan context.

CREATE TABLE IF NOT EXISTS scout_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  triage_id     UUID REFERENCES triage_responses(id) ON DELETE SET NULL,
  messages      JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scout_sessions_user_id_idx
  ON scout_sessions(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS scout_sessions_triage_id_idx
  ON scout_sessions(triage_id) WHERE triage_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS scout_sessions_updated_at_idx
  ON scout_sessions(updated_at DESC);

ALTER TABLE scout_sessions ENABLE ROW LEVEL SECURITY;

-- No public policies: same pattern as 005_blog, 007_hub_content, 008_triage.
-- Backend writes via service-role key; frontend never reads this table directly.
```

- [ ] **Step 2: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add backend/supabase/migrations/009_scout_sessions.sql
git commit -m "$(cat <<'EOF'
feat(db): scout_sessions table for LP2 chat continuation

Stores the full {role, content, ts} message array per session. Anonymous
(homepage-triage) sessions allowed. RLS service-role-only; backend writes
via the service-role key; frontend never reads the table directly. Apply
manually via Supabase SQL Editor before LP2 endpoints ship.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Pydantic schemas for ScoutSession

**Files:**
- Modify: `backend/api/models/schemas.py` (append at end)

**Context:** Four new schemas. Reuse the existing `TriagePlan` shape — sessions reference a triage, but we don't embed the full triage in session responses; just the `session_id` + `messages`.

- [ ] **Step 1: Append the schemas**

Open `backend/api/models/schemas.py` and append at the END of the file:

```python


# ─── LP2: Scout AI Sessions ──────────────────────────────────

class ScoutSessionMessage(BaseModel):
    """One message in a Scout AI conversation."""
    role: str       # 'user' | 'scout'
    content: str
    ts: str         # ISO 8601 UTC timestamp


class ScoutSessionCreateRequest(BaseModel):
    """Request to start a new Scout session.

    triage_id is optional — sessions can be anonymous and triage-less,
    in which case the opening message is a generic layoff greeting.
    """
    triage_id: str | None = None


class ScoutSessionMessageRequest(BaseModel):
    """User sends a follow-up message in an existing session."""
    content: str


class ScoutSessionResponse(BaseModel):
    """Response shape for POST /api/scout/sessions and message appends."""
    session_id: str
    messages: list[ScoutSessionMessage]
```

- [ ] **Step 2: Confirm imports work**

Run from Bash:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && SECRET_KEY=test SUPABASE_URL=https://x.supabase.co SUPABASE_SERVICE_ROLE_KEY=test python -c "from api.models.schemas import ScoutSessionMessage, ScoutSessionCreateRequest, ScoutSessionMessageRequest, ScoutSessionResponse; print('ok')"
```
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add backend/api/models/schemas.py
git commit -m "$(cat <<'EOF'
feat(api): Pydantic schemas for ScoutSession (LP2)

Four shapes: ScoutSessionMessage (one role+content+ts entry),
ScoutSessionCreateRequest (optional triage_id), ScoutSessionMessageRequest
(content for follow-ups), ScoutSessionResponse (session_id + full messages
array).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Layoff-tuned intent detection + 5 domain handlers + fallback (TDD)

**Files:**
- Create: `backend/api/services/scout_layoff.py`
- Create: `backend/tests/unit/test_scout_layoff.py`

**Context:** This is the meat of LP2. Five hand-written domain handlers + intent detection + an opening builder. Each handler produces 3–5 paragraphs of layoff-aware coaching in the playbook voice. Handlers take `(profile: dict, conversation: list)` and return a string. `profile` is the `TriageAnswers` dict (when there's a triage); `conversation` is the messages list so far. The intent detector picks one of the five handlers (or the generic fallback) based on the user's last message + recent conversation context.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/unit/test_scout_layoff.py`:

```python
import pytest
from api.services.scout_layoff import (
    detect_layoff_intent,
    build_visa_response,
    build_severance_response,
    build_finances_response,
    build_resume_response,
    build_career_direction_response,
    build_generic_layoff_response,
    build_opening_response,
)


def _profile(**overrides):
    base = {
        'laid_off_when': '1-7d', 'role': 'engineer', 'level': 'senior',
        'company_tier': 'series_b_d', 'severance_runway': '8_16w',
        'visa_status': 'citizen_gc', 'location_flexibility': 'remote_us',
        'resume_state': 'needs_rewrite', 'network_state': 'cold_contacts',
        'top_concern': 'direction',
    }
    base.update(overrides)
    return base


@pytest.mark.unit
class TestIntentDetection:
    def test_visa_keywords_route_to_visa(self):
        assert detect_layoff_intent('what about my h-1b?', []) == 'visa'
        assert detect_layoff_intent('I have 60 days', []) == 'visa'
        assert detect_layoff_intent('grace period question', []) == 'visa'

    def test_severance_keywords_route_to_severance(self):
        assert detect_layoff_intent('how do I negotiate severance?', []) == 'severance'
        assert detect_layoff_intent('my RSU situation', []) == 'severance'
        assert detect_layoff_intent('the offer they gave me', []) == 'severance'

    def test_finances_keywords_route_to_finances(self):
        assert detect_layoff_intent('how do I file unemployment', []) == 'finances'
        assert detect_layoff_intent('COBRA is expensive', []) == 'finances'
        assert detect_layoff_intent("can I afford this on my runway", []) == 'finances'

    def test_resume_keywords_route_to_resume(self):
        assert detect_layoff_intent('should I update my resume', []) == 'resume'
        assert detect_layoff_intent('LinkedIn headline', []) == 'resume'

    def test_career_direction_keywords_route_to_career_direction(self):
        assert detect_layoff_intent('what should I do next', []) == 'career_direction'
        assert detect_layoff_intent('thinking about a pivot', []) == 'career_direction'
        assert detect_layoff_intent("don't know where I want to go", []) == 'career_direction'

    def test_unmatched_routes_to_generic(self):
        assert detect_layoff_intent('hello', []) == 'generic'
        assert detect_layoff_intent('thanks for the help', []) == 'generic'

    def test_followup_uses_recent_topic(self):
        # "tell me more" with last Scout message about visa -> stays on visa
        conv = [
            {'role': 'user', 'content': 'h-1b stuff', 'ts': 't'},
            {'role': 'scout', 'content': 'On the H-1B side: you have 60 days...', 'ts': 't'},
        ]
        assert detect_layoff_intent('tell me more', conv) == 'visa'


@pytest.mark.unit
class TestHandlers:
    def test_visa_response_mentions_60_day_rule(self):
        out = build_visa_response(_profile(visa_status='h1b', laid_off_when='today'), [])
        assert '60' in out
        assert any(s in out.lower() for s in ['h-1b', 'h1b', 'grace period'])
        # references the playbook article
        assert '/playbook/h1b-60-day-grace-period' in out

    def test_severance_response_mentions_negotiation(self):
        out = build_severance_response(_profile(), [])
        assert 'severance' in out.lower()
        assert any(s in out.lower() for s in ['negotiate', 'counter', 'rsu', 'leverage'])
        assert '/playbook/negotiate-severance-tech-layoff' in out

    def test_finances_response_mentions_unemployment_or_cobra(self):
        out = build_finances_response(_profile(severance_runway='lt_8w'), [])
        assert any(s in out.lower() for s in ['unemployment', 'cobra', 'runway', 'subscriptions'])
        assert any(s in out for s in ['/playbook/just-got-laid-off-week-1-plan', '/playbook/cobra-vs-marketplace-insurance'])

    def test_resume_response_mentions_active_search(self):
        out = build_resume_response(_profile(resume_state='needs_rewrite'), [])
        assert 'resume' in out.lower()
        assert '/playbook/linkedin-opentowork-after-layoff' in out or '/playbook/just-got-laid-off-week-1-plan' in out

    def test_career_direction_response_mentions_values_or_walk(self):
        out = build_career_direction_response(_profile(top_concern='direction'), [])
        assert any(s in out.lower() for s in ['walk', 'values', 'regret', 'love'])

    def test_handlers_personalize_on_level(self):
        out_jr = build_severance_response(_profile(level='junior'), [])
        out_sr = build_severance_response(_profile(level='senior'), [])
        # The two responses should differ (level is part of personalization)
        assert out_jr != out_sr

    def test_generic_layoff_response_is_kind_and_offers_options(self):
        out = build_generic_layoff_response(_profile(), [])
        assert len(out) > 100
        # offers structured next-step options
        assert any(s in out.lower() for s in ['visa', 'severance', 'finances', 'resume', 'direction'])

    def test_each_handler_ends_with_a_question(self):
        for fn in [build_visa_response, build_severance_response, build_finances_response,
                   build_resume_response, build_career_direction_response, build_generic_layoff_response]:
            out = fn(_profile(), [])
            assert out.rstrip().endswith('?'), f"{fn.__name__} doesn't end with a question"


@pytest.mark.unit
class TestOpeningBuilder:
    def test_opening_uses_suggested_first_topic_visa(self):
        out = build_opening_response(_profile(visa_status='h1b', laid_off_when='today'),
                                     suggested_first_topic='visa')
        assert any(s in out.lower() for s in ['h-1b', 'h1b', '60'])

    def test_opening_uses_suggested_first_topic_severance(self):
        out = build_opening_response(_profile(severance_runway='none', laid_off_when='today'),
                                     suggested_first_topic='severance')
        assert 'severance' in out.lower()

    def test_opening_acknowledges_user_situation(self):
        # First-line should reference the user's situation
        out = build_opening_response(_profile(role='engineer', level='senior'),
                                     suggested_first_topic='finances')
        assert any(s in out.lower() for s in ['senior', 'engineer'])

    def test_opening_with_no_topic_uses_generic(self):
        out = build_opening_response(_profile(), suggested_first_topic=None)
        assert len(out) > 100
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/unit/test_scout_layoff.py -v 2>&1 | tail -10
```
Expected: All tests fail with `ModuleNotFoundError: api.services.scout_layoff`.

- [ ] **Step 3: Implement the module**

Create `backend/api/services/scout_layoff.py`:

```python
"""LP2 layoff-tuned Scout handlers.

Five hand-written domain handlers (visa, severance, finances, resume,
career_direction) plus an intent detector and an opening builder. Used
only by the new /api/scout/sessions endpoints — the existing /api/scout/chat
flow still routes to backend/api/services/scout.py (general career coaching)
unchanged.

Handlers take (profile: dict, conversation: list) and return a plain-text
response (newlines for paragraph breaks; no markdown). Responses are
~3-5 paragraphs and end with a specific follow-up question to keep the
conversation moving.
"""

from __future__ import annotations


# ─── Intent detection ────────────────────────────────────────

# Keyword sets per intent. Lowercased substring matching against the
# user's last message. Order matters — visa first because 'h-1b' is more
# specific than 'next' or 'role'. Generic falls through.
INTENT_KEYWORDS = [
    ('visa', [
        'h-1b', 'h1b', '60 day', '60-day', 'grace period', 'sponsor',
        'opt', 'h-4', 'h4', 'f-1', 'f1 visa', 'visa', 'immigration',
        'ac-21', 'ac21', 'b-2', 'b2 visitor',
    ]),
    ('severance', [
        'severance', 'package', 'negotiate', 'rsu', 'restricted stock',
        'bonus', 'non-compete', 'noncompete', 'counter-offer', 'counter offer',
        'unvested', 'iso ', 'iso?', 'cobra contribution', 'outplacement',
    ]),
    ('finances', [
        'unemployment', 'file ui', 'cobra', 'savings', 'runway', '401k',
        '401(k)', 'rent', 'money', 'budget', 'subscriptions',
        "can't afford", 'health insurance', 'marketplace', 'aca',
    ]),
    ('resume', [
        'resume', 'cv', 'headline', 'linkedin profile', 'linkedin headline',
        'opentowork', 'open to work', 'profile rewrite',
    ]),
    ('career_direction', [
        'what should i do', 'what do i want', 'next role', 'pivot',
        'career', 'direction', 'burnout', 'tired of', "don't know",
        'figure out', 'thinking about', 'values',
    ]),
]


def _last_scout_topic(conversation: list) -> str | None:
    """Inspect the most recent scout message to infer prior topic."""
    for msg in reversed(conversation or []):
        if msg.get('role') != 'scout':
            continue
        text = msg.get('content', '').lower()
        for intent, kws in INTENT_KEYWORDS:
            if any(kw in text for kw in kws):
                return intent
        return None
    return None


def detect_layoff_intent(content: str, conversation: list) -> str:
    """Return one of 'visa' | 'severance' | 'finances' | 'resume' |
    'career_direction' | 'generic'."""
    text = (content or '').lower()
    for intent, kws in INTENT_KEYWORDS:
        if any(kw in text for kw in kws):
            return intent
    # Short follow-ups inherit the previous topic.
    if len(text.split()) <= 6:
        prior = _last_scout_topic(conversation)
        if prior:
            return prior
    return 'generic'


# ─── Profile label helpers ───────────────────────────────────

def _level_label(profile: dict) -> str:
    return {
        'junior': 'Junior', 'mid': 'Mid-level', 'senior': 'Senior',
        'staff_plus': 'Staff+/Director',
    }.get(profile.get('level'), '')


def _role_label(profile: dict) -> str:
    return {
        'engineer': 'engineer', 'em': 'engineering manager', 'pm': 'PM',
        'designer': 'designer', 'data': 'data professional', 'other': 'professional',
    }.get(profile.get('role'), 'professional')


def _short_runway(profile: dict) -> bool:
    return profile.get('severance_runway') in {'none', 'lt_8w'}


def _recent_layoff(profile: dict) -> bool:
    return profile.get('laid_off_when') in {'today', '1-7d', '8-30d'}


# ─── Domain handlers ─────────────────────────────────────────

def build_visa_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    role = _role_label(profile)
    visa = profile.get('visa_status', '')
    when = profile.get('laid_off_when', '')

    opening = (
        f"The H-1B 60-day rule is the most time-bound thing on your plate right now. "
        f"From your last day, you have 60 calendar days (not business days) to either "
        f"have a new H-1B petition filed on your behalf, change to a different status "
        f"(B-2, F-1, H-4), or leave the country. Day 61 starts unlawful presence — "
        f"which has long-tail consequences you genuinely don't want to deal with."
    )

    middle = (
        f"For most {level} {role}s I've seen go through this, the path that works is "
        f"AC-21 portability: a new employer files an H-1B transfer petition, and the "
        f"moment USCIS issues the receipt (not the approval — the receipt), you can "
        f"start working under that employer. Premium processing is $2,805 and gets "
        f"you to a receipt in 15 business days. If you're not in active offer "
        f"conversations by day 30, file an I-539 for B-2 visitor status as a backstop "
        f"— it stops the clock while it adjudicates."
    )

    nudge = ""
    if visa == 'h1b' and when in {'today', '1-7d'}:
        nudge = (
            "\n\nGiven you were laid off in the last week, the highest-leverage thing "
            "you can do today is two things: (1) pull your I-94, I-797 history, and "
            "any I-140 docs into one folder, and (2) book a 30-minute call with an "
            "immigration attorney this week. Most do consults for $0-200."
        )

    pointer = (
        "\n\nThe deep version of this is in the playbook — "
        "https://hyrly.ai/playbook/h1b-60-day-grace-period covers the four paths in "
        "detail (AC-21, B-2, F-1 reactivation, H-4 with EAD), what to tell recruiters, "
        "and a vetted attorney shortlist."
    )

    close = "\n\nWant me to walk through which of the four paths fits your specific situation, or would it help to talk through what to tell recruiters first?"

    return opening + "\n\n" + middle + nudge + pointer + close


def build_severance_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    short_run = _short_runway(profile)

    opening = (
        "First thing: don't sign anything for the next 48-72 hours, no matter what "
        "the deadline on the document says. The first offer is almost never the "
        "final number — companies expect counter-offers and HR usually has "
        "authority to improve the package within a defined band. About 60-70% of "
        "engineers don't counter at all, which is the asymmetry you can benefit from."
    )

    middle = (
        f"For a {level}-level package, the highest-value items to negotiate are "
        f"usually not the cash duration but the non-cash terms: RSU acceleration "
        f"through the end of the current quarter (often worth $20-80k+ at senior "
        f"levels), pro-rated bonus, COBRA contribution for 3-6 months, and an "
        f"extended post-termination ISO exercise window (default is 90 days; many "
        f"companies will extend to 7-10 years if you ask, costing them nothing). "
        f"If your package is above $20k total value, hire an employment attorney to "
        f"review for $400-800 — the ROI is typically 5-20×."
    )

    leverage = (
        "\n\nLeverage factors that meaningfully shift the package: tenure 4+ years, "
        "age 40+ (ADEA/OWBPA protection), recent FMLA or pregnancy, a group layoff "
        "of 50+ people (WARN Act exposure), unvested equity worth more than the "
        "cash offer, or anything resembling discriminatory pattern. If any of "
        "those apply, the attorney conversation isn't optional."
    )

    if short_run:
        leverage += (
            " Given runway is tight, the severance negotiation is also your single "
            "biggest cash-flow lever right now — 2-4 extra weeks plus an RSU "
            "acceleration ask is often $15-40k of real money."
        )

    pointer = (
        "\n\nThe full priority list with scripts and the 8 leverage factors is at "
        "https://hyrly.ai/playbook/negotiate-severance-tech-layoff."
    )

    close = "\n\nWant me to help draft the actual counter-offer email, or walk through which leverage factors apply to your situation first?"

    return opening + "\n\n" + middle + leverage + pointer + close


def build_finances_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    short_run = _short_runway(profile)

    opening = (
        "The cash-flow piece is the most fixable thing on your list this week. "
        "Three actions, in order: file for unemployment today (even if you have "
        "severance — weekly UI benefits stack to $5-15k over a multi-month search, "
        "and the 1-3 week processing delay means filing now maximizes the total), "
        "compare COBRA vs marketplace before electing (the default-to-COBRA mistake "
        "typically costs $5-15k over 6 months at most income brackets), and audit "
        "your recurring subscriptions ($400-900/month is the average; cutting half "
        "of that adds a full month of runway every 7 months)."
    )

    middle = (
        f"For the marketplace question specifically: the post-ARPA subsidies cap "
        f"premiums at 8.5% of your projected annual income, no 400% FPL cliff. A "
        f"{level} engineer projecting $80k-150k for the year often pays $300-600/month "
        f"on a Silver plan vs $900-1,500/month on COBRA. The exceptions where COBRA "
        f"wins are real — mid-treatment, specialty drugs, narrow networks — but "
        f"they're the exception, not the default."
    )

    runway_note = ""
    if short_run:
        runway_note = (
            "\n\nGiven runway is tight, also pull up your 401(k) — taxable brokerage "
            "and HYSA come first if you need cash, then 401(k) loans if your plan "
            "offers them. Early withdrawals are last. Don't touch tax-advantaged "
            "accounts until the cheaper options are exhausted."
        )

    pointer = (
        "\n\nThe full week-1 financial sequence is at "
        "https://hyrly.ai/playbook/just-got-laid-off-week-1-plan. The COBRA-vs-"
        "marketplace math (with three worked income-bracket examples) is at "
        "https://hyrly.ai/playbook/cobra-vs-marketplace-insurance."
    )

    close = "\n\nWant to walk through your specific runway calc together, or focus on the COBRA-vs-marketplace decision first?"

    return opening + "\n\n" + middle + runway_note + pointer + close


def build_resume_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    role = _role_label(profile)
    state = profile.get('resume_state', '')

    opening = (
        "Two things up front, both contrarian to the standard advice: (1) don't "
        "update your resume on day 1 — wait until day 5 or 6, after you've sent "
        "the first batch of warm-network DMs and have a sense of where you're "
        "aiming. The 'I need to perfect my resume before I do anything' instinct "
        "is procrastination dressed as productivity. (2) Don't enable the LinkedIn "
        f"'#OpenToWork' badge yet, especially at the {level} level — the green ring "
        "has flipped from helpful to harmful at senior+ in 2024-2026."
    )

    middle = (
        f"What to update when you do, around day 5-7: the headline should be the "
        f"role you want next, not 'in transition' or 'open to work' (recruiter "
        f"searches deprioritize those phrases). Something like '{level} {role.title()} "
        f"| AI Infra & Distributed Systems' converts much better than 'Looking for "
        f"my next opportunity 💼'. Update the About section to 2-4 sentences with "
        f"one specific call-to-action. Update the experience end-date on your last "
        f"role to the layoff date; rewrite the bullets in past tense and emphasize "
        f"shipped + measurable impact over responsibilities."
    )

    if state in {'not_started', 'unsure'}:
        middle += (
            " If you don't have a recent resume version at all, the fastest path "
            "is: paste your old one into a doc, find a JD for a role you'd want, "
            "and rewrite the top third to match its keyword profile. Don't try to "
            "perfect the whole thing in one sitting."
        )

    pointer = (
        "\n\nThe full LinkedIn protocol — what to post, when, what NOT to post, "
        "three announcement templates — is at "
        "https://hyrly.ai/playbook/linkedin-opentowork-after-layoff. The week-1 "
        "version of where resume work fits in the sequence is at "
        "https://hyrly.ai/playbook/just-got-laid-off-week-1-plan."
    )

    close = "\n\nWant a draft headline tuned to your target role, or help with the announcement post template first?"

    return opening + "\n\n" + middle + pointer + close


def build_career_direction_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    role = _role_label(profile)

    opening = (
        "The 'what do I want next' question is the one that doesn't get solved by "
        "scrolling LinkedIn. It gets solved by getting bored enough that the answer "
        "surfaces on its own — which is a real strategy, not a cop-out. The biggest "
        "mistake people make in this state is to start mass-applying out of anxiety "
        "before they've actually decided what they're applying for. Three or four "
        "weeks later they have a pile of interview rejections and still don't know "
        "what they want."
    )

    middle = (
        f"What works concretely: a 90-minute walk with a notebook, no phone, no "
        f"computer. Three questions — write down whatever surfaces, don't edit: "
        f"(1) What did I actually love about my last {level} {role} role? Specific "
        f"moments, not job titles. (2) What did I quietly dread? Specific things, "
        f"again. (3) What would I genuinely regret not trying in the next five "
        f"years? This is the one most people skip; it's the most useful."
    )

    middle += (
        "\n\nAfter the walk, the second pass is the constraints check: comp floor, "
        "geo limits, family obligations, visa timeline if relevant. Then the third "
        "pass is the must-haves vs walk-aways list — what do you absolutely need "
        "your next role to have, and what would make you walk away from an offer. "
        "Most people skip step 3 and then say yes to the first compelling-looking "
        "offer that comes in. Step 3 is what stops that."
    )

    runway_long = profile.get('severance_runway') == '16w_plus'
    if runway_long:
        middle += (
            "\n\nGood news: with 16+ weeks of runway, you actually have the "
            "freedom to do this thinking honestly. Most people don't get this "
            "window — they have to take the first reasonable offer. Use it."
        )

    close = "\n\nWant to start working through those three questions together right now, or talk through your specific must-haves and walk-aways first?"

    return opening + "\n\n" + middle + close


def build_generic_layoff_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    role = _role_label(profile)

    if conversation:
        opening = (
            "Happy to talk through whatever's on your mind right now. A few of "
            "the topics I can be most useful on:"
        )
    else:
        opening = (
            f"Hey — sorry you're dealing with this. I can help work through any "
            f"of the layoff-specific things a {level} {role} usually hits in the "
            f"first 30 days. A few I'm most useful on:"
        )

    options = (
        "\n\n• Visa timing if you're on H-1B / OPT / H-4 (the 60-day clock is the "
        "most time-bound thing on most people's list)"
        "\n• Severance negotiation (the first offer is rarely the final number)"
        "\n• Financial defense (unemployment filing, COBRA vs marketplace, runway math)"
        "\n• Resume + LinkedIn protocol (when to update, what to post, the green-ring "
        "badge trap)"
        "\n• Career direction (the 90-minute walk with three questions)"
    )

    close = "\n\nWhich one feels most pressing for you right now?"

    return opening + options + close


# ─── Opening builder ─────────────────────────────────────────

def build_opening_response(profile: dict, suggested_first_topic: str | None) -> str:
    """First message sent by Scout when a session is created from a triage.

    Routes to the appropriate domain handler based on the triage's
    suggested_first_topic. If the topic isn't set (e.g., session created
    without a triage), uses the generic greeting.
    """
    topic = suggested_first_topic or 'generic'
    routes = {
        'visa': build_visa_response,
        'severance': build_severance_response,
        'finances': build_finances_response,
        'resume': build_resume_response,
        'career_exploration': build_career_direction_response,
        'networking': build_generic_layoff_response,  # not a v1 dedicated domain
        'generic': build_generic_layoff_response,
    }
    handler = routes.get(topic, build_generic_layoff_response)
    return handler(profile, [])


# ─── Intent → handler dispatch ───────────────────────────────

def route_message(content: str, profile: dict, conversation: list) -> str:
    """Top-level entry from the message endpoint."""
    intent = detect_layoff_intent(content, conversation)
    handlers = {
        'visa': build_visa_response,
        'severance': build_severance_response,
        'finances': build_finances_response,
        'resume': build_resume_response,
        'career_direction': build_career_direction_response,
        'generic': build_generic_layoff_response,
    }
    handler = handlers.get(intent, build_generic_layoff_response)
    return handler(profile, conversation)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/unit/test_scout_layoff.py -v 2>&1 | tail -30
```
Expected: All ~20 tests PASS.

- [ ] **Step 5: Run the full backend suite to confirm no regression**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest -m "unit or integration" 2>&1 | tail -5
```
Expected: 158 (prior baseline) + ~20 (new) = ~178 passed.

- [ ] **Step 6: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add backend/api/services/scout_layoff.py backend/tests/unit/test_scout_layoff.py
git commit -m "$(cat <<'EOF'
feat(scout): layoff-tuned domain handlers + intent detection (LP2)

Five hand-written coaching domains (visa, severance, finances, resume,
career_direction) plus a generic fallback. detect_layoff_intent routes
incoming messages by keyword; short follow-ups inherit the prior topic
from conversation history. build_opening_response routes the triage's
suggested_first_topic to the right handler.

Each handler personalizes on profile (level, role, severance_runway,
visa_status, top_concern) and ends with a specific follow-up question.
Voice matches the playbook articles. Deliberately rule-based + plain
text — no LLM, no markdown — for determinism, testability, and
voice consistency.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `POST /api/scout/sessions` endpoint (TDD)

**Files:**
- Modify: `backend/api/routes/scout.py` (add new route + helper; do not touch existing routes/handlers)
- Create: `backend/tests/integration/test_scout_sessions.py`

**Context:** Endpoint accepts `{triage_id?}`, creates a row in `scout_sessions`, returns `{session_id, messages: [first_scout_msg]}`. When `triage_id` is provided, pulls the triage row, extracts the `profile` (the original answers) and `suggested_first_topic` from the plan, calls `build_opening_response(profile, suggested_first_topic)`. When `triage_id` is missing, calls `build_opening_response({}, None)` for a generic greeting.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/integration/test_scout_sessions.py`:

```python
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from api.index import app


client = TestClient(app)


TRIAGE_ROW = {
    'id': 'triage-uuid-1',
    'answers': {
        'laid_off_when': '1-7d', 'role': 'engineer', 'level': 'senior',
        'company_tier': 'series_b_d', 'severance_runway': '8_16w',
        'visa_status': 'h1b', 'location_flexibility': 'remote_us',
        'resume_state': 'needs_rewrite', 'network_state': 'cold_contacts',
        'top_concern': 'visa',
    },
    'plan': {
        'summary': "You're a Senior engineer...",
        'suggested_first_topic': 'visa',
        'actions': [{'priority': 1, 'title': 'H-1B 60-day grace period — start the clock today',
                     'why': '...', 'how': '...', 'eta': 'this week'}],
    },
}


@pytest.fixture
def patched_supabase():
    """Patches api.core.database.supabase with a chainable mock."""
    with patch('api.core.database.supabase') as sb:
        yield sb


@pytest.mark.integration
def test_create_session_with_triage_id_returns_first_scout_message(patched_supabase):
    # Mock: triage lookup
    triage_select = MagicMock()
    triage_select.execute.return_value = MagicMock(data=[TRIAGE_ROW])
    triage_eq = MagicMock()
    triage_eq.eq.return_value = triage_select
    triage_table = MagicMock()
    triage_table.select.return_value = triage_eq

    # Mock: session insert
    session_insert = MagicMock()
    session_insert.execute.return_value = MagicMock(data=[{'id': 'session-uuid-1'}])
    session_table = MagicMock()
    session_table.insert.return_value = session_insert

    patched_supabase.table.side_effect = lambda name: (
        triage_table if name == 'triage_responses' else session_table
    )

    resp = client.post('/api/scout/sessions', json={'triage_id': 'triage-uuid-1'})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body['session_id'] == 'session-uuid-1'
    assert len(body['messages']) == 1
    assert body['messages'][0]['role'] == 'scout'
    # Topic was 'visa' -> message mentions H-1B
    assert 'h-1b' in body['messages'][0]['content'].lower() or 'h1b' in body['messages'][0]['content'].lower()


@pytest.mark.integration
def test_create_session_without_triage_returns_generic_opening(patched_supabase):
    session_insert = MagicMock()
    session_insert.execute.return_value = MagicMock(data=[{'id': 'session-uuid-2'}])
    session_table = MagicMock()
    session_table.insert.return_value = session_insert

    patched_supabase.table.return_value = session_table

    resp = client.post('/api/scout/sessions', json={})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body['session_id'] == 'session-uuid-2'
    assert len(body['messages']) == 1
    assert body['messages'][0]['role'] == 'scout'
    # Generic greeting -> mentions multiple topics
    content_lower = body['messages'][0]['content'].lower()
    assert sum(t in content_lower for t in ['visa', 'severance', 'financ', 'resume', 'direction']) >= 3


@pytest.mark.integration
def test_create_session_returns_503_when_triage_lookup_fails(patched_supabase):
    triage_table = MagicMock()
    triage_table.select.side_effect = Exception('supabase down')
    patched_supabase.table.return_value = triage_table

    resp = client.post('/api/scout/sessions', json={'triage_id': 'triage-uuid-1'})
    assert resp.status_code == 503
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/integration/test_scout_sessions.py -v 2>&1 | tail -10
```
Expected: 3 tests fail with 404 (route not registered yet).

- [ ] **Step 3: Add the endpoint**

In `backend/api/routes/scout.py`, find the line `router = APIRouter(prefix="/api/scout", tags=["Scout"])` (around line 19). Below the existing imports + the `router` declaration, add:

```python
import api.core.database as _db
from api.models.schemas import (
    ScoutSessionCreateRequest,
    ScoutSessionResponse,
    ScoutSessionMessage,
)
from api.services.scout_layoff import build_opening_response, route_message
from datetime import datetime, timezone
```

(If the file already imports `datetime`, don't duplicate.)

Then at the end of the file (after all existing routes), add:

```python
def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _fetch_triage(triage_id: str) -> dict | None:
    """Returns the triage row dict, or None if not found."""
    result = (
        _db.supabase.table('triage_responses')
        .select('*')
        .eq('id', triage_id)
        .execute()
    )
    if not result.data:
        return None
    return result.data[0]


@router.post('/sessions', response_model=ScoutSessionResponse)
def create_session(req: ScoutSessionCreateRequest) -> ScoutSessionResponse:
    """Create a new Scout session, optionally seeded by a triage_id."""
    profile: dict = {}
    suggested_first_topic: str | None = None

    try:
        if req.triage_id:
            triage = _fetch_triage(req.triage_id)
            if triage:
                profile = triage.get('answers') or {}
                plan = triage.get('plan') or {}
                suggested_first_topic = plan.get('suggested_first_topic')

        opening_content = build_opening_response(profile, suggested_first_topic)
        first_msg = ScoutSessionMessage(
            role='scout', content=opening_content, ts=_now_iso(),
        )

        insert_result = (
            _db.supabase.table('scout_sessions')
            .insert({
                'user_id': None,
                'triage_id': req.triage_id,
                'messages': [first_msg.model_dump()],
            })
            .execute()
        )
        if not insert_result.data:
            raise RuntimeError('insert returned no data')

        session_id = str(insert_result.data[0]['id'])
        return ScoutSessionResponse(session_id=session_id, messages=[first_msg])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail='Scout session service temporarily unavailable.',
        ) from exc
```

(If `HTTPException` isn't already imported at the top, add `from fastapi import HTTPException` to the existing FastAPI imports.)

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/integration/test_scout_sessions.py -v 2>&1 | tail -15
```
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add backend/api/routes/scout.py backend/tests/integration/test_scout_sessions.py
git commit -m "$(cat <<'EOF'
feat(api): POST /api/scout/sessions (LP2)

Anonymous session create. Optional triage_id seeds the opening with
the user's profile + suggested_first_topic. Persists to scout_sessions
with the first scout message. Returns 503 if Supabase is unreachable.
Existing /api/scout/chat route is unchanged (backward compat for /app).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `POST /api/scout/sessions/{id}/messages` endpoint (TDD)

**Files:**
- Modify: `backend/api/routes/scout.py` (add second route)
- Modify: `backend/tests/integration/test_scout_sessions.py` (append message tests)

**Context:** Endpoint accepts `{content}`, loads the session, appends the user message, routes via `route_message(content, profile, conversation)` to get the Scout response, appends that too, persists, returns the full updated messages array.

- [ ] **Step 1: Append the failing tests**

Open `backend/tests/integration/test_scout_sessions.py` and append at the end:

```python


@pytest.mark.integration
def test_append_message_returns_full_conversation(patched_supabase):
    existing = {
        'id': 'session-uuid-1',
        'triage_id': 'triage-uuid-1',
        'messages': [
            {'role': 'scout', 'content': 'Hey, sorry you\'re dealing with this...', 'ts': 't1'},
        ],
    }

    # Mock: session select
    sess_select = MagicMock()
    sess_select.execute.return_value = MagicMock(data=[existing])
    sess_eq = MagicMock()
    sess_eq.eq.return_value = sess_select
    sess_table = MagicMock()
    sess_table.select.return_value = sess_eq

    # Mock: triage select (for profile context on follow-ups)
    triage_select = MagicMock()
    triage_select.execute.return_value = MagicMock(data=[TRIAGE_ROW])
    triage_eq = MagicMock()
    triage_eq.eq.return_value = triage_select
    triage_table_mock = MagicMock()
    triage_table_mock.select.return_value = triage_eq

    # Mock: session update
    upd_eq = MagicMock()
    upd_eq.execute.return_value = MagicMock(data=[{'id': 'session-uuid-1'}])
    upd = MagicMock()
    upd.eq.return_value = upd_eq
    sess_table.update.return_value = upd

    def _table(name):
        if name == 'scout_sessions':
            return sess_table
        if name == 'triage_responses':
            return triage_table_mock
        return MagicMock()

    patched_supabase.table.side_effect = _table

    resp = client.post(
        '/api/scout/sessions/session-uuid-1/messages',
        json={'content': 'what about severance negotiation'},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert len(body['messages']) == 3  # original scout + new user + new scout
    assert body['messages'][0]['role'] == 'scout'
    assert body['messages'][1]['role'] == 'user'
    assert body['messages'][1]['content'] == 'what about severance negotiation'
    assert body['messages'][2]['role'] == 'scout'
    # Severance keyword -> severance handler
    assert 'severance' in body['messages'][2]['content'].lower()


@pytest.mark.integration
def test_append_message_returns_404_for_unknown_session(patched_supabase):
    sess_select = MagicMock()
    sess_select.execute.return_value = MagicMock(data=[])
    sess_eq = MagicMock()
    sess_eq.eq.return_value = sess_select
    sess_table = MagicMock()
    sess_table.select.return_value = sess_eq

    patched_supabase.table.return_value = sess_table

    resp = client.post(
        '/api/scout/sessions/missing-session/messages',
        json={'content': 'hello'},
    )
    assert resp.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/integration/test_scout_sessions.py::test_append_message_returns_full_conversation tests/integration/test_scout_sessions.py::test_append_message_returns_404_for_unknown_session -v 2>&1 | tail -10
```
Expected: both fail with 404 / route not found.

- [ ] **Step 3: Add the endpoint**

In `backend/api/routes/scout.py`, immediately after the `create_session` function from Task 4, append:

```python
def _fetch_session(session_id: str) -> dict | None:
    result = (
        _db.supabase.table('scout_sessions')
        .select('*')
        .eq('id', session_id)
        .execute()
    )
    if not result.data:
        return None
    return result.data[0]


@router.post('/sessions/{session_id}/messages', response_model=ScoutSessionResponse)
def append_message(
    session_id: str, req: ScoutSessionMessageRequest,
) -> ScoutSessionResponse:
    """Append a user message and the Scout response to an existing session."""
    try:
        session = _fetch_session(session_id)
        if session is None:
            raise HTTPException(status_code=404, detail='Session not found.')

        messages: list[dict] = list(session.get('messages') or [])

        # Pull triage profile for follow-up context, if any.
        profile: dict = {}
        triage_id = session.get('triage_id')
        if triage_id:
            triage = _fetch_triage(triage_id)
            if triage:
                profile = triage.get('answers') or {}

        # Append user message.
        user_msg = ScoutSessionMessage(
            role='user', content=req.content, ts=_now_iso(),
        )
        messages.append(user_msg.model_dump())

        # Route + compose Scout response.
        scout_content = route_message(req.content, profile, messages)
        scout_msg = ScoutSessionMessage(
            role='scout', content=scout_content, ts=_now_iso(),
        )
        messages.append(scout_msg.model_dump())

        # Persist.
        (
            _db.supabase.table('scout_sessions')
            .update({'messages': messages, 'updated_at': _now_iso()})
            .eq('id', session_id)
            .execute()
        )

        # Return as ScoutSessionMessage list.
        return ScoutSessionResponse(
            session_id=session_id,
            messages=[ScoutSessionMessage(**m) for m in messages],
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail='Scout session service temporarily unavailable.',
        ) from exc
```

- [ ] **Step 4: Run all tests**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest tests/integration/test_scout_sessions.py -v 2>&1 | tail -15
```
Expected: 5 PASS.

Then full suite:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && python -m pytest -m "unit or integration" 2>&1 | tail -5
```
Expected: ~183 passed (158 baseline + ~20 unit + 5 integration).

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add backend/api/routes/scout.py backend/tests/integration/test_scout_sessions.py
git commit -m "$(cat <<'EOF'
feat(api): POST /api/scout/sessions/{id}/messages (LP2)

Continues a Scout conversation. Loads session, pulls triage profile if
linked, appends user message, routes via detect_layoff_intent, appends
scout response, persists, returns full updated messages array. 404 if
session not found; 503 on Supabase failures.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Frontend `api.js` extensions

**Files:**
- Modify: `frontend/src/api.js`

**Context:** Two new methods, drop them in the same `// ─── Triage (LP1) ─────` section. `createScoutSession(triageId)` posts to `/api/scout/sessions`. `sendScoutMessage(sessionId, content)` posts to `/api/scout/sessions/{id}/messages`. Keep the older `startScoutWithContext` method around — `/app` may still call it.

- [ ] **Step 1: Locate the Triage section**

In `frontend/src/api.js`, find the `async startScoutWithContext({ summary, suggestedFirstTopic })` method (around line 85). After its closing `}` and before the `// ─── Seeker ───` comment, the file already has the Triage section header. Append the two new methods just before the Seeker section starts.

- [ ] **Step 2: Append the two methods**

In `frontend/src/api.js`, immediately after the closing `}` of `startScoutWithContext` and before `// ─── Seeker ───`, add:

```js

  async createScoutSession(triageId) {
    return this._fetch('/api/scout/sessions', {
      method: 'POST',
      body: JSON.stringify({ triage_id: triageId || null }),
    });
  }

  async sendScoutMessage(sessionId, content) {
    return this._fetch(`/api/scout/sessions/${encodeURIComponent(sessionId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
```

- [ ] **Step 3: Run tests**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test 2>&1 | tail -6
```
Expected: PASS — 51/51 (no new tests; existing pass).

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/api.js
git commit -m "$(cat <<'EOF'
feat(api): createScoutSession + sendScoutMessage client helpers (LP2)

Two methods on HyrlyAPI for the new /api/scout/sessions endpoint pair.
createScoutSession(triageId) starts a new session optionally seeded
by a triage; sendScoutMessage(sessionId, content) appends a user
message and returns the updated conversation. startScoutWithContext
stays in place for backward compat.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: `ScoutChat.jsx` component (TDD)

**Files:**
- Create: `frontend/src/features/scout/ScoutChat.jsx`
- Create: `frontend/src/features/scout/ScoutChat.test.jsx`

**Context:** Chat UI. Props: `messages` (array), `onSendMessage` (callback async function called with the text), `isThinking` (boolean — Scout is composing). Renders message list (scout messages left-aligned, user right-aligned), text input at bottom, send button. Empty input is disabled. Enter sends. While `isThinking`, the input is disabled and a "Scout is thinking…" indicator shows.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/scout/ScoutChat.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoutChat } from './ScoutChat';

const SAMPLE_MESSAGES = [
  { role: 'scout', content: 'Hey, sorry you\'re dealing with this. What\'s most pressing?', ts: '2026-05-20T10:00:00Z' },
  { role: 'user', content: 'my visa', ts: '2026-05-20T10:01:00Z' },
  { role: 'scout', content: 'On the H-1B side: 60 days from your last day...', ts: '2026-05-20T10:01:30Z' },
];

describe('ScoutChat', () => {
  it('renders every message in order', () => {
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={() => {}} isThinking={false} />);
    expect(screen.getByText(/sorry you're dealing with this/i)).toBeInTheDocument();
    expect(screen.getByText(/my visa/i)).toBeInTheDocument();
    expect(screen.getByText(/On the H-1B side/i)).toBeInTheDocument();
  });

  it('calls onSendMessage when send is clicked', () => {
    const onSendMessage = vi.fn();
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={onSendMessage} isThinking={false} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    fireEvent.change(input, { target: { value: 'tell me more about AC-21' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSendMessage).toHaveBeenCalledWith('tell me more about AC-21');
  });

  it('disables send when input is empty', () => {
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={() => {}} isThinking={false} />);
    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
  });

  it('disables input + shows indicator while thinking', () => {
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={() => {}} isThinking={true} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    expect(input).toBeDisabled();
    expect(screen.getByText(/scout is thinking/i)).toBeInTheDocument();
  });

  it('clears input after sending', () => {
    const onSendMessage = vi.fn();
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={onSendMessage} isThinking={false} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    fireEvent.change(input, { target: { value: 'a question' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(input.value).toBe('');
  });

  it('sends on Enter key in input', () => {
    const onSendMessage = vi.fn();
    render(<ScoutChat messages={SAMPLE_MESSAGES} onSendMessage={onSendMessage} isThinking={false} />);
    const input = screen.getByPlaceholderText(/ask Scout/i);
    fireEvent.change(input, { target: { value: 'enter test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSendMessage).toHaveBeenCalledWith('enter test');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- ScoutChat 2>&1 | tail -10
```
Expected: FAIL — cannot resolve `./ScoutChat`.

- [ ] **Step 3: Implement the component**

Create `frontend/src/features/scout/ScoutChat.jsx`:

```jsx
import { useState } from 'react';

export function ScoutChat({ messages, onSendMessage, isThinking }) {
  const [draft, setDraft] = useState('');
  const canSend = draft.trim().length > 0 && !isThinking;

  function handleSend() {
    if (!canSend) return;
    const text = draft.trim();
    setDraft('');
    onSendMessage(text);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', padding: '24px 24px 32px',
      display: 'flex', flexDirection: 'column', minHeight: '70vh',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.role === 'user' ? 'var(--ink)' : 'white',
              color: m.role === 'user' ? 'white' : 'var(--text-primary)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              borderRadius: 16,
              padding: '14px 18px',
              fontSize: 15,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {m.content}
          </div>
        ))}
        {isThinking && (
          <div style={{
            alignSelf: 'flex-start', fontSize: 13, color: 'var(--text-muted)',
            fontStyle: 'italic', padding: '4px 8px',
          }}>
            Scout is thinking…
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        background: 'white', borderRadius: 16, padding: 8,
        border: '1px solid var(--border)',
      }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isThinking}
          placeholder="Ask Scout anything — visa, severance, finances, resume, what's next…"
          rows={1}
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            padding: '10px 12px', fontSize: 15, fontFamily: 'inherit',
            background: 'transparent', color: 'var(--ink)',
            minHeight: 24, maxHeight: 120,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send"
          style={{
            background: canSend ? 'var(--ink)' : 'var(--border)',
            color: 'white', border: 'none', borderRadius: 12,
            padding: '10px 18px', fontSize: 14, fontWeight: 700,
            cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >Send</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- ScoutChat 2>&1 | tail -10
```
Expected: PASS — 6/6.

- [ ] **Step 5: Run full frontend suite**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test 2>&1 | tail -6
```
Expected: PASS — 51 baseline + 6 new = 57.

- [ ] **Step 6: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/features/scout/ScoutChat.jsx frontend/src/features/scout/ScoutChat.test.jsx
git commit -m "$(cat <<'EOF'
feat(scout): ScoutChat chat UI component (LP2)

iMessage-style conversation view. Props: messages, onSendMessage,
isThinking. User messages right-aligned (ink), scout messages
left-aligned (white-on-cream). Textarea input at bottom; send button
disabled when empty or while Scout is composing. Enter sends. Empty
state shows just the input (no leading scout welcome — that comes
from the create-session response).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Integrate `ScoutChat` into the homepage state machine

**Files:**
- Modify: `frontend/pages/index/+Page.jsx` (replace the current single-reply `'scout'` stage with `ScoutChat`)

**Context:** Currently the `'scout'` stage shows one Scout reply and dead-ends. Replace it with `ScoutChat`. Track `sessionId`, `messages`, and `isThinking` as state. On `handleStartScout`, call `createScoutSession(triageId)`, store the returned session_id + messages, transition to `'scout'`. Inside `ScoutChat`'s `onSendMessage`, call `sendScoutMessage(sessionId, content)`, then update `messages` with the response.

Important: we also need to thread the `triage_id` from the triage POST response through to the Scout session create. Currently `submitTriage` returns `{triage_id, plan}` but the page only stores `plan`. Need to also store `triage_id`.

- [ ] **Step 1: Rewrite the homepage**

Open `frontend/pages/index/+Page.jsx` and replace the **entire file** with:

```jsx
import { useState } from 'react';
import GlobalStyles from '../../src/styles/GlobalStyles';
import PublicNav from '../../src/components/PublicNav';
import { TriageWizard } from '../../src/features/triage/TriageWizard';
import { TriagePlan } from '../../src/features/triage/TriagePlan';
import { ScoutChat } from '../../src/features/scout/ScoutChat';
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
  const [triageId, setTriageId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);

  async function handleWizardComplete(answers) {
    setStage('submitting');
    setError(null);
    try {
      const resp = await api.submitTriage(answers);
      setTriageId(resp.triage_id);
      setPlan(resp.plan);
      setStage('plan');
    } catch (err) {
      setError(err.message || 'Submission failed');
      setStage('hero');
    }
  }

  async function handleStartScout() {
    setStage('submitting');
    setError(null);
    try {
      const resp = await api.createScoutSession(triageId);
      setSessionId(resp.session_id);
      setMessages(resp.messages);
      setStage('scout');
    } catch (err) {
      setError(err.message || 'Scout request failed');
      setStage('plan');
    }
  }

  async function handleSendScoutMessage(content) {
    setIsThinking(true);
    setError(null);
    // Optimistic add of the user message
    const optimistic = [
      ...messages,
      { role: 'user', content, ts: new Date().toISOString() },
    ];
    setMessages(optimistic);
    try {
      const resp = await api.sendScoutMessage(sessionId, content);
      setMessages(resp.messages);
    } catch (err) {
      setError(err.message || 'Scout reply failed');
      // Roll back the optimistic update
      setMessages(messages);
    } finally {
      setIsThinking(false);
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
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
            Built by an engineer who's been on the other side of these layoffs.
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

      {stage === 'scout' && (
        <>
          <ScoutChat
            messages={messages}
            onSendMessage={handleSendScoutMessage}
            isThinking={isThinking}
          />
          {error && (
            <p style={{ textAlign: 'center', color: 'var(--coral)', fontSize: 14 }}>{error}</p>
          )}
        </>
      )}
    </div>
  );
}
```

Key changes from the previous version:
- Added `triageId`, `sessionId`, `messages`, `isThinking` state.
- `handleWizardComplete` now stores `resp.triage_id`.
- `handleStartScout` now takes no args (was `(p)` previously; the plan-passing was a vestige) and calls `createScoutSession(triageId)` instead of `startScoutWithContext`.
- New `handleSendScoutMessage` for the follow-up messages, with optimistic UI + rollback on error.
- `'scout'` stage renders `ScoutChat` instead of the single-reply panel.

Note: `TriagePlan`'s `onStartScout` callback signature in the old code was `onStartScout(plan)` — the plan object was passed. The new `handleStartScout()` ignores that argument (we have `triageId` already in state). That's a non-breaking change for `TriagePlan`.

- [ ] **Step 2: Run frontend tests**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test 2>&1 | tail -6
```
Expected: PASS — 57/57.

- [ ] **Step 3: Sanity-build**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && rm -rf .vercel/output dist && VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod 2>&1 | tail -10
```
Expected: build succeeds; "Sitemaps written" reports counts.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/pages/index/+Page.jsx
git commit -m "$(cat <<'EOF'
feat(home): wire Scout chat continuation into homepage state machine (LP2)

After the user clicks Talk-to-Scout on the plan page, the homepage now
opens a real conversation: createScoutSession(triageId) produces the
first Scout message; subsequent user messages route through
sendScoutMessage(sessionId, content). State: triageId, sessionId,
messages, isThinking. Optimistic UI on send; rollback on error.

The previous one-shot reply panel is replaced by ScoutChat. The hero,
wizard, submitting, and plan stages are unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Deploy + smoke-test

**Files:** none modified — deploy task.

- [ ] **Step 1: Apply the Supabase migration**

Open the Supabase SQL Editor for the hireflow project. Paste the contents of `backend/supabase/migrations/009_scout_sessions.sql` and Run. Verify in the Table Editor: `scout_sessions` exists with columns `id`, `user_id`, `triage_id`, `messages`, `created_at`, `updated_at`. RLS enabled with no public policies.

- [ ] **Step 2: Deploy the backend**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/backend && vercel --prod --yes 2>&1 | tail -5
```
Expected: `readyState: READY`.

Smoke the create endpoint:
```bash
node -e "fetch('https://hireflow-api.vercel.app/api/scout/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})}).then(r=>r.json()).then(b=>{console.log('session_id:',b.session_id);console.log('first_msg_role:',b.messages?.[0]?.role);console.log('first_msg_starts:',(b.messages?.[0]?.content||'').slice(0,60))})"
```
Expected: a real UUID + `role: 'scout'` + the generic-greeting opening text.

- [ ] **Step 3: Push, then deploy the frontend**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow && git push origin main 2>&1 | tail -3
```

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && rm -rf .vercel/output dist && VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod 2>&1 | tail -5 && vercel deploy --prebuilt --prod --yes 2>&1 | tail -3
```
Expected: build succeeds + deploy ready.

- [ ] **Step 4: End-to-end live smoke**

```bash
node -e "(async()=>{const triagePayload={laid_off_when:'today',role:'engineer',level:'senior',company_tier:'series_b_d',severance_runway:'none',visa_status:'h1b',location_flexibility:'remote_us',resume_state:'needs_rewrite',network_state:'cold_contacts',top_concern:'visa'};const t=await fetch('https://hireflow-api.vercel.app/api/triage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(triagePayload)}).then(r=>r.json());console.log('triage_id:',t.triage_id);const s=await fetch('https://hireflow-api.vercel.app/api/scout/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({triage_id:t.triage_id})}).then(r=>r.json());console.log('session_id:',s.session_id,'first_msg_topic_correct:',s.messages[0].content.toLowerCase().includes('h-1b')||s.messages[0].content.toLowerCase().includes('h1b'));const r=await fetch('https://hireflow-api.vercel.app/api/scout/sessions/'+s.session_id+'/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:'what about severance though'})}).then(r=>r.json());console.log('msg_count:',r.messages.length,'last_role:',r.messages[r.messages.length-1].role,'pivoted_to_severance:',r.messages[r.messages.length-1].content.toLowerCase().includes('severance'))})()"
```
Expected: triage_id present, session_id present, first message mentions H-1B (the topic was 'visa'), second user message about severance gets a reply that pivots to severance.

- [ ] **Step 5: Homepage smoke**

```bash
node -e "fetch('https://hyrly.ai/').then(r=>r.text()).then(t=>console.log('home-still-works:',t.includes('Just got laid off')))"
```
Expected: `true`.

---

## Self-Review Notes

**Spec coverage** (`docs/superpowers/specs/2026-05-20-hyrly-lp2-scout-hardening-design.md`):

- §3.1 Chat-UI continuation → ✅ Tasks 7 + 8
- §3.2 `scout_sessions` Supabase table → ✅ Task 1
- §3.3 New endpoint pair → ✅ Tasks 4 + 5
- §3.4 Five layoff-tuned domain handlers → ✅ Task 3
- §3.5 Layoff-tuned intent detection → ✅ Task 3
- §4 Scope OUT (LLM, full 13 domains, streaming, markdown, etc.) — explicitly NOT addressed by any task ✓
- §7 Success metrics — measured manually post-ship, not implemented as code

**Placeholder scan:** No "TBD" / "implement later" / "fill in details" / "add appropriate error handling" patterns. Every step has full code or full command. Each handler has its actual prose written.

**Type/name consistency:**
- `ScoutSessionMessage` (Pydantic) ↔ `{role, content, ts}` shape used in JSON-LD persistence + frontend ✓
- `triage_id` column (snake_case) ↔ `triageId` JS variable (camelCase) ↔ `triage_id` JSON field ✓
- `detect_layoff_intent` / `build_*_response` / `build_opening_response` / `route_message` exports all consistent across Task 3 module + Task 4/5 endpoint calls ✓
- `getArticles`/`getArticleBySlug` (playbook loader, prior plan) untouched
- `route_message` exists in scout_layoff.py; called from `append_message` route in scout.py
- `suggested_first_topic` values from triage (`'visa', 'severance', 'finances', 'resume', 'career_exploration', 'networking'`) consistent with the route-dispatch map in `build_opening_response` ✓

**Open follow-ups for subsequent commits (NOT this plan):**

- LP2 v2 — networking domain handler (currently routes to generic), interview prep, markdown rendering in Scout responses, streaming, session persistence across refresh.
- LP3 — gating + Stripe.
- A separate "make every Scout message renderable as Markdown" task once LLM augmentation lands.
