import { useEffect } from 'react';
import GlobalStyles from '../../styles/GlobalStyles';
import Icons from '../../components/ui/Icons';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import PublicNav from '../../components/PublicNav';

const AboutPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const values = [
    { icon: Icons.target, title: "Transparency", desc: "Clear match scores, honest pricing, and open communication at every step." },
    { icon: Icons.zap, title: "Speed", desc: "From profile to interview in 48 hours — because great talent doesn't wait." },
    { icon: Icons.check, title: "Fairness", desc: "AI that evaluates skills and fit, removing bias from the hiring process." },
    { icon: Icons.doc, title: "Privacy", desc: "Your data belongs to you. Row-level security and encryption by default." },
    { icon: Icons.spark, title: "Intelligence", desc: "Matching algorithms that get smarter with every interaction on the platform." },
    { icon: Icons.users, title: "Community", desc: "A marketplace that works for everyone — seekers, recruiters, and companies alike." },
  ];

  const team = [
    { name: "Alex Rivera", role: "CEO & Co-founder", initials: "AR", bio: "Former VP of Talent at a Fortune 500. Spent a decade frustrated by broken hiring tools." },
    { name: "Jamie Chen", role: "CTO & Co-founder", initials: "JC", bio: "Ex-Google engineer who built ML systems at scale. Believes AI should serve people, not replace them." },
    { name: "Morgan Hayes", role: "Head of Product", initials: "MH", bio: "Product leader from LinkedIn and Indeed. Obsessed with making complex workflows feel simple." },
    { name: "Sam Patel", role: "Head of Growth", initials: "SP", bio: "Growth veteran from Stripe and Notion. Focused on building a platform people genuinely love." },
  ];

  const stats = [
    { value: "10,000+", label: "Matches Made" },
    { value: "500+", label: "Companies" },
    { value: "96%", label: "Satisfaction" },
    { value: "48h", label: "Avg First Interview" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: "80px 48px 60px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
          background: "rgba(155,143,212,0.1)", color: "var(--lavender)", marginBottom: 24, letterSpacing: "0.02em",
        }}>Our Story</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 16,
        }}>Built by people who've been on both sides of the table</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          We've been the candidate refreshing our inbox, the recruiter drowning in spreadsheets, and the hiring manager struggling to find signal in the noise. Hyrly exists because we knew there had to be a better way.
        </p>
      </section>

      {/* Mission Quote */}
      <section style={{ padding: "40px 48px 80px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <blockquote style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 500,
          color: "var(--ink)", lineHeight: 1.4, fontStyle: "italic", letterSpacing: "-0.01em",
          borderLeft: "4px solid var(--coral)", paddingLeft: 32, textAlign: "left", margin: "0 auto", maxWidth: 700,
        }}>
          "Hiring should feel like a conversation, not a transaction. We're building the platform that makes that possible."
        </blockquote>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 20, textAlign: "left", paddingLeft: 32, maxWidth: 700, margin: "20px auto 0" }}>
          — Alex Rivera, CEO
        </p>
      </section>

      {/* How It Works */}
      <section style={{ padding: "64px 48px", background: "white", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
            color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 56,
          }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 24, alignItems: "center" }}>
            {/* Job Seekers */}
            <div style={{ textAlign: "center", padding: 24 }}>
              <div style={{ color: "var(--coral)", marginBottom: 16, display: "flex", justifyContent: "center" }}>{Icons.user}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Job Seekers</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>Create profiles, get matched, apply with one click</p>
            </div>
            <div style={{ color: "var(--coral)", fontSize: 24 }}>→</div>
            {/* Platform */}
            <div style={{ textAlign: "center", padding: 32, background: "var(--cream)", borderRadius: 20, border: "1px solid var(--border)" }}>
              <div style={{ color: "var(--ink)", marginBottom: 16, display: "flex", justifyContent: "center" }}>{Icons.logo}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Hyrly Platform</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>AI matching, real-time chat, analytics</p>
            </div>
            <div style={{ color: "var(--lavender)", fontSize: 24 }}>←</div>
            {/* Companies */}
            <div style={{ textAlign: "center", padding: 24 }}>
              <div style={{ color: "var(--lavender)", marginBottom: 16, display: "flex", justifyContent: "center" }}>{Icons.building}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Companies</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>Post roles, review candidates, hire faster</p>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 12, background: "rgba(126,184,158,0.1)", border: "1px solid rgba(126,184,158,0.2)" }}>
              <span style={{ color: "var(--sage)" }}>{Icons.users}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--sage)" }}>Recruiters bridge both sides</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "64px 48px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>{stat.value}</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values Grid */}
      <section style={{ padding: "0 48px 80px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48,
        }}>What we stand for</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {values.map((v, i) => (
            <Card key={i} hover style={{ padding: 28 }}>
              <div style={{ color: "var(--coral)", marginBottom: 16, opacity: 0.9 }}>{v.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{v.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{v.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: "64px 48px", background: "white", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
            color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48,
          }}>The team behind Hyrly</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {team.map((person, i) => (
              <div key={i} style={{ textAlign: "center", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <Avatar initials={person.initials} size={64} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{person.name}</h3>
                <p style={{ fontSize: 13, color: "var(--coral)", fontWeight: 600, marginBottom: 12 }}>{person.role}</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{person.bio}</p>
              </div>
            ))}
          </div>
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
        }}>Join the Hyrly community</h2>
        <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Whether you're hiring or looking, we're building the future of work together.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={onGetStarted} style={{
            padding: "14px 36px", borderRadius: 12, border: "none",
            background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
            boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
          }}>Get Started Free</button>
          <button onClick={() => onNavigate("features")} style={{
            padding: "14px 36px", borderRadius: 12, border: "1.5px solid rgba(250,248,245,0.2)",
            background: "transparent", color: "var(--cream)", fontSize: 16, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
          }}>See How It Works</button>
        </div>
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

export default AboutPage;
