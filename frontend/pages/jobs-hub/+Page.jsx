import { usePageContext } from 'vike-react/usePageContext';
import GlobalStyles from '../../src/styles/GlobalStyles';
import PublicNav from '../../src/components/PublicNav';
import Card from '../../src/components/ui/Card';
import { marketingNavProps } from '../../src/lib/vikeNav';
import { hubLabel, hubUrlPath } from '../../src/lib/hubRoute';
import { jobUrlPath } from '../../src/lib/jobUrl';

export default function HubPage() {
  const { data } = usePageContext();
  const nav = marketingNavProps('home');
  const descriptor = data?.descriptor;

  if (!descriptor) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        <GlobalStyles />
        <PublicNav {...nav} />
        <section style={{ maxWidth: 940, margin: '0 auto', padding: '64px 48px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: 'var(--ink)' }}>Jobs</h1>
        </section>
      </div>
    );
  }

  const label = hubLabel(descriptor);
  const jobs = data.jobs || [];

  // Sibling hubs: same skill in a couple of other dimensions, for internal linking.
  const siblings = [];
  if (descriptor.skill && !descriptor.remote) {
    siblings.push({ label: `Remote ${label}`, href: hubUrlPath({ ...descriptor, remote: true }) });
  }
  if (descriptor.skill && descriptor.city) {
    siblings.push({ label: hubLabel({ skill: descriptor.skill, city: null, remote: false }), href: hubUrlPath({ skill: descriptor.skill, city: null, remote: false }) });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...nav} />
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '56px 48px 80px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, color: 'var(--ink)', marginBottom: 14 }}>{label}</h1>
        {data.copy && (
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 28, maxWidth: 720 }}>{data.copy}</p>
        )}

        {jobs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No open roles match this search right now. Check back soon.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
            {jobs.map((job) => (
              <a key={job.id} href={jobUrlPath(job)} style={{ textDecoration: 'none' }}>
                <Card style={{ padding: 20 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--ink)' }}>{job.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>
                    {job.company_name} · {job.location}{job.remote ? ' · Remote' : ''}
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )}

        {data.faq && data.faq.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'var(--ink)', marginBottom: 14 }}>Frequently asked</h2>
            {data.faq.map((item) => (
              <div key={item.q} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{item.q}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{item.a}</div>
              </div>
            ))}
          </div>
        )}

        {siblings.length > 0 && (
          <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {siblings.map((s) => (
              <a key={s.href} href={s.href} style={{ color: 'var(--coral)', fontWeight: 700, textDecoration: 'none' }}>{s.label} →</a>
            ))}
          </nav>
        )}
      </section>
    </div>
  );
}
