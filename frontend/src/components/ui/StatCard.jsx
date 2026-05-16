import Card from './Card';

const StatCard = ({ label, value, sub, icon, accent }) => (
  <Card style={{ flex: 1, minWidth: 180 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ color: accent || "var(--coral)", opacity: 0.8 }}>{icon}</span>
    </div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>{value}</div>
    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: accent || "var(--coral)", marginTop: 6, fontWeight: 600 }}>{sub}</div>}
  </Card>
);

export default StatCard;
