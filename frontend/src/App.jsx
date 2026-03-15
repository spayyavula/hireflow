import { useState, useEffect, useRef } from "react";
import api from "./api";

// ═══════════════════════════════════════════════════════════════════
// HIREFLOW REDESIGN — Classic Corporate Aesthetic
// Typography: Playfair Display + Source Sans 3
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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

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
      font-family: 'Source Sans 3', 'Inter', -apple-system, sans-serif;
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
      <rect x="8" y="12" width="12" height="9" rx="1.5" stroke="var(--cream)" strokeWidth="1.8" fill="none"/>
      <path d="M13 12V10.5a2.5 2.5 0 0 1 5 0V12" stroke="var(--cream)" strokeWidth="1.8" fill="none"/>
      <circle cx="20" cy="19" r="4" stroke="var(--coral)" strokeWidth="2" fill="rgba(255,107,91,0.15)"/>
      <path d="M23 22l3 3" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"/>
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
    fontFamily: "'Source Sans 3', sans-serif",
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
      fontFamily: "'Playfair Display', serif",
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
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>{value}</div>
    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: accent || "var(--coral)", marginTop: 6, fontWeight: 600 }}>{sub}</div>}
  </Card>
);

// ─── Public Nav ─────────────────────────────────────────────────────
const PublicNav = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const navLinks = [
    { key: "features", label: "Features" },
    { key: "pricing", label: "Pricing" },
    { key: "about", label: "About" },
    { key: "ideas", label: "Ideas" },
    { key: "blog", label: "Blog" },
  ];

  return (
    <header style={{
      padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, background: "rgba(250,248,245,0.85)", backdropFilter: "blur(12px)",
      zIndex: 100, borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div onClick={() => onNavigate("home")} style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink)", cursor: "pointer" }}>
          {Icons.logo}
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>JobsSearch</span>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          {navLinks.map(link => (
            <button key={link.key} onClick={() => onNavigate(link.key)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", background: "transparent",
              fontSize: 14, fontWeight: 600, cursor: "pointer", color: currentPage === link.key ? "var(--coral)" : "var(--text-secondary)",
              fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s", position: "relative",
              borderBottom: currentPage === link.key ? "2px solid var(--coral)" : "2px solid transparent",
            }}>{link.label}</button>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onSignIn} style={{
          padding: "10px 24px", borderRadius: 10, border: "1.5px solid var(--border-strong)",
          background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer",
          color: "var(--text-primary)", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
        }}>Sign In</button>
        <button onClick={onGetStarted} style={{
          padding: "10px 24px", borderRadius: 10, border: "none",
          background: "var(--coral)", color: "white", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
        }}>Get Started</button>
      </div>
    </header>
  );
};

// ─── Landing Page ────────────────────────────────────────────────────
const LandingPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const featuredJobs = JOBS.slice(0, 3);

  const steps = [
    { num: "01", icon: Icons.user, title: "Create Your Profile", desc: "Upload your resume or build one with our AI assistant — it takes under two minutes." },
    { num: "02", icon: Icons.spark, title: "AI Matching", desc: "Our intelligent scoring algorithm analyzes skills, experience, and preferences to find perfect fits." },
    { num: "03", icon: Icons.briefcase, title: "Get Hired", desc: "Connect directly with recruiters and companies through real-time chat and one-click applications." },
  ];

  const roles = [
    {
      title: "Job Seekers", accent: "var(--coral)", icon: Icons.user,
      points: ["AI-powered resume builder", "Smart job matching scores", "One-click applications"],
    },
    {
      title: "Recruiters", accent: "var(--sage)", icon: Icons.users,
      points: ["Candidate pipeline management", "AI scoring & ranking", "Real-time chat with talent"],
    },
    {
      title: "Companies", accent: "var(--lavender)", icon: Icons.building,
      points: ["Easy job posting", "Analytics dashboard", "Curated talent pool"],
    },
  ];

  const stats = [
    { value: "10,000+", label: "Matches Made" },
    { value: "500+", label: "Companies" },
    { value: "96%", label: "Satisfaction" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", overflow: "hidden" }}>
      <GlobalStyles />

      {/* ── Nav ── */}
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* ── Hero ── */}
      <section style={{ position: "relative", padding: "100px 48px 80px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        {/* Decorative orbs */}
        <div style={{
          position: "absolute", top: -40, right: -80, width: 260, height: 260, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,91,0.12) 0%, transparent 70%)",
          animation: "float 6s ease-in-out infinite", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -20, left: -60, width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(155,143,212,0.10) 0%, transparent 70%)",
          animation: "float 8s ease-in-out infinite 1s", pointerEvents: "none",
        }} />

        <div className="animate-in" style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 24, letterSpacing: "0.02em",
          }}>
            AI-Powered Job Marketplace
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 700,
            lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 20,
          }}>
            Where talent meets<br />opportunity
          </h1>
          <p style={{
            fontSize: 18, color: "var(--text-secondary)", maxWidth: 540, margin: "0 auto 40px",
            lineHeight: 1.7,
          }}>
            The three-sided marketplace connecting job seekers, recruiters, and companies
            with intelligent matching and real-time collaboration.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button onClick={onGetStarted} style={{
              padding: "14px 36px", borderRadius: 12, border: "none",
              background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
              boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
            }}>Get Started Free</button>
            <button onClick={onSignIn} style={{
              padding: "14px 36px", borderRadius: 12, border: "1.5px solid var(--border-strong)",
              background: "transparent", fontSize: 16, fontWeight: 600,
              cursor: "pointer", color: "var(--text-primary)", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
            }}>Sign In</button>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="animate-in-delay-1" style={{
        display: "flex", justifyContent: "center", gap: 0, padding: "0 48px 64px",
      }}>
        <div style={{
          display: "flex", gap: 0, background: "white", borderRadius: 16,
          border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
          overflow: "hidden",
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              padding: "24px 48px", textAlign: "center",
              borderRight: i < stats.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
        <div className="animate-in-delay-2" style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
            color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12,
          }}>How it works</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
            From profile to placement in three simple steps
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {steps.map((step, i) => (
            <div key={i} className={`animate-in-delay-${i + 1}`} style={{
              background: "white", borderRadius: 20, padding: 32,
              border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
              transition: "all 0.2s ease",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,107,91,0.08)", color: "var(--coral)",
                }}>
                  {step.icon}
                </div>
                <span style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700,
                  color: "var(--text-muted)", letterSpacing: "0.04em",
                }}>{step.num}</span>
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700,
                color: "var(--ink)", marginBottom: 8,
              }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Role Cards ── */}
      <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
            color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12,
          }}>Built for everyone</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
            Whether you're hiring or looking — JobsSearch has you covered
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {roles.map((r, i) => (
            <div key={i} className={`animate-in-delay-${i + 1}`} style={{
              background: "white", borderRadius: 20, padding: 28,
              border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
              transition: "all 0.25s ease", cursor: "default",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,13,15,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,13,15,0.04)"; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                background: `${r.accent}14`, color: r.accent, marginBottom: 20,
              }}>
                {r.icon}
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
                color: "var(--ink)", marginBottom: 16,
              }}>{r.title}</h3>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {r.points.map((pt, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                    <span style={{ color: r.accent, flexShrink: 0 }}>{Icons.check}</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Jobs ── */}
      <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
            color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12,
          }}>Featured opportunities</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
            Top roles from companies using JobsSearch right now
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {featuredJobs.map((job, i) => (
            <div key={job.id} className={`animate-in-delay-${i + 1}`} style={{
              background: "white", borderRadius: 20, padding: 24,
              border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
              transition: "all 0.25s ease", cursor: "default",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,13,15,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,13,15,0.04)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: "var(--ink)", color: "var(--cream)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700,
                }}>
                  {job.company.slice(0, 2).toUpperCase()}
                </div>
                <div style={{
                  padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: "rgba(255,107,91,0.08)", color: "var(--coral)",
                }}>
                  {job.match}% match
                </div>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{job.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>{job.company} · {job.location}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {job.tags.map(tag => (
                  <span key={tag} style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                    background: "var(--cream)", color: "var(--text-secondary)",
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section style={{
        padding: "80px 48px", textAlign: "center",
        background: "var(--ink)", color: "var(--cream)", margin: "64px 0 0",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700,
          letterSpacing: "-0.02em", marginBottom: 16,
        }}>Ready to transform your hiring?</h2>
        <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Join thousands of professionals already using JobsSearch to find their perfect match.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={onGetStarted} style={{
            padding: "14px 36px", borderRadius: 12, border: "none",
            background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
            boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
          }}>Create Free Account</button>
          <button onClick={() => onNavigate("features")} style={{
            padding: "14px 36px", borderRadius: 12, border: "1.5px solid rgba(250,248,245,0.2)",
            background: "transparent", color: "var(--cream)", fontSize: 16, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
          }}>See Features</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
      }}>
        © 2026 JobsSearch. Built with AI.
      </footer>
    </div>
  );
};

// ─── Features Page ──────────────────────────────────────────────────
const FeaturesPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const [featureTab, setFeatureTab] = useState("seekers");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const tabs = [
    { key: "seekers", label: "Job Seekers", accent: "var(--coral)" },
    { key: "recruiters", label: "Recruiters", accent: "var(--sage)" },
    { key: "companies", label: "Companies", accent: "var(--lavender)" },
  ];

  const features = {
    seekers: [
      { icon: Icons.spark, title: "AI Match Scoring", desc: "Get a 0-99 compatibility score for every job based on your skills, experience, and preferences." },
      { icon: Icons.doc, title: "Resume Builder & Analyzer", desc: "Build a professional resume or upload yours for AI-powered feedback and optimization." },
      { icon: Icons.search, title: "Smart Job Search", desc: "Filter by role, location, salary, and remote preference with intelligent suggestions." },
      { icon: Icons.zap, title: "One-Click Apply", desc: "Apply to jobs instantly with your saved profile — no repetitive forms." },
      { icon: Icons.chat, title: "Real-Time Chat", desc: "Message recruiters and hiring managers directly within the platform." },
    ],
    recruiters: [
      { icon: Icons.spark, title: "AI Candidate Ranking", desc: "Candidates automatically scored and ranked by fit for each open role." },
      { icon: Icons.chart, title: "Pipeline Management", desc: "Track candidates through 5 stages: Applied, Screening, Interview, Offer, Hired." },
      { icon: Icons.search, title: "Candidate Search", desc: "Search the full talent pool by skills, experience, location, and availability." },
      { icon: Icons.chat, title: "Direct Messaging", desc: "Reach out to candidates in real-time to schedule interviews or answer questions." },
      { icon: Icons.chart, title: "Analytics Dashboard", desc: "Track time-to-hire, pipeline health, conversion rates, and team performance." },
    ],
    companies: [
      { icon: Icons.briefcase, title: "Job Posting", desc: "Create and manage job listings with required skills, salary ranges, and descriptions." },
      { icon: Icons.users, title: "Curated Talent Pool", desc: "Access pre-scored candidates matched to your company's open roles." },
      { icon: Icons.user, title: "Multi-Role Management", desc: "Manage recruiters, hiring managers, and admins under one company account." },
      { icon: Icons.chart, title: "Hiring Analytics", desc: "Company-wide dashboards showing hiring velocity, DEI metrics, and cost-per-hire." },
      { icon: Icons.users, title: "Team Collaboration", desc: "Share candidate notes, interview feedback, and pipeline updates across your team." },
    ],
  };

  const comparisonFeatures = [
    { name: "AI Match Scoring", seekers: true, recruiters: true, companies: true },
    { name: "Resume Builder", seekers: true, recruiters: false, companies: false },
    { name: "One-Click Apply", seekers: true, recruiters: false, companies: false },
    { name: "Pipeline Management", seekers: false, recruiters: true, companies: true },
    { name: "Candidate Search", seekers: false, recruiters: true, companies: true },
    { name: "Analytics Dashboard", seekers: false, recruiters: true, companies: true },
    { name: "Real-Time Chat", seekers: true, recruiters: true, companies: true },
    { name: "Job Posting", seekers: false, recruiters: false, companies: true },
    { name: "Team Collaboration", seekers: false, recruiters: true, companies: true },
  ];

  const activeAccent = tabs.find(t => t.key === featureTab)?.accent || "var(--coral)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: "80px 48px 60px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
          background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 24, letterSpacing: "0.02em",
        }}>Platform Features</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 16,
        }}>Everything you need to hire and get hired</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          Powerful tools for every side of the hiring equation — whether you're searching, recruiting, or building a team.
        </p>
      </section>

      {/* Tabbed Features */}
      <section style={{ padding: "0 48px 80px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 48 }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setFeatureTab(tab.key)} style={{
              padding: "10px 24px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
              background: featureTab === tab.key ? tab.accent : "transparent",
              color: featureTab === tab.key ? "white" : "var(--text-secondary)",
            }}>{tab.label}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {features[featureTab].map((f, i) => (
            <Card key={i} hover style={{ padding: 28 }}>
              <div style={{ color: activeAccent, marginBottom: 16, opacity: 0.9 }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Core Technology Strip */}
      <section style={{ background: "var(--ink)", padding: "56px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "center", gap: 64, flexWrap: "wrap" }}>
          {[
            { icon: Icons.spark, title: "AI Matching Engine", desc: "Rule-based scoring analyzing skills, roles, and preferences" },
            { icon: Icons.chat, title: "Real-Time Collaboration", desc: "Instant messaging between all parties on the platform" },
            { icon: Icons.target, title: "Privacy by Design", desc: "Row-level security and encrypted data at every layer" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center", maxWidth: 240 }}>
              <div style={{ color: "var(--coral)", marginBottom: 12 }}>{item.icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "var(--cream)", marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(250,248,245,0.6)", lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section style={{ padding: "80px 48px", maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48,
        }}>Feature comparison</h2>
        <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "16px 24px", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Feature</th>
                <th style={{ padding: "16px 24px", textAlign: "center", fontWeight: 600, color: "var(--coral)" }}>Seekers</th>
                <th style={{ padding: "16px 24px", textAlign: "center", fontWeight: 600, color: "var(--sage)" }}>Recruiters</th>
                <th style={{ padding: "16px 24px", textAlign: "center", fontWeight: 600, color: "var(--lavender)" }}>Companies</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < comparisonFeatures.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td style={{ padding: "14px 24px", fontWeight: 500, color: "var(--ink)" }}>{row.name}</td>
                  {["seekers", "recruiters", "companies"].map(role => (
                    <td key={role} style={{ padding: "14px 24px", textAlign: "center" }}>
                      {row[role] ? <span style={{ color: "var(--coral)" }}>{Icons.check}</span> : <span style={{ color: "var(--border-strong)" }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        padding: "80px 48px", textAlign: "center",
        background: "var(--ink)", color: "var(--cream)",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700,
          letterSpacing: "-0.02em", marginBottom: 16,
        }}>Ready to get started?</h2>
        <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Create your free account and experience intelligent hiring today.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={onGetStarted} style={{
            padding: "14px 36px", borderRadius: 12, border: "none",
            background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
            boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
          }}>Start for Free</button>
          <button onClick={() => onNavigate("pricing")} style={{
            padding: "14px 36px", borderRadius: 12, border: "1.5px solid rgba(250,248,245,0.2)",
            background: "transparent", color: "var(--cream)", fontSize: 16, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
          }}>See Pricing</button>
        </div>
      </section>

      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
      }}>
        © 2026 JobsSearch. Built with AI.
      </footer>
    </div>
  );
};

// ─── Pricing Page ───────────────────────────────────────────────────
const PricingPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const plans = [
    {
      name: "Seeker Free", price: 0, annual: 0, accent: "var(--coral)", badge: null,
      desc: "Everything you need to land your next role",
      features: ["20 AI matches per week", "1 resume profile", "Unlimited applications", "5 active chat threads", "Basic job search filters"],
    },
    {
      name: "Recruiter Starter", price: 49, annual: 39, accent: "var(--sage)", badge: "Most Popular",
      desc: "Essential tools for growing recruiting teams",
      features: ["Full candidate database access", "3 active job roles", "50 pipeline candidates", "Unlimited chat", "Basic analytics"],
    },
    {
      name: "Recruiter Pro", price: 129, annual: 103, accent: "var(--lavender)", badge: null,
      desc: "Advanced features for high-volume hiring",
      features: ["Unlimited job roles", "Advanced analytics & reports", "Automation workflows", "Priority support", "Custom pipeline stages"],
    },
    {
      name: "Company Enterprise", price: -1, annual: -1, accent: "var(--gold)", badge: null,
      desc: "Tailored solutions for large organizations",
      features: ["Unlimited seats & roles", "SSO & SAML integration", "API access", "Dedicated account manager", "99.9% SLA guarantee"],
    },
  ];

  const faqs = [
    { q: "Can I switch plans at any time?", a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle, and we'll prorate any differences." },
    { q: "Is there a free trial for paid plans?", a: "All paid plans come with a 14-day free trial. No credit card required to start — you'll only be charged when the trial ends and you choose to continue." },
    { q: "What are the limits on the free plan?", a: "The Seeker Free plan includes 20 AI match scores per week, 1 resume profile, unlimited job applications, and up to 5 active chat conversations." },
    { q: "Do you offer nonprofit or education discounts?", a: "Yes, we offer a 30% discount for registered nonprofits and educational institutions. Contact our sales team to get set up." },
    { q: "How do you handle data security?", a: "All data is encrypted at rest and in transit. We use Supabase with Row Level Security, and our infrastructure is SOC 2 Type II compliant." },
    { q: "What's your cancellation policy?", a: "You can cancel at any time from your account settings. You'll retain access to paid features through the end of your current billing period." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: "80px 48px 40px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 16,
        }}>The right plan for every team</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Start free and scale as you grow. No hidden fees, no surprises.
        </p>

        {/* Billing Toggle */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: "white", padding: "6px 8px", borderRadius: 12, border: "1px solid var(--border)" }}>
          <button onClick={() => setBillingCycle("monthly")} style={{
            padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
            background: billingCycle === "monthly" ? "var(--ink)" : "transparent",
            color: billingCycle === "monthly" ? "var(--cream)" : "var(--text-secondary)",
          }}>Monthly</button>
          <button onClick={() => setBillingCycle("annual")} style={{
            padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
            background: billingCycle === "annual" ? "var(--ink)" : "transparent",
            color: billingCycle === "annual" ? "var(--cream)" : "var(--text-secondary)",
          }}>Annual <span style={{ color: "var(--coral)", fontWeight: 700, fontSize: 12 }}>-20%</span></button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: "40px 48px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {plans.map((plan, i) => {
            const displayPrice = plan.price === -1 ? null : billingCycle === "annual" ? plan.annual : plan.price;
            return (
              <div key={i} style={{
                background: "white", borderRadius: 20, border: plan.badge ? `2px solid ${plan.accent}` : "1px solid var(--border)",
                padding: 32, display: "flex", flexDirection: "column", position: "relative",
                transition: "all 0.25s ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(13,13,15,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: plan.accent, color: "white",
                  }}>{plan.badge}</div>
                )}
                <div style={{ fontSize: 13, fontWeight: 600, color: plan.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{plan.name}</div>
                <div style={{ marginBottom: 8 }}>
                  {displayPrice !== null ? (
                    <>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, color: "var(--ink)" }}>${displayPrice}</span>
                      {displayPrice > 0 && <span style={{ fontSize: 15, color: "var(--text-muted)" }}>/mo</span>}
                      {displayPrice === 0 && <span style={{ fontSize: 15, color: "var(--text-muted)", marginLeft: 4 }}>forever</span>}
                    </>
                  ) : (
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: "var(--ink)" }}>Custom</span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.5 }}>{plan.desc}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  {plan.features.map((feat, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                      <span style={{ color: plan.accent, flexShrink: 0, marginTop: 2 }}>{Icons.check}</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <button onClick={displayPrice === null ? undefined : onGetStarted} style={{
                  width: "100%", padding: "12px 24px", borderRadius: 10, border: "none",
                  background: plan.badge ? plan.accent : "var(--ink)", color: "white",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
                  transition: "all 0.2s",
                }}>{displayPrice === null ? "Contact Sales" : displayPrice === 0 ? "Get Started Free" : "Start Free Trial"}</button>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section style={{ padding: "0 48px 80px", maxWidth: 700, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48,
        }}>Frequently asked questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden",
              transition: "all 0.2s",
            }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                width: "100%", padding: "20px 24px", border: "none", background: "transparent",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", textAlign: "left" }}>{faq.q}</span>
                <span style={{
                  color: "var(--text-muted)", transition: "transform 0.2s", flexShrink: 0, marginLeft: 16,
                  transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                }}>{Icons.plus}</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "0 24px 20px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        padding: "80px 48px", textAlign: "center",
        background: "var(--ink)", color: "var(--cream)",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700,
          letterSpacing: "-0.02em", marginBottom: 16,
        }}>Start free today</h2>
        <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Join thousands of professionals finding their perfect match with JobsSearch.
        </p>
        <button onClick={onGetStarted} style={{
          padding: "14px 36px", borderRadius: 12, border: "none",
          background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
          boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
        }}>Create Free Account</button>
      </section>

      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
      }}>
        © 2026 JobsSearch. Built with AI.
      </footer>
    </div>
  );
};

