# Hyrly Option-A: Brand Coherence Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `/features`, `/pricing`, and `/roadmap` so the public marketing surface tells one coherent story (laid-off-engineer wedge) instead of three contradicting ones (homepage = coach, Features = three-sided platform, Pricing = B2B SaaS).

**Architecture:** Content + UI rewrites only — no backend changes. Replace the source-of-truth marketing components (`FeaturesPage.jsx`, `PricingPage.jsx`) wholesale; replace the Vike `/roadmap` route entry to render a new `StaticRoadmap.jsx` component instead of the IdeasBoard. The IdeasBoard component itself stays in the codebase, just not mounted at `/roadmap`. All `+config.js` SEO metadata updated.

**Tech Stack:** Vite + React 18 + Vitest, Vike SSR.

**Spec:** [`docs/superpowers/specs/2026-05-20-hyrly-option-a-coherence-design.md`](../specs/2026-05-20-hyrly-option-a-coherence-design.md)

---

## File Structure

**Modified (wholesale rewrites):**
- `frontend/src/pages/marketing/FeaturesPage.jsx`
- `frontend/src/pages/marketing/PricingPage.jsx`
- `frontend/pages/features/+config.js`
- `frontend/pages/pricing/+config.js`
- `frontend/pages/roadmap/+config.js`
- `frontend/pages/roadmap/+Page.jsx`

**New:**
- `frontend/src/pages/marketing/StaticRoadmap.jsx`

**Untouched:**
- `frontend/src/pages/marketing/IdeasBoard.jsx` and friends (stay in codebase; not mounted at /roadmap)
- All backend code
- All `/app` authenticated routes (recruiter / company features still work there)
- Homepage `+Page.jsx` + Playbook + LP2 plan

---

## Task 1: Rewrite `FeaturesPage.jsx` (full file replacement)

**Files:**
- Modify: `frontend/src/pages/marketing/FeaturesPage.jsx`

**Context:** Current file has a 3-tab interface (Seekers / Recruiters / Companies) with 8/5/5 features per tab, a comparison table with 9 rows of seeker-vs-recruiter-vs-company checkmarks, and CTAs aimed at "everyone." Rewrite to a single-audience page (laid-off tech engineers) organized around five capability blocks in priority order. Drop the audience tabs, drop the comparison table, drop the "Ready to get started?" generic CTA, and replace with a triage-aimed CTA.

- [ ] **Step 1: Replace the file wholesale**

Open `frontend/src/pages/marketing/FeaturesPage.jsx` and replace its **entire contents** with:

