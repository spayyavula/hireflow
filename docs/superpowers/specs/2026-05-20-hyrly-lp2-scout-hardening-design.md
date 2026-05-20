# Hyrly LP2 — Scout AI Hardening for the Layoff ICP

> **Status:** Spec. MVP scope distilled 2026-05-20 for a 1-week ship aimed at
> the next Claude.ai review.
>
> Parent spec: [`docs/superpowers/specs/2026-05-20-hyrly-layoff-pivot-design.md`](2026-05-20-hyrly-layoff-pivot-design.md)
> Predecessors: LP0+LP1 (homepage = Triage), LP1.5 (trust line + OG), Playbook v1 (5 articles live)

---

## 1. Why hardening Scout now

The current homepage funnel converts triage completions into Scout AI sessions, but Scout's first response is the only response the user sees — there is no continuation UI — and the underlying handlers in `backend/api/routes/scout.py` are written for general career coaching, not for someone in week 1 of a layoff. A Claude.ai reviewer trying the flow today would notice three things immediately:

1. The Scout reply renders, the page falls dead, and there's no input box for follow-up.
2. The Scout responses use general career-coaching framing ("Let's talk about what you're looking for in your next role!") that's a tonal mismatch for a grief-stricken laid-off engineer reading at 11pm.
3. Refreshing the page or coming back tomorrow loses the session entirely.

LP2-MVP fixes all three to the point that the next external review can productively focus on response *quality* and *coverage* rather than UI gaps and tone misfires.

## 2. ICP coverage

Same ICP as the broader Layoff Pivot — **US tech laid-off engineers in their first 30–90 days post-layoff** — entering Scout via the Triage handoff from `hyrly.ai/`. Users arrive with the triage-generated context (their role, level, severance runway, visa status, top concern, etc.) and a `suggested_first_topic` that's one of: `visa`, `severance`, `finances`, `resume`, `career_exploration`, `networking`.

