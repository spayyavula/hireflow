import LandingPage from '../../src/pages/marketing/LandingPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function HomePage() {
  return <LandingPage {...marketingNavProps('home')} />;
}
