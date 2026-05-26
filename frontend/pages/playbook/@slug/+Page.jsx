import { usePageContext } from 'vike-react/usePageContext';
import { useConfig } from 'vike-react/useConfig';
import GlobalStyles from '../../../src/styles/GlobalStyles';
import PublicNav from '../../../src/components/PublicNav';
import { marketingNavProps } from '../../../src/lib/vikeNav';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export function rankBySlugSimilarity(attemptedSlug, articles) {
  if (!articles || articles.length === 0) return [];
  if (!attemptedSlug) return articles;
  const target = new Set(attemptedSlug.toLowerCase().split(/[-/_]+/).filter(Boolean));
  return [...articles]
    .map((a) => {
      const tokens = new Set(a.slug.toLowerCase().split(/[-/_]+/).filter(Boolean));
      let overlap = 0;
      for (const t of target) if (tokens.has(t)) overlap += 1;
      return { article: a, score: overlap };
    })
    .sort((x, y) => y.score - x.score)
    .map((x) => x.article);
}

export default function PlaybookArticle() {
  const { pageProps } = usePageContext();
  const article = pageProps?.article;
  const navProps = marketingNavProps('playbook');

  // Override the inherited /playbook hub title + description with the
  // per-article values. useConfig() is vike-react's documented mechanism
  // for setting head config dynamically from a component — its output
  // replaces (not duplicates) the static +config.js values. Absolute URL
  // required for og:image per OG protocol.
  const setConfig = useConfig();
  if (article) {
    setConfig({
      title: `${article.title} — Hyrly`,
      description: article.dek,
      image: `${SITE}/api/og/playbook/${article.slug}`,
    });
  }

  if (!article) {
    const attemptedSlug = pageProps?.attemptedSlug || '';
    const allArticles = pageProps?.allArticles || [];
    const ranked = rankBySlugSimilarity(attemptedSlug, allArticles);
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        <GlobalStyles />
        <PublicNav {...navProps} />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
            color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.02em',
          }}>Article not found</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 16, lineHeight: 1.6 }}>
            We don't have a playbook entry at <code style={{
              background: 'rgba(13,13,15,0.06)', padding: '2px 8px', borderRadius: 6,
              fontSize: 14, color: 'var(--ink)',
            }}>/playbook/{attemptedSlug || 'this slug'}</code>{' '}— either the link is stale or the article hasn't been written yet.
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 16, lineHeight: 1.6 }}>
            Here are the entries we do have:
          </p>

          {ranked.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {ranked.map((a, i) => (
                <a
                  key={a.slug}
                  href={`/playbook/${a.slug}`}
                  style={{
                    display: 'block', textDecoration: 'none', color: 'inherit',
                    background: 'white', borderRadius: 12, padding: '18px 22px',
                    border: i === 0 && attemptedSlug
                      ? '2px solid var(--coral)'
                      : '1px solid var(--border)',
                  }}
                >
                  {i === 0 && attemptedSlug && (
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: 'var(--coral)',
                      letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6,
                    }}>Closest match</div>
                  )}
                  <h2 style={{
                    fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700,
                    color: 'var(--ink)', margin: 0, marginBottom: 6, lineHeight: 1.3,
                  }}>{a.title}</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {a.dek}
                  </p>
                </a>
              ))}
            </div>
          )}

          <div style={{
            borderTop: '1px solid var(--border)', paddingTop: 24, marginTop: 8,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Not seeing what you needed? Tell Scout in your own words.
            </p>
            <a href="/" style={{
              display: 'inline-block', background: 'var(--ink)', color: 'white',
              padding: '12px 24px', borderRadius: 12, textDecoration: 'none',
              fontSize: 15, fontWeight: 700,
            }}>Start the Hyrly Triage →</a>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
              3 minutes. No signup. Free.
            </p>
          </div>
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
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            By{' '}
            <a
              href="/about"
              style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
            >Sreekanth Payyavula</a>
            {' · '}{article.eta_min} min read · published {article.published_at}
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
