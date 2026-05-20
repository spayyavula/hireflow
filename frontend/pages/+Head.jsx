const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function HeadDefault() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: 'Hyrly',
        url: `${SITE}/`,
        logo: `${SITE}/logo.png`,
        description: 'AI-powered decision system for job search and hiring.',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: `${SITE}/`,
        name: 'Hyrly',
        publisher: { '@id': `${SITE}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE}/jobs?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
  return (
    <>
      <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      <meta name="theme-color" content="#faf8f5" />
      <link rel="icon" type="image/png" href="/logo.png" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Hyrly" />
      <meta property="og:image" content={`${SITE}/logo.png`} />
      <meta name="twitter:image" content={`${SITE}/logo.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
    </>
  );
}