```jsx
import { useEffect } from 'react';
import GlobalStyles from '../../styles/GlobalStyles';
import Icons from '../../components/ui/Icons';
import Card from '../../components/ui/Card';
import PublicNav from '../../components/PublicNav';

const FeaturesPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const capabilities = [
    {
      icon: Icons.scout, accent: "var(--coral)",
      title: "Scout AI — your career coach",
      desc: "An AI coach for the 13 things that actually matter in the first 90 days post-layoff: visa clock, severance, finances, resume, networking, interview prep, career direction, and the rest. Not a job-board chatbot — a coach that knows what week 1 looks like.",
      bullets: [
        "Trained on the layoff-specific decisions, not generic career advice",
        "Hands off cleanly between domains as the conversation moves",
        "Free to start; unlimited on the paid tier",
      ],
    },
    {
      icon: Icons.target, accent: "var(--sage)",
      title: "Layoff Triage — get your week-1 priorities ranked",
      desc: "10 questions, 3 minutes, no signup. Get a personalized priority plan: what to do today, what's actually urgent (vs what just feels urgent), and a hand-off to Scout AI with full context preloaded.",
      bullets: [
        "Anonymous — no email, no signup, no account",
        "H-1B / visa-aware: surfaces the 60-day clock as priority #1 when relevant",
        "Severance-aware: nudges negotiation when the runway is tight",
      ],
    },
    {
      icon: Icons.doc, accent: "var(--lavender)",
      title: "The Playbook — deep guides on the things that actually matter",
      desc: "5 hand-written articles (~11,000 words) on the layoff-specific decisions: H-1B 60-day rule, week-1 priorities, severance negotiation, COBRA vs marketplace insurance, LinkedIn announcement protocol. No urgency tactics, no AI slop — written like a friend who's been through it.",
      bullets: [
        "Each article cross-linked to the Triage and to Scout AI",
        "Authoritative enough to be cited by AI search (ChatGPT, Claude, Perplexity)",
        "Free, indexed, no paywall",
      ],
    },
    {
      icon: Icons.mic, accent: "var(--coral)",
      title: "Voice Mock Interviews — when you're ready to interview",
      desc: "Practice live interviews by voice. Wispr-powered transcription, STAR-method scoring, instant feedback on every answer. Burn the rust on a mock before you burn it on a real interview.",
      bullets: [
        "Pulls questions tailored to the JD you paste in",
        "Voice or text — your choice",
        "Available in the Hyrly Coach tier",
      ],
    },
    {
      icon: Icons.spark, accent: "var(--sage)",
      title: "AI Job Matching — when you're ready to apply",
      desc: "Aggregated search across 5+ public job-board APIs and open data sources. Every job gets a 0–99 match score against your profile so you can spend your application time on the 12 that fit instead of the 200 that don't.",
      bullets: [
        "Deduplicated across sources",
        "Match score explained, not just shown",
        "Optional — many users never need this once Scout + the network are working",
      ],
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: "80px 48px 40px", textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
          background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 24, letterSpacing: "0.02em",
        }}>What's inside</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 52px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 16,
        }}>Built for the first 90 days after a tech layoff.</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          Five capabilities, in the order you'll actually use them. No three-sided marketplace pitch, no "transform your career" copy — just the tools that move the needle in week 1 vs the ones that feel productive but don't.
        </p>
      </section>

      {/* Capabilities — vertical stack, in priority order */}
      <section style={{ padding: "32px 48px 80px", maxWidth: 880, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {capabilities.map((c, i) => (
            <Card key={i} hover style={{ padding: 32 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                <div style={{
                  flexShrink: 0, width: 48, height: 48, borderRadius: 12,
                  background: `${c.accent.replace('var(--', 'rgba(').replace(')', '')}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: c.accent, opacity: 1,
                }}>{c.icon}</div>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.accent, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "var(--ink)", marginBottom: 12, letterSpacing: "-0.01em" }}>{c.title}</h3>
                  <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 14 }}>{c.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {c.bullets.map((b, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                        <span style={{ color: c.accent, flexShrink: 0, marginTop: 4 }}>{Icons.check}</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Hiring-side acknowledgement */}
      <section style={{ padding: "0 48px 64px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, fontStyle: "italic" }}>
          Hiring manager or recruiter and the broader-platform language elsewhere on this site caught your eye? Email <a href="mailto:hello@hyrly.ai" style={{ color: "var(--coral)", fontWeight: 600 }}>hello@hyrly.ai</a> — that path exists but isn't where the brand is focused today.
        </p>
      </section>

      {/* CTA Banner */}
      <section style={{
        padding: "64px 48px", textAlign: "center",
        background: "var(--ink)", color: "var(--cream)",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700,
          letterSpacing: "-0.02em", marginBottom: 16,
        }}>If you just got laid off, start here.</h2>
        <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
          10 questions. 3 minutes. No signup. Free.
        </p>
        <a href="/" style={{
          display: "inline-block", padding: "14px 32px", borderRadius: 12, border: "none",
          background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
          textDecoration: "none", boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
        }}>Start the Hyrly Triage →</a>
      </section>

      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <span>© 2026 Hyrly.</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/terms" style={{ color: "rgba(250,248,245,0.45)", textDecoration: "none", fontSize: 12 }}>Terms</a>
          <a href="/privacy" style={{ color: "rgba(250,248,245,0.45)", textDecoration: "none", fontSize: 12 }}>Privacy</a>
          <a href="/help" style={{ color: "rgba(250,248,245,0.45)", textDecoration: "none", fontSize: 12 }}>Help</a>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
```

- [ ] **Step 2: Update `/features/+config.js` SEO**

Open `frontend/pages/features/+config.js` and replace its contents with:

```js
export default {
  title: 'Features | Hyrly',
  description:
    'What\'s actually inside Hyrly: Scout AI coach, Layoff Triage, the Playbook, voice mock interviews, AI job matching. Built for engineers in the first 90 days after a tech layoff.',
};
```

- [ ] **Step 3: Run tests**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test 2>&1 | tail -6
```
Expected: PASS — 51/51 (no test currently asserts Features-page content).

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/pages/marketing/FeaturesPage.jsx frontend/pages/features/+config.js
git commit -m "$(cat <<'EOF'
feat(features): rewrite /features for the laid-off-engineer wedge (Option-A)

Drops the 3-tab Seekers/Recruiters/Companies interface and the 9-row
comparison table. Replaces with five capability blocks in priority
order: Scout AI -> Layoff Triage -> Playbook -> Voice Mock Interviews
-> AI Job Matching. Single audience, single voice. Drops "Everything
you need to hire and get hired" framing; replaces with "Built for the
first 90 days after a tech layoff." Recruiter/hiring-manager path
acknowledged in one italic line at the bottom with the real email.

SEO description rewritten to match the new positioning.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Rewrite `PricingPage.jsx` (full file replacement)

**Files:**
- Modify: `frontend/src/pages/marketing/PricingPage.jsx`

**Context:** Current file has 4 B2B tiers (Seeker Free / Recruiter Starter $49 / Recruiter Pro $129 / Company Enterprise) with a monthly/annual toggle and 6 SaaS FAQs (cancellation policy, SSO, SOC 2, etc.). Replace with 3 consumer tiers aligned to the LP3 spec. Drop the recruiter/company tiers entirely (no comment, no "coming soon"). The two paid tiers use a "Reserve your spot" button that links to `mailto:hello@hyrly.ai?subject=Hyrly%20Coach%20signup` until LP3 ships Stripe — explicit honest framing in the page copy.

Rewrite the FAQ to match the new consumer pricing too — drop SOC 2 + SSO questions (irrelevant); add questions about what the free tier includes, what happens after 3 free Scout sessions, the Layoff Sprint bundle, the refund policy.

- [ ] **Step 1: Replace the file wholesale**

Open `frontend/src/pages/marketing/PricingPage.jsx` and replace its **entire contents** with:

```jsx
import { useState, useEffect } from 'react';
import GlobalStyles from '../../styles/GlobalStyles';
import Icons from '../../components/ui/Icons';
import PublicNav from '../../components/PublicNav';

const PricingPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const [openFaq, setOpenFaq] = useState(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const plans = [
    {
      name: "Free",
      price: "$0",
      cadence: "forever",
      accent: "var(--sage)",
      badge: null,
      desc: "Everything most people need in week 1.",
      features: [
        "Layoff Triage — 10 questions, 3 minutes",
        "The Playbook — all 5 articles",
        "Scout AI — 3 sessions",
        "AI Job Matching — basic search",
      ],
      ctaLabel: "Start the Triage",
      ctaHref: "/",
    },
    {
      name: "Hyrly Coach",
      price: "$29",
      cadence: "/month",
      accent: "var(--coral)",
      badge: "Most popular",
      desc: "When 3 Scout sessions isn't enough and you want a coach who's there for the whole search.",
      features: [
        "Unlimited Scout AI sessions",
        "Voice Mock Interviews — unlimited",
        "AI Job Matching — full features",
        "Conversation memory across sessions",
        "Cancel anytime; pricing locked for first 100 users",
      ],
      ctaLabel: "Reserve your spot",
      ctaHref: "mailto:hello@hyrly.ai?subject=Hyrly%20Coach%20signup&body=I%27d%20like%20to%20be%20one%20of%20the%20first%20100.",
    },
    {
      name: "Layoff Sprint",
      price: "$99",
      cadence: "one-time, 30 days",
      accent: "var(--lavender)",
      badge: null,
      desc: "One-time bundle for the person who'd rather pay once than subscribe.",
      features: [
        "30 days of unlimited Hyrly Coach",
        "Includes voice interviews + AI matching",
        "A personal week-1 audit by the founder (real human, 30 min)",
        "Severance + offer review on the same call",
      ],
      ctaLabel: "Reserve your spot",
      ctaHref: "mailto:hello@hyrly.ai?subject=Layoff%20Sprint%20signup&body=I%27d%20like%20to%20book%20a%20Layoff%20Sprint.",
    },
  ];

  const faqs = [
    {
      q: "Is the Layoff Triage really free?",
      a: "Yes. The 10-question Triage, all 5 Playbook articles, and 3 Scout AI sessions are free forever, no signup, no email collection. The paid tiers are for people who want unlimited Scout coaching across their full search.",
    },
    {
      q: "Can I actually pay for Hyrly Coach today?",
      a: "Not yet — Stripe Checkout is being wired up. For now, hit 'Reserve your spot' and you'll be one of the first 100 users when it launches. Pricing won't change for you. (And no, you won't be bombarded with marketing — the email goes directly to the founder, who replies personally.)",
    },
    {
      q: "What happens after my 3 free Scout sessions?",
      a: "You can keep using the Triage, the Playbook, and the AI Job Matching for free indefinitely. Scout AI specifically becomes paywalled at 3 sessions unless you upgrade to Hyrly Coach or buy the Layoff Sprint.",
    },
    {
      q: "What's actually in the founder week-1 audit (Layoff Sprint)?",
      a: "A real 30-minute call with the human who built Hyrly. We'll go through your severance offer, your runway numbers, your visa timeline if applicable, your network, and your week-1 priorities. You leave with a written summary of next steps. It's a side benefit; the bigger reason to buy the Sprint is the 30 days of unlimited Coach.",
    },
    {
      q: "Refund policy?",
      a: "Hyrly Coach: cancel anytime, no questions. If you've paid for a month and decide it's not for you, email hello@hyrly.ai within 30 days and you get a full refund. Layoff Sprint: 7-day money-back if the founder call hasn't happened yet.",
    },
    {
      q: "What about my data?",
      a: "Triage responses + Scout conversations are stored under your session. If you signed up for Coach or Sprint, your account is linked. Email hello@hyrly.ai to delete everything anytime — it's a 1-line database delete on this side; takes a day to honor at most.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: "80px 48px 40px", textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 52px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 16,
        }}>Pricing</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          Free for the things most people need in week 1. Paid for unlimited coaching across the whole search.
        </p>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: "32px 48px 64px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              background: "white", borderRadius: 20,
              border: plan.badge ? `2px solid ${plan.accent}` : "1px solid var(--border)",
              padding: 32, display: "flex", flexDirection: "column", position: "relative",
              transition: "all 0.25s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(13,13,15,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {plan.badge && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: plan.accent, color: "white",
                }}>{plan.badge}</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: plan.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{plan.name}</div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, color: "var(--ink)" }}>{plan.price}</span>
                <span style={{ fontSize: 15, color: "var(--text-muted)", marginLeft: 4 }}>{plan.cadence}</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.55 }}>{plan.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {plan.features.map((feat, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                    <span style={{ color: plan.accent, flexShrink: 0, marginTop: 2 }}>{Icons.check}</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <a href={plan.ctaHref} style={{
                width: "100%", padding: "12px 24px", borderRadius: 10, border: "none",
                background: plan.badge ? plan.accent : "var(--ink)", color: "white",
                fontSize: 14, fontWeight: 700, fontFamily: "'Source Sans 3', sans-serif",
                textDecoration: "none", textAlign: "center", display: "inline-block",
                transition: "all 0.2s",
              }}>{plan.ctaLabel}</a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "0 48px 80px", maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48,
        }}>FAQ</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden",
            }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                width: "100%", padding: "20px 24px", border: "none", background: "transparent",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", textAlign: "left" }}>{faq.q}</span>
                <span style={{
                  color: "var(--text-muted)", transition: "transform 0.2s", flexShrink: 0, marginLeft: 16,
                  transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                }}>{Icons.plus}</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "0 24px 20px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        padding: "64px 48px", textAlign: "center",
        background: "var(--ink)", color: "var(--cream)",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700,
          letterSpacing: "-0.02em", marginBottom: 16,
        }}>Start with the free Triage.</h2>
        <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
          Hyrly is brand-new — the first 100 people using it directly shape what gets built next.
        </p>
        <a href="/" style={{
          display: "inline-block", padding: "14px 32px", borderRadius: 12, border: "none",
          background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
          textDecoration: "none", boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
        }}>Start the Hyrly Triage →</a>
      </section>

      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <span>© 2026 Hyrly.</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/terms" style={{ color: "rgba(250,248,245,0.45)", textDecoration: "none", fontSize: 12 }}>Terms</a>
          <a href="/privacy" style={{ color: "rgba(250,248,245,0.45)", textDecoration: "none", fontSize: 12 }}>Privacy</a>
          <a href="/help" style={{ color: "rgba(250,248,245,0.45)", textDecoration: "none", fontSize: 12 }}>Help</a>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
```

- [ ] **Step 2: Update `/pricing/+config.js`**

Open `frontend/pages/pricing/+config.js` and replace its contents with:

```js
export default {
  title: 'Pricing | Hyrly',
  description:
    'Free Layoff Triage + Playbook + 3 Scout AI sessions. Hyrly Coach $29/month for unlimited. Layoff Sprint $99 one-time bundle with a personal founder call. No B2B tiers, no contracts.',
};
```

- [ ] **Step 3: Run tests**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test 2>&1 | tail -6
```
Expected: PASS — 51/51.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/pages/marketing/PricingPage.jsx frontend/pages/pricing/+config.js
git commit -m "$(cat <<'EOF'
feat(pricing): rewrite /pricing for consumer tiers (Option-A)

Drops the 4 B2B tiers (Seeker Free / Recruiter $49 / Recruiter Pro $129
/ Company Enterprise) and the monthly/annual toggle. Replaces with 3
consumer tiers from the LP3 spec: Free / Hyrly Coach $29/mo / Layoff
Sprint $99 one-time. Paid tiers link to mailto:hello@hyrly.ai
("Reserve your spot") since Stripe Checkout is LP3's job; copy
explicitly explains this and commits to locked pricing for the first
100 users. FAQ rewritten for the new tiers — drops SOC 2 / SSO /
enterprise questions, adds "is this really free", "what after 3
sessions", "what's in the founder call", refund + data deletion.

SEO description rewritten accordingly.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `StaticRoadmap.jsx` and replace the `/roadmap` Vike route

**Files:**
- Create: `frontend/src/pages/marketing/StaticRoadmap.jsx`
- Modify: `frontend/pages/roadmap/+Page.jsx`
- Modify: `frontend/pages/roadmap/+config.js`

**Context:** Current `/roadmap` mounts `IdeasBoard` which renders an empty board (0 Ideas / 0 Votes / 0 Shipped) because the database has no items. Replace with a hand-curated static list of 10 real items with status tags. The IdeasBoard component file stays in place; the route just doesn't render it.

- [ ] **Step 1: Create the StaticRoadmap component**

Create `frontend/src/pages/marketing/StaticRoadmap.jsx`:

```jsx
import { useEffect } from 'react';
import GlobalStyles from '../../styles/GlobalStyles';
import PublicNav from '../../components/PublicNav';

const ITEMS = [
  // Shipped
  { title: 'Hyrly rebrand + canonical domain migration', status: 'shipped', when: 'May 2026',
    desc: 'JobsSearch -> Hyrly, jobssearch.work -> hyrly.ai, with 308 redirects + Google Indexing API migration.' },
  { title: 'Layoff Triage as homepage', status: 'shipped', when: 'May 2026',
    desc: 'Replaced the marketing landing with a 10-question Triage that hands off to Scout AI with full context.' },
  { title: 'Playbook v1 — five deep articles', status: 'shipped', when: 'May 2026',
    desc: '~11,000 words across H-1B 60-day rule, week-1 priorities, severance negotiation, COBRA vs marketplace, LinkedIn protocol.' },
  { title: 'Custom homepage OG image + trust line', status: 'shipped', when: 'May 2026',
    desc: 'Real founder credential under the CTA + designed @vercel/og card for social shares.' },

  // In progress
  { title: 'Scout AI hardening across 13 layoff domains', status: 'in_progress', when: 'May 2026',
    desc: 'Layoff-tuned coaching responses for visa, severance, finances, resume, networking, interview, career direction, plus chat-continuation UI + session memory.' },

  // Planned
  { title: 'Stripe billing for Hyrly Coach + Layoff Sprint', status: 'planned', when: 'June 2026',
    desc: 'Wires the Pricing page Reserve buttons to real checkout. Until it lands, signups go through hello@hyrly.ai.' },
  { title: '5 more Playbook articles', status: 'planned', when: 'June 2026',
    desc: 'Recruiter outreach scripts, FAANG vs startup decision framework, freelance bridge income, mental-health resources, LinkedIn announcement template.' },
  { title: 'Free Severance Calculator at /tools/severance', status: 'planned', when: 'June 2026',
    desc: 'Standalone tool that ranks your severance package against current market benchmarks. SEO entry point for high-intent queries.' },
  { title: 'Per-article custom OG images for the Playbook', status: 'planned', when: 'June 2026',
    desc: 'One @vercel/og endpoint per article. Improves share-card conversion in private channels (Slack alumni groups, Blind, WhatsApp).' },
  { title: 'LinkedIn announcement template generator', status: 'planned', when: 'Q3 2026',
    desc: 'Input your role + situation, get back a personalized announcement post + recruiter DM templates that match the playbook voice.' },
];

const STATUS_LABELS = {
  shipped: 'Shipped',
  in_progress: 'In progress',
  planned: 'Planned',
};

const STATUS_COLORS = {
  shipped: 'var(--sage)',
  in_progress: 'var(--coral)',
  planned: 'var(--lavender)',
};

const StaticRoadmap = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const counts = ITEMS.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: '80px 48px 32px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 4.5vw, 52px)', fontWeight: 700,
          lineHeight: 1.1, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 16,
        }}>Roadmap</h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
          A hand-curated list of what's shipped, what's in progress, and what's next. Not a community-vote board (yet) — this is the founder's plan, written honestly.
        </p>
      </section>

      {/* Counts strip */}
      <section style={{ padding: '0 48px 24px', maxWidth: 720, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
        {(['shipped', 'in_progress', 'planned']).map((key) => (
          <div key={key} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: STATUS_COLORS[key] }}>
              {counts[key] || 0}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
              {STATUS_LABELS[key]}
            </div>
          </div>
        ))}
      </section>

      {/* Items */}
      <section style={{ padding: '32px 48px 80px', maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ITEMS.map((item, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 16, padding: '20px 24px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-block', padding: '3px 12px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: `${STATUS_COLORS[item.status].replace('var(--', 'rgba(').replace(')', '')}`,
                  color: STATUS_COLORS[item.status],
                  border: `1px solid ${STATUS_COLORS[item.status]}`,
                }}>{STATUS_LABELS[item.status]}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.when}</span>
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700,
                color: 'var(--ink)', margin: 0, marginBottom: 6, lineHeight: 1.35,
              }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Idea-submission acknowledgement */}
      <section style={{ padding: '0 48px 48px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic' }}>
          Something you'd want built? Email <a href="mailto:hello@hyrly.ai" style={{ color: 'var(--coral)', fontWeight: 600 }}>hello@hyrly.ai</a>. The community-vote version of this page is in the codebase; it'll go live once there's a community.
        </p>
      </section>

      {/* CTA Banner */}
      <section style={{
        padding: '64px 48px', textAlign: 'center',
        background: 'var(--ink)', color: 'var(--cream)',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700,
          letterSpacing: '-0.02em', marginBottom: 16,
        }}>Want to be one of the first 100?</h2>
        <p style={{ fontSize: 16, color: 'rgba(250,248,245,0.6)', marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
          Pricing locks in. Founder reads every reply.
        </p>
        <a href="/" style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: 12, border: 'none',
          background: 'var(--coral)', color: 'white', fontSize: 16, fontWeight: 700,
          textDecoration: 'none', boxShadow: '0 4px 16px rgba(255,107,91,0.3)',
        }}>Start the Hyrly Triage →</a>
      </section>

      <footer style={{
        padding: '24px 48px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)',
        background: 'var(--ink)', borderTop: '1px solid rgba(250,248,245,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <span>© 2026 Hyrly.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/terms" style={{ color: 'rgba(250,248,245,0.45)', textDecoration: 'none', fontSize: 12 }}>Terms</a>
          <a href="/privacy" style={{ color: 'rgba(250,248,245,0.45)', textDecoration: 'none', fontSize: 12 }}>Privacy</a>
          <a href="/help" style={{ color: 'rgba(250,248,245,0.45)', textDecoration: 'none', fontSize: 12 }}>Help</a>
        </div>
      </footer>
    </div>
  );
};

export default StaticRoadmap;
```

- [ ] **Step 2: Update the Vike route to render StaticRoadmap**

Open `frontend/pages/roadmap/+Page.jsx` and replace its contents with:

```jsx
import StaticRoadmap from '../../src/pages/marketing/StaticRoadmap';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function Roadmap() {
  return <StaticRoadmap {...marketingNavProps('roadmap')} />;
}
```

- [ ] **Step 3: Update `/roadmap/+config.js` SEO**

Open `frontend/pages/roadmap/+config.js` and replace its contents with:

```js
export default {
  title: 'Roadmap | Hyrly',
  description:
    'What\'s shipped, what\'s in progress, and what\'s next. A hand-curated roadmap — not a community-vote board (yet).',
};
```

- [ ] **Step 4: Run tests**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test 2>&1 | tail -6
```
Expected: PASS — 51/51. (The existing `IdeasBoard.test.jsx` test should still pass since the IdeasBoard component itself is untouched.)

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/pages/marketing/StaticRoadmap.jsx frontend/pages/roadmap/+Page.jsx frontend/pages/roadmap/+config.js
git commit -m "$(cat <<'EOF'
feat(roadmap): static hand-curated roadmap (Option-A)

Drops the IdeasBoard mount at /roadmap (it was showing 0/0/0 counters
because no items were in the database). Replaces with a hand-curated
StaticRoadmap component listing 10 real items across Shipped / In
Progress / Planned status: Hyrly rebrand, Layoff Triage homepage,
Playbook v1, OG image + trust line, Scout AI hardening, Stripe
billing, 5 more articles, Severance Calculator, per-article OG, the
LinkedIn template generator.

IdeasBoard component file stays untouched — community-vote version
goes live once there's a community to vote.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Deploy + smoke-test all four pages

**Files:** none — deploy task.

- [ ] **Step 1: Push everything**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow && git push origin main 2>&1 | tail -3
```

- [ ] **Step 2: Rebuild + deploy frontend**

```bash
cd c:/Users/sreek/myprojects/jobshunter/hireflow/frontend && rm -rf .vercel/output dist && VITE_API_URL=https://hireflow-api.vercel.app VITE_SITE_URL=https://hyrly.ai vercel build --prod 2>&1 | tail -5 && vercel deploy --prebuilt --prod --yes 2>&1 | tail -3
```
Expected: build succeeds + deploy ready.

- [ ] **Step 3: Smoke-test the four pages live**

```bash
node -e "Promise.all([['features','Built for the first 90 days'],['pricing','Hyrly Coach'],['roadmap','hand-curated list'],['about','Built by one engineer in San Jose']].map(([slug,marker])=>fetch('https://hyrly.ai/'+slug).then(r=>r.text()).then(t=>console.log(slug+':',t.includes(marker)?'OK':'MISSING ('+marker+')')))).catch(e=>console.log('err',e.message))"
```
Expected: all four pages contain their expected marker text.

- [ ] **Step 4: Confirm zero remaining old-Hyrly framing**

```bash
node -e "Promise.all(['features','pricing','about'].map(s=>fetch('https://hyrly.ai/'+s).then(r=>r.text()).then(t=>{const bad=['Recruiter Starter','Recruiter Pro','Company Enterprise','Pipeline Management','Team Collaboration','three-sided','seekers, recruiters, and companies','Join thousands','10,000+'];const found=bad.filter(b=>t.includes(b));console.log(s+':',found.length===0?'clean':'STILL HAS '+JSON.stringify(found))}))).catch(e=>console.log('err',e.message))"
```
Expected: all three "clean". Any "STILL HAS" output is a remaining old-Hyrly artifact that needs follow-up.

- [ ] **Step 5: Confirm the homepage is still working**

```bash
node -e "fetch('https://hyrly.ai/').then(r=>r.text()).then(t=>console.log('home-still-works:',t.includes('Just got laid off')))"
```
Expected: `true`.

---

## Self-Review Notes

**Spec coverage** (`docs/superpowers/specs/2026-05-20-hyrly-option-a-coherence-design.md`):

- §3.1 `/features` rewrite (5 capability blocks, drop audience tabs + comparison table + hiring-side acknowledgement line) → ✅ Task 1
- §3.2 `/pricing` rewrite (3 consumer tiers, drop 4 B2B tiers + monthly/annual toggle, new FAQ) → ✅ Task 2
- §3.3 `/roadmap` rewrite (StaticRoadmap with 6-10 hand-curated items, IdeasBoard untouched) → ✅ Task 3 (10 items, matches "6-10" spec range)
- §3.4 Nav cleanup — Roadmap stays in nav since it's now populated → ✅ implicit (no PublicNav changes)
- §4 Scope OUT — Playbook author byline, per-article OG images, LP2 / LP3 not addressed by this plan ✓

**Placeholder scan:** No "TBD" / "implement later" / "fill in details". Every step has full code.

**Type/name consistency:**
- `StaticRoadmap` exported as default from `frontend/src/pages/marketing/StaticRoadmap.jsx` ↔ imported in `frontend/pages/roadmap/+Page.jsx` ✓
- `marketingNavProps('roadmap')` keeps working (it accepts any string)
- `capabilities` shape (`{icon, accent, title, desc, bullets[]}`) consistent across Task 1's FeaturesPage rewrite ✓
- `plans` shape (`{name, price, cadence, accent, badge, desc, features[], ctaLabel, ctaHref}`) consistent in Task 2 ✓
- `ITEMS` shape (`{title, status, when, desc}`) consistent in Task 3 ✓

**Follow-ups deferred to other plans / future commits:**

- LP2 Scout AI hardening (plan already written; resumes after Option-A ships)
- LP3 Stripe wiring (the Pricing page Reserve buttons need their `mailto:` → Stripe Checkout swap when LP3 ships)
- Playbook author byline + photo (Claude.ai's "this week" recommendation; depends on real-name decision)
- Per-article Playbook OG images (also from the Claude.ai review)
- 3-5 more Playbook articles
