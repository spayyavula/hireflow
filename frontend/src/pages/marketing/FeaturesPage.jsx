import { useState, useEffect } from 'react';
import GlobalStyles from '../../styles/GlobalStyles';
import Icons from '../../components/ui/Icons';
import Card from '../../components/ui/Card';
import PublicNav from '../../components/PublicNav';

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
      { icon: Icons.scout, title: "Scout AI Career Counselor", desc: "Get guidance on interviews, resumes, salary negotiation, career transitions, burnout, leadership, and more — 13 career domains." },
      { icon: Icons.mic, title: "Voice Mock Interviews", desc: "Practice with AI-generated questions based on the job description. Answer by voice, get scored on STAR method, quantification, and depth." },
      { icon: Icons.spark, title: "AI Match Scoring", desc: "Get a 0-99 compatibility score for every job based on your skills, experience, and preferences." },
      { icon: Icons.search, title: "Multi-Provider Job Search", desc: "Search JSearch, Jobs API, LinkedIn, Indeed, and multi-board aggregators — deduplicated and match-scored." },
      { icon: Icons.doc, title: "Resume Builder & Analyzer", desc: "Build a professional resume or upload yours for AI-powered feedback and optimization." },
      { icon: Icons.target, title: "JD Matcher", desc: "Paste any job description and get a detailed match analysis with cover letter generation." },
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
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <span>© 2026 JobsSearch. Built with AI.</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/terms" style={{ color: "rgba(250,248,245,0.45)", textDecoration: "none", fontSize: 12 }}>Terms</a>
          <a href="/privacy" style={{ color: "rgba(250,248,245,0.45)", textDecoration: "none", fontSize: 12 }}>Privacy</a>
          <a href="/help" style={{ color: "rgba(250,248,245,0.45)", textDecoration: "none", fontSize: 12 }}>Help</a>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
