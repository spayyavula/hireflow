export function LandingAIFeatures({ aiFeatures }) {
  return (
    <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
          background: "linear-gradient(135deg, rgba(255,107,91,0.08), rgba(155,143,212,0.08))",
          color: "var(--coral)", marginBottom: 16,
        }}>What makes us different</div>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12,
        }}>AI that actually helps your career</h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto" }}>
          Not just another job board — a complete career platform powered by AI
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {aiFeatures.map((f, i) => (
          <div key={i} className={`animate-in-delay-${i + 1}`} style={{
            background: "white", borderRadius: 20, padding: 32,
            border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
            display: "flex", gap: 24, alignItems: "flex-start",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(13,13,15,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,13,15,0.04)"; }}
          >
            <div aria-hidden="true" style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: f.accentBg, color: f.accent,
            }}>{f.icon}</div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700,
                color: "var(--ink)", marginBottom: 8,
              }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 14 }}>{f.desc}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {f.tags.map(tag => (
                  <span key={tag} style={{
                    padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: f.accentBg, color: f.accent,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
