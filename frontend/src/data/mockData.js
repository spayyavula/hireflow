import { toSlug } from '../lib/slug';

export const JOBS = [
  { id: 1, title: "Senior React Developer", company: "TechVault", location: "San Francisco, CA", salary: "$160k–$200k", match: 96, tags: ["React", "TypeScript", "Node.js"], posted: "2h ago", remote: true, applicants: 23, desc: "Lead frontend architecture for our next-gen platform.", requiredSkills: ["React", "TypeScript", "JavaScript"], niceSkills: ["Next.js", "Redux", "Node.js"] },
  { id: 2, title: "ML Engineer", company: "DataPulse AI", location: "Remote", salary: "$180k–$230k", match: 91, tags: ["Python", "PyTorch", "MLOps"], posted: "5h ago", remote: true, applicants: 45, desc: "Build and deploy production ML pipelines at scale.", requiredSkills: ["Python", "Machine Learning", "PyTorch"], niceSkills: ["MLOps", "AWS", "Docker"] },
  { id: 3, title: "Product Designer", company: "Forma Studio", location: "New York, NY", salary: "$130k–$165k", match: 88, tags: ["Figma", "UX Research", "Design Systems"], posted: "1d ago", remote: false, applicants: 67, desc: "Shape the future of our design system.", requiredSkills: ["Figma", "UX Research", "UI Design"], niceSkills: ["Design Systems", "Prototyping", "Accessibility"] },
  { id: 4, title: "DevOps Lead", company: "CloudScale", location: "Austin, TX", salary: "$155k–$195k", match: 85, tags: ["AWS", "Kubernetes", "Terraform"], posted: "3h ago", remote: true, applicants: 18, desc: "Lead infrastructure team and modernize our cloud stack.", requiredSkills: ["AWS", "Kubernetes", "Terraform"], niceSkills: ["Docker", "CI/CD", "Linux"] },
  { id: 5, title: "Full Stack Developer", company: "PayLoop", location: "Remote", salary: "$140k–$175k", match: 79, tags: ["Node.js", "React", "PostgreSQL"], posted: "1d ago", remote: true, applicants: 54, desc: "Build payment infrastructure used by millions.", requiredSkills: ["Node.js", "React", "SQL"], niceSkills: ["TypeScript", "Docker", "AWS"] },
];

export const FEATURED_JOB_POSTINGS = JOBS.map((job) => ({
  ...job,
  slug: toSlug(job.title),
  description: job.desc,
  datePosted: "2026-05-16",
  validThrough: "2026-08-31",
  employmentType: "FULL_TIME",
  directApply: true,
  applicantLocationRequirements: job.remote ? "Remote" : "On-site",
}));

export const getJobPostingBySlug = (slug) => FEATURED_JOB_POSTINGS.find((job) => job.slug === slug) || null;

export const CANDIDATES = [
  { id: 1, name: "Sarah Chen", role: "Senior React Developer", experience: "8 years", match: 97, skills: ["React", "TypeScript", "GraphQL"], status: "Active", avatar: "SC", location: "San Francisco" },
  { id: 2, name: "Marcus Johnson", role: "Full Stack Engineer", experience: "6 years", match: 93, skills: ["Node.js", "React", "PostgreSQL"], status: "Active", avatar: "MJ", location: "Remote" },
  { id: 3, name: "Emily Park", role: "ML Engineer", experience: "5 years", match: 90, skills: ["Python", "TensorFlow", "AWS"], status: "Open", avatar: "EP", location: "Seattle" },
  { id: 4, name: "David Kim", role: "DevOps Engineer", experience: "7 years", match: 87, skills: ["Kubernetes", "Docker", "CI/CD"], status: "Active", avatar: "DK", location: "Austin" },
];

export const PIPELINE_STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired"];
export const PIPELINE_DATA = [
  { name: "Sarah Chen", stage: 3, role: "Sr. React Dev", avatar: "SC" },
  { name: "Marcus Johnson", stage: 2, role: "Full Stack", avatar: "MJ" },
  { name: "Emily Park", stage: 1, role: "ML Engineer", avatar: "EP" },
  { name: "David Kim", stage: 4, role: "DevOps Lead", avatar: "DK" },
  { name: "Lisa Wang", stage: 0, role: "Designer", avatar: "LW" },
];

export const MESSAGES = [
  { id: 1, from: "TechVault HR", avatar: "TV", preview: "We'd love to schedule an interview...", time: "15m", unread: true },
  { id: 2, from: "Sarah Chen", avatar: "SC", preview: "Thanks for reaching out! I'd love to learn more...", time: "2h", unread: true },
  { id: 3, from: "DataPulse", avatar: "DP", preview: "Your profile caught our attention...", time: "1d", unread: false },
];
