import { getArticleBySlug } from '../../../src/lib/playbookContent';

export default function onBeforeRender(pageContext) {
  const slug = pageContext.routeParams.slug;
  const article = getArticleBySlug(slug);
  return {
    pageContext: {
      pageProps: { article },
      // 404 semantics: if slug doesn't match an article, return a 404 status
      // and noindex it. Vike honors statusCode in the response.
      ...(article ? {} : { statusCode: 404 }),
    },
  };
}
