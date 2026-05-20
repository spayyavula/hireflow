# Hyrly Playbook — Strategic + Architecture Design

> **Status:** Spec. Distilled 2026-05-20 from a follow-up review of the
> live homepage and the strategic priority ranking that emerged. Source
> of truth for the Playbook sub-project (a slice of LP4-Distribution from
> the parent Layoff Pivot spec).
>
> Parent spec: [`docs/superpowers/specs/2026-05-20-hyrly-layoff-pivot-design.md`](2026-05-20-hyrly-layoff-pivot-design.md)

---

## 1. Why a playbook (and why now)

The live homepage at hyrly.ai/ converts an already-laid-off engineer into a
triage user with high efficiency, but it depends on the visitor *already
knowing about Hyrly*. That visitor doesn't exist in meaningful volume yet —
distribution is the bottleneck, not the funnel.

The two highest-leverage acquisition channels for the Layoff ICP are:

- **High-intent Google search** ("h1b layoff 60 days", "tech severance
  negotiation", "cobra vs marketplace after layoff", "open to work when") —
  these queries already get millions of searches per month, performed by
  exactly our ICP at exactly the moment Scout AI is most useful.
- **AI-engine citation** — ChatGPT / Claude / Perplexity preferentially
  cite long-form authoritative content when answering layoff queries. This
  is a *new* distribution channel (post-2024) with winner-take-most
  dynamics: the first 5–10 authoritative sources on a topic get cited
  consistently; the rest disappear.

A static homepage cannot rank for either. A library of deeply-written
playbook articles can rank for both, and *the same content* serves both
channels simultaneously. Each article is a paid-in-words acquisition
asset that compounds.

## 2. ICP coverage

Playbook content targets the same ICP as the homepage — **US tech laid-off
engineers in their first 30–90 days post-layoff** — but explicitly serves
the moments the homepage can't:

| Visitor state | Homepage handles? | Playbook serves |
|---|---|---|
| "I know what to do, just need help executing" | ✅ Triage | n/a |
| "I'm panicking and don't know where to start" | ✅ Triage hero converts this | Pre-conversion: Google query → article → triage |
| "I have one specific question (severance / visa / health)" | ❌ Wrong shape | ✅ Each article targets one query |
| "AI engine cited Hyrly while I was researching" | ❌ Need source content first | ✅ Articles are the citation source |
| "Someone shared an article with me" | ❌ Article doesn't exist | ✅ Shareable links |

## 3. Five v1 articles

Each article targets a specific high-intent query cluster, runs 1000–1800
words, ends with a hand-off CTA to the homepage triage, and includes
Article JSON-LD for SEO + AI-citation eligibility.

### 3.1 `just-got-laid-off-week-1-plan` — the catch-all

- **Target queries:** "just got laid off what to do", "first week after
  being laid off", "tech layoff plan", "got laid off from tech job"
- **Hook:** the 7-day priority order, written from a 2026-aware
  perspective (mass layoffs, RTO mandates, AI-driven hiring slowdowns)
- **Internal links:** all four other articles + homepage triage
- **Outline:** Day 0 (severance + benefits), Day 1 (file UI + COBRA
  countdown), Days 2-3 (network reactivation), Days 4-7 (resume + Scout
  exploration session), what NOT to do in week 1

### 3.2 `h1b-60-day-grace-period` — the highest-stakes niche

- **Target queries:** "h1b 60 day grace period", "h1b laid off what to do",
  "h1b sponsor change after layoff", "h1b grace period extension"
- **Hook:** the day-by-day countdown framing with explicit decision points
- **Internal links:** Scout AI session prompt, homepage triage, immigration
  attorney directory
- **Why this one ships first:** highest urgency for the visitor, most
  underserved niche (general layoff sites barely mention it), most
  defensible against AI-engine citation crowding
- **Outline:** the 60-day rule explained, what counts as a status change,
  H-1B transfer mechanics + premium processing, change of status to B-2
  visitor, F-1 reactivation, H-4 spouse-dependent options, what employers
  need to know about your timeline, attorney shortlist

### 3.3 `negotiate-severance-tech-layoff` — money on the table

- **Target queries:** "tech severance negotiation", "how to negotiate
  severance", "is my severance fair", "severance pay tech"
- **Hook:** "the first offer is never the final number"
- **Internal links:** week-1 plan, employment attorney lookup
- **Outline:** the standard package by company tier, what's actually
  negotiable (weeks, RSU acceleration, COBRA contribution, outplacement
  budget), counter-offer scripts, when to hire an attorney ($20k+ packages)

### 3.4 `cobra-vs-marketplace-insurance` — the panic financial decision

- **Target queries:** "cobra vs marketplace after layoff", "health
  insurance after being laid off", "aca after layoff", "cobra cost tech
  layoff"
- **Hook:** the actual math (most people overestimate COBRA, underestimate
  marketplace subsidies)
- **Internal links:** week-1 plan
- **Outline:** how COBRA pricing works, marketplace subsidies for laid-off
  income brackets, the special-enrollment-period 60-day window, when
  COBRA actually wins (mid-treatment, specific drugs, narrow networks),
  state-by-state alternatives (NY, CA, MA differences)

### 3.5 `linkedin-opentowork-after-layoff` — the social-protocol question

- **Target queries:** "when to post open to work", "linkedin open to work
  badge", "should i post about being laid off", "linkedin announcement
  after layoff"
- **Hook:** contrarian — the green-ring badge actually *hurts* you at
  senior levels
- **Internal links:** week-1 plan, severance article
- **Outline:** what the recruiter-visibility data actually shows, the
  green-ring stigma at senior+, what to post instead, optimal post timing
  + cadence, how to announce the layoff itself (3 templates by tone)

## 4. Architecture

**File layout:**

```
frontend/
├── content/
│   └── playbook/
│       ├── just-got-laid-off-week-1-plan.md
│       ├── h1b-60-day-grace-period.md       (ships in v1; rest authored later)
│       ├── negotiate-severance-tech-layoff.md
│       ├── cobra-vs-marketplace-insurance.md
│       └── linkedin-opentowork-after-layoff.md
├── pages/
│   └── playbook/
│       ├── +Page.jsx                         (hub: list of articles)
│       ├── +config.js
│       ├── +Head.jsx                         (CollectionPage JSON-LD)
│       └── @slug/
│           ├── +Page.jsx                     (single article render)
│           ├── +Head.jsx                     (Article JSON-LD)
│           ├── +config.js
│           └── +onBeforeRender.js            (parses MD + frontmatter)
└── src/
    └── lib/
        └── playbookContent.js                (Vite glob loader + parser)
```

**Tech choices:**

- **Markdown files in repo, NOT in Supabase blog table.** The blog table
  exists but is for general blog posts; playbook content is pillar
  content authored deliberately, version-controlled, and tested with the
  rest of the codebase. Mixing them would couple the two churn rates
  unhelpfully.
- **Vite glob import** (`import.meta.glob('/content/playbook/*.md', { eager: true, query: '?raw', import: 'default' })`) loads all articles at build time. No runtime DB call. Articles ship as part of the
  bundle; SSR is fast.
- **`marked` for Markdown → HTML.** Smaller footprint than remark; we
  don't need plugin ecosystem.
- **`gray-matter` for frontmatter parsing.** Article metadata
  (title, dek, published_at, updated_at, eta_min, og_image) lives in
  YAML at the top of each `.md` file.
- **Vike `@slug` dynamic route** for the article page, same pattern
  the codebase already uses for `pages/jobs/@jobPath/`.
- **JSON-LD:** `Article` schema on each article page (composes with
  the root Organization + WebSite from `pages/+Head.jsx`). Hub page
  uses `CollectionPage` schema.
- **Sitemap:** extend `frontend/scripts/build-sitemaps.mjs` to emit
  `sitemap-playbook.xml` with one entry per article + the hub.

**Article frontmatter shape (per `.md` file):**

```yaml
---
title: "H-1B 60-Day Grace Period After a Tech Layoff: A Day-by-Day Guide"
dek: "What the 60-day rule actually says, what counts as a status change, and the exact decision points week-by-week."
slug: h1b-60-day-grace-period
published_at: 2026-05-20
updated_at: 2026-05-20
eta_min: 8
keywords:
  - h1b 60 day grace period
  - h1b laid off what to do
  - h1b sponsor change after layoff
internal_links:
  - just-got-laid-off-week-1-plan
  - negotiate-severance-tech-layoff
---
```

## 5. What's NOT in Playbook v1 (deliberately)

- **Per-article OG images.** Use the homepage `/api/og/home` as the
  fallback for sharing. Article-specific OG cards are a v2 add (one
  endpoint per article slug, ~1 hour each).
- **Search / filter inside the hub.** With 5 articles, a flat list is
  fine. Search becomes useful at 15+ articles.
- **Comments / reactions / save-for-later.** Out of scope. Article CTA
  goes to triage; that's the only conversion.
- **Newsletter signup on each article.** Trust signal is weak before we
  have a newsletter. LP-Newsletter is a separate future sub-project.
- **Multi-language.** US-only audience.
- **Audio / video / podcast versions.** v2+.
- **Author photo / bio / linkedin** beyond the homepage credential line
  (which is the only personal-bio signal we currently have).

## 6. Sub-project decomposition

| Slice | Scope | Est | Independent? |
|---|---|---|---|
| **Playbook-Infra + Seed** | Markdown loader, hub page, article page, JSON-LD, sitemap, ship with ONE complete article (the H-1B 60-day-grace-period one — written inline in the plan as authoritative seed content) | 1 week | Yes — ships standalone with one strong article |
| **Playbook-Content #2** | Author `just-got-laid-off-week-1-plan.md` | 1-2 days | Depends on Infra |
| **Playbook-Content #3** | Author `negotiate-severance-tech-layoff.md` | 1-2 days | Depends on Infra |
| **Playbook-Content #4** | Author `cobra-vs-marketplace-insurance.md` | 1-2 days | Depends on Infra |
| **Playbook-Content #5** | Author `linkedin-opentowork-after-layoff.md` | 1-2 days | Depends on Infra |
| **Playbook-OG** (v2) | Per-article `/api/og/playbook/[slug]` cards | 1-2 days | Depends on Infra |

**Execution order:** Playbook-Infra+Seed → ship → then content articles
2-5 as small commits over the following week, each a tight
content-authoring session (no subagents for content; quality matters too
much to delegate). Playbook-OG is v2.

## 7. Success metrics (90 days post-Playbook-Infra ship)

- **Acquisition:** ≥500 organic-search sessions/month landing on
  `/playbook/*` URLs by month 3
- **AI-citation:** ≥1 verified citation from ChatGPT/Claude/Perplexity
  per article by month 3 (manual sampling, search the AI engines for
  the target query and check if hyrly.ai/playbook appears in the
  response)
- **Conversion:** ≥10% of playbook landings click through to the
  homepage triage CTA
- **Triage conversion downstream:** the playbook-→-triage funnel should
  not convert worse than the direct-to-homepage funnel (≥30% triage
  completions). If it does, the article CTAs need work, not the
  homepage.

## 8. Open questions deferred to plan

- Exact markdown library — `marked` is the default choice; verify it
  handles GFM tables + fenced code blocks adequately
- Whether to add `prism.js` or similar for code-block syntax highlighting
  (none of the v1 articles have code, so probably skip)
- Whether the hub page sorts by recency or by an explicit `featured`
  flag (default: recency, with the catch-all article pinned to top)
- Article reading-time computation — automatic from word count vs.
  manual `eta_min` in frontmatter (default: manual, more accurate)

These get resolved in the plan; not blockers for the spec.
