import GlobalStyles from '../../src/styles/GlobalStyles';
import PublicNav from '../../src/components/PublicNav';
import { marketingNavProps } from '../../src/lib/vikeNav';
import { getArticles } from '../../src/lib/playbookContent';

export default function PlaybookHub() {
  const navProps = marketingNavProps('playbook');
  const articles = getArticles();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...navProps} />

      <header style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 32px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.15,
        }}>The Hyrly Playbook</h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Hand-written guides on what to actually do after a tech layoff.
          No fluff, no urgency tactics, no "transform your career" copy.
        </p>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 64px' }}>
        {articles.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            More articles coming soon.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {articles.map((a) => (
              <a
                key={a.slug}
                href={`/playbook/${a.slug}`}
                style={{
                  display: 'block', textDecoration: 'none', color: 'inherit',
                  background: 'white', borderRadius: 16, padding: '24px 28px',
                  border: '1px solid var(--border)',
                  transition: 'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--coral)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h2 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
                  color: 'var(--ink)', margin: 0, marginBottom: 8, lineHeight: 1.3,
                }}>{a.title}</h2>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 12px' }}>
                  {a.dek}
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {a.eta_min} min read · {a.published_at}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <footer style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Want your priorities ranked in 3 minutes?
        </p>
        <a href="/" style={{
          display: 'inline-block', background: 'var(--ink)', color: 'white',
          padding: '14px 28px', borderRadius: 12, textDecoration: 'none',
          fontSize: 15, fontWeight: 700,
        }}>Start the Hyrly Triage →</a>
      </footer>
    </div>
  );
}