// ─── About Page ─────────────────────────────────────────────────────
const AboutPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const values = [
    { icon: Icons.target, title: "Transparency", desc: "Clear match scores, honest pricing, and open communication at every step." },
    { icon: Icons.zap, title: "Speed", desc: "From profile to interview in 48 hours — because great talent doesn't wait." },
    { icon: Icons.check, title: "Fairness", desc: "AI that evaluates skills and fit, removing bias from the hiring process." },
    { icon: Icons.doc, title: "Privacy", desc: "Your data belongs to you. Row-level security and encryption by default." },
    { icon: Icons.spark, title: "Intelligence", desc: "Matching algorithms that get smarter with every interaction on the platform." },
    { icon: Icons.users, title: "Community", desc: "A marketplace that works for everyone — seekers, recruiters, and companies alike." },
  ];

  const team = [
    { name: "Alex Rivera", role: "CEO & Co-founder", initials: "AR", bio: "Former VP of Talent at a Fortune 500. Spent a decade frustrated by broken hiring tools." },
    { name: "Jamie Chen", role: "CTO & Co-founder", initials: "JC", bio: "Ex-Google engineer who built ML systems at scale. Believes AI should serve people, not replace them." },
    { name: "Morgan Hayes", role: "Head of Product", initials: "MH", bio: "Product leader from LinkedIn and Indeed. Obsessed with making complex workflows feel simple." },
    { name: "Sam Patel", role: "Head of Growth", initials: "SP", bio: "Growth veteran from Stripe and Notion. Focused on building a platform people genuinely love." },
  ];

  const stats = [
    { value: "10,000+", label: "Matches Made" },
    { value: "500+", label: "Companies" },
    { value: "96%", label: "Satisfaction" },
    { value: "48h", label: "Avg First Interview" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: "80px 48px 60px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
          background: "rgba(155,143,212,0.1)", color: "var(--lavender)", marginBottom: 24, letterSpacing: "0.02em",
        }}>Our Story</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 16,
        }}>Built by people who've been on both sides of the table</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          We've been the candidate refreshing our inbox, the recruiter drowning in spreadsheets, and the hiring manager struggling to find signal in the noise. JobsSearch exists because we knew there had to be a better way.
        </p>
      </section>

      {/* Mission Quote */}
      <section style={{ padding: "40px 48px 80px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <blockquote style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 500,
          color: "var(--ink)", lineHeight: 1.4, fontStyle: "italic", letterSpacing: "-0.01em",
          borderLeft: "4px solid var(--coral)", paddingLeft: 32, textAlign: "left", margin: "0 auto", maxWidth: 700,
        }}>
          "Hiring should feel like a conversation, not a transaction. We're building the platform that makes that possible."
        </blockquote>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 20, textAlign: "left", paddingLeft: 32, maxWidth: 700, margin: "20px auto 0" }}>
          — Alex Rivera, CEO
        </p>
      </section>

      {/* How It Works */}
      <section style={{ padding: "64px 48px", background: "white", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
            color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 56,
          }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 24, alignItems: "center" }}>
            {/* Job Seekers */}
            <div style={{ textAlign: "center", padding: 24 }}>
              <div style={{ color: "var(--coral)", marginBottom: 16, display: "flex", justifyContent: "center" }}>{Icons.user}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Job Seekers</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>Create profiles, get matched, apply with one click</p>
            </div>
            <div style={{ color: "var(--coral)", fontSize: 24 }}>→</div>
            {/* Platform */}
            <div style={{ textAlign: "center", padding: 32, background: "var(--cream)", borderRadius: 20, border: "1px solid var(--border)" }}>
              <div style={{ color: "var(--ink)", marginBottom: 16, display: "flex", justifyContent: "center" }}>{Icons.logo}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>JobsSearch Platform</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>AI matching, real-time chat, analytics</p>
            </div>
            <div style={{ color: "var(--lavender)", fontSize: 24 }}>←</div>
            {/* Companies */}
            <div style={{ textAlign: "center", padding: 24 }}>
              <div style={{ color: "var(--lavender)", marginBottom: 16, display: "flex", justifyContent: "center" }}>{Icons.building}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Companies</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>Post roles, review candidates, hire faster</p>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 12, background: "rgba(126,184,158,0.1)", border: "1px solid rgba(126,184,158,0.2)" }}>
              <span style={{ color: "var(--sage)" }}>{Icons.users}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--sage)" }}>Recruiters bridge both sides</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "64px 48px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>{stat.value}</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values Grid */}
      <section style={{ padding: "0 48px 80px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48,
        }}>What we stand for</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {values.map((v, i) => (
            <Card key={i} hover style={{ padding: 28 }}>
              <div style={{ color: "var(--coral)", marginBottom: 16, opacity: 0.9 }}>{v.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{v.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{v.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: "64px 48px", background: "white", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
            color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48,
          }}>The team behind JobsSearch</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {team.map((person, i) => (
              <div key={i} style={{ textAlign: "center", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <Avatar initials={person.initials} size={64} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{person.name}</h3>
                <p style={{ fontSize: 13, color: "var(--coral)", fontWeight: 600, marginBottom: 12 }}>{person.role}</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{person.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        padding: "80px 48px", textAlign: "center",
        background: "var(--ink)", color: "var(--cream)",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700,
          letterSpacing: "-0.02em", marginBottom: 16,
        }}>Join the JobsSearch community</h2>
        <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Whether you're hiring or looking, we're building the future of work together.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={onGetStarted} style={{
            padding: "14px 36px", borderRadius: 12, border: "none",
            background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
            boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
          }}>Get Started Free</button>
          <button onClick={() => onNavigate("features")} style={{
            padding: "14px 36px", borderRadius: 12, border: "1.5px solid rgba(250,248,245,0.2)",
            background: "transparent", color: "var(--cream)", fontSize: 16, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
          }}>See How It Works</button>
        </div>
      </section>

      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
      }}>
        © 2026 JobsSearch. Built with AI.
      </footer>
    </div>
  );
};

// ─── Ideas Board (Feature Requests) ─────────────────────────────────
const FEATURE_CATEGORIES = ["All", "Job Search", "Resume Tools", "Recruiter Tools", "Company Dashboard", "Chat & Messaging", "AI Features", "General"];
const FEATURE_STATUSES = ["All", "submitted", "under_review", "planned", "in_progress", "shipped"];
const STATUS_CONFIG = {
  submitted: { label: "Submitted", color: "var(--text-muted)", bg: "rgba(138,138,150,0.1)" },
  under_review: { label: "Under Review", color: "var(--gold)", bg: "rgba(212,168,83,0.1)" },
  planned: { label: "Planned", color: "var(--lavender)", bg: "rgba(155,143,212,0.1)" },
  in_progress: { label: "In Progress", color: "var(--coral)", bg: "rgba(255,107,91,0.1)" },
  shipped: { label: "Shipped", color: "var(--sage)", bg: "rgba(126,184,158,0.1)" },
};
const CATEGORY_COLORS = {
  "Job Search": "var(--coral)", "Resume Tools": "var(--sage)", "Recruiter Tools": "var(--lavender)",
  "Company Dashboard": "var(--gold)", "Chat & Messaging": "#5b9bd5", "AI Features": "#e06090", "General": "var(--text-muted)",
};
const ROLE_BADGES = {
  seeker: { label: "Seeker", color: "var(--coral)", bg: "rgba(255,107,91,0.08)" },
  recruiter: { label: "Recruiter", color: "var(--sage)", bg: "rgba(126,184,158,0.08)" },
  company: { label: "Company", color: "var(--lavender)", bg: "rgba(155,143,212,0.08)" },
};

const IdeasBoard = ({ onGetStarted, onSignIn, onNavigate, currentPage, user }) => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("votes");
  const [showSubmit, setShowSubmit] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState("");
  const [submitForm, setSubmitForm] = useState({ title: "", description: "", category: "General" });
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState({});
  const [error, setError] = useState("");

  const isPublic = !!onNavigate; // public page has nav props
  const isLoggedIn = !!api.token;

  const loadFeatures = async () => {
    try {
      const params = {};
      if (category !== "All") params.category = category;
      if (statusFilter !== "All") params.status = statusFilter;
      params.sort = sort;
      const data = await api.listFeatures(params);
      setFeatures(data);
    } catch (e) {
      console.error("Failed to load features:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeatures(); }, [category, statusFilter, sort]);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleVote = async (id) => {
    if (!isLoggedIn) {
      if (onGetStarted) onGetStarted();
      return;
    }
    setVoting(v => ({ ...v, [id]: true }));
    try {
      await api.voteFeature(id);
      await loadFeatures();
    } catch (e) {
      setError(e.message);
    } finally {
      setVoting(v => ({ ...v, [id]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!submitForm.title.trim() || !submitForm.description.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await api.createFeature(submitForm);
      setShowSubmit(false);
      setSubmitForm({ title: "", description: "", category: "General" });
      await loadFeatures();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loadComments = async (id) => {
    try {
      const data = await api.getFeatureComments(id);
      setComments(c => ({ ...c, [id]: data }));
    } catch (e) {
      console.error("Failed to load comments:", e);
    }
  };

  const handleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!comments[id]) loadComments(id);
    }
  };

  const handleComment = async (featureId) => {
    if (!commentText.trim()) return;
    try {
      await api.addFeatureComment(featureId, commentText);
      setCommentText("");
      await loadComments(featureId);
      await loadFeatures();
    } catch (e) {
      setError(e.message);
    }
  };

  const totalVotes = features.reduce((s, f) => s + f.vote_count, 0);
  const shippedCount = features.filter(f => f.status === "shipped").length;

  const content = (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
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
          Shape the future of JobsSearch. Submit ideas, vote on what matters, and watch features come to life.
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
          <button onClick={() => setShowSubmit(true)} style={{
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

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {FEATURE_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid",
            borderColor: category === c ? "var(--coral)" : "var(--border)",
            background: category === c ? "rgba(255,107,91,0.08)" : "white",
            color: category === c ? "var(--coral)" : "var(--text-secondary)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
            transition: "all 0.15s",
          }}>{c}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 32, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {FEATURE_STATUSES.map(s => {
            const cfg = s === "All" ? { label: "All", color: "var(--text-secondary)", bg: "white" } : STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: "5px 12px", borderRadius: 16, border: "1px solid",
                borderColor: statusFilter === s ? cfg.color : "var(--border)",
                background: statusFilter === s ? cfg.bg : "transparent",
                color: statusFilter === s ? cfg.color : "var(--text-muted)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
                transition: "all 0.15s",
              }}>{cfg.label}</button>
            );
          })}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Sort:</span>
          {[{ key: "votes", label: "Top Voted" }, { key: "newest", label: "Newest" }].map(s => (
            <button key={s.key} onClick={() => setSort(s.key)} style={{
              padding: "5px 12px", borderRadius: 16, border: "1px solid",
              borderColor: sort === s.key ? "var(--ink)" : "var(--border)",
              background: sort === s.key ? "var(--ink)" : "transparent",
              color: sort === s.key ? "var(--cream)" : "var(--text-muted)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 16, fontSize: 14, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {error}
          <span onClick={() => setError("")} style={{ cursor: "pointer" }}>{Icons.x}</span>
        </div>
      )}

      {/* Feature Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 40, height: 40, margin: "0 auto 16px", borderRadius: 20, border: "3px solid var(--cream-dark)", borderTopColor: "var(--coral)", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading ideas...</p>
        </div>
      ) : features.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 20, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💡</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No ideas yet</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>Be the first to submit a feature request!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {features.map(f => {
            const statusCfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.submitted;
            const catColor = CATEGORY_COLORS[f.category] || "var(--text-muted)";
            const roleBadge = ROLE_BADGES[f.user_role];
            const isExpanded = expandedId === f.id;
            const featureComments = comments[f.id] || [];

            return (
              <div key={f.id} style={{
                background: "white", borderRadius: 20, border: "1px solid var(--border)",
                overflow: "hidden", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,13,15,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", gap: 0 }}>
                  {/* Vote column */}
                  <div style={{
                    padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", borderRight: "1px solid var(--border)", minWidth: 72,
                    background: f.user_has_voted ? "rgba(255,107,91,0.04)" : "transparent",
                  }}>
                    <button onClick={() => handleVote(f.id)} disabled={voting[f.id]} style={{
                      width: 44, height: 44, borderRadius: 12, border: "1.5px solid",
                      borderColor: f.user_has_voted ? "var(--coral)" : "var(--border-strong)",
                      background: f.user_has_voted ? "var(--coral)" : "transparent",
                      color: f.user_has_voted ? "white" : "var(--text-muted)",
                      cursor: voting[f.id] ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s", flexDirection: "column", fontSize: 10,
                    }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    </button>
                    <span style={{
                      fontSize: 18, fontWeight: 800, color: f.user_has_voted ? "var(--coral)" : "var(--ink)", marginTop: 4,
                      fontFamily: "'Playfair Display', serif",
                    }}>{f.vote_count}</span>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                        background: catColor, color: "white", opacity: 0.9,
                      }}>{f.category}</span>
                      <span style={{
                        padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: statusCfg.bg, color: statusCfg.color,
                      }}>{statusCfg.label}</span>
                      {roleBadge && (
                        <span style={{
                          padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: roleBadge.bg, color: roleBadge.color,
                        }}>{roleBadge.label}</span>
                      )}
                    </div>
                    <h3 style={{
                      fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 6, lineHeight: 1.3,
                      fontFamily: "'Source Sans 3', sans-serif",
                    }}>{f.title}</h3>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
                      {f.description.length > 200 && !isExpanded ? f.description.slice(0, 200) + "..." : f.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--text-muted)" }}>
                      <span style={{ fontWeight: 600 }}>by {f.user_name}</span>
                      <span>·</span>
                      <span>{f.created_at ? new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                      <button onClick={() => handleExpand(f.id)} style={{
                        background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                        gap: 4, color: isExpanded ? "var(--coral)" : "var(--text-muted)", fontWeight: 600, fontSize: 13,
                        fontFamily: "'Source Sans 3', sans-serif", padding: 0,
                      }}>
                        {Icons.chat} {f.comment_count} {f.comment_count === 1 ? "comment" : "comments"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Comments */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px", background: "var(--cream)" }}>
                    {featureComments.length === 0 ? (
                      <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>No comments yet. Start the conversation!</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                        {featureComments.map(c => {
                          const cRole = ROLE_BADGES[c.user_role];
                          return (
                            <div key={c.id} style={{ display: "flex", gap: 12 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: 18, background: cRole ? cRole.bg : "var(--cream-dark)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, fontWeight: 700, color: cRole ? cRole.color : "var(--text-muted)", flexShrink: 0,
                              }}>{(c.user_name || "?").charAt(0).toUpperCase()}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{c.user_name}</span>
                                  {cRole && <span style={{ fontSize: 10, fontWeight: 600, color: cRole.color, background: cRole.bg, padding: "1px 6px", borderRadius: 8 }}>{cRole.label}</span>}
                                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                                </div>
                                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{c.content}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {isLoggedIn && (
                      <div style={{ display: "flex", gap: 10 }}>
                        <input
                          value={commentText} onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleComment(f.id)}
                          placeholder="Add a comment..."
                          style={{
                            flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid var(--border-strong)",
                            fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", outline: "none",
                            background: "white",
                          }}
                        />
                        <button onClick={() => handleComment(f.id)} style={{
                          padding: "10px 18px", borderRadius: 12, border: "none", background: "var(--ink)",
                          color: "var(--cream)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                          fontFamily: "'Source Sans 3', sans-serif",
                        }}>{Icons.send}</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmit && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(13,13,15,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
        }} onClick={() => setShowSubmit(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "white", borderRadius: 24, padding: 36, width: "100%", maxWidth: 520,
            boxShadow: "0 24px 48px rgba(13,13,15,0.15)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700 }}>Submit an Idea</h2>
              <button onClick={() => setShowSubmit(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>{Icons.x}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Title</label>
                <input value={submitForm.title} onChange={e => setSubmitForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="A short, descriptive title..."
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid var(--border-strong)",
                    fontSize: 15, fontFamily: "'Source Sans 3', sans-serif", outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Category</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {FEATURE_CATEGORIES.filter(c => c !== "All").map(c => (
                    <button key={c} onClick={() => setSubmitForm(f => ({ ...f, category: c }))} style={{
                      padding: "6px 14px", borderRadius: 16, border: "1.5px solid",
                      borderColor: submitForm.category === c ? CATEGORY_COLORS[c] : "var(--border)",
                      background: submitForm.category === c ? CATEGORY_COLORS[c] : "transparent",
                      color: submitForm.category === c ? "white" : "var(--text-secondary)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Description</label>
                <textarea value={submitForm.description} onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your idea in detail — what problem does it solve?"
                  rows={5}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid var(--border-strong)",
                    fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", outline: "none", resize: "vertical",
                    lineHeight: 1.6,
                  }}
                />
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>
                  {submitForm.description.length}/2000
                </div>
              </div>
              {error && <div style={{ fontSize: 13, color: "var(--coral)", fontWeight: 600 }}>{error}</div>}
              <button onClick={handleSubmit} disabled={submitting || submitForm.title.length < 5 || submitForm.description.length < 10} style={{
                padding: "14px 24px", borderRadius: 12, border: "none", background: "var(--coral)", color: "white",
                fontSize: 15, fontWeight: 700, cursor: submitting ? "wait" : "pointer",
                fontFamily: "'Source Sans 3', sans-serif", opacity: (submitForm.title.length < 5 || submitForm.description.length < 10) ? 0.5 : 1,
                transition: "all 0.2s",
              }}>{submitting ? "Submitting..." : "Submit Idea"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Public page wraps with nav; dashboard page is just the content
  if (isPublic) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
        <GlobalStyles />
        <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />
        <section style={{ padding: "60px 48px 80px" }}>{content}</section>
        <footer style={{
          padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
          background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
        }}>© 2026 JobsSearch. Built with AI.</footer>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Ideas Board</h1>
      {content}
    </div>
  );
};

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
      { key: "matcher", icon: Icons.target, label: "JD Matcher" },
      { key: "ideas", icon: Icons.spark, label: "Ideas Board" },
    ],
    recruiter: [
      { key: "home", icon: Icons.users, label: "Candidates" },
      { key: "pipeline", icon: Icons.target, label: "Pipeline" },
      { key: "chat", icon: Icons.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: Icons.chart, label: "Analytics" },
      { key: "ideas", icon: Icons.spark, label: "Ideas Board" },
    ],
    company: [
      { key: "home", icon: Icons.building, label: "Dashboard" },
      { key: "chat", icon: Icons.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: Icons.chart, label: "Analytics" },
      { key: "ideas", icon: Icons.spark, label: "Ideas Board" },
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
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>JobsSearch</span>
      </div>
      <div style={{ padding: "8px", fontSize: 11, color: roleColors[role], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {roleLabels[role]}
      </div>

      <nav style={{ flex: 1, marginTop: 16 }}>
        {(navItems[role] || []).map(item => (
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
        {Icons.arrowLeft} Sign Out
      </div>
    </div>
  );
};

// ─── Job Card ────────────────────────────────────────────────────────
const JobCard = ({ job, profile, onApply, applied, onSave, saved }) => {
  const reqSkills = job.requiredSkills || [];
  const matchingSkills = reqSkills.filter(s => (profile.skills || []).map(sk => sk.toLowerCase()).includes(s.toLowerCase()));
  const isExternal = job.source === "jsearch";

  return (
    <Card hover style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 20 }}>
        <MatchScore score={job.match} size="lg" />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{job.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{job.company}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{Icons.mapPin} {job.location}</span>
                {job.salary && <span style={{ color: "var(--coral)", fontWeight: 600 }}>{job.salary}</span>}
              </div>
            </div>
            <button onClick={onSave} style={{ background: "none", border: "none", cursor: "pointer", color: saved ? "var(--coral)" : "var(--text-muted)", padding: 8 }}>
              {Icons.heart}
            </button>
          </div>

          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>{job.desc}</p>

          {reqSkills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {reqSkills.map(s => (
                <Tag key={s} variant={matchingSkills.map(m => m.toLowerCase()).includes(s.toLowerCase()) ? "coral" : "outline"}>
                  {matchingSkills.map(m => m.toLowerCase()).includes(s.toLowerCase()) && <span>{Icons.check}</span>} {s}
                </Tag>
              ))}
            </div>
          )}

          {job.matchReasons && job.matchReasons.length > 0 && (
            <div style={{ fontSize: 13, color: "var(--sage)", marginBottom: 8 }}>
              {job.matchReasons[0]}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {reqSkills.length > 0 ? `${matchingSkills.length}/${reqSkills.length} skills match` : ""}
              {job.posted ? ` · ${job.posted}` : ""}
              {isExternal && <span style={{ marginLeft: 6, color: "var(--sage)" }}>via JSearch</span>}
            </div>
            {isExternal && job.applyLink ? (
              <Button size="sm" variant="coral" onClick={onApply}>
                Apply {Icons.arrow}
              </Button>
            ) : (
              <Button size="sm" variant={applied ? "outline" : "coral"} onClick={onApply} disabled={applied}>
                {applied ? <>{Icons.check} Applied</> : <>Apply {Icons.arrow}</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
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
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

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
    source: "jsearch",
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

// ─── Blog List Page ──────────────────────────────────────────────────
const BlogListPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { window.scrollTo(0, 0); loadBlog(); }, []);

  const loadBlog = async (category = null) => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      const [postData, catData] = await Promise.all([
        api.getBlogPosts(params),
        api.getBlogCategories(),
      ]);
      setPosts(postData);
      setCategories(catData);
    } catch (e) { console.error("Failed to load blog:", e); }
    setLoading(false);
  };

  const handleCategoryClick = (cat) => {
    const next = cat === activeCategory ? null : cat;
    setActiveCategory(next);
    loadBlog(next);
  };

  const CATEGORY_LABELS = {
    "career-playbook": "Career Playbook", "resume-lab": "Resume Lab",
    "interview-decoded": "Interview Decoded", "hiring-signals": "Hiring Signals",
    "company-spotlight": "Company Spotlight", "engineering-culture": "Engineering Culture",
    "remote-work": "Remote Work", "ai-future-work": "AI & Future of Work",
    "salary-compass": "Salary Compass", "recruiter-craft": "Recruiter Craft",
  };

  const featured = posts.filter(p => p.featured);
  const regular = posts.filter(p => !p.featured);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: "80px 48px 40px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
          background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 24, letterSpacing: "0.02em",
        }}>Pressroom</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 52px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 16,
        }}>Insights for your career journey</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          Expert advice on job search, interviews, hiring trends, and the future of work.
        </p>
      </section>

      {/* Category Filters */}
      {categories.length > 0 && (
        <section style={{ padding: "0 48px 32px", maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => handleCategoryClick(null)} style={{
              padding: "8px 18px", borderRadius: 20, border: "1px solid var(--border)",
              background: !activeCategory ? "var(--ink)" : "white", color: !activeCategory ? "white" : "var(--text-secondary)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
            }}>All</button>
            {categories.map(c => (
              <button key={c.category} onClick={() => handleCategoryClick(c.category)} style={{
                padding: "8px 18px", borderRadius: 20, border: "1px solid var(--border)",
                background: activeCategory === c.category ? "var(--ink)" : "white",
                color: activeCategory === c.category ? "white" : "var(--text-secondary)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
              }}>{c.label || CATEGORY_LABELS[c.category] || c.category} ({c.count})</button>
            ))}
          </div>
        </section>
      )}

      {/* Featured Post */}
      {featured.length > 0 && (
        <section style={{ padding: "0 48px 48px", maxWidth: 1000, margin: "0 auto" }}>
          {featured.slice(0, 1).map(post => (
            <div key={post.id} onClick={() => onNavigate("blog-post:" + post.slug)} style={{
              background: "white", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden",
              cursor: "pointer", transition: "all 0.2s", display: "flex", minHeight: 280,
            }}>
              {post.cover_image_url && (
                <div style={{ width: "45%", background: `url(${post.cover_image_url}) center/cover`, minHeight: 280 }} />
              )}
              <div style={{ padding: 40, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{
                  display: "inline-block", padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                  background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 16, alignSelf: "flex-start",
                }}>Featured</div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 12, letterSpacing: "-0.02em" }}>
                  {post.title}
                </h2>
                {post.excerpt && <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>{post.excerpt}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--text-muted)" }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>{post.author_name}</span>
                  <span>{post.reading_time_min} min read</span>
                  {post.published_at && <span>{new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Post Grid */}
      <section style={{ padding: "0 48px 80px", maxWidth: 1000, margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading posts...</div>
        ) : regular.length === 0 && featured.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--ink)", marginBottom: 8 }}>No posts yet</h3>
            <p style={{ color: "var(--text-muted)" }}>Check back soon for career insights and hiring trends.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {regular.map(post => (
              <div key={post.id} onClick={() => onNavigate("blog-post:" + post.slug)} style={{
                background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {post.cover_image_url && (
                  <div style={{ height: 180, background: `url(${post.cover_image_url}) center/cover` }} />
                )}
                <div style={{ padding: 24 }}>
                  <div style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                    background: "rgba(126,184,158,0.1)", color: "var(--sage)", marginBottom: 12,
                  }}>{CATEGORY_LABELS[post.category] || post.category}</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: "var(--ink)", marginBottom: 8, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                    {post.title}
                  </h3>
                  {post.excerpt && <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                    {post.excerpt.length > 120 ? post.excerpt.slice(0, 120) + "..." : post.excerpt}
                  </p>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
                    <span style={{ fontWeight: 600 }}>{post.author_name}</span>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span>{post.reading_time_min} min</span>
                      {post.published_at && <span>{new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
      }}>
        &copy; 2026 JobsSearch. Built with AI.
      </footer>
    </div>
  );
};

// ─── Blog Post Page ──────────────────────────────────────────────────
const BlogPostPage = ({ slug, onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const [post, setPost] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { window.scrollTo(0, 0); loadPost(); }, [slug]);

  const loadPost = async () => {
    try {
      const [postData, jobsData] = await Promise.all([
        api.getBlogPost(slug),
        api.getRelatedJobsForPost(slug).catch(() => []),
      ]);
      setPost(postData);
      setRelatedJobs(jobsData);
      if (postData.seo_title) document.title = postData.seo_title + " | JobsSearch";
      else document.title = postData.title + " | JobsSearch Blog";
    } catch (e) {
      console.error("Failed to load post:", e);
    }
    setLoading(false);
  };

  const CATEGORY_LABELS = {
    "career-playbook": "Career Playbook", "resume-lab": "Resume Lab",
    "interview-decoded": "Interview Decoded", "hiring-signals": "Hiring Signals",
    "company-spotlight": "Company Spotlight", "engineering-culture": "Engineering Culture",
    "remote-work": "Remote Work", "ai-future-work": "AI & Future of Work",
    "salary-compass": "Salary Compass", "recruiter-craft": "Recruiter Craft",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />
      <div style={{ textAlign: "center", padding: 120, color: "var(--text-muted)" }}>Loading...</div>
    </div>
  );

  if (!post) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />
      <div style={{ textAlign: "center", padding: 120 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "var(--ink)", marginBottom: 12 }}>Post not found</h2>
        <button onClick={() => onNavigate("blog")} style={{
          padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--coral)", color: "white",
          fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
        }}>Back to Blog</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero Image */}
      {post.cover_image_url && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 48px 0" }}>
          <div style={{ height: 400, borderRadius: 20, overflow: "hidden", background: `url(${post.cover_image_url}) center/cover` }} />
        </div>
      )}

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 48px 80px", display: "flex", gap: 48 }}>
        {/* Main Content */}
        <article style={{ flex: 1, minWidth: 0 }}>
          {/* Back link */}
          <button onClick={() => onNavigate("blog")} style={{
            background: "none", border: "none", color: "var(--coral)", fontSize: 14, fontWeight: 600,
            cursor: "pointer", marginBottom: 24, padding: 0, fontFamily: "'Source Sans 3', sans-serif",
          }}>&larr; Back to Blog</button>

          {/* Category + Reading time */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <span style={{
              padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600,
              background: "rgba(126,184,158,0.1)", color: "var(--sage)",
            }}>{CATEGORY_LABELS[post.category] || post.category}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{post.reading_time_min} min read</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{post.view_count} views</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 700,
            lineHeight: 1.15, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 12,
          }}>{post.title}</h1>

          {post.subtitle && (
            <p style={{ fontSize: 20, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 24 }}>{post.subtitle}</p>
          )}

          {/* Author + Date */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid var(--border)" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 22, background: "var(--ink)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--cream)", fontSize: 16, fontWeight: 700,
            }}>{post.author_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 15 }}>{post.author_name}</div>
              {post.published_at && (
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div
            className="blog-content"
            style={{
              fontSize: 17, lineHeight: 1.8, color: "var(--text-primary)",
              fontFamily: "'Source Sans 3', sans-serif",
            }}
            dangerouslySetInnerHTML={{ __html: post.body_html }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {post.tags.map(tag => (
                  <span key={tag} style={{
                    padding: "6px 14px", borderRadius: 20, background: "rgba(13,13,15,0.04)",
                    fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside style={{ width: 280, flexShrink: 0 }}>
          {/* Related Jobs */}
          {relatedJobs.length > 0 && (
            <div style={{
              background: "white", borderRadius: 16, border: "1px solid var(--border)",
              padding: 24, marginBottom: 24, position: "sticky", top: 80,
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700,
                color: "var(--ink)", marginBottom: 16, letterSpacing: "-0.01em",
              }}>Related Jobs</h3>
              {relatedJobs.map(job => (
                <div key={job.id} style={{
                  padding: "14px 0", borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{job.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{job.company_name}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {job.location && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{job.location}</span>}
                    {job.remote && <span style={{ fontSize: 11, color: "var(--sage)", fontWeight: 600 }}>Remote</span>}
                  </div>
                </div>
              ))}
              <button onClick={onGetStarted} style={{
                width: "100%", marginTop: 16, padding: "10px 20px", borderRadius: 10, border: "none",
                background: "var(--coral)", color: "white", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
              }}>View All Jobs</button>
            </div>
          )}

          {/* Skills from post */}
          {post.related_skills && post.related_skills.length > 0 && (
            <div style={{
              background: "white", borderRadius: 16, border: "1px solid var(--border)", padding: 24,
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700,
                color: "var(--ink)", marginBottom: 12,
              }}>Skills Mentioned</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {post.related_skills.map(skill => (
                  <span key={skill} style={{
                    padding: "4px 12px", borderRadius: 12, background: "rgba(255,107,91,0.08)",
                    fontSize: 12, fontWeight: 600, color: "var(--coral)",
                  }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
      }}>
        &copy; 2026 JobsSearch. Built with AI.
      </footer>
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
  const [currentPage, setCurrentPage] = useState("home");

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
    onNavigate: (page) => setCurrentPage(page),
    currentPage,
  };

  if (!user && showAuth) return <AuthScreen onAuth={handleAuth} onBack={() => setShowAuth(false)} initialMode={authMode} />;
  if (!user) {
    switch (currentPage) {
      case "features": return <FeaturesPage {...navProps} />;
      case "pricing": return <PricingPage {...navProps} />;
      case "about": return <AboutPage {...navProps} />;
      case "ideas": return <IdeasBoard {...navProps} user={null} />;
      case "blog": return <BlogListPage {...navProps} />;
      default:
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
