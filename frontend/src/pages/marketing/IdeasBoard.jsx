import { useState, useEffect } from 'react';
import api from '../../api';
import { FEATURE_CATEGORIES, FEATURE_STATUSES, STATUS_CONFIG, CATEGORY_COLORS, ROLE_BADGES } from '../../data/ideasConfig';
import GlobalStyles from '../../styles/GlobalStyles';
import Icons from '../../components/ui/Icons';
import PublicNav from '../../components/PublicNav';
import { IdeasBoardHeader } from './ideas/IdeasBoardHeader';
import { IdeasBoardFilters } from './ideas/IdeasBoardFilters';
import { FeatureCard } from './ideas/FeatureCard';
import { SubmitIdeaModal } from './ideas/SubmitIdeaModal';

const IdeasBoard = ({ onGetStarted, onSignIn, onNavigate, currentPage, user }) => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("votes");
  const [showSubmit, setShowSubmit] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState("");
  const [submitForm, setSubmitForm] = useState({ title: "", description: "", category: "General" });
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState({});
  const [error, setError] = useState("");

  const isPublic = !!onNavigate;
  const isLoggedIn = !!api.token;

  const loadFeatures = async () => {
    try {
      const params = {};
      if (category !== "All") params.category = category;
      if (statusFilter !== "All") params.status = statusFilter;
      params.sort = sort;
      const data = await api.listFeatures(params);
      setFeatures(data);
    } catch (e) {
      console.error("Failed to load features:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeatures(); }, [category, statusFilter, sort]);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleVote = async (id) => {
    if (!isLoggedIn) {
      if (onGetStarted) onGetStarted();
      return;
    }
    setVoting(v => ({ ...v, [id]: true }));
    try {
      await api.voteFeature(id);
      await loadFeatures();
    } catch (e) {
      setError(e.message);
    } finally {
      setVoting(v => ({ ...v, [id]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!submitForm.title.trim() || !submitForm.description.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await api.createFeature(submitForm);
      setShowSubmit(false);
      setSubmitForm({ title: "", description: "", category: "General" });
      await loadFeatures();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loadComments = async (id) => {
    try {
      const data = await api.getFeatureComments(id);
      setComments(c => ({ ...c, [id]: data }));
    } catch (e) {
      console.error("Failed to load comments:", e);
    }
  };

  const handleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!comments[id]) loadComments(id);
    }
  };

  const handleComment = async (featureId) => {
    if (!commentText.trim()) return;
    try {
      await api.addFeatureComment(featureId, commentText);
      setCommentText("");
      await loadComments(featureId);
      await loadFeatures();
    } catch (e) {
      setError(e.message);
    }
  };

  const totalVotes = features.reduce((s, f) => s + f.vote_count, 0);
  const shippedCount = features.filter(f => f.status === "shipped").length;

  const content = (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <IdeasBoardHeader
        features={features}
        totalVotes={totalVotes}
        shippedCount={shippedCount}
        isLoggedIn={isLoggedIn}
        onGetStarted={onGetStarted}
        onShowSubmit={() => setShowSubmit(true)}
      />

      <IdeasBoardFilters
        category={category}
        statusFilter={statusFilter}
        sort={sort}
        onCategoryChange={setCategory}
        onStatusChange={setStatusFilter}
        onSortChange={setSort}
      />

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,107,91,0.08)", color: "var(--coral)", marginBottom: 16, fontSize: 14, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {error}
          <span onClick={() => setError("")} style={{ cursor: "pointer" }}>{Icons.x}</span>
        </div>
      )}

      {/* Feature Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 40, height: 40, margin: "0 auto 16px", borderRadius: 20, border: "3px solid var(--cream-dark)", borderTopColor: "var(--coral)", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading ideas...</p>
        </div>
      ) : features.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 20, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💡</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No ideas yet</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>Be the first to submit a feature request!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {features.map(f => (
            <FeatureCard
              key={f.id}
              feature={f}
              isExpanded={expandedId === f.id}
              comments={comments[f.id] || []}
              voting={!!voting[f.id]}
              isLoggedIn={isLoggedIn}
              commentText={commentText}
              onVote={handleVote}
              onExpand={handleExpand}
              onCommentChange={setCommentText}
              onCommentSubmit={handleComment}
            />
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmit && (
        <SubmitIdeaModal
          submitForm={submitForm}
          submitting={submitting}
          error={error}
          onClose={() => setShowSubmit(false)}
          onFieldChange={(field, value) => setSubmitForm(f => ({ ...f, [field]: value }))}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );

  // Public page wraps with nav; dashboard page is just the content
  if (isPublic) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
        <GlobalStyles />
        <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />
        <section style={{ padding: "60px 48px 80px" }}>{content}</section>
        <footer style={{
          padding: "24px 48px", textAlign: "center", fontSize: 13, color: "var(--text-muted)",
          background: "var(--ink)", borderTop: "1px solid rgba(250,248,245,0.06)",
        }}>© 2026 Hyrly. Built with AI.</footer>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Ideas Board</h1>
      {content}
    </div>
  );
};

export default IdeasBoard;
