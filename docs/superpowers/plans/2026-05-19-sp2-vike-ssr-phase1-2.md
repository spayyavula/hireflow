# SP2 Vike SSR — Phases 1 & 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt Vike so HireFlow's public pages are server-rendered (marketing as SSG, job-detail as on-request SSR with `JobPosting` JSON-LD), while the authenticated app stays a client-only SPA at `/app`.

**Architecture:** Vike + `vike-react` layer onto the existing Vite build. Filesystem routing under `frontend/pages/`. Marketing pages prerender at build (`prerender: true`); the job-detail page renders per-request from the live backend via a `+data` hook; the authenticated app is one `ssr: false` catch-all page at `/app` that reuses the current `App.jsx` unchanged in behavior. A pure, unit-tested `frontend/src/schema/` module builds JSON-LD.

**Tech Stack:** Vike 1.x, `vike-react`, Vite 5, React 18, Vitest, Playwright.

---

## Background & Decisions

- Spec: `docs/superpowers/specs/2026-05-16-sp2-ssr-seo-design.md`. This plan covers **Phase 1** (Vike skeleton + marketing SSG) and **Phase 2** (job-detail SSR + schema). Phases 3–6 (hub pages, OG images, sitemaps, Indexing API, cutover) are later plans.
- **Routing decision:** the authenticated app (auth screens, onboarding, dashboards, chat) mounts at `/app` as a single `ssr: false` Vike page. The current `frontend/src/App.jsx` is reused as that page's component; only its public-page `switch` is removed. Marketing "Get Started" / "Sign In" navigate to `/app`.
- **Reuse, don't rewrite:** marketing page components (`LandingPage`, `FeaturesPage`, …) are reused **as-is**. Thin Vike `+Page.jsx` wrappers supply the `onNavigate` / `onGetStarted` / `onSignIn` / `currentPage` props, backed by Vike's client-side `navigate()`. `PublicNav` already renders real `<a href>` elements, so crawlers see real links.
- **Blog stays client-only for now:** `/blog` and `/blog/{slug}` become `ssr: false` Vike pages (no behavior change) — SP3 converts them to SSR later. This keeps the site whole without 404s.
- **Regression net:** the SP0 Playwright suite (`frontend/e2e/`) must stay green after every task. The suite already targets `getByRole('link', …)` for nav, so it is Vike-compatible.
- All commands run from `frontend/` unless stated. The Bash working directory resets between turns — prefix with `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend &&`.

**`JobResponse` shape** (from `backend/api/models/schemas.py`, the Phase 2 data source):
`id` (`job_<hex>`), `company_id`, `company_name`, `title`, `location`, `salary_min`, `salary_max`, `salary_display`, `type` (`full-time`|`part-time`|`contract`|`internship`), `remote` (bool), `description`, `required_skills` (list), `nice_skills` (list), `experience_level`, `status` (`active`|`paused`|`closed`), `applicant_count`, `created_at` (ISO string).

---

# PHASE 1 — Vike skeleton + marketing pages as SSG

## Task 1: Install Vike and split the build/test configs

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.js`
- Create: `frontend/vitest.config.js`
- Create: `frontend/pages/+config.js`
- Create: `frontend/pages/+Head.jsx`
- Delete: `frontend/index.html`, `frontend/src/main.jsx`

- [ ] **Step 1: Install Vike**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm install vike vike-react`
Expected: `vike` and `vike-react` added to `dependencies`.

- [ ] **Step 2: Create `vitest.config.js`** (so Vitest keeps the React plugin without loading Vike)

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
```

- [ ] **Step 3: Replace `vite.config.js`** with the Vike build config (no `test` block — Vitest now uses `vitest.config.js`)

```js
import { defineConfig } from 'vite';
import vike from 'vike/plugin';

export default defineConfig({
  plugins: [vike()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
  },
});
```

> Note: `vike-react` brings its own React/JSX handling, so `@vitejs/plugin-react` is intentionally absent from `vite.config.js`. Vitest still needs it — that is why `vitest.config.js` keeps it.

- [ ] **Step 4: Create `frontend/pages/+config.js`** — global Vike config; SSG by default

```js
import vikeReact from 'vike-react/config';

