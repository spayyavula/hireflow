import GlobalStyles from '../../styles/GlobalStyles';
import PublicNav from '../../components/PublicNav';

const StaticContentPage = ({ title, subtitle, sections, onGetStarted, onSignIn, onNavigate, currentPage }) => (
  <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
    <GlobalStyles />
    <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

    <section style={{ maxWidth: 920, margin: "0 auto", padding: "72px 48px" }}>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "clamp(34px, 4vw, 48px)",
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        marginBottom: 16,
        color: "var(--ink)",
      }}>{title}</h1>
      <p style={{ fontSize: 17, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.7 }}>{subtitle}</p>

      <div style={{ display: "grid", gap: 18 }}>
        {sections.map((section) => (
          <article key={section.heading} style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid var(--border)",
            padding: 24,
          }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 10, color: "var(--ink)" }}>{section.heading}</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.75 }}>{section.body}</p>
          </article>
        ))}
      </div>
    </section>

    <footer style={{
      padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
      background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
    }}>
      &copy; 2026 Hyrly. Built with AI.
    </footer>
  </div>
);

export default StaticContentPage;
