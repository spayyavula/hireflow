import Icons from './Icons';

const Tag = ({ children, variant = "default", size = "sm", selected, onClick, onRemove }) => {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: size === "lg" ? "8px 14px" : "5px 10px",
    borderRadius: 8,
    fontSize: size === "lg" ? 14 : 12,
    fontWeight: 600,
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.15s ease",
    userSelect: "none",
  };

  const variants = {
    default: {
      background: selected ? "var(--ink)" : "var(--cream-dark)",
      color: selected ? "var(--cream)" : "var(--text-secondary)",
      border: "1px solid transparent",
    },
    coral: {
      background: "rgba(255, 107, 91, 0.12)",
      color: "var(--coral)",
      border: "1px solid rgba(255, 107, 91, 0.2)",
    },
    sage: {
      background: "rgba(126, 184, 158, 0.15)",
      color: "#5a9a7a",
      border: "1px solid rgba(126, 184, 158, 0.25)",
    },
    outline: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid var(--border)",
    },
  };

  return (
    <span onClick={onClick} style={{ ...baseStyle, ...variants[variant] }}>
      {children}
      {onRemove && (
        <span onClick={e => { e.stopPropagation(); onRemove(); }} style={{ cursor: "pointer", opacity: 0.6, display: "flex" }}>
          {Icons.x}
        </span>
      )}
    </span>
  );
};

export default Tag;
