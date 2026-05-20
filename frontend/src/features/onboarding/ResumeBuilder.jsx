import { useState } from "react";
import api from "../../api";
import { SKILL_CATEGORIES, DESIRED_ROLES, EXPERIENCE_LEVELS, WORK_PREFS, SALARY_RANGES } from "../../data/constants";
import GlobalStyles from "../../styles/GlobalStyles";
import Icons from "../../components/ui/Icons";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Tag from "../../components/ui/Tag";
import Card from "../../components/ui/Card";

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
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>Hyrly</span>
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

export default ResumeBuilder;
