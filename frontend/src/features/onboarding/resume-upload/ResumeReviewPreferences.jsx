import { labelStyle, sectionTitle } from "../../../styles/formStyles";
import { DESIRED_ROLES, EXPERIENCE_LEVELS, WORK_PREFS, SALARY_RANGES } from "../../../data/constants";
import Card from "../../../components/ui/Card";
import Tag from "../../../components/ui/Tag";

export function ResumeReviewPreferences({ parsed, onSet }) {
  return (
    <Card className="animate-in-delay-3" style={{ marginBottom: 20 }}>
      <div style={sectionTitle}>Preferences</div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Desired Roles</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DESIRED_ROLES.map(r => (
            <Tag key={r} size="lg" selected={(parsed.desired_roles || []).includes(r)} onClick={() => {
              const roles = parsed.desired_roles || [];
              onSet("desired_roles", roles.includes(r) ? roles.filter(x => x !== r) : [...roles, r]);
            }}>{r}</Tag>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Experience Level</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXPERIENCE_LEVELS.map(l => (
            <Tag key={l} size="lg" selected={parsed.experience_level === l} onClick={() => onSet("experience_level", l)}>{l}</Tag>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Work Preference</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {WORK_PREFS.map(w => (
            <Tag key={w} size="lg" selected={(parsed.work_preferences || []).includes(w)} onClick={() => {
              const prefs = parsed.work_preferences || [];
              onSet("work_preferences", prefs.includes(w) ? prefs.filter(x => x !== w) : [...prefs, w]);
            }}>{w}</Tag>
          ))}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Target Salary</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SALARY_RANGES.map(s => (
            <Tag key={s} size="lg" selected={parsed.salary_range === s} onClick={() => onSet("salary_range", s)}>{s}</Tag>
          ))}
        </div>
      </div>
    </Card>
  );
}
