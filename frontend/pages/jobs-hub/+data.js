import { parseHubPath, hubSlug, jobMatchesHub } from '../../src/lib/hubRoute';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const INDEXABLE_THRESHOLD = 5;

// Runs on the server during SSR. Fetches matching jobs; only when the hub
// clears the indexability threshold does it fetch (cost-bounded) AI copy.
export async function data(pageContext) {
  const descriptor = parseHubPath(pageContext.routeParams.hubPath);
  if (!descriptor) return { descriptor: null };

  let jobs = [];
  try {
    const res = await fetch(`${API_BASE}/api/jobs?limit=100`);
    if (res.ok) {
      const all = await res.json();
      jobs = (Array.isArray(all) ? all : []).filter((j) => jobMatchesHub(j, descriptor));
    }
  } catch {
    jobs = [];
  }

  const indexable = jobs.length >= INDEXABLE_THRESHOLD;

  let copy = '';
  let faq = [];
  if (indexable) {
    try {
      const res = await fetch(`${API_BASE}/api/seo/hub/${hubSlug(descriptor)}`);
      if (res.ok) {
        const body = await res.json();
        copy = body.copy || '';
        faq = body.faq || [];
      }
    } catch {
      // Non-fatal — the hub still renders with listings, just no AI copy.
    }
  }

  return { descriptor, jobs, indexable, copy, faq };
}
