import { useState, useRef } from "react";
import api from "../../api";
import { SKILL_CATEGORIES } from "../../data/constants";
import { inputStyle, sectionTitle } from "../../styles/formStyles";
import GlobalStyles from "../../styles/GlobalStyles";
import Icons from "../../components/ui/Icons";
import Button from "../../components/ui/Button";
import Tag from "../../components/ui/Tag";
import Card from "../../components/ui/Card";
import { ResumeParsingScreen } from "./resume-upload/ResumeParsingScreen";
import { ResumeUploadDropzone } from "./resume-upload/ResumeUploadDropzone";
import { ResumeReviewBasicInfo } from "./resume-upload/ResumeReviewBasicInfo";
import { ResumeReviewSkills } from "./resume-upload/ResumeReviewSkills";
import { ResumeReviewExperience } from "./resume-upload/ResumeReviewExperience";
import { ResumeReviewEducation } from "./resume-upload/ResumeReviewEducation";
import { ResumeReviewPreferences } from "./resume-upload/ResumeReviewPreferences";

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
    return <ResumeParsingScreen fileName={fileName} progress={progress} />;
  }

  if (phase === "review" && parsed) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", padding: "40px 48px" }}>
        <GlobalStyles />
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48, color: "var(--ink)" }}>
            {Icons.logo}
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>Hyrly</span>
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

          <ResumeReviewBasicInfo parsed={parsed} onSet={set} />

          <ResumeReviewSkills
            parsed={parsed}
            skillSearch={skillSearch}
            filteredSkills={filteredSkills}
            onRemoveSkill={(s) => set("skills", parsed.skills.filter(x => x !== s))}
            onSkillSearchChange={setSkillSearch}
            onAddSkill={(s) => { toggleSkill(s); setSkillSearch(""); }}
          />

          <ResumeReviewExperience
            experience={parsed.experience}
            onUpdateExp={updateExp}
            onAddExp={addExp}
            onRemoveExp={removeExp}
          />

          <ResumeReviewEducation
            education={parsed.education}
            onUpdateEdu={updateEdu}
            onAddEdu={addEdu}
            onRemoveEdu={removeEdu}
          />

          <ResumeReviewPreferences parsed={parsed} onSet={set} />

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
    <ResumeUploadDropzone
      dragOver={dragOver}
      error={error}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) startParsing(e.dataTransfer.files[0]); }}
      onClick={() => fileRef.current?.click()}
      fileRef={fileRef}
      onFileChange={e => { if (e.target.files[0]) startParsing(e.target.files[0]); }}
      onBack={onBack}
    />
  );
};

export default ResumeUpload;
