import { toSlug } from './slug';

// Backend job ids look like job_<hex>. A job URL is /jobs/<title-slug>-<id>.
const JOB_ID_RE = /(job_[a-z0-9]+)$/i;

export function jobUrlPath(job) {
  return `/jobs/${toSlug(job.title)}-${job.id}`;
}

export function jobIdFromPath(jobPath) {
  const match = String(jobPath).match(JOB_ID_RE);
  return match ? match[1] : null;
}
