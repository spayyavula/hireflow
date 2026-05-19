import PricingPage from '../../src/pages/marketing/PricingPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function Pricing() {
  return <PricingPage {...marketingNavProps('pricing')} />;
}
