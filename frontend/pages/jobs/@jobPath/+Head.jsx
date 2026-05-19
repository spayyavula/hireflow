import { usePageContext } from 'vike-react/usePageContext';
import { jobPosting, breadcrumbList } from '../../../src/schema/jsonld';
import { jobUrlPath } from '../../../src/lib/jobUrl';

export default function Head() {
  const { data } = usePageContext();
  const job = data?.job;
  if (!job) {
    return <meta name="robots" content="noindex,follow" />;
  }
  const canonical = `https://jobssearch.work${jobUrlPath(job)}`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      jobPosting(job),
      breadcrumbList([
        { name: 'Home', url: 'https://jobssearch.work/' },
        { name: 'Jobs', url: 'https://jobssearch.work/jobs' },
        { name: job.title, url: canonical },
      ]),
    ],
  };
  return (
    <>
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={`${job.title} at ${job.company_name}`} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={`https://jobssearch.work/api/og/job/${job.id}`} />
      <meta name="twitter:image" content={`https://jobssearch.work/api/og/job/${job.id}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
