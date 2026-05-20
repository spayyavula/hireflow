const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function HomeHead() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE}/#webpage-home`,
    url: `${SITE}/`,
    name: 'Hyrly — Layoff Triage + AI Career Coach',
    description:
      'Free 10-question Layoff Triage that ranks your week-1 priorities, ' +
      'with a hand-off to Scout AI for ongoing career coaching.',
    isPartOf: { '@id': `${SITE}/#website` },
    about: {
      '@type': 'Thing',
      name: 'Layoff response and career coaching for US tech engineers',
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
