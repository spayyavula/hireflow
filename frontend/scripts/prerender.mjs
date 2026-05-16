import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { escapeHtml, fetchJobs, jobSlug } from "./lib.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");
const baseHtmlPath = path.join(distDir, "index.html");

const PAGES = [
  {
    route: "/",
    title: "JobsSearch | Decision System For Job Search And Hiring",
    description:
      "JobsSearch is an AI decision system for job seekers, recruiters, and companies with match scoring, pivot paths, certification ROI, and interview guidance.",
  },
  {
    route: "/features",
    title: "Features | JobsSearch",
    description:
      "Explore AI match scoring, interview coaching, recruiter pipelines, analytics, and collaboration tools built for calmer hiring decisions.",
  },
  {
    route: "/pricing",
    title: "Pricing | JobsSearch",
    description:
      "Simple pricing for seekers, recruiters, and companies. Start free and scale your hiring workflow with AI decision support.",
  },
  {
    route: "/about",
    title: "About | JobsSearch",
    description:
      "Learn why JobsSearch exists: replacing noisy hiring dashboards with a decision-first system that helps teams and candidates move forward.",
  },
  {
    route: "/roadmap",
    title: "Roadmap | JobsSearch",
    description:
      "See upcoming JobsSearch features, submit ideas, and vote on what should be built next.",
  },
  {
    route: "/terms",
    title: "Terms | JobsSearch",
    description:
      "Terms for using JobsSearch, including account responsibilities, acceptable use, and service limitations.",
  },
  {
    route: "/privacy",
    title: "Privacy | JobsSearch",
    description:
      "How JobsSearch collects, uses, and protects your personal and hiring data.",
  },
  {
    route: "/help",
    title: "Help | JobsSearch",
    description:
      "Get support for your account, subscriptions, interviews, and hiring workflows on JobsSearch.",
  },
  {
    route: "/coming-soon",
    title: "Coming Soon | JobsSearch",
    description:
      "This JobsSearch page is on the way. Explore current features and check the roadmap while we finish it.",
  },
  {
    route: "/blog",
    title: "Blog | JobsSearch",
    description:
      "Hiring strategy, job search guidance, interview prep, and career decision insights from the JobsSearch team.",
  },
];

function replaceMeta(html, selector, content) {
  // The replacement is passed as a function so that `$` sequences in `content`
  // (e.g. salary figures in real job data) are inserted literally rather than
  // interpreted as String.prototype.replace special patterns.
  if (selector === "title") {
    return html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${content}</title>`);
  }

  if (selector === "canonical") {
    return html.replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/i,
      () => `<link rel="canonical" href="${content}" />`,
    );
  }

  const sepIndex = selector.indexOf(":");
  const type = selector.slice(0, sepIndex);
  const key = selector.slice(sepIndex + 1);
  const regex =
    type === "name"
      ? new RegExp(`<meta name="${key}" content="[\\s\\S]*?"\\s*\\/>`, "i")
      : new RegExp(`<meta property="${key}" content="[\\s\\S]*?"\\s*\\/>`, "i");

  const replacement =
    type === "name"
      ? `<meta name="${key}" content="${content}" />`
      : `<meta property="${key}" content="${content}" />`;

  return html.replace(regex, () => replacement);
}

function applyPageSeo(baseHtml, page) {
  const canonicalUrl = `https://jobssearch.work${page.route}`;

  let html = baseHtml;
  html = replaceMeta(html, "title", page.title);
  html = replaceMeta(html, "name:description", page.description);
  html = replaceMeta(html, "canonical", canonicalUrl);
  html = replaceMeta(html, "property:og:title", page.title);
  html = replaceMeta(html, "property:og:description", page.description);
  html = replaceMeta(html, "property:og:url", canonicalUrl);
  html = replaceMeta(html, "name:twitter:title", page.title);
  html = replaceMeta(html, "name:twitter:description", page.description);

  return html;
}

function buildJobPage(job) {
  const company = job.companyName || "a hiring company";
  const locationPart = job.location ? ` in ${job.location}` : "";
  const summary = job.description
    ? job.description.replace(/\s+/g, " ").slice(0, 140).trim()
    : "View this role and decide whether to apply, build proof, or pivot — on JobsSearch.";
  return {
    route: `/jobs/${jobSlug(job)}`,
    title: escapeHtml(`${job.title} at ${company} | JobsSearch`),
    description: escapeHtml(`${job.title}${locationPart}. ${summary}`),
  };
}

async function main() {
  const baseHtml = await readFile(baseHtmlPath, "utf8");

  const apiBase = (process.env.VITE_API_URL || "").replace(/\/$/, "");
  const jobPages = (
    await fetchJobs({ apiBase, siteUrl: "https://jobssearch.work" })
  ).map(buildJobPage);
  const allPages = [...PAGES, ...jobPages];

  await Promise.all(
    allPages.map(async (page) => {
      const pageHtml = applyPageSeo(baseHtml, page);
      const outputPath =
        page.route === "/"
          ? path.join(distDir, "index.html")
          : path.join(distDir, page.route.replace(/^\//, ""), "index.html");

      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, pageHtml, "utf8");
    }),
  );

  console.log(
    `Prerendered ${allPages.length} static routes (${jobPages.length} job pages).`,
  );
}

main().catch((error) => {
  console.error("Prerender step failed:", error);
  process.exit(1);
});
