export function LandingCTAFooter({ onGetStarted, onNavigate }) {
  return (
    <>
      {/* CTA Footer */}
      <section style={{
        padding: "80px 48px", textAlign: "center",
        background: "var(--ink)", color: "var(--cream)", margin: "64px 0 0",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700,
          letterSpacing: "-0.02em", marginBottom: 16,
        }}>Ready to accelerate your career?</h2>
        <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", marginBottom: 36, maxWidth: 520, margin: "0 auto 36px" }}>
          AI career counseling, voice mock interviews, multi-provider job search, and smart matching — all free to start.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={onGetStarted} style={{
            padding: "14px 36px", borderRadius: 12, border: "none",
            background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
          }}>Create Free Account</button>
          <button onClick={() => onNavigate("features")} style={{
            padding: "14px 36px", borderRadius: 12, border: "1.5px solid rgba(250,248,245,0.2)",
            background: "transparent", color: "var(--cream)", fontSize: 16, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
          }}>See Features</button>
        </div>
      </section>

      {/* Footer */}
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
    </>
  );
}
