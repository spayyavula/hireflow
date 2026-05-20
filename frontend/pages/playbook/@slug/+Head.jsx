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
    author: { '@type': 'Organization', name: 'Hyrly', '@id': `${SITE}/#organization` },
    publisher: { '@id': `${SITE}/#organization` },
    image: `${SITE}/api/og/home`,
    keywords: Array.isArray(article.keywords) ? article.keywords.join(', ') : undefined,
  };

  return (
    <>
      <link rel="canonical" href={url} />
      <meta property="og:title" content={article.title} />
      <meta property="og:description" content={article.dek} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
