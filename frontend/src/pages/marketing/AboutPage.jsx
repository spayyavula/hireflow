import { useEffect } from 'react';
import GlobalStyles from '../../styles/GlobalStyles';
import PublicNav from '../../components/PublicNav';

const AboutPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: "80px 48px 40px", textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
          background: "rgba(155,143,212,0.1)", color: "var(--lavender)", marginBottom: 24, letterSpacing: "0.02em",
        }}>About</div>
        <img
          src="/founder.png"
          alt="Sreekanth Payyavula"
          width="120"
          height="120"
          style={{
            width: 120, height: 120, borderRadius: "50%", objectFit: "cover",
            display: "block", margin: "0 auto 20px",
            border: "3px solid white", boxShadow: "0 6px 24px rgba(13,13,15,0.10)",
          }}
        />
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 52px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 16,
        }}>Built by Sreekanth Payyavula in San Jose.</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          No team yet. No funding. No fabricated testimonials. Just a tool I wish my friends had had — and that I'll use myself the next time I need it.
        </p>
      </section>

      {/* The story */}
      <section style={{ padding: "32px 48px 64px", maxWidth: 680, margin: "0 auto", fontSize: 17, color: "var(--text-primary)", lineHeight: 1.75 }}>
        <p style={{ marginBottom: 20 }}>
          Hyrly is built by one engineer. I started it after watching too many friends get the news during the 2024–2026 tech layoff wave and realizing that every existing tool in the space either oversold what it could do, overcharged people who were already cash-strapped, or wasted their time during the window when time mattered most.
        </p>
        <p style={{ marginBottom: 20 }}>
          The version of Hyrly you're using today is narrow on purpose: an AI coach for engineers in their first 30–90 days post-layoff, plus a 5-article playbook on the things that actually matter in week 1 (visa, severance, finances, resume, LinkedIn). If that's you, the triage takes 3 minutes and the rest of the product is built around what you tell it.
        </p>
        <p style={{ marginBottom: 20 }}>
          Recruiter and hiring-side tools are in private beta — <a href="mailto:sreekanth@hyrly.ai" style={{ color: "var(--coral)", fontWeight: 600 }}>sreekanth@hyrly.ai</a> for early access.
        </p>
        <p style={{ marginBottom: 0 }}>
          Honest about what this is and what it isn't. If Hyrly helps you, tell me what to fix: <a href="mailto:sreekanth@hyrly.ai" style={{ color: "var(--coral)", fontWeight: 600 }}>sreekanth@hyrly.ai</a>. Real reply, usually within a day.
        </p>
      </section>

      {/* Last updated */}
      <section style={{ padding: "0 48px 48px", maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
          Last updated: May 20, 2026 — written by Sreekanth Payyavula.
        </p>
      </section>

      {/* What this is / isn't */}
      <section style={{ padding: "0 48px 64px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}>
          <div style={{
            background: "white", borderRadius: 16, padding: 24,
            border: "1px solid var(--border)",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--sage)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>What this is</h3>
            <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <li>An AI coach for laid-off tech engineers</li>
              <li>A free 10-question triage that ranks your week-1 priorities</li>
              <li>A 5-article playbook on layoff-specific decisions</li>
              <li>One person's careful side project, not a VC-funded launch</li>
            </ul>
          </div>
          <div style={{
            background: "white", borderRadius: 16, padding: 24,
            border: "1px solid var(--border)",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--coral)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>What it isn't (yet)</h3>
            <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <li>A finished three-sided marketplace</li>
              <li>A team of ex-Google / LinkedIn / Stripe people</li>
              <li>A 10,000-user platform with case studies</li>
              <li>A replacement for an immigration attorney or financial advisor</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
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

export default AboutPage;
