import { useState, useEffect } from 'react';
import GlobalStyles from '../../styles/GlobalStyles';
import PublicNav from '../../components/PublicNav';
import ComingSoonPage from '../static/ComingSoonPage';
import api from '../../api';

const BlogPostPage = ({ slug, onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const [post, setPost] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const stripHtml = (html = "") => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const postPlainText = post ? stripHtml(post.body_html || "") : "";
  const quickAnswer = post
    ? (post.excerpt || post.subtitle || postPlainText || "").slice(0, 260)
    : "";

  const getPostUrl = () => `${window.location.origin}/blog/${slug}`;
  const shareLinks = post ? {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getPostUrl())}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getPostUrl())}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(getPostUrl())}&text=${encodeURIComponent(post.title + " | Hyrly Blog")}`,
    instagram: null, // Instagram doesn't support direct URL sharing — copy link instead
  } : {};
  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPostUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!post) return;

    const canonicalUrl = getPostUrl();
    const pageTitle = post.seo_title ? `${post.seo_title} | Hyrly` : `${post.title} | Hyrly Blog`;
    const pageDescription = post.seo_description || post.excerpt || post.subtitle || "Career insights and hiring decisions from Hyrly.";

    document.title = pageTitle;

    const upsertMeta = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        if (attrs.name) el.setAttribute("name", attrs.name);
        if (attrs.property) el.setAttribute("property", attrs.property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", attrs.content);
    };

    upsertMeta('meta[name="description"]', { name: "description", content: pageDescription });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "article" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: pageDescription });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: pageDescription });

    if (post.cover_image_url) {
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: post.cover_image_url });
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: post.cover_image_url });
    }

    if (post.published_at) {
      upsertMeta('meta[property="article:published_time"]', { property: "article:published_time", content: post.published_at });
    }

    if (post.author_name) {
      upsertMeta('meta[name="author"]', { name: "author", content: post.author_name });
    }

    let canonicalEl = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonicalUrl);

    let jsonLdEl = document.head.querySelector('#blogpost-jsonld');
    if (!jsonLdEl) {
      jsonLdEl = document.createElement("script");
      jsonLdEl.setAttribute("type", "application/ld+json");
      jsonLdEl.setAttribute("id", "blogpost-jsonld");
      document.head.appendChild(jsonLdEl);
    }

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: pageDescription,
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl,
      author: {
        "@type": "Person",
        name: post.author_name || "Hyrly",
      },
      publisher: {
        "@type": "Organization",
        name: "Hyrly",
        logo: {
          "@type": "ImageObject",
          url: "https://hyrly.ai/logo.png",
        },
      },
      datePublished: post.published_at || undefined,
      dateModified: post.updated_at || post.published_at || undefined,
      image: post.cover_image_url || "https://hyrly.ai/logo.png",
      keywords: Array.isArray(post.tags) ? post.tags.join(", ") : undefined,
      articleSection: CATEGORY_LABELS[post.category] || post.category,
      wordCount: postPlainText ? postPlainText.split(/\s+/).length : undefined,
    };

    jsonLdEl.textContent = JSON.stringify(articleSchema);

    return () => {
      const existing = document.head.querySelector('#blogpost-jsonld');
      if (existing) existing.remove();
    };
  }, [post, slug]);

  useEffect(() => { window.scrollTo(0, 0); loadPost(); }, [slug]);

  useEffect(() => {
    if (!loading && !post) {
      onNavigate("coming-soon", { replace: true });
    }
  }, [loading, post, onNavigate]);

  const loadPost = async () => {
    try {
      const [postData, jobsData] = await Promise.all([
        api.getBlogPost(slug),
        api.getRelatedJobsForPost(slug).catch(() => []),
      ]);
      setPost(postData);
      setRelatedJobs(jobsData);
    } catch (e) {
      console.error("Failed to load post:", e);
    }
    setLoading(false);
  };

  const CATEGORY_LABELS = {
    "career-playbook": "Career Playbook", "resume-lab": "Resume Lab",
    "interview-decoded": "Interview Decoded", "hiring-signals": "Hiring Signals",
    "company-spotlight": "Company Spotlight", "engineering-culture": "Engineering Culture",
    "remote-work": "Remote Work", "ai-future-work": "AI & Future of Work",
    "salary-compass": "Salary Compass", "recruiter-craft": "Recruiter Craft",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />
      <div style={{ textAlign: "center", padding: 120, color: "var(--text-muted)" }}>Loading...</div>
    </div>
  );

  if (!post) return (
    <ComingSoonPage
      onGetStarted={onGetStarted}
      onSignIn={onSignIn}
      onNavigate={onNavigate}
      currentPage="coming-soon"
    />
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero Image */}
      {post.cover_image_url && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 48px 0" }}>
          <div style={{ height: 400, borderRadius: 20, overflow: "hidden", background: `url(${post.cover_image_url}) center/cover` }} />
        </div>
      )}

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 48px 80px", display: "flex", gap: 48 }}>
        {/* Main Content */}
        <article style={{ flex: 1, minWidth: 0 }}>
          {/* Back link */}
          <button onClick={() => onNavigate("blog")} style={{
            background: "none", border: "none", color: "var(--coral)", fontSize: 14, fontWeight: 600,
            cursor: "pointer", marginBottom: 24, padding: 0, fontFamily: "'Source Sans 3', sans-serif",
          }}>&larr; Back to Blog</button>

          {/* Category + Reading time */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <span style={{
              padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600,
              background: "rgba(126,184,158,0.1)", color: "var(--sage)",
            }}>{CATEGORY_LABELS[post.category] || post.category}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{post.reading_time_min} min read</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{post.view_count} views</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 700,
            lineHeight: 1.15, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 12,
          }}>{post.title}</h1>

          {post.subtitle && (
            <p style={{ fontSize: 20, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 24 }}>{post.subtitle}</p>
          )}

          {quickAnswer && (
            <div style={{
              borderRadius: 14, border: "1px solid var(--border)", background: "rgba(13,13,15,0.03)",
              padding: "14px 16px", marginBottom: 24,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
                Quick answer
              </div>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                {quickAnswer}{quickAnswer.length === 260 ? "..." : ""}
              </p>
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div style={{
              borderRadius: 14, border: "1px solid var(--border)", background: "white",
              padding: "14px 16px", marginBottom: 28,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
                Key points covered
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {post.tags.slice(0, 6).map(tag => (
                  <span key={tag} style={{
                    padding: "6px 12px", borderRadius: 16, background: "rgba(13,13,15,0.05)",
                    fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Author + Date */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid var(--border)" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 22, background: "var(--ink)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--cream)", fontSize: 16, fontWeight: 700,
            }}>{post.author_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 15 }}>{post.author_name}</div>
              {post.published_at && (
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div
            className="blog-content"
            style={{
              fontSize: 17, lineHeight: 1.8, color: "var(--text-primary)",
              fontFamily: "'Source Sans 3', sans-serif",
            }}
            dangerouslySetInnerHTML={{ __html: post.body_html }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {post.tags.map(tag => (
                  <span key={tag} style={{
                    padding: "6px 14px", borderRadius: 20, background: "rgba(13,13,15,0.04)",
                    fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Share Buttons */}
          <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 16 }}>Share this article</h4>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
                background: "#0A66C2", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none",
                fontFamily: "'Source Sans 3', sans-serif", transition: "opacity 0.2s",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              <a href={shareLinks.x} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
                background: "#0F1419", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none",
                fontFamily: "'Source Sans 3', sans-serif", transition: "opacity 0.2s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Post on X
              </a>
              <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
                background: "#1877F2", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none",
                fontFamily: "'Source Sans 3', sans-serif", transition: "opacity 0.2s",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
              <button onClick={handleCopyLink} style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
                background: copied ? "var(--sage)" : "var(--ink)", color: "white", fontSize: 13, fontWeight: 600,
                border: "none", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.2s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside style={{ width: 280, flexShrink: 0 }}>
          {/* Related Jobs */}
          {relatedJobs.length > 0 && (
            <div style={{
              background: "white", borderRadius: 16, border: "1px solid var(--border)",
              padding: 24, marginBottom: 24, position: "sticky", top: 80,
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700,
                color: "var(--ink)", marginBottom: 16, letterSpacing: "-0.01em",
              }}>Related Jobs</h3>
              {relatedJobs.map(job => (
                <div key={job.id} style={{
                  padding: "14px 0", borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{job.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{job.company_name}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {job.location && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{job.location}</span>}
                    {job.remote && <span style={{ fontSize: 11, color: "var(--sage)", fontWeight: 600 }}>Remote</span>}
                  </div>
                </div>
              ))}
              <button onClick={onGetStarted} style={{
                width: "100%", marginTop: 16, padding: "10px 20px", borderRadius: 10, border: "none",
                background: "var(--coral)", color: "white", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
              }}>View All Jobs</button>
            </div>
          )}

          {/* Skills from post */}
          {post.related_skills && post.related_skills.length > 0 && (
            <div style={{
              background: "white", borderRadius: 16, border: "1px solid var(--border)", padding: 24,
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700,
                color: "var(--ink)", marginBottom: 12,
              }}>Skills Mentioned</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {post.related_skills.map(skill => (
                  <span key={skill} style={{
                    padding: "4px 12px", borderRadius: 12, background: "rgba(255,107,91,0.08)",
                    fontSize: 12, fontWeight: 600, color: "var(--coral)",
                  }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
      }}>
        &copy; 2026 Hyrly. Built with AI.
      </footer>
    </div>
  );
};

export default BlogPostPage;