export default {
  extends: vikeReact,
  // Marketing pages prerender at build; per-page +config.js overrides this.
  prerender: true,
  lang: 'en',
  title: 'JobsSearch | Decision System For Job Search And Hiring',
  description:
    'JobsSearch is an AI decision system for job seekers, recruiters, and companies with match scoring, pivot paths, certification ROI, and interview guidance.',
};
```

- [ ] **Step 5: Create `frontend/pages/+Head.jsx`** — site-wide `<head>` tags + Organization/WebSite JSON-LD (lifted from the old `index.html`)

```jsx
export default function HeadDefault() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://jobssearch.work/#organization',
        name: 'JobsSearch',
        url: 'https://jobssearch.work/',
        logo: 'https://jobssearch.work/favicon.svg',
        description: 'AI-powered decision system for job search and hiring.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://jobssearch.work/#website',
        url: 'https://jobssearch.work/',
        name: 'JobsSearch',
        publisher: { '@id': 'https://jobssearch.work/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://jobssearch.work/jobs?search={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
  return (
    <>
      <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      <meta name="theme-color" content="#faf8f5" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="JobsSearch" />
      <meta property="og:image" content="https://jobssearch.work/og-image.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
    </>
  );
}
```

- [ ] **Step 6: Delete the SPA entry files**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && git rm index.html src/main.jsx`
Expected: both removed. Vike now owns the HTML document and client entry.

- [ ] **Step 7: Update `package.json` scripts**

Replace the `scripts` block with:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:pr": "playwright test e2e/smoke.spec.js --grep \"homepage loads and shows the hero heading|a new seeker reaches the onboarding choice screen\" e2e/onboarding.spec.js"
  },
```

> `vite build` now does the prerender — Vike replaces `prerender.mjs`. Those scripts are deleted in Task 4.

- [ ] **Step 8: Commit** (the app does not build yet — pages are added next; commit the skeleton)

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/vitest.config.js frontend/pages/
git commit -m "$(cat <<'EOF'
build: add Vike skeleton and split Vite/Vitest configs (SP2 phase 1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Mount the authenticated app at `/app`

**Files:**
- Create: `frontend/pages/app/+Page.jsx`
- Create: `frontend/pages/app/+config.js`
- Create: `frontend/pages/app/+route.js`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/pages/app/+config.js`** — client-only, never prerendered

```js
export default {
  ssr: false,
  prerender: false,
  title: 'JobsSearch',
};
```

- [ ] **Step 2: Create `frontend/pages/app/+route.js`** — catch-all so `/app` and any sub-path resolve here

```js
// Matches /app and everything under it; the SPA does its own internal routing.
export default (pageContext) => pageContext.urlPathname.startsWith('/app');
```

- [ ] **Step 3: Create `frontend/pages/app/+Page.jsx`**

```jsx
import App from '../../src/App';

export default function AppPage() {
  return <App />;
}
```

- [ ] **Step 4: Strip the public-page switch from `App.jsx`**

In `frontend/src/App.jsx`, the logged-out branch currently renders marketing pages by `currentPage`. Those routes are now Vike pages. Replace the entire `if (!user) { ... }` block (the `switch (currentPage)` over `features`/`pricing`/`about`/`roadmap`/`terms`/`privacy`/`help`/`coming-soon`/`blog` and the `default` job/blog/landing cases) with:

```jsx
  // /app is the authenticated SPA. A logged-out visitor sees the auth screen.
  if (!user) {
    return <AuthScreen onAuth={handleAuth} onBack={() => { window.location.href = '/'; }} initialMode={authMode} />;
  }
```

Then remove the now-unused imports from the top of `App.jsx`: `LandingPage`, `FeaturesPage`, `PricingPage`, `AboutPage`, `IdeasBoard`, `BlogListPage`, `BlogPostPage`, `JobDetailPage`, `StaticContentPage`, `ComingSoonPage`, `PublicNav`, and `getPageFromPath` / `getPathFromPage` from `./lib/routing` if no longer referenced.

- [ ] **Step 5: Preset auth mode from the URL**

In `App.jsx`, the `authMode` state currently defaults to a constant. Replace its initializer so `/app?mode=register` opens the register form:

```jsx
  const [authMode, setAuthMode] = useState(() => {
    if (typeof window === 'undefined') return 'login';
    return new URLSearchParams(window.location.search).get('mode') === 'register'
      ? 'register'
      : 'login';
  });
```

