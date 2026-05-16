import { test, expect } from '@playwright/test';

// Live backend base — overridable so the suite can target a local backend.
const LIVE_BASE = process.env.VITE_API_URL ?? 'https://hireflow-api.vercel.app';
const BLOG_API = `${LIVE_BASE}/api/blog?page=1&per_page=5`;

// Proxy the app's relative /api calls to the live backend, so blog pages load
// real posts regardless of how the dev server received VITE_API_URL.
//
// Uses route.fetch() (bound to the browser context) instead of the test
// `request` fixture so the handler never touches a disposed APIRequestContext
// during Playwright teardown, preventing "Request context disposed" errors and
// hung worker processes.
async function proxyApiToLive(page) {
  await page.route('/api/**', async (route) => {
    const url = route
      .request()
      .url()
      .replace(/^https?:\/\/[^/]+\/api/, `${LIVE_BASE}/api`);
    const response = await route.fetch({ url });
    await route.fulfill({ response });
  });
}

// Unregister all route handlers before Playwright tears down the page/context.
// This prevents in-flight route callbacks from running against a closed browser
// context, which would cause "Target page, context or browser has been closed"
// errors and hang the worker process during teardown.
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test('blog list page renders the Pressroom hero', async ({ page }) => {
  // No proxy needed: the hero <h1> is static markup, independent of the API.
  await page.goto('/blog');
  await expect(
    page.getByRole('heading', { level: 1, name: /insights for your career journey/i }),
  ).toBeVisible();
});

test('blog list shows a post fetched from the backend', async ({ page, request }) => {
  const res = await request.get(BLOG_API);
  expect(res.ok(), `GET ${BLOG_API} failed with ${res.status()}`).toBeTruthy();
  const posts = await res.json();
  test.skip(posts.length === 0, 'no blog posts published');

  await proxyApiToLive(page);
  await page.goto('/blog');
  await expect(
    page.getByText(posts[0].title, { exact: false }).first(),
  ).toBeVisible({ timeout: 15000 });
});

test('a blog post page renders content from the backend', async ({ page, request }) => {
  const res = await request.get(BLOG_API);
  expect(res.ok(), `GET ${BLOG_API} failed with ${res.status()}`).toBeTruthy();
  const posts = await res.json();
  test.skip(posts.length === 0, 'no blog posts published');

  const post = posts[0];
  await proxyApiToLive(page);
  await page.goto(`/blog/${post.slug}`);
  await expect(
    page.getByRole('heading', { name: post.title }).first(),
  ).toBeVisible({ timeout: 15000 });
});
