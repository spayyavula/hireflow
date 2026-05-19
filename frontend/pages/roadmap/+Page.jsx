import IdeasBoard from '../../src/pages/marketing/IdeasBoard';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function Roadmap() {
  return <IdeasBoard {...marketingNavProps('roadmap')} user={null} />;
}
