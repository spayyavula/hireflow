import { getArticles } from '../../src/lib/playbookContent';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function PlaybookHubHead() {
  const articles = getArticles();
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE}/playbook#collection`,
    url: `${SITE}/playbook`,
    name: 'The Hyrly Playbook',
    description:
      'Hand-written guides on what to actually do after a tech layoff. ' +
      'H-1B, severance, health insurance, LinkedIn protocol, week-1 priorities.',
    isPartOf: { '@id': `${SITE}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}/playbook/${a.slug}`,
        name: a.title,
      })),
    },
  };
  return (
    <>
      <link rel="canonical" href={`${SITE}/playbook`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
