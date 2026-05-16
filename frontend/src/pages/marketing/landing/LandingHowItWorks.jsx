export function LandingHowItWorks({ steps }) {
  return (
    <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
      <div className="animate-in-delay-2" style={{ textAlign: "center", marginBottom: 56 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12,
        }}>How it works</h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
          From profile to placement in four simple steps
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
        {steps.map((step, i) => (
          <div key={i} className={`animate-in-delay-${i + 1}`} style={{
            background: "white", borderRadius: 20, padding: 32,
            border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            }}>
              <div aria-hidden="true" style={{
                width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,107,91,0.08)", color: "var(--coral)",
              }}>
                {step.icon}
              </div>
              <span style={{
                fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700,
                color: "var(--text-muted)", letterSpacing: "0.04em",
              }}>{step.num}</span>
            </div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700,
              color: "var(--ink)", marginBottom: 8,
            }}>{step.title}</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
