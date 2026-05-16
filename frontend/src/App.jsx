import { useState, useEffect, useRef } from "react";
import api from "./api";
import { toSlug } from './lib/slug';
import { getPageFromPath, getPathFromPage } from './lib/routing';
import { formatTimeAgo } from './lib/format';
import { SKILL_CATEGORIES, DESIRED_ROLES, EXPERIENCE_LEVELS, WORK_PREFS, SALARY_RANGES } from './data/constants';
import { JOBS, getJobPostingBySlug, CANDIDATES, PIPELINE_STAGES, PIPELINE_DATA, MESSAGES } from './data/mockData';
import GlobalStyles from './styles/GlobalStyles';
import Icons from './components/ui/Icons';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Tag from './components/ui/Tag';
import MatchScore from './components/ui/MatchScore';
import Avatar from './components/ui/Avatar';
import Card from './components/ui/Card';
import StatCard from './components/ui/StatCard';
import PublicNav from './components/PublicNav';
import Sidebar from './components/Sidebar';
import JobCard from './components/JobCard';

import LandingPage from './pages/marketing/LandingPage';
import FeaturesPage from './pages/marketing/FeaturesPage';
import PricingPage from './pages/marketing/PricingPage';
import AboutPage from './pages/marketing/AboutPage';
import IdeasBoard from './pages/marketing/IdeasBoard';
import BlogListPage from './pages/blog/BlogListPage';
import BlogPostPage from './pages/blog/BlogPostPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import StaticContentPage from './pages/static/StaticContentPage';
import ComingSoonPage from './pages/static/ComingSoonPage';

// ═══════════════════════════════════════════════════════════════════
// HIREFLOW REDESIGN — Classic Corporate Aesthetic
// Typography: Playfair Display + Source Sans 3
// Colors: Deep ink, warm coral, cream accents
// ═══════════════════════════════════════════════════════════════════



// ─── Auth Screen ─────────────────────────────────────────────────────
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
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>JobsSearch</span>
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
              {mode === "login" ? "Sign in to your JobsSearch account" : "Get started with JobsSearch"}
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
        © 2024 JobsSearch. Built with AI.
      </footer>
    </div>
  );
};

// ─── Role Selection ──────────────────────────────────────────────────
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
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>JobsSearch</span>
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
        © 2024 JobsSearch. Built with AI.
      </footer>
    </div>
  );
};

