export function LandingStatsBar({ stats }) {
  return (
    <section className="animate-in-delay-1" style={{
      display: "flex", justifyContent: "center", gap: 0, padding: "0 48px 64px",
    }}>
      <div style={{
        display: "flex", gap: 0, background: "white", borderRadius: 16,
        border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
        overflow: "hidden",
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: "24px 48px", textAlign: "center",
            borderRight: i < stats.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
