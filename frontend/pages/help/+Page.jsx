import StaticContentPage from '../../src/pages/static/StaticContentPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function HelpPage() {
  return (
    <StaticContentPage
      {...marketingNavProps('help')}
      title="Help"
      subtitle="Support resources for Hyrly users — start here or email sreekanth@hyrly.ai."
      sections={[
        { heading: 'Getting started', body: 'Create an account, complete your profile, and select goals so the matching engine and Scout AI can personalize recommendations.' },
        { heading: 'Billing and plans', body: 'Plan changes are available from your account settings. Upgrades apply immediately, while downgrades apply at the next billing cycle.' },
        { heading: 'Need direct support?', body: 'Use in-app chat for account assistance and workflow help. Include screenshots and page URLs when reporting issues for faster resolution.' },
      ]}
    />
  );
}