// ─── Seeker Choice Screen ────────────────────────────────────────────
const SeekerChoice = ({ onUpload, onBuild, onBack }) => {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <GlobalStyles />

      <header style={{ padding: "24px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink)" }}>
          {Icons.logo}
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>JobsSearch</span>
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

// ─── Resume Upload ───────────────────────────────────────────────────
const ResumeUpload = ({ onComplete, onBack }) => {
  const [phase, setPhase] = useState("upload");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  // Mutable parsed data for the editable review form
  const [parsed, setParsed] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [skillSearch, setSkillSearch] = useState("");

  const set = (k, v) => setParsed(p => ({ ...p, [k]: v }));
  const toggleSkill = (skill) => setParsed(p => ({
    ...p, skills: p.skills.includes(skill) ? p.skills.filter(x => x !== skill) : [...p.skills, skill],
  }));
  const updateExp = (idx, field, val) => setParsed(p => ({
    ...p, experience: p.experience.map((e, i) => i === idx ? { ...e, [field]: val } : e),
  }));
  const addExp = () => setParsed(p => ({
    ...p, experience: [...p.experience, { title: "", company: "", duration: "", description: "" }],
  }));
  const removeExp = (idx) => setParsed(p => ({ ...p, experience: p.experience.filter((_, i) => i !== idx) }));
  const updateEdu = (idx, field, val) => setParsed(p => ({
    ...p, education: p.education.map((e, i) => i === idx ? { ...e, [field]: val } : e),
  }));
  const addEdu = () => setParsed(p => ({
    ...p, education: [...p.education, { school: "", degree: "", year: "" }],
  }));
  const removeEdu = (idx) => setParsed(p => ({ ...p, education: p.education.filter((_, i) => i !== idx) }));

  const allSkills = Object.values(SKILL_CATEGORIES).flat();
  const filteredSkills = skillSearch
    ? allSkills.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !(parsed?.skills || []).includes(s)).slice(0, 8)
    : [];

  const inputStyle = { width: "100%", padding: "14px 16px", borderRadius: 12, border: "1.5px solid var(--border)", background: "white", fontSize: 15, outline: "none" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 };
  const sectionTitle = { fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 };

  const startParsing = async (file) => {
    setFileName(file.name);
    setPhase("parsing");
    setProgress(10);
    setError("");
    // Animate progress while waiting for API
    let p = 10;
    const interval = setInterval(() => {
      p = Math.min(90, p + 1 + Math.random() * 2);
      setProgress(Math.round(p));
    }, 80);
    try {
      const result = await api.uploadResume(file);
      clearInterval(interval);
      setProgress(100);
      setParsed(result.parsed_profile);
      setAiSummary(result.ai_summary);
      setTimeout(() => setPhase("review"), 400);
    } catch (err) {
      clearInterval(interval);
      setError(err.message || "Failed to parse resume. Please try again.");
      setPhase("upload");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: parsed.name || "",
        headline: parsed.headline || "",
        location: parsed.location || "",
        skills: parsed.skills || [],
        desired_roles: parsed.desired_roles || [],
        experience_level: parsed.experience_level || "",
        work_preferences: parsed.work_preferences || [],
        salary_range: parsed.salary_range || "",
        industries: parsed.industries || [],
        experience: (parsed.experience || []).map(e => ({
          title: e.title || "", company: e.company || "", duration: e.duration || "", description: e.description || "",
        })),
        education: (parsed.education || []).map(e => ({
          school: e.school || "", degree: e.degree || "", year: e.year || "",
        })),
        summary: aiSummary,
      };
      await api.updateProfile(payload);
      // Convert to camelCase keys for the dashboard
      const profileForDashboard = {
        ...parsed,
        desiredRoles: parsed.desired_roles || [],
        experienceLevel: parsed.experience_level || "",
        workPrefs: parsed.work_preferences || [],
        salaryRange: parsed.salary_range || "",
      };
      onComplete(profileForDashboard, aiSummary);
    } catch (err) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (phase === "parsing") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlobalStyles />
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 64, height: 64, margin: "0 auto 32px", borderRadius: 32, border: "3px solid var(--cream-dark)", borderTopColor: "var(--coral)", animation: "spin 1s linear infinite" }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Analyzing Resume</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>{fileName}</p>
          <div style={{ height: 6, borderRadius: 3, background: "var(--cream-dark)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--coral)", width: `${progress}%`, transition: "width 0.1s" }} />
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>{progress}% complete</p>
        </div>
      </div>
    );
  }

  if (phase === "review" && parsed) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", padding: "40px 48px" }}>
        <GlobalStyles />
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48, color: "var(--ink)" }}>
            {Icons.logo}
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>JobsSearch</span>
          </header>

          <div className="animate-in" style={{ marginBottom: 32 }}>
            <Tag variant="sage" style={{ marginBottom: 16 }}>{Icons.check} Resume parsed successfully</Tag>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, marginBottom: 8 }}>Review Your Profile</h1>
            <p style={{ color: "var(--text-secondary)" }}>Extracted from {fileName} — edit any field before saving</p>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", marginBottom: 20, borderRadius: 12, background: "rgba(220, 38, 38, 0.08)", color: "#dc2626", fontSize: 14, fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* AI Summary */}
          <Card className="animate-in-delay-1" style={{ marginBottom: 20, background: "rgba(255, 107, 91, 0.04)", border: "1px solid rgba(255, 107, 91, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "var(--coral)", fontWeight: 600 }}>
              {Icons.spark} AI Summary
            </div>
            <textarea
              value={aiSummary}
              onChange={e => setAiSummary(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
            />
          </Card>

          {/* Basic Info */}
          <Card className="animate-in-delay-1" style={{ marginBottom: 20 }}>
            <div style={sectionTitle}>Basic Info</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} value={parsed.name || ""} onChange={e => set("name", e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} value={parsed.email || ""} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Headline</label>
                <input style={inputStyle} value={parsed.headline || ""} onChange={e => set("headline", e.target.value)} placeholder="Senior Software Engineer" />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input style={inputStyle} value={parsed.location || ""} onChange={e => set("location", e.target.value)} placeholder="San Francisco, CA" />
              </div>
            </div>
          </Card>

          {/* Skills */}
          <Card className="animate-in-delay-2" style={{ marginBottom: 20 }}>
            <div style={sectionTitle}>Skills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {(parsed.skills || []).map(s => (
                <Tag key={s} variant="coral" onRemove={() => set("skills", parsed.skills.filter(x => x !== s))}>{s}</Tag>
              ))}
              {parsed.skills?.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: 14 }}>No skills detected — add some below</span>}
            </div>
            <div style={{ position: "relative" }}>
              <input
                style={inputStyle}
                value={skillSearch}
                onChange={e => setSkillSearch(e.target.value)}
                placeholder="Search skills to add..."
              />
              {filteredSkills.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", borderRadius: 12, marginTop: 4, padding: 8, zIndex: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
                  {filteredSkills.map(s => (
                    <div key={s} onClick={() => { toggleSkill(s); setSkillSearch(""); }} style={{ padding: "8px 12px", cursor: "pointer", borderRadius: 8, fontSize: 14 }} onMouseEnter={e => e.target.style.background = "var(--cream)"} onMouseLeave={e => e.target.style.background = "transparent"}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Experience */}
          <Card className="animate-in-delay-2" style={{ marginBottom: 20 }}>
            <div style={sectionTitle}>Experience</div>
            {(parsed.experience || []).map((exp, i) => (
              <div key={i} style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: "1px solid var(--border)", background: "var(--cream)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Position {i + 1}</span>
                  <button onClick={() => removeExp(i)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>{Icons.x}</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Title</label>
                    <input style={inputStyle} value={exp.title || ""} onChange={e => updateExp(i, "title", e.target.value)} placeholder="Job Title" />
                  </div>
                  <div>
                    <label style={labelStyle}>Company</label>
                    <input style={inputStyle} value={exp.company || ""} onChange={e => updateExp(i, "company", e.target.value)} placeholder="Company Name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Duration</label>
                    <input style={inputStyle} value={exp.duration || ""} onChange={e => updateExp(i, "duration", e.target.value)} placeholder="2020 - Present" />
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <input style={inputStyle} value={exp.description || ""} onChange={e => updateExp(i, "description", e.target.value)} placeholder="Brief description" />
                  </div>
                </div>
              </div>
            ))}
            <Button size="sm" onClick={addExp}>{Icons.plus} Add Experience</Button>
          </Card>

          {/* Education */}
          <Card className="animate-in-delay-2" style={{ marginBottom: 20 }}>
            <div style={sectionTitle}>Education</div>
            {(parsed.education || []).map((edu, i) => (
              <div key={i} style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: "1px solid var(--border)", background: "var(--cream)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Education {i + 1}</span>
                  <button onClick={() => removeEdu(i)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>{Icons.x}</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>School</label>
                    <input style={inputStyle} value={edu.school || ""} onChange={e => updateEdu(i, "school", e.target.value)} placeholder="University" />
                  </div>
                  <div>
                    <label style={labelStyle}>Degree</label>
                    <input style={inputStyle} value={edu.degree || ""} onChange={e => updateEdu(i, "degree", e.target.value)} placeholder="B.S. Computer Science" />
                  </div>
                  <div>
                    <label style={labelStyle}>Year</label>
                    <input style={inputStyle} value={edu.year || ""} onChange={e => updateEdu(i, "year", e.target.value)} placeholder="2020" />
                  </div>
                </div>
              </div>
            ))}
            <Button size="sm" onClick={addEdu}>{Icons.plus} Add Education</Button>
          </Card>

          {/* Preferences */}
          <Card className="animate-in-delay-3" style={{ marginBottom: 20 }}>
            <div style={sectionTitle}>Preferences</div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Desired Roles</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DESIRED_ROLES.map(r => (
                  <Tag key={r} size="lg" selected={(parsed.desired_roles || []).includes(r)} onClick={() => {
                    const roles = parsed.desired_roles || [];
                    set("desired_roles", roles.includes(r) ? roles.filter(x => x !== r) : [...roles, r]);
                  }}>{r}</Tag>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Experience Level</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EXPERIENCE_LEVELS.map(l => (
                  <Tag key={l} size="lg" selected={parsed.experience_level === l} onClick={() => set("experience_level", l)}>{l}</Tag>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Work Preference</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {WORK_PREFS.map(w => (
                  <Tag key={w} size="lg" selected={(parsed.work_preferences || []).includes(w)} onClick={() => {
                    const prefs = parsed.work_preferences || [];
                    set("work_preferences", prefs.includes(w) ? prefs.filter(x => x !== w) : [...prefs, w]);
                  }}>{w}</Tag>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Target Salary</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SALARY_RANGES.map(s => (
                  <Tag key={s} size="lg" selected={parsed.salary_range === s} onClick={() => set("salary_range", s)}>{s}</Tag>
                ))}
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="animate-in-delay-3" style={{ display: "flex", justifyContent: "space-between", paddingBottom: 48 }}>
            <Button variant="outline" onClick={onBack}>{Icons.arrowLeft} Start Over</Button>
            <Button variant="coral" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : <>{Icons.spark} Save & Find Matches</>}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
      <GlobalStyles />
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 48, color: "var(--ink)" }}>
          {Icons.logo}
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>JobsSearch</span>
        </div>

        <h1 className="animate-in" style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, marginBottom: 12 }}>Upload your resume</h1>
        <p className="animate-in-delay-1" style={{ color: "var(--text-secondary)", marginBottom: 40 }}>Our AI extracts your skills, experience, and preferences instantly</p>

        {error && (
          <div className="animate-in" style={{ padding: "12px 16px", marginBottom: 20, borderRadius: 12, background: "rgba(220, 38, 38, 0.08)", color: "#dc2626", fontSize: 14, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div
          className="animate-in-delay-2"
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) startParsing(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          style={{
            padding: "64px 48px",
            borderRadius: 24,
            border: `2px dashed ${dragOver ? "var(--coral)" : "var(--border-strong)"}`,
            background: dragOver ? "rgba(255, 107, 91, 0.04)" : "white",
            cursor: "pointer",
            transition: "all 0.2s",
            marginBottom: 24,
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) startParsing(e.target.files[0]); }} />
          <div style={{ color: dragOver ? "var(--coral)" : "var(--text-muted)", marginBottom: 16 }}>{Icons.upload}</div>
          <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{dragOver ? "Drop it here!" : "Drag & drop your resume"}</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>or click to browse · PDF, DOCX</div>
        </div>

        <Button variant="ghost" onClick={onBack}>{Icons.arrowLeft} Back</Button>
      </div>
    </div>
  );
};

// ─── Resume Builder ──────────────────────────────────────────────────
const ResumeBuilder = ({ onComplete, existingProfile }) => {
  const [step, setStep] = useState(0);
  const defaults = {
    name: "", email: "", headline: "", location: "",
    skills: [], desiredRoles: [], experienceLevel: "", workPrefs: [], salaryRange: "",
    experience: [], education: [],
  };
  const [profile, setProfile] = useState(existingProfile
    ? { ...defaults, ...existingProfile, skills: existingProfile.skills || [], desiredRoles: existingProfile.desiredRoles || existingProfile.desired_roles || [], workPrefs: existingProfile.workPrefs || existingProfile.work_prefs || [], experience: existingProfile.experience || [], education: existingProfile.education || [] }
    : defaults
  );
  const [aiSummary, setAiSummary] = useState("");
  const [generating, setGenerating] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const totalSteps = 5;

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const toggle = (k, v) => setProfile(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }));

  const generateSummary = () => {
    setGenerating(true);
    setTimeout(() => {
      setAiSummary(`Results-driven ${profile.experienceLevel?.split(" ")[0] || ""} professional with expertise in ${profile.skills.slice(0, 4).join(", ")}. Seeking opportunities as ${profile.desiredRoles[0] || "a talented professional"}.`);
      setGenerating(false);
    }, 2000);
  };

  const allSkills = Object.values(SKILL_CATEGORIES).flat();
  const filtered = skillSearch ? allSkills.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !profile.skills.includes(s)).slice(0, 8) : [];

  const canNext = () => {
    if (step === 0) return profile.name && profile.email;
    if (step === 1) return profile.skills.length >= 3;
    if (step === 2) return profile.desiredRoles.length >= 1 && profile.experienceLevel;
    return true;
  };

  const inputStyle = { width: "100%", padding: "14px 16px", borderRadius: 12, border: "1.5px solid var(--border)", background: "white", fontSize: 15, outline: "none" };

  const steps = [
    // Step 0: Basic Info
    <div key={0}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Let's build your profile</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 36 }}>Tell us about yourself</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 480 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Full Name *</label>
          <input style={inputStyle} placeholder="Jane Smith" value={profile.name} onChange={e => set("name", e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Email *</label>
          <input style={inputStyle} placeholder="jane@example.com" value={profile.email} onChange={e => set("email", e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Headline</label>
          <input style={inputStyle} placeholder="Senior Software Engineer" value={profile.headline} onChange={e => set("headline", e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Location</label>
          <input style={inputStyle} placeholder="San Francisco, CA" value={profile.location} onChange={e => set("location", e.target.value)} />
        </div>
      </div>
    </div>,

    // Step 1: Skills
    <div key={1}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>What are your skills?</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>Select at least 3 skills</p>

      {profile.skills.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>YOUR SKILLS ({profile.skills.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {profile.skills.map(s => <Tag key={s} variant="coral" onRemove={() => toggle("skills", s)}>{s}</Tag>)}
          </div>
        </div>
      )}

      <Input icon={Icons.search} placeholder="Search skills..." value={skillSearch} onChange={setSkillSearch} style={{ marginBottom: 16 }} />

      {filtered.length > 0 && (
        <Card style={{ marginBottom: 24, padding: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {filtered.map(s => <Tag key={s} onClick={() => { toggle("skills", s); setSkillSearch(""); }}>{Icons.plus} {s}</Tag>)}
          </div>
        </Card>
      )}

      {Object.entries(SKILL_CATEGORIES).map(([cat, skills]) => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>{cat.toUpperCase()}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {skills.map(s => <Tag key={s} selected={profile.skills.includes(s)} onClick={() => toggle("skills", s)}>{profile.skills.includes(s) && <span style={{ color: "var(--cream)" }}>{Icons.check}</span>} {s}</Tag>)}
          </div>
        </div>
      ))}
    </div>,

    // Step 2: Preferences
    <div key={2}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>What's your dream job?</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Help us find the perfect match</p>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>DESIRED ROLES (pick 1-3) *</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DESIRED_ROLES.map(r => <Tag key={r} size="lg" selected={profile.desiredRoles.includes(r)} onClick={() => profile.desiredRoles.includes(r) || profile.desiredRoles.length < 3 ? toggle("desiredRoles", r) : null}>{r}</Tag>)}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>EXPERIENCE LEVEL *</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXPERIENCE_LEVELS.map(l => <Tag key={l} size="lg" selected={profile.experienceLevel === l} onClick={() => set("experienceLevel", l)}>{l}</Tag>)}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>WORK PREFERENCE</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {WORK_PREFS.map(w => <Tag key={w} size="lg" selected={profile.workPrefs.includes(w)} onClick={() => toggle("workPrefs", w)}>{w}</Tag>)}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>TARGET SALARY</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SALARY_RANGES.map(s => <Tag key={s} size="lg" selected={profile.salaryRange === s} onClick={() => set("salaryRange", s)}>{s}</Tag>)}
        </div>
      </div>
    </div>,

    // Step 3: Experience
    <div key={3}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Work Experience</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Add your relevant experience (optional)</p>

      {profile.experience.map((exp, i) => (
        <Card key={exp.id} style={{ marginBottom: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{exp.title}</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{exp.company} · {exp.duration}</div>
            </div>
            <button onClick={() => set("experience", profile.experience.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>{Icons.x}</button>
          </div>
        </Card>
      ))}

      <Card style={{ padding: 20, border: "2px dashed var(--border)" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <input id="exp-title" style={{ ...inputStyle, flex: 1, minWidth: 150 }} placeholder="Job Title" />
          <input id="exp-company" style={{ ...inputStyle, flex: 1, minWidth: 150 }} placeholder="Company" />
          <input id="exp-duration" style={{ ...inputStyle, width: 140 }} placeholder="2020 - Present" />
        </div>
        <Button size="sm" onClick={() => {
          const t = document.getElementById("exp-title").value;
          const c = document.getElementById("exp-company").value;
          const d = document.getElementById("exp-duration").value;
          if (t && c) {
            set("experience", [...profile.experience, { id: Date.now(), title: t, company: c, duration: d }]);
            document.getElementById("exp-title").value = "";
            document.getElementById("exp-company").value = "";
            document.getElementById("exp-duration").value = "";
          }
        }}>{Icons.plus} Add Experience</Button>
      </Card>
    </div>,

    // Step 4: AI Summary
    <div key={4}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>AI Summary</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Generate your professional summary</p>

      <Card style={{ marginBottom: 24, background: "rgba(255, 107, 91, 0.04)", border: "1px solid rgba(255, 107, 91, 0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "var(--coral)", fontWeight: 600 }}>
          {Icons.spark} AI-Generated Summary
        </div>
        {!aiSummary && !generating && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <Button variant="coral" onClick={generateSummary}>{Icons.zap} Generate Summary</Button>
          </div>
        )}
        {generating && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: "var(--coral)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
            <p style={{ color: "var(--text-muted)" }}>Analyzing your profile...</p>
          </div>
        )}
        {aiSummary && !generating && (
          <textarea value={aiSummary} onChange={e => setAiSummary(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.6 }} />
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Profile Preview</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>{profile.name || "Your Name"}</div>
        <div style={{ color: "var(--coral)", fontWeight: 600, marginTop: 4 }}>{profile.headline}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {profile.skills.slice(0, 6).map(s => <Tag key={s} variant="coral">{s}</Tag>)}
          {profile.skills.length > 6 && <Tag>+{profile.skills.length - 6}</Tag>}
        </div>
      </Card>
    </div>,
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", padding: "40px 48px" }}>
      <GlobalStyles />
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink)" }}>
            {Icons.logo}
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>JobsSearch</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} style={{
                width: i === step ? 32 : 12, height: 12, borderRadius: 6,
                background: i < step ? "var(--coral)" : i === step ? "var(--ink)" : "var(--cream-dark)",
                transition: "all 0.3s",
              }} />
            ))}
          </div>
        </header>

        <div className="animate-in">{steps[step]}</div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
          <Button variant="outline" onClick={() => step > 0 && setStep(s => s - 1)} style={{ visibility: step === 0 ? "hidden" : "visible" }}>{Icons.arrowLeft} Back</Button>
          <div style={{ display: "flex", gap: 12 }}>
            {step < totalSteps - 1 && <Button variant="ghost" onClick={() => setStep(s => s + 1)}>Skip</Button>}
            {step < totalSteps - 1
              ? <Button variant="coral" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>Continue {Icons.arrow}</Button>
              : <Button variant="coral" onClick={() => onComplete(profile, aiSummary)} disabled={!aiSummary}>{Icons.spark} Find Matches</Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Interview Bot ───────────────────────────────────────────────────
const InterviewBot = ({ profile }) => {
  const [phase, setPhase] = useState("setup"); // setup, active, review
  const [jd, setJd] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [interviewType, setInterviewType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("mid");
  const [session, setSession] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const speak = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) || voices.find(v => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;
      setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  };

  const startInterview = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    try {
      const data = await api.startInterview(jd, jobTitle, companyName, interviewType, difficulty);
      setSession(data);
      setCurrentQ(0);
      setAnswers([]);
      setPhase("active");
      setFeedback(null);
      setTranscript("");
      setTimeout(() => speak(data.questions[0].q), 500);
    } catch (err) {
      alert("Failed to start interview: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.start(100);
      setIsRecording(true);
      setTranscript("");
      setFeedback(null);
    } catch (err) {
      alert("Microphone access denied. Please allow microphone access to use the interview bot.");
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsRecording(false);
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result.split(",")[1];
            try {
              const result = await api.transcribeAudio(base64);
              setTranscript(result.text || "(Could not transcribe audio)");
            } catch (err) {
              setTranscript("(Transcription failed — please type your answer instead)");
            } finally {
              setIsTranscribing(false);
              resolve();
            }
          };
          reader.readAsDataURL(blob);
        } catch { setIsTranscribing(false); resolve(); }
      };
      mediaRecorderRef.current.stop();
    });
  };

  const submitAnswer = async () => {
    const answer = transcript.trim();
    if (!answer || !session) return;
    const q = session.questions[currentQ];
    setIsEvaluating(true);
    try {
      const evalResult = await api.evaluateAnswer(q.q, answer, jd, q.type);
      setFeedback(evalResult);
      setAnswers(prev => [...prev, { question: q.q, answer, ...evalResult, type: q.type }]);
    } catch {
      setFeedback({ score: 0, feedback: "Couldn't evaluate — but your answer was recorded.", strengths: [], improvements: [] });
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= session.questions.length) {
      setPhase("review");
      return;
    }
    setCurrentQ(prev => prev + 1);
    setTranscript("");
    setFeedback(null);
    setTimeout(() => speak(session.questions[currentQ + 1].q), 300);
  };

  const resetInterview = () => {
    window.speechSynthesis?.cancel();
    setPhase("setup");
    setSession(null);
    setCurrentQ(0);
    setAnswers([]);
    setTranscript("");
    setFeedback(null);
  };

  const avgScore = answers.length ? Math.round(answers.reduce((a, b) => a + b.score, 0) / answers.length) : 0;
  const scoreColor = (s) => s >= 80 ? "var(--coral)" : s >= 60 ? "var(--sage)" : "var(--gold)";

  // ── Setup Phase ──
  if (phase === "setup") {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 26,
            background: "linear-gradient(135deg, #ff6b5b 0%, #d4a853 50%, #7eb89e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(255,107,91,0.3)",
          }}>
            {Icons.mic}
          </div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Interview Bot</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>AI-powered voice mock interviews with real-time feedback</p>
          </div>
        </div>

        <Card style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Job Description *</label>
            <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the job description here..." rows={6} style={{
              width: "100%", padding: 14, borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 14,
              fontFamily: "'Source Sans 3', sans-serif", resize: "vertical", outline: "none", lineHeight: 1.6,
              transition: "border-color 0.2s",
            }} onFocus={e => e.target.style.borderColor = "var(--coral)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Job Title</label>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior React Developer" style={{
                width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--border)",
                fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", outline: "none",
              }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Company</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Google" style={{
                width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--border)",
                fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", outline: "none",
              }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Interview Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["mixed", "Mixed"], ["behavioral", "Behavioral"], ["technical", "Technical"]].map(([k, l]) => (
                  <button key={k} onClick={() => setInterviewType(k)} style={{
                    flex: 1, padding: "10px 8px", borderRadius: 10, border: "1.5px solid",
                    borderColor: interviewType === k ? "var(--coral)" : "var(--border)",
                    background: interviewType === k ? "rgba(255,107,91,0.08)" : "white",
                    color: interviewType === k ? "var(--coral)" : "var(--text-secondary)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Difficulty</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["entry", "Entry"], ["mid", "Mid"], ["senior", "Senior"]].map(([k, l]) => (
                  <button key={k} onClick={() => setDifficulty(k)} style={{
                    flex: 1, padding: "10px 8px", borderRadius: 10, border: "1.5px solid",
                    borderColor: difficulty === k ? "var(--sage)" : "var(--border)",
                    background: difficulty === k ? "rgba(126,184,158,0.08)" : "white",
                    color: difficulty === k ? "var(--sage)" : "var(--text-secondary)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <Button variant="coral" size="lg" onClick={startInterview} disabled={!jd.trim() || loading}
            style={{ width: "100%", borderRadius: 14, fontSize: 16 }}
            icon={loading ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> : Icons.mic}
          >
            {loading ? "Preparing your interview..." : "Start Mock Interview"}
          </Button>
        </Card>

        <div style={{ padding: 20, borderRadius: 14, background: "rgba(126,184,158,0.08)", border: "1px solid rgba(126,184,158,0.2)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--sage)", marginBottom: 8 }}>HOW IT WORKS</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            1. Paste a job description and configure your interview<br/>
            2. The bot will ask you questions out loud using voice synthesis<br/>
            3. Click the microphone to record your answer — Wispr AI will transcribe it<br/>
            4. Get instant feedback with a score, strengths, and areas to improve<br/>
            5. Review your complete performance at the end
          </div>
        </div>
      </div>
    );
  }

  // ── Active Interview Phase ──
  if (phase === "active" && session) {
    const q = session.questions[currentQ];
    const progress = ((currentQ + (feedback ? 1 : 0)) / session.questions.length) * 100;

    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
              {session.company_name} — {session.job_title}
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>
              Question {currentQ + 1} of {session.questions.length}
            </h2>
          </div>
          <button onClick={resetInterview} style={{
            padding: "8px 16px", borderRadius: 10, border: "1.5px solid var(--border)",
            background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
            color: "var(--text-muted)", fontFamily: "'Source Sans 3', sans-serif",
          }}>End Interview</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 2, background: "var(--cream-dark)", marginBottom: 28, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, borderRadius: 2, background: "linear-gradient(90deg, var(--coral), var(--sage))", transition: "width 0.5s ease" }} />
        </div>

        {/* Question card */}
        <Card style={{ marginBottom: 20, position: "relative", overflow: "visible" }}>
          <div style={{
            position: "absolute", top: -14, left: 20, padding: "4px 12px", borderRadius: 8,
            background: q.type === "behavioral" ? "var(--coral)" : q.type === "technical" ? "var(--lavender)" : q.type === "situational" ? "var(--sage)" : "var(--gold)",
            color: "white", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
          }}>{q.type}</div>

          <div style={{ paddingTop: 8 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, lineHeight: 1.5, marginBottom: 16, color: "var(--ink)" }}>
              "{q.q}"
            </p>
            {isSpeaking && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      width: 3, height: 12 + Math.random() * 12, borderRadius: 2,
                      background: "var(--coral)", animation: `pulse 0.8s ease-in-out ${i * 0.1}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: "var(--coral)", fontWeight: 600 }}>Speaking...</span>
              </div>
            )}
            <div style={{ padding: 12, borderRadius: 10, background: "var(--cream)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--sage)" }}>Tip:</strong> {q.tip}
            </div>
          </div>
        </Card>

        {/* Recording controls */}
        {!feedback && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            {!isRecording && !isTranscribing && !transcript && (
              <button onClick={startRecording} style={{
                width: 80, height: 80, borderRadius: 40, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, var(--coral) 0%, #e85a4a 100%)",
                boxShadow: "0 8px 32px rgba(255,107,91,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto", transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <svg width="32" height="32" fill="white" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" fill="none"/><path d="M12 18v4" stroke="white" strokeWidth="2"/></svg>
              </button>
            )}

            {isRecording && (
              <div>
                <button onClick={stopRecording} style={{
                  width: 80, height: 80, borderRadius: 40, border: "none", cursor: "pointer",
                  background: "var(--ink)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 8px rgba(255,107,91,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto", animation: "pulse 1.5s ease-in-out infinite",
                }}>
                  <svg width="28" height="28" fill="white" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                </button>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--coral)", marginTop: 12, animation: "pulse 1.5s ease-in-out infinite" }}>
                  Recording... Click to stop
                </p>
              </div>
            )}

            {isTranscribing && (
              <div style={{ padding: 20 }}>
                <div style={{ width: 40, height: 40, margin: "0 auto 12px", borderRadius: 20, border: "3px solid var(--cream-dark)", borderTopColor: "var(--coral)", animation: "spin 1s linear infinite" }} />
                <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>Transcribing with Wispr AI...</p>
              </div>
            )}

            {!isRecording && !isTranscribing && !transcript && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
                Click the microphone to start recording your answer
              </p>
            )}
          </div>
        )}

        {/* Transcript */}
        {transcript && !feedback && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Answer</div>
            <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={4} style={{
              width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border)",
              fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", resize: "vertical",
              lineHeight: 1.6, outline: "none", marginBottom: 12,
            }} />
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="coral" onClick={submitAnswer} disabled={isEvaluating} icon={isEvaluating ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> : Icons.spark}>
                {isEvaluating ? "Evaluating..." : "Get Feedback"}
              </Button>
              <Button variant="outline" onClick={startRecording}>Re-record</Button>
            </div>
          </Card>
        )}

        {/* Feedback */}
        {feedback && (
          <div style={{ animation: "slideUp 0.4s ease-out" }}>
            <Card style={{ marginBottom: 16, borderLeft: `4px solid ${scoreColor(feedback.score)}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${scoreColor(feedback.score)}15`, border: `3px solid ${scoreColor(feedback.score)}`,
                  fontSize: 20, fontWeight: 800, color: scoreColor(feedback.score),
                }}>{feedback.score}</div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                    {feedback.score >= 80 ? "Excellent!" : feedback.score >= 60 ? "Good Job!" : "Keep Practicing"}
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>{feedback.feedback}</p>
                </div>
              </div>

              {feedback.strengths && feedback.strengths.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sage)", marginBottom: 6, textTransform: "uppercase" }}>Strengths</div>
                  {feedback.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: 14, color: "var(--text-secondary)", padding: "4px 0", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "var(--sage)", marginTop: 2 }}>{Icons.check}</span> {s}
                    </div>
                  ))}
                </div>
              )}

              {feedback.improvements && feedback.improvements.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", marginBottom: 6, textTransform: "uppercase" }}>To Improve</div>
                  {feedback.improvements.map((s, i) => (
                    <div key={i} style={{ fontSize: 14, color: "var(--text-secondary)", padding: "4px 0", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "var(--gold)", marginTop: 2 }}>{Icons.arrow}</span> {s}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Button variant={currentQ + 1 >= session.questions.length ? "coral" : "default"} size="lg" onClick={nextQuestion}
              style={{ width: "100%", borderRadius: 14 }}
              icon={currentQ + 1 >= session.questions.length ? Icons.chart : Icons.arrow}
            >
              {currentQ + 1 >= session.questions.length ? "View Full Report" : "Next Question"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Review Phase ──
  if (phase === "review") {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 88, height: 88, borderRadius: 44, margin: "0 auto 16px",
            background: `${scoreColor(avgScore)}15`, border: `4px solid ${scoreColor(avgScore)}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 800, color: scoreColor(avgScore),
          }}>{avgScore}</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Interview Complete!</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
            {avgScore >= 80 ? "Outstanding performance! You're well-prepared." : avgScore >= 60 ? "Good performance with room for growth." : "Keep practicing — you'll get there!"}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Questions", value: answers.length, accent: "var(--lavender)" },
            { label: "Avg Score", value: avgScore + "%", accent: scoreColor(avgScore) },
            { label: "Best Score", value: (Math.max(...answers.map(a => a.score)) || 0) + "%", accent: "var(--sage)" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center", padding: 20, borderRadius: 14, background: "white", border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: stat.accent }}>{stat.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Individual results */}
        {answers.map((a, i) => (
          <Card key={i} style={{ marginBottom: 12, borderLeft: `3px solid ${scoreColor(a.score)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                  background: a.type === "behavioral" ? "rgba(255,107,91,0.1)" : a.type === "technical" ? "rgba(155,143,212,0.1)" : "rgba(126,184,158,0.1)",
                  color: a.type === "behavioral" ? "var(--coral)" : a.type === "technical" ? "var(--lavender)" : "var(--sage)",
                }}>{a.type}</span>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>"{a.question}"</p>
              </div>
              <div style={{
                minWidth: 40, height: 40, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center",
                background: `${scoreColor(a.score)}15`, border: `2px solid ${scoreColor(a.score)}`,
                fontSize: 14, fontWeight: 800, color: scoreColor(a.score), marginLeft: 12,
              }}>{a.score}</div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, fontStyle: "italic" }}>{a.feedback}</p>
          </Card>
        ))}

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <Button variant="coral" size="lg" onClick={resetInterview} style={{ flex: 1, borderRadius: 14 }} icon={Icons.mic}>
            Practice Again
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

// ─── Scout AI Chatbot ────────────────────────────────────────────────
const ScoutView = ({ profile }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Auto-greet on first mount
  useEffect(() => {
    if (!hasGreeted) {
      setHasGreeted(true);
      sendMessage("hello", true);
    }
  }, []);

  const sendMessage = async (text, isSystem = false) => {
    const userMsg = text.trim();
    if (!userMsg) return;

    if (!isSystem) {
      setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    }
    setInput("");
    setLoading(true);

    try {
      const data = await api.scoutChat(userMsg);
      setMessages(prev => [...prev, {
        role: "scout",
        content: data.reply,
        jobs: data.jobs,
        suggestions: data.suggestions,
        insight_type: data.insight_type,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "scout",
        content: "Hmm, I hit a snag. Try again in a moment!",
        suggestions: ["Find remote jobs", "What can you do?"],
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestion = (s) => {
    sendMessage(s);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Simple markdown-like renderer for bold text
  const renderText = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => (
      <div key={i} style={{ minHeight: line === "" ? 12 : "auto" }}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>
            : <span key={j}>{part}</span>
        )}
      </div>
    ));
  };

  const ScoutJobCard = ({ job }) => {
    const score = job.match_score || 0;
    const scoreColor = score >= 80 ? "var(--coral)" : score >= 60 ? "var(--sage)" : "var(--gold)";

    return (
      <div style={{
        padding: 16, borderRadius: 14,
        background: "white",
        border: "1px solid var(--border)",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--coral)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,107,91,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
      onClick={() => job.apply_link && window.open(job.apply_link, "_blank")}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{job.title}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{job.company}</div>
          </div>
          {score > 0 && (
            <div style={{
              minWidth: 44, height: 44, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center",
              background: `${scoreColor}15`, border: `2px solid ${scoreColor}`,
              fontSize: 13, fontWeight: 800, color: scoreColor,
            }}>{score}%</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 12, color: "var(--text-muted)" }}>
          {job.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}>{Icons.mapPin} {job.location}</span>}
          {job.remote && <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(126,184,158,0.15)", color: "var(--sage)", fontWeight: 600, fontSize: 11 }}>Remote</span>}
          {job.employment_type && <span>{job.employment_type}</span>}
          <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 6, background: {jsearch:"rgba(255,107,91,0.1)",jobs_api:"rgba(155,143,212,0.1)",linkedin:"rgba(0,119,181,0.1)",indeed:"rgba(0,51,153,0.1)",jobs_search:"rgba(126,184,158,0.1)"}[job.source] || "rgba(155,143,212,0.1)", color: {jsearch:"var(--coral)",jobs_api:"var(--lavender)",linkedin:"#0077B5",indeed:"#003399",jobs_search:"var(--sage)"}[job.source] || "var(--lavender)", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>{{jsearch:"JSearch",jobs_api:"Jobs API",linkedin:"LinkedIn",indeed:"Indeed",jobs_search:"Multi-Board"}[job.source] || job.source}</span>
        </div>
        {job.required_skills && job.required_skills.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
            {job.required_skills.slice(0, 5).map(s => {
              const userHas = (profile?.skills || []).some(us => us.toLowerCase() === s.toLowerCase());
              return (
                <span key={s} style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: userHas ? "rgba(255,107,91,0.12)" : "var(--cream-dark)",
                  color: userHas ? "var(--coral)" : "var(--text-muted)",
                }}>{s}</span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24,
            background: "linear-gradient(135deg, var(--coral) 0%, var(--lavender) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="12" cy="12" r="3" fill="white" opacity="0.4"/>
              <circle cx="12" cy="12" r="1.5" fill="white"/>
              <path d="M12 4v3m0 10v3m-8-8h3m10 0h3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Scout AI</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Your AI career counselor</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", paddingRight: 8,
        display: "flex", flexDirection: "column", gap: 16,
        scrollbarWidth: "thin", scrollbarColor: "var(--cream-dark) transparent",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            animation: "slideUp 0.3s ease-out forwards",
          }}>
            {msg.role === "scout" && (
              <div style={{
                width: 32, height: 32, borderRadius: 16, flexShrink: 0, marginRight: 10, marginTop: 4,
                background: "linear-gradient(135deg, var(--coral) 0%, var(--lavender) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" opacity="0.5"/><circle cx="12" cy="12" r="1.5"/>
                </svg>
              </div>
            )}
            <div style={{ maxWidth: "85%" }}>
              <div style={{
                padding: "14px 18px", borderRadius: 18,
                background: msg.role === "user"
                  ? "var(--ink)"
                  : "white",
                color: msg.role === "user" ? "var(--cream)" : "var(--text-primary)",
                fontSize: 14, lineHeight: 1.7,
                border: msg.role === "scout" ? "1px solid var(--border)" : "none",
                boxShadow: msg.role === "scout" ? "0 2px 12px rgba(0,0,0,0.04)" : "none",
                borderTopLeftRadius: msg.role === "scout" ? 4 : 18,
                borderTopRightRadius: msg.role === "user" ? 4 : 18,
              }}>
                {renderText(msg.content)}
              </div>

              {/* Job results */}
              {msg.jobs && msg.jobs.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  {msg.jobs.slice(0, 5).map((job, j) => (
                    <ScoutJobCard key={job.id || j} job={job} />
                  ))}
                  {msg.jobs.length > 5 && (
                    <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", padding: 8 }}>
                      +{msg.jobs.length - 5} more results
                    </div>
                  )}
                </div>
              )}

              {/* Suggestion chips */}
              {msg.suggestions && msg.suggestions.length > 0 && i === messages.length - 1 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {msg.suggestions.map((s, j) => (
                    <button key={j} onClick={() => handleSuggestion(s)} style={{
                      padding: "8px 14px", borderRadius: 20,
                      background: "var(--cream)",
                      border: "1.5px solid var(--border-strong)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      color: "var(--text-secondary)",
                      transition: "all 0.2s",
                      fontFamily: "'Source Sans 3', sans-serif",
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = "var(--coral)"; e.target.style.color = "var(--coral)"; e.target.style.background = "rgba(255,107,91,0.06)"; }}
                    onMouseLeave={e => { e.target.style.borderColor = "var(--border-strong)"; e.target.style.color = "var(--text-secondary)"; e.target.style.background = "var(--cream)"; }}
                    >{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.3s ease" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 16,
              background: "linear-gradient(135deg, var(--coral) 0%, var(--lavender) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" opacity="0.5"/><circle cx="12" cy="12" r="1.5"/>
              </svg>
            </div>
            <div style={{
              padding: "14px 20px", borderRadius: 18, borderTopLeftRadius: 4,
              background: "white", border: "1px solid var(--border)",
              display: "flex", gap: 6, alignItems: "center",
            }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{
                  width: 8, height: 8, borderRadius: 4,
                  background: "linear-gradient(135deg, var(--coral), var(--lavender))",
                  animation: `pulse 1.4s ease-in-out ${d * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        marginTop: 16, padding: "4px 4px 4px 20px",
        borderRadius: 24, background: "white",
        border: "1.5px solid var(--border)",
        display: "flex", alignItems: "center", gap: 8,
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onFocus={e => { e.currentTarget.style.borderColor = "var(--coral)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,107,91,0.08)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask about jobs, interviews, salary, career advice..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1, border: "none", outline: "none", fontSize: 15,
            color: "var(--text-primary)", background: "transparent",
            fontFamily: "'Source Sans 3', sans-serif",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{
            width: 44, height: 44, borderRadius: 20,
            background: input.trim() ? "linear-gradient(135deg, var(--coral) 0%, var(--lavender) 100%)" : "var(--cream-dark)",
            border: "none", cursor: input.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
            boxShadow: input.trim() ? "0 4px 12px rgba(255,107,91,0.3)" : "none",
          }}
        >
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: "rotate(-45deg)", marginLeft: 2 }}>
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>
          </svg>
        </button>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 8, opacity: 0.6 }}>
        Scout searches JSearch, Jobs API, LinkedIn, Indeed & more simultaneously
      </div>
    </div>
  );
};

// ─── JD Matcher View ─────────────────────────────────────────────────
const MatcherView = ({ profile }) => {
  const [mode, setMode] = useState("analyze");
  const [resumeSource, setResumeSource] = useState("profile");
  const [resumeText, setResumeText] = useState("");
  const [jdSource, setJdSource] = useState("external");
  const [jdText, setJdText] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [generatedCL, setGeneratedCL] = useState("");
  const [copied, setCopied] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [step, setStep] = useState("input"); // input | loading | result

  const inputStyle = { width: "100%", padding: "14px 16px", borderRadius: 12, border: "1.5px solid var(--border)", background: "white", fontSize: 15, outline: "none", fontFamily: "inherit" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 };
  const radioRow = { display: "flex", gap: 12, marginBottom: 16 };

  // Fetch internal jobs for selector
  useEffect(() => {
    api.getJobs().then(setJobs).catch(() => {});
  }, []);

  // Fetch history
  useEffect(() => {
    api.getMatcherHistory().then(setHistory).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    setStep("loading");

    const payload = {
      mode,
      resume_source: resumeSource,
      resume_text: resumeSource === "upload" ? resumeText : undefined,
      jd_source: jdSource,
      job_id: jdSource === "internal" ? selectedJobId : undefined,
      jd_text: jdSource === "external" ? jdText : undefined,
      cover_letter: coverLetter || undefined,
    };

    try {
      let data;
      if (mode === "analyze") {
        data = await api.analyzeMatch(payload);
        setResult(data.analysis);
        setGeneratedCL("");
      } else {
        data = await api.generateCoverLetter(payload);
        setGeneratedCL(data.generated_cover_letter || "");
        setResult(null);
      }
      setStep("result");
      // Refresh history
      api.getMatcherHistory().then(setHistory).catch(() => {});
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStep("input");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep("input");
    setResult(null);
    setGeneratedCL("");
    setError("");
  };

  const canSubmit = () => {
    if (resumeSource === "upload" && !resumeText.trim()) return false;
    if (jdSource === "external" && !jdText.trim()) return false;
    if (jdSource === "internal" && !selectedJobId) return false;
    if (mode === "improve" && !coverLetter.trim()) return false;
    return true;
  };

  const scoreColor = (score) => {
    if (score >= 80) return "var(--sage)";
    if (score >= 60) return "var(--gold)";
    return "var(--coral)";
  };

  // Loading state
  if (step === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ width: 48, height: 48, margin: "0 auto 24px", borderRadius: 24, border: "3px solid var(--cream-dark)", borderTopColor: "var(--coral)", animation: "spin 1s linear infinite" }} />
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          {mode === "analyze" ? "Analyzing Match..." : mode === "generate" ? "Generating Cover Letter..." : "Improving Cover Letter..."}
        </h2>
        <p style={{ color: "var(--text-muted)" }}>AI is working — this takes 5–10 seconds</p>
      </div>
    );
  }

  // Result state
  if (step === "result") {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700 }}>
            {mode === "analyze" ? "Match Analysis" : "Generated Cover Letter"}
          </h1>
          <Button variant="outline" size="sm" onClick={handleReset}>{Icons.arrowLeft} New Analysis</Button>
        </div>

        {mode === "analyze" && result && (
          <div className="animate-in">
            {/* Score */}
            <Card style={{ marginBottom: 20, textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 64, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: scoreColor(result.overall_score), lineHeight: 1 }}>
                {result.overall_score}%
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>Overall Match Score</div>
              {result.summary && <p style={{ marginTop: 16, color: "var(--text-secondary)", maxWidth: 600, margin: "16px auto 0", lineHeight: 1.7 }}>{result.summary}</p>}
            </Card>

            {/* Strengths & Gaps */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sage)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Strengths</div>
                {(result.strengths || []).map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: "var(--sage)", marginTop: 2, flexShrink: 0 }}>{Icons.check}</span>
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{s}</span>
                  </div>
                ))}
                {(result.strengths || []).length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No specific strengths identified</p>}
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--coral)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Gaps to Address</div>
                {(result.gaps || []).map((g, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: "var(--coral)", marginTop: 2, flexShrink: 0 }}>{Icons.x}</span>
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{g}</span>
                  </div>
                ))}
                {(result.gaps || []).length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No gaps identified</p>}
              </Card>
            </div>

            {/* Keywords */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Keywords Found</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(result.keyword_matches || []).map((k, i) => <Tag key={i} variant="sage">{k}</Tag>)}
                  {(result.keyword_matches || []).length === 0 && <span style={{ color: "var(--text-muted)", fontSize: 14 }}>None</span>}
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Keywords Missing</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(result.keyword_misses || []).map((k, i) => <Tag key={i} variant="coral">{k}</Tag>)}
                  {(result.keyword_misses || []).length === 0 && <span style={{ color: "var(--text-muted)", fontSize: 14 }}>None</span>}
                </div>
              </Card>
            </div>

            {/* Cover Letter Feedback */}
            {result.cover_letter_score != null && (
              <Card style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Cover Letter Score</div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: scoreColor(result.cover_letter_score) }}>{result.cover_letter_score}%</span>
                </div>
                {result.cover_letter_feedback && <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{result.cover_letter_feedback}</p>}
              </Card>
            )}
          </div>
        )}

        {(mode === "generate" || mode === "improve") && generatedCL && (
          <div className="animate-in">
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--coral)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {mode === "generate" ? "Generated Cover Letter" : "Improved Cover Letter"}
                </div>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <>{Icons.check} Copied!</> : "Copy to Clipboard"}
                </Button>
              </div>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "var(--text-secondary)", fontSize: 15, padding: 20, background: "var(--cream)", borderRadius: 12 }}>
                {generatedCL}
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Input state (default)
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>JD Matcher</h1>
          <p style={{ color: "var(--text-secondary)" }}>Analyze your resume against a job description or generate a tailored cover letter</p>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
            {Icons.clock} History ({history.length})
          </Button>
        )}
      </div>

      {error && (
        <div className="animate-in" style={{ padding: "12px 16px", marginBottom: 20, borderRadius: 12, background: "rgba(220, 38, 38, 0.08)", color: "#dc2626", fontSize: 14, fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <Card className="animate-in" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Recent Analyses</div>
          {history.map(h => (
            <div key={h.id} onClick={async () => {
              try {
                const data = await api.getMatcherAnalysis(h.id);
                if (data.analysis) { setResult(data.analysis); setGeneratedCL(""); }
                if (data.generated_cover_letter) { setGeneratedCL(data.generated_cover_letter); setResult(null); }
                setMode(data.mode);
                setStep("result");
              } catch {}
            }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4 }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--cream)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{h.job_title || "External JD"}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{h.mode}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {h.overall_score != null && <span style={{ fontWeight: 700, color: scoreColor(h.overall_score) }}>{h.overall_score}%</span>}
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(h.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Mode selector */}
      <Card className="animate-in" style={{ marginBottom: 20 }}>
        <div style={labelStyle}>What would you like to do?</div>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { key: "analyze", label: "Analyze Match", icon: Icons.chart },
            { key: "generate", label: "Generate Cover Letter", icon: Icons.spark },
            { key: "improve", label: "Improve Cover Letter", icon: Icons.edit },
          ].map(m => (
            <div key={m.key} onClick={() => setMode(m.key)} style={{
              flex: 1, padding: "16px", borderRadius: 12, cursor: "pointer", textAlign: "center",
              border: `2px solid ${mode === m.key ? "var(--coral)" : "var(--border)"}`,
              background: mode === m.key ? "rgba(255, 107, 91, 0.04)" : "white",
              transition: "all 0.15s",
            }}>
              <div style={{ color: mode === m.key ? "var(--coral)" : "var(--text-muted)", marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: mode === m.key ? "var(--coral)" : "var(--text-primary)" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Resume source */}
      <Card className="animate-in-delay-1" style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Resume Source</div>
        <div style={radioRow}>
          {[
            { key: "profile", label: `Use saved profile${profile?.name ? ` (${profile.name})` : ""}` },
            { key: "upload", label: "Paste resume text" },
          ].map(opt => (
            <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
              <input type="radio" name="resumeSource" checked={resumeSource === opt.key} onChange={() => setResumeSource(opt.key)} />
              {opt.label}
            </label>
          ))}
        </div>
        {resumeSource === "upload" && (
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
            placeholder="Paste your resume text here..."
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
          />
        )}
        {resumeSource === "profile" && profile?.skills?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {profile.skills.slice(0, 8).map(s => <Tag key={s} variant="sage">{s}</Tag>)}
            {profile.skills.length > 8 && <Tag>+{profile.skills.length - 8} more</Tag>}
          </div>
        )}
      </Card>

      {/* JD source */}
      <Card className="animate-in-delay-1" style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Job Description</div>
        <div style={radioRow}>
          {[
            { key: "external", label: "Paste job description" },
            { key: "internal", label: "Select from jobs" },
          ].map(opt => (
            <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
              <input type="radio" name="jdSource" checked={jdSource === opt.key} onChange={() => setJdSource(opt.key)} />
              {opt.label}
            </label>
          ))}
        </div>
        {jdSource === "external" && (
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 150 }}
            placeholder="Paste the full job description here..."
            value={jdText}
            onChange={e => setJdText(e.target.value)}
          />
        )}
        {jdSource === "internal" && (
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
          >
            <option value="">Select a job...</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title} — {j.company_name || "Unknown"}</option>
            ))}
          </select>
        )}
      </Card>

      {/* Cover letter input (for analyze and improve modes) */}
      {(mode === "analyze" || mode === "improve") && (
        <Card className="animate-in-delay-2" style={{ marginBottom: 20 }}>
          <div style={labelStyle}>
            Cover Letter {mode === "analyze" ? "(optional)" : "(required)"}
          </div>
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
            placeholder={mode === "improve" ? "Paste your existing cover letter to improve..." : "Paste your cover letter for feedback (optional)..."}
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
          />
        </Card>
      )}

      {/* Submit */}
      <div className="animate-in-delay-2" style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="coral" onClick={handleSubmit} disabled={!canSubmit() || loading}>
          {Icons.spark} {mode === "analyze" ? "Analyze Match" : mode === "generate" ? "Generate Cover Letter" : "Improve Cover Letter"}
        </Button>
      </div>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────

// ─── Seeker Dashboard ────────────────────────────────────────────────
const SeekerDashboard = ({ profile, aiSummary, activeTab, onEditResume }) => {
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(new Set());
  const [applied, setApplied] = useState(new Set());

  // External job search state
  const [searchInput, setSearchInput] = useState("software engineer");
  const [locationInput, setLocationInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("software engineer");
  const [searchLocation, setSearchLocation] = useState("");
  const [realJobs, setRealJobs] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");

  // Fetch real jobs from JSearch API
  useEffect(() => {
    let cancelled = false;
    const fetchJobs = async () => {
      setJobsLoading(true);
      setJobsError("");
      try {
        const data = await api.searchExternalJobs(searchQuery, searchLocation);
        if (!cancelled) {
          setRealJobs(data.jobs || []);
        }
      } catch {
        if (!cancelled) {
          setJobsError("");
          setRealJobs(null);
        }
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    };
    fetchJobs();
    return () => { cancelled = true; };
  }, [searchQuery, searchLocation]);

  const handleJobSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setSearchLocation(locationInput);
  };

  // Transform external jobs to match JobCard format
  const transformedJobs = realJobs ? realJobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary_min && job.salary_max
      ? `$${Math.round(job.salary_min / 1000)}k–$${Math.round(job.salary_max / 1000)}k`
      : "",
    match: job.match_score || 50,
    tags: job.required_skills || [],
    posted: formatTimeAgo(job.posted_at),
    remote: job.remote,
    applicants: 0,
    desc: (job.description || "").slice(0, 200) + ((job.description || "").length > 200 ? "..." : ""),
    requiredSkills: job.required_skills || [],
    niceSkills: job.nice_skills || [],
    applyLink: job.apply_link || "",
    matchReasons: job.match_reasons || [],
    source: job.source || "jsearch",
  })).sort((a, b) => b.match - a.match) : null;

  // Fallback: compute matches against hardcoded JOBS
  const fallbackJobs = JOBS.map(job => {
    const uSkills = (profile.skills || []).map(s => s.toLowerCase());
    const reqMatch = job.requiredSkills.filter(s => uSkills.includes(s.toLowerCase())).length;
    const niceMatch = job.niceSkills.filter(s => uSkills.includes(s.toLowerCase())).length;
    let score = (reqMatch / job.requiredSkills.length) * 60 + (niceMatch / job.niceSkills.length) * 20;
    if ((profile.desiredRoles || []).some(r => job.title.toLowerCase().includes(r.toLowerCase().split(" ")[0]))) score += 15;
    if ((profile.workPrefs || []).includes("Remote") && job.remote) score += 5;
    return { ...job, match: Math.min(99, Math.max(40, Math.round(score))) };
  }).sort((a, b) => b.match - a.match);

  const matchedJobs = transformedJobs || fallbackJobs;
  const usingRealJobs = transformedJobs !== null;

  const filtered = matchedJobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  );

  if (activeTab === "scout") return <ScoutView profile={profile} />;
  if (activeTab === "interview") return <InterviewBot profile={profile} />;
  if (activeTab === "matcher") return <MatcherView profile={profile} />;
  if (activeTab === "ideas") return <IdeasBoard user={profile} />;

  if (activeTab === "resume") {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700 }}>My Resume</h1>
          <Button variant="outline" size="sm" onClick={onEditResume}>{Icons.edit} Edit</Button>
        </div>
        <Card>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{profile.name}</h2>
            <p style={{ color: "var(--coral)", fontWeight: 600 }}>{profile.headline}</p>
            <p style={{ color: "var(--text-muted)", marginTop: 4 }}>{profile.email} · {profile.location}</p>
          </div>
          {aiSummary && (
            <div style={{ marginBottom: 24, padding: 20, background: "var(--cream)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--coral)", marginBottom: 8 }}>AI SUMMARY</div>
              <p style={{ lineHeight: 1.7, color: "var(--text-secondary)" }}>{aiSummary}</p>
            </div>
          )}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>SKILLS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {profile.skills.map(s => <Tag key={s} variant="coral">{s}</Tag>)}
            </div>
          </div>
          {profile.experience.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>EXPERIENCE</div>
              {profile.experience.map(e => (
                <div key={e.id} style={{ marginBottom: 16, paddingLeft: 16, borderLeft: "2px solid var(--coral)" }}>
                  <div style={{ fontWeight: 700 }}>{e.title}</div>
                  <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{e.company} · {e.duration}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (activeTab === "chat") return <ChatView />;

  if (activeTab === "analytics") {
    return (
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Analytics</h1>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
          <StatCard label="Average Match" value={`${Math.round(matchedJobs.reduce((a, j) => a + j.match, 0) / matchedJobs.length)}%`} icon={Icons.chart} />
          <StatCard label="Strong Matches" value={matchedJobs.filter(j => j.match >= 80).length} sub="80%+ score" icon={Icons.spark} accent="var(--sage)" />
          <StatCard label="Applications" value={applied.size} icon={Icons.briefcase} accent="var(--lavender)" />
        </div>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Skill Demand</div>
          {profile.skills.slice(0, 5).map(skill => {
            const demand = matchedJobs.filter(j => [...(j.requiredSkills || []), ...(j.niceSkills || [])].map(s => s.toLowerCase()).includes(skill.toLowerCase())).length;
            return (
              <div key={skill} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{skill}</span>
                  <span style={{ color: "var(--coral)", fontWeight: 700 }}>{demand} jobs</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--cream-dark)" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${(demand / Math.max(matchedJobs.length, 1)) * 100}%`, background: "var(--coral)" }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  // Home - Job Matches
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Welcome back, {profile.name?.split(" ")[0]}!</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {jobsLoading ? "Searching for jobs..." : (
            <>AI found <span style={{ color: "var(--coral)", fontWeight: 700 }}>{matchedJobs.filter(j => j.match >= 70).length} strong matches</span> for you{usingRealJobs ? " from real postings" : ""}</>
          )}
        </p>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard label="Best Match" value={`${matchedJobs[0]?.match || 0}%`} sub={matchedJobs[0]?.title} icon={Icons.spark} />
        <StatCard label="Your Skills" value={profile.skills.length} icon={Icons.zap} accent="var(--sage)" />
        <StatCard label="Applied" value={applied.size} icon={Icons.briefcase} accent="var(--lavender)" />
      </div>

      {/* External job search form */}
      <form onSubmit={handleJobSearch} style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", maxWidth: 300 }}>
          <Input icon={Icons.search} placeholder="Job title or keyword..." value={searchInput} onChange={setSearchInput} />
        </div>
        <div style={{ flex: "1 1 160px", maxWidth: 240 }}>
          <Input icon={Icons.mapPin} placeholder="Location..." value={locationInput} onChange={setLocationInput} />
        </div>
        <Button variant="coral" onClick={handleJobSearch}>Search Jobs</Button>
      </form>

      <Input icon={Icons.search} placeholder="Filter results..." value={search} onChange={setSearch} style={{ marginBottom: 24, maxWidth: 400 }} />

      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        {jobsLoading ? "Loading..." : `${filtered.length} jobs ranked by match score`}
        {usingRealJobs && !jobsLoading && <span style={{ marginLeft: 8, color: "var(--sage)", fontWeight: 600 }}>Live results</span>}
        {!usingRealJobs && !jobsLoading && <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>(sample data)</span>}
      </div>

      {jobsLoading && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--coral)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)" }}>Searching real job postings...</p>
        </Card>
      )}

      {!jobsLoading && filtered.map(job => (
        <JobCard
          key={job.id}
          job={job}
          profile={profile}
          applied={applied.has(job.id)}
          onApply={() => job.applyLink ? window.open(job.applyLink, "_blank", "noopener") : setApplied(a => new Set([...a, job.id]))}
          saved={saved.has(job.id)}
          onSave={() => setSaved(s => { const n = new Set(s); n.has(job.id) ? n.delete(job.id) : n.add(job.id); return n; })}
        />
      ))}
    </div>
  );
};

// ─── Chat View ───────────────────────────────────────────────────────
const ChatView = () => {
  const [selected, setSelected] = useState(0);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([
    { from: "them", text: "Hi! Thanks for reaching out. I'd love to learn more about the role.", time: "10:32 AM" },
    { from: "me", text: "Great! The role involves leading our frontend architecture. Available for a chat?", time: "10:35 AM" },
  ]);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 160px)", background: "white", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ width: 300, borderRight: "1px solid var(--border)", overflowY: "auto" }}>
        <div style={{ padding: "20px", fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>Messages</div>
        {MESSAGES.map((m, i) => (
          <div
            key={m.id}
            onClick={() => setSelected(i)}
            style={{
              padding: "16px 20px", cursor: "pointer", display: "flex", gap: 12,
              background: selected === i ? "var(--cream)" : "transparent",
              borderLeft: selected === i ? "3px solid var(--coral)" : "3px solid transparent",
            }}
          >
            <Avatar initials={m.avatar} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: m.unread ? 700 : 600, fontSize: 14 }}>{m.from}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.time}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.preview}</div>
            </div>
            {m.unread && <div style={{ width: 8, height: 8, borderRadius: 4, background: "var(--coral)", marginTop: 6 }} />}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar initials={MESSAGES[selected].avatar} size={40} />
          <div>
            <div style={{ fontWeight: 700 }}>{MESSAGES[selected].from}</div>
            <div style={{ fontSize: 13, color: "var(--sage)" }}>Online</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "70%", padding: "12px 16px", borderRadius: 16,
                background: m.from === "me" ? "var(--coral)" : "var(--cream)",
                color: m.from === "me" ? "white" : "var(--ink)",
                borderBottomRightRadius: m.from === "me" ? 4 : 16,
                borderBottomLeftRadius: m.from === "me" ? 16 : 4,
              }}>
                {m.text}
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, textAlign: "right" }}>{m.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12 }}>
          <Input placeholder="Type a message..." value={msg} onChange={setMsg} style={{ flex: 1 }} />
          <Button variant="coral" onClick={() => { if (msg.trim()) { setMessages(m => [...m, { from: "me", text: msg, time: "Now" }]); setMsg(""); } }}>{Icons.send}</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Recruiter Dashboard ─────────────────────────────────────────────
