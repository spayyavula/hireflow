import vikeReact from 'vike-react/config';

export default {
  extends: vikeReact,
  // Marketing pages prerender at build; per-page +config.js overrides this.
  prerender: true,
  // Enable Vike's universal-deploy server entry so the Vercel adapter
  // (vite-plugin-vercel) can emit the SSR catch-all serverless function.
  server: true,
  lang: 'en',
  title: 'JobsSearch | Decision System For Job Search And Hiring',
  description:
    'JobsSearch is an AI decision system for job seekers, recruiters, and companies with match scoring, pivot paths, certification ROI, and interview guidance.',
};
