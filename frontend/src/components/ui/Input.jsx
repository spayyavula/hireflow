const Input = ({ placeholder, value, onChange, icon, style, type = "text" }) => (
  <div style={{ position: "relative", ...style }}>
    {icon && (
      <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
        {icon}
      </span>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: icon ? "14px 16px 14px 48px" : "14px 16px",
        borderRadius: 12,
        border: "1.5px solid var(--border)",
        background: "white",
        fontSize: 15,
        color: "var(--text-primary)",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onFocus={e => {
        e.target.style.borderColor = "var(--coral)";
        e.target.style.boxShadow = "0 0 0 3px rgba(255, 107, 91, 0.1)";
      }}
      onBlur={e => {
        e.target.style.borderColor = "var(--border)";
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

export default Input;
