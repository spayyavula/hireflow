import { writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { urlsetXml, sitemapIndexXml, deriveHubEntries } from '../src/lib/sitemap.js';

const SITE = process.env.VITE_SITE_URL || 'https://hyrly.ai';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDirs = [
  path.resolve(__dirname, '..', 'dist', 'client'),
  path.resolve(__dirname, '..', '.vercel', 'output', 'static'),
];
const apiBase = (process.env.VITE_API_URL || '').replace(/\/$/, '');

const STATIC_ROUTES = [
  '/', '/features', '/pricing', '/about', '/roadmap',
  '/terms', '/privacy', '/help', '/blog',
];

async function readPlaybookSlugs() {
  const dir = path.resolve(__dirname, '..', 'content', 'playbook');
  try {
    const files = await readdir(dir);
    return files
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function jobUrl(job) {
  const slug = String(job.title || '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `/jobs/${slug}-${job.id}`;
}

async function main() {
  // The backend caps /api/jobs `limit` at 100 (Query le=100); a larger value
  // returns 422, which fetchJson swallows to [] — leaving the sitemap empty.
  const jobs = apiBase ? await fetchJson(`${apiBase}/api/jobs?limit=100`) : [];
  const posts = apiBase ? await fetchJson(`${apiBase}/api/blog`) : [];
  const playbookSlugs = await readPlaybookSlugs();

  const files = {
    'sitemap-static.xml': urlsetXml(STATIC_ROUTES.map((r) => ({ loc: `${SITE}${r}` }))),
    'sitemap-blog.xml': urlsetXml(
      posts.filter((p) => p.slug).map((p) => ({ loc: `${SITE}/blog/${p.slug}` })),
    ),
    'sitemap-jobs.xml': urlsetXml(jobs.map((j) => ({ loc: `${SITE}${jobUrl(j)}` }))),
    'sitemap-hubs.xml': urlsetXml(
      deriveHubEntries(jobs).map((p) => ({ loc: `${SITE}${p}` })),
    ),
    'sitemap-playbook.xml': urlsetXml(
      [`${SITE}/playbook`, ...playbookSlugs.map((s) => `${SITE}/playbook/${s}`)]
        .map((loc) => ({ loc })),
    ),
  };
  files['sitemap.xml'] = sitemapIndexXml(
    Object.keys(files).map((name) => `${SITE}/${name}`),
  );

  for (const dir of outDirs) {
    if (!existsSync(dir)) continue;
    for (const [name, xml] of Object.entries(files)) {
      await writeFile(path.join(dir, name), xml, 'utf8');
    }
  }
  console.log(
    `Sitemaps written: ${jobs.length} jobs, ${posts.length} blog posts, ` +
    `${deriveHubEntries(jobs).length} hubs, ${playbookSlugs.length} playbook articles.`,
  );
}

main().catch((err) => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});