- [ ] **Step 6: Verify the dev server boots and `/app` renders**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run build`
Expected: build succeeds (Vike compiles `/app`). A warning that no other pages exist yet is acceptable.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/pages/app frontend/src/App.jsx
git commit -m "$(cat <<'EOF'
feat: mount authenticated SPA at /app as an ssr:false Vike page

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Migrate marketing pages to Vike SSG

**Files:**
- Create: `frontend/pages/index/+Page.jsx` + `+config.js` (and 8 more page directories — see table)
- Create: `frontend/src/lib/vikeNav.js`

- [ ] **Step 1: Create `frontend/src/lib/vikeNav.js`** — shared nav-prop builder used by every marketing wrapper

```js
import { navigate } from 'vike/client/router';
import { getPathFromPage } from './routing';

// Marketing page components expect onNavigate/onGetStarted/onSignIn/currentPage.
// This adapts those callbacks onto Vike's client-side router.
export function marketingNavProps(currentPage) {
  return {
    currentPage,
    onNavigate: (page) => navigate(getPathFromPage(page)),
    onGetStarted: () => navigate('/app?mode=register'),
    onSignIn: () => navigate('/app?mode=login'),
  };
}
```

- [ ] **Step 2: Create the home page** `frontend/pages/index/+Page.jsx`

```jsx
import LandingPage from '../../src/pages/marketing/LandingPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function HomePage() {
  return <LandingPage {...marketingNavProps('home')} />;
}
```

And `frontend/pages/index/+config.js`:

```js
export default {
  title: 'JobsSearch | Decision System For Job Search And Hiring',
  description:
    'JobsSearch is an AI decision system for job seekers, recruiters, and companies with match scoring, pivot paths, certification ROI, and interview guidance.',
};
```

- [ ] **Step 3: Create the remaining 8 marketing pages** using the same two-file pattern.

For each row below, create `frontend/pages/<dir>/+Page.jsx` and `frontend/pages/<dir>/+config.js`. The `+Page.jsx` imports the component and renders it with `marketingNavProps('<currentPage>')`; the `+config.js` sets `title` and `description`.

| dir | route | component (import path) | currentPage | title | description |
|---|---|---|---|---|---|
| `features` | `/features` | `../../src/pages/marketing/FeaturesPage` | `features` | `Features \| JobsSearch` | `Explore AI match scoring, interview coaching, recruiter pipelines, analytics, and collaboration tools built for calmer hiring decisions.` |
| `pricing` | `/pricing` | `../../src/pages/marketing/PricingPage` | `pricing` | `Pricing \| JobsSearch` | `Simple pricing for seekers, recruiters, and companies. Start free and scale your hiring workflow with AI decision support.` |
| `about` | `/about` | `../../src/pages/marketing/AboutPage` | `about` | `About \| JobsSearch` | `Learn why JobsSearch exists: replacing noisy hiring dashboards with a decision-first system that helps teams and candidates move forward.` |
| `roadmap` | `/roadmap` | `../../src/pages/marketing/IdeasBoard` | `roadmap` | `Roadmap \| JobsSearch` | `See upcoming JobsSearch features, submit ideas, and vote on what should be built next.` |
| `coming-soon` | `/coming-soon` | `../../src/pages/static/ComingSoonPage` | `coming-soon` | `Coming Soon \| JobsSearch` | `This JobsSearch page is on the way. Explore current features and check the roadmap while we finish it.` |

`IdeasBoard` additionally needs a `user` prop — pass `user={null}`:

```jsx
import IdeasBoard from '../../src/pages/marketing/IdeasBoard';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function RoadmapPage() {
  return <IdeasBoard {...marketingNavProps('roadmap')} user={null} />;
}
```

The three `StaticContentPage` routes (`/terms`, `/privacy`, `/help`) pass `title`/`subtitle`/`sections` props. Copy the exact `title`, `subtitle`, and `sections` arrays from `App.jsx`'s removed `terms`/`privacy`/`help` switch cases. Example — `frontend/pages/terms/+Page.jsx`:

```jsx
import StaticContentPage from '../../src/pages/static/StaticContentPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function TermsPage() {
  return (
    <StaticContentPage
      {...marketingNavProps('terms')}
      title="Terms"
      subtitle="Clear expectations for using JobsSearch responsibly."
      sections={[
        { heading: 'Using the platform', body: 'Use JobsSearch for legitimate hiring and job search activity only. Keep profile details accurate, and do not submit misleading credentials, fake job postings, or automated spam applications.' },
        { heading: 'Accounts and access', body: 'You are responsible for securing your account and any activity under it. If you suspect unauthorized access, contact support immediately and rotate credentials.' },
        { heading: 'Service limits', body: 'Features may evolve during beta. We may rate-limit abusive traffic or suspend accounts violating fair-use, security, or legal standards.' },
      ]}
    />
  );
}
```

`frontend/pages/terms/+config.js`:

```js
export default {
  title: 'Terms | JobsSearch',
  description: 'Terms for using JobsSearch, including account responsibilities, acceptable use, and service limitations.',
};
```

`frontend/pages/privacy/+Page.jsx`:

```jsx
import StaticContentPage from '../../src/pages/static/StaticContentPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function PrivacyPage() {
  return (
    <StaticContentPage
      {...marketingNavProps('privacy')}
      title="Privacy"
      subtitle="How we handle personal and hiring data."
      sections={[
        { heading: 'Data we collect', body: 'We collect profile, resume, job preferences, and product interaction data to power matching, coaching, and hiring workflows.' },
        { heading: 'How data is used', body: 'Data is used to personalize recommendations, improve platform quality, and support customer operations. We do not sell personal data.' },
        { heading: 'Security controls', body: 'JobsSearch uses row-level access controls, encrypted transport, and least-privilege service access to reduce data exposure risk.' },
      ]}
    />
  );
}
```

`frontend/pages/privacy/+config.js`:

```js
export default {
  title: 'Privacy | JobsSearch',
  description: 'How JobsSearch collects, uses, and protects your personal and hiring data.',
};
```

`frontend/pages/help/+Page.jsx`:

```jsx
import StaticContentPage from '../../src/pages/static/StaticContentPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function HelpPage() {
  return (
    <StaticContentPage
      {...marketingNavProps('help')}
      title="Help"
      subtitle="Support resources for seekers, recruiters, and companies."
      sections={[
        { heading: 'Getting started', body: 'Create an account, complete your profile, and select goals so the matching engine and Scout AI can personalize recommendations.' },
        { heading: 'Billing and plans', body: 'Plan changes are available from your account settings. Upgrades apply immediately, while downgrades apply at the next billing cycle.' },
        { heading: 'Need direct support?', body: 'Use in-app chat for account assistance and workflow help. Include screenshots and page URLs when reporting issues for faster resolution.' },
      ]}
    />
  );
}
```

`frontend/pages/help/+config.js`:

```js
export default {
  title: 'Help | JobsSearch',
  description: 'Get support for your account, subscriptions, interviews, and hiring workflows on JobsSearch.',
};
```

- [ ] **Step 4: Create the blog pages as `ssr: false` (unchanged behavior; SP3 makes them SSR)**

`frontend/pages/blog/+Page.jsx`:

```jsx
import BlogListPage from '../../src/pages/blog/BlogListPage';
import { marketingNavProps } from '../../src/lib/vikeNav';

