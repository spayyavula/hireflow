import Icons from '../../../components/ui/Icons';

export function IdeasBoardHeader({ features, totalVotes, shippedCount, isLoggedIn, onGetStarted, onShowSubmit }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 48 }}>
      <div style={{
        display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
        background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 20, letterSpacing: "0.02em",
      }}>Community Driven</div>
      <h1 style={{
        fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 700,
        lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 12,
      }}>Ideas Board</h1>
      <p style={{ fontSize: 17, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7 }}>
        Shape the future of Hyrly. Submit ideas, vote on what matters, and watch features come to life.
      </p>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 32, justifyContent: "center", marginBottom: 32 }}>
        {[
          { value: features.length, label: "Ideas" },
          { value: totalVotes, label: "Votes Cast" },
          { value: shippedCount, label: "Shipped" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Submit CTA */}
      {isLoggedIn ? (
        <button onClick={onShowSubmit} style={{
          padding: "12px 28px", borderRadius: 12, border: "none", background: "var(--coral)", color: "white",
          fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
          display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.2s",
          boxShadow: "0 4px 16px rgba(255,107,91,0.25)",
        }}>{Icons.plus} Submit an Idea</button>
      ) : (
        <button onClick={onGetStarted || (() => {})} style={{
          padding: "12px 28px", borderRadius: 12, border: "none", background: "var(--ink)", color: "var(--cream)",
          fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
          transition: "all 0.2s",
        }}>Sign in to submit & vote</button>
      )}
    </div>
  );
}
