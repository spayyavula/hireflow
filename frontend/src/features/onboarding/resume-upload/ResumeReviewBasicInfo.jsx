import { inputStyle, labelStyle, sectionTitle } from "../../../styles/formStyles";
import Card from "../../../components/ui/Card";

export function ResumeReviewBasicInfo({ parsed, onSet }) {
  return (
    <Card className="animate-in-delay-1" style={{ marginBottom: 20 }}>
      <div style={sectionTitle}>Basic Info</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input style={inputStyle} value={parsed.name || ""} onChange={e => onSet("name", e.target.value)} placeholder="Your full name" />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} value={parsed.email || ""} onChange={e => onSet("email", e.target.value)} placeholder="email@example.com" />
        </div>
        <div>
          <label style={labelStyle}>Headline</label>
          <input style={inputStyle} value={parsed.headline || ""} onChange={e => onSet("headline", e.target.value)} placeholder="Senior Software Engineer" />
        </div>
        <div>
          <label style={labelStyle}>Location</label>
          <input style={inputStyle} value={parsed.location || ""} onChange={e => onSet("location", e.target.value)} placeholder="San Francisco, CA" />
        </div>
      </div>
    </Card>
  );
}