LP2-MVP covers the **first five** of these (visa, severance, finances, resume, career_exploration) as dedicated layoff-tuned domains. The sixth (networking) and `interview_prep` (covered by Hyrly's existing Interview Bot product) are explicitly deferred to LP2 v2.

## 3. Scope (in)

Five things:

### 3.1 Chat-UI continuation on `pages/index/+Page.jsx`

The homepage `'scout'` stage currently renders one Scout reply and stops. Replace with a scrolling chat view: message list (user + Scout messages in alternating cards), text input at bottom, send button, "thinking…" indicator while the API call is in flight. State held in a single `messages` array; session id held in state. No localStorage persistence (refresh starts new session — acceptable for v1).

### 3.2 `scout_sessions` Supabase table

```sql
CREATE TABLE scout_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  triage_id     UUID REFERENCES triage_responses(id) ON DELETE SET NULL,
  messages      JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

`messages` is an array of `{role: 'user' | 'scout', content: str, ts: ISO8601}`. `triage_id` links back to the triage that started the session, used by the opening-message generator to pull context. Anonymous sessions allowed (both `user_id` and `triage_id` nullable). RLS-locked to service-role-only access (same pattern as `triage_responses`).

### 3.3 New endpoint pair

- `POST /api/scout/sessions` — body `{triage_id?}`. Creates a session, pulls triage context if provided, runs the layoff-tuned opening generator, persists, returns `{session_id, messages: [first_scout_msg]}`.
- `POST /api/scout/sessions/{id}/messages` — body `{content}`. Appends user message, runs the layoff-tuned intent detector + handler, persists, returns `{messages: full_array}`.

The existing `POST /api/scout/chat` stays in place for backward compat (the `/app` authenticated experience still uses it). LP2-MVP routes the homepage-triage flow through the new endpoints exclusively.

### 3.4 Five layoff-tuned domain handlers

In `backend/api/services/scout_layoff.py` (new file — keeps the existing `scout.py` handlers untouched), implement:

- `build_visa_response(profile, conversation)` — H-1B 60-day clock, AC-21 portability, the four status-change paths. References the corresponding playbook article.
- `build_severance_response(profile, conversation)` — what's negotiable in priority order, the 48-72h non-signing window, leverage factors. Links to the severance playbook article.
- `build_finances_response(profile, conversation)` — UI filing this week, subscription audit, runway math, 401k as last resort. Links to the COBRA + week-1 articles.
- `build_resume_response(profile, conversation)` — the active-search rewrite, headline updates, when to start (day 5+, not day 1). Voice that matches the LinkedIn playbook article.
- `build_career_direction_response(profile, conversation)` — values exercise, walk-and-think, the "what would I regret not trying" framing.

Each handler produces 3–5 paragraphs of layoff-aware coaching in the playbook's voice. Each ends with one specific concrete suggestion (file UI today, do the walk this weekend, etc.) and one explicit "want to go deeper on X?" follow-up question that keeps the conversation moving.

### 3.5 Layoff-tuned intent detection

`detect_layoff_intent(content, conversation_history)` in the same file. Routes incoming messages to one of the five handlers above, or to a fallback `build_generic_layoff_response`. Pattern-matches on:

- Visa keywords: "h-1b", "visa", "60 day", "grace period", "sponsor", "opt", "h-4", "f-1"
- Severance: "severance", "package", "negotiate", "rsu", "rs", "bonus", "non-compete"
- Finances: "unemployment", "ui", "cobra", "savings", "runway", "401k", "money", "rent"
- Resume: "resume", "cv", "headline", "linkedin profile"
- Career direction: "what should i do", "next role", "career", "pivot", "direction", "burnout"

Falls back to the general handler if no clear match. Uses the LAST user message + the most recent handler topic from `conversation_history` (so "tell me more" continues the prior topic).

## 4. Scope (out — deferred to LP2 v2 or later)

- **Networking domain handler** (warm DMs, the 30-person list). The playbook's week-1 article + LinkedIn article cover this in writing; Scout's response is fine to fall back to the playbook for now.
- **Interview prep domain handler** — Hyrly has a separate Interview Bot product; the right move is to *route* layoff-coming Scout users to that product, not duplicate it.
- **Full 13 domains** — only 5 in this MVP. The other 8 (emotional regulation, family conversations, leadership prep, freelance, etc.) come in LP2 v2 if the first 5 prove valuable.
- **LLM-driven response generation** — current handlers are rule-based hand-written copy. LLM augmentation is a v2 question (cost, latency, quality variance, prompt engineering all need separate decisions).
- **Conversation memory across sessions** — each refresh starts a new session in v1. Persistent "your last conversation with Scout was…" continuity is v2.
- **User authentication** — sessions are anonymous, tied only by `session_id` in client state. Logged-in users get the same flow; persistent identity is v2.
- **Streaming responses** — full response returns synchronously. No SSE / chunked streaming in v1.
- **Markdown formatting in responses** — responses are plain text + line breaks. Rich formatting (bold, lists, links) in Scout messages comes in v2.
- **Voice input/output** — out of scope.

## 5. Architecture

**File layout (new):**

```
backend/
├── api/
│   ├── routes/
│   │   └── scout.py                          (modified: add new /sessions endpoints)
│   ├── services/
│   │   ├── scout.py                          (unchanged: existing handlers)
│   │   └── scout_layoff.py                   (NEW: 5 handlers + intent + opening)
│   └── models/
│       └── schemas.py                        (append ScoutSession, ScoutMessage shapes)
├── supabase/
│   └── migrations/
│       └── 009_scout_sessions.sql            (NEW)
└── tests/
    ├── unit/
    │   └── test_scout_layoff.py              (handler + intent tests)
    └── integration/
        └── test_scout_sessions.py            (endpoint tests)

frontend/
├── src/
│   ├── features/
│   │   └── scout/
│   │       ├── ScoutChat.jsx                 (NEW: chat UI)
│   │       └── ScoutChat.test.jsx
│   └── api.js                                (extend: createScoutSession, sendScoutMessage)
└── pages/
    └── index/
        └── +Page.jsx                         (modified: render ScoutChat in 'scout' stage)
```

**Data flow:**

```
Triage complete  ->  POST /api/scout/sessions {triage_id}
                     │
                     ├─ backend: fetch triage row from triage_responses
                     ├─ backend: pick handler by triage.plan.suggested_first_topic
                     ├─ backend: handler(profile=triage_answers, conversation=[])
                     ├─ backend: persist session with first scout msg
                     └─ return {session_id, messages: [scout_msg]}

User sends msg   ->  POST /api/scout/sessions/{id}/messages {content}
                     │
                     ├─ backend: load session
                     ├─ backend: append user msg to messages
                     ├─ backend: detect_layoff_intent(content, messages)
                     ├─ backend: handler(profile=triage_answers, conversation=messages)
                     ├─ backend: append scout msg, persist
                     └─ return {messages: [...full array]}
```

## 6. Decisions

**Q: Why a new endpoint pair instead of extending `/api/scout/chat`?**
A: `scout.py:chat` is the back-channel for the authenticated `/app` flow; adding session semantics there couples two unrelated lifecycles. New pair = clean separation, no regression risk.

**Q: Why rule-based handlers instead of LLM?**
A: Five reasons, in order: (1) deterministic = testable; (2) zero per-message cost; (3) zero latency variance; (4) voice consistency (hand-written copy reads like the playbook articles, LLM-generated would drift); (5) shipping faster matters more than response variety at this stage. LLM augmentation is a clean v2 add.

**Q: Why no markdown/rich formatting in Scout responses?**
A: Time-box. Adds a frontend renderer + a backend formatter + tests. Plain text + line breaks reads fine for 3–5 paragraphs. v2.

**Q: Why anonymous sessions (no auth)?**
A: The homepage flow is anonymous through the triage; gating Scout behind signup would torpedo the conversion rate. v2 can add "save your conversation — sign up to come back" as an optional path.

**Q: How does `+Page.jsx` know the `session_id` across renders?**
A: React state only. Refresh loses it. v1 acceptable; v2 could put it in URL or localStorage.

**Q: What's the failure mode if the layoff handler fires on a non-layoff user?**
A: The new endpoints (`/api/scout/sessions`) are only invoked from the homepage triage flow. The `/app` flow still uses the old `/api/scout/chat` endpoint with the old handlers. No cross-contamination.

## 7. Success metrics (measured manually post-ship for the Claude.ai review)

- **Chat continuation works** — at least 5 message exchanges in a session without UI breakage
- **Triage→Scout context flows** — first Scout message references the user's specific situation (role/level/severance/concern) rather than generic copy
- **Five domain handlers produce useful responses** — sampling each of the 5 topics with a few different triage contexts produces tonally consistent, layoff-aware coaching that wouldn't be embarrassing in a Claude.ai review
- **Session persists across messages** — the `scout_sessions` row accumulates the full conversation; not lost between requests

## 8. Open questions deferred to plan

- Exact wording of each domain handler's opening + follow-up question (drafted inline in plan tasks)
- Whether the chat UI auto-scrolls to bottom on new message (default: yes)
- Whether to show timestamps on each message (default: no for v1; reduces clutter)
- How many recent messages to pass into the intent detector (default: last 3)
- Whether the homepage state machine adds a 'session' stage between 'plan' and 'scout', or whether 'scout' just renders ScoutChat (default: the latter — simpler)

These get resolved inline in the plan; not spec blockers.
