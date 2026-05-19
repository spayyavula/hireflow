import AboutPage from '../../src/pages/marketing/AboutPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function About() {
  return <AboutPage {...marketingNavProps('about')} />;
}
