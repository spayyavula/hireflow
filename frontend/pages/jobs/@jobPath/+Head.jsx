import { usePageContext } from 'vike-react/usePageContext';
import { useConfig } from 'vike-react/useConfig';
import { jobPosting, breadcrumbList } from '../../../src/schema/jsonld';
import { jobUrlPath } from '../../../src/lib/jobUrl';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

export default function Head() {
  const { data } = usePageContext();
  const job = data?.job;
  const setConfig = useConfig();
  if (!job) {
    return <meta name="robots" content="noindex,follow" />;
  }
  // og:image + twitter:image via useConfig — replaces (not duplicates)
  // the site-wide image default from pages/+config.js. og:title is also
  // set via useConfig.title elsewhere when needed; here we keep og:title
  // as a JSX <meta> only because it carries the "at COMPANY" suffix not
  // present in the page <title>.
  setConfig({
    image: `${SITE}/api/og/job/${job.id}`,
  });
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
