// Shared helpers for build-time scripts (prerender + sitemap).

/**
 * Production backend API base. The frontend and backend deploy as separate
 * Vercel projects, so build scripts fall back to this when no explicit
 * apiBase or env override is given. Override via JOBS_API_URL / VITE_API_URL.
 */
export const PRODUCTION_API_BASE = "https://hireflow-api.vercel.app";

/** Convert arbitrary text into a URL-safe slug. */
export const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Stable, unique job URL slug: "<title-slug>-<id>". */
export const jobSlug = (job) => `${slugify(job.title)}-${job.id}`;

/** Escape text for safe insertion into HTML attributes and element text. */
export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

async function fetchJsonArray(url) {
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

/**
 * Fetch active jobs from the backend at build time.
 *
 * Resolution order for the API endpoint:
 *   1. JOBS_API_URL env var (comma-separated list of full URLs)
 *   2. `${apiBase}/api/jobs?limit=100`
 *   3. http://localhost:8000/api/jobs?limit=100
 *   4. `${siteUrl}/api/jobs?limit=100`
 *
 * Returns a normalized job list, or [] if no endpoint is reachable
 * (so the build never fails just because the API is down).
 */
export async function fetchJobs({ apiBase = "", siteUrl = "" } = {}) {
  let candidates;
  if (process.env.JOBS_API_URL) {
    candidates = process.env.JOBS_API_URL.split(",")
      .map((u) => u.trim())
      .filter(Boolean);
  } else {
    candidates = [];
    if (apiBase) candidates.push(`${apiBase}/api/jobs?limit=100`);
    candidates.push(`${PRODUCTION_API_BASE}/api/jobs?limit=100`);
    candidates.push("http://localhost:8000/api/jobs?limit=100");
    if (siteUrl) candidates.push(`${siteUrl}/api/jobs?limit=100`);
  }

  for (const url of candidates) {
    const data = await fetchJsonArray(url);
    if (!data) continue;

    const jobs = data
      .filter(
        (job) =>
          job &&
          typeof job.id === "string" &&
          job.id.trim().length > 0 &&
          typeof job.title === "string" &&
          job.title.trim().length > 0 &&
          (job.status === undefined || job.status === "active"),
      )
      .map((job) => ({
        id: job.id.trim(),
        title: job.title.trim(),
        companyName: (job.company_name || "").trim(),
        location: (job.location || "").trim(),
        description: (job.description || "").trim(),
        createdAt: job.created_at || "",
      }));

    console.log(`Loaded ${jobs.length} job URLs from ${url}`);
    return jobs;
  }

  console.warn(
    `Skipping job URLs: none of the job API endpoints returned JSON. Tried: ${candidates.join(", ")}`,
  );
  return [];
}
