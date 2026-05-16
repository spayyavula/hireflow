import Icons from './ui/Icons';

const Sidebar = ({ role, activeTab, setActiveTab, onLogout }) => {
  const roleColors = { seeker: "var(--coral)", recruiter: "var(--sage)", company: "var(--lavender)" };
  const roleLabels = { seeker: "Job Seeker", recruiter: "Recruiter", company: "Company" };

  const navItems = {
    seeker: [
      { key: "home", icon: Icons.briefcase, label: "Job Matches" },
      { key: "scout", icon: Icons.scout, label: "Scout AI", glow: true },
      { key: "interview", icon: Icons.mic, label: "Interview Bot", glow: true },
      { key: "resume", icon: Icons.doc, label: "My Resume" },
      { key: "chat", icon: Icons.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: Icons.chart, label: "Analytics" },
      { key: "matcher", icon: Icons.target, label: "JD Matcher" },
      { key: "ideas", icon: Icons.spark, label: "Ideas Board" },
    ],
    recruiter: [
      { key: "home", icon: Icons.users, label: "Candidates" },
      { key: "scout", icon: Icons.scout, label: "Scout AI", glow: true },
      { key: "pipeline", icon: Icons.target, label: "Pipeline" },
      { key: "chat", icon: Icons.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: Icons.chart, label: "Analytics" },
      { key: "ideas", icon: Icons.spark, label: "Ideas Board" },
    ],
    company: [
      { key: "home", icon: Icons.building, label: "Dashboard" },
      { key: "scout", icon: Icons.scout, label: "Scout AI", glow: true },
      { key: "chat", icon: Icons.chat, label: "Messages", badge: 2 },
      { key: "analytics", icon: Icons.chart, label: "Analytics" },
      { key: "ideas", icon: Icons.spark, label: "Ideas Board" },
    ],
  };

  return (
    <div style={{
      width: 240, height: "100vh", position: "fixed", left: 0, top: 0,
      background: "white", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", padding: "24px 16px", zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 8, color: "var(--ink)" }}>
        {Icons.logo}
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>JobsSearch</span>
      </div>
      <div style={{ padding: "8px", fontSize: 11, color: roleColors[role], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {roleLabels[role]}
      </div>

      <nav style={{ flex: 1, marginTop: 16 }}>
        {(navItems[role] || []).map(item => (
          <div
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            style={{
              padding: "12px 14px", borderRadius: 12, marginBottom: 4, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12,
              background: activeTab === item.key ? "var(--cream)" : "transparent",
              color: activeTab === item.key ? "var(--ink)" : "var(--text-muted)",
              fontWeight: 600, fontSize: 14, transition: "all 0.15s",
            }}
          >
            <span style={{ color: activeTab === item.key ? roleColors[role] : item.glow ? "var(--coral)" : "inherit" }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.glow && activeTab !== item.key && <span style={{ width: 6, height: 6, borderRadius: 3, background: "linear-gradient(135deg, var(--coral), var(--lavender))", marginLeft: "auto", animation: "pulse 2s ease-in-out infinite" }} />}
            {item.badge && (
              <span style={{
                marginLeft: "auto", minWidth: 20, height: 20, borderRadius: 10,
                background: "var(--coral)", color: "white",
                fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{item.badge}</span>
            )}
          </div>
        ))}
      </nav>

      <div
        onClick={onLogout}
        style={{
          padding: "12px 14px", borderRadius: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          color: "var(--text-muted)", fontSize: 14, fontWeight: 600,
          borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 20,
        }}
      >
        {Icons.arrowLeft} Sign Out
      </div>
    </div>
  );
};

export default Sidebar;
