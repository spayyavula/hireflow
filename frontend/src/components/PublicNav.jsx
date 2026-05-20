import { getPathFromPage } from '../lib/routing';
import Icons from './ui/Icons';

const PublicNav = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const navPage = currentPage === "ideas" ? "roadmap" : currentPage;
  const navLinks = [
    { key: "features", label: "Features" },
    { key: "pricing", label: "Pricing" },
    { key: "about", label: "About" },
    { key: "roadmap", label: "Roadmap" },
    { key: "blog", label: "Blog" },
  ];

  return (
    <header style={{
      padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, background: "rgba(250,248,245,0.85)", backdropFilter: "blur(12px)",
      zIndex: 100, borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <a
          href={getPathFromPage("home")}
          onClick={(e) => { e.preventDefault(); onNavigate("home"); }}
          style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink)", cursor: "pointer", textDecoration: "none" }}
        >
          <span aria-hidden="true" style={{ display: "flex" }}>{Icons.logo}</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Hyrly</span>
        </a>
        <nav style={{ display: "flex", gap: 8 }}>
          {navLinks.map(link => (
            <a
              key={link.key}
              href={getPathFromPage(link.key)}
              onClick={(e) => { e.preventDefault(); onNavigate(link.key); }}
              style={{
              padding: "8px 16px", borderRadius: 8, border: "none", background: "transparent",
              fontSize: 14, fontWeight: 600, cursor: "pointer", color: navPage === link.key ? "var(--coral)" : "var(--text-secondary)",
              fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease", position: "relative",
              borderBottom: navPage === link.key ? "2px solid var(--coral)" : "2px solid transparent",
              textDecoration: "none",
            }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <a href="/app?mode=login" style={{
          padding: "10px 24px", borderRadius: 10, border: "1.5px solid var(--border-strong)",
          background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer",
          color: "var(--text-primary)", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
          textDecoration: "none", display: "inline-block",
        }}>Sign In</a>
        <a href="/app?mode=register" style={{
          padding: "10px 24px", borderRadius: 10, border: "none",
          background: "var(--coral)", color: "white", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
          textDecoration: "none", display: "inline-block",
        }}>Get Started</a>
      </div>
    </header>
  );
};

export default PublicNav;
