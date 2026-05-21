import { FAQS } from './content';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function LaidOffH1BHead() {
  const url = `${SITE}/laid-off-h1b`;
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: 'Laid off on H-1B? Your 60-day grace period — Hyrly',
        description:
          'Decision points and free Scout AI guidance for engineers on H-1B in their 60-day grace period after a US tech layoff.',
        isPartOf: { '@id': `${SITE}/#website` },
        about: {
          '@type': 'Thing',
          name: 'H-1B 60-day grace period after a US tech layoff',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
  return (
    <>
      <link rel="canonical" href={url} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
    </>
  );
}
