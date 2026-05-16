# SP0 — Testing Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a unit/component test framework (Vitest) and a Playwright e2e suite covering the app's core user flows, to serve as the regression net for the upcoming Vike migration.

**Architecture:** Vitest runs under the existing Vite config (`environment: jsdom`). Playwright drives a real browser against the Vite dev server, which is started with `VITE_API_URL` pointed at the live backend. Marketing pages need no backend; the blog suite hits the real read-only `/api/blog`; auth/onboarding suites mock the API via Playwright route interception. The app already syncs `currentPage` from `window.location.pathname` (`getPageFromPath`), so e2e tests navigate by URL with `page.goto()`.

**Tech Stack:** Vitest, @testing-library/react, jsdom, @testing-library/jest-dom, @playwright/test, GitHub Actions.

All paths below are relative to the repo root. The frontend lives in `frontend/`.

---

## Task 1: Vitest unit/component framework

**Files:**
- Modify: `frontend/package.json` (scripts)
- Modify: `frontend/vite.config.js`
- Create: `frontend/src/test/setup.js`
- Create: `frontend/src/test/smoke.test.jsx`

- [ ] **Step 1: Install dev dependencies**

Run (from `frontend/`):
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```
Expected: packages added to `devDependencies`, `package-lock.json` updated, no errors.

- [ ] **Step 2: Add test scripts to `package.json`**

In `frontend/package.json`, replace the `"scripts"` block with:
```json
  "scripts": {
    "dev": "vite",
    "build": "vite build && node scripts/prerender.mjs && node scripts/generate-sitemap.mjs",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
```

- [ ] **Step 3: Add the `test` config to `frontend/vite.config.js`**

Replace the entire file with:
```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
```
Note: the import changes from `'vite'` to `'vitest/config'` so the `test` key is typed. The `exclude` keeps Vitest from picking up the Playwright specs in `e2e/`.

- [ ] **Step 4: Create the test setup file**

Create `frontend/src/test/setup.js`:
```js
// Registers jest-dom matchers (toBeInTheDocument, toBeVisible, ...) for Vitest.
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Create a smoke test**

Create `frontend/src/test/smoke.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('test framework smoke check', () => {
  it('renders a component and queries it by role', () => {
    render(<button type="button">Click me</button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the unit tests**

Run (from `frontend/`):
```bash
npm test
```
Expected: `Test Files  1 passed (1)` and `Tests  1 passed (1)`.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/src/test/
git commit -m "Add Vitest unit/component test framework"
```

---

## Task 2: Playwright e2e framework + homepage smoke test

**Files:**
- Modify: `frontend/package.json` (already has `test:e2e` from Task 1)
- Create: `frontend/playwright.config.js`
- Create: `frontend/e2e/smoke.spec.js`
- Modify: `frontend/.gitignore`

- [ ] **Step 1: Install Playwright**

Run (from `frontend/`):
```bash
npm install -D @playwright/test
npx playwright install chromium
```
Expected: `@playwright/test` in `devDependencies`; the Chromium browser downloads.

- [ ] **Step 2: Create the Playwright config**

Create `frontend/playwright.config.js`:
```js
import { defineConfig, devices } from '@playwright/test';

// The frontend and backend deploy separately. Point the dev server's app at the
// live backend so blog tests exercise the real read-only API. Auth/onboarding
// tests mock the API via route interception regardless of this URL.
const BACKEND_URL = 'https://hireflow-api.vercel.app';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_API_URL: BACKEND_URL },
  },
});
```

- [ ] **Step 3: Ignore Playwright artifacts**

Append to `frontend/.gitignore`:
```
test-results/
playwright-report/
playwright/.cache/
```

- [ ] **Step 4: Create the homepage smoke e2e test**

Create `frontend/e2e/smoke.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('homepage loads and shows the hero heading', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: /career partner/i }),
  ).toBeVisible();
});
```

- [ ] **Step 5: Run the e2e suite**

Run (from `frontend/`):
```bash
npm run test:e2e
```
Expected: Playwright starts the dev server and reports `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/playwright.config.js frontend/e2e/ frontend/.gitignore
git commit -m "Add Playwright e2e framework with homepage smoke test"
```

---

## Task 3: Marketing pages e2e suite

**Files:**
- Create: `frontend/e2e/marketing.spec.js`

- [ ] **Step 1: Write the marketing e2e tests**

Create `frontend/e2e/marketing.spec.js`:
```js
import { test, expect } from '@playwright/test';

// Each public page resolves from its URL (App() seeds currentPage via
// getPageFromPath) and renders a distinct <h1>.
const pages = [
  { path: '/',         heading: /career partner/i },
  { path: '/features', heading: /everything you need to hire and get hired/i },
  { path: '/pricing',  heading: /the right plan for every team/i },
  { path: '/about',    heading: /been on both sides of the table/i },
  { path: '/roadmap',  heading: /ideas board/i },
];

for (const { path, heading } of pages) {
  test(`${path} renders its hero heading`, async ({ page }) => {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { level: 1, name: heading }),
    ).toBeVisible();
  });
}

test('top-nav links navigate between marketing pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Features' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: /everything you need to hire/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Pricing' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: /the right plan for every team/i }),
  ).toBeVisible();
});

test('footer exposes Terms, Privacy and Help links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Help' })).toBeVisible();
});
```

- [ ] **Step 2: Run the marketing suite**

Run (from `frontend/`):
```bash
npx playwright test marketing
```
Expected: all tests pass (5 page tests + nav test + footer test = 7 passed).

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/marketing.spec.js
git commit -m "Add marketing pages e2e suite"
```

---

## Task 4: Blog e2e suite (real read-only backend)

**Files:**
- Create: `frontend/e2e/blog.spec.js`

- [ ] **Step 1: Write the blog e2e tests**

Create `frontend/e2e/blog.spec.js`. These tests discover real posts via the
backend API (so no slug/title is hard-coded) and verify the UI renders them.
The `request` fixture and the app share the same live backend.

```js
import { test, expect } from '@playwright/test';

const BLOG_API = 'https://hireflow-api.vercel.app/api/blog?page=1&per_page=5';

test('blog list page renders the Pressroom hero', async ({ page }) => {
  await page.goto('/blog');
  await expect(
    page.getByRole('heading', { level: 1, name: /insights for your career journey/i }),
  ).toBeVisible();
});

test('blog list shows a post fetched from the backend', async ({ page, request }) => {
  const res = await request.get(BLOG_API);
  expect(res.ok()).toBeTruthy();
  const posts = await res.json();
  test.skip(posts.length === 0, 'no blog posts published');

  await page.goto('/blog');
  await expect(page.getByText(posts[0].title, { exact: false }).first()).toBeVisible();
});

test('a blog post page renders content from the backend', async ({ page, request }) => {
  const res = await request.get(BLOG_API);
  expect(res.ok()).toBeTruthy();
  const posts = await res.json();
  test.skip(posts.length === 0, 'no blog posts published');

  const post = posts[0];
  await page.goto(`/blog/${post.slug}`);
  await expect(
    page.getByRole('heading', { name: post.title }).first(),
  ).toBeVisible();
});
```

- [ ] **Step 2: Run the blog suite**

Run (from `frontend/`):
```bash
npx playwright test blog
```
Expected: `3 passed`. If the backend is unavailable the data-driven tests
`skip` rather than fail; the hero test still passes.

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/blog.spec.js
git commit -m "Add blog e2e suite against the live backend"
```

---

## Task 5: Auth e2e suite + reusable API-mocking helper

**Files:**
- Create: `frontend/e2e/helpers/mockApi.js`
- Create: `frontend/e2e/auth.spec.js`

- [ ] **Step 1: Create the API-mocking helper**

Create `frontend/e2e/helpers/mockApi.js`. The backend returns
`{ access_token, user }` from the auth endpoints (see `src/api.js`).

```js
// Reusable Playwright API mocks for deterministic auth/onboarding e2e tests.

// Mock successful register + login. The app stores `access_token` and uses
// `user` (see api.register / api.login in src/api.js).
export async function mockAuthSuccess(page, { role = 'seeker', name = 'Test User', email = 'test@example.com' } = {}) {
  const body = JSON.stringify({
    access_token: 'e2e-test-token',
    user: { id: 'user_e2e', email, role, name },
  });
  await page.route('**/api/auth/register', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body }),
  );
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body }),
  );
}

// Mock rejected auth. api._fetch throws Error(detail) on a non-ok response;
// AuthScreen renders that message.
export async function mockAuthFailure(page, message = 'Invalid email or password') {
  const fulfill = (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: message }),
    });
  await page.route('**/api/auth/register', fulfill);
  await page.route('**/api/auth/login', fulfill);
}

// Mock a seeker with no completed profile -> handleAuth routes to seeker-choice.
export async function mockEmptySeekerProfile(page) {
  await page.route('**/api/seeker/profile', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ skills: [] }),
    }),
  );
}
```

- [ ] **Step 2: Write the auth e2e tests**

Create `frontend/e2e/auth.spec.js`. The AuthScreen overlay opens from the
public-nav "Get Started" (register) / "Sign In" (login) buttons. Inputs have
no `<label for>`, so they are selected by placeholder.

```js
import { test, expect } from '@playwright/test';
import { mockAuthSuccess, mockAuthFailure } from './helpers/mockApi.js';

test('Get Started opens the registration form', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
});

test('Sign In opens the login form', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('a recruiter can register and leaves the auth screen', async ({ page }) => {
  await mockAuthSuccess(page, { role: 'recruiter' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByPlaceholder('Jane Smith').fill('Riya Recruiter');
  await page.getByPlaceholder('you@example.com').fill('riya@example.com');
  await page.getByPlaceholder('••••••••').fill('password123');
  await page.getByRole('button', { name: 'Recruiter' }).click();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeHidden();
});

test('login shows an error when the backend rejects credentials', async ({ page }) => {
  await mockAuthFailure(page, 'Invalid email or password');
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByPlaceholder('you@example.com').fill('wrong@example.com');
  await page.getByPlaceholder('••••••••').fill('badpassword');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid email or password')).toBeVisible();
});
```
Note: in register mode the `<h1>` and the submit `<button>` both read
"Create account" — they are distinguished by ARIA role (`heading` vs `button`).

- [ ] **Step 3: Run the auth suite**

Run (from `frontend/`):
```bash
npx playwright test auth
```
Expected: `4 passed`.

- [ ] **Step 4: Commit**

```bash
git add frontend/e2e/helpers/ frontend/e2e/auth.spec.js
git commit -m "Add auth e2e suite with reusable API mocking helper"
```

---

## Task 6: Seeker onboarding e2e suite

**Files:**
- Create: `frontend/e2e/onboarding.spec.js`

- [ ] **Step 1: Write the onboarding e2e tests**

Create `frontend/e2e/onboarding.spec.js`. After a seeker registers,
`handleAuth` calls `api.getProfile()`; an empty profile routes to the
`SeekerChoice` screen, whose two `Card`s open the upload / build flows.

```js
import { test, expect } from '@playwright/test';
import { mockAuthSuccess, mockEmptySeekerProfile } from './helpers/mockApi.js';

// Register as a new seeker and land on the onboarding choice screen.
async function registerAsNewSeeker(page) {
  await mockAuthSuccess(page, { role: 'seeker' });
  await mockEmptySeekerProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByPlaceholder('Jane Smith').fill('Sam Seeker');
  await page.getByPlaceholder('you@example.com').fill('sam@example.com');
  await page.getByPlaceholder('••••••••').fill('password123');
  await page.getByRole('button', { name: 'Job Seeker' }).click();
  await page.getByRole('button', { name: 'Create account' }).click();
}

test('a new seeker reaches the onboarding choice screen', async ({ page }) => {
  await registerAsNewSeeker(page);
  await expect(
    page.getByRole('heading', { name: /how would you like to start/i }),
  ).toBeVisible();
});

test('seeker can open the resume-upload path', async ({ page }) => {
  await registerAsNewSeeker(page);
  await page.getByText('Upload Resume').click();
  await expect(
    page.getByRole('heading', { level: 1, name: /upload your resume/i }),
  ).toBeVisible();
});

test('seeker can open the build-from-scratch path', async ({ page }) => {
  await registerAsNewSeeker(page);
  await page.getByText('Build from Scratch').click();
  await expect(
    page.getByRole('heading', { name: /let's build your profile/i }),
  ).toBeVisible();
});
```

- [ ] **Step 2: Run the onboarding suite**

Run (from `frontend/`):
```bash
npx playwright test onboarding
```
Expected: `3 passed`.

- [ ] **Step 3: Run the full e2e suite to confirm nothing regressed**

Run (from `frontend/`):
```bash
npm run test:e2e
```
Expected: all specs pass (smoke + marketing + blog + auth + onboarding).

- [ ] **Step 4: Commit**

```bash
git add frontend/e2e/onboarding.spec.js
git commit -m "Add seeker onboarding e2e suite"
```

---

## Task 7: CI workflow

**Files:**
- Create: `.github/workflows/test.yml`

- [ ] **Step 1: Create the CI workflow**

Create `.github/workflows/test.yml` (repo root, alongside the existing
`keep-warm.yml`):
```yaml
name: Tests

on:
  push:
  pull_request:

jobs:
  unit:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm test

  e2e:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

- [ ] **Step 2: Verify the workflow file is valid**

Run (from repo root):
```bash
node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/test.yml','utf8');if(!s.includes('jobs:'))process.exit(1);console.log('workflow file present')"
```
Expected: `workflow file present`.

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/test.yml
git commit -m "Add CI workflow running unit and e2e tests"
git push origin main
```
Expected: GitHub Actions runs the `unit` and `e2e` jobs on the push; both go green in the repo's Actions tab.

---

## Notes for the implementer

- **Run order:** Tasks must be done in order (1 → 7). Task 1 establishes the npm scripts the later tasks rely on.
- **The dev server is shared:** Playwright's `webServer` auto-starts `npm run dev`. Locally it reuses a running server; in CI it starts its own.
- **Blog tests depend on the live backend.** They `test.skip` (not fail) when the backend returns no data, so a paused database won't break CI — but the keep-warm cron should keep it up.
- **This suite is the SP1 regression net.** Run `npm run test:e2e` before and after every SP1 phase.
- **The suite will evolve:** when SP2 introduces Vike routing, revisit the `page.goto()` paths and nav-button selectors (nav `<button>`s may become `<a>` links).
