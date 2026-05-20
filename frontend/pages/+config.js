import vikeReact from 'vike-react/config';

export default {
  extends: vikeReact,
  // Marketing pages prerender at build; per-page +config.js overrides this.
  prerender: true,
  // Enable Vike's universal-deploy server entry so the Vercel adapter
  // (vite-plugin-vercel) can emit the SSR catch-all serverless function.
  server: true,
  lang: 'en',
  title: 'Hyrly | The AI coach for laid-off tech engineers',
  description:
    'Hyrly is the AI career coach for engineers in their first 90 days post-layoff. Free Layoff Triage, deep playbook articles, and unlimited Scout AI coaching when you need it.',
};
