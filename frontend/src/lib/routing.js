export const PUBLIC_PAGE_TO_PATH = {
  home: "/",
  features: "/features",
  pricing: "/pricing",
  about: "/about",
  roadmap: "/roadmap",
  blog: "/blog",
  terms: "/terms",
  privacy: "/privacy",
  help: "/help",
  "coming-soon": "/coming-soon",
};

export const getPageFromPath = (pathname) => {
  if (!pathname || pathname === "/") return "home";

  if (pathname === "/ideas") return "roadmap";

  if (pathname.startsWith("/jobs/")) {
    const slug = pathname.replace("/jobs/", "").trim();
    return slug ? `job-post:${slug}` : "home";
  }

  if (pathname.startsWith("/blog/")) {
    const slug = pathname.replace("/blog/", "").trim();
    return slug ? `blog-post:${slug}` : "blog";
  }

  const match = Object.entries(PUBLIC_PAGE_TO_PATH).find(([, path]) => path === pathname);
  return match ? match[0] : "coming-soon";
};

export const getPathFromPage = (page) => {
  if (!page) return "/";
  if (page === "ideas") return "/roadmap";
  if (page.startsWith("job-post:")) {
    const slug = page.replace("job-post:", "").trim();
    return slug ? `/jobs/${slug}` : "/";
  }
  if (page.startsWith("blog-post:")) {
    const slug = page.replace("blog-post:", "").trim();
    return slug ? `/blog/${slug}` : "/blog";
  }
  return PUBLIC_PAGE_TO_PATH[page] || "/";
};
