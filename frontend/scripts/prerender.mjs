import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  {
    route: "/jobs/senior-react-developer",
    title: "Senior React Developer at TechVault | JobsSearch",
    description:
      "Senior React Developer in San Francisco, CA. Lead frontend architecture for our next-gen platform.",
  },
  {
    route: "/jobs/ml-engineer",
    title: "ML Engineer at DataPulse AI | JobsSearch",
    description:
      "ML Engineer in Remote. Build and deploy production ML pipelines at scale.",
  },
  {
    route: "/jobs/product-designer",
    title: "Product Designer at Forma Studio | JobsSearch",
    description:
      "Product Designer in New York, NY. Shape the future of our design system.",
  },
];

function replaceMeta(html, selector, content) {
  if (selector === "title") {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${content}</title>`);
  }

  if (selector === "canonical") {
    return html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${content}" />`);
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

  return html.replace(regex, replacement);
}

function applyPageSeo(baseHtml, page) {
  const canonicalUrl = `https://jobssearch.work${page.route}`;

  let html = baseHtml;
  html = replaceMeta(html, "title", page.title);
  html = replaceMeta(html, "name:description", page.description);
  html = replaceMeta(html, "canonical", canonicalUrl);

  html = html.replace(
    /<meta property="og:title" content="[\s\S]*?"\s*\/>/i,
    `<meta property="og:title" content="${page.title}" />`,
  );
  html = html.replace(
    /<meta property="og:description" content="[\s\S]*?"\s*\/>/i,
    `<meta property="og:description" content="${page.description}" />`,
  );
  html = html.replace(
    /<meta property="og:url" content="[\s\S]*?"\s*\/>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`,
  );
  html = html.replace(
    /<meta name="twitter:title" content="[\s\S]*?"\s*\/>/i,
    `<meta name="twitter:title" content="${page.title}" />`,
  );
  html = html.replace(
    /<meta name="twitter:description" content="[\s\S]*?"\s*\/>/i,
    `<meta name="twitter:description" content="${page.description}" />`,
  );

  return html;
}

async function main() {
  const baseHtml = await readFile(baseHtmlPath, "utf8");

  await Promise.all(
    PAGES.map(async (page) => {
      const pageHtml = applyPageSeo(baseHtml, page);
      const outputPath =
        page.route === "/"
          ? path.join(distDir, "index.html")
          : path.join(distDir, page.route.replace(/^\//, ""), "index.html");

      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, pageHtml, "utf8");
    }),
  );

  console.log(`Prerendered ${PAGES.length} static routes.`);
}

main().catch((error) => {
  console.error("Prerender step failed:", error);
  process.exit(1);
});
