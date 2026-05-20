import { useState } from "react";
import api from "../../api";
import GlobalStyles from "../../styles/GlobalStyles";
import Icons from "../../components/ui/Icons";
import Button from "../../components/ui/Button";

const AuthScreen = ({ onAuth, onBack, initialMode }) => {
  const [mode, setMode] = useState(initialMode || "login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authRole, setAuthRole] = useState("seeker");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await api.login(email, password);
      } else {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
        if (authRole === "company" && !companyName.trim()) { setError("Company name is required"); setLoading(false); return; }
        data = await api.register(email, password, authRole, name, authRole === "company" ? companyName : null);
      }
      onAuth(data.user);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !loading) handleSubmit(); };

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 12,
    border: "1.5px solid var(--border)", background: "white",
    fontSize: 15, color: "var(--text-primary)", outline: "none",
    fontFamily: "'Source Sans 3', sans-serif",
  };

  const roleOptions = [
    { key: "seeker", label: "Job Seeker", accent: "var(--coral)" },
    { key: "recruiter", label: "Recruiter", accent: "var(--sage)" },
    { key: "company", label: "Company", accent: "var(--lavender)" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--cream)" }}>
      <GlobalStyles />

      <header style={{ padding: "24px 48px", display: "flex", alignItems: "center", gap: 16 }}>
        {onBack && (
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
            background: "white", cursor: "pointer", color: "var(--text-secondary)",
            transition: "all 0.15s",
          }}>{Icons.arrowLeft}</button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink)" }}>
          {Icons.logo}
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Hyrly</span>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px" }}>
        <div className="animate-in" style={{
          width: "100%", maxWidth: 440, background: "white", borderRadius: 24,
          border: "1px solid var(--border)", padding: "48px 40px",
          boxShadow: "0 8px 32px rgba(13, 13, 15, 0.06)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
              color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 8,
            }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
              {mode === "login" ? "Sign in to your Hyrly account" : "Get started with Hyrly"}
            </p>
          </div>

          {error && (
            <div style={{
              padding: "12px 16px", marginBottom: 20, borderRadius: 12,
              background: "rgba(220, 38, 38, 0.08)", color: "#dc2626",
              fontSize: 14, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Full Name</label>
                <input
                  style={inputStyle} placeholder="Jane Smith" value={name}
                  onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Email</label>
              <input
                style={inputStyle} type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Password</label>
              <input
                style={inputStyle} type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
              />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>I am a...</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {roleOptions.map(r => (
                      <button
                        key={r.key}
                        onClick={() => setAuthRole(r.key)}
                        style={{
                          flex: 1, padding: "10px 8px", borderRadius: 10, cursor: "pointer",
                          fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                          border: authRole === r.key ? `2px solid ${r.accent}` : "2px solid var(--border)",
                          background: authRole === r.key ? `${r.accent}10` : "transparent",
                          color: authRole === r.key ? r.accent : "var(--text-secondary)",
                          fontFamily: "'Source Sans 3', sans-serif",
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {authRole === "company" && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Company Name</label>
                    <input
                      style={inputStyle} placeholder="Acme Inc." value={companyName}
                      onChange={e => setCompanyName(e.target.value)} onKeyDown={handleKeyDown}
                    />
                  </div>
                )}
              </>
            )}

            <Button
              variant="coral" size="lg" onClick={handleSubmit} disabled={loading || !email || !password}
              style={{ width: "100%", marginTop: 8 }}
            >
              {loading
                ? (mode === "login" ? "Signing in..." : "Creating account...")
                : (mode === "login" ? "Sign in" : "Create account")
              }
            </Button>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              style={{
                background: "none", border: "none", color: "var(--coral)",
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
              }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </main>

      <footer style={{ padding: "24px 48px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        © 2024 Hyrly. Built with AI.
      </footer>
    </div>
  );
};

export default AuthScreen;
