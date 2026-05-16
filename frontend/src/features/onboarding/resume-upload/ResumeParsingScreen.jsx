import GlobalStyles from "../../../styles/GlobalStyles";

export function ResumeParsingScreen({ fileName, progress }) {
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
