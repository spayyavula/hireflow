# Hyrly Playbook — Infrastructure + H-1B Seed Article Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/playbook` (hub) and `/playbook/h1b-60-day-grace-period` (the seed article) as a working SEO+GEO content surface. Subsequent commits author the remaining four v1 articles into the same infrastructure.

**Architecture:** Article markdown files in `frontend/content/playbook/*.md` (Vite-glob-loaded at build time). Vike route `pages/playbook/+Page.jsx` renders the hub; `pages/playbook/@slug/+Page.jsx` renders an article. `marked` parses Markdown → HTML at render time (SSR-safe). Article JSON-LD on each article page composes with the root Organization + WebSite from `pages/+Head.jsx`. Sitemap builder gains a `sitemap-playbook.xml` emitter.

**Tech Stack:** Vike + React 18 (frontend), `marked` for Markdown→HTML, `gray-matter` for YAML frontmatter, Vite glob imports for build-time content loading. No DB, no runtime fetch, no LLM call — pure static rendering.

**Spec:** [`docs/superpowers/specs/2026-05-20-hyrly-playbook-design.md`](../specs/2026-05-20-hyrly-playbook-design.md)

---

## File Structure

**New files:**
- `frontend/content/playbook/h1b-60-day-grace-period.md` — the seed article (Markdown + frontmatter)
- `frontend/src/lib/playbookContent.js` — Vite glob loader + frontmatter parser, exports article metadata + rendered HTML
- `frontend/src/lib/playbookContent.test.js` — unit tests for the loader
- `frontend/pages/playbook/+Page.jsx` — hub page rendering the article list
- `frontend/pages/playbook/+Head.jsx` — CollectionPage JSON-LD for the hub
- `frontend/pages/playbook/+config.js` — Vike config (title, description)
- `frontend/pages/playbook/@slug/+Page.jsx` — single article render
- `frontend/pages/playbook/@slug/+Head.jsx` — Article JSON-LD
- `frontend/pages/playbook/@slug/+config.js` — Vike config
- `frontend/pages/playbook/@slug/+onBeforeRender.js` — loads the article by slug at render time

**Modified files:**
- `frontend/package.json` — add `marked` + `gray-matter` deps
- `frontend/scripts/build-sitemaps.mjs` — emit `sitemap-playbook.xml` + include in index

---

## Task 1: Add `marked` and `gray-matter` dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install both deps**

From Bash, at `c:/Users/sreek/myprojects/jobshunter/hireflow/frontend`:

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm install --save marked gray-matter
```

Expected: both packages installed; `package.json` lists them in `dependencies`; `package-lock.json` updated. No vulnerabilities surfaced for these libraries (both are widely used, low-risk).

- [ ] **Step 2: Verify the install**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && node -e "import('marked').then(m=>console.log('marked ok:',typeof m.marked));require('gray-matter');console.log('gray-matter ok')"
```
Expected: both prints succeed (marked is ESM, gray-matter is CommonJS).

- [ ] **Step 3: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/package.json frontend/package-lock.json
git commit -m "$(cat <<'EOF'
chore(deps): add marked + gray-matter for the Playbook content pipeline

Build-time Markdown rendering: gray-matter parses YAML frontmatter,
marked converts Markdown body to HTML. Both are runtime-light and SSR-safe;
no DB, no LLM, no remote fetch in the rendering path.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Author the H-1B seed article

**Files:**
- Create: `frontend/content/playbook/h1b-60-day-grace-period.md`

**Context:** This is the seed content. It must read like a careful, authoritative piece written by someone who has watched many H-1B holders go through this — calm, specific, never sensationalized, with appropriate disclaimers for the actual legal questions. It is NOT legal advice; the article says so explicitly. Hand-written. Do not paraphrase, do not "improve" — the prose is the asset.

- [ ] **Step 1: Create the markdown file**

Create `frontend/content/playbook/h1b-60-day-grace-period.md` with **exactly** this content:

````markdown
---
title: "H-1B 60-Day Grace Period After a Tech Layoff: A Day-by-Day Guide"
dek: "What the 60-day rule actually says, what counts as a status change, and the exact decision points week-by-week — written for engineers in the middle of it."
slug: h1b-60-day-grace-period
published_at: 2026-05-20
updated_at: 2026-05-20
eta_min: 9
keywords:
  - h1b 60 day grace period
  - h1b laid off what to do
  - h1b sponsor change after layoff
  - h1b grace period extension
  - h1b transfer after layoff
internal_links:
  - just-got-laid-off-week-1-plan
  - negotiate-severance-tech-layoff
---

If you held an H-1B and your last day was recent, the most useful thing you can do in the first 72 hours is understand the clock you're now on. The 60-day grace period is real, it's specific, and it's not the same thing as "60 days to find a new job." This guide walks through what the rule actually says, what counts as making the deadline, and the decision points that matter most.

