export default function HeadDefault() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://jobssearch.work/#organization',
        name: 'JobsSearch',
        url: 'https://jobssearch.work/',
        logo: 'https://jobssearch.work/favicon.svg',
        description: 'AI-powered decision system for job search and hiring.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://jobssearch.work/#website',
        url: 'https://jobssearch.work/',
        name: 'JobsSearch',
        publisher: { '@id': 'https://jobssearch.work/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://jobssearch.work/jobs?search={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
  return (
    <>
      <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      <meta name="theme-color" content="#faf8f5" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="JobsSearch" />
      <meta property="og:image" content="https://jobssearch.work/og-image.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
    </>
  );
}
