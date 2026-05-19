import { parseHubPath, hubLabel } from '../../src/lib/hubRoute';

export default (pageContext) => {
  const descriptor = parseHubPath(pageContext.routeParams.hubPath);
  return descriptor
    ? `${hubLabel(descriptor)} | JobsSearch`
    : 'Jobs | JobsSearch';
};
