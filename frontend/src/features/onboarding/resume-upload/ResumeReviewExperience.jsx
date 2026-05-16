import { inputStyle, labelStyle, sectionTitle } from "../../../styles/formStyles";
import Icons from "../../../components/ui/Icons";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

export function ResumeReviewExperience({ experience, onUpdateExp, onAddExp, onRemoveExp }) {
  return (
    <Card className="animate-in-delay-2" style={{ marginBottom: 20 }}>
      <div style={sectionTitle}>Experience</div>
      {(experience || []).map((exp, i) => (
        <div key={i} style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: "1px solid var(--border)", background: "var(--cream)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Position {i + 1}</span>
            <button onClick={() => onRemoveExp(i)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>{Icons.x}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={exp.title || ""} onChange={e => onUpdateExp(i, "title", e.target.value)} placeholder="Job Title" />
            </div>
            <div>
              <label style={labelStyle}>Company</label>
              <input style={inputStyle} value={exp.company || ""} onChange={e => onUpdateExp(i, "company", e.target.value)} placeholder="Company Name" />
            </div>
            <div>
              <label style={labelStyle}>Duration</label>
              <input style={inputStyle} value={exp.duration || ""} onChange={e => onUpdateExp(i, "duration", e.target.value)} placeholder="2020 - Present" />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={exp.description || ""} onChange={e => onUpdateExp(i, "description", e.target.value)} placeholder="Brief description" />
            </div>
          </div>
        </div>
      ))}
      <Button size="sm" onClick={onAddExp}>{Icons.plus} Add Experience</Button>
    </Card>
  );
}
