import Icons from '../../../components/ui/Icons';

export function LandingRoleCards({ roles }) {
  return (
    <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12,
        }}>Built for your job search</h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
          Every feature is designed to help you decide and land your next role
        </p>
      </div>

      {/* Featured: Job Seekers */}
      <div className="animate-in-delay-1" style={{
        background: "white", borderRadius: 24, padding: 40,
        border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(13,13,15,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div aria-hidden="true" style={{
            width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
            background: `${roles[0].accent}1a`, color: roles[0].accent,
          }}>
            {roles[0].icon}
          </div>
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: roles[0].accent,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>Primary focus</div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "var(--ink)",
            }}>{roles[0].title}</h3>
          </div>
        </div>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24, maxWidth: 560 }}>
          Everything in JobsSearch is built around one job — helping you find the right roles,
          prepare with confidence, and land an offer.
        </p>
        <ul style={{
          listStyle: "none", padding: 0, margin: 0,
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 32px",
        }}>
          {roles[0].points.map((pt, j) => (
            <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
              <span aria-hidden="true" style={{ color: roles[0].accent, flexShrink: 0 }}>{Icons.check}</span>
              {pt}
            </li>
          ))}
        </ul>
      </div>

      {/* Secondary: Recruiters & Companies */}
      <div style={{ textAlign: "center", margin: "48px 0 20px" }}>
        <h3 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
          color: "var(--ink)", marginBottom: 6,
        }}>Hiring, not job hunting?</h3>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          JobsSearch works for the other side of the table too.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
        {[roles[1], roles[2]].map((r, i) => (
          <div key={i} className={`animate-in-delay-${i + 1}`} style={{
            background: "white", borderRadius: 20, padding: 24,
            border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
            transition: "transform 0.25s ease, box-shadow 0.25s ease", cursor: "default",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,13,15,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,13,15,0.04)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div aria-hidden="true" style={{
                width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: `${r.accent}14`, color: r.accent,
              }}>
                {r.icon}
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "var(--ink)",
              }}>{r.title}</h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
              {r.points.map((pt, j) => (
                <li key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                  <span aria-hidden="true" style={{ color: r.accent, flexShrink: 0 }}>{Icons.check}</span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
