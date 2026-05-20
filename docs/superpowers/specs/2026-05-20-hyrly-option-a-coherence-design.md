# Hyrly Option-A: Brand Coherence Rewrite (Features / Pricing / Roadmap)

> **Status:** Spec. Distilled 2026-05-20 from a follow-up Claude.ai site review
> that flagged the brand-coherence problem as the #2 issue (after the fabricated
> About-page, which was already fixed in commit `9d7d096`).
>
> Parent spec: [`docs/superpowers/specs/2026-05-20-hyrly-layoff-pivot-design.md`](2026-05-20-hyrly-layoff-pivot-design.md)
> Predecessors: LP0+LP1 (homepage = Triage), LP1.5 (trust line + OG), Playbook v1,
> the fabrication fix commit `9d7d096`.

---

## 1. Why now

The Claude.ai review surfaced a real problem: a visitor lands on the homepage,
gets the laid-off-engineer wedge, clicks "Features" in the nav, and gets
dropped into a three-sided B2B-SaaS pitch for Seekers + Recruiters + Companies
with features like "Pipeline Management" and "Team Collaboration." Same for
Pricing — four tiers of recruiter / company SaaS pricing. Same for Roadmap —
an empty IdeasBoard with 0/0/0 counters that erodes trust.

The homepage and Playbook are the new Hyrly. Features, Pricing, and Roadmap
are the old Hyrly. They don't agree on what the product is. The nav is
currently working against the conversion path Claude.ai validated.

The fix is straightforward but touches four pages of content — separate enough
from LP2's product work to warrant its own spec → plan cycle.

## 2. ICP coverage

Same as the parent Layoff Pivot — **US tech laid-off engineers in their first
30–90 days post-layoff**. All four rewritten pages talk to that person, with
secondary acknowledgement that recruiter/company users can still reach the
existing product surfaces via the authenticated `/app` flow (not via marketing
nav).

## 3. Scope (in)

### 3.1 `/features` rewrite

Replace the existing audience-split pitch (seekers + recruiters + companies)
with a single-ICP feature surface organized around the layoff use-case. The
features that exist in the product map to layoff-coaching capabilities; rewrite
the framing without removing any working code.

Five capability blocks, in priority order:

1. **Scout AI — your career coach** (the hero feature for this audience)
2. **Layoff Triage — get your week-1 priorities ranked in 3 minutes**
3. **The Playbook — 5 deeply-written articles** (cross-links to the playbook)
4. **Voice Interview Practice — when you're ready to interview**
5. **AI Job Matching — when you're ready to apply**

Recruiter / company surfaces are *not* hidden — they remain accessible from
the authenticated `/app` flow — but they no longer appear in the public
Features marketing page. A single closing line acknowledges them: "Hiring
manager or recruiter? Email hello@hyrly.ai — that path exists but isn't where
the brand is focused today."

### 3.2 `/pricing` rewrite

Replace the four B2B tiers (Seeker Free / Recruiter Starter $49 / Recruiter
Pro $129 / Company Enterprise) with the LP3 consumer pricing structure even
though LP3 hasn't shipped Stripe yet. The pricing page lists three options:

1. **Free** — Triage + Playbook + 3 Scout AI sessions
2. **Hyrly Coach — $29/month** — unlimited Scout AI sessions + Voice Interview Practice + AI Job Matching
3. **Layoff Sprint — $99 one-time** — 30 days of unlimited Hyrly Coach + a personal week-1 audit by the founder (real)

The two paid tiers are "Sign up for early access — you'll be among the first
100 and pricing won't change for you" buttons that go to an email-collection
form (or just open the `mailto:` link to `hello@hyrly.ai`) since Stripe isn't
wired yet. Once LP3 lands, the buttons swap to Stripe Checkout.

This **does** make a commitment ("pricing won't change for you" for the first
100) — that's deliberate. Scarcity-from-truth converts and the commitment is
easy to honor.

