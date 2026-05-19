import { parseHubPath } from '../../src/lib/hubRoute';

// Claim /jobs/<tail> when <tail> parses as a valid hub descriptor.
export default (pageContext) => {
  const m = pageContext.urlPathname.match(/^\/jobs\/(.+?)\/?$/);
  if (!m) return false;
  const descriptor = parseHubPath(m[1]);
  if (!descriptor) return false;
  return { routeParams: { hubPath: m[1] } };
};
