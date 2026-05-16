import Icons from '../../../components/ui/Icons';
import { FEATURE_CATEGORIES, CATEGORY_COLORS } from '../../../data/ideasConfig';

export function SubmitIdeaModal({ submitForm, submitting, error, onClose, onFieldChange, onSubmit }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(13,13,15,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: 24, padding: 36, width: "100%", maxWidth: 520,
        boxShadow: "0 24px 48px rgba(13,13,15,0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700 }}>Submit an Idea</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>{Icons.x}</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Title</label>
            <input value={submitForm.title} onChange={e => onFieldChange("title", e.target.value)}
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
                <button key={c} onClick={() => onFieldChange("category", c)} style={{
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
            <textarea value={submitForm.description} onChange={e => onFieldChange("description", e.target.value)}
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
          <button onClick={onSubmit} disabled={submitting || submitForm.title.length < 5 || submitForm.description.length < 10} style={{
            padding: "14px 24px", borderRadius: 12, border: "none", background: "var(--coral)", color: "white",
            fontSize: 15, fontWeight: 700, cursor: submitting ? "wait" : "pointer",
            fontFamily: "'Source Sans 3', sans-serif", opacity: (submitForm.title.length < 5 || submitForm.description.length < 10) ? 0.5 : 1,
            transition: "all 0.2s",
          }}>{submitting ? "Submitting..." : "Submit Idea"}</button>
        </div>
      </div>
    </div>
  );
}
