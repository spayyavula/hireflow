const Button = ({ children, variant = "default", size = "md", onClick, disabled, style, icon }) => {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 600,
    borderRadius: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    border: "none",
    opacity: disabled ? 0.5 : 1,
    fontFamily: "'Source Sans 3', sans-serif",
  };

  const variants = {
    default: {
      background: "var(--ink)",
      color: "var(--cream)",
      padding: size === "sm" ? "8px 16px" : size === "lg" ? "16px 32px" : "12px 24px",
      fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    },
    coral: {
      background: "var(--coral)",
      color: "white",
      padding: size === "sm" ? "8px 16px" : size === "lg" ? "16px 32px" : "12px 24px",
      fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    },
    outline: {
      background: "transparent",
      color: "var(--ink)",
      border: "1.5px solid var(--border-strong)",
      padding: size === "sm" ? "7px 15px" : size === "lg" ? "15px 31px" : "11px 23px",
      fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
      padding: size === "sm" ? "8px 12px" : "10px 16px",
      fontSize: size === "sm" ? 13 : 14,
    },
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{ ...baseStyle, ...variants[variant], ...style }}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
