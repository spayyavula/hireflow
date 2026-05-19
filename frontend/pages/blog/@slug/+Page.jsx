import { usePageContext } from 'vike-react/usePageContext';
import BlogPostPage from '../../../src/pages/blog/BlogPostPage';
import { marketingNavProps } from '../../../src/lib/vikeNav';

export default function BlogSlugPage() {
  const { routeParams } = usePageContext();
  return <BlogPostPage slug={routeParams.slug} {...marketingNavProps('blog')} />;
}
