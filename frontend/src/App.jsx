import { useState, useEffect, useRef, useCallback } from "react";

// ─── Mock Data ───────────────────────────────────────────
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
  "Technical Writer", "Scrum Master", "CTO / VP Engineering",
];

const EXPERIENCE_LEVELS = ["Entry Level (0-2 yrs)", "Mid Level (3-5 yrs)", "Senior (6-9 yrs)", "Staff / Lead (10+ yrs)", "Executive / Director"];
const WORK_PREFS = ["Remote", "Hybrid", "On-site"];
const SALARY_RANGES = ["$50k–$80k", "$80k–$120k", "$120k–$160k", "$160k–$200k", "$200k–$250k", "$250k+"];
const INDUSTRIES = ["Tech / SaaS", "Finance / Fintech", "Healthcare", "E-commerce", "AI / ML", "Gaming", "Education", "Media", "Government", "Startup (any)"];

const JOBS = [
  { id: 1, title: "Senior React Developer", company: "TechVault", location: "San Francisco, CA", salary: "$160k–$200k", match: 96, tags: ["React", "TypeScript", "Node.js"], posted: "2h ago", type: "Full-time", remote: true, applicants: 23, desc: "Lead frontend architecture for our next-gen platform.", requiredSkills: ["React", "TypeScript", "JavaScript"], niceSkills: ["Next.js", "Redux", "Node.js"] },
  { id: 2, title: "ML Engineer", company: "DataPulse AI", location: "Remote", salary: "$180k–$230k", match: 91, tags: ["Python", "PyTorch", "MLOps"], posted: "5h ago", type: "Full-time", remote: true, applicants: 45, desc: "Build and deploy production ML pipelines at scale.", requiredSkills: ["Python", "Machine Learning", "PyTorch"], niceSkills: ["MLOps", "AWS", "Docker"] },
  { id: 3, title: "Product Designer", company: "Forma Studio", location: "New York, NY", salary: "$130k–$165k", match: 88, tags: ["Figma", "UX Research", "Design Systems"], posted: "1d ago", type: "Full-time", remote: false, applicants: 67, desc: "Shape the future of our design system and user experiences.", requiredSkills: ["Figma", "UX Research", "UI Design"], niceSkills: ["Design Systems", "Prototyping", "Accessibility"] },
  { id: 4, title: "DevOps Lead", company: "CloudScale", location: "Austin, TX", salary: "$155k–$195k", match: 85, tags: ["AWS", "Kubernetes", "Terraform"], posted: "3h ago", type: "Full-time", remote: true, applicants: 18, desc: "Lead our infrastructure team and modernize our cloud stack.", requiredSkills: ["AWS", "Kubernetes", "Terraform"], niceSkills: ["Docker", "CI/CD", "Linux"] },
  { id: 5, title: "Frontend Architect", company: "Nextera", location: "Remote", salary: "$170k–$210k", match: 82, tags: ["React", "TypeScript", "Next.js"], posted: "6h ago", type: "Contract", remote: true, applicants: 31, desc: "Define frontend standards and mentor a team of 12 engineers.", requiredSkills: ["React", "TypeScript", "Next.js"], niceSkills: ["Design Systems", "JavaScript", "Redux"] },
  { id: 6, title: "Full Stack Developer", company: "PayLoop", location: "Remote", salary: "$140k–$175k", match: 0, tags: ["Node.js", "React", "PostgreSQL"], posted: "1d ago", type: "Full-time", remote: true, applicants: 54, desc: "Build payment infrastructure used by millions.", requiredSkills: ["Node.js", "React", "SQL"], niceSkills: ["TypeScript", "Docker", "AWS"] },
  { id: 7, title: "Data Scientist", company: "Insight Analytics", location: "Seattle, WA", salary: "$145k–$185k", match: 0, tags: ["Python", "SQL", "Machine Learning"], posted: "4h ago", type: "Full-time", remote: true, applicants: 39, desc: "Turn complex data into actionable business insights.", requiredSkills: ["Python", "SQL", "Data Analysis"], niceSkills: ["Machine Learning", "Pandas", "TensorFlow"] },
  { id: 8, title: "Engineering Manager", company: "Orion Tech", location: "Denver, CO", salary: "$190k–$240k", match: 0, tags: ["Team Leadership", "Agile/Scrum", "Hiring"], posted: "8h ago", type: "Full-time", remote: true, applicants: 12, desc: "Lead a team of 15 engineers shipping core platform features.", requiredSkills: ["Team Leadership", "Agile/Scrum", "Hiring"], niceSkills: ["Roadmapping", "Mentoring", "Cross-functional"] },
];

const CANDIDATES = [
  { id: 1, name: "Sarah Chen", role: "Senior React Developer", experience: "8 years", match: 97, skills: ["React", "TypeScript", "GraphQL"], status: "Active", avatar: "SC", location: "San Francisco" },
  { id: 2, name: "Marcus Johnson", role: "Full Stack Engineer", experience: "6 years", match: 93, skills: ["Node.js", "React", "PostgreSQL"], status: "Active", avatar: "MJ", location: "Remote" },
  { id: 3, name: "Emily Park", role: "ML Engineer", experience: "5 years", match: 90, skills: ["Python", "TensorFlow", "AWS"], status: "Open", avatar: "EP", location: "Seattle" },
  { id: 4, name: "David Kim", role: "DevOps Engineer", experience: "7 years", match: 87, skills: ["Kubernetes", "Docker", "CI/CD"], status: "Active", avatar: "DK", location: "Austin" },
  { id: 5, name: "Lisa Wang", role: "Product Designer", experience: "4 years", match: 84, skills: ["Figma", "User Research", "Prototyping"], status: "Passive", avatar: "LW", location: "New York" },
];

const PIPELINE_STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired"];
const PIPELINE_DATA = [
  { name: "Sarah Chen", stage: 3, role: "Sr. React Dev", avatar: "SC" },
  { name: "Marcus Johnson", stage: 2, role: "Full Stack Eng", avatar: "MJ" },
  { name: "Emily Park", stage: 1, role: "ML Engineer", avatar: "EP" },
  { name: "David Kim", stage: 4, role: "DevOps Lead", avatar: "DK" },
  { name: "Lisa Wang", stage: 0, role: "Product Designer", avatar: "LW" },
  { name: "Tom Lee", stage: 2, role: "Backend Dev", avatar: "TL" },
  { name: "Ana Ruiz", stage: 3, role: "Data Scientist", avatar: "AR" },
];

const SEEKER_MESSAGES = [
  { id: 1, from: "TechVault HR", avatar: "TV", preview: "We reviewed your AI-generated resume and would love to schedule...", time: "15m ago", unread: true },
  { id: 2, from: "DataPulse Recruiter", avatar: "DP", preview: "Your skills in ML are a great fit. Can we chat this week?", time: "1h ago", unread: true },
  { id: 3, from: "Career Coach AI", avatar: "AI", preview: "Based on your profile, here are 3 tips to improve your resume...", time: "3h ago", unread: false },
];

const RECRUITER_MESSAGES = [
  { id: 1, from: "Sarah Chen", avatar: "SC", preview: "Thanks for reaching out! I'd love to learn more about the role...", time: "2m ago", unread: true },
  { id: 2, from: "Marcus Johnson", avatar: "MJ", preview: "The technical assessment went well. When can we discuss next steps?", time: "1h ago", unread: true },
  { id: 3, from: "Emily Park", avatar: "EP", preview: "I have a few questions about the team structure...", time: "3h ago", unread: false },
  { id: 4, from: "David Kim", avatar: "DK", preview: "Looking forward to the final round interview.", time: "5h ago", unread: false },
];

