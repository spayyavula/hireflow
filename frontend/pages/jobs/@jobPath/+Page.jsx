import { usePageContext } from 'vike-react/usePageContext';
import GlobalStyles from '../../../src/styles/GlobalStyles';
import PublicNav from '../../../src/components/PublicNav';
import Tag from '../../../src/components/ui/Tag';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { marketingNavProps } from '../../../src/lib/vikeNav';

export default function JobPage() {
  const { data } = usePageContext();
  const job = data?.job;
  const nav = marketingNavProps('home');

  if (!job) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        <GlobalStyles />
        <PublicNav {...nav} />
        <section style={{ maxWidth: 940, margin: '0 auto', padding: '64px 48px 80px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: 'var(--ink)', marginBottom: 12 }}>
            This role is no longer available
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            {data?.unavailable
              ? 'We could not load this role right now. Please try again shortly.'
              : 'The role you are looking for has closed or moved.'}
          </p>
          <Button variant="coral" size="lg" onClick={() => nav.onNavigate('home')}>Browse open roles</Button>
        </section>
      </div>
    );
  }

  const isClosed = job.status !== 'active';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...nav} />
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '64px 48px 80px' }}>
        <article style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 30 }}>
          {isClosed && (
            <div style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', fontWeight: 700 }}>
              This role has closed — explore similar open roles below.
            </div>
          )}
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, lineHeight: 1.1, color: 'var(--ink)', marginBottom: 8 }}>{job.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, marginBottom: 22 }}>{job.company_name} · {job.location}</p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.75, marginBottom: 22 }}>{job.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
            <Card style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Salary</div>
              <div style={{ fontWeight: 700 }}>{job.salary_display || 'Not disclosed'}</div>
            </Card>
            <Card style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Work type</div>
              <div style={{ fontWeight: 700 }}>{job.remote ? 'Remote-friendly' : 'On-site'}</div>
            </Card>
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 10, color: 'var(--ink)' }}>Required skills</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
            {(job.required_skills || []).map((s) => <Tag key={s} variant="coral" size="lg">{s}</Tag>)}
          </div>

          {!isClosed && (
            <Button variant="coral" size="lg" onClick={nav.onGetStarted}>Create free account to apply</Button>
          )}
        </article>
      </section>
    </div>
  );
}
