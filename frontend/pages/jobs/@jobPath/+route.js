import { jobIdFromPath } from '../../../src/lib/jobUrl';

// Claim /jobs/<x> only when <x> ends in a job_<id> token. Hub URLs
// (/jobs/react, /jobs/remote, ...) fall through to pages/jobs-hub.
export default (pageContext) => {
  const m = pageContext.urlPathname.match(/^\/jobs\/([^/]+)\/?$/);
  if (!m) return false;
  if (!jobIdFromPath(m[1])) return false;
  return { routeParams: { jobPath: m[1] } };
};
