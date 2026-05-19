import FeaturesPage from '../../src/pages/marketing/FeaturesPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function Features() {
  return <FeaturesPage {...marketingNavProps('features')} />;
}
