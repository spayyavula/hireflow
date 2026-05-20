import { useState } from "react";
import GlobalStyles from "../../styles/GlobalStyles";
import Icons from "../../components/ui/Icons";
import Button from "../../components/ui/Button";

const RoleSelect = ({ onSelect }) => {
  const [hovered, setHovered] = useState(null);

  const roles = [
    { key: "seeker", icon: Icons.user, title: "Job Seeker", desc: "Build your AI-powered profile and get matched to dream opportunities", accent: "var(--coral)" },
    { key: "recruiter", icon: Icons.users, title: "Recruiter", desc: "Source exceptional talent and fill positions faster with AI matching", accent: "var(--sage)" },
    { key: "company", icon: Icons.building, title: "Company", desc: "Build world-class teams with data-driven hiring insights", accent: "var(--lavender)" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--cream)" }}>
      <GlobalStyles />

      {/* Header */}
      <header style={{ padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink)" }}>
          {Icons.logo}
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Hyrly</span>
        </div>
        <Button variant="ghost" size="sm">Sign In</Button>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px" }}>
        <div style={{ maxWidth: 1000, width: "100%" }}>
          <div className="animate-in" style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(255, 107, 91, 0.08)", borderRadius: 100, marginBottom: 24 }}>
              <span style={{ color: "var(--coral)" }}>{Icons.zap}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--coral)" }}>AI-Powered Matching</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20 }}>
              Find your perfect<br />
              <span style={{ color: "var(--coral)" }}>career match</span>
            </h1>
            <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
              Smart recommendations connecting the right people with the right opportunities
            </p>
          </div>

          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {roles.map((role, i) => (
              <div
                key={role.key}
                className={`animate-in-delay-${i + 1}`}
                onClick={() => onSelect(role.key)}
                onMouseEnter={() => setHovered(role.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: 280,
                  padding: "40px 32px",
                  background: hovered === role.key ? "white" : "transparent",
                  border: `2px solid ${hovered === role.key ? role.accent : "var(--border)"}`,
                  borderRadius: 24,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform: hovered === role.key ? "translateY(-8px)" : "none",
                  boxShadow: hovered === role.key ? "0 24px 48px rgba(13, 13, 15, 0.1)" : "none",
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `${role.accent}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: role.accent, marginBottom: 24,
                  transition: "all 0.3s ease",
                  transform: hovered === role.key ? "scale(1.1)" : "scale(1)",
                }}>
                  {role.icon}
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>{role.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>{role.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: role.accent, fontSize: 14, fontWeight: 600 }}>
                  Get started {Icons.arrow}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "24px 48px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        © 2024 Hyrly. Built with AI.
      </footer>
    </div>
  );
};

export default RoleSelect;
