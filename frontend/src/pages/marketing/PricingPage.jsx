import { useState, useEffect } from 'react';
import GlobalStyles from '../../styles/GlobalStyles';
import Icons from '../../components/ui/Icons';
import PublicNav from '../../components/PublicNav';

const PricingPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const plans = [
    {
      name: "Seeker Free", price: 0, annual: 0, accent: "var(--coral)", badge: null,
      desc: "Everything you need to land your next role",
      features: ["20 AI matches per week", "1 resume profile", "Unlimited applications", "5 active chat threads", "Basic job search filters"],
    },
    {
      name: "Recruiter Starter", price: 49, annual: 39, accent: "var(--sage)", badge: "Most Popular",
      desc: "Essential tools for growing recruiting teams",
      features: ["Full candidate database access", "3 active job roles", "50 pipeline candidates", "Unlimited chat", "Basic analytics"],
    },
    {
      name: "Recruiter Pro", price: 129, annual: 103, accent: "var(--lavender)", badge: null,
      desc: "Advanced features for high-volume hiring",
      features: ["Unlimited job roles", "Advanced analytics & reports", "Automation workflows", "Priority support", "Custom pipeline stages"],
    },
    {
      name: "Company Enterprise", price: -1, annual: -1, accent: "var(--gold)", badge: null,
      desc: "Tailored solutions for large organizations",
      features: ["Unlimited seats & roles", "SSO & SAML integration", "API access", "Dedicated account manager", "99.9% SLA guarantee"],
    },
  ];

  const faqs = [
    { q: "Can I switch plans at any time?", a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle, and we'll prorate any differences." },
    { q: "Is there a free trial for paid plans?", a: "All paid plans come with a 14-day free trial. No credit card required to start — you'll only be charged when the trial ends and you choose to continue." },
    { q: "What are the limits on the free plan?", a: "The Seeker Free plan includes 20 AI match scores per week, 1 resume profile, unlimited job applications, and up to 5 active chat conversations." },
    { q: "Do you offer nonprofit or education discounts?", a: "Yes, we offer a 30% discount for registered nonprofits and educational institutions. Contact our sales team to get set up." },
    { q: "How do you handle data security?", a: "All data is encrypted at rest and in transit. We use Supabase with Row Level Security, and our infrastructure is SOC 2 Type II compliant." },
    { q: "What's your cancellation policy?", a: "You can cancel at any time from your account settings. You'll retain access to paid features through the end of your current billing period." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: "80px 48px 40px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 16,
        }}>The right plan for every team</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Start free and scale as you grow. No hidden fees, no surprises.
        </p>

        {/* Billing Toggle */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: "white", padding: "6px 8px", borderRadius: 12, border: "1px solid var(--border)" }}>
          <button onClick={() => setBillingCycle("monthly")} style={{
            padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
            background: billingCycle === "monthly" ? "var(--ink)" : "transparent",
            color: billingCycle === "monthly" ? "var(--cream)" : "var(--text-secondary)",
          }}>Monthly</button>
          <button onClick={() => setBillingCycle("annual")} style={{
            padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
            background: billingCycle === "annual" ? "var(--ink)" : "transparent",
            color: billingCycle === "annual" ? "var(--cream)" : "var(--text-secondary)",
          }}>Annual <span style={{ color: "var(--coral)", fontWeight: 700, fontSize: 12 }}>-20%</span></button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: "40px 48px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {plans.map((plan, i) => {
            const displayPrice = plan.price === -1 ? null : billingCycle === "annual" ? plan.annual : plan.price;
            return (
              <div key={i} style={{
                background: "white", borderRadius: 20, border: plan.badge ? `2px solid ${plan.accent}` : "1px solid var(--border)",
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
                <div style={{ fontSize: 13, fontWeight: 600, color: plan.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{plan.name}</div>
                <div style={{ marginBottom: 8 }}>
                  {displayPrice !== null ? (
                    <>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, color: "var(--ink)" }}>${displayPrice}</span>
                      {displayPrice > 0 && <span style={{ fontSize: 15, color: "var(--text-muted)" }}>/mo</span>}
                      {displayPrice === 0 && <span style={{ fontSize: 15, color: "var(--text-muted)", marginLeft: 4 }}>forever</span>}
                    </>
                  ) : (
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: "var(--ink)" }}>Custom</span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.5 }}>{plan.desc}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  {plan.features.map((feat, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                      <span style={{ color: plan.accent, flexShrink: 0, marginTop: 2 }}>{Icons.check}</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <button onClick={displayPrice === null ? undefined : onGetStarted} style={{
                  width: "100%", padding: "12px 24px", borderRadius: 10, border: "none",
                  background: plan.badge ? plan.accent : "var(--ink)", color: "white",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
                  transition: "all 0.2s",
                }}>{displayPrice === null ? "Contact Sales" : displayPrice === 0 ? "Get Started Free" : "Start Free Trial"}</button>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section style={{ padding: "0 48px 80px", maxWidth: 700, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48,
        }}>Frequently asked questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden",
              transition: "all 0.2s",
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
        padding: "80px 48px", textAlign: "center",
        background: "var(--ink)", color: "var(--cream)",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700,
          letterSpacing: "-0.02em", marginBottom: 16,
        }}>Start free today</h2>
        <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Join thousands of professionals finding their perfect match with Hyrly.
        </p>
        <button onClick={onGetStarted} style={{
          padding: "14px 36px", borderRadius: 12, border: "none",
          background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
          boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
        }}>Create Free Account</button>
      </section>

      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <span>© 2026 Hyrly. Built with AI.</span>
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
