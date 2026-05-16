const Card = ({ children, style, hover, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "white",
      borderRadius: 20,
      border: "1px solid var(--border)",
      padding: 24,
      transition: "all 0.25s ease",
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
    onMouseEnter={e => {
      if (hover) {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 20px 40px rgba(13, 13, 15, 0.08)";
      }
    }}
    onMouseLeave={e => {
      if (hover) {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }
    }}
  >
    {children}
  </div>
);

export default Card;
