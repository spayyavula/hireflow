import { useState, useEffect, useRef } from "react";
import api from "./api";
import { toSlug } from './lib/slug';
import { getPageFromPath, getPathFromPage } from './lib/routing';
import { formatTimeAgo } from './lib/format';
import { SKILL_CATEGORIES, DESIRED_ROLES, EXPERIENCE_LEVELS, WORK_PREFS, SALARY_RANGES } from './data/constants';
import { JOBS, getJobPostingBySlug, CANDIDATES, PIPELINE_STAGES, PIPELINE_DATA, MESSAGES } from './data/mockData';
import { FEATURE_CATEGORIES, FEATURE_STATUSES, STATUS_CONFIG, CATEGORY_COLORS, ROLE_BADGES } from './data/ideasConfig';
import GlobalStyles from './styles/GlobalStyles';
import Icons from './components/ui/Icons';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Tag from './components/ui/Tag';
import MatchScore from './components/ui/MatchScore';
import Avatar from './components/ui/Avatar';
import Card from './components/ui/Card';
import StatCard from './components/ui/StatCard';

// ═══════════════════════════════════════════════════════════════════
// HIREFLOW REDESIGN — Classic Corporate Aesthetic
// Typography: Playfair Display + Source Sans 3
// Colors: Deep ink, warm coral, cream accents
// ═══════════════════════════════════════════════════════════════════

