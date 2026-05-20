import { toSlug } from '../../../lib/slug';
import { getPathFromPage } from '../../../lib/routing';

export function LandingFeaturedJobs({ featuredJobs, onNavigate }) {
  return (
    <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12,
        }}>Featured opportunities</h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 12px" }}>
          Top roles from companies using Hyrly right now
        </p>
        <span style={{
          display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: "rgba(126,184,158,0.12)", color: "var(--sage)", border: "1px solid rgba(126,184,158,0.25)",
        }}>Demo preview — sample data</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {featuredJobs.map((job, i) => (
          <a
            key={job.id}
            href={getPathFromPage(`job-post:${toSlug(job.title)}`)}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(`job-post:${toSlug(job.title)}`);
            }}
            className={`animate-in-delay-${i + 1}`}
            style={{
            background: "white", borderRadius: 20, padding: 24,
            border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(13,13,15,0.04)",
            transition: "transform 0.25s ease, box-shadow 0.25s ease", cursor: "pointer", textDecoration: "none",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,13,15,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,13,15,0.04)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: "var(--ink)", color: "var(--cream)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700,
              }}>
                {job.company.slice(0, 2).toUpperCase()}
              </div>
              <div style={{
                padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: "rgba(255,107,91,0.08)", color: "var(--coral)",
              }}>
                {job.match}% match
              </div>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{job.title}</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>{job.company} · {job.location}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {job.tags.map(tag => (
                <span key={tag} style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                  background: "var(--cream)", color: "var(--text-secondary)",
                }}>{tag}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
