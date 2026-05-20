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
