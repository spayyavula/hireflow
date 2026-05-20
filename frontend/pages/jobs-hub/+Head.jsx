import { usePageContext } from 'vike-react/usePageContext';
import { itemList, faqPage, breadcrumbList } from '../../src/schema/jsonld';
import { hubUrlPath, hubLabel } from '../../src/lib/hubRoute';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function Head() {
  const { data } = usePageContext();
  const descriptor = data?.descriptor;
  if (!descriptor) {
    return <meta name="robots" content="noindex,follow" />;
  }
  const canonical = `${SITE}${hubUrlPath(descriptor)}`;
  const label = hubLabel(descriptor);

  // Below the indexability threshold: render but keep it out of the index.
  if (!data.indexable) {
    return (
      <>
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="noindex,follow" />
      </>
    );
  }

  const graph = [
    breadcrumbList([
      { name: 'Home', url: `${SITE}/` },
      { name: 'Jobs', url: `${SITE}/jobs` },
      { name: label, url: canonical },
    ]),
    itemList(data.jobs),
  ];
  if (data.faq && data.faq.length > 0) {
    graph.push(faqPage(data.faq));
  }
  const ld = { '@context': 'https://schema.org', '@graph': graph };

  return (
    <>
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={`${label} | Hyrly`} />
      <meta property="og:url" content={canonical} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
