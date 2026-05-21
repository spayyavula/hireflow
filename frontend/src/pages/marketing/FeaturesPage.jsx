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
          Hiring manager or recruiter and the broader-platform language elsewhere on this site caught your eye? Email <a href="mailto:sreekanth@hyrly.ai" style={{ color: "var(--coral)", fontWeight: 600 }}>sreekanth@hyrly.ai</a> — that path exists but isn't where the brand is focused today.
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
