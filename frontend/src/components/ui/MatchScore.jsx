const MatchScore = ({ score, size = "md" }) => {
  const color = score >= 90 ? "var(--coral)" : score >= 75 ? "var(--sage)" : score >= 60 ? "var(--gold)" : "var(--text-muted)";
  const sz = size === "lg" ? { w: 56, h: 56, fs: 18, stroke: 4 } : { w: 40, h: 40, fs: 13, stroke: 3 };
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: "relative", width: sz.w, height: sz.h }}>
      <svg width={sz.w} height={sz.h} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={sz.w/2} cy={sz.h/2} r="16" fill="none" stroke="var(--cream-dark)" strokeWidth={sz.stroke} />
        <circle cx={sz.w/2} cy={sz.h/2} r="16" fill="none" stroke={color} strokeWidth={sz.stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz.fs, fontWeight: 700, color }}>{score}</span>
    </div>
  );
};

export default MatchScore;