export default function BlogPage() {
  return <BlogListPage {...marketingNavProps('blog')} />;
}
```

`frontend/pages/blog/+config.js`:

```js
export default {
  ssr: false,
  prerender: false,
  title: 'Blog | JobsSearch',
  description: 'Hiring strategy, job search guidance, interview prep, and career decision insights from the JobsSearch team.',
};
```

`frontend/pages/blog/@slug/+Page.jsx`:

```jsx
import { usePageContext } from 'vike-react/usePageContext';
import BlogPostPage from '../../../src/pages/blog/BlogPostPage';
import { marketingNavProps } from '../../../src/lib/vikeNav';

export default function BlogSlugPage() {
  const { routeParams } = usePageContext();
  return <BlogPostPage slug={routeParams.slug} {...marketingNavProps('blog')} />;
}
```

`frontend/pages/blog/@slug/+config.js`:

```js
export default { ssr: false, prerender: false };
```

- [ ] **Step 5: Build and verify all routes compile**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run build`
Expected: build succeeds; output lists prerendered marketing routes (`/`, `/features`, `/pricing`, `/about`, `/roadmap`, `/terms`, `/privacy`, `/help`, `/coming-soon`).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/pages frontend/src/lib/vikeNav.js
git commit -m "$(cat <<'EOF'
feat: migrate marketing pages to Vike SSG routes (SP2 phase 1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Remove the legacy prerender pipeline and verify the e2e suite

**Files:**
- Delete: `frontend/scripts/prerender.mjs`, `frontend/scripts/generate-sitemap.mjs`, `frontend/scripts/lib.mjs`
- Modify: `frontend/public/robots.txt` (if it references the old sitemap path — leave the file otherwise)

- [ ] **Step 1: Delete the legacy build scripts**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && git rm scripts/prerender.mjs scripts/generate-sitemap.mjs scripts/lib.mjs`
Expected: three files removed. (`package.json` no longer references them — done in Task 1.)

> The build-time `frontend/public/sitemap.xml` stays for now; live sitemap routes are SP2 Phase 4.

- [ ] **Step 2: Run the SP0 e2e suite against the Vike build**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run test:e2e -- e2e/smoke.spec.js e2e/marketing.spec.js`
Expected: all marketing + smoke tests pass. The suite uses `getByRole('link')` / `getByRole('heading')`, which Vike preserves.

- [ ] **Step 3: If any marketing/smoke test fails**, the cause is almost always a nav selector. Fix the test selector (not the app) only when the rendered DOM genuinely changed; otherwise fix the wrapper. Re-run Step 2 until green. Run the auth + onboarding specs too:

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run test:e2e -- e2e/auth.spec.js e2e/onboarding.spec.js`
Expected: pass — these exercise `/app` (the auth/onboarding flow). If they navigate via `/` expecting the old SPA, update them to start at `/app`.

- [ ] **Step 4: Run the Vitest unit suite**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test`
Expected: existing component tests pass under `vitest.config.js`.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add -A frontend/scripts frontend/e2e
git commit -m "$(cat <<'EOF'
build: remove legacy prerender scripts; verify e2e under Vike (SP2 phase 1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# PHASE 2 — Job-detail SSR + structured data

## Task 5: Structured-data module

**Files:**
- Create: `frontend/src/schema/jsonld.js`
- Test: `frontend/src/schema/jsonld.test.js`

- [ ] **Step 1: Write the failing tests** — `frontend/src/schema/jsonld.test.js`

```js
import { describe, it, expect } from 'vitest';
import { jobPosting, organization, website, breadcrumbList, employmentType, validThrough } from './jsonld';

const SAMPLE = {
  id: 'job_abc123def456',
  title: 'Senior React Developer',
  company_name: 'TechVault',
  location: 'San Francisco, CA',
  description: 'Lead frontend architecture.',
  type: 'full-time',
  remote: true,
  salary_min: 160000,
  salary_max: 200000,
  created_at: '2026-03-01T00:00:00Z',
  required_skills: ['React'],
  nice_skills: ['Next.js'],
  status: 'active',
};

describe('employmentType', () => {
  it('maps backend job types to schema.org enums', () => {
    expect(employmentType('full-time')).toBe('FULL_TIME');
    expect(employmentType('part-time')).toBe('PART_TIME');
    expect(employmentType('contract')).toBe('CONTRACTOR');
    expect(employmentType('internship')).toBe('INTERN');
  });
  it('falls back to FULL_TIME for unknown types', () => {
    expect(employmentType('weird')).toBe('FULL_TIME');
  });
});

describe('validThrough', () => {
  it('derives created_at + 60 days as an ISO string', () => {
    expect(validThrough('2026-03-01T00:00:00Z')).toBe('2026-04-30T00:00:00.000Z');
  });
});

describe('jobPosting', () => {
  it('builds a JobPosting with required fields', () => {
    const ld = jobPosting(SAMPLE);
    expect(ld['@type']).toBe('JobPosting');
    expect(ld.title).toBe('Senior React Developer');
    expect(ld.datePosted).toBe('2026-03-01T00:00:00Z');
    expect(ld.validThrough).toBe('2026-04-30T00:00:00.000Z');
    expect(ld.employmentType).toBe('FULL_TIME');
    expect(ld.hiringOrganization).toEqual({ '@type': 'Organization', name: 'TechVault' });
    expect(ld.jobLocationType).toBe('TELECOMMUTE');
    expect(ld.directApply).toBe(true);
    expect(ld.baseSalary.value.minValue).toBe(160000);
    expect(ld.baseSalary.value.maxValue).toBe(200000);
  });
  it('omits baseSalary when both bounds are absent', () => {
    const ld = jobPosting({ ...SAMPLE, salary_min: null, salary_max: null });
    expect(ld.baseSalary).toBeUndefined();
  });
  it('omits jobLocationType when not remote', () => {
    const ld = jobPosting({ ...SAMPLE, remote: false });
    expect(ld.jobLocationType).toBeUndefined();
  });
});

describe('organization / website', () => {
  it('organization has a stable @id', () => {
    expect(organization()['@id']).toBe('https://jobssearch.work/#organization');
  });
  it('website includes a SearchAction', () => {
    expect(website().potentialAction['@type']).toBe('SearchAction');
  });
});

describe('breadcrumbList', () => {
  it('numbers positions from 1', () => {
    const ld = breadcrumbList([
      { name: 'Home', url: 'https://jobssearch.work/' },
      { name: 'Jobs', url: 'https://jobssearch.work/jobs' },
    ]);
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
    expect(ld.itemListElement[1].item).toBe('https://jobssearch.work/jobs');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- src/schema/jsonld.test.js`
Expected: FAIL — `Cannot find module './jsonld'`.

- [ ] **Step 3: Implement `frontend/src/schema/jsonld.js`**

```js
const SITE = 'https://jobssearch.work';
const DEFAULT_COUNTRY = 'US';
const DEFAULT_CURRENCY = 'USD';

const EMPLOYMENT_TYPES = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
};

export function employmentType(type) {
  return EMPLOYMENT_TYPES[type] || 'FULL_TIME';
}

export function validThrough(createdAt) {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 60);
  return d.toISOString();
}

export function organization() {
  return {
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: 'JobsSearch',
    url: `${SITE}/`,
    logo: `${SITE}/favicon.svg`,
    description: 'AI-powered decision system for job search and hiring.',
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    url: `${SITE}/`,
    name: 'JobsSearch',
    publisher: { '@id': `${SITE}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE}/jobs?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbList(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function jobPosting(job) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || '',
    datePosted: job.created_at,
    validThrough: validThrough(job.created_at),
    employmentType: employmentType(job.type),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company_name || 'a hiring company',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Remote',
        addressCountry: DEFAULT_COUNTRY,
      },
    },
    directApply: true,
  };
  if (job.remote) {
    ld.jobLocationType = 'TELECOMMUTE';
  }
  if (job.salary_min != null || job.salary_max != null) {
    ld.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: DEFAULT_CURRENCY,
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salary_min ?? job.salary_max,
        maxValue: job.salary_max ?? job.salary_min,
        unitText: 'YEAR',
      },
    };
  }
  return ld;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- src/schema/jsonld.test.js`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/src/schema
git commit -m "$(cat <<'EOF'
feat: add JSON-LD structured-data builders (SP2 phase 2)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Job-detail SSR page

**Files:**
- Create: `frontend/src/lib/jobUrl.js`
- Test: `frontend/src/lib/jobUrl.test.js`
- Create: `frontend/pages/jobs/@jobPath/+route.js`, `+config.js`, `+data.js`, `+Page.jsx`, `+Head.jsx`, `+title.js`

- [ ] **Step 1: Write the failing test** for the URL helper — `frontend/src/lib/jobUrl.test.js`

```js
import { describe, it, expect } from 'vitest';
import { jobUrlPath, jobIdFromPath } from './jobUrl';

