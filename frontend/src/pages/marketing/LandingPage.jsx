import GlobalStyles from '../../styles/GlobalStyles';
import Icons from '../../components/ui/Icons';
import PublicNav from '../../components/PublicNav';
import { JOBS } from '../../data/mockData';
import { LandingHero } from './landing/LandingHero';
import { LandingStatsBar } from './landing/LandingStatsBar';
import { LandingHowItWorks } from './landing/LandingHowItWorks';
import { LandingRoleCards } from './landing/LandingRoleCards';
import { LandingAIFeatures } from './landing/LandingAIFeatures';
import { LandingFeaturedJobs } from './landing/LandingFeaturedJobs';
import { LandingTestimonials } from './landing/LandingTestimonials';
import { LandingCTAFooter } from './landing/LandingCTAFooter';

const LandingPage = ({ onGetStarted, onSignIn, onNavigate, currentPage }) => {
  const featuredJobs = JOBS.slice(0, 3);

  const steps = [
    { num: "01", icon: Icons.user, title: "Create Your Profile", desc: "Upload your resume or build one with our AI assistant — it takes under two minutes." },
    { num: "02", icon: Icons.spark, title: "AI Matching", desc: "Search jobs across multiple providers. Our AI scores every role against your skills, experience, and preferences." },
    { num: "03", icon: Icons.scout, title: "Get Career Guidance", desc: "Scout AI coaches you on interviews, resumes, salary negotiation, career transitions, and more." },
    { num: "04", icon: Icons.mic, title: "Practice & Get Hired", desc: "Run voice mock interviews with real-time feedback, then apply with confidence." },
  ];

  const roles = [
    {
      title: "Job Seekers", accent: "var(--coral)", icon: Icons.user,
      points: ["AI job matching across 5 providers", "Scout AI career counselor", "Voice mock interviews with feedback", "Resume builder & ATS optimization tips", "Salary negotiation coaching"],
    },
    {
      title: "Recruiters", accent: "var(--sage)", icon: Icons.users,
      points: ["Candidate pipeline management", "AI scoring & ranking", "Real-time chat with talent", "Hiring analytics dashboard"],
    },
    {
      title: "Companies", accent: "var(--lavender)", icon: Icons.building,
      points: ["Easy job posting", "Analytics dashboard", "Curated talent pool", "AI-matched candidates"],
    },
  ];

  const aiFeatures = [
    {
      icon: Icons.scout, accent: "var(--coral)", accentBg: "rgba(255,107,91,0.08)",
      title: "Scout AI — Career Counselor",
      desc: "A full-spectrum AI career advisor that covers job search, interview prep, resume optimization, salary negotiation, career transitions, networking, burnout recovery, leadership coaching, and industry insights.",
      tags: ["13 Career Domains", "Personalized Advice", "Skill Gap Analysis"],
    },
    {
      icon: Icons.mic, accent: "var(--sage)", accentBg: "rgba(126,184,158,0.08)",
      title: "Interview Bot — Voice Mock Interviews",
      desc: "Practice with AI-generated questions tailored to the job description and your resume. Answer by voice with Wispr AI transcription, get instant scores and feedback on every answer.",
      tags: ["Voice-Powered", "Wispr AI", "STAR Method Scoring"],
    },
    {
      icon: Icons.search, accent: "var(--lavender)", accentBg: "rgba(155,143,212,0.08)",
      title: "Multi-Provider Job Search",
      desc: "Search across JSearch, Jobs API, LinkedIn, Indeed, and multi-board aggregators simultaneously. Jobs are deduplicated, scored against your profile, and ranked by match strength.",
      tags: ["5 Job Sources", "AI Match Scoring", "Real-Time Results"],
    },
  ];

  const stats = [
    { value: "5", label: "Job sources searched at once" },
    { value: "13", label: "Career domains Scout AI covers" },
    { value: "Voice", label: "Mock interviews with instant feedback" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", overflow: "hidden" }}>
      <GlobalStyles />
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} currentPage={currentPage} />
      <LandingHero onGetStarted={onGetStarted} onNavigate={onNavigate} />
      <LandingStatsBar stats={stats} />
      <LandingHowItWorks steps={steps} />
      <LandingRoleCards roles={roles} />
      <LandingAIFeatures aiFeatures={aiFeatures} />
      <LandingFeaturedJobs featuredJobs={featuredJobs} onNavigate={onNavigate} />
      <LandingTestimonials />
      <LandingCTAFooter onGetStarted={onGetStarted} onNavigate={onNavigate} />
    </div>
  );
};

export default LandingPage;
