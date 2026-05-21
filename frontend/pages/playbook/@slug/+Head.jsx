import { usePageContext } from 'vike-react/usePageContext';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function PlaybookArticleHead() {
  const { pageProps } = usePageContext();
  const article = pageProps?.article;

  if (!article) {
    return <meta name="robots" content="noindex,follow" />;
  }

  const url = `${SITE}/playbook/${article.slug}`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@id': url },
    headline: article.title,
    description: article.dek,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      '@type': 'Person',
      name: 'Sreekanth Payyavula',
      url: `${SITE}/about`,
    },
    publisher: { '@id': `${SITE}/#organization` },
    image: `${SITE}/api/og/playbook/${article.slug}`,
    keywords: Array.isArray(article.keywords) ? article.keywords.join(', ') : undefined,
  };

  // <title> + <meta name="description"> + og:title + og:description are set
  // via useConfig() in +Page.jsx — vike-react auto-emits all four from its
  // title/description config. We only emit the article-specific extras here.
  return (
    <>
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      <meta property="article:author" content="Sreekanth Payyavula" />
      <meta property="article:published_time" content={article.published_at} />
      {article.updated_at && article.updated_at !== article.published_at && (
        <meta property="article:modified_time" content={article.updated_at} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