describe('jobUrlPath', () => {
  it('builds a slugged path ending in the job id', () => {
    expect(jobUrlPath({ id: 'job_abc123', title: 'Senior React Developer' }))
      .toBe('/jobs/senior-react-developer-job_abc123');
  });
});

describe('jobIdFromPath', () => {
  it('extracts the trailing job id from a slugged path segment', () => {
    expect(jobIdFromPath('senior-react-developer-job_abc123')).toBe('job_abc123');
  });
  it('returns null when no job id is present', () => {
    expect(jobIdFromPath('remote')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- src/lib/jobUrl.test.js`
Expected: FAIL — `Cannot find module './jobUrl'`.

- [ ] **Step 3: Implement `frontend/src/lib/jobUrl.js`**

```js
import { toSlug } from './slug';

// Backend job ids look like job_<hex>. A job URL is /jobs/<title-slug>-<id>.
const JOB_ID_RE = /(job_[a-z0-9]+)$/i;

export function jobUrlPath(job) {
  return `/jobs/${toSlug(job.title)}-${job.id}`;
}

export function jobIdFromPath(jobPath) {
  const match = String(jobPath).match(JOB_ID_RE);
  return match ? match[1] : null;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test -- src/lib/jobUrl.test.js`
Expected: PASS.

- [ ] **Step 5: Create the job page route** `frontend/pages/jobs/@jobPath/+route.js`

```js
// Single-segment match: /jobs/<title-slug>-<id>. Hub routes (/jobs/<skill>) are SP2 phase 3.
export default '/jobs/@jobPath';
```

- [ ] **Step 6: Create `frontend/pages/jobs/@jobPath/+config.js`** — SSR on request, never prerendered

```js
export default {
  ssr: true,
  prerender: false,
};
```

- [ ] **Step 7: Create `frontend/pages/jobs/@jobPath/+data.js`** — server-side fetch from the live backend

```js
import { jobIdFromPath } from '../../../src/lib/jobUrl';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Runs on the server during SSR. Returns { job } or { job: null } for not-found.
export async function data(pageContext) {
  const jobId = jobIdFromPath(pageContext.routeParams.jobPath);
  if (!jobId) return { job: null };

  try {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
    if (!res.ok) return { job: null };
    return { job: await res.json() };
  } catch {
    // Backend unavailable at render time — degrade gracefully, never 500.
    return { job: null, unavailable: true };
  }
}
```

- [ ] **Step 8: Create `frontend/pages/jobs/@jobPath/+title.js`** — dynamic `<title>`

```js
export default (pageContext) => {
  const job = pageContext.data?.job;
  return job
    ? `${job.title} at ${job.company_name} | JobsSearch`
    : 'Job not found | JobsSearch';
};
```

- [ ] **Step 9: Create `frontend/pages/jobs/@jobPath/+Head.jsx`** — per-page meta + `JobPosting` / `BreadcrumbList` JSON-LD

```jsx
import { usePageContext } from 'vike-react/usePageContext';
import { jobPosting, breadcrumbList } from '../../../src/schema/jsonld';
import { jobUrlPath } from '../../../src/lib/jobUrl';

export default function Head() {
  const { data } = usePageContext();
  const job = data?.job;
  if (!job) {
    return <meta name="robots" content="noindex,follow" />;
  }
  const canonical = `https://jobssearch.work${jobUrlPath(job)}`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      jobPosting(job),
      breadcrumbList([
        { name: 'Home', url: 'https://jobssearch.work/' },
        { name: 'Jobs', url: 'https://jobssearch.work/jobs' },
        { name: job.title, url: canonical },
      ]),
    ],
  };
  return (
    <>
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={`${job.title} at ${job.company_name}`} />
      <meta property="og:url" content={canonical} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
```

- [ ] **Step 10: Create `frontend/pages/jobs/@jobPath/+Page.jsx`** — renders real backend data; closed jobs render a "role closed" state (HTTP 200, never 404)

```jsx
import { usePageContext } from 'vike-react/usePageContext';
import GlobalStyles from '../../../src/styles/GlobalStyles';
import PublicNav from '../../../src/components/PublicNav';
import Tag from '../../../src/components/ui/Tag';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { marketingNavProps } from '../../../src/lib/vikeNav';

export default function JobPage() {
  const { data } = usePageContext();
  const job = data?.job;
  const nav = marketingNavProps('home');

  if (!job) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        <GlobalStyles />
        <PublicNav {...nav} />
        <section style={{ maxWidth: 940, margin: '0 auto', padding: '64px 48px 80px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36 }}>This role is no longer available</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {data?.unavailable
              ? 'We could not load this role right now. Please try again shortly.'
              : 'The role you are looking for has closed or moved.'}
          </p>
          <Button variant="coral" size="lg" onClick={() => nav.onNavigate('home')}>Browse open roles</Button>
        </section>
      </div>
    );
  }

  const isClosed = job.status !== 'active';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <GlobalStyles />
      <PublicNav {...nav} />
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '64px 48px 80px' }}>
        <article style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 30 }}>
          {isClosed && (
            <div style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', fontWeight: 700 }}>
              This role has closed — explore similar open roles below.
            </div>
          )}
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, lineHeight: 1.1, color: 'var(--ink)', marginBottom: 8 }}>{job.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, marginBottom: 22 }}>{job.company_name} · {job.location}</p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.75, marginBottom: 22 }}>{job.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
            <Card style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Salary</div>
              <div style={{ fontWeight: 700 }}>{job.salary_display || 'Not disclosed'}</div>
            </Card>
            <Card style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Work type</div>
              <div style={{ fontWeight: 700 }}>{job.remote ? 'Remote-friendly' : 'On-site'}</div>
            </Card>
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 10, color: 'var(--ink)' }}>Required skills</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
            {(job.required_skills || []).map((s) => <Tag key={s} variant="coral" size="lg">{s}</Tag>)}
          </div>

          {!isClosed && (
            <Button variant="coral" size="lg" onClick={nav.onGetStarted}>Create free account to apply</Button>
          )}
        </article>
      </section>
    </div>
  );
}
```

- [ ] **Step 11: Build and verify the job route compiles**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run build`
Expected: build succeeds; the job route is listed as a non-prerendered (SSR) route.

