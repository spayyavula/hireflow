import { hubLabel } from '../../src/lib/hubRoute';

export default (pageContext) => {
  const descriptor = pageContext.data?.descriptor;
  return descriptor
    ? `${hubLabel(descriptor)} | Hyrly`
    : 'Jobs | Hyrly';
};