### 3.3 `/roadmap` rewrite

Replace the existing IdeasBoard (which renders 0/0/0 counters today because no
ideas exist in the database) with a static, hand-curated roadmap of 6-10 real
planned items with status tags (Planned / In Progress / Shipped). Examples:

- Scout AI hardening across 13 layoff domains — **In Progress** (LP2)
- Stripe billing for Hyrly Coach — **Planned** (LP3)
- LinkedIn announcement template generator — **Planned**
- 5 more Playbook articles — **Planned**
- Per-article custom OG images — **Planned**
- Free Severance Calculator tool — **Planned**
- Mobile app — **Planned**
- Hyrly Rebrand + canonical domain migration — **Shipped** (2026-05-20)
- Layoff Triage tool as homepage — **Shipped** (2026-05-20)
- Playbook v1 (5 articles) — **Shipped** (2026-05-20)

The IdeasBoard component stays in the codebase; it can power a future
`/ideas` route if community-submitted ideas become a thing. For now, the
public Roadmap is the founder's authored plan, not a user-vote board.

### 3.4 Footer / nav cleanup

If `/roadmap` is removed from nav (alternative to populating it), the
nav.links array in `PublicNav.jsx` loses one entry. If populated, the nav
stays as-is. Default: populate, not remove — the static roadmap is more
on-brand and gives a real signal.

## 4. Scope (out)

Deliberately deferred to other sub-projects:

- **Playbook author byline + photo** — depends on user's real-name decision; tracked separately.
- **Per-article Playbook OG images** — earlier-deferred; not blocking Option-A.
- **LP2 Scout AI hardening** — separate plan, executes after Option-A ships.
- **LP3 Stripe billing wiring** — the pricing copy is updated now; the Stripe Checkout integration is LP3's job.
- **Removing the underlying recruiter / company route + service code** — those stay in `/app` and `backend/api/routes/recruiter.py` etc. for users with existing accounts. Only the public marketing surface narrows.
- **`/help` / `/terms` / `/privacy` rewrites** — those don't conflict with the wedge.

## 5. Architecture

**Files touched (mostly content):**

- `frontend/src/pages/marketing/FeaturesPage.jsx` — full rewrite
- `frontend/src/pages/marketing/PricingPage.jsx` — full rewrite (tiers + FAQ)
- `frontend/pages/roadmap/+Page.jsx` (or wherever the roadmap route lives) — replace with static roadmap component
- `frontend/src/pages/marketing/StaticRoadmap.jsx` — NEW component for the static roadmap list
- `frontend/pages/features/+config.js` + `+Head.jsx` if those exist — update SEO copy
- `frontend/pages/pricing/+config.js` + `+Head.jsx` if those exist — update SEO copy

The Vike route at `frontend/pages/roadmap/+Page.jsx` currently renders the
IdeasBoard component. The new version renders the StaticRoadmap component
instead. The IdeasBoard component file stays untouched.

**No backend changes.** This is pure content + UI rewriting.

## 6. Success metrics (to measure post-ship, manually)

- A visitor moving Homepage → Features → Pricing → About → Playbook sees
  consistent positioning every step
- "Pipeline Management" / "Team Collaboration" / "Hire faster" copy gone
  from the public marketing surfaces
- The next Claude.ai review (or any reasonable reviewer) does not surface
  the brand-coherence issue
- Roadmap page shows ≥6 real items with status tags, no 0/0/0 counters

## 7. Open questions (resolve in plan)

- Exact text of the 5 Features-page capability blocks (drafted inline)
- Exact text of the 3 Pricing tiers + their feature lists (drafted inline)
- Exact 8-12 roadmap items + status tags (drafted inline)
- Whether the existing /roadmap route renames or stays at `/roadmap` (default: stays)
- Whether to noindex the recruiter / company routes that still exist behind `/app` (out of scope — they're authenticated, not crawled)
