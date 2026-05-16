const Avatar = ({ initials, size = 40, color }) => {
  const colors = ["#ff6b5b", "#7eb89e", "#9b8fd4", "#d4a853", "#5b9bd4"];
  const bg = color || colors[initials.charCodeAt(0) % colors.length];

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: `${bg}15`,
      border: `2px solid ${bg}30`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.38,
      fontWeight: 700,
      color: bg,
      flexShrink: 0,
      fontFamily: "'Playfair Display', serif",
    }}>
      {initials}
    </div>
  );
};

export default Avatar;
