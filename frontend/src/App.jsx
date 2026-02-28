import { useState, useEffect, useRef } from "react";
import api from "./api";

// ═══════════════════════════════════════════════════════════════════
// HIREFLOW REDESIGN — Editorial/Magazine Aesthetic
// Typography: Clash Display + Satoshi
// Colors: Deep ink, warm coral, cream accents
// ═══════════════════════════════════════════════════════════════════

// ─── Data ────────────────────────────────────────────────────────────
const SKILL_CATEGORIES = {
  "Frontend": ["React", "Vue.js", "Angular", "TypeScript", "JavaScript", "HTML/CSS", "Next.js", "Tailwind CSS", "Redux", "Svelte"],
  "Backend": ["Node.js", "Python", "Java", "Go", "Ruby", "PHP", "C#", ".NET", "Rust", "Elixir"],
  "Data & AI": ["Machine Learning", "TensorFlow", "PyTorch", "Data Analysis", "SQL", "Pandas", "NLP", "Computer Vision", "Deep Learning", "MLOps"],
  "Cloud & DevOps": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Nginx", "Jenkins"],
  "Design": ["Figma", "UX Research", "UI Design", "Design Systems", "Prototyping", "Adobe XD", "Sketch", "Accessibility", "Motion Design", "Branding"],
  "Management": ["Agile/Scrum", "Product Strategy", "Stakeholder Mgmt", "Roadmapping", "Team Leadership", "Budgeting", "OKRs", "Hiring", "Mentoring", "Cross-functional"],
};

const DESIRED_ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "ML Engineer", "Data Scientist", "Data Analyst", "DevOps Engineer", "Cloud Architect",
  "Product Manager", "Product Designer", "UX Researcher", "Engineering Manager",
  "Mobile Developer", "QA Engineer", "Security Engineer", "Solutions Architect",
];

const EXPERIENCE_LEVELS = ["Entry Level (0-2 yrs)", "Mid Level (3-5 yrs)", "Senior (6-9 yrs)", "Staff / Lead (10+ yrs)", "Executive"];
const WORK_PREFS = ["Remote", "Hybrid", "On-site"];
const SALARY_RANGES = ["$50k–$80k", "$80k–$120k", "$120k–$160k", "$160k–$200k", "$200k+"];

const JOBS = [
  { id: 1, title: "Senior React Developer", company: "TechVault", location: "San Francisco, CA", salary: "$160k–$200k", match: 96, tags: ["React", "TypeScript", "Node.js"], posted: "2h ago", remote: true, applicants: 23, desc: "Lead frontend architecture for our next-gen platform.", requiredSkills: ["React", "TypeScript", "JavaScript"], niceSkills: ["Next.js", "Redux", "Node.js"] },
  { id: 2, title: "ML Engineer", company: "DataPulse AI", location: "Remote", salary: "$180k–$230k", match: 91, tags: ["Python", "PyTorch", "MLOps"], posted: "5h ago", remote: true, applicants: 45, desc: "Build and deploy production ML pipelines at scale.", requiredSkills: ["Python", "Machine Learning", "PyTorch"], niceSkills: ["MLOps", "AWS", "Docker"] },
  { id: 3, title: "Product Designer", company: "Forma Studio", location: "New York, NY", salary: "$130k–$165k", match: 88, tags: ["Figma", "UX Research", "Design Systems"], posted: "1d ago", remote: false, applicants: 67, desc: "Shape the future of our design system.", requiredSkills: ["Figma", "UX Research", "UI Design"], niceSkills: ["Design Systems", "Prototyping", "Accessibility"] },
  { id: 4, title: "DevOps Lead", company: "CloudScale", location: "Austin, TX", salary: "$155k–$195k", match: 85, tags: ["AWS", "Kubernetes", "Terraform"], posted: "3h ago", remote: true, applicants: 18, desc: "Lead infrastructure team and modernize our cloud stack.", requiredSkills: ["AWS", "Kubernetes", "Terraform"], niceSkills: ["Docker", "CI/CD", "Linux"] },
  { id: 5, title: "Full Stack Developer", company: "PayLoop", location: "Remote", salary: "$140k–$175k", match: 79, tags: ["Node.js", "React", "PostgreSQL"], posted: "1d ago", remote: true, applicants: 54, desc: "Build payment infrastructure used by millions.", requiredSkills: ["Node.js", "React", "SQL"], niceSkills: ["TypeScript", "Docker", "AWS"] },
];

