import { FEATURE_CATEGORIES, FEATURE_STATUSES, STATUS_CONFIG } from '../../../data/ideasConfig';

export function IdeasBoardFilters({ category, statusFilter, sort, onCategoryChange, onStatusChange, onSortChange }) {
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {FEATURE_CATEGORIES.map(c => (
          <button key={c} onClick={() => onCategoryChange(c)} style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid",
            borderColor: category === c ? "var(--coral)" : "var(--border)",
            background: category === c ? "rgba(255,107,91,0.08)" : "white",
            color: category === c ? "var(--coral)" : "var(--text-secondary)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
            transition: "all 0.15s",
          }}>{c}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 32, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {FEATURE_STATUSES.map(s => {
            const cfg = s === "All" ? { label: "All", color: "var(--text-secondary)", bg: "white" } : STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => onStatusChange(s)} style={{
                padding: "5px 12px", borderRadius: 16, border: "1px solid",
                borderColor: statusFilter === s ? cfg.color : "var(--border)",
                background: statusFilter === s ? cfg.bg : "transparent",
                color: statusFilter === s ? cfg.color : "var(--text-muted)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
                transition: "all 0.15s",
              }}>{cfg.label}</button>
            );
          })}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Sort:</span>
          {[{ key: "votes", label: "Top Voted" }, { key: "newest", label: "Newest" }].map(s => (
            <button key={s.key} onClick={() => onSortChange(s.key)} style={{
              padding: "5px 12px", borderRadius: 16, border: "1px solid",
              borderColor: sort === s.key ? "var(--ink)" : "var(--border)",
              background: sort === s.key ? "var(--ink)" : "transparent",
              color: sort === s.key ? "var(--cream)" : "var(--text-muted)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
            }}>{s.label}</button>
          ))}
        </div>
      </div>
    </>
  );
}
