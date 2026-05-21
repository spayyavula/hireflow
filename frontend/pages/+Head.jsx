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
        description: 'The AI career coach for engineers in their first 90 days after a tech layoff.',
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
      {/* og:image + twitter:image come from vike-react's `image` config
          (set site-wide in pages/+config.js, overridden per page via
          useConfig or per-page +config.js). Don't add JSX <meta> tags here
          or they'll duplicate the config-emitted ones and crawlers will
          honor whichever appears first — usually the wrong one. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
    </>
  );
}