const CANDIDATES = [
  { id: 1, name: "Sarah Chen", role: "Senior React Developer", experience: "8 years", match: 97, skills: ["React", "TypeScript", "GraphQL"], status: "Active", avatar: "SC", location: "San Francisco" },
  { id: 2, name: "Marcus Johnson", role: "Full Stack Engineer", experience: "6 years", match: 93, skills: ["Node.js", "React", "PostgreSQL"], status: "Active", avatar: "MJ", location: "Remote" },
  { id: 3, name: "Emily Park", role: "ML Engineer", experience: "5 years", match: 90, skills: ["Python", "TensorFlow", "AWS"], status: "Open", avatar: "EP", location: "Seattle" },
  { id: 4, name: "David Kim", role: "DevOps Engineer", experience: "7 years", match: 87, skills: ["Kubernetes", "Docker", "CI/CD"], status: "Active", avatar: "DK", location: "Austin" },
];

const PIPELINE_STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired"];
const PIPELINE_DATA = [
  { name: "Sarah Chen", stage: 3, role: "Sr. React Dev", avatar: "SC" },
  { name: "Marcus Johnson", stage: 2, role: "Full Stack", avatar: "MJ" },
  { name: "Emily Park", stage: 1, role: "ML Engineer", avatar: "EP" },
  { name: "David Kim", stage: 4, role: "DevOps Lead", avatar: "DK" },
  { name: "Lisa Wang", stage: 0, role: "Designer", avatar: "LW" },
];

const MESSAGES = [
  { id: 1, from: "TechVault HR", avatar: "TV", preview: "We'd love to schedule an interview...", time: "15m", unread: true },
  { id: 2, from: "Sarah Chen", avatar: "SC", preview: "Thanks for reaching out! I'd love to learn more...", time: "2h", unread: true },
  { id: 3, from: "DataPulse", avatar: "DP", preview: "Your profile caught our attention...", time: "1d", unread: false },
];

