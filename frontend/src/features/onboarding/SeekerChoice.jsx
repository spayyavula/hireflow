import { useState } from "react";
import GlobalStyles from "../../styles/GlobalStyles";
import Icons from "../../components/ui/Icons";
import Card from "../../components/ui/Card";

const SeekerChoice = ({ onUpload, onBuild, onBack }) => {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <GlobalStyles />

      <header style={{ padding: "24px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink)" }}>
          {Icons.logo}
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>Hyrly</span>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px" }}>
        <div style={{ maxWidth: 800, width: "100%", textAlign: "center" }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text-muted)", fontSize: 14, cursor: "pointer", marginBottom: 32 }}>
            {Icons.arrowLeft} Back
          </button>

          <h1 className="animate-in" style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: "var(--ink)", marginBottom: 16, letterSpacing: "-0.02em" }}>
            How would you like to start?
          </h1>
          <p className="animate-in-delay-1" style={{ fontSize: 17, color: "var(--text-secondary)", marginBottom: 48 }}>
            Choose the fastest path to finding your dream job
          </p>

          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { key: "upload", icon: Icons.upload, title: "Upload Resume", desc: "Drop your PDF and our AI extracts everything in seconds", badge: "Fastest" },
              { key: "build", icon: Icons.edit, title: "Build from Scratch", desc: "Craft your profile step-by-step with AI guidance", badge: "Detailed" },
            ].map((opt, i) => (
              <Card
                key={opt.key}
                hover
                onClick={opt.key === "upload" ? onUpload : onBuild}
                style={{
                  width: 320,
                  padding: 36,
                  textAlign: "center",
                  opacity: 0,
                  animation: `slideUp 0.5s ease-out ${0.2 + i * 0.1}s forwards`,
                  border: hovered === opt.key ? "2px solid var(--coral)" : "2px solid var(--border)",
                }}
                onMouseEnter={() => setHovered(opt.key)}
                onMouseLeave={() => setHovered(null)}
              >
                <div style={{ display: "inline-flex", padding: 16, borderRadius: 16, background: "rgba(255, 107, 91, 0.08)", color: "var(--coral)", marginBottom: 20 }}>
                  {opt.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--coral)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{opt.badge}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>{opt.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{opt.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeekerChoice;