- [ ] **Step 12: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/pages/jobs frontend/src/lib/jobUrl.js frontend/src/lib/jobUrl.test.js
git commit -m "$(cat <<'EOF'
feat: server-render job-detail pages from the live backend (SP2 phase 2)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: SSR assertion e2e tests + final verification

**Files:**
- Create: `frontend/e2e/ssr.spec.js`

- [ ] **Step 1: Write the SSR assertion tests** — `frontend/e2e/ssr.spec.js`

```js
import { test, expect } from '@playwright/test';

// Fetch raw HTML with NO JavaScript execution — this is what crawlers see.
test('homepage HTML contains real body content without JS', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toMatch(/<h1[^>]*>/i);
  expect(html.toLowerCase()).toContain('jobssearch');
});

test('homepage HTML embeds Organization and WebSite JSON-LD', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('"@type":"Organization"');
  expect(html).toContain('"@type":"WebSite"');
});

test('a job page server-renders body content and a JobPosting blob', async ({ request, baseURL }) => {
  // Discover a real active job id from the backend the dev server is wired to.
  const apiBase = process.env.VITE_API_URL ?? 'https://hireflow-api.vercel.app';
  const jobs = await (await request.get(`${apiBase}/api/jobs?limit=1`)).json();
  test.skip(!Array.isArray(jobs) || jobs.length === 0, 'no active jobs available to assert against');

  const job = jobs[0];
  const slugPath = `/jobs/${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${job.id}`;
  const res = await request.get(slugPath);
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain(job.title);
  expect(html).toContain('"@type":"JobPosting"');
  expect(html).toContain('"directApply":true');
});
```

- [ ] **Step 2: Run the SSR spec**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run test:e2e -- e2e/ssr.spec.js`
Expected: PASS. The homepage assertions must pass; the job-page test skips only if the backend returns no active jobs.

> If the homepage test fails because the dev server (`vite`) does not SSR on raw `request.get()`, run against the production build instead: `npm run build` then `npm run preview` and re-point Playwright's `webServer.command` — note this in the commit and raise it for review.

- [ ] **Step 3: Run the full e2e suite**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm run test:e2e`
Expected: every spec passes (smoke, marketing, blog, auth, onboarding, ssr).

- [ ] **Step 4: Run the Vitest suite**

Run: `cd /c/Users/sreek/myprojects/jobshunter/hireflow/frontend && npm test`
Expected: all unit/component tests pass, including `src/schema/jsonld.test.js` and `src/lib/jobUrl.test.js`.

- [ ] **Step 5: Manual gate** — after deploy, run a sample job URL and the homepage through Google's Rich Results Test; confirm `JobPosting`, `Organization`, and `WebSite` validate. (Recorded here as a required pre-cutover check; not automatable.)

- [ ] **Step 6: Commit**

```bash
cd /c/Users/sreek/myprojects/jobshunter/hireflow
git add frontend/e2e/ssr.spec.js
git commit -m "$(cat <<'EOF'
test: add SSR HTML assertion suite for marketing and job pages (SP2 phase 2)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes (gaps deliberately deferred)

Covered from the spec: Vike skeleton + `vike-react`, marketing SSG, three render modes (SSG marketing / SSR job / SPA `/app`), `JobPosting`+`Organization`+`WebSite`+`BreadcrumbList` schema, expired-job 200 handling, `noindex` on missing jobs, SSR resilience (`+data` try/catch), SSR assertion tests, schema unit tests.

**Deferred to later SP2 phases (not in this plan):** hub pages + `hub_content` backend table + `/api/seo/hub/{slug}` (Phase 3); `@vercel/og` images (Phase 4); live sitemap routes + `robots.txt`/`llms.txt` updates (Phase 4); Google Indexing API notifier (Phase 5); production cutover (Phase 6). Blog SSR is SP3 — blog pages ship here as `ssr:false` placeholders.

**Verify after Phase 1, before Phase 2:** confirm `vike-react`'s exact filenames for the current installed version — this plan assumes `+config.js`, `+Page.jsx`, `+data.js`, `+route.js`, `+Head.jsx`, `+title.js`, and `usePageContext` from `vike-react/usePageContext`. If the installed version differs, adjust filenames and re-run each task's build step.
