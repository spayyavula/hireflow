# Hyrly Layoff Pivot — Strategic + Product Design

> **Status:** Spec. Distilled from brainstorm 2026-05-20. Source of truth for the
> pivot from "AI-powered career partner for everyone" → "the AI career coach
> for laid-off US tech engineers in their first 90 days."
>
> Companion plans will live in `docs/superpowers/plans/` under names like
> `2026-05-20-hyrly-lp0-cleanup.md`, `…-lp1-triage-homepage.md`, etc.

---

## 1. Why pivot

The current Hyrly homepage tries to serve seekers + recruiters + companies
simultaneously. This is the textbook three-sided marketplace pitch that almost
always fails for indie founders against incumbents (Indeed serves seekers,
Greenhouse serves companies, LinkedIn Recruiter serves recruiters; none of them
won by being "a workspace for everyone").

The fix is **narrow the ICP to one specific person until the homepage can be
written for that person in three words**, and let everything else (recruiter
flow, company dashboard) live behind footer nav.

The single-ICP framing also resolves the "wedge clarity" problem flagged in
the earlier strategic review: instead of competing on matching (Simplify
owns it), voice interview (Final Round AI owns it, $60M raised), or
application tracking (Teal owns it), Hyrly takes the **unclaimed coaching
lane** — and specifically coaches the panic-thoughts of week 1 post-layoff.

## 2. ICP

**US tech laid-off engineer, any hub, in their first 30–90 days post-layoff.**

| Dimension | Value |
|---|---|
| Geo | US, any tech hub (Bay Area, NYC, Seattle, Austin, Boston, remote) |
| Role | Software engineer / PM / designer / data — IC or manager |
| Trigger event | Got laid off in the last 0–14 days |
| Severance runway | 8 weeks (early-stage) to 6 months (FAANG) |
| Search state | Active, anxious, paralyzed by "where do I even start" |
| Distribution surface | LinkedIn Open-to-Work, layoffs.fyi, r/layoffs (350k members), tech newsletters, "I got laid off" X threads |
| Existing tooling they reach for first | LinkedIn, Indeed, ChatGPT (none of which coach them on what to do next) |

**Estimated TAM:** ~480k tech layoffs 2022–2025 (layoffs.fyi). Conservative 40%
still searching → ~192k active. Growing at ~80k/year.

**Why not other ICPs:**

- **Cross-industry laid-off** (10× larger market): zero unique advantage; LinkedIn
  dominates. Not your beachhead.
- **Bay Area only:** valid sub-niche but too narrow given remote distribution
  channels reach all US hubs at the same cost.
- **The Pivot / The Stalled IC / The Returning / The Burned-Out:** all valid coach
  ICPs, but lower urgency → slower conversion. The Layoff converts in week 1.

## 3. Hero wedge: Scout AI as coach

Scout AI is the only feature in the current product that has *no clear
incumbent in 2026*. Voice interviews → Final Round AI. Job matching →
Simplify. Application tracking → Teal. Resume rewrites → Rezi.
**Coaching across 13 career domains → nobody.**

Defensibility:

- Coaching quality compounds with proprietary prompt + memory architecture
- Cross-domain coverage (resume, interview, negotiation, layoff response, pivots,
  burnout, visa, severance, etc.) is hard to replicate quickly
- LTV ceiling matches a $50–200/mo SaaS sub (cf. BetterUp Self $90/mo,
  Coach.me $25/mo) — not a $0.25/click job board

The other features (matching, voice interview, multi-source search) **stay in
the product** as supporting capabilities but **lose their hero placement**.

## 4. Front door: Layoff Triage

`hyrly.ai/` IS the Triage tool. Not a marketing page that links to it.

Pattern reference: RemoteOK (front page = job feed), layoffs.fyi (front page =
table), levels.fyi (front page = compensation grid). Front-page-as-tool wins
over front-page-as-marketing for indie founders without incumbent-scale ad
budgets.

**Triage shape:**

- 10 questions, ~3 minutes, no signup, no email
- Output: a personalized "your week-1 priorities" plan with 5–8 ranked action
  items
- "Talk to Scout AI about any of these" CTA at the end hands off to Scout
  with the triage context preloaded (no re-explaining the situation)

**Sample question categories** (final list to be designed in LP1):
runway / severance, visa status, last role/level/company tier, location, family
obligations, willingness to relocate, willingness to take a downgrade, current
resume state, network strength, mental state.

**Hero copy (working draft):**

```
                                    [Sign in]  [Try Scout AI]
HYRLY


           Just got laid off?
           Don't update your resume yet.

           Most laid-off engineers spend week 1 on tasks
           that don't matter and skip the ones that do.
           Answer 10 questions about your situation.
           Get your priorities ranked.

           [ Start triage — 3 minutes  → ]

           No signup. No email. Free.



           — or scroll for the full Scout AI workspace —
```

Below the fold: feature cards for Scout AI (with 13 domains explicitly
listed), Voice Interview Practice, Match-Scored Search, and the existing
seeker product. Recruiter and company pitches move to footer/nav.

## 5. Pricing model

**Freemium with bundle option at checkout.**

- Free: Layoff Triage (unlimited), 3 Scout AI sessions
- Paid: $29/mo unlimited Scout AI (anchor: Coach.me $25/mo, well below Final
  Round AI $148/mo)
- Alt one-time: **$99 "Layoff Sprint"** — 30 days of unlimited Scout AI +
  severance review + weekly check-in + resume rewrite. Matches users who
  think of layoff as a one-time crisis, not a subscription.

