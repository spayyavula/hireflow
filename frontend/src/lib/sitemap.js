import { toSlug } from './slug';

const HUB_THRESHOLD = 5;

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function urlsetXml(entries) {
  const body = entries
    .map((e) => `  <url><loc>${escapeXml(e.loc)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function sitemapIndexXml(sitemapUrls) {
  const body = sitemapUrls
    .map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc></sitemap>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

// Derives the indexable hub URL paths from a list of active jobs:
// any skill / city / remote dimension with >= HUB_THRESHOLD matching jobs.
export function deriveHubEntries(jobs) {
  const skillCounts = new Map();
  const cityCounts = new Map();
  let remoteCount = 0;

  for (const job of jobs) {
    const skills = new Set(
      [...(job.required_skills || []), ...(job.nice_skills || [])].map((s) => toSlug(String(s))),
    );
    for (const s of skills) {
      if (s) skillCounts.set(s, (skillCounts.get(s) || 0) + 1);
    }
    const city = toSlug(job.location || '');
    if (city) cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    if (job.remote) remoteCount += 1;
  }

  const paths = [];
  if (remoteCount >= HUB_THRESHOLD) paths.push('/jobs/remote');
  for (const [skill, n] of skillCounts) {
    if (n >= HUB_THRESHOLD) paths.push(`/jobs/${skill}`);
  }
  for (const [city, n] of cityCounts) {
    if (n >= HUB_THRESHOLD) paths.push(`/jobs/location/${city}`);
  }
  return paths;
}
