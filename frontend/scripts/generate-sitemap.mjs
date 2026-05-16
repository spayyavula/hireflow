import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetchJobs, jobSlug, PRODUCTION_API_BASE } from "./lib.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicSitemapPath = path.join(projectRoot, "public", "sitemap.xml");
const distSitemapPath = path.join(projectRoot, "dist", "sitemap.xml");

const SITE_URL = (process.env.SITEMAP_SITE_URL || "https://jobssearch.work").replace(/\/$/, "");
const API_BASE = (process.env.VITE_API_URL || "").replace(/\/$/, "");
const TODAY = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/features", changefreq: "weekly", priority: "0.8" },
  { path: "/pricing", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/roadmap", changefreq: "weekly", priority: "0.7" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
  { path: "/coming-soon", changefreq: "monthly", priority: "0.4" },
];

const xmlEscape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const toDate = (value) => {
  if (!value) return TODAY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return TODAY;
  return d.toISOString().slice(0, 10);
};

function getCandidateBlogApiUrls() {
  if (process.env.SITEMAP_BLOG_API_URL) {
    return process.env.SITEMAP_BLOG_API_URL
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
  }

  const candidates = [];
  if (API_BASE) candidates.push(`${API_BASE}/api/blog?page=1&per_page=50`);
  candidates.push(`${PRODUCTION_API_BASE}/api/blog?page=1&per_page=50`);
  candidates.push("http://localhost:8000/api/blog?page=1&per_page=50");
  candidates.push(`${SITE_URL}/api/blog?page=1&per_page=50`);
  return candidates;
}

async function tryFetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;

    const data = await response.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBlogPosts() {
  const candidates = getCandidateBlogApiUrls();

  for (const url of candidates) {
    const data = await tryFetchJson(url);
    if (!data) continue;

    const posts = data
      .filter((post) => post && typeof post.slug === "string" && post.slug.trim().length > 0)
      .map((post) => ({
        path: `/blog/${post.slug.trim()}`,
        lastmod: toDate(post.published_at || post.updated_at),
        changefreq: "monthly",
        priority: "0.6",
      }));

    console.log(`Loaded ${posts.length} blog URLs from ${url}`);
    return posts;
  }

  console.warn(`Skipping blog URLs: none of the blog API endpoints returned JSON. Tried: ${candidates.join(", ")}`);
  return [];
}

function buildSitemapXml(urls) {
  const entries = urls
    .map(
      (url) => `  <url>\n    <loc>${xmlEscape(`${SITE_URL}${url.path}`)}</loc>\n    <lastmod>${xmlEscape(url.lastmod || TODAY)}</lastmod>\n    <changefreq>${xmlEscape(url.changefreq)}</changefreq>\n    <priority>${xmlEscape(url.priority)}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

async function main() {
  const blogRoutes = await fetchBlogPosts();
  const jobRoutes = (await fetchJobs({ apiBase: API_BASE, siteUrl: SITE_URL })).map((job) => ({
    path: `/jobs/${jobSlug(job)}`,
    lastmod: toDate(job.createdAt),
    changefreq: "weekly",
    priority: "0.7",
  }));
  const allUrls = [
    ...staticRoutes.map((r) => ({ ...r, lastmod: TODAY })),
    ...blogRoutes,
    ...jobRoutes,
  ];

  const xml = buildSitemapXml(allUrls);

  await writeFile(publicSitemapPath, xml, "utf8");

  try {
    await readFile(path.join(projectRoot, "dist", "index.html"), "utf8");
    await writeFile(distSitemapPath, xml, "utf8");
  } catch {
    // Dist may not exist outside build, so only update public sitemap in that case.
  }

  console.log(
    `Sitemap updated with ${allUrls.length} URLs (${blogRoutes.length} blog, ${jobRoutes.length} job).`,
  );
}

main().catch((error) => {
  console.error("Failed to generate sitemap:", error);
  process.exit(1);
});
