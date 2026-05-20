import { usePageContext } from 'vike-react/usePageContext';
import GlobalStyles from '../../../src/styles/GlobalStyles';
import PublicNav from '../../../src/components/PublicNav';
import { marketingNavProps } from '../../../src/lib/vikeNav';

export default function PlaybookArticle() {
  const { pageProps } = usePageContext();
  const article = pageProps?.article;
  const navProps = marketingNavProps('playbook');

  if (!article) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        <GlobalStyles />
        <PublicNav {...navProps} />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
            color: 'var(--ink)', marginBottom: 16,
          }}>Article not found</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            That playbook entry doesn't exist (yet). <a href="/playbook" style={{ color: 'var(--coral)', fontWeight: 600 }}>Back to the playbook</a>.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...navProps} />

      <article style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 32px' }}>
        <header style={{ marginBottom: 32 }}>
          <a href="/playbook" style={{
            fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
            display: 'inline-block', marginBottom: 16,
          }}>← The Playbook</a>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700,
            color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 12,
          }}>{article.title}</h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 12 }}>
            {article.dek}
          </p>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {article.eta_min} min read · published {article.published_at}
            {article.updated_at && article.updated_at !== article.published_at
              ? ` · last updated ${article.updated_at}` : ''}
          </div>
        </header>

        <div
          className="playbook-prose"
          style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.75 }}
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      </article>

      <footer style={{
        maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px',
        textAlign: 'center', borderTop: '1px solid var(--border)', marginTop: 32,
      }}>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Want this article's priorities applied to your specific situation?
        </p>
        <a href="/" style={{
          display: 'inline-block', background: 'var(--ink)', color: 'white',
          padding: '14px 28px', borderRadius: 12, textDecoration: 'none',
          fontSize: 15, fontWeight: 700,
        }}>Start the Hyrly Triage →</a>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          3 minutes. No signup. Free.
        </p>
      </footer>
    </div>
  );
}
