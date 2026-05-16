const testimonials = [
  {
    quote: "The match scoring actually makes sense. Instead of 200 irrelevant listings I got 12 that fit — and I knew exactly why.",
    name: "Priya M.", role: "Senior Engineer, now at a Series B startup", initials: "PM",
  },
  {
    quote: "I did three mock voice interviews the night before my panel. The feedback was sharper than anything I'd gotten from a human reviewer.",
    name: "Daniel R.", role: "Product Manager, recently promoted", initials: "DR",
  },
  {
    quote: "Scout AI walked me through a career pivot I'd been overthinking for a year. It gave me a concrete skills roadmap in one session.",
    name: "Lena K.", role: "Transitioning from QA to Product Design", initials: "LK",
  },
];

export function LandingTestimonials() {
  return (
    <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12,
        }}>What early users say</h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
          From beta testers who've used it in their own job search
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {testimonials.map((t, i) => (
          <div key={i} style={{
            background: "white", borderRadius: 20, padding: 32,
            border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
            display: "flex", flexDirection: "column", gap: 20,
          }}>
            <div style={{ color: "var(--coral)", fontSize: 28, lineHeight: 1, fontFamily: "Georgia, serif" }}>"</div>
            <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.7, fontStyle: "italic", flex: 1 }}>{t.quote}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%", background: "var(--ink)", color: "var(--cream)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>{t.initials}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
