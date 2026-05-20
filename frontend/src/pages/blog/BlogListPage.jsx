import { useState, useEffect } from 'react';
import GlobalStyles from '../../styles/GlobalStyles';
import PublicNav from '../../components/PublicNav';
import api from '../../api';

const BlogListPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { window.scrollTo(0, 0); loadBlog(); }, []);

  const loadBlog = async (category = null) => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      const [postData, catData] = await Promise.all([
        api.getBlogPosts(params),
        api.getBlogCategories(),
      ]);
      setPosts(postData);
      setCategories(catData);
    } catch (e) { console.error("Failed to load blog:", e); }
    setLoading(false);
  };

  const handleCategoryClick = (cat) => {
    const next = cat === activeCategory ? null : cat;
    setActiveCategory(next);
    loadBlog(next);
  };

  const CATEGORY_LABELS = {
    "career-playbook": "Career Playbook", "resume-lab": "Resume Lab",
    "interview-decoded": "Interview Decoded", "hiring-signals": "Hiring Signals",
    "company-spotlight": "Company Spotlight", "engineering-culture": "Engineering Culture",
    "remote-work": "Remote Work", "ai-future-work": "AI & Future of Work",
    "salary-compass": "Salary Compass", "recruiter-craft": "Recruiter Craft",
  };

  const featured = posts.filter(p => p.featured);
  const regular = posts.filter(p => !p.featured);

  useEffect(() => {
    const upsertMeta = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        if (attrs.name) el.setAttribute("name", attrs.name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", attrs.content);
    };

    const hasPosts = posts.length > 0;
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: hasPosts ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" : "noindex,follow",
    });

    return () => {
      upsertMeta('meta[name="robots"]', {
        name: "robots",
        content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
      });
    };
  }, [posts]);

  const getQuickTake = (post) => {
    const source = post?.excerpt || post?.subtitle || post?.title || "";
    if (!source) return "Practical guidance for your next hiring or career decision.";
    const trimmed = source.trim();
    return trimmed.length > 170 ? `${trimmed.slice(0, 170)}...` : trimmed;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />

      {/* Hero */}
      <section style={{ padding: "80px 48px 40px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
          background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 24, letterSpacing: "0.02em",
        }}>Pressroom</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 52px)", fontWeight: 700,
          lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 16,
        }}>Insights for your career journey</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          Expert advice on job search, interviews, hiring trends, and the future of work.
        </p>
      </section>

      {/* Category Filters */}
      {categories.length > 0 && (
        <section style={{ padding: "0 48px 32px", maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => handleCategoryClick(null)} style={{
              padding: "8px 18px", borderRadius: 20, border: "1px solid var(--border)",
              background: !activeCategory ? "var(--ink)" : "white", color: !activeCategory ? "white" : "var(--text-secondary)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
            }}>All</button>
            {categories.map(c => (
              <button key={c.category} onClick={() => handleCategoryClick(c.category)} style={{
                padding: "8px 18px", borderRadius: 20, border: "1px solid var(--border)",
                background: activeCategory === c.category ? "var(--ink)" : "white",
                color: activeCategory === c.category ? "white" : "var(--text-secondary)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif",
              }}>{c.label || CATEGORY_LABELS[c.category] || c.category} ({c.count})</button>
            ))}
          </div>
        </section>
      )}

      {/* Featured Post */}
      {featured.length > 0 && (
        <section style={{ padding: "0 48px 48px", maxWidth: 1000, margin: "0 auto" }}>
          {featured.slice(0, 1).map(post => (
            <div key={post.id} onClick={() => onNavigate("blog-post:" + post.slug)} style={{
              background: "white", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden",
              cursor: "pointer", transition: "all 0.2s", display: "flex", minHeight: 280,
            }}>
              {post.cover_image_url && (
                <div style={{ width: "45%", background: `url(${post.cover_image_url}) center/cover`, minHeight: 280 }} />
              )}
              <div style={{ padding: 40, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{
                  display: "inline-block", padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                  background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 16, alignSelf: "flex-start",
                }}>Featured</div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 12, letterSpacing: "-0.02em" }}>
                  {post.title}
                </h2>
                {post.excerpt && <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>{post.excerpt}</p>}
                <div style={{
                  background: "rgba(13,13,15,0.03)", border: "1px solid var(--border)", borderRadius: 12,
                  padding: "12px 14px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16,
                }}>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>Quick take:</span> {getQuickTake(post)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--text-muted)" }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>{post.author_name}</span>
                  <span>{post.reading_time_min} min read</span>
                  {post.published_at && <span>{new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Post Grid */}
      <section style={{ padding: "0 48px 80px", maxWidth: 1000, margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading posts...</div>
        ) : regular.length === 0 && featured.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--ink)", marginBottom: 8 }}>No posts yet</h3>
            <p style={{ color: "var(--text-muted)" }}>Check back soon for career insights and hiring trends.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {regular.map(post => (
              <div key={post.id} onClick={() => onNavigate("blog-post:" + post.slug)} style={{
                background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {post.cover_image_url && (
                  <div style={{ height: 180, background: `url(${post.cover_image_url}) center/cover` }} />
                )}
                <div style={{ padding: 24 }}>
                  <div style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                    background: "rgba(126,184,158,0.1)", color: "var(--sage)", marginBottom: 12,
                  }}>{CATEGORY_LABELS[post.category] || post.category}</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: "var(--ink)", marginBottom: 8, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                    {post.title}
                  </h3>
                  {post.excerpt && <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                    {post.excerpt.length > 120 ? post.excerpt.slice(0, 120) + "..." : post.excerpt}
                  </p>}
                  <p style={{
                    fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14,
                    padding: "10px 12px", borderRadius: 10, background: "rgba(13,13,15,0.03)", border: "1px solid var(--border)",
                  }}>
                    <span style={{ fontWeight: 700, color: "var(--ink)" }}>Quick take:</span> {getQuickTake(post)}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
                    <span style={{ fontWeight: 600 }}>{post.author_name}</span>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span>{post.reading_time_min} min</span>
                      {post.published_at && <span>{new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer style={{
        padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
        background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
      }}>
        &copy; 2026 Hyrly. Built with AI.
      </footer>
    </div>
  );
};

export default BlogListPage;
