import StaticRoadmap from '../../src/pages/marketing/StaticRoadmap';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function Roadmap() {
  return <StaticRoadmap {...marketingNavProps('roadmap')} />;
}
