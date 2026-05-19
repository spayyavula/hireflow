import { jobIdFromPath } from '../../../src/lib/jobUrl';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Runs on the server during SSR. Returns { job } or { job: null } for not-found.
export async function data(pageContext) {
  const jobId = jobIdFromPath(pageContext.routeParams.jobPath);
  if (!jobId) return { job: null };

  try {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
    if (!res.ok) return { job: null };
    return { job: await res.json() };
  } catch {
    // Backend unavailable at render time — degrade gracefully, never 500.
    return { job: null, unavailable: true };
  }
}
