import { inputStyle, labelStyle, sectionTitle } from "../../../styles/formStyles";
import Icons from "../../../components/ui/Icons";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

export function ResumeReviewEducation({ education, onUpdateEdu, onAddEdu, onRemoveEdu }) {
  return (
    <Card className="animate-in-delay-2" style={{ marginBottom: 20 }}>
      <div style={sectionTitle}>Education</div>
      {(education || []).map((edu, i) => (
        <div key={i} style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: "1px solid var(--border)", background: "var(--cream)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Education {i + 1}</span>
            <button onClick={() => onRemoveEdu(i)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>{Icons.x}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>School</label>
              <input style={inputStyle} value={edu.school || ""} onChange={e => onUpdateEdu(i, "school", e.target.value)} placeholder="University" />
            </div>
            <div>
              <label style={labelStyle}>Degree</label>
              <input style={inputStyle} value={edu.degree || ""} onChange={e => onUpdateEdu(i, "degree", e.target.value)} placeholder="B.S. Computer Science" />
            </div>
            <div>
              <label style={labelStyle}>Year</label>
              <input style={inputStyle} value={edu.year || ""} onChange={e => onUpdateEdu(i, "year", e.target.value)} placeholder="2020" />
            </div>
          </div>
        </div>
      ))}
      <Button size="sm" onClick={onAddEdu}>{Icons.plus} Add Education</Button>
    </Card>
  );
}
