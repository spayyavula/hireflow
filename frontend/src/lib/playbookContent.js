// Build-time content loader for the /playbook content surface.
// Articles live at frontend/content/playbook/*.md with YAML frontmatter.
// We use Vite's glob import to pull them all into the bundle at build time;
// no DB call, no runtime fetch. SSR-safe.

import matter from 'gray-matter';
import { marked } from 'marked';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

// `?raw` returns the file contents as a string. `eager: true` means all
// matching files are bundled (not lazy-loaded). The path is relative to
// the Vite project root (the `frontend/` directory).
const MODULES = import.meta.glob('/content/playbook/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function parseOne(rawContent) {
  const { data, content } = matter(rawContent);
  // Replace {{SITE}} tokens before rendering so marked doesn't URL-encode them
  // inside link hrefs (it turns {{ }} into %7B%7B%7D%7D).
  const contentWithSite = content.replace(/\{\{SITE\}\}/g, SITE);
  const rendered = marked.parse(contentWithSite, { async: false });
  // Also catch any remaining encoded or literal tokens that slipped through.
  const html = rendered.replace(/\{\{SITE\}\}/g, SITE).replace(/%7B%7BSITE%7D%7D/g, SITE);
  // gray-matter/js-yaml parses bare YYYY-MM-DD values as Date objects.
  // Normalise date fields back to ISO date strings so tests can .toMatch().
  const normalized = { ...data };
  for (const key of ['published_at', 'updated_at']) {
    if (normalized[key] instanceof Date) {
      normalized[key] = normalized[key].toISOString().slice(0, 10);
    }
  }
  return { ...normalized, html };
}

// Cache parsed articles once at module load — articles don't change at runtime.
const ARTICLES = Object.values(MODULES).map(parseOne)
  // Newest first by published_at (YYYY-MM-DD strings sort lexicographically).
  .sort((a, b) => (a.published_at < b.published_at ? 1 : a.published_at > b.published_at ? -1 : 0));

const BY_SLUG = Object.fromEntries(ARTICLES.map((a) => [a.slug, a]));

export function getArticles() {
  // Return metadata only (no `html` field) — the hub doesn't need bodies.
  return ARTICLES.map(({ html, ...meta }) => meta);
}

export function getArticleBySlug(slug) {
  return BY_SLUG[slug] || null;
}