const RecruiterDashboard = ({ activeTab }) => {
  const [search, setSearch] = useState("");

  if (activeTab === "scout") return <ScoutView profile={null} />;
  if (activeTab === "ideas") return <IdeasBoard user={null} />;
  if (activeTab === "chat") return <ChatView />;

  if (activeTab === "pipeline") {
    return (
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Hiring Pipeline</h1>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16 }}>
          {PIPELINE_STAGES.map((stage, si) => {
            const candidates = PIPELINE_DATA.filter(c => c.stage === si);
            return (
              <div key={stage} style={{ minWidth: 240, flex: 1 }}>
                <Card style={{ background: "var(--cream)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.05em" }}>{stage}</span>
                    <span style={{ width: 24, height: 24, borderRadius: 12, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{candidates.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {candidates.map(c => (
                      <Card key={c.name} style={{ padding: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar initials={c.avatar} size={32} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.role}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === "analytics") {
    return (
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Analytics</h1>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
          <StatCard label="Placements YTD" value="23" sub="$412k revenue" icon={Icons.check} />
          <StatCard label="Time to Fill" value="18d" sub="-4d vs industry" icon={Icons.clock} accent="var(--sage)" />
          <StatCard label="Response Rate" value="73%" icon={Icons.chat} accent="var(--lavender)" />
        </div>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Pipeline Conversion</div>
          {[{ s: "Sourced → Screened", p: 68 }, { s: "Screened → Interview", p: 52 }, { s: "Interview → Offer", p: 38 }, { s: "Offer → Hired", p: 85 }].map(x => (
            <div key={x.s} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "var(--text-secondary)" }}>{x.s}</span>
                <span style={{ color: "var(--sage)", fontWeight: 700 }}>{x.p}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--cream-dark)" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${x.p}%`, background: "var(--sage)" }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // Home - Candidates
  const filtered = CANDIDATES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Candidate Search</h1>
        <p style={{ color: "var(--text-secondary)" }}>AI identified <span style={{ color: "var(--sage)", fontWeight: 700 }}>{CANDIDATES.length} strong matches</span> for your roles</p>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard label="Active Searches" value="8" icon={Icons.search} />
        <StatCard label="Sourced" value="124" sub="+18 this week" icon={Icons.users} accent="var(--sage)" />
        <StatCard label="Placements" value="5" icon={Icons.check} accent="var(--lavender)" />
      </div>

      <Input icon={Icons.search} placeholder="Search candidates..." value={search} onChange={setSearch} style={{ marginBottom: 24, maxWidth: 400 }} />

      {filtered.map(c => (
        <Card key={c.id} hover style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Avatar initials={c.avatar} size={52} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{c.name}</h3>
                <MatchScore score={c.match} />
                <Tag variant={c.status === "Active" ? "sage" : "outline"}>{c.status}</Tag>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>{c.role} · {c.experience} · {c.location}</div>
              <div style={{ display: "flex", gap: 8 }}>{c.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" variant="outline">{Icons.chat} Message</Button>
              <Button size="sm">View {Icons.arrow}</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ─── Company Dashboard ───────────────────────────────────────────────
const CompanyDashboard = ({ activeTab }) => {
  if (activeTab === "scout") return <ScoutView profile={null} />;
  if (activeTab === "ideas") return <IdeasBoard user={null} />;
  if (activeTab === "chat") return <ChatView />;

  if (activeTab === "analytics") {
    return (
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Hiring Analytics</h1>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
          <StatCard label="Cost per Hire" value="$3.2k" sub="-40% vs industry" icon={Icons.chart} />
          <StatCard label="Offer Accept" value="92%" icon={Icons.check} accent="var(--sage)" />
          <StatCard label="Quality of Hire" value="4.6" sub="/5 rating" icon={Icons.spark} accent="var(--lavender)" />
        </div>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Hires by Department</div>
          {[{ d: "Engineering", h: 12 }, { d: "Design", h: 4 }, { d: "Product", h: 6 }, { d: "Sales", h: 8 }].map(x => (
            <div key={x.d} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{x.d}</span>
                <span style={{ color: "var(--lavender)", fontWeight: 700 }}>{x.h}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--cream-dark)" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${(x.h / 12) * 100}%`, background: "var(--lavender)" }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // Home - Dashboard
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Company Dashboard</h1>
        <p style={{ color: "var(--text-secondary)" }}><span style={{ color: "var(--lavender)", fontWeight: 700 }}>6 open positions</span> with AI-matched candidates</p>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard label="Open Roles" value="6" icon={Icons.briefcase} accent="var(--lavender)" />
        <StatCard label="Applicants" value="234" sub="+52 this week" icon={Icons.users} />
        <StatCard label="Match Quality" value="91%" icon={Icons.spark} accent="var(--sage)" />
      </div>

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Active Postings</h2>
      {JOBS.slice(0, 3).map(job => (
        <Card key={job.id} hover style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{job.title}</h3>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{job.location} · {job.salary}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700 }}>{job.applicants}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>applicants</div>
              </div>
              <Button size="sm">Review {Icons.arrow}</Button>
            </div>
          </div>
        </Card>
      ))}

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 16 }}>Recommended Candidates</h2>
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
        {CANDIDATES.slice(0, 4).map(c => (
          <Card key={c.id} style={{ minWidth: 200, textAlign: "center" }}>
            <Avatar initials={c.avatar} size={52} />
            <div style={{ fontWeight: 700, marginTop: 12 }}>{c.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>{c.role}</div>
            <MatchScore score={c.match} />
          </Card>
        ))}
      </div>
    </div>
  );
};


// ─── Main App ────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [role, setRole] = useState(null);
  const [phase, setPhase] = useState("role-select");
  const [profile, setProfile] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [currentPage, setCurrentPage] = useState(() => getPageFromPath(window.location.pathname));

  // Rehydrate session from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('jobssearch_token');
    if (token) {
      api.getProfile()
        .then(data => {
          setUser({ id: data.id, email: data.email, role: data.role, name: data.name });
          setRole(data.role);
          setProfile(data);
          setPhase("dashboard");
        })
        .catch(() => {
          api.logout();
        })
        .finally(() => setAuthReady(true));
    } else {
      setAuthReady(true);
    }
  }, []);

  const handleAuth = (authUser) => {
    setUser(authUser);
    setRole(authUser.role);
    if (authUser.role === "seeker") {
      // Check if seeker already has a profile
      api.getProfile()
        .then(data => {
          if (data && data.skills && data.skills.length > 0) {
            setProfile(data);
            setPhase("dashboard");
          } else {
            setPhase("seeker-choice");
          }
        })
        .catch(() => {
          setPhase("seeker-choice");
        });
    } else {
      setPhase("dashboard");
    }
  };

  const handleRoleSelect = (r) => {
    setRole(r);
    if (r === "seeker") setPhase("seeker-choice");
    else setPhase("dashboard");
  };

  const handleProfileComplete = (p, summary) => {
    setProfile(p);
    setAiSummary(summary);
    setPhase("dashboard");
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setRole(null);
    setPhase("role-select");
    setProfile(null);
    setAiSummary("");
    setActiveTab("home");
    setCurrentPage("home");
    window.history.replaceState({}, "", "/");
  };

  useEffect(() => {
    const onPopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (user) return;

    const seoConfig = {
      home: {
        title: "JobsSearch | Decision System For Job Search And Hiring",
        description: "JobsSearch is an AI decision system for job seekers, recruiters, and companies with match scoring, pivot paths, certification ROI, and interview guidance.",
      },
      features: {
        title: "Features | JobsSearch",
        description: "Explore AI match scoring, interview coaching, recruiter pipelines, analytics, and collaboration tools built for calmer hiring decisions.",
      },
      pricing: {
        title: "Pricing | JobsSearch",
        description: "Simple pricing for seekers, recruiters, and companies. Start free and scale your hiring workflow with AI decision support.",
      },
      about: {
        title: "About | JobsSearch",
        description: "Learn why JobsSearch exists: replacing noisy hiring dashboards with a decision-first system that helps teams and candidates move forward.",
      },
      roadmap: {
        title: "Roadmap | JobsSearch",
        description: "See upcoming JobsSearch features, submit ideas, and vote on what should be built next.",
      },
      terms: {
        title: "Terms | JobsSearch",
        description: "Terms for using JobsSearch, including account responsibilities, acceptable use, and service limitations.",
      },
      privacy: {
        title: "Privacy | JobsSearch",
        description: "How JobsSearch collects, uses, and protects your personal and hiring data.",
      },
      help: {
        title: "Help | JobsSearch",
        description: "Get support for your account, subscriptions, interviews, and hiring workflows on JobsSearch.",
      },
      "coming-soon": {
        title: "Coming Soon | JobsSearch",
        description: "This JobsSearch page is on the way. Explore current features and check the roadmap while we finish it.",
      },
      blog: {
        title: "Blog | JobsSearch",
        description: "Hiring strategy, job search guidance, interview prep, and career decision insights from the JobsSearch team.",
      },
    };

    const isBlogPost = currentPage.startsWith("blog-post:");
    const isJobPost = currentPage.startsWith("job-post:");
    const pageKey = isBlogPost ? "blog" : (currentPage === "ideas" ? "roadmap" : currentPage);
    const fallback = seoConfig.home;
    const jobSlug = isJobPost ? currentPage.replace("job-post:", "") : "";
    const job = isJobPost ? getJobPostingBySlug(jobSlug) : null;

    const meta = job
      ? {
          title: `${job.title} at ${job.company} | JobsSearch`,
          description: `${job.title} in ${job.location}. ${job.description}`,
        }
      : (seoConfig[pageKey] || fallback);
    const canonicalUrl = `https://jobssearch.work${getPathFromPage(currentPage)}`;

    if (currentPage === "coming-soon" && window.location.pathname !== "/coming-soon") {
      window.history.replaceState({}, "", "/coming-soon");
    }

    document.title = meta.title;

    const upsertMeta = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        if (attrs.name) el.setAttribute("name", attrs.name);
        if (attrs.property) el.setAttribute("property", attrs.property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", attrs.content);
    };

    upsertMeta('meta[name="description"]', { name: "description", content: meta.description });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: meta.title });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: job ? "website" : "website" });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: meta.description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: meta.title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: meta.description });

    let canonicalEl = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonicalUrl);

    const existingJobJsonLd = document.head.querySelector("#jobposting-jsonld");
    if (existingJobJsonLd) existingJobJsonLd.remove();

    if (job) {
      const jobSchema = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.title,
        description: job.description,
        datePosted: job.datePosted,
        validThrough: job.validThrough,
        employmentType: job.employmentType,
        directApply: job.directApply,
        hiringOrganization: {
          "@type": "Organization",
          name: job.company,
          sameAs: "https://jobssearch.work/",
          logo: "https://jobssearch.work/favicon.svg",
        },
        jobLocationType: job.remote ? "TELECOMMUTE" : undefined,
        jobLocation: job.remote
          ? undefined
          : {
              "@type": "Place",
              address: {
                "@type": "PostalAddress",
                addressLocality: job.location,
              },
            },
        applicantLocationRequirements: {
          "@type": "Country",
          name: "US",
        },
        baseSalary: {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: {
            "@type": "QuantitativeValue",
            unitText: "YEAR",
            value: job.salary,
          },
        },
      };

      const jsonLdEl = document.createElement("script");
      jsonLdEl.setAttribute("type", "application/ld+json");
      jsonLdEl.setAttribute("id", "jobposting-jsonld");
      jsonLdEl.textContent = JSON.stringify(jobSchema);
      document.head.appendChild(jsonLdEl);
    }
  }, [currentPage, user]);

  useEffect(() => {
    if (user) return;
    if (!currentPage.startsWith("job-post:")) return;

    const slug = currentPage.replace("job-post:", "").trim();
    const job = getJobPostingBySlug(slug);
    if (!job) {
      navigatePublicPage("coming-soon", { replace: true });
    }
  }, [currentPage, user]);

  const navigatePublicPage = (page, options = {}) => {
    const { replace = false } = options;
    const nextPath = getPathFromPage(page);
    if (window.location.pathname !== nextPath) {
      if (replace) window.history.replaceState({}, "", nextPath);
      else window.history.pushState({}, "", nextPath);
    }
    setCurrentPage(page);
  };

  // Loading state while checking token
  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlobalStyles />
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, margin: "0 auto 24px", borderRadius: 24, border: "3px solid var(--cream-dark)", borderTopColor: "var(--coral)", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "var(--text-muted)", fontFamily: "'Source Sans 3', sans-serif" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Auth gate — show landing page, content pages, or login/register
  const navProps = {
    onGetStarted: () => { setAuthMode("register"); setShowAuth(true); },
    onSignIn: () => { setAuthMode("login"); setShowAuth(true); },
    onNavigate: (page, options) => navigatePublicPage(page, options),
    currentPage,
  };

  if (!user && showAuth) return <AuthScreen onAuth={handleAuth} onBack={() => setShowAuth(false)} initialMode={authMode} />;
  if (!user) {
    switch (currentPage) {
      case "features": return <FeaturesPage {...navProps} />;
      case "pricing": return <PricingPage {...navProps} />;
      case "about": return <AboutPage {...navProps} />;
      case "roadmap":
      case "ideas": return <IdeasBoard {...navProps} user={null} />;
      case "terms":
        return (
          <StaticContentPage
            {...navProps}
            title="Terms"
            subtitle="Clear expectations for using JobsSearch responsibly."
            sections={[
              { heading: "Using the platform", body: "Use JobsSearch for legitimate hiring and job search activity only. Keep profile details accurate, and do not submit misleading credentials, fake job postings, or automated spam applications." },
              { heading: "Accounts and access", body: "You are responsible for securing your account and any activity under it. If you suspect unauthorized access, contact support immediately and rotate credentials." },
              { heading: "Service limits", body: "Features may evolve during beta. We may rate-limit abusive traffic or suspend accounts violating fair-use, security, or legal standards." },
            ]}
          />
        );
      case "privacy":
        return (
          <StaticContentPage
            {...navProps}
            title="Privacy"
            subtitle="How we handle personal and hiring data."
            sections={[
              { heading: "Data we collect", body: "We collect profile, resume, job preferences, and product interaction data to power matching, coaching, and hiring workflows." },
              { heading: "How data is used", body: "Data is used to personalize recommendations, improve platform quality, and support customer operations. We do not sell personal data." },
              { heading: "Security controls", body: "JobsSearch uses row-level access controls, encrypted transport, and least-privilege service access to reduce data exposure risk." },
            ]}
          />
        );
      case "help":
        return (
          <StaticContentPage
            {...navProps}
            title="Help"
            subtitle="Support resources for seekers, recruiters, and companies."
            sections={[
              { heading: "Getting started", body: "Create an account, complete your profile, and select goals so the matching engine and Scout AI can personalize recommendations." },
              { heading: "Billing and plans", body: "Plan changes are available from your account settings. Upgrades apply immediately, while downgrades apply at the next billing cycle." },
              { heading: "Need direct support?", body: "Use in-app chat for account assistance and workflow help. Include screenshots and page URLs when reporting issues for faster resolution." },
            ]}
          />
        );
      case "coming-soon": return <ComingSoonPage {...navProps} />;
      case "blog": return <BlogListPage {...navProps} />;
      default:
        if (currentPage.startsWith("job-post:")) {
          const slug = currentPage.replace("job-post:", "");
          return <JobDetailPage slug={slug} {...navProps} />;
        }
        if (currentPage.startsWith("blog-post:")) {
          const slug = currentPage.replace("blog-post:", "");
          return <BlogPostPage slug={slug} {...navProps} />;
        }
        return <LandingPage {...navProps} />;
    }
  }

  // Render based on phase
  if (phase === "role-select") return <RoleSelect onSelect={handleRoleSelect} />;
  if (phase === "seeker-choice") return <SeekerChoice onUpload={() => setPhase("upload")} onBuild={() => setPhase("build")} onBack={() => setPhase("seeker-choice")} />;
  if (phase === "upload") return <ResumeUpload onComplete={handleProfileComplete} onBack={() => setPhase("seeker-choice")} />;
  if (phase === "build") return <ResumeBuilder onComplete={handleProfileComplete} existingProfile={profile} />;

  // Dashboard
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <Sidebar role={role} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <main style={{ marginLeft: 240, padding: "32px 48px" }}>
        {role === "seeker" && <SeekerDashboard profile={profile} aiSummary={aiSummary} activeTab={activeTab} onEditResume={() => setPhase("build")} />}
        {role === "recruiter" && <RecruiterDashboard activeTab={activeTab} />}
        {role === "company" && <CompanyDashboard activeTab={activeTab} />}
      </main>
    </div>
  );
}
