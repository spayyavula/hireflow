import { inputStyle, sectionTitle } from "../../../styles/formStyles";
import Card from "../../../components/ui/Card";
import Tag from "../../../components/ui/Tag";

export function ResumeReviewSkills({ parsed, skillSearch, filteredSkills, onRemoveSkill, onSkillSearchChange, onAddSkill }) {
  return (
    <Card className="animate-in-delay-2" style={{ marginBottom: 20 }}>
      <div style={sectionTitle}>Skills</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {(parsed.skills || []).map(s => (
          <Tag key={s} variant="coral" onRemove={() => onRemoveSkill(s)}>{s}</Tag>
        ))}
        {parsed.skills?.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: 14 }}>No skills detected — add some below</span>}
      </div>
      <div style={{ position: "relative" }}>
        <input
          style={inputStyle}
          value={skillSearch}
          onChange={e => onSkillSearchChange(e.target.value)}
          placeholder="Search skills to add..."
        />
        {filteredSkills.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", borderRadius: 12, marginTop: 4, padding: 8, zIndex: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
            {filteredSkills.map(s => (
              <div key={s} onClick={() => onAddSkill(s)} style={{ padding: "8px 12px", cursor: "pointer", borderRadius: 8, fontSize: 14 }} onMouseEnter={e => e.target.style.background = "var(--cream)"} onMouseLeave={e => e.target.style.background = "transparent"}>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