**This is not legal advice.** Hire an immigration attorney for your specific situation — most will do a 30-minute consult for $0–$200. Several names are listed at the bottom. Read this first so you walk into the consult with the right questions.

## What the 60-day rule actually says

The relevant regulation is **8 CFR 214.1(l)(2)**. In plain English, if you were laid off while holding H-1B status, you have up to 60 consecutive calendar days, starting from the day after your last day of employment, to do one of the following:

1. **Have a new H-1B petition filed on your behalf** by a new employer (you do not have to wait for it to be approved — see "AC-21 portability" below)
2. **Change to a different non-immigrant status** (B-2 visitor, F-1 student, H-4 dependent, etc.)
3. **Leave the United States**

If none of those happen by day 60, your authorized stay ends and you accrue unlawful presence from day 61 forward. Unlawful presence has long-tail consequences (3-year and 10-year reentry bars) that you do not want to deal with — so the 60-day deadline is hard, not soft.

A few things the 60-day rule is *not*:

- It is **not 60 business days**. It is 60 calendar days, including weekends and federal holidays.
- It does **not reset** if you find a new H-1B job and then get laid off again from that job within the same fiscal year. Your USCIS-granted period of stay continues from the original I-94.
- It does **not require you to find a job by day 60**. You just need a petition *filed* (or to have changed status, or to have left) by day 60.
- It does **not require a specific employer to know your status**. You decide when to disclose. (But see "Telling recruiters" below — disclosing earlier saves everyone time.)

## Day 0–7: get the clock right

The first thing to know is your actual day-60 date. Open a calendar. Count 60 days from the day *after* your last day of employment. Put that date on the calendar in red. Every subsequent decision in this guide is anchored to that date.

If your last day was a Friday, your clock starts Saturday. If your separation agreement specifies a later "termination date" than your last working day (sometimes companies extend you through a notice period or PTO payout), check with HR which date USCIS will treat as the trigger. The safe answer is the *earlier* of the two.

While you're getting the clock right, also do these in week 1:

- **Pull your I-94 from the CBP travel records site** (`i94.cbp.dhs.gov`). Save the PDF. Your most recent I-94 documents the period of stay USCIS granted; it's what an attorney or new employer will ask for first.
- **Pull your most recent H-1B approval notice (I-797).** If you can't find it, your former employer's immigration team or law firm has it on file — ask before they fully offboard you.
- **Pull every prior I-797 going back to your initial H-1B.** You'll need them to document your remaining 6-year cap. Most H-1Bs have a hard 6-year maximum, recapturable only via the I-140 path.
- **If you have an approved I-140 (i.e., were green-card-sponsored at your prior employer), pull the I-140 approval notice too.** This is huge — it makes you eligible to extend H-1B beyond 6 years and to potentially apply for an EAD if your priority date is current.

These four documents go in a single folder you can send to a new employer's immigration team in a single email. Cutting paperwork delays from days to minutes is the single highest-ROI thing you can do in week 1.

## The four paths out of the grace period

Listed in rough order of how often they apply to laid-off tech engineers.

### Path A: H-1B transfer to a new employer (AC-21 portability)