**Conversion target:** 5% free → paid (industry standard for SaaS coaching tools).
At 192k addressable + 3% reach in year 1 → ~5.7k users → ~285 paying →
~$8k MRR by month 12. Modest but real. Sprint bundle ARPU pushes blended
to ~$60/user/year.

**What's NOT in pricing:** recruiter/company-side monetization. Defer. Focus on
seeker LTV until coach quality and conversion are proven.

## 6. Must-fix table-stakes (LP0 — immediate liability)

These two items from the earlier strategic review are still live on
production and need to be fixed before any new traffic arrives:

**6.1 LinkedIn / Indeed trademark.** The current copy ("5 job providers including
LinkedIn and Indeed") names trademarked competitors as implied data partners.
Both companies have aggressive enforcement teams. **Fix:** rewrite to
"Aggregated search across 5+ public job sources" without naming trademarked
competitors. License-clean sources can be named: Adzuna, JSearch, Greenhouse,
Lever, Ashby, USAJobs, Remotive.

**6.2 Fabricated-looking testimonials.** "Priya M. / Daniel R. / Lena K." with
initial-only names, no photos, no LinkedIn, no company logos — FTC enforcement
target since 2024. **Fix:** either replace with 3 real beta users (with
permission, full names, photos, LinkedIn links, company logos) within 2 weeks,
OR replace with honest placeholder ("Beta testimonials coming once we have
permission from our first cohort").

These are 30–60 minutes of code work each; the bottleneck is the beta-user
sourcing for option (a).

## 7. Sub-project decomposition

| # | Name | Scope | Est | Independent? |
|---|---|---|---|---|
| **LP0** | Cleanup | Trademark copy + testimonials + remove "Demo preview / sample data" carousel | 1 day | Yes — ships standalone |
| **LP1** | Homepage + Triage tool | Replace `hyrly.ai/` with the Triage flow. Move existing marketing/recruiter/company pages behind nav/footer. Implement the 10-question intake → personalized plan output → Scout handoff. | 1–2 wk | Yes — pure frontend + new backend endpoint |
| **LP2** | Scout AI hardening for the Layoff ICP | Define the 13 domains explicitly. Write per-domain coaching prompts. Tune the layoff-specific opening flow. Add session memory across conversations. | 2–3 wk | Depends on LP1 for the handoff context shape |
| **LP3** | Freemium billing | 3-free-sessions gating + Stripe integration for $29/mo subscription and $99 one-time Sprint bundle. | 1 wk | Depends on session tracking from LP2 |
| **LP4** | Distribution launch | LinkedIn personal-network post, layoffs.fyi adjacent community outreach, Show HN, r/layoffs (if rules permit), tech newsletter sponsorships. Plus free SEO tool side-projects (Severance Calculator at `/tools/severance`). | ongoing | Depends on LP0+LP1 shipped |

Each sub-project has its own spec → plan → implementation cycle, mirroring
how SP0–SP5 was decomposed.

**Recommended execution order:** LP0 → LP1 → LP2 → LP3 → LP4. LP0 first because
the trademark/testimonial issues are live on production. LP1 second because
the front door must exist before LP4 distribution makes sense. LP2 and LP3 can
overlap.

## 8. What gets killed

The Layoff ICP framing implies a kill list. Things that stop appearing on the
homepage (but stay in the product behind nav/footer):

- "AI-powered career partner" tagline (generic, replaceable)
- The three-audience seekers/recruiters/companies positioning above the fold
- "Featured opportunities — sample data" carousel (replace with real once available,
  or remove)
- Voice interview as a hero feature (becomes a supporting card under Scout AI)
- "13 career domains" claim without the list (must list them or drop the claim)
- "5 job providers including LinkedIn and Indeed" (LP0)
- Fabricated-looking testimonials (LP0)

What we explicitly **keep** below the fold and in nav: voice interview, multi-source
matching, job search, the recruiter dashboard, the company dashboard, and the blog.
These are real product surface area; they just don't lead.

## 9. Open questions deferred to sub-project planning

These are deliberately left for the sub-project plans so each plan owns its
own design space:

- **LP1:** exact 10 triage questions and their branching logic; the "your
  week-1 priorities" output template; how the Scout handoff embeds triage
  context
- **LP2:** the explicit list of 13 domains, per-domain prompts, opening-session
  flow for someone laid off 0–3 days ago vs 30–90 days ago
- **LP3:** Stripe vs Paddle vs Lemon Squeezy; trial mechanics; refund policy
- **LP4:** which subreddit/community rules allow product posts; whether the
  Severance Calculator launches as a separate `/tools/` URL or as a feature
  inside the Triage

## 10. Success metrics (to measure 90 days post-LP1 ship)

- **Acquisition:** ≥500 Triage completions/month, ≥50% from organic search
- **Activation:** ≥30% of Triage completions try at least one Scout AI session
- **Conversion:** ≥5% of free Scout users convert to paid within 14 days
- **Retention:** ≥60% paid retention at 30 days (matches the avg job-search duration)
- **Credibility:** ≥3 real named testimonials with photo + LinkedIn + company

If acquisition is hitting but activation isn't, the Triage→Scout handoff is
broken. If activation is hitting but conversion isn't, the paywall is in the
wrong place or pricing is wrong. If conversion is hitting but retention isn't,
Scout AI quality (LP2) is the bottleneck.
