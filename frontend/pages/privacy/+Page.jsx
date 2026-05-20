import StaticContentPage from '../../src/pages/static/StaticContentPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function PrivacyPage() {
  return (
    <StaticContentPage
      {...marketingNavProps('privacy')}
      title="Privacy"
      subtitle="How we handle personal and hiring data."
      sections={[
        { heading: 'Data we collect', body: 'We collect profile, resume, job preferences, and product interaction data to power matching, coaching, and hiring workflows.' },
        { heading: 'How data is used', body: 'Data is used to personalize recommendations, improve platform quality, and support customer operations. We do not sell personal data.' },
        { heading: 'Security controls', body: 'Hyrly uses row-level access controls, encrypted transport, and least-privilege service access to reduce data exposure risk.' },
      ]}
    />
  );
}
