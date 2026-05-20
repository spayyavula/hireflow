import { usePageContext } from 'vike-react/usePageContext';
import { jobPosting, breadcrumbList } from '../../../src/schema/jsonld';
import { jobUrlPath } from '../../../src/lib/jobUrl';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function Head() {
  const { data } = usePageContext();
  const job = data?.job;
  if (!job) {
    return <meta name="robots" content="noindex,follow" />;
  }
  const canonical = `${SITE}${jobUrlPath(job)}`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      jobPosting(job),
      breadcrumbList([
        { name: 'Home', url: `${SITE}/` },
        { name: 'Jobs', url: `${SITE}/jobs` },
        { name: job.title, url: canonical },
      ]),
    ],
  };
  return (
    <>
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={`${job.title} at ${job.company_name}`} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={`${SITE}/api/og/job/${job.id}`} />
      <meta name="twitter:image" content={`${SITE}/api/og/job/${job.id}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
