// Build-time content loader for the /playbook content surface.
// Articles live at frontend/content/playbook/*.md with YAML frontmatter.
// We use Vite's glob import to pull them all into the bundle at build time;
// no DB call, no runtime fetch.
//
// Uses js-yaml (pure JS, browser-safe) rather than gray-matter — gray-matter
// pulls in Node's Buffer which is undefined in the browser, breaking Vike's
// client-side dynamic import of this page chunk.

import yaml from 'js-yaml';
import { marked } from 'marked';

const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';

const MODULES = import.meta.glob('/content/playbook/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return { data: {}, content: raw };
  return { data: yaml.load(match[1]) || {}, content: match[2] };
}

function parseOne(rawContent) {
  const { data, content } = parseFrontmatter(rawContent);
  // Replace {{SITE}} tokens before rendering so marked doesn't URL-encode them
  // inside link hrefs (it turns {{ }} into %7B%7B%7D%7D).
  const contentWithSite = content.replace(/\{\{SITE\}\}/g, SITE);
  const rendered = marked.parse(contentWithSite, { async: false });
  // Also catch any remaining encoded or literal tokens that slipped through.
  const html = rendered.replace(/\{\{SITE\}\}/g, SITE).replace(/%7B%7BSITE%7D%7D/g, SITE);
  // js-yaml parses bare YYYY-MM-DD values as Date objects.
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
