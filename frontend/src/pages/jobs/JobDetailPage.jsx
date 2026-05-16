import GlobalStyles from '../../styles/GlobalStyles';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Tag from '../../components/ui/Tag';
import PublicNav from '../../components/PublicNav';
import ComingSoonPage from '../static/ComingSoonPage';
import { getJobPostingBySlug } from '../../data/mockData';

const JobDetailPage = ({ slug, onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const job = getJobPostingBySlug(slug);

  if (!job) {
    return (
      <ComingSoonPage
        onGetStarted={onGetStarted}
        onSignIn={onSignIn}
        onNavigate={onNavigate}
        currentPage="coming-soon"
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      <section style={{ maxWidth: 940, margin: "0 auto", padding: "64px 48px 80px" }}>
        <button onClick={() => onNavigate("home")} style={{
          border: "none", background: "transparent", color: "var(--coral)", cursor: "pointer",
          fontWeight: 700, marginBottom: 20, fontSize: 14, fontFamily: "'Source Sans 3', sans-serif",
        }}>&larr; Back to featured opportunities</button>

        <article style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", padding: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, lineHeight: 1.1, letterSpacing: "-0.03em", color: "var(--ink)", marginBottom: 8 }}>{job.title}</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 17 }}>{job.company} · {job.location}</p>
            </div>
            <div style={{ alignSelf: "flex-start", padding: "8px 14px", borderRadius: 10, background: "rgba(255,107,91,0.08)", color: "var(--coral)", fontWeight: 700 }}>
              {job.match}% match
            </div>
          </div>

          <p style={{ color: "var(--text-primary)", lineHeight: 1.75, marginBottom: 22 }}>{job.description}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, marginBottom: 24 }}>
            <Card style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Salary</div>
              <div style={{ fontWeight: 700 }}>{job.salary}</div>
            </Card>
            <Card style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Work type</div>
              <div style={{ fontWeight: 700 }}>{job.remote ? "Remote-friendly" : "On-site"}</div>
            </Card>
          </div>

          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 10, color: "var(--ink)" }}>Required skills</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {job.requiredSkills.map((skill) => <Tag key={skill} variant="coral" size="lg">{skill}</Tag>)}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 10, color: "var(--ink)" }}>Nice to have</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {job.niceSkills.map((skill) => <Tag key={skill} variant="outline" size="lg">{skill}</Tag>)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="coral" size="lg" onClick={onGetStarted}>Create free account to apply</Button>
            <Button variant="outline" size="lg" onClick={() => onNavigate("features")}>See platform features</Button>
          </div>
        </article>
      </section>
    </div>
  );
};

export default JobDetailPage;
