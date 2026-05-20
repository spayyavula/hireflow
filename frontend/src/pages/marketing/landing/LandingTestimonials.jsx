export function LandingTestimonials() {
  return (
    <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 16,
        }}>What early users say</h2>
        <div style={{
          maxWidth: 560, margin: "0 auto", padding: "32px 28px",
          background: "white", borderRadius: 20,
          border: "1px dashed var(--border)",
        }}>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
            We're collecting real testimonials from our first cohort of beta users
            right now. Quotes will appear here with full name, photo, and LinkedIn
            link once we have permission. If you're a Hyrly user and would like to
            be featured, <a href="mailto:spayyavula@gmail.com" style={{ color: "var(--coral)", fontWeight: 600 }}>email us</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
