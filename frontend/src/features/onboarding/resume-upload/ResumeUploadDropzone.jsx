import GlobalStyles from "../../../styles/GlobalStyles";
import Icons from "../../../components/ui/Icons";
import Button from "../../../components/ui/Button";

export function ResumeUploadDropzone({ dragOver, error, onDragOver, onDragLeave, onDrop, onClick, fileRef, onFileChange, onBack }) {
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
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onClick}
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
          <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: "none" }} onChange={onFileChange} />
          <div style={{ color: dragOver ? "var(--coral)" : "var(--text-muted)", marginBottom: 16 }}>{Icons.upload}</div>
          <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{dragOver ? "Drop it here!" : "Drag & drop your resume"}</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>or click to browse · PDF, DOCX</div>
        </div>

        <Button variant="ghost" onClick={onBack}>{Icons.arrowLeft} Back</Button>
      </div>
    </div>
  );
}
