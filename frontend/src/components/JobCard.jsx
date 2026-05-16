import Card from './ui/Card';
import MatchScore from './ui/MatchScore';
import Tag from './ui/Tag';
import Button from './ui/Button';
import Icons from './ui/Icons';

const JobCard = ({ job, profile, onApply, applied, onSave, saved }) => {
  const reqSkills = job.requiredSkills || [];
  const matchingSkills = reqSkills.filter(s => (profile.skills || []).map(sk => sk.toLowerCase()).includes(s.toLowerCase()));
  const isExternal = ["jsearch", "jobs_api", "linkedin", "indeed", "jobs_search"].includes(job.source);

  return (
    <Card hover style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 20 }}>
        <MatchScore score={job.match} size="lg" />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{job.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{job.company}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{Icons.mapPin} {job.location}</span>
                {job.salary && <span style={{ color: "var(--coral)", fontWeight: 600 }}>{job.salary}</span>}
              </div>
            </div>
            <button onClick={onSave} style={{ background: "none", border: "none", cursor: "pointer", color: saved ? "var(--coral)" : "var(--text-muted)", padding: 8 }}>
              {Icons.heart}
            </button>
          </div>

          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>{job.desc}</p>

          {reqSkills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {reqSkills.map(s => (
                <Tag key={s} variant={matchingSkills.map(m => m.toLowerCase()).includes(s.toLowerCase()) ? "coral" : "outline"}>
                  {matchingSkills.map(m => m.toLowerCase()).includes(s.toLowerCase()) && <span>{Icons.check}</span>} {s}
                </Tag>
              ))}
            </div>
          )}

          {job.matchReasons && job.matchReasons.length > 0 && (
            <div style={{ fontSize: 13, color: "var(--sage)", marginBottom: 8 }}>
              {job.matchReasons[0]}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {reqSkills.length > 0 ? `${matchingSkills.length}/${reqSkills.length} skills match` : ""}
              {job.posted ? ` · ${job.posted}` : ""}
              {isExternal && <span style={{ marginLeft: 6, color: "var(--sage)" }}>via JSearch</span>}
            </div>
            {isExternal && job.applyLink ? (
              <Button size="sm" variant="coral" onClick={onApply}>
                Apply {Icons.arrow}
              </Button>
            ) : (
              <Button size="sm" variant={applied ? "outline" : "coral"} onClick={onApply} disabled={applied}>
                {applied ? <>{Icons.check} Applied</> : <>Apply {Icons.arrow}</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default JobCard;
