import Icons from '../../../components/ui/Icons';
import { STATUS_CONFIG, CATEGORY_COLORS, ROLE_BADGES } from '../../../data/ideasConfig';

export function FeatureCard({ feature: f, isExpanded, comments, voting, isLoggedIn, commentText, onVote, onExpand, onCommentChange, onCommentSubmit }) {
  const statusCfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.submitted;
  const catColor = CATEGORY_COLORS[f.category] || "var(--text-muted)";
  const roleBadge = ROLE_BADGES[f.user_role];
  const featureComments = comments || [];

  return (
    <div style={{
      background: "white", borderRadius: 20, border: "1px solid var(--border)",
      overflow: "hidden", transition: "all 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,13,15,0.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", gap: 0 }}>
        {/* Vote column */}
        <div style={{
          padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", borderRight: "1px solid var(--border)", minWidth: 72,
          background: f.user_has_voted ? "rgba(255,107,91,0.04)" : "transparent",
        }}>
          <button onClick={() => onVote(f.id)} disabled={voting} style={{
            width: 44, height: 44, borderRadius: 12, border: "1.5px solid",
            borderColor: f.user_has_voted ? "var(--coral)" : "var(--border-strong)",
            background: f.user_has_voted ? "var(--coral)" : "transparent",
            color: f.user_has_voted ? "white" : "var(--text-muted)",
            cursor: voting ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexDirection: "column", fontSize: 10,
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
          <span style={{
            fontSize: 18, fontWeight: 800, color: f.user_has_voted ? "var(--coral)" : "var(--ink)", marginTop: 4,
            fontFamily: "'Playfair Display', serif",
          }}>{f.vote_count}</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{
              padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
              background: catColor, color: "white", opacity: 0.9,
            }}>{f.category}</span>
            <span style={{
              padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
              background: statusCfg.bg, color: statusCfg.color,
            }}>{statusCfg.label}</span>
            {roleBadge && (
              <span style={{
                padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: roleBadge.bg, color: roleBadge.color,
              }}>{roleBadge.label}</span>
            )}
          </div>
          <h3 style={{
            fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 6, lineHeight: 1.3,
            fontFamily: "'Source Sans 3', sans-serif",
          }}>{f.title}</h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
            {f.description.length > 200 && !isExpanded ? f.description.slice(0, 200) + "..." : f.description}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--text-muted)" }}>
            <span style={{ fontWeight: 600 }}>by {f.user_name}</span>
            <span>·</span>
            <span>{f.created_at ? new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
            <button onClick={() => onExpand(f.id)} style={{
              background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              gap: 4, color: isExpanded ? "var(--coral)" : "var(--text-muted)", fontWeight: 600, fontSize: 13,
              fontFamily: "'Source Sans 3', sans-serif", padding: 0,
            }}>
              {Icons.chat} {f.comment_count} {f.comment_count === 1 ? "comment" : "comments"}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Comments */}
      {isExpanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px", background: "var(--cream)" }}>
          {featureComments.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>No comments yet. Start the conversation!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              {featureComments.map(c => {
                const cRole = ROLE_BADGES[c.user_role];
                return (
                  <div key={c.id} style={{ display: "flex", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 18, background: cRole ? cRole.bg : "var(--cream-dark)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: cRole ? cRole.color : "var(--text-muted)", flexShrink: 0,
                    }}>{(c.user_name || "?").charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{c.user_name}</span>
                        {cRole && <span style={{ fontSize: 10, fontWeight: 600, color: cRole.color, background: cRole.bg, padding: "1px 6px", borderRadius: 8 }}>{cRole.label}</span>}
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                      </div>
                      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{c.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {isLoggedIn && (
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={commentText} onChange={e => onCommentChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onCommentSubmit(f.id)}
                placeholder="Add a comment..."
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid var(--border-strong)",
                  fontSize: 14, fontFamily: "'Source Sans 3', sans-serif", outline: "none",
                  background: "white",
                }}
              />
              <button onClick={() => onCommentSubmit(f.id)} style={{
                padding: "10px 18px", borderRadius: 12, border: "none", background: "var(--ink)",
                color: "var(--cream)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Source Sans 3', sans-serif",
              }}>{Icons.send}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