// ─── Icons ───────────────────────────────────────────────
const I = {
  briefcase: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  search: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  user: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>,
  users: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M2 21v-1a5 5 0 0110 0v1"/><circle cx="17" cy="7" r="3"/><path d="M22 21v-1a4 4 0 00-5-3.87"/></svg>,
  chart: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 5-7"/></svg>,
  chat: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  spark: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8L8 14l-6-4.8h7.6z"/></svg>,
  building: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 6h2m-2 4h2m-2 4h2m4-8h2m-2 4h2m-2 4h2M9 22v-4h6v4"/></svg>,
  arrow: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  check: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>,
  send: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>,
  home: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/></svg>,
  filter: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>,
  heart: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>,
  doc: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  wand: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M15 4V2m0 14v-2M8 9H6m14 0h-2m-4.2-2.8L12.4 4.8m5.4 5.4l-1.4-1.4m-5.4 5.4L9.6 15.6m5.4-5.4l1.4 1.4"/><path d="M2 22l10-10"/></svg>,
  plus: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  x: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  target: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  zap: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  upload: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  logo: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/><circle cx="11" cy="13" r="3" fill="currentColor" opacity="0.6"/><circle cx="21" cy="13" r="3" fill="currentColor" opacity="0.6"/><path d="M10 20c0 0 2 4 6 4s6-4 6-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  edit: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
};

// ─── Shared Components ───────────────────────────────────
const MatchBadge = ({ score }) => {
  const color = score >= 90 ? "#00e5a0" : score >= 75 ? "#00c2ff" : score >= 60 ? "#ffb84d" : "#ff6b8a";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {I.spark}<span>{score}%</span>
    </span>
  );
};

const Tag = ({ children, accent, removable, onRemove, selected, onClick, size = "sm" }) => {
  const p = size === "lg" ? "5px 14px" : "3px 10px";
  const fs = size === "lg" ? 13 : 11.5;
  return (
    <span onClick={onClick} style={{
      padding: p, borderRadius: 8, fontSize: fs, fontWeight: 600, cursor: onClick ? "pointer" : "default",
      background: selected ? "rgba(0,229,160,0.15)" : accent ? "rgba(0,229,160,0.12)" : "rgba(255,255,255,0.06)",
      color: selected ? "#00e5a0" : accent ? "#00e5a0" : "rgba(255,255,255,0.6)",
      border: `1px solid ${selected ? "rgba(0,229,160,0.4)" : accent ? "rgba(0,229,160,0.2)" : "rgba(255,255,255,0.08)"}`,
      display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s", userSelect: "none",
    }}>
      {children}
      {removable && <span onClick={e => { e.stopPropagation(); onRemove(); }} style={{ cursor: "pointer", opacity: 0.6, display: "flex" }}>{I.x}</span>}
    </span>
  );
};

const StatCard = ({ label, value, sub, icon, color = "#00e5a0" }) => (
  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", flex: 1, minWidth: 160, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${color}08` }} />
    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: `${color}90` }}>{icon}</span> {label}
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono', monospace", letterSpacing: "-0.02em" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{sub}</div>}
  </div>
);

const Avatar = ({ initials, size = 40 }) => {
  const colors = ["#00e5a0", "#00c2ff", "#ff6b8a", "#ffb84d", "#a78bfa", "#34d399"];
  const bg = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: `${bg}20`, border: `1.5px solid ${bg}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: bg, flexShrink: 0 }}>{initials}</div>
  );
};

const Button = ({ children, primary, small, ghost, onClick, disabled, style: s }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? "6px 14px" : "10px 22px", borderRadius: 10,
    border: ghost ? "none" : primary ? "none" : "1px solid rgba(255,255,255,0.1)",
    background: primary ? "linear-gradient(135deg, #00e5a0, #00c2ff)" : ghost ? "transparent" : "rgba(255,255,255,0.04)",
    color: primary ? "#0a0f1a" : "rgba(255,255,255,0.7)",
    fontSize: small ? 12 : 13.5, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s",
    opacity: disabled ? 0.4 : 1, ...s,
  }}>{children}</button>
);

const SearchBar = ({ placeholder, value, onChange }) => (
  <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }}>{I.search}</span>
    <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "10px 14px 10px 42px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13.5, outline: "none", fontFamily: "inherit" }} />
  </div>
);

const MiniChart = ({ data, height = 120 }) => {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 6 }}>
          <div style={{ width: "100%", maxWidth: 32, borderRadius: 6, height: `${(d.value / max) * 100}%`, minHeight: 4, background: `linear-gradient(180deg, #00e5a0, #00c2ff)`, opacity: 0.7 + (d.value / max) * 0.3 }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const ProgressDots = ({ total, current }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{ width: i === current ? 28 : 10, height: 10, borderRadius: 5, background: i < current ? "#00e5a0" : i === current ? "linear-gradient(90deg, #00e5a0, #00c2ff)" : "rgba(255,255,255,0.1)", transition: "all 0.3s" }} />
    ))}
  </div>
);