By far the most common path. Under the American Competitiveness in the 21st Century Act (**AC-21**), once your new employer files an H-1B petition on your behalf, you can begin working for them as soon as **USCIS receipts the petition** (not when it's approved). The receipt notice (Form I-797C) typically arrives 1–4 weeks after filing — and you can request **premium processing** for $2,805 to get an adjudicated decision in 15 business days.

What this means in practice: if your new employer files on day 50, and USCIS issues the receipt on day 58, you've made the 60-day deadline. You can start working on day 58 or later under AC-21. You don't have to wait for the approval.

Practical notes:

- The new employer files an **H-1B transfer petition**, not a new cap-subject H-1B. Cap-exempt because you already used the cap.
- You do not have to leave the country to "activate" the new H-1B. AC-21 expressly permits the status change in-country.
- If the new H-1B is denied, you fall back to whichever status you had before — which means if your grace period has already expired, denial puts you out of status. This is why hiring an attorney to review the petition before filing is worth the $500–1,500.
- Some employers will only file standard processing (15-day premium is an employer choice) — ask. Many will pay the premium to compress the timeline; some will let you pay it.

### Path B: Change of status to B-2 (visitor)

If you can't find an H-1B sponsor within 60 days, the most common bridge is a **change of status to B-2 visitor**. You file Form I-539 with USCIS, claiming you intend to wind down your affairs and depart the US within a reasonable period (typically the 6 months B-2 grants).

Key facts:

- **You cannot work on B-2.** Not 1099, not contract, not "just for friends." Working on B-2 ends your status immediately and is a deportable offense.
- **You can continue your job search on B-2.** Searching for a job is not working.
- **B-2 is not a path to long-term residency.** It buys time.
- **Filing the I-539 before day 60 stops the clock.** As long as the I-539 is *received* by USCIS within the 60-day window and you are otherwise eligible, you remain in authorized stay while it adjudicates (which can take 3–8 months). If it's eventually denied, you must depart; but during pendency you're not accruing unlawful presence.

This is the safety net most attorneys recommend filing as a backstop *even if you have an H-1B transfer in motion*. If the transfer is denied at day 70, the B-2 application filed at day 55 keeps you in authorized stay.

### Path C: Change of status to F-1 (student)

If you were previously on F-1 OPT or STEM-OPT, you may be eligible to **reactivate F-1 status** by enrolling in a degree program. This is a real path used by many laid-off engineers — short master's programs (1-year MS in CS, MBA, MS in Engineering Management) at SEVP-certified schools accept enrollments year-round.

Practical:

- The program must be **full-time** to maintain F-1.
- You can do **CPT (curricular practical training)** during the program, which lets you work for a sponsor while studying — often used as a bridge into a new H-1B in the next fiscal year.
- The school files the I-20; USCIS approves the change of status via I-539.
- This path costs money ($10K–$60K depending on school) but can be worth it if you have a 2–3 year horizon to think about. Several specialized programs (e.g., NEU's "Align" MS in CS) exist primarily to serve this audience.

### Path D: Change of status to H-4 (spouse-dependent)

If your spouse is also an H-1B holder with an **approved I-140**, you can change status to H-4 and apply for an **H-4 EAD** (employment authorization document) under the 2015 H-4 EAD rule. H-4 EAD lets you work for any US employer (not tied to a single sponsor).

Practical:

- Your spouse must have an approved I-140 (the second step of green-card sponsorship). An I-485 alone is not sufficient.
- H-4 + H-4 EAD = a far less stressful long-term posture than chasing H-1B transfers, but the EAD must be renewed every 2 years.
- Processing time for H-4 EAD is currently 4–8 months, sometimes faster with premium processing for the underlying I-539.

## Telling recruiters

There is no good reason to hide your visa status from recruiters. Hiding it wastes everyone's time and frequently ends interviews at the final round (when legal/immigration gets looped in). Tell every recruiter in the first email:

> "I'm currently on H-1B status (last day was [date]; I'm within my 60-day grace period). Cap-exempt — my prior employer used the cap. Open to roles at sponsoring employers; happy to provide my I-797 history when useful."

Two things this signals: (1) you understand your own status, which is professionalism in itself; (2) you're cap-exempt, which removes the single largest objection (employers don't want to pay $5K+ in fees for a lottery-dependent candidate when they can hire a cap-exempt one for free).

Use the H-1B-friendly employer databases:

- **MyVisaJobs** — historical LCA filings, so you can see who has actually sponsored
- **h1bgrader.com** — similar, with year-over-year stats
- **H-1B Visa Sponsors** Google Sheet (community-maintained, surfaces in r/cscareerquestions)

## When to hire an attorney

Hire one. The total cost of an immigration attorney for the H-1B layoff scenario is typically $1,500–$5,000 — far less than the cost of one mistake. Specifically hire one if any of the following apply:

- Your I-140 status is uncertain or your priority date is close to current
- You're considering F-1 reactivation (the change-of-status approval rate varies by school + officer)
- Your prior employer's separation agreement has unusual immigration language
- You're a dependent on someone else's H-1B (or vice versa) and need to coordinate
- Your I-94 expiration is *earlier* than the 60-day grace period would suggest (this happens; the controlling date is the earlier one)

A few firms that handle this well (no affiliation; ask r/h1b for current recommendations):

- **Reddy & Neumann** (Houston, US-wide remote consults)
- **Saluja Law** (Atlanta, US-wide)
- **Murthy Law Firm** (Owings Mills MD, US-wide, known for clear written guides)
- **Klasko Immigration** (NYC + Philadelphia, enterprise-tier)
- Many tech-focused boutique firms operate state-by-state — search "[your state] immigration attorney H-1B layoff"

## What to do today

If you're reading this on day 0–7, here's the sequence:

1. **Today:** Put day-60 on the calendar in red.
2. **Today:** Pull I-94, I-797, and any I-140 docs into one folder.
3. **This week:** Book one 30-minute attorney consult. Walk in with your documents and your timeline.
4. **This week:** Update LinkedIn (see [LinkedIn announcement guide](#)) including the cap-exempt signal.
5. **By day 30:** Either have an H-1B transfer filed, an I-539 (B-2 or F-1) filed, or be packing.
6. **By day 50:** If no transfer receipt yet, file the I-539 backstop now.

If you'd like, [start a Hyrly Triage]({{SITE}}/) — it takes 3 minutes, costs nothing, and Scout AI can walk through this timeline with your specific dates, runway, and risk tolerance.

*Last updated: May 20, 2026. Always verify legal specifics with a current immigration attorney — USCIS policy guidance can change.*
````

(The `{{SITE}}` placeholder above is a literal template token — replace at render time. See Task 3.)

- [ ] **Step 2: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/content/playbook/h1b-60-day-grace-period.md
git commit -m "$(cat <<'EOF'
content(playbook): seed article — H-1B 60-day grace period guide

The most underserved + highest-stakes article in the v1 playbook
set. Walks through 8 CFR 214.1(l)(2), the four paths out of the
grace period (H-1B transfer / B-2 / F-1 / H-4), what to tell
recruiters, when to hire an attorney, and the exact day-0-to-day-60
sequence. Explicitly not legal advice; points to specific firms
without affiliation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Playbook content loader (TDD)

**Files:**
- Create: `frontend/src/lib/playbookContent.js`
- Create: `frontend/src/lib/playbookContent.test.js`

**Context:** Build-time Vite glob import loads every `.md` file in `frontend/content/playbook/`. Parse frontmatter with gray-matter, render the Markdown body with marked, replace `{{SITE}}` with `import.meta.env.VITE_SITE_URL || 'https://hyrly.ai'`. Export `getArticles()` (returns metadata for all articles sorted recent-first) and `getArticleBySlug(slug)` (returns one article with rendered HTML or null).

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/playbookContent.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { getArticles, getArticleBySlug } from './playbookContent';

describe('playbookContent loader', () => {
  it('returns the H-1B seed article in the article list', () => {
    const articles = getArticles();
    const h1b = articles.find((a) => a.slug === 'h1b-60-day-grace-period');
    expect(h1b).toBeTruthy();
    expect(h1b.title).toMatch(/H-1B 60-Day/);
    expect(h1b.dek).toBeTypeOf('string');
    expect(h1b.dek.length).toBeGreaterThan(0);
    expect(h1b.published_at).toBe('2026-05-20');
    expect(h1b.eta_min).toBe(9);
  });

  it('sorts articles recent-first by published_at', () => {
    const articles = getArticles();
    for (let i = 1; i < articles.length; i++) {
      expect(articles[i - 1].published_at >= articles[i].published_at).toBe(true);
    }
  });

  it('getArticleBySlug returns the article with rendered HTML body', () => {
    const a = getArticleBySlug('h1b-60-day-grace-period');
    expect(a).toBeTruthy();
    expect(a.slug).toBe('h1b-60-day-grace-period');
    expect(a.html).toBeTypeOf('string');
    expect(a.html.length).toBeGreaterThan(1000);
    // Spot-check the rendered HTML for known markdown features
    expect(a.html).toMatch(/<h2[^>]*>What the 60-day rule actually says/);
    expect(a.html).toMatch(/<strong>This is not legal advice/);
    // The {{SITE}} template must be replaced
    expect(a.html).not.toContain('{{SITE}}');
    expect(a.html).toMatch(/https:\/\/hyrly\.ai\//);
  });

  it('getArticleBySlug returns null for unknown slug', () => {
    expect(getArticleBySlug('does-not-exist')).toBeNull();
  });

  it('every article has the required frontmatter fields', () => {
    for (const a of getArticles()) {
      expect(a.title).toBeTypeOf('string');
      expect(a.slug).toBeTypeOf('string');
      expect(a.published_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.eta_min).toBeTypeOf('number');
      expect(Array.isArray(a.keywords)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- playbookContent 2>&1 | tail -10
```
Expected: FAIL — cannot resolve `./playbookContent`.

- [ ] **Step 3: Implement the loader**

Create `frontend/src/lib/playbookContent.js`:

```js
// Build-time content loader for the /playbook content surface.
// Articles live at frontend/content/playbook/*.md with YAML frontmatter.
// We use Vite's glob import to pull them all into the bundle at build time;
// no DB call, no runtime fetch. SSR-safe.

import matter from 'gray-matter';
import { marked } from 'marked';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

// `?raw` returns the file contents as a string. `eager: true` means all
// matching files are bundled (not lazy-loaded). The path is relative to
// the Vite project root (the `frontend/` directory).
const MODULES = import.meta.glob('/content/playbook/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function parseOne(rawContent) {
  const { data, content } = matter(rawContent);
  const rendered = marked.parse(content);
  const html = rendered.replace(/\{\{SITE\}\}/g, SITE);
  return { ...data, html };
}

// Cache parsed articles once at module load — articles don't change at runtime.
const ARTICLES = Object.values(MODULES).map(parseOne)
  // Newest first by published_at (YYYY-MM-DD strings sort lexicographically).
  .sort((a, b) => (a.published_at < b.published_at ? 1 : a.published_at > b.published_at ? -1 : 0));

const BY_SLUG = Object.fromEntries(ARTICLES.map((a) => [a.slug, a]));

export function getArticles() {
  // Return metadata only (no `html` field) — the hub doesn't need bodies.
  return ARTICLES.map(({ html, ...meta }) => meta);
}

export function getArticleBySlug(slug) {
  return BY_SLUG[slug] || null;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- playbookContent 2>&1 | tail -10
```
Expected: PASS — 5/5.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/lib/playbookContent.js frontend/src/lib/playbookContent.test.js
git commit -m "$(cat <<'EOF'
feat(playbook): content loader (Vite glob + gray-matter + marked)

Build-time loader. getArticles() returns metadata sorted recent-first.
getArticleBySlug(slug) returns one article including rendered HTML
body with {{SITE}} template tokens substituted. Pure ES module, no
runtime dependencies, SSR-safe.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Hub page at `/playbook`

**Files:**
- Create: `frontend/pages/playbook/+Page.jsx`
- Create: `frontend/pages/playbook/+config.js`
- Create: `frontend/pages/playbook/+Head.jsx`

- [ ] **Step 1: Create `+config.js`**

Create `frontend/pages/playbook/+config.js`:

```js
export default {
  title: 'Hyrly Playbook — Layoff & Career Guides for Tech Engineers',
  description:
    'Hand-written guides on what to actually do after a tech layoff. H-1B 60-day rule, severance negotiation, COBRA vs marketplace, post-layoff LinkedIn, week-1 priorities — by an engineer who\'s been on the other side of it.',
};
```

- [ ] **Step 2: Create `+Page.jsx`**

Create `frontend/pages/playbook/+Page.jsx`:

```jsx
import GlobalStyles from '../../src/styles/GlobalStyles';
import PublicNav from '../../src/components/PublicNav';
import { marketingNavProps } from '../../src/lib/vikeNav';
import { getArticles } from '../../src/lib/playbookContent';

export default function PlaybookHub() {
  const navProps = marketingNavProps('playbook');
  const articles = getArticles();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...navProps} />

      <header style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 32px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.15,
        }}>The Hyrly Playbook</h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Hand-written guides on what to actually do after a tech layoff.
          No fluff, no urgency tactics, no "transform your career" copy.
        </p>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 64px' }}>
        {articles.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            More articles coming soon.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {articles.map((a) => (
              <a
                key={a.slug}
                href={`/playbook/${a.slug}`}
                style={{
                  display: 'block', textDecoration: 'none', color: 'inherit',
                  background: 'white', borderRadius: 16, padding: '24px 28px',
                  border: '1px solid var(--border)',
                  transition: 'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--coral)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h2 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
                  color: 'var(--ink)', margin: 0, marginBottom: 8, lineHeight: 1.3,
                }}>{a.title}</h2>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 12px' }}>
                  {a.dek}
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {a.eta_min} min read · {a.published_at}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <footer style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Want your priorities ranked in 3 minutes?
        </p>
        <a href="/" style={{
          display: 'inline-block', background: 'var(--ink)', color: 'white',
          padding: '14px 28px', borderRadius: 12, textDecoration: 'none',
          fontSize: 15, fontWeight: 700,
        }}>Start the Hyrly Triage →</a>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Create `+Head.jsx`**

Create `frontend/pages/playbook/+Head.jsx`:

```jsx
import { getArticles } from '../../src/lib/playbookContent';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function PlaybookHubHead() {
  const articles = getArticles();
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE}/playbook#collection`,
    url: `${SITE}/playbook`,
    name: 'The Hyrly Playbook',
    description:
      'Hand-written guides on what to actually do after a tech layoff. ' +
      'H-1B, severance, health insurance, LinkedIn protocol, week-1 priorities.',
    isPartOf: { '@id': `${SITE}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}/playbook/${a.slug}`,
        name: a.title,
      })),
    },
  };
  return (
    <>
      <link rel="canonical" href={`${SITE}/playbook`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
```

- [ ] **Step 4: Run frontend tests**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test 2>&1 | tail -6
```
Expected: PASS — 46 + 5 = 51 tests (5 new from Task 3's `playbookContent.test.js`).

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/pages/playbook/+Page.jsx frontend/pages/playbook/+config.js frontend/pages/playbook/+Head.jsx
git commit -m "$(cat <<'EOF'
feat(playbook): hub page at /playbook

Lists every article from the content loader, sorted recent-first.
CollectionPage + ItemList JSON-LD for SEO and AI-engine citation.
CTA at the bottom returns visitors to the triage if they want
priorities ranked instead of (or in addition to) reading.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Article page at `/playbook/@slug`

**Files:**
- Create: `frontend/pages/playbook/@slug/+Page.jsx`
- Create: `frontend/pages/playbook/@slug/+config.js`
- Create: `frontend/pages/playbook/@slug/+Head.jsx`
- Create: `frontend/pages/playbook/@slug/+onBeforeRender.js`

**Context:** Vike's `@slug` syntax is a dynamic route segment. Same pattern as the existing `pages/jobs/@jobPath`. The `+onBeforeRender.js` runs at SSR + on client navigation to load the article. The page renders the article's HTML directly via `dangerouslySetInnerHTML` (the content comes from our trusted source — repo markdown — not user input).

- [ ] **Step 1: Create `+onBeforeRender.js`**

Create `frontend/pages/playbook/@slug/+onBeforeRender.js`:

```js
import { getArticleBySlug } from '../../../src/lib/playbookContent';

export default function onBeforeRender(pageContext) {
  const slug = pageContext.routeParams.slug;
  const article = getArticleBySlug(slug);
  return {
    pageContext: {
      pageProps: { article },
      // 404 semantics: if slug doesn't match an article, return a 404 status
      // and noindex it. Vike honors statusCode in the response.
      ...(article ? {} : { statusCode: 404 }),
    },
  };
}
```

- [ ] **Step 2: Create `+config.js`**

Create `frontend/pages/playbook/@slug/+config.js`:

```js
export default {
  // Per-page title comes from the article's frontmatter via +Head.jsx;
  // the static config is just a fallback when something goes wrong.
  title: 'Hyrly Playbook',
  description: 'A guide from the Hyrly Playbook.',
};
```

- [ ] **Step 3: Create `+Page.jsx`**

Create `frontend/pages/playbook/@slug/+Page.jsx`:

```jsx
import { usePageContext } from 'vike-react/usePageContext';
import GlobalStyles from '../../../src/styles/GlobalStyles';
import PublicNav from '../../../src/components/PublicNav';
import { marketingNavProps } from '../../../src/lib/vikeNav';

export default function PlaybookArticle() {
  const { pageProps } = usePageContext();
  const article = pageProps?.article;
  const navProps = marketingNavProps('playbook');

  if (!article) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        <GlobalStyles />
        <PublicNav {...navProps} />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
            color: 'var(--ink)', marginBottom: 16,
          }}>Article not found</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            That playbook entry doesn't exist (yet). <a href="/playbook" style={{ color: 'var(--coral)', fontWeight: 600 }}>Back to the playbook</a>.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...navProps} />

      <article style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 32px' }}>
        <header style={{ marginBottom: 32 }}>
          <a href="/playbook" style={{
            fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
            display: 'inline-block', marginBottom: 16,
          }}>← The Playbook</a>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700,
            color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 12,
          }}>{article.title}</h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 12 }}>
            {article.dek}
          </p>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {article.eta_min} min read · published {article.published_at}
            {article.updated_at && article.updated_at !== article.published_at
              ? ` · last updated ${article.updated_at}` : ''}
          </div>
        </header>

        <div
          className="playbook-prose"
          style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.75 }}
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      </article>

      <footer style={{
        maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px',
        textAlign: 'center', borderTop: '1px solid var(--border)', marginTop: 32,
      }}>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Want this article's priorities applied to your specific situation?
        </p>
        <a href="/" style={{
          display: 'inline-block', background: 'var(--ink)', color: 'white',
          padding: '14px 28px', borderRadius: 12, textDecoration: 'none',
          fontSize: 15, fontWeight: 700,
        }}>Start the Hyrly Triage →</a>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          3 minutes. No signup. Free.
        </p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: Create `+Head.jsx`**

Create `frontend/pages/playbook/@slug/+Head.jsx`:

```jsx
import { usePageContext } from 'vike-react/usePageContext';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function PlaybookArticleHead() {
  const { pageProps } = usePageContext();
  const article = pageProps?.article;

  if (!article) {
    return <meta name="robots" content="noindex,follow" />;
  }

  const url = `${SITE}/playbook/${article.slug}`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@id': url },
    headline: article.title,
    description: article.dek,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: { '@type': 'Organization', name: 'Hyrly', '@id': `${SITE}/#organization` },
    publisher: { '@id': `${SITE}/#organization` },
    image: `${SITE}/api/og/home`,
    keywords: Array.isArray(article.keywords) ? article.keywords.join(', ') : undefined,
  };

  return (
    <>
      <link rel="canonical" href={url} />
      <meta property="og:title" content={article.title} />
      <meta property="og:description" content={article.dek} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
```

- [ ] **Step 5: Build to confirm Vike picks up the routes**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod 2>&1 | tail -20
```
Expected: build succeeds; the per-page SSR functions include the playbook routes. "Sitemaps written: N jobs, M blog posts, K hubs." (playbook not yet in sitemap — that's Task 6).

- [ ] **Step 6: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/pages/playbook/@slug/
git commit -m "$(cat <<'EOF'
feat(playbook): article page at /playbook/<slug>

Vike dynamic route renders one article. onBeforeRender loads the
article via the content loader; +Page.jsx renders the body with
dangerouslySetInnerHTML (trusted source — repo markdown, not user
input). +Head.jsx emits Article JSON-LD + canonical + og:* tags.
Unknown slug -> 404 status + noindex.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Add playbook to the sitemap

**Files:**
- Modify: `frontend/scripts/build-sitemaps.mjs`

**Context:** The sitemap builder currently emits `sitemap-static.xml`, `sitemap-blog.xml`, `sitemap-jobs.xml`, `sitemap-hubs.xml`, and the `sitemap.xml` index. Add `sitemap-playbook.xml` with the hub URL + every article URL. Reading article slugs at script time means importing the loader — but the loader uses `import.meta.glob` which is a Vite-only feature. The build script runs in plain Node, so it can't use the same loader.

The cleanest fix: scan the filesystem in the build script the same way the loader scans via glob. We just need slugs + the hub URL. Don't render markdown here; this is sitemap entries.

- [ ] **Step 1: Read the existing sitemap builder**

Locate `frontend/scripts/build-sitemaps.mjs` and read it. It already imports `urlsetXml`, `sitemapIndexXml`, `deriveHubEntries` from `../src/lib/sitemap.js`. The pattern: each `sitemap-*.xml` is generated from an array of URL paths.

- [ ] **Step 2: Add the playbook generator**

Modify `frontend/scripts/build-sitemaps.mjs`. After the existing imports, add:

```js
import { readdir } from 'node:fs/promises';
```

Find the section that defines `STATIC_ROUTES`. After it, add a helper:

```js
async function readPlaybookSlugs() {
  const dir = path.resolve(__dirname, '..', 'content', 'playbook');
  try {
    const files = await readdir(dir);
    return files
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}
```

In `main()`, immediately after the `const posts = ...` line, add:

```js
  const playbookSlugs = await readPlaybookSlugs();
```

Then in the `files` object (just before the `sitemap.xml` assignment), add:

```js
    'sitemap-playbook.xml': urlsetXml(
      [`${SITE}/playbook`, ...playbookSlugs.map((s) => `${SITE}/playbook/${s}`)]
        .map((loc) => ({ loc })),
    ),
```

Finally, update the closing log line to include the playbook count:

```js
  console.log(
    `Sitemaps written: ${jobs.length} jobs, ${posts.length} blog posts, ` +
    `${deriveHubEntries(jobs).length} hubs, ${playbookSlugs.length} playbook articles.`,
  );
```

(Tests don't currently assert the log format — this is informational only.)

- [ ] **Step 3: Run a build to verify the new sitemap appears**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod 2>&1 | tail -10
```
Expected output includes: `Sitemaps written: N jobs, M blog posts, K hubs, 1 playbook articles.`

Verify the file exists:
```bash
ls -la c:/Users/sreek/myprojects/jobshunter/hireflow/frontend/dist/client/sitemap-playbook.xml && cat c:/Users/sreek/myprojects/jobshunter/hireflow/frontend/dist/client/sitemap-playbook.xml
```
Expected: file exists, contains `https://hyrly.ai/playbook` and `https://hyrly.ai/playbook/h1b-60-day-grace-period`.

- [ ] **Step 4: Run tests**

The existing `frontend/src/lib/sitemap.test.js` should still pass unchanged. Run:
```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test 2>&1 | tail -6
```
Expected: 51/51 pass.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/scripts/build-sitemaps.mjs
git commit -m "$(cat <<'EOF'
feat(sitemap): emit sitemap-playbook.xml for the Playbook surface

Build-time script scans frontend/content/playbook/*.md for slugs and
emits a sitemap entry for the hub plus every article. The sitemap.xml
index includes the new file automatically (it's generated from
Object.keys of the files map).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Optional — add Playbook to the PublicNav

**Files:**
- Modify: `frontend/src/components/PublicNav.jsx` (if it has a links array; otherwise skip)

**Context:** The hub is reachable only by typing `/playbook` directly unless we add it to nav. For organic SEO, the discoverability via internal linking matters — Google's PageRank flows through nav links. A single "Playbook" link in the public nav is the right move.

- [ ] **Step 1: Inspect PublicNav**

Read `frontend/src/components/PublicNav.jsx`. Look for a links array or list of nav items (often `[{ label: 'Features', href: '/features' }, ...]`).

- [ ] **Step 2: Add Playbook entry**

In the nav links array, add `{ label: 'Playbook', href: '/playbook' }` in a sensible position (after Blog, before Pricing — whatever matches the existing visual order). Match the existing object shape exactly; don't introduce a new pattern.

If the nav uses hardcoded JSX `<a>` elements instead of an array, add a sibling `<a href="/playbook">Playbook</a>` styled identically to the other links.

- [ ] **Step 3: Run tests**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test 2>&1 | tail -6
```
Expected: PASS — 51/51.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/components/PublicNav.jsx
git commit -m "$(cat <<'EOF'
feat(nav): add Playbook link to PublicNav

Single internal link is the cheapest way to let crawlers + AI engines
discover /playbook + every article underneath it. Google's PageRank
flows through nav links; bury content one click deep and discovery
slows by weeks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Deploy + smoke-test

**Files:** none modified — this is a deployment task.

- [ ] **Step 1: Push everything**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow && git push origin main 2>&1 | tail -3
```

- [ ] **Step 2: Rebuild + deploy frontend**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && rm -rf .vercel/output dist && VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod 2>&1 | tail -10 && vercel deploy --prebuilt --prod --yes 2>&1 | tail -5
```
Expected: build succeeds, "Sitemaps written" includes `1 playbook articles`, deploy ready.

- [ ] **Step 3: Smoke-test the hub**

```bash
node -e "fetch('https://hyrly.ai/playbook').then(r=>{console.log('hub status',r.status);return r.text();}).then(t=>{console.log('bytes',t.length);console.log('has-hyrly-playbook-title',t.includes('Hyrly Playbook'));console.log('has-h1b-article-link',t.includes('h1b-60-day-grace-period'));console.log('has-CollectionPage-schema',t.includes('CollectionPage'));})"
```
Expected: status 200, bytes ~15KB, all three checks `true`.

- [ ] **Step 4: Smoke-test the article**

```bash
node -e "fetch('https://hyrly.ai/playbook/h1b-60-day-grace-period').then(r=>{console.log('article status',r.status);return r.text();}).then(t=>{console.log('bytes',t.length);console.log('has-title',t.includes('H-1B 60-Day Grace Period'));console.log('has-article-schema',t.includes('\"@type\":\"Article\"'));console.log('has-ac21-content',t.includes('AC-21'));console.log('has-triage-cta',t.includes('Start the Hyrly Triage'));console.log('site-token-replaced',!t.includes('{{SITE}}'));})"
```
Expected: status 200, bytes ~30KB+, all six checks `true`.

- [ ] **Step 5: Smoke-test the sitemap**

```bash
node -e "fetch('https://hyrly.ai/sitemap-playbook.xml').then(r=>{console.log('sitemap-playbook status',r.status,'type',r.headers.get('content-type'));return r.text();}).then(t=>{console.log('has-hub',t.includes('/playbook</loc>'));console.log('has-article',t.includes('/playbook/h1b-60-day-grace-period</loc>'));})"
```
Expected: status 200, content-type `application/xml`, both checks `true`.

- [ ] **Step 6: 404 sanity check**

```bash
node -e "fetch('https://hyrly.ai/playbook/this-slug-does-not-exist').then(r=>console.log('404-status',r.status))"
```
Expected: 404.

- [ ] **Step 7: Final smoke — homepage still works**

```bash
node -e "fetch('https://hyrly.ai/').then(r=>r.text()).then(t=>{console.log('home-still-works:', t.includes('Just got laid off'), 'has-trust-line:', t.includes('other side of these layoffs'))})"
```
Expected: both `true`. (Sanity that we didn't break the homepage.)

---

## Self-Review Notes

**Spec coverage (`docs/superpowers/specs/2026-05-20-hyrly-playbook-design.md`):**

- §3.2 H-1B seed article — written inline at Task 2 → ✅
- §3.1, 3.3, 3.4, 3.5 — outlines in spec, articles will land in follow-up commits after this plan ships → deferred (acceptable per spec §6 decomposition)
- §4 Architecture — Vite glob loader (Task 3), hub page (Task 4), article page (Task 5), sitemap (Task 6), JSON-LD (Tasks 4 + 5), `marked` + `gray-matter` deps (Task 1) → ✅ all addressed
- §5 What's NOT in v1 — explicitly skipped: per-article OG, search, comments, newsletter, multi-language, audio. No tasks here address them → ✅ correctly excluded
- §7 Success metrics — measured manually post-ship, not implemented as code → n/a

**Placeholder scan:** none. Every step has actual content (markdown, code, or shell commands).

**Type/name consistency:**
- `getArticles()` / `getArticleBySlug(slug)` consistent in loader (Task 3), hub page (Task 4 +Page + +Head), article page (Task 5 +onBeforeRender).
- Article frontmatter fields (`title`, `slug`, `dek`, `published_at`, `updated_at`, `eta_min`, `keywords`) consistent between the markdown frontmatter (Task 2), test assertions (Task 3 Step 1), hub rendering (Task 4 Step 2), and article rendering (Task 5 Step 3).
- `pageProps.article` shape consistent between `+onBeforeRender.js` (Task 5 Step 1), `+Page.jsx` (Task 5 Step 3), `+Head.jsx` (Task 5 Step 4).

**Open follow-ups for subsequent commits (NOT this plan):**

- Author the remaining four v1 articles: `just-got-laid-off-week-1-plan`, `negotiate-severance-tech-layoff`, `cobra-vs-marketplace-insurance`, `linkedin-opentowork-after-layoff`. Each is one commit adding a single `.md` file — no new infrastructure needed.
- Per-article OG endpoint at `/api/og/playbook/[slug]`.
- Sitemap pinging via `GET https://www.google.com/ping?sitemap=https://hyrly.ai/sitemap-playbook.xml` once the article count is 5+.
