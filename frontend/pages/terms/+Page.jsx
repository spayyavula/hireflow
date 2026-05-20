import StaticContentPage from '../../src/pages/static/StaticContentPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function TermsPage() {
  return (
    <StaticContentPage
      {...marketingNavProps('terms')}
      title="Terms"
      subtitle="Clear expectations for using Hyrly responsibly."
      sections={[
        { heading: 'Using the platform', body: 'Use Hyrly for legitimate hiring and job search activity only. Keep profile details accurate, and do not submit misleading credentials, fake job postings, or automated spam applications.' },
        { heading: 'Accounts and access', body: 'You are responsible for securing your account and any activity under it. If you suspect unauthorized access, contact support immediately and rotate credentials.' },
        { heading: 'Service limits', body: 'Features may evolve during beta. We may rate-limit abusive traffic or suspend accounts violating fair-use, security, or legal standards.' },
      ]}
    />
  );
}