// ─── Global Styles ───────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
    @import url('https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --ink: #0d0d0f;
      --ink-light: #1a1a1f;
      --ink-lighter: #2a2a32;
      --cream: #faf8f5;
      --cream-dark: #ede9e3;
      --coral: #ff6b5b;
      --coral-light: #ff8a7a;
      --coral-dark: #e85a4a;
      --sage: #7eb89e;
      --sage-light: #a8d4be;
      --lavender: #9b8fd4;
      --gold: #d4a853;
      --text-primary: #0d0d0f;
      --text-secondary: #5a5a66;
      --text-muted: #8a8a96;
      --border: rgba(13, 13, 15, 0.08);
      --border-strong: rgba(13, 13, 15, 0.15);
    }

    body {
      font-family: 'Satoshi', 'Inter', -apple-system, sans-serif;
      background: var(--cream);
      color: var(--text-primary);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    ::selection {
      background: var(--coral);
      color: white;
    }

    input, textarea, button { font-family: inherit; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .animate-in { animation: slideUp 0.6s ease-out forwards; }
    .animate-in-delay-1 { animation: slideUp 0.6s ease-out 0.1s forwards; opacity: 0; }
    .animate-in-delay-2 { animation: slideUp 0.6s ease-out 0.2s forwards; opacity: 0; }
    .animate-in-delay-3 { animation: slideUp 0.6s ease-out 0.3s forwards; opacity: 0; }
  `}</style>
);

// ─── Icons ───────────────────────────────────────────────────────────
const Icons = {
  logo: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="currentColor"/>
      <path d="M8 12h6v2H8v-2zm0 4h10v2H8v-2zm0 4h6v2H8v-2zm12-6h4v8h-4v-8z" fill="var(--cream)"/>
    </svg>
  ),
  search: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  briefcase: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  user: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/></svg>,
  users: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M2 21v-1a5 5 0 0 1 10 0v1"/><circle cx="17" cy="7" r="3"/><path d="M22 21v-1a4 4 0 0 0-5-3.87"/></svg>,
  chart: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></svg>,
  chat: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  spark: <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8L8 14l-6-4.8h7.6z"/></svg>,
  arrow: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  arrowLeft: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  check: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>,
  plus: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  x: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  upload: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  doc: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  building: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 6h2m-2 4h2m-2 4h2m4-8h2m-2 4h2m-2 4h2M9 22v-4h6v4"/></svg>,
  mapPin: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  heart: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  send: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>,
  edit: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  zap: <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  target: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  menu: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
  external: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>,
};

// ─── UI Components ───────────────────────────────────────────────────
const Button = ({ children, variant = "default", size = "md", onClick, disabled, style, icon }) => {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 600,
    borderRadius: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    border: "none",
    opacity: disabled ? 0.5 : 1,
    fontFamily: "'Satoshi', sans-serif",
  };

  const variants = {
    default: {
      background: "var(--ink)",
      color: "var(--cream)",
      padding: size === "sm" ? "8px 16px" : size === "lg" ? "16px 32px" : "12px 24px",
      fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    },
    coral: {
      background: "var(--coral)",
      color: "white",
      padding: size === "sm" ? "8px 16px" : size === "lg" ? "16px 32px" : "12px 24px",
      fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    },
    outline: {
      background: "transparent",
      color: "var(--ink)",
      border: "1.5px solid var(--border-strong)",
      padding: size === "sm" ? "7px 15px" : size === "lg" ? "15px 31px" : "11px 23px",
      fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
      padding: size === "sm" ? "8px 12px" : "10px 16px",
      fontSize: size === "sm" ? 13 : 14,
    },
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{ ...baseStyle, ...variants[variant], ...style }}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
};

const Input = ({ placeholder, value, onChange, icon, style, type = "text" }) => (
  <div style={{ position: "relative", ...style }}>
    {icon && (
      <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
        {icon}
      </span>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: icon ? "14px 16px 14px 48px" : "14px 16px",
        borderRadius: 12,
        border: "1.5px solid var(--border)",
        background: "white",
        fontSize: 15,
        color: "var(--text-primary)",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onFocus={e => {
        e.target.style.borderColor = "var(--coral)";
        e.target.style.boxShadow = "0 0 0 3px rgba(255, 107, 91, 0.1)";
      }}
      onBlur={e => {
        e.target.style.borderColor = "var(--border)";
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

const Tag = ({ children, variant = "default", size = "sm", selected, onClick, onRemove }) => {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: size === "lg" ? "8px 14px" : "5px 10px",
    borderRadius: 8,
    fontSize: size === "lg" ? 14 : 12,
    fontWeight: 600,
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.15s ease",
    userSelect: "none",
  };

  const variants = {
    default: {
      background: selected ? "var(--ink)" : "var(--cream-dark)",
      color: selected ? "var(--cream)" : "var(--text-secondary)",
      border: "1px solid transparent",
    },
    coral: {
      background: "rgba(255, 107, 91, 0.12)",
      color: "var(--coral)",
      border: "1px solid rgba(255, 107, 91, 0.2)",
    },
    sage: {
      background: "rgba(126, 184, 158, 0.15)",
      color: "#5a9a7a",
      border: "1px solid rgba(126, 184, 158, 0.25)",
    },
    outline: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid var(--border)",
    },
  };

  return (
    <span onClick={onClick} style={{ ...baseStyle, ...variants[variant] }}>
      {children}
      {onRemove && (
        <span onClick={e => { e.stopPropagation(); onRemove(); }} style={{ cursor: "pointer", opacity: 0.6, display: "flex" }}>
          {Icons.x}
        </span>
      )}
    </span>
  );
};

const MatchScore = ({ score, size = "md" }) => {
  const color = score >= 90 ? "var(--coral)" : score >= 75 ? "var(--sage)" : score >= 60 ? "var(--gold)" : "var(--text-muted)";
  const sz = size === "lg" ? { w: 56, h: 56, fs: 18, stroke: 4 } : { w: 40, h: 40, fs: 13, stroke: 3 };
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: "relative", width: sz.w, height: sz.h }}>
      <svg width={sz.w} height={sz.h} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={sz.w/2} cy={sz.h/2} r="16" fill="none" stroke="var(--cream-dark)" strokeWidth={sz.stroke} />
        <circle cx={sz.w/2} cy={sz.h/2} r="16" fill="none" stroke={color} strokeWidth={sz.stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz.fs, fontWeight: 700, color }}>{score}</span>
    </div>
  );
};

const Avatar = ({ initials, size = 40, color }) => {
  const colors = ["#ff6b5b", "#7eb89e", "#9b8fd4", "#d4a853", "#5b9bd4"];
  const bg = color || colors[initials.charCodeAt(0) % colors.length];

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: `${bg}15`,
      border: `2px solid ${bg}30`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.38,
      fontWeight: 700,
      color: bg,
      flexShrink: 0,
      fontFamily: "'Clash Display', sans-serif",
    }}>
      {initials}
    </div>
  );
};

const Card = ({ children, style, hover, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "white",
      borderRadius: 20,
      border: "1px solid var(--border)",
      padding: 24,
      transition: "all 0.25s ease",
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
    onMouseEnter={e => {
      if (hover) {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 20px 40px rgba(13, 13, 15, 0.08)";
      }
    }}
    onMouseLeave={e => {
      if (hover) {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }
    }}
  >
    {children}
  </div>
);

const StatCard = ({ label, value, sub, icon, accent }) => (
  <Card style={{ flex: 1, minWidth: 180 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ color: accent || "var(--coral)", opacity: 0.8 }}>{icon}</span>
    </div>
    <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 32, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>{value}</div>
    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: accent || "var(--coral)", marginTop: 6, fontWeight: 600 }}>{sub}</div>}
  </Card>
);

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
          <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>HireFlow</span>
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
            <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20 }}>
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
                <h3 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>{role.title}</h3>
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
        © 2024 HireFlow. Built with AI.
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
          <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700 }}>HireFlow</span>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px" }}>
        <div style={{ maxWidth: 800, width: "100%", textAlign: "center" }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text-muted)", fontSize: 14, cursor: "pointer", marginBottom: 32 }}>
            {Icons.arrowLeft} Back
          </button>

          <h1 className="animate-in" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 42, fontWeight: 700, color: "var(--ink)", marginBottom: 16, letterSpacing: "-0.02em" }}>
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
                <h3 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>{opt.title}</h3>
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
          <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Analyzing Resume</h2>
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
            <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700 }}>HireFlow</span>
          </header>

          <div className="animate-in" style={{ marginBottom: 32 }}>
            <Tag variant="sage" style={{ marginBottom: 16 }}>{Icons.check} Resume parsed successfully</Tag>
            <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 36, fontWeight: 700, marginBottom: 8 }}>Review Your Profile</h1>
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
          <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700 }}>HireFlow</span>
        </div>

        <h1 className="animate-in" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 36, fontWeight: 700, marginBottom: 12 }}>Upload your resume</h1>
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
  const [profile, setProfile] = useState(existingProfile || {
    name: "", email: "", headline: "", location: "",
    skills: [], desiredRoles: [], experienceLevel: "", workPrefs: [], salaryRange: "",
    experience: [], education: [],
  });
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
      <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Let's build your profile</h2>
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
      <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>What are your skills?</h2>
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
      <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>What's your dream job?</h2>
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
      <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Work Experience</h2>
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
      <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>AI Summary</h2>
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
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700 }}>{profile.name || "Your Name"}</div>
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
            <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700 }}>HireFlow</span>
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

// ─── Sidebar ─────────────────────────────────────────────────────────
const Sidebar = ({ role, activeTab, setActiveTab, onLogout }) => {
  const roleColors = { seeker: "var(--coral)", recruiter: "var(--sage)", company: "var(--lavender)" };
  const roleLabels = { seeker: "Job Seeker", recruiter: "Recruiter", company: "Company" };

  const navItems = {
    seeker: [
      { key: "home", icon: Icons.briefcase, label: "Job Matches" },
      { key: "resume", icon: Icons.doc, label: "My Resume" },
      { key: "chat", icon: Icons.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: Icons.chart, label: "Analytics" },
    ],
    recruiter: [
      { key: "home", icon: Icons.users, label: "Candidates" },
      { key: "pipeline", icon: Icons.target, label: "Pipeline" },
      { key: "chat", icon: Icons.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: Icons.chart, label: "Analytics" },
    ],
    company: [
      { key: "home", icon: Icons.building, label: "Dashboard" },
      { key: "chat", icon: Icons.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: Icons.chart, label: "Analytics" },
    ],
  };

  return (
    <div style={{
      width: 240, height: "100vh", position: "fixed", left: 0, top: 0,
      background: "white", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", padding: "24px 16px", zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 8, color: "var(--ink)" }}>
        {Icons.logo}
        <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700 }}>HireFlow</span>
      </div>
      <div style={{ padding: "8px", fontSize: 11, color: roleColors[role], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {roleLabels[role]}
      </div>

      <nav style={{ flex: 1, marginTop: 16 }}>
        {navItems[role].map(item => (
          <div
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            style={{
              padding: "12px 14px", borderRadius: 12, marginBottom: 4, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12,
              background: activeTab === item.key ? "var(--cream)" : "transparent",
              color: activeTab === item.key ? "var(--ink)" : "var(--text-muted)",
              fontWeight: 600, fontSize: 14, transition: "all 0.15s",
            }}
          >
            <span style={{ color: activeTab === item.key ? roleColors[role] : "inherit" }}>{item.icon}</span>
            {item.label}
            {item.badge && (
              <span style={{
                marginLeft: "auto", minWidth: 20, height: 20, borderRadius: 10,
                background: "var(--coral)", color: "white",
                fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{item.badge}</span>
            )}
          </div>
        ))}
      </nav>

      <div
        onClick={onLogout}
        style={{
          padding: "12px 14px", borderRadius: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          color: "var(--text-muted)", fontSize: 14, fontWeight: 600,
          borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 20,
        }}
      >
        {Icons.arrowLeft} Switch Role
      </div>
    </div>
  );
};

// ─── Job Card ────────────────────────────────────────────────────────
const JobCard = ({ job, profile, onApply, applied, onSave, saved }) => {
  const matchingSkills = job.requiredSkills.filter(s => profile.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase()));

  return (
    <Card hover style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 20 }}>
        <MatchScore score={job.match} size="lg" />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <h3 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{job.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "var(--text-muted)" }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{job.company}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{Icons.mapPin} {job.location}</span>
                <span style={{ color: "var(--coral)", fontWeight: 600 }}>{job.salary}</span>
              </div>
            </div>
            <button onClick={onSave} style={{ background: "none", border: "none", cursor: "pointer", color: saved ? "var(--coral)" : "var(--text-muted)", padding: 8 }}>
              {Icons.heart}
            </button>
          </div>

          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>{job.desc}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {job.requiredSkills.map(s => (
              <Tag key={s} variant={matchingSkills.map(m => m.toLowerCase()).includes(s.toLowerCase()) ? "coral" : "outline"}>
                {matchingSkills.map(m => m.toLowerCase()).includes(s.toLowerCase()) && <span>{Icons.check}</span>} {s}
              </Tag>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {matchingSkills.length}/{job.requiredSkills.length} skills match · {job.posted}
            </div>
            <Button size="sm" variant={applied ? "outline" : "coral"} onClick={onApply} disabled={applied}>
              {applied ? <>{Icons.check} Applied</> : <>Apply {Icons.arrow}</>}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── Seeker Dashboard ────────────────────────────────────────────────
const SeekerDashboard = ({ profile, aiSummary, activeTab, onEditResume }) => {
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(new Set());
  const [applied, setApplied] = useState(new Set());

  // Compute matches
  const matchedJobs = JOBS.map(job => {
    const uSkills = profile.skills.map(s => s.toLowerCase());
    const reqMatch = job.requiredSkills.filter(s => uSkills.includes(s.toLowerCase())).length;
    const niceMatch = job.niceSkills.filter(s => uSkills.includes(s.toLowerCase())).length;
    let score = (reqMatch / job.requiredSkills.length) * 60 + (niceMatch / job.niceSkills.length) * 20;
    if (profile.desiredRoles.some(r => job.title.toLowerCase().includes(r.toLowerCase().split(" ")[0]))) score += 15;
    if (profile.workPrefs.includes("Remote") && job.remote) score += 5;
    return { ...job, match: Math.min(99, Math.max(40, Math.round(score))) };
  }).sort((a, b) => b.match - a.match);

  const filtered = matchedJobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  );

  if (activeTab === "resume") {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700 }}>My Resume</h1>
          <Button variant="outline" size="sm" onClick={onEditResume}>{Icons.edit} Edit</Button>
        </div>
        <Card>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{profile.name}</h2>
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
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Analytics</h1>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
          <StatCard label="Average Match" value={`${Math.round(matchedJobs.reduce((a, j) => a + j.match, 0) / matchedJobs.length)}%`} icon={Icons.chart} />
          <StatCard label="Strong Matches" value={matchedJobs.filter(j => j.match >= 80).length} sub="80%+ score" icon={Icons.spark} accent="var(--sage)" />
          <StatCard label="Applications" value={applied.size} icon={Icons.briefcase} accent="var(--lavender)" />
        </div>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Skill Demand</div>
          {profile.skills.slice(0, 5).map(skill => {
            const demand = JOBS.filter(j => [...j.requiredSkills, ...j.niceSkills].map(s => s.toLowerCase()).includes(skill.toLowerCase())).length;
            return (
              <div key={skill} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{skill}</span>
                  <span style={{ color: "var(--coral)", fontWeight: 700 }}>{demand} jobs</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--cream-dark)" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${(demand / JOBS.length) * 100}%`, background: "var(--coral)" }} />
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
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Welcome back, {profile.name?.split(" ")[0]}!</h1>
        <p style={{ color: "var(--text-secondary)" }}>AI found <span style={{ color: "var(--coral)", fontWeight: 700 }}>{matchedJobs.filter(j => j.match >= 70).length} strong matches</span> for you</p>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard label="Best Match" value={`${matchedJobs[0]?.match || 0}%`} sub={matchedJobs[0]?.title} icon={Icons.spark} />
        <StatCard label="Your Skills" value={profile.skills.length} icon={Icons.zap} accent="var(--sage)" />
        <StatCard label="Applied" value={applied.size} icon={Icons.briefcase} accent="var(--lavender)" />
      </div>

      <Input icon={Icons.search} placeholder="Search jobs..." value={search} onChange={setSearch} style={{ marginBottom: 24, maxWidth: 400 }} />

      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>{filtered.length} jobs ranked by match score</div>

      {filtered.map(job => (
        <JobCard
          key={job.id}
          job={job}
          profile={profile}
          applied={applied.has(job.id)}
          onApply={() => setApplied(a => new Set([...a, job.id]))}
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
        <div style={{ padding: "20px", fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700 }}>Messages</div>
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

  if (activeTab === "chat") return <ChatView />;

  if (activeTab === "pipeline") {
    return (
      <div>
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Hiring Pipeline</h1>
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
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Analytics</h1>
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
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Candidate Search</h1>
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
                <h3 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700 }}>{c.name}</h3>
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
  if (activeTab === "chat") return <ChatView />;

  if (activeTab === "analytics") {
    return (
      <div>
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Hiring Analytics</h1>
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
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Company Dashboard</h1>
        <p style={{ color: "var(--text-secondary)" }}><span style={{ color: "var(--lavender)", fontWeight: 700 }}>6 open positions</span> with AI-matched candidates</p>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard label="Open Roles" value="6" icon={Icons.briefcase} accent="var(--lavender)" />
        <StatCard label="Applicants" value="234" sub="+52 this week" icon={Icons.users} />
        <StatCard label="Match Quality" value="91%" icon={Icons.spark} accent="var(--sage)" />
      </div>

      <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Active Postings</h2>
      {JOBS.slice(0, 3).map(job => (
        <Card key={job.id} hover style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{job.title}</h3>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{job.location} · {job.salary}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 24, fontWeight: 700 }}>{job.applicants}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>applicants</div>
              </div>
              <Button size="sm">Review {Icons.arrow}</Button>
            </div>
          </div>
        </Card>
      ))}

      <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 16 }}>Recommended Candidates</h2>
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
  const [role, setRole] = useState(null);
  const [phase, setPhase] = useState("role-select");
  const [profile, setProfile] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [activeTab, setActiveTab] = useState("home");

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
    setRole(null);
    setPhase("role-select");
    setProfile(null);
    setAiSummary("");
    setActiveTab("home");
  };

  // Render based on phase
  if (phase === "role-select") return <RoleSelect onSelect={handleRoleSelect} />;
  if (phase === "seeker-choice") return <SeekerChoice onUpload={() => setPhase("upload")} onBuild={() => setPhase("build")} onBack={() => setPhase("role-select")} />;
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
