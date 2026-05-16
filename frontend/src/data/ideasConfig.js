export const FEATURE_CATEGORIES = ["All", "Job Search", "Resume Tools", "Recruiter Tools", "Company Dashboard", "Chat & Messaging", "AI Features", "General"];
export const FEATURE_STATUSES = ["All", "submitted", "under_review", "planned", "in_progress", "shipped"];
export const STATUS_CONFIG = {
  submitted: { label: "Submitted", color: "var(--text-muted)", bg: "rgba(138,138,150,0.1)" },
  under_review: { label: "Under Review", color: "var(--gold)", bg: "rgba(212,168,83,0.1)" },
  planned: { label: "Planned", color: "var(--lavender)", bg: "rgba(155,143,212,0.1)" },
  in_progress: { label: "In Progress", color: "var(--coral)", bg: "rgba(255,107,91,0.1)" },
  shipped: { label: "Shipped", color: "var(--sage)", bg: "rgba(126,184,158,0.1)" },
};
export const CATEGORY_COLORS = {
  "Job Search": "var(--coral)", "Resume Tools": "var(--sage)", "Recruiter Tools": "var(--lavender)",
  "Company Dashboard": "var(--gold)", "Chat & Messaging": "#5b9bd5", "AI Features": "#e06090", "General": "var(--text-muted)",
};
export const ROLE_BADGES = {
  seeker: { label: "Seeker", color: "var(--coral)", bg: "rgba(255,107,91,0.08)" },
  recruiter: { label: "Recruiter", color: "var(--sage)", bg: "rgba(126,184,158,0.08)" },
  company: { label: "Company", color: "var(--lavender)", bg: "rgba(155,143,212,0.08)" },
};
