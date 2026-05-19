import BlogListPage from '../../src/pages/blog/BlogListPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function BlogPage() {
  return <BlogListPage {...marketingNavProps('blog')} />;
}