// ─── Public Nav ─────────────────────────────────────────────────────
const PublicNav = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const navPage = currentPage === "ideas" ? "roadmap" : currentPage;
  const navLinks = [
    { key: "features", label: "Features" },
    { key: "pricing", label: "Pricing" },
    { key: "about", label: "About" },
    { key: "roadmap", label: "Roadmap" },
    { key: "blog", label: "Blog" },
  ];

  return (
    <header style={{
      padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, background: "rgba(250,248,245,0.85)", backdropFilter: "blur(12px)",
      zIndex: 100, borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <a
          href={getPathFromPage("home")}
          onClick={(e) => { e.preventDefault(); onNavigate("home"); }}
          style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink)", cursor: "pointer", textDecoration: "none" }}
        >
          <span aria-hidden="true" style={{ display: "flex" }}>{Icons.logo}</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>JobsSearch</span>
        </a>
        <nav style={{ display: "flex", gap: 8 }}>
          {navLinks.map(link => (
            <a
              key={link.key}
              href={getPathFromPage(link.key)}
              onClick={(e) => { e.preventDefault(); onNavigate(link.key); }}
              style={{
              padding: "8px 16px", borderRadius: 8, border: "none", background: "transparent",
              fontSize: 14, fontWeight: 600, cursor: "pointer", color: navPage === link.key ? "var(--coral)" : "var(--text-secondary)",
              fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease", position: "relative",
              borderBottom: navPage === link.key ? "2px solid var(--coral)" : "2px solid transparent",
              textDecoration: "none",
            }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onSignIn} style={{
          padding: "10px 24px", borderRadius: 10, border: "1.5px solid var(--border-strong)",
          background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer",
          color: "var(--text-primary)", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
        }}>Sign In</button>
        <button onClick={onGetStarted} style={{
          padding: "10px 24px", borderRadius: 10, border: "none",
          background: "var(--coral)", color: "white", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
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
    { num: "02", icon: Icons.spark, title: "AI Matching", desc: "Search jobs across multiple providers. Our AI scores every role against your skills, experience, and preferences." },
    { num: "03", icon: Icons.scout, title: "Get Career Guidance", desc: "Scout AI coaches you on interviews, resumes, salary negotiation, career transitions, and more." },
    { num: "04", icon: Icons.mic, title: "Practice & Get Hired", desc: "Run voice mock interviews with real-time feedback, then apply with confidence." },
  ];

  const roles = [
    {
      title: "Job Seekers", accent: "var(--coral)", icon: Icons.user,
      points: ["AI job matching across 5 providers", "Scout AI career counselor", "Voice mock interviews with feedback", "Resume builder & ATS optimization tips", "Salary negotiation coaching"],
    },
    {
      title: "Recruiters", accent: "var(--sage)", icon: Icons.users,
      points: ["Candidate pipeline management", "AI scoring & ranking", "Real-time chat with talent", "Hiring analytics dashboard"],
    },
    {
      title: "Companies", accent: "var(--lavender)", icon: Icons.building,
      points: ["Easy job posting", "Analytics dashboard", "Curated talent pool", "AI-matched candidates"],
    },
  ];

  const aiFeatures = [
    {
      icon: Icons.scout, accent: "var(--coral)", accentBg: "rgba(255,107,91,0.08)",
      title: "Scout AI — Career Counselor",
      desc: "A full-spectrum AI career advisor that covers job search, interview prep, resume optimization, salary negotiation, career transitions, networking, burnout recovery, leadership coaching, and industry insights.",
      tags: ["13 Career Domains", "Personalized Advice", "Skill Gap Analysis"],
    },
    {
      icon: Icons.mic, accent: "var(--sage)", accentBg: "rgba(126,184,158,0.08)",
      title: "Interview Bot — Voice Mock Interviews",
      desc: "Practice with AI-generated questions tailored to the job description and your resume. Answer by voice with Wispr AI transcription, get instant scores and feedback on every answer.",
      tags: ["Voice-Powered", "Wispr AI", "STAR Method Scoring"],
    },
    {
      icon: Icons.search, accent: "var(--lavender)", accentBg: "rgba(155,143,212,0.08)",
      title: "Multi-Provider Job Search",
      desc: "Search across JSearch, Jobs API, LinkedIn, Indeed, and multi-board aggregators simultaneously. Jobs are deduplicated, scored against your profile, and ranked by match strength.",
      tags: ["5 Job Sources", "AI Match Scoring", "Real-Time Results"],
    },
  ];

  const stats = [
    { value: "5", label: "Job sources searched at once" },
    { value: "13", label: "Career domains Scout AI covers" },
    { value: "Voice", label: "Mock interviews with instant feedback" },
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
            AI Career Platform
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 700,
            lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 20,
          }}>
            Your AI-powered <br />career partner
          </h1>
          <p style={{
            fontSize: 18, color: "var(--text-secondary)", maxWidth: 580, margin: "0 auto 40px",
            lineHeight: 1.7,
          }}>
            Smart job search across multiple providers, AI career counseling, voice mock interviews
            with real-time feedback, and everything you need to land your dream role.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button onClick={() => onNavigate("features")} style={{
              padding: "14px 36px", borderRadius: 12, border: "none",
              background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
            }}>See the Platform</button>
            <button onClick={onGetStarted} style={{
              padding: "14px 36px", borderRadius: 12, border: "1.5px solid var(--border-strong)",
              background: "transparent", fontSize: 16, fontWeight: 600,
              cursor: "pointer", color: "var(--text-primary)", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
            }}>Create Account</button>
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
            From profile to placement in four simple steps
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {steps.map((step, i) => (
            <div key={i} className={`animate-in-delay-${i + 1}`} style={{
              background: "white", borderRadius: 20, padding: 32,
              border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
              }}>
                <div aria-hidden="true" style={{
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

      {/* ── AI-Powered Features ── */}
      <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: "linear-gradient(135deg, rgba(255,107,91,0.08), rgba(155,143,212,0.08))",
            color: "var(--coral)", marginBottom: 16,
          }}>What makes us different</div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
            color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12,
          }}>AI that actually helps your career</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto" }}>
            Not just another job board — a complete career platform powered by AI
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {aiFeatures.map((f, i) => (
            <div key={i} className={`animate-in-delay-${i + 1}`} style={{
              background: "white", borderRadius: 20, padding: 32,
              border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
              display: "flex", gap: 24, alignItems: "flex-start",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(13,13,15,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,13,15,0.04)"; }}
            >
              <div aria-hidden="true" style={{
                width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: f.accentBg, color: f.accent,
              }}>{f.icon}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700,
                  color: "var(--ink)", marginBottom: 8,
                }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 14 }}>{f.desc}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {f.tags.map(tag => (
                    <span key={tag} style={{
                      padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: f.accentBg, color: f.accent,
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
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
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 12px" }}>
            Top roles from companies using JobsSearch right now
          </p>
          <span style={{
            display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: "rgba(126,184,158,0.12)", color: "var(--sage)", border: "1px solid rgba(126,184,158,0.25)",
          }}>Demo preview — sample data</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {featuredJobs.map((job, i) => (
            <a
              key={job.id}
              href={getPathFromPage(`job-post:${toSlug(job.title)}`)}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`job-post:${toSlug(job.title)}`);
              }}
              className={`animate-in-delay-${i + 1}`}
              style={{
              background: "white", borderRadius: 20, padding: 24,
              border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
              transition: "transform 0.25s ease, box-shadow 0.25s ease", cursor: "pointer", textDecoration: "none",
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
            </a>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
            color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12,
          }}>What early users say</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
            From beta testers who've used it in their own job search
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            {
              quote: "The match scoring actually makes sense. Instead of 200 irrelevant listings I got 12 that fit — and I knew exactly why.",
              name: "Priya M.", role: "Senior Engineer, now at a Series B startup", initials: "PM",
            },
            {
              quote: "I did three mock voice interviews the night before my panel. The feedback was sharper than anything I'd gotten from a human reviewer.",
              name: "Daniel R.", role: "Product Manager, recently promoted", initials: "DR",
            },
            {
              quote: "Scout AI walked me through a career pivot I'd been overthinking for a year. It gave me a concrete skills roadmap in one session.",
              name: "Lena K.", role: "Transitioning from QA to Product Design", initials: "LK",
            },
          ].map((t, i) => (
            <div key={i} style={{
              background: "white", borderRadius: 20, padding: 32,
              border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              <div style={{ color: "var(--coral)", fontSize: 28, lineHeight: 1, fontFamily: "Georgia, serif" }}>"</div>
              <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.7, fontStyle: "italic", flex: 1 }}>{t.quote}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", background: "var(--ink)", color: "var(--cream)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.role}</div>
                </div>
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
        }}>Ready to accelerate your career?</h2>
        <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", marginBottom: 36, maxWidth: 520, margin: "0 auto 36px" }}>
          AI career counseling, voice mock interviews, multi-provider job search, and smart matching — all free to start.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={onGetStarted} style={{
            padding: "14px 36px", borderRadius: 12, border: "none",
            background: "var(--coral)", color: "white", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "0 4px 16px rgba(255,107,91,0.3)",
          }}>Create Free Account</button>
          <button onClick={() => onNavigate("features")} style={{
            padding: "14px 36px", borderRadius: 12, border: "1.5px solid rgba(250,248,245,0.2)",
            background: "transparent", color: "var(--cream)", fontSize: 16, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
          }}>See Features</button>
        </div>
      </section>

      {/* ── Footer ── */}
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

// ─── Ideas Board (Feature Requests) ─────────────────────────────────

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

// ─── Sidebar ─────────────────────────────────────────────────────────
const Sidebar = ({ role, activeTab, setActiveTab, onLogout }) => {
  const roleColors = { seeker: "var(--coral)", recruiter: "var(--sage)", company: "var(--lavender)" };
  const roleLabels = { seeker: "Job Seeker", recruiter: "Recruiter", company: "Company" };

  const navItems = {
    seeker: [
      { key: "home", icon: Icons.briefcase, label: "Job Matches" },
      { key: "scout", icon: Icons.scout, label: "Scout AI", glow: true },
      { key: "interview", icon: Icons.mic, label: "Interview Bot", glow: true },
      { key: "resume", icon: Icons.doc, label: "My Resume" },
      { key: "chat", icon: Icons.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: Icons.chart, label: "Analytics" },
      { key: "matcher", icon: Icons.target, label: "JD Matcher" },
      { key: "ideas", icon: Icons.spark, label: "Ideas Board" },
    ],
    recruiter: [
      { key: "home", icon: Icons.users, label: "Candidates" },
      { key: "scout", icon: Icons.scout, label: "Scout AI", glow: true },
      { key: "pipeline", icon: Icons.target, label: "Pipeline" },
      { key: "chat", icon: Icons.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: Icons.chart, label: "Analytics" },
      { key: "ideas", icon: Icons.spark, label: "Ideas Board" },
    ],
    company: [
      { key: "home", icon: Icons.building, label: "Dashboard" },
      { key: "scout", icon: Icons.scout, label: "Scout AI", glow: true },
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
            <span style={{ color: activeTab === item.key ? roleColors[role] : item.glow ? "var(--coral)" : "inherit" }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.glow && activeTab !== item.key && <span style={{ width: 6, height: 6, borderRadius: 3, background: "linear-gradient(135deg, var(--coral), var(--lavender))", marginLeft: "auto", animation: "pulse 2s ease-in-out infinite" }} />}
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
  const isExternal = ["jsearch", "jobs_api", "linkedin", "indeed", "jobs_search"].includes(job.source);

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

  useEffect(() => {
    const upsertMeta = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        if (attrs.name) el.setAttribute("name", attrs.name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", attrs.content);
    };

    const hasPosts = posts.length > 0;
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: hasPosts ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" : "noindex,follow",
    });

    return () => {
      upsertMeta('meta[name="robots"]', {
        name: "robots",
        content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
      });
    };
  }, [posts]);

  const getQuickTake = (post) => {
    const source = post?.excerpt || post?.subtitle || post?.title || "";
    if (!source) return "Practical guidance for your next hiring or career decision.";
    const trimmed = source.trim();
    return trimmed.length > 170 ? `${trimmed.slice(0, 170)}...` : trimmed;
  };

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
                <div style={{
                  background: "rgba(13,13,15,0.03)", border: "1px solid var(--border)", borderRadius: 12,
                  padding: "12px 14px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16,
                }}>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>Quick take:</span> {getQuickTake(post)}
                </div>
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
                  <p style={{
                    fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14,
                    padding: "10px 12px", borderRadius: 10, background: "rgba(13,13,15,0.03)", border: "1px solid var(--border)",
                  }}>
                    <span style={{ fontWeight: 700, color: "var(--ink)" }}>Quick take:</span> {getQuickTake(post)}
                  </p>
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
  const [copied, setCopied] = useState(false);

  const stripHtml = (html = "") => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const postPlainText = post ? stripHtml(post.body_html || "") : "";
  const quickAnswer = post
    ? (post.excerpt || post.subtitle || postPlainText || "").slice(0, 260)
    : "";

  const getPostUrl = () => `${window.location.origin}/blog/${slug}`;
  const shareLinks = post ? {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getPostUrl())}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getPostUrl())}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(getPostUrl())}&text=${encodeURIComponent(post.title + " | JobsSearch Blog")}`,
    instagram: null, // Instagram doesn't support direct URL sharing — copy link instead
  } : {};
  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPostUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!post) return;

    const canonicalUrl = getPostUrl();
    const pageTitle = post.seo_title ? `${post.seo_title} | JobsSearch` : `${post.title} | JobsSearch Blog`;
    const pageDescription = post.seo_description || post.excerpt || post.subtitle || "Career insights and hiring decisions from JobsSearch.";

    document.title = pageTitle;

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

    upsertMeta('meta[name="description"]', { name: "description", content: pageDescription });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "article" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: pageDescription });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: pageDescription });

    if (post.cover_image_url) {
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: post.cover_image_url });
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: post.cover_image_url });
    }

    if (post.published_at) {
      upsertMeta('meta[property="article:published_time"]', { property: "article:published_time", content: post.published_at });
    }

    if (post.author_name) {
      upsertMeta('meta[name="author"]', { name: "author", content: post.author_name });
    }

    let canonicalEl = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonicalUrl);

    let jsonLdEl = document.head.querySelector('#blogpost-jsonld');
    if (!jsonLdEl) {
      jsonLdEl = document.createElement("script");
      jsonLdEl.setAttribute("type", "application/ld+json");
      jsonLdEl.setAttribute("id", "blogpost-jsonld");
      document.head.appendChild(jsonLdEl);
    }

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: pageDescription,
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl,
      author: {
        "@type": "Person",
        name: post.author_name || "JobsSearch",
      },
      publisher: {
        "@type": "Organization",
        name: "JobsSearch",
        logo: {
          "@type": "ImageObject",
          url: "https://jobssearch.work/favicon.svg",
        },
      },
      datePublished: post.published_at || undefined,
      dateModified: post.updated_at || post.published_at || undefined,
      image: post.cover_image_url || "https://jobssearch.work/og-image.svg",
      keywords: Array.isArray(post.tags) ? post.tags.join(", ") : undefined,
      articleSection: CATEGORY_LABELS[post.category] || post.category,
      wordCount: postPlainText ? postPlainText.split(/\s+/).length : undefined,
    };

    jsonLdEl.textContent = JSON.stringify(articleSchema);

    return () => {
      const existing = document.head.querySelector('#blogpost-jsonld');
      if (existing) existing.remove();
    };
  }, [post, slug]);

  useEffect(() => { window.scrollTo(0, 0); loadPost(); }, [slug]);

  useEffect(() => {
    if (!loading && !post) {
      onNavigate("coming-soon", { replace: true });
    }
  }, [loading, post, onNavigate]);

  const loadPost = async () => {
    try {
      const [postData, jobsData] = await Promise.all([
        api.getBlogPost(slug),
        api.getRelatedJobsForPost(slug).catch(() => []),
      ]);
      setPost(postData);
      setRelatedJobs(jobsData);
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
    <ComingSoonPage
      onGetStarted={onGetStarted}
      onSignIn={onSignIn}
      onNavigate={onNavigate}
      currentPage="coming-soon"
    />
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

          {quickAnswer && (
            <div style={{
              borderRadius: 14, border: "1px solid var(--border)", background: "rgba(13,13,15,0.03)",
              padding: "14px 16px", marginBottom: 24,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
                Quick answer
              </div>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                {quickAnswer}{quickAnswer.length === 260 ? "..." : ""}
              </p>
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div style={{
              borderRadius: 14, border: "1px solid var(--border)", background: "white",
              padding: "14px 16px", marginBottom: 28,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
                Key points covered
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {post.tags.slice(0, 6).map(tag => (
                  <span key={tag} style={{
                    padding: "6px 12px", borderRadius: 16, background: "rgba(13,13,15,0.05)",
                    fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
                  }}>{tag}</span>
                ))}
              </div>
            </div>
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

          {/* Share Buttons */}
          <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 16 }}>Share this article</h4>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
                background: "#0A66C2", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none",
                fontFamily: "'Source Sans 3', sans-serif", transition: "opacity 0.2s",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              <a href={shareLinks.x} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
                background: "#0F1419", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none",
                fontFamily: "'Source Sans 3', sans-serif", transition: "opacity 0.2s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Post on X
              </a>
              <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
                background: "#1877F2", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none",
                fontFamily: "'Source Sans 3', sans-serif", transition: "opacity 0.2s",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
              <button onClick={handleCopyLink} style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
                background: copied ? "var(--sage)" : "var(--ink)", color: "white", fontSize: 13, fontWeight: 600,
                border: "none", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
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

const StaticContentPage = ({ title, subtitle, sections, onGetStarted, onSignIn, onNavigate, currentPage }) => (
  <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
    <GlobalStyles />
    <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

    <section style={{ maxWidth: 920, margin: "0 auto", padding: "72px 48px" }}>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "clamp(34px, 4vw, 48px)",
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        marginBottom: 16,
        color: "var(--ink)",
      }}>{title}</h1>
      <p style={{ fontSize: 17, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.7 }}>{subtitle}</p>

      <div style={{ display: "grid", gap: 18 }}>
        {sections.map((section) => (
          <article key={section.heading} style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid var(--border)",
            padding: 24,
          }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 10, color: "var(--ink)" }}>{section.heading}</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.75 }}>{section.body}</p>
          </article>
        ))}
      </div>
    </section>

    <footer style={{
      padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
      background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
    }}>
      &copy; 2026 JobsSearch. Built with AI.
    </footer>
  </div>
);

const ComingSoonPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => (
  <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
    <GlobalStyles />
    <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

    <section style={{ maxWidth: 920, margin: "0 auto", padding: "96px 48px" }}>
      <article style={{
        background: "linear-gradient(135deg, #fff 0%, #f9f6f2 100%)",
        border: "1px solid var(--border)",
        borderRadius: 24,
        padding: "44px 36px",
        boxShadow: "0 14px 42px rgba(13,13,15,0.08)",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-block",
          padding: "6px 14px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--coral)",
          background: "rgba(255,107,91,0.10)",
          marginBottom: 16,
        }}>
          Coming Soon
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(34px, 4.5vw, 48px)",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          marginBottom: 10,
          color: "var(--ink)",
        }}>
          This page is still in production
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.75, marginBottom: 26 }}>
          We are polishing this section so it launches with complete content and a cleaner decision flow.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Button variant="coral" onClick={() => onNavigate("home")}>Back to homepage</Button>
          <Button variant="outline" onClick={() => onNavigate("roadmap")}>See roadmap</Button>
        </div>
      </article>
    </section>
  </div>
);

const JobDetailPage = ({ slug, onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const job = getJobPostingBySlug(slug);

  if (!job) {
    return (
      <ComingSoonPage
        onGetStarted={onGetStarted}
        onSignIn={onSignIn}
        onNavigate={onNavigate}
        currentPage="coming-soon"
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      <section style={{ maxWidth: 940, margin: "0 auto", padding: "64px 48px 80px" }}>
        <button onClick={() => onNavigate("home")} style={{
          border: "none", background: "transparent", color: "var(--coral)", cursor: "pointer",
          fontWeight: 700, marginBottom: 20, fontSize: 14, fontFamily: "'Source Sans 3', sans-serif",
        }}>&larr; Back to featured opportunities</button>

        <article style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", padding: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, lineHeight: 1.1, letterSpacing: "-0.03em", color: "var(--ink)", marginBottom: 8 }}>{job.title}</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 17 }}>{job.company} · {job.location}</p>
            </div>
            <div style={{ alignSelf: "flex-start", padding: "8px 14px", borderRadius: 10, background: "rgba(255,107,91,0.08)", color: "var(--coral)", fontWeight: 700 }}>
              {job.match}% match
            </div>
          </div>

          <p style={{ color: "var(--text-primary)", lineHeight: 1.75, marginBottom: 22 }}>{job.description}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, marginBottom: 24 }}>
            <Card style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Salary</div>
              <div style={{ fontWeight: 700 }}>{job.salary}</div>
            </Card>
            <Card style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Work type</div>
              <div style={{ fontWeight: 700 }}>{job.remote ? "Remote-friendly" : "On-site"}</div>
            </Card>
          </div>

          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 10, color: "var(--ink)" }}>Required skills</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {job.requiredSkills.map((skill) => <Tag key={skill} variant="coral" size="lg">{skill}</Tag>)}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 10, color: "var(--ink)" }}>Nice to have</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {job.niceSkills.map((skill) => <Tag key={skill} variant="outline" size="lg">{skill}</Tag>)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="coral" size="lg" onClick={onGetStarted}>Create free account to apply</Button>
            <Button variant="outline" size="lg" onClick={() => onNavigate("features")}>See platform features</Button>
          </div>
        </article>
      </section>
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
