export function LandingHero({ onGetStarted, onNavigate }) {
  return (
    <section style={{ position: "relative", padding: "100px 48px 80px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
      {/* Decorative orbs */}
      <div style={{
        position: "absolute", top: -40, right: -80, width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,107,91,0.12) 0%, transparent 70%)",
        animation: "float 6s ease-in-out infinite", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -20, left: -60, width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(155,143,212,0.10) 0%, transparent 70%)",
        animation: "float 8s ease-in-out infinite 1s", pointerEvents: "none",
      }} />

      <div className="animate-in" style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
          background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 24, letterSpacing: "0.02em",
        }}>
          AI Career Platform
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 20,
        }}>
          Your AI-powered <br />career partner
        </h1>
        <p style={{
          fontSize: 18, color: "var(--text-secondary)", maxWidth: 580, margin: "0 auto 40px",
          lineHeight: 1.7,
        }}>
          Smart job search across multiple providers, AI career counseling, voice mock interviews
          with real-time feedback, and everything you need to land your dream role.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={() => onNavigate("features")} style={{
            padding: "14px 36px", borderRadius: 12, border: "none",
            background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
          }}>See the Platform</button>
          <button onClick={onGetStarted} style={{
            padding: "14px 36px", borderRadius: 12, border: "1.5px solid var(--border-strong)",
            background: "transparent", fontSize: 16, fontWeight: 600,
            cursor: "pointer", color: "var(--text-primary)", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
          }}>Create Account</button>
        </div>
      </div>
    </section>
  );
}
