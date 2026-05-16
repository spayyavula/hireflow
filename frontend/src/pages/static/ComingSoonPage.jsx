import GlobalStyles from '../../styles/GlobalStyles';
import Button from '../../components/ui/Button';
import PublicNav from '../../components/PublicNav';

const ComingSoonPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => (
  <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
    <GlobalStyles />
    <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

    <section style={{ maxWidth: 920, margin: "0 auto", padding: "96px 48px" }}>
      <article style={{
        background: "linear-gradient(135deg, #fff 0%, #f9f6f2 100%)",
        border: "1px solid var(--border)",
        borderRadius: 24,
        padding: "44px 36px",
        boxShadow: "0 14px 42px rgba(13,13,15,0.08)",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-block",
          padding: "6px 14px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--coral)",
          background: "rgba(255,107,91,0.10)",
          marginBottom: 16,
        }}>
          Coming Soon
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(34px, 4.5vw, 48px)",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          marginBottom: 10,
          color: "var(--ink)",
        }}>
          This page is still in production
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.75, marginBottom: 26 }}>
          We are polishing this section so it launches with complete content and a cleaner decision flow.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Button variant="coral" onClick={() => onNavigate("home")}>Back to homepage</Button>
          <Button variant="outline" onClick={() => onNavigate("roadmap")}>See roadmap</Button>
        </div>
      </article>
    </section>
  </div>
);

export default ComingSoonPage;
