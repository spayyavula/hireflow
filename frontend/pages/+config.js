import vikeReact from 'vike-react/config';

export default {
  extends: vikeReact,
  // Marketing pages prerender at build; per-page +config.js overrides this.
  prerender: true,
  // Enable Vike's universal-deploy server entry so the Vercel adapter
  // (vite-plugin-vercel) can emit the SSR catch-all serverless function.
  server: true,
  // vike-react's default passToClient is just ['_configFromHook']. Dynamic
  // routes (e.g. /playbook/@slug) set `pageProps` via +onBeforeRender and
  // need it shipped to the client, otherwise hydration runs with
  // pageProps === undefined and falls into the not-found branch, blowing
  // away the SSR'd content.
  passToClient: ['pageProps'],
  lang: 'en',
  title: 'Hyrly | The AI coach for laid-off tech engineers',
  description:
    'Hyrly is the AI career coach for engineers in their first 90 days post-layoff. Free Layoff Triage, deep playbook articles, and unlimited Scout AI coaching when you need it.',
  // Absolute URL is required by OG validators. Per-page useConfig({image: ...})
  // and per-page +config.js image: overrides this without duplicating.
  // VITE_SITE_URL can't be read here — Vike strips import.meta.env from +config.js
  // execution context — so the production hostname is hardcoded.
  image: 'https://hyrly.ai/logo.png',
};