// ─── Chat View (shared) ──────────────────────────────────
const ChatView = ({ messages }) => {
  const msgs = messages || RECRUITER_MESSAGES;
  const [selectedChat, setSelectedChat] = useState(0);
  const [msg, setMsg] = useState("");
  const [chatMsgs, setChatMsgs] = useState([
    { from: "them", text: "Hi! Thanks for reaching out. I'd love to learn more about the opportunity.", time: "10:32 AM" },
    { from: "me", text: "Great to hear! The role involves leading our frontend architecture. Would you be available for a chat this week?", time: "10:35 AM" },
    { from: "them", text: "Absolutely. How about Thursday at 2 PM PST?", time: "10:38 AM" },
  ]);

  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 180px)", minHeight: 500 }}>
      <div style={{ width: 280, borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "16px 16px 12px", fontSize: 16, fontWeight: 700, color: "#fff" }}>Messages</div>
        {msgs.map((m, i) => (
          <div key={m.id} onClick={() => setSelectedChat(i)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", gap: 12, background: selectedChat === i ? "rgba(255,255,255,0.05)" : "transparent", borderLeft: selectedChat === i ? "2px solid #00e5a0" : "2px solid transparent" }}>
            <Avatar initials={m.avatar} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: m.unread ? 700 : 600, color: m.unread ? "#fff" : "rgba(255,255,255,0.6)" }}>{m.from}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{m.time}</span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.preview}</div>
            </div>
            {m.unread && <div style={{ width: 8, height: 8, borderRadius: 4, background: "#00e5a0", flexShrink: 0, marginTop: 6 }} />}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar initials={msgs[selectedChat].avatar} size={36} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{msgs[selectedChat].from}</div>
            <div style={{ fontSize: 12, color: "#00e5a0" }}>Online</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "70%", padding: "10px 16px", borderRadius: 16, background: m.from === "me" ? "linear-gradient(135deg, #00e5a0, #00c2ff)" : "rgba(255,255,255,0.06)", color: m.from === "me" ? "#0a0f1a" : "#fff", fontSize: 13.5, lineHeight: 1.5, borderBottomRightRadius: m.from === "me" ? 4 : 16, borderBottomLeftRadius: m.from === "me" ? 16 : 4 }}>
                {m.text}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" }}>{m.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10 }}>
          <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && msg.trim()) { setChatMsgs(m => [...m, { from: "me", text: msg, time: "Now" }]); setMsg(""); } }} placeholder="Type a message..." style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13.5, outline: "none", fontFamily: "inherit" }} />
          <Button primary onClick={() => { if (msg.trim()) { setChatMsgs(m => [...m, { from: "me", text: msg, time: "Now" }]); setMsg(""); } }}>{I.send}</Button>
        </div>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AI RESUME BUILDER (Multi-step Wizard)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ResumeBuilder = ({ onComplete, existingProfile }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(existingProfile || { name: "", email: "", headline: "", summary: "", experience: [], education: [], skills: [], desiredRoles: [], experienceLevel: "", workPrefs: [], salaryRange: "", industries: [], location: "" });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [expForm, setExpForm] = useState({ title: "", company: "", duration: "", desc: "" });
  const [eduForm, setEduForm] = useState({ school: "", degree: "", year: "" });
  const totalSteps = 6;

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }));
  const toggleArr = (key, val) => setProfile(p => ({ ...p, [key]: p[key].includes(val) ? p[key].filter(v => v !== val) : [...p[key], val] }));

  const generateAiSummary = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const skills = profile.skills.slice(0, 5).join(", ");
      const roles = profile.desiredRoles.slice(0, 2).join(" and ");
      const exp = profile.experience[0];
      setAiSummary(`Results-driven ${profile.experienceLevel?.split(" ")[0] || ""} professional with deep expertise in ${skills}. ${exp ? `Most recently served as ${exp.title} at ${exp.company}, where ${exp.desc?.toLowerCase() || "driving impactful results"}.` : ""} Passionate about building innovative solutions and seeking opportunities in ${roles || "technology"}. Known for strong problem-solving abilities, cross-functional collaboration, and delivering high-quality work in fast-paced environments.`);
      setAiGenerating(false);
    }, 2200);
  };

  const addExperience = () => { if (!expForm.title || !expForm.company) return; set("experience", [...profile.experience, { ...expForm, id: Date.now() }]); setExpForm({ title: "", company: "", duration: "", desc: "" }); };
  const addEducation = () => { if (!eduForm.school || !eduForm.degree) return; set("education", [...profile.education, { ...eduForm, id: Date.now() }]); setEduForm({ school: "", degree: "", year: "" }); };

  const allSkills = Object.values(SKILL_CATEGORIES).flat();
  const filteredSkills = skillSearch ? allSkills.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !profile.skills.includes(s)) : [];
  const canNext = () => { if (step === 0) return profile.name && profile.email; if (step === 1) return profile.skills.length >= 3; if (step === 2) return profile.desiredRoles.length >= 1 && profile.experienceLevel; return true; };

  const inputStyle = { width: "100%", padding: "11px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Let's build your profile</div>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>Tell us about yourself and our AI will craft a professional resume tailored to your dream job.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 500 }}>
            <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} placeholder="Jane Smith" value={profile.name} onChange={e => set("name", e.target.value)} /></div>
            <div><label style={labelStyle}>Email *</label><input style={inputStyle} placeholder="jane@example.com" value={profile.email} onChange={e => set("email", e.target.value)} /></div>
            <div><label style={labelStyle}>Professional Headline</label><input style={inputStyle} placeholder="Senior Software Engineer | React Specialist" value={profile.headline} onChange={e => set("headline", e.target.value)} /></div>
            <div><label style={labelStyle}>Location</label><input style={inputStyle} placeholder="San Francisco, CA" value={profile.location} onChange={e => set("location", e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 32, padding: 20, borderRadius: 14, background: "rgba(0,194,255,0.06)", border: "1px solid rgba(0,194,255,0.15)", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ color: "#00c2ff", flexShrink: 0, marginTop: 2 }}>{I.wand}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Building from scratch</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>We'll walk you through selecting skills, setting preferences, and generating an AI-powered professional summary.</div>
            </div>
          </div>
        </div>
      );
      case 1: return (
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6 }}>What are your skills?</div>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 24, fontSize: 15 }}>Select at least 3 skills. These help our AI match you to the best opportunities.</p>
          {profile.skills.length > 0 && <div style={{ marginBottom: 24 }}><label style={{ ...labelStyle, marginBottom: 10 }}>Your Skills ({profile.skills.length})</label><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{profile.skills.map(s => <Tag key={s} accent removable onRemove={() => toggleArr("skills", s)} size="lg">{s}</Tag>)}</div></div>}
          <div style={{ position: "relative", marginBottom: 24 }}>
            <span style={{ position: "absolute", left: 14, top: 12, color: "rgba(255,255,255,0.3)" }}>{I.search}</span>
            <input style={{ ...inputStyle, paddingLeft: 42 }} placeholder="Search skills (e.g. React, Python, Figma...)" value={skillSearch} onChange={e => setSkillSearch(e.target.value)} />
            {filteredSkills.length > 0 && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, marginTop: 4, background: "#151b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 8, maxHeight: 180, overflowY: "auto" }}>{filteredSkills.slice(0, 10).map(s => <div key={s} onClick={() => { toggleArr("skills", s); setSkillSearch(""); }} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#00e5a0" }}>{I.plus}</span> {s}</div>)}</div>}
          </div>
          {Object.entries(SKILL_CATEGORIES).map(([cat, skills]) => (
            <div key={cat} style={{ marginBottom: 20 }}><label style={{ ...labelStyle, marginBottom: 10 }}>{cat}</label><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{skills.map(s => <Tag key={s} size="lg" selected={profile.skills.includes(s)} onClick={() => toggleArr("skills", s)}>{profile.skills.includes(s) && <span style={{ display: "flex" }}>{I.check}</span>} {s}</Tag>)}</div></div>
          ))}
        </div>
      );
      case 2: return (
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6 }}>What's your dream job?</div>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 28, fontSize: 15 }}>Tell us what you're looking for and we'll match you to the perfect opportunities.</p>
          <label style={{ ...labelStyle, marginBottom: 10 }}>Desired Roles (pick 1–3)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>{DESIRED_ROLES.map(r => <Tag key={r} size="lg" selected={profile.desiredRoles.includes(r)} onClick={() => { if (profile.desiredRoles.includes(r) || profile.desiredRoles.length < 3) toggleArr("desiredRoles", r); }}>{profile.desiredRoles.includes(r) && <span style={{ display: "flex" }}>{I.check}</span>} {r}</Tag>)}</div>
          <label style={{ ...labelStyle, marginBottom: 10 }}>Experience Level *</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>{EXPERIENCE_LEVELS.map(l => <Tag key={l} size="lg" selected={profile.experienceLevel === l} onClick={() => set("experienceLevel", l)}>{l}</Tag>)}</div>
          <label style={{ ...labelStyle, marginBottom: 10 }}>Work Preference</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>{WORK_PREFS.map(w => <Tag key={w} size="lg" selected={profile.workPrefs.includes(w)} onClick={() => toggleArr("workPrefs", w)}>{w}</Tag>)}</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}><label style={labelStyle}>Target Salary</label><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{SALARY_RANGES.map(s => <Tag key={s} size="lg" selected={profile.salaryRange === s} onClick={() => set("salaryRange", s)}>{s}</Tag>)}</div></div>
            <div style={{ flex: 1, minWidth: 200 }}><label style={labelStyle}>Preferred Industries</label><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{INDUSTRIES.map(ind => <Tag key={ind} size="lg" selected={profile.industries.includes(ind)} onClick={() => toggleArr("industries", ind)}>{ind}</Tag>)}</div></div>
          </div>
        </div>
      );
      case 3: return (
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Work Experience</div>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 28, fontSize: 15 }}>Add your relevant experience. AI will optimize descriptions for impact.</p>
          {profile.experience.map((exp, i) => (
            <div key={exp.id} style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{exp.title}</div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{exp.company} · {exp.duration}</div>{exp.desc && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8, lineHeight: 1.5 }}>{exp.desc}</div>}</div>
              <span onClick={() => set("experience", profile.experience.filter((_, j) => j !== i))} style={{ cursor: "pointer", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{I.x}</span>
            </div>
          ))}
          <div style={{ padding: 24, borderRadius: 14, border: "1.5px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}><label style={labelStyle}>Job Title</label><input style={inputStyle} placeholder="Software Engineer" value={expForm.title} onChange={e => setExpForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div style={{ flex: 1, minWidth: 160 }}><label style={labelStyle}>Company</label><input style={inputStyle} placeholder="Google" value={expForm.company} onChange={e => setExpForm(f => ({ ...f, company: e.target.value }))} /></div>
              <div style={{ width: 160 }}><label style={labelStyle}>Duration</label><input style={inputStyle} placeholder="2020 – Present" value={expForm.duration} onChange={e => setExpForm(f => ({ ...f, duration: e.target.value }))} /></div>
            </div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} placeholder="Describe responsibilities and achievements..." value={expForm.desc} onChange={e => setExpForm(f => ({ ...f, desc: e.target.value }))} />
            <Button small style={{ marginTop: 12 }} onClick={addExperience}>{I.plus} Add Experience</Button>
          </div>
        </div>
      );
      case 4: return (
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Education</div>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 28, fontSize: 15 }}>Add your educational background.</p>
          {profile.education.map((edu, i) => (
            <div key={edu.id} style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{edu.degree}</div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{edu.school} · {edu.year}</div></div>
              <span onClick={() => set("education", profile.education.filter((_, j) => j !== i))} style={{ cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>{I.x}</span>
            </div>
          ))}
          <div style={{ padding: 24, borderRadius: 14, border: "1.5px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}><label style={labelStyle}>School / University</label><input style={inputStyle} placeholder="Stanford University" value={eduForm.school} onChange={e => setEduForm(f => ({ ...f, school: e.target.value }))} /></div>
              <div style={{ flex: 1, minWidth: 180 }}><label style={labelStyle}>Degree / Field</label><input style={inputStyle} placeholder="B.S. Computer Science" value={eduForm.degree} onChange={e => setEduForm(f => ({ ...f, degree: e.target.value }))} /></div>
              <div style={{ width: 120 }}><label style={labelStyle}>Year</label><input style={inputStyle} placeholder="2020" value={eduForm.year} onChange={e => setEduForm(f => ({ ...f, year: e.target.value }))} /></div>
            </div>
            <Button small onClick={addEducation}>{I.plus} Add Education</Button>
          </div>
        </div>
      );
      case 5: return (
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>{I.wand} AI Resume Generation</div>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 28, fontSize: 15 }}>Review your AI-generated professional summary and finalize your resume.</p>
          <div style={{ padding: 28, borderRadius: 16, background: "rgba(0,229,160,0.04)", border: "1px solid rgba(0,229,160,0.12)", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#00e5a0", display: "flex", alignItems: "center", gap: 8 }}>{I.spark} AI-Generated Summary</div>
              <Button small onClick={generateAiSummary} disabled={aiGenerating}>{I.wand} {aiGenerating ? "Generating..." : aiSummary ? "Regenerate" : "Generate"}</Button>
            </div>
            {!aiSummary && !aiGenerating && <div style={{ textAlign: "center", padding: "24px 0" }}><Button primary onClick={generateAiSummary}>{I.wand} Generate AI Summary</Button><div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>Our AI will craft a professional summary from your profile</div></div>}
            {aiGenerating && <div style={{ textAlign: "center", padding: "30px 0" }}><div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: "#00e5a0", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}</div><style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }`}</style><div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>AI is analyzing your profile...</div></div>}
            {aiSummary && !aiGenerating && <textarea value={aiSummary} onChange={e => setAiSummary(e.target.value)} style={{ ...inputStyle, minHeight: 100, lineHeight: 1.6, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(0,229,160,0.15)" }} />}
          </div>
          <div style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 20 }}>Resume Preview</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{profile.name || "Your Name"}</div>
            <div style={{ fontSize: 14, color: "#00e5a0", marginTop: 4 }}>{profile.headline}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{profile.email} {profile.location && `· ${profile.location}`}</div>
            {aiSummary && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 16, lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>{aiSummary}</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>{profile.desiredRoles.map(r => <Tag key={r} accent>{r}</Tag>)}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{profile.skills.slice(0, 10).map(s => <Tag key={s}>{s}</Tag>)}{profile.skills.length > 10 && <Tag>+{profile.skills.length - 10}</Tag>}</div>
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 30% 20%, rgba(0,229,160,0.05) 0%, transparent 50%), #0a0f1a", padding: "40px 32px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, color: "#00e5a0" }}>
          {I.logo}<span style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono', monospace" }}>HireFlow</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>AI Resume Builder</span>
          <div style={{ marginLeft: "auto" }}><ProgressDots total={totalSteps} current={step} /></div>
        </div>
        {renderStep()}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Button onClick={() => step > 0 && setStep(s => s - 1)} style={{ visibility: step === 0 ? "hidden" : "visible" }}>← Back</Button>
          <div style={{ display: "flex", gap: 12 }}>
            {step < totalSteps - 1 && <Button ghost onClick={() => setStep(s => s + 1)} style={{ color: "rgba(255,255,255,0.3)" }}>Skip</Button>}
            {step < totalSteps - 1 ? <Button primary onClick={() => setStep(s => s + 1)} disabled={!canNext()}>Continue {I.arrow}</Button> : <Button primary onClick={() => onComplete(profile, aiSummary)} disabled={!aiSummary}>{I.spark} Find My Matches</Button>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SMART MATCHING ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function computeMatches(profile, jobs) {
  return jobs.map(job => {
    let score = 0;
    const uSkills = profile.skills.map(s => s.toLowerCase());
    const reqMatch = job.requiredSkills.filter(s => uSkills.includes(s.toLowerCase())).length;
    const niceMatch = job.niceSkills.filter(s => uSkills.includes(s.toLowerCase())).length;
    score += (reqMatch / job.requiredSkills.length) * 60;
    score += (niceMatch / job.niceSkills.length) * 20;
    if (profile.desiredRoles.some(r => job.title.toLowerCase().includes(r.toLowerCase().split(" ")[0]))) score += 15;
    if (profile.workPrefs.includes("Remote") && job.remote) score += 5;
    score = Math.min(99, Math.max(25, Math.round(score + Math.random() * 5)));
    return { ...job, match: score };
  }).sort((a, b) => b.match - a.match);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  JOB SEEKER DASHBOARD (with AI matching)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SeekerDashboard = ({ profile, aiSummary, activeTab, onEditResume }) => {
  const [searchQ, setSearchQ] = useState("");
  const [saved, setSaved] = useState(new Set());
  const [applied, setApplied] = useState(new Set());
  const matchedJobs = computeMatches(profile, JOBS);
  const topMatch = matchedJobs[0]?.match || 0;

  const filtered = matchedJobs.filter(j =>
    j.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    j.company.toLowerCase().includes(searchQ.toLowerCase()) ||
    j.tags.some(t => t.toLowerCase().includes(searchQ.toLowerCase()))
  );

  if (activeTab === "resume") return <ResumeView profile={profile} aiSummary={aiSummary} onEdit={onEditResume} />;
  if (activeTab === "chat") return <ChatView messages={SEEKER_MESSAGES} />;
  if (activeTab === "analytics") return <SeekerAnalytics profile={profile} matchedJobs={matchedJobs} />;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>Welcome back, {profile.name?.split(" ")[0]}!</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 6, fontSize: 14 }}>AI found <span style={{ color: "#00e5a0", fontWeight: 700 }}>{matchedJobs.filter(j => j.match >= 70).length} strong matches</span> based on your skills and preferences</p>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <StatCard label="Best Match" value={`${topMatch}%`} sub={matchedJobs[0]?.title} icon={I.spark} />
        <StatCard label="Your Skills" value={profile.skills.length} sub={profile.skills.slice(0, 3).join(", ")} icon={I.zap} color="#00c2ff" />
        <StatCard label="Applied" value={applied.size} sub="Track your pipeline" icon={I.briefcase} color="#ffb84d" />
        <StatCard label="Profile Views" value="48" sub="+12 this week" icon={I.user} color="#ff6b8a" />
      </div>
      <div style={{ padding: 20, borderRadius: 14, background: "rgba(0,194,255,0.05)", border: "1px solid rgba(0,194,255,0.12)", marginBottom: 24, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: "#00c2ff" }}>{I.wand}</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Insight</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Your top skills ({profile.skills.slice(0, 3).join(", ")}) are in high demand. {profile.desiredRoles[0] && `Jobs for "${profile.desiredRoles[0]}" grew 23% this quarter.`}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <SearchBar placeholder="Search matched jobs..." value={searchQ} onChange={setSearchQ} />
        <Button small>{I.filter} Filters</Button>
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>Showing {filtered.length} jobs ranked by AI match score</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(job => {
          const reqMatch = job.requiredSkills.filter(s => profile.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase()));
          const niceMatch = job.niceSkills.filter(s => profile.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase()));
          return (
            <div key={job.id} style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{job.title}</span>
                    <MatchBadge score={job.match} />
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{job.company}</span>
                    <span>{job.location}</span><span style={{ color: "#00e5a0", fontWeight: 600 }}>{job.salary}</span><span>{job.posted}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 10, lineHeight: 1.5 }}>{job.desc}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {job.requiredSkills.map(s => <Tag key={s} accent={reqMatch.map(r => r.toLowerCase()).includes(s.toLowerCase())}>{s} {reqMatch.map(r => r.toLowerCase()).includes(s.toLowerCase()) && "✓"}</Tag>)}
                    {job.niceSkills.map(s => <Tag key={s} accent={niceMatch.map(r => r.toLowerCase()).includes(s.toLowerCase())}>{s}</Tag>)}
                  </div>
                  {reqMatch.length > 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>You match <span style={{ color: "#00e5a0", fontWeight: 700 }}>{reqMatch.length}/{job.requiredSkills.length}</span> required skills{niceMatch.length > 0 && <> and <span style={{ color: "#00c2ff", fontWeight: 700 }}>{niceMatch.length}/{job.niceSkills.length}</span> nice-to-haves</>}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                  <Button small onClick={() => setSaved(s => { const n = new Set(s); n.has(job.id) ? n.delete(job.id) : n.add(job.id); return n; })} style={{ color: saved.has(job.id) ? "#ff6b8a" : undefined }}>{I.heart}</Button>
                  <Button small primary onClick={() => setApplied(a => new Set([...a, job.id]))} style={applied.has(job.id) ? { background: "rgba(0,229,160,0.15)", color: "#00e5a0" } : {}}>{applied.has(job.id) ? <>{I.check} Applied</> : <>Apply {I.arrow}</>}</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Resume View ─────────────────────────────────────────
const ResumeView = ({ profile, aiSummary, onEdit }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>My Resume</h2>
      <div style={{ display: "flex", gap: 8 }}><Button small onClick={onEdit}>{I.edit} Edit</Button><Button small primary>{I.wand} AI Enhance</Button></div>
    </div>
    <div style={{ padding: 32, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{profile.name}</div>
        <div style={{ fontSize: 15, color: "#00e5a0", marginTop: 4 }}>{profile.headline}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{profile.email} · {profile.location}</div>
      </div>
      {aiSummary && <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: 12, fontWeight: 700, color: "#00e5a0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>{I.spark} Summary</div><div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{aiSummary}</div></div>}
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 300 }}>
          {profile.experience.length > 0 && <div style={{ marginBottom: 24 }}><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Experience</div>{profile.experience.map((e, i) => <div key={i} style={{ marginBottom: 16, paddingLeft: 16, borderLeft: "2px solid rgba(0,229,160,0.3)" }}><div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{e.title}</div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{e.company} · {e.duration}</div>{e.desc && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6, lineHeight: 1.5 }}>{e.desc}</div>}</div>)}</div>}
          {profile.education.length > 0 && <div><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Education</div>{profile.education.map((e, i) => <div key={i} style={{ marginBottom: 12 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{e.degree}</div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{e.school} · {e.year}</div></div>)}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Target Roles</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>{profile.desiredRoles.map(r => <Tag key={r} accent>{r}</Tag>)}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Skills</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>{profile.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Preferences</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>{profile.experienceLevel && <div>{profile.experienceLevel}</div>}{profile.workPrefs.length > 0 && <div>{profile.workPrefs.join(", ")}</div>}{profile.salaryRange && <div>{profile.salaryRange}</div>}</div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Seeker Analytics ────────────────────────────────────
const SeekerAnalytics = ({ profile, matchedJobs }) => (
  <div>
    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 24px" }}>Match Analytics</h2>
    <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
      <StatCard label="Avg Match" value={`${Math.round(matchedJobs.reduce((a, j) => a + j.match, 0) / matchedJobs.length)}%`} sub="Across all jobs" icon={I.chart} />
      <StatCard label="Strong Matches" value={matchedJobs.filter(j => j.match >= 80).length} sub="80%+ score" icon={I.spark} color="#00c2ff" />
      <StatCard label="Skills Demand" value={profile.skills.length} sub="Your skills needed" icon={I.zap} color="#ffb84d" />
    </div>
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Match Scores by Company</div>
      <MiniChart data={matchedJobs.map(j => ({ label: j.company.split(" ")[0], value: j.match }))} />
    </div>
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Skill Coverage</div>
      {profile.skills.slice(0, 6).map(skill => {
        const d = JOBS.filter(j => [...j.requiredSkills, ...j.niceSkills].map(s => s.toLowerCase()).includes(skill.toLowerCase()));
        return (<div key={skill} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{skill}</span><span style={{ color: "#00e5a0", fontWeight: 700 }}>{d.length} jobs</span></div><div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}><div style={{ height: "100%", borderRadius: 3, width: `${(d.length / JOBS.length) * 100}%`, background: "linear-gradient(90deg, #00e5a0, #00c2ff)" }} /></div></div>);
      })}
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECRUITER DASHBOARD (from v1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RecruiterDashboard = ({ activeTab }) => {
  const [searchQ, setSearchQ] = useState("");
  if (activeTab === "chat") return <ChatView messages={RECRUITER_MESSAGES} />;
  if (activeTab === "analytics") return <RecruiterAnalytics />;
  if (activeTab === "pipeline") return <PipelineView />;

  const filtered = CANDIDATES.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.role.toLowerCase().includes(searchQ.toLowerCase()) || c.skills.some(s => s.toLowerCase().includes(searchQ.toLowerCase())));
  return (
    <div>
      <div style={{ marginBottom: 32 }}><h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>Candidate Search</h2><p style={{ color: "rgba(255,255,255,0.4)", marginTop: 6, fontSize: 14 }}>AI identified <span style={{ color: "#00c2ff", fontWeight: 700 }}>{CANDIDATES.length} strong matches</span> for your open roles</p></div>
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <StatCard label="Active Searches" value="8" sub="3 urgent" icon={I.search} color="#00c2ff" />
        <StatCard label="Sourced" value="124" sub="+18 this week" icon={I.users} />
        <StatCard label="Placements" value="5" sub="$82k avg. fee" icon={I.check} color="#ffb84d" />
        <StatCard label="Response Rate" value="73%" sub="+8% vs last month" icon={I.chat} color="#ff6b8a" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <SearchBar placeholder="Search candidates, skills, roles..." value={searchQ} onChange={setSearchQ} />
        <Button small>{I.filter} Filters</Button><Button small primary>{I.spark} AI Recommend</Button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(c => (
          <div key={c.id} style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar initials={c.avatar} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{c.name}</span><MatchBadge score={c.match} /><Tag accent={c.status === "Active"}>{c.status}</Tag>
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{c.role} · {c.experience} · {c.location}</div>
              <div style={{ display: "flex", gap: 6 }}>{c.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}><Button small>{I.chat} Message</Button><Button small primary>View {I.arrow}</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PipelineView = () => (
  <div>
    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 24px" }}>Hiring Pipeline</h2>
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
      {PIPELINE_STAGES.map((stage, si) => {
        const cands = PIPELINE_DATA.filter(c => c.stage === si);
        return (
          <div key={stage} style={{ minWidth: 200, flex: 1, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stage}</span>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{cands.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cands.map(c => (
                <div key={c.name} style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar initials={c.avatar} size={32} /><div><div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.name}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{c.role}</div></div></div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const RecruiterAnalytics = () => (
  <div>
    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 24px" }}>Recruiter Analytics</h2>
    <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
      <StatCard label="Placements YTD" value="23" sub="Revenue: $412k" icon={I.check} />
      <StatCard label="Time to Fill" value="18d" sub="-4d vs industry" icon={I.chart} color="#00c2ff" />
      <StatCard label="Candidate NPS" value="87" sub="Excellent" icon={I.heart} color="#ff6b8a" />
    </div>
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Placements by Month</div>
      <MiniChart height={130} data={[{ label: "Sep", value: 3 }, { label: "Oct", value: 4 }, { label: "Nov", value: 2 }, { label: "Dec", value: 5 }, { label: "Jan", value: 4 }, { label: "Feb", value: 5 }]} />
    </div>
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Pipeline Conversion</div>
      {[{ s: "Sourced → Screened", p: 68 }, { s: "Screened → Interview", p: 52 }, { s: "Interview → Offer", p: 38 }, { s: "Offer → Hired", p: 85 }].map(x => (
        <div key={x.s} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span style={{ color: "rgba(255,255,255,0.6)" }}>{x.s}</span><span style={{ color: "#00c2ff", fontWeight: 700 }}>{x.p}%</span></div><div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}><div style={{ height: "100%", borderRadius: 3, width: `${x.p}%`, background: "linear-gradient(90deg, #00c2ff, #a78bfa)" }} /></div></div>
      ))}
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  COMPANY DASHBOARD (from v1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CompanyDashboard = ({ activeTab }) => {
  if (activeTab === "chat") return <ChatView messages={RECRUITER_MESSAGES} />;
  if (activeTab === "analytics") return <CompanyAnalytics />;

  return (
    <div>
      <div style={{ marginBottom: 32 }}><h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>Company Dashboard</h2><p style={{ color: "rgba(255,255,255,0.4)", marginTop: 6, fontSize: 14 }}><span style={{ color: "#ffb84d", fontWeight: 700 }}>6 open positions</span> with AI-matched candidates ready</p></div>
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <StatCard label="Open Positions" value="6" sub="2 urgent" icon={I.briefcase} color="#ffb84d" />
        <StatCard label="Applicants" value="234" sub="+52 this week" icon={I.users} />
        <StatCard label="Match Quality" value="91%" sub="AI-screened" icon={I.spark} color="#00c2ff" />
        <StatCard label="Time to Hire" value="16d" sub="Industry: 36d" icon={I.chart} color="#ff6b8a" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Active Job Postings</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {JOBS.slice(0, 4).map(job => (
          <div key={job.id} style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{job.title}</div><div style={{ display: "flex", gap: 12, fontSize: 13, color: "rgba(255,255,255,0.4)" }}><span>{job.location}</span><span>{job.salary}</span><span>{job.posted}</span></div></div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono', monospace" }}>{job.applicants}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>applicants</div></div><Button small primary>Review {I.arrow}</Button></div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>AI-Recommended Candidates</div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {CANDIDATES.slice(0, 4).map(c => (
            <div key={c.id} style={{ minWidth: 200, padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Avatar initials={c.avatar} size={52} /></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{c.role}</div>
              <MatchBadge score={c.match} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CompanyAnalytics = () => (
  <div>
    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 24px" }}>Hiring Analytics</h2>
    <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
      <StatCard label="Cost per Hire" value="$3.2k" sub="-40% vs industry" icon={I.chart} color="#ffb84d" />
      <StatCard label="Offer Accept" value="92%" sub="+5% QoQ" icon={I.check} />
      <StatCard label="Quality of Hire" value="4.6/5" sub="Manager ratings" icon={I.spark} color="#00c2ff" />
    </div>
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Hires by Department</div>
      <MiniChart height={130} data={[{ label: "Eng", value: 12 }, { label: "Design", value: 4 }, { label: "Product", value: 6 }, { label: "Sales", value: 8 }, { label: "Ops", value: 3 }, { label: "Mktg", value: 5 }]} />
    </div>
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Diversity Metrics</div>
      {[{ l: "Gender Diversity", p: 47 }, { l: "Ethnic Diversity", p: 52 }, { l: "Age Distribution", p: 68 }].map(m => (
        <div key={m.l} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span style={{ color: "rgba(255,255,255,0.6)" }}>{m.l}</span><span style={{ color: "#ffb84d", fontWeight: 700 }}>{m.p}%</span></div><div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}><div style={{ height: "100%", borderRadius: 3, width: `${m.p}%`, background: "linear-gradient(90deg, #ffb84d, #ff6b8a)" }} /></div></div>
      ))}
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SIDEBAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Sidebar = ({ role, activeTab, setActiveTab, onLogout }) => {
  const roleColor = role === "seeker" ? "#00e5a0" : role === "recruiter" ? "#00c2ff" : "#ffb84d";
  const roleLabel = role === "seeker" ? "Job Seeker" : role === "recruiter" ? "Recruiter" : "Company";

  const navMap = {
    seeker: [
      { key: "home", icon: I.home, label: "Job Matches" },
      { key: "resume", icon: I.doc, label: "My Resume" },
      { key: "chat", icon: I.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: I.chart, label: "Analytics" },
    ],
    recruiter: [
      { key: "home", icon: I.home, label: "Candidates" },
      { key: "pipeline", icon: I.briefcase, label: "Pipeline" },
      { key: "chat", icon: I.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: I.chart, label: "Analytics" },
    ],
    company: [
      { key: "home", icon: I.home, label: "Dashboard" },
      { key: "chat", icon: I.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: I.chart, label: "Analytics" },
    ],
  };

  return (
    <div style={{ width: 220, height: "100vh", position: "fixed", left: 0, top: 0, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "20px 12px", zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 8, color: "#00e5a0" }}>
        {I.logo}<span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono', monospace" }}>HireFlow</span>
      </div>
      <div style={{ padding: "6px 8px 20px", fontSize: 11, color: roleColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{roleLabel}</div>
      <div style={{ flex: 1 }}>
        {navMap[role].map(item => (
          <div key={item.key} onClick={() => setActiveTab(item.key)} style={{ padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: activeTab === item.key ? "rgba(255,255,255,0.06)" : "transparent", color: activeTab === item.key ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 13.5 }}>
            <span style={{ color: activeTab === item.key ? roleColor : "inherit" }}>{item.icon}</span>
            {item.label}
            {item.badge && <span style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: 9, background: "#ff6b8a", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.badge}</span>}
          </div>
        ))}
      </div>
      <div onClick={onLogout} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 600, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8, paddingTop: 16 }}>← Switch Role</div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ROLE SELECTION (from v1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RoleSelect = ({ onSelect }) => {
  const [hovered, setHovered] = useState(null);
  const roles = [
    { key: "seeker", icon: I.user, title: "Job Seeker", desc: "Build your AI resume and get matched to dream roles", color: "#00e5a0" },
    { key: "recruiter", icon: I.users, title: "Recruiter", desc: "Source top talent and fill positions faster", color: "#00c2ff" },
    { key: "company", icon: I.building, title: "Company", desc: "Build your team with data-driven hiring", color: "#ffb84d" },
  ];
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: "radial-gradient(ellipse at 30% 20%, rgba(0,229,160,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,194,255,0.05) 0%, transparent 50%), #0a0f1a" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20, color: "#00e5a0" }}>{I.logo}<span style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono', monospace", letterSpacing: "-0.03em" }}>HireFlow</span></div>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.15, letterSpacing: "-0.03em" }}>AI-Powered <span style={{ background: "linear-gradient(135deg, #00e5a0, #00c2ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Job Matching</span></h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, marginTop: 12, maxWidth: 420, lineHeight: 1.6 }}>Smart recommendations connecting the right people with the right opportunities</p>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 800 }}>
        {roles.map(r => (
          <div key={r.key} onClick={() => onSelect(r.key)} onMouseEnter={() => setHovered(r.key)} onMouseLeave={() => setHovered(null)} style={{ width: 220, padding: "36px 28px", borderRadius: 20, cursor: "pointer", background: hovered === r.key ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${hovered === r.key ? `${r.color}50` : "rgba(255,255,255,0.06)"}`, transition: "all 0.3s ease", transform: hovered === r.key ? "translateY(-4px)" : "none", boxShadow: hovered === r.key ? `0 12px 40px ${r.color}15` : "none" }}>
            <div style={{ color: r.color, marginBottom: 16 }}>{r.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{r.title}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{r.desc}</div>
            <div style={{ marginTop: 20, color: r.color, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>Get started {I.arrow}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RESUME UPLOAD WITH AI EXTRACTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ResumeUpload = ({ onComplete, onBack }) => {
  const [phase, setPhase] = useState("upload"); // upload | parsing | review
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStage, setParseStage] = useState("");
  const fileRef = useRef(null);

  const extractedProfile = {
    name: "Alex Rivera",
    email: "alex.rivera@email.com",
    headline: "Senior Full Stack Developer | React & Node.js Expert",
    location: "San Francisco, CA",
    skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "PostgreSQL", "GraphQL", "Next.js", "CI/CD"],
    desiredRoles: ["Full Stack Developer", "Frontend Developer", "Software Engineer"],
    experienceLevel: "Senior (6-9 yrs)",
    workPrefs: ["Remote", "Hybrid"],
    salaryRange: "$160k–$200k",
    industries: ["Tech / SaaS", "AI / ML"],
    experience: [
      { id: 1, title: "Senior Full Stack Developer", company: "Stripe", duration: "2021 – Present", desc: "Led migration of payment dashboard to Next.js, improving performance by 40%. Architected real-time analytics pipeline serving 2M+ merchants." },
      { id: 2, title: "Software Engineer", company: "Airbnb", duration: "2018 – 2021", desc: "Built and maintained core booking flow components in React. Implemented A/B testing framework that increased conversion by 12%." },
      { id: 3, title: "Junior Developer", company: "TechStart Inc.", duration: "2016 – 2018", desc: "Developed REST APIs in Node.js and contributed to the company's design system." },
    ],
    education: [
      { id: 1, school: "UC Berkeley", degree: "B.S. Computer Science", year: "2016" },
    ],
  };

  const extractedSummary = "Results-driven Senior Full Stack Developer with 8+ years of expertise in React, TypeScript, Node.js, and cloud infrastructure. Most recently at Stripe, leading the migration of a payment dashboard to Next.js and architecting real-time analytics pipelines serving millions of merchants. Previously at Airbnb, where I built core booking flow components and implemented experimentation frameworks that drove measurable conversion improvements. Passionate about building scalable, performant web applications and seeking senior-level opportunities in innovative tech companies.";

  const parseStages = [
    { at: 0, label: "Uploading document..." },
    { at: 12, label: "Extracting text content..." },
    { at: 28, label: "Identifying contact information..." },
    { at: 40, label: "Analyzing work experience..." },
    { at: 55, label: "Mapping skills & technologies..." },
    { at: 68, label: "Detecting education history..." },
    { at: 78, label: "Inferring job preferences..." },
    { at: 88, label: "Generating AI summary..." },
    { at: 96, label: "Finalizing profile..." },
  ];

  const startParsing = (name) => {
    setFileName(name);
    setPhase("parsing");
    setParseProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 1.2 + Math.random() * 1.5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setPhase("review"), 600);
      }
      setParseProgress(Math.min(100, Math.round(progress)));
      const stage = [...parseStages].reverse().find(s => progress >= s.at);
      if (stage) setParseStage(stage.label);
    }, 80);
  };

  const handleFile = (file) => {
    if (file) startParsing(file.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  if (phase === "parsing") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 50% 30%, rgba(0,229,160,0.06) 0%, transparent 50%), #0a0f1a", padding: 32 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div style={{ width: 500, maxWidth: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48, color: "#00e5a0" }}>
            {I.logo}<span style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono', monospace" }}>HireFlow</span>
          </div>

          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ width: 64, height: 64, margin: "0 auto 24px", borderRadius: 32, border: "3px solid rgba(0,229,160,0.2)", borderTopColor: "#00e5a0", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Analyzing your resume</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{fileName}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#00e5a0", fontWeight: 600, animation: "fadeUp 0.3s ease" }}>{parseStage}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "'Space Mono', monospace" }}>{parseProgress}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #00e5a0, #00c2ff)", width: `${parseProgress}%`, transition: "width 0.15s ease" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {parseStages.filter(s => parseProgress >= s.at + 10).map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, animation: "fadeUp 0.3s ease", color: "rgba(255,255,255,0.5)" }}>
                <span style={{ color: "#00e5a0", display: "flex" }}>{I.check}</span> {s.label.replace("...", "")}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 30% 20%, rgba(0,229,160,0.05) 0%, transparent 50%), #0a0f1a", padding: "40px 32px" }}>
        <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, color: "#00e5a0" }}>
            {I.logo}<span style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono', monospace" }}>HireFlow</span>
          </div>

          <div style={{ marginBottom: 32, animation: "slideIn 0.5s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.2)", marginBottom: 16 }}>
              <span style={{ color: "#00e5a0", display: "flex" }}>{I.check}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#00e5a0" }}>Resume parsed successfully!</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Review extracted profile</div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>Our AI extracted the following from <span style={{ color: "rgba(255,255,255,0.6)" }}>{fileName}</span>. Review and edit before finding your matches.</p>
          </div>

          <div style={{ padding: 28, borderRadius: 16, background: "rgba(0,229,160,0.04)", border: "1px solid rgba(0,229,160,0.12)", marginBottom: 20, animation: "slideIn 0.5s ease 0.1s both" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#00e5a0", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>{I.spark} AI-Generated Summary</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{extractedSummary}</div>
          </div>

          <div style={{ padding: 28, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20, animation: "slideIn 0.5s ease 0.2s both" }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ flex: 1, minWidth: 250 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{extractedProfile.name}</div>
                <div style={{ fontSize: 14, color: "#00e5a0", marginTop: 4 }}>{extractedProfile.headline}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{extractedProfile.email} · {extractedProfile.location}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Preferences Detected</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
                  <div>{extractedProfile.experienceLevel}</div>
                  <div>{extractedProfile.workPrefs.join(", ")}</div>
                  <div>{extractedProfile.salaryRange}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Target Roles</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{extractedProfile.desiredRoles.map(r => <Tag key={r} accent size="lg">{r}</Tag>)}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Skills Extracted ({extractedProfile.skills.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{extractedProfile.skills.map(s => <Tag key={s} size="lg" accent>{I.check} {s}</Tag>)}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Experience ({extractedProfile.experience.length} positions)</div>
              {extractedProfile.experience.map(e => (
                <div key={e.id} style={{ marginBottom: 14, paddingLeft: 16, borderLeft: "2px solid rgba(0,229,160,0.3)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{e.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{e.company} · {e.duration}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4, lineHeight: 1.5 }}>{e.desc}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Education</div>
              {extractedProfile.education.map(e => (
                <div key={e.id}><span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{e.degree}</span><span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}> · {e.school} · {e.year}</span></div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", animation: "slideIn 0.5s ease 0.3s both" }}>
            <Button onClick={onBack}>← Start Over</Button>
            <div style={{ display: "flex", gap: 12 }}>
              <Button onClick={() => onComplete(extractedProfile, extractedSummary)}>{I.edit} Edit in Builder</Button>
              <Button primary onClick={() => onComplete(extractedProfile, extractedSummary)}>{I.spark} Find My Matches</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Upload phase
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 30% 20%, rgba(0,229,160,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,194,255,0.05) 0%, transparent 50%), #0a0f1a", padding: 32 }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 48, color: "#00e5a0" }}>
          {I.logo}<span style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono', monospace" }}>HireFlow</span>
        </div>

        <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Upload your resume</div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginBottom: 40, lineHeight: 1.6 }}>
          Our AI will extract your skills, experience, and preferences — <br/>and match you to jobs in seconds.
        </p>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            padding: "56px 40px", borderRadius: 20, cursor: "pointer",
            border: `2px dashed ${dragOver ? "#00e5a0" : "rgba(255,255,255,0.12)"}`,
            background: dragOver ? "rgba(0,229,160,0.06)" : "rgba(255,255,255,0.02)",
            transition: "all 0.25s ease", marginBottom: 24,
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          <div style={{ color: dragOver ? "#00e5a0" : "rgba(255,255,255,0.25)", marginBottom: 20, display: "flex", justifyContent: "center", transform: dragOver ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s" }}>
            <svg width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            {dragOver ? "Drop it here!" : "Drag & drop your resume"}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>or click to browse · PDF, DOC, DOCX</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>What we extract</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
          {[
            { icon: I.user, label: "Contact Info" },
            { icon: I.zap, label: "Skills" },
            { icon: I.briefcase, label: "Experience" },
            { icon: I.target, label: "Job Preferences" },
            { icon: I.spark, label: "AI Summary" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
              <span style={{ color: "#00e5a0", display: "flex" }}>{item.icon}</span> {item.label}
            </div>
          ))}
        </div>

        <Button onClick={onBack} style={{ color: "rgba(255,255,255,0.35)" }}>← Back</Button>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SEEKER CHOICE SCREEN (Upload vs Build)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SeekerChoice = ({ onUpload, onBuild, onBack }) => {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: "radial-gradient(ellipse at 30% 20%, rgba(0,229,160,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,194,255,0.05) 0%, transparent 50%), #0a0f1a" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24, color: "#00e5a0" }}>
          {I.logo}<span style={{ fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono', monospace" }}>HireFlow</span>
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em" }}>How would you like to get started?</div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, lineHeight: 1.6, maxWidth: 480 }}>Choose the fastest path to finding your dream job</p>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", maxWidth: 700 }}>
        <div
          onClick={onUpload}
          onMouseEnter={() => setHovered("upload")}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: 300, padding: "40px 32px", borderRadius: 24, cursor: "pointer",
            background: hovered === "upload" ? "rgba(0,229,160,0.06)" : "rgba(255,255,255,0.03)",
            border: `1.5px solid ${hovered === "upload" ? "rgba(0,229,160,0.4)" : "rgba(255,255,255,0.06)"}`,
            transition: "all 0.3s ease",
            transform: hovered === "upload" ? "translateY(-4px)" : "none",
            boxShadow: hovered === "upload" ? "0 16px 48px rgba(0,229,160,0.12)" : "none",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}
        >
          {hovered === "upload" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #00e5a0, #00c2ff)" }} />}
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.2)", marginBottom: 20, color: "#00e5a0" }}>
            {I.upload}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Upload Resume</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 20 }}>
            Drop your PDF or DOCX and our AI will extract everything — skills, experience, preferences — in seconds.
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.2)", fontSize: 12, fontWeight: 700, color: "#00e5a0" }}>
            {I.zap} Fastest — skip all steps
          </div>
        </div>

        <div
          onClick={onBuild}
          onMouseEnter={() => setHovered("build")}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: 300, padding: "40px 32px", borderRadius: 24, cursor: "pointer",
            background: hovered === "build" ? "rgba(0,194,255,0.05)" : "rgba(255,255,255,0.03)",
            border: `1.5px solid ${hovered === "build" ? "rgba(0,194,255,0.4)" : "rgba(255,255,255,0.06)"}`,
            transition: "all 0.3s ease",
            transform: hovered === "build" ? "translateY(-4px)" : "none",
            boxShadow: hovered === "build" ? "0 16px 48px rgba(0,194,255,0.1)" : "none",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}
        >
          {hovered === "build" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #00c2ff, #a78bfa)" }} />}
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.2)", marginBottom: 20, color: "#00c2ff" }}>
            {I.wand}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Build from Scratch</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 20 }}>
            Walk through our guided wizard to select your skills, set preferences, and let AI craft your resume step by step.
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.2)", fontSize: 12, fontWeight: 700, color: "#00c2ff" }}>
            {I.wand} Guided — 6 easy steps
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <Button onClick={onBack} ghost style={{ color: "rgba(255,255,255,0.3)" }}>← Back to role selection</Button>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  const [screen, setScreen] = useState("roleSelect"); // roleSelect | seekerChoice | resumeUpload | resumeBuilder | dashboard
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [seekerProfile, setSeekerProfile] = useState(null);
  const [aiSummary, setAiSummary] = useState("");

  const handleRoleSelect = (r) => {
    setRole(r);
    if (r === "seeker" && !seekerProfile) {
      setScreen("seekerChoice");
    } else {
      setScreen("dashboard");
      setActiveTab("home");
    }
  };

  const handleResumeComplete = (profile, summary) => {
    setSeekerProfile(profile);
    setAiSummary(summary);
    setScreen("dashboard");
    setActiveTab("home");
  };

  const handleEditResume = () => setScreen("resumeBuilder");

  const handleSwitchRole = () => {
    setScreen("roleSelect");
    setRole(null);
    setActiveTab("home");
  };

  const fontLink = <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />;
  const wrap = (child) => <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}>{fontLink}{child}</div>;

  if (screen === "roleSelect") return wrap(<RoleSelect onSelect={handleRoleSelect} />);

  if (screen === "seekerChoice") return wrap(
    <SeekerChoice
      onUpload={() => setScreen("resumeUpload")}
      onBuild={() => setScreen("resumeBuilder")}
      onBack={() => { setScreen("roleSelect"); setRole(null); }}
    />
  );

  if (screen === "resumeUpload") return wrap(
    <ResumeUpload
      onComplete={handleResumeComplete}
      onBack={() => setScreen("seekerChoice")}
    />
  );

  if (screen === "resumeBuilder") return wrap(<ResumeBuilder onComplete={handleResumeComplete} existingProfile={seekerProfile} />);

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: "#0a0f1a", color: "#fff", minHeight: "100vh" }}>
      {fontLink}
      <Sidebar role={role} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleSwitchRole} />
      <div style={{ marginLeft: 220, padding: "28px 36px" }}>
        <div style={{ maxWidth: 1100 }}>
          {role === "seeker" && <SeekerDashboard profile={seekerProfile} aiSummary={aiSummary} activeTab={activeTab} onEditResume={handleEditResume} />}
          {role === "recruiter" && <RecruiterDashboard activeTab={activeTab} />}
          {role === "company" && <CompanyDashboard activeTab={activeTab} />}
        </div>
      </div>
    </div>
  );
}
